const bcrypt = require('bcryptjs');
const { getDb } = require('../_lib/db');
const { signPortalToken, getPortalCookieHeader } = require('../_lib/portal-auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }

  const db = getDb();
  const { data: user, error } = await db
    .from('lumi_portal_users')
    .select('id, client_id, name, email, password_hash, is_active')
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
    .from('lumi_portal_users')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', user.id);

  const token = signPortalToken({
    id:        user.id,
    client_id: user.client_id,
    name:      user.name,
    email:     user.email,
  });

  res.setHeader('Set-Cookie', getPortalCookieHeader(token));
  return res.status(200).json({ ok: true, user: { name: user.name } });
};
