const bcrypt = require('bcryptjs');
const { getDb } = require('../_lib/db');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { token, password } = req.body || {};

  if (!token) return res.status(400).json({ error: 'Token inválido.' });
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'A senha deve ter no mínimo 8 caracteres.' });
  }

  const db = getDb();
  const { data: user } = await db
    .from('lumi_admin_users')
    .select('id, reset_token, reset_token_expiry, is_active')
    .eq('reset_token', token)
    .single();

  if (!user || !user.is_active) {
    return res.status(400).json({ error: 'Link inválido ou expirado.' });
  }

  if (!user.reset_token_expiry || new Date(user.reset_token_expiry) < new Date()) {
    return res.status(400).json({ error: 'Este link expirou. Solicite um novo.' });
  }

  const password_hash = await bcrypt.hash(password, 12);

  await db.from('lumi_admin_users').update({
    password_hash,
    reset_token:        null,
    reset_token_expiry: null,
  }).eq('id', user.id);

  return res.status(200).json({ ok: true });
};
