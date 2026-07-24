const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getDb } = require('../_lib/db');

// Vercel não faz parse automático do body para webhooks — precisamos do raw body
export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  const rawBody = await getRawBody(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[Stripe webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: 'Webhook signature invalid.' });
  }

  const db = getDb();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    const email = session.customer_details?.email || session.customer_email;
    const name  = session.customer_details?.name  || 'Corretor';

    // Cria o cliente se não existir (idempotente via upsert por email)
    const { data: client, error: clientError } = await db
      .from('lumi_clients')
      .upsert({
        email,
        full_name: name,
        stripe_customer_id: session.customer,
        client_status: 'pending_onboarding',
        purchased_at: new Date().toISOString(),
      }, { onConflict: 'email', ignoreDuplicates: false })
      .select('id')
      .single();

    if (clientError) {
      console.error('[Stripe webhook] Error creating client:', clientError);
      return res.status(500).json({ error: 'Failed to create client.' });
    }

    // Cria a assinatura
    const planType = session.mode === 'subscription'
      ? (session.amount_total >= 40000 ? 'annual' : 'monthly')
      : 'monthly';

    await db.from('lumi_subscriptions').insert({
      client_id: client.id,
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription || null,
      plan_type: planType,
      status: 'active',
      current_period_start: new Date().toISOString(),
    });

    // Cria registro inicial de onboarding
    await db.from('lumi_onboarding').upsert({
      client_id: client.id,
      status: 'in_progress',
      current_step: 1,
    }, { onConflict: 'client_id', ignoreDuplicates: true });

    console.log(`[LUMI] Novo cliente criado: ${email}`);
  }

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    await db
      .from('lumi_subscriptions')
      .update({ status: sub.status, updated_at: new Date().toISOString() })
      .eq('stripe_subscription_id', sub.id);
  }

  return res.status(200).json({ received: true });
};
