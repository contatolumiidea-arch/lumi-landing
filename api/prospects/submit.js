const { getDb } = require('../_lib/db');
const { Resend } = require('resend');

const VALID_ORIGINS = ['leadmagnet', 'newsletter', 'contact_form', 'other'];

const NOTIFY_EMAIL = 'contato.lumiidea@gmail.com';
const FROM_EMAIL   = 'LUMI IDEA <onboarding@resend.dev>';

async function sendNotification({ name, email, message, createdAt }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[Prospect notify] RESEND_API_KEY não configurada — email ignorado.');
    return;
  }

  const resend = new Resend(apiKey);
  const dateStr = new Date(createdAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  await resend.emails.send({
    from: FROM_EMAIL,
    to:   NOTIFY_EMAIL,
    subject: 'Novo interessado na LUMI Landing',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#0e0e0e;color:#f0f0f0;border-radius:12px;border:1px solid rgba(212,175,55,.3)">
        <h2 style="color:#D4AF37;margin:0 0 24px;font-size:1.2rem">Novo interessado na LUMI Landing</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;color:#999;width:120px">Nome</td><td style="padding:8px 0;color:#fff">${name || '—'}</td></tr>
          <tr><td style="padding:8px 0;color:#999">Email</td><td style="padding:8px 0"><a href="mailto:${email}" style="color:#D4AF37">${email}</a></td></tr>
          <tr><td style="padding:8px 0;color:#999;vertical-align:top">Mensagem</td><td style="padding:8px 0;color:#fff">${message || '—'}</td></tr>
          <tr><td style="padding:8px 0;color:#999">Data</td><td style="padding:8px 0;color:#fff">${dateStr}</td></tr>
        </table>
      </div>
    `,
  });
}

async function sendAutoReply({ name, email }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  const firstName = name ? name.split(' ')[0] : null;

  await resend.emails.send({
    from: FROM_EMAIL,
    to:   email,
    subject: 'Recebemos seu contato — LUMI IDEA',
    html: `
      <div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:32px 24px;background:#0e0e0e;color:#f0f0f0;border-radius:12px;border:1px solid rgba(212,175,55,.3)">
        <p style="color:#ccc;margin:0 0 20px">Olá${firstName ? ', ' + firstName : ''},</p>
        <p style="line-height:1.7;margin:0 0 16px">Recebemos sua solicitação de contato com a <strong style="color:#D4AF37">LUMI IDEA</strong>.</p>
        <p style="line-height:1.7;margin:0 0 16px">Nossa equipe recebeu sua mensagem e entraremos em contato em breve.</p>
        <p style="line-height:1.7;margin:0 0 28px">Obrigado pelo interesse.</p>
        <hr style="border:none;border-top:1px solid rgba(212,175,55,.2);margin:24px 0">
        <p style="color:#999;font-size:.85rem;margin:0">Equipe LUMI IDEA<br>
          <a href="https://lumiidea.com" style="color:#D4AF37">lumiidea.com</a>
        </p>
      </div>
    `,
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, phone, country, origin, metadata } = req.body || {};

  if (!email) {
    return res.status(400).json({ error: 'Email é obrigatório.' });
  }

  if (!origin || !VALID_ORIGINS.includes(origin)) {
    return res.status(400).json({ error: 'Origem inválida.' });
  }

  const db = getDb();
  const createdAt = new Date().toISOString();

  const { data: inserted, error } = await db.from('lumi_prospects').insert({
    name:     name    || null,
    email:    email.toLowerCase().trim(),
    phone:    phone   || null,
    country:  country || null,
    origin,
    status:   'new',
    metadata: metadata || null,
  }).select('id').single();

  if (error) {
    if (error.code === '23505') {
      return res.status(200).json({ ok: true });
    }
    console.error('[Prospect submit]', error);
    return res.status(500).json({ error: 'Erro ao salvar contato.' });
  }

  // Salvar mensagem inicial no histórico (somente contact_form com mensagem)
  if (origin === 'contact_form' && metadata?.message && inserted?.id) {
    db.from('prospect_messages').insert({
      prospect_id: inserted.id,
      sender_type: 'cliente',
      message:     metadata.message.trim(),
    }).then().catch(err => console.error('[Prospect msg save]', err.message));
  }

  // Notificação + auto-resposta — falha silenciosa para não impedir o fluxo
  if (origin === 'contact_form') {
    const cleanEmail = email.toLowerCase().trim();
    sendNotification({
      name,
      email: cleanEmail,
      message: metadata?.message || null,
      createdAt,
    }).catch(err => console.error('[Prospect notify]', err.message));

    sendAutoReply({ name, email: cleanEmail })
      .catch(err => console.error('[Prospect auto-reply]', err.message));
  }

  return res.status(200).json({ ok: true });
};
