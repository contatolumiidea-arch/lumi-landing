const { requirePortal } = require('../_lib/portal-auth');
const { getDb } = require('../_lib/db');

module.exports = requirePortal(async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  // client_id SEMPRE vem do token — nunca da query
  const { client_id } = req.portalUser;
  const { page = 1, limit = 50 } = req.query;
  const pageNum  = Math.max(1, parseInt(page)  || 1);
  const limitNum = Math.min(100, parseInt(limit) || 50);

  const db = getDb();
  const { data, count, error } = await db
    .from('realtor_leads')
    .select('id, lead_name, lead_email, lead_phone, origin, message, created_at', { count: 'exact' })
    .eq('client_id', client_id)
    .order('created_at', { ascending: false })
    .range((pageNum - 1) * limitNum, pageNum * limitNum - 1);

  if (error) {
    console.error('[Portal leads]', error);
    return res.status(500).json({ error: 'Erro ao buscar leads.' });
  }

  return res.status(200).json({ leads: data || [], total: count || 0, page: pageNum, limit: limitNum });
});
