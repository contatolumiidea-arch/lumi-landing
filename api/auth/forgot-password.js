const { getDb } = require('../_lib/db');
const { Resend } = require('resend');
const crypto = require('crypto');

const FROM_EMAIL  = 'LUMI IDEA <onboarding@resend.dev>';
const TOKEN_TTL_H = 2; // token expira em 2 horas

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email obrigatório.' });

  const db = getDb();
  const { data: user } = await db
    .from('lumi_admin_users')
    .select('id, name, email, is_active')
    .eq('email', email.toLowerCase().trim())
    .single();

  // Resposta genérica — não revelar se o email existe ou não
  const generic = res.status(200).json({ ok: true });

  if (!user || !user.is_active) return generic;

  const token  = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + TOKEN_TTL_H * 60 * 60 * 1000).toISOString();

  await db.from('lumi_admin_users').update({
    reset_token:        token,
    reset_token_expiry: expiry,
  }).eq('id', user.id);

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[forgot-password] RESEND_API_KEY não configurada.');
    return generic;
  }

  const baseUrl  = process.env.SITE_URL || 'https://lumiidea.com';
  const resetUrl = `${baseUrl}/admin/reset-password.html?token=${token}`;

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: FROM_EMAIL,
    to:   user.email,
    subject: 'Redefinição de senha — LUMI IDEA Admin',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#0e0e0e;color:#f0f0f0;border-radius:12px;border:1px solid rgba(212,175,55,.3)">
        <h2 style="color:#D4AF37;margin:0 0 20px;font-size:1.1rem">Redefinição de senha</h2>
        <p style="color:#ccc;margin:0 0 16px">Olá${user.name ? ', ' + user.name : ''},</p>
        <p style="line-height:1.7;margin:0 0 24px">Recebemos uma solicitação para redefinir a senha do Painel Administrativo LUMI IDEA. Clique no botão abaixo para criar uma nova senha.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#D4AF37;color:#000;font-weight:700;font-size:.95rem;padding:12px 28px;border-radius:6px;text-decoration:none;margin-bottom:24px">Redefinir senha</a>
        <p style="color:#888;font-size:.82rem;line-height:1.6;margin:0">Este link é válido por ${TOKEN_TTL_H} horas. Se você não solicitou a redefinição, ignore este email — sua senha permanece a mesma.</p>
        <hr style="border:none;border-top:1px solid rgba(212,175,55,.15);margin:24px 0">
        <p style="color:#666;font-size:.8rem;margin:0">Equipe LUMI IDEA</p>
      </div>
    `,
  }).catch(err => console.error('[forgot-password] Resend error:', err.message));

  return generic;
};
