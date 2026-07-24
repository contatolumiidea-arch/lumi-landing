const bcrypt = require('bcryptjs');
const { getDb } = require('../_lib/db');
const { signToken, getCookieHeader } = require('../_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }

  const db = getDb();
  const { data: user, error } = await db
    .from('lumi_admin_users')
    .select('id, email, name, role, password_hash, is_active')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (error || !user || !user.is_active) {
    return res.status(401).json({ error: 'Credenciais inválidas.' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Credenciais inválidas.' });
  }

  await db
    .from('lumi_admin_users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', user.id);

  const token = signToken({ id: user.id, email: user.email, name: user.name, role: user.role });

  res.setHeader('Set-Cookie', getCookieHeader(token));
  return res.status(200).json({ ok: true, user: { name: user.name, role: user.role } });
};
