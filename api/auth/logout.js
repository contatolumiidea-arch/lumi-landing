const { getClearCookieHeader } = require('../_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  res.setHeader('Set-Cookie', getClearCookieHeader());
  return res.status(200).json({ ok: true });
};
