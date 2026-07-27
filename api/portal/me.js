const { requirePortal } = require('../_lib/portal-auth');

module.exports = requirePortal(async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const { id, client_id, name, email } = req.portalUser;
  return res.status(200).json({ id, client_id, name, email });
});
