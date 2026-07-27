const { getDb } = require('../_lib/db');

// Campos permitidos por step (whitelist)
const STEP_FIELDS = {
  1: 'step1_business',
  2: 'step2_template',
  3: 'step3_brand',
  4: 'step4_languages',
  5: 'step5_details',
  6: 'step6_services',
  7: 'step7_leadgen',
  8: 'step8_ebook',
  9: 'step9_crm',
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // [DIAG] — remove após investigação
  console.log('[ONBOARDING SAVE] body recebido:', JSON.stringify(req.body || {}, null, 2));

  const { client_id, step, data, social_links, testimonials, properties, onboarding_data } = req.body || {};

  const db = getDb();

  let resolvedClientId = client_id;

  // Sem client_id (sem Stripe ainda): find-or-create em lumi_clients por email
  if (!resolvedClientId) {
    const name  = onboarding_data?.fullName  || onboarding_data?.businessName || 'Sem nome';
    const email = onboarding_data?.email     || null;
    const phone = onboarding_data?.phone     || null;

    console.log('[ONBOARDING SAVE] sem client_id — find-or-create:', { name, email });

    // Se temos e-mail, tenta encontrar registro existente primeiro
    if (email) {
      const { data: existing } = await db
        .from('lumi_clients')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existing) {
        resolvedClientId = existing.id;
        console.log('[ONBOARDING SAVE] cliente existente reutilizado:', resolvedClientId);
      }
    }

    // Ainda sem id: cria novo registro
    if (!resolvedClientId) {
      const { data: newClient, error: insertErr } = await db
        .from('lumi_clients')
        .insert({
          full_name:     name,
          email,
          phone,
          client_status: 'pending_onboarding',
        })
        .select('id')
        .single();

      if (insertErr || !newClient) {
        console.error('[ONBOARDING SAVE ERROR] insert em lumi_clients falhou:', {
          message: insertErr?.message,
          code:    insertErr?.code,
          details: insertErr?.details,
          hint:    insertErr?.hint,
        });
        return res.status(500).json({
          error:   'Erro ao registrar cliente.',
          detail:  insertErr?.message || null,
          code:    insertErr?.code    || null,
        });
      }

      resolvedClientId = newClient.id;
      console.log('[ONBOARDING SAVE] novo cliente criado:', resolvedClientId);
    }
  } else {
    // Verificar se o cliente existe
    const { data: client } = await db
      .from('lumi_clients')
      .select('id')
      .eq('id', resolvedClientId)
      .single();

    if (!client) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }
  }

  const update = { updated_at: new Date().toISOString() };

  if (step && STEP_FIELDS[step] && data !== undefined) {
    update[STEP_FIELDS[step]] = data;
    update.current_step = Math.max(step, 1);
  }

  if (social_links    !== undefined) update.social_links  = social_links;
  if (testimonials    !== undefined) update.testimonials  = testimonials;
  if (properties      !== undefined) update.properties    = properties;
  if (onboarding_data !== undefined) update.step1_business = onboarding_data;

  // Marcar como concluído no envio final
  update.status       = 'completed';
  update.completed_at = new Date().toISOString();

  await db
    .from('lumi_clients')
    .update({
      client_status:           'onboarding_received',
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq('id', resolvedClientId);

  // [DIAG] — remove após investigação
  console.log('[ONBOARDING SAVE] tabela destino: lumi_onboarding | client_id:', resolvedClientId, '| payload keys:', Object.keys(update));

  const { error } = await db
    .from('lumi_onboarding')
    .upsert({ client_id: resolvedClientId, ...update }, { onConflict: 'client_id' });

  // [DIAG] — remove após investigação
  if (error) {
    console.error('[ONBOARDING SAVE] erro Supabase:', JSON.stringify({ message: error.message, code: error.code, details: error.details, hint: error.hint }));
    return res.status(500).json({ error: 'Erro ao salvar dados.' });
  }
  console.log('[ONBOARDING SAVE] upsert ok | client_id:', resolvedClientId);

  return res.status(200).json({ ok: true, client_id: resolvedClientId });
};
