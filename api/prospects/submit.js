const { getDb } = require('../_lib/db');
const { Resend } = require('resend');

const VALID_ORIGINS = ['leadmagnet', 'newsletter', 'contact_form', 'other'];

const NOTIFY_EMAIL = 'contato.lumiidea@gmail.com';

async function sendNotification({ name, email, message, createdAt }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[Prospect notify] RESEND_API_KEY não configurada — email ignorado.');
    return;
  }

  const resend = new Resend(apiKey);
  const dateStr = new Date(createdAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  await resend.emails.send({
    from: 'LUMI Landing <onboarding@resend.dev>',
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

  const { error } = await db.from('lumi_prospects').insert({
    name:     name    || null,
    email:    email.toLowerCase().trim(),
    phone:    phone   || null,
    country:  country || null,
    origin,
    status:   'new',
    metadata: metadata || null,
  });

  if (error) {
    if (error.code === '23505') {
      return res.status(200).json({ ok: true });
    }
    console.error('[Prospect submit]', error);
    return res.status(500).json({ error: 'Erro ao salvar contato.' });
  }

  // Notificação por email — falha silenciosa para não impedir o fluxo
  if (origin === 'contact_form') {
    sendNotification({
      name,
      email: email.toLowerCase().trim(),
      message: metadata?.message || null,
      createdAt,
    }).catch(err => console.error('[Prospect notify]', err.message));
  }

  return res.status(200).json({ ok: true });
};
