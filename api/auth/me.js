const { requireAdmin } = require('../_lib/auth');

module.exports = requireAdmin(async function handler(req, res) {
  return res.status(200).json({ admin: req.admin });
});
