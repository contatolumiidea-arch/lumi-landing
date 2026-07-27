const { clearPortalCookieHeader } = require('../_lib/portal-auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  res.setHeader('Set-Cookie', clearPortalCookieHeader());
  return res.status(200).json({ ok: true });
};
