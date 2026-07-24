const { requireAdmin } = require('../_lib/auth');
const { getDb } = require('../_lib/db');

module.exports = requireAdmin(async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const db = getDb();
  const { client_id, origin, status, page = 1, limit = 50 } = req.query;

  let query = db
    .from('realtor_leads')
    .select(`
      id, lead_name, lead_email, lead_phone, origin, message, status, created_at,
      lumi_clients ( id, full_name, email, business_name )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (client_id) query = query.eq('client_id', client_id);
  if (origin)    query = query.eq('origin', origin);
  if (status)    query = query.eq('status', status);

  const { data, count, error } = await query;

  if (error) {
    console.error('[Admin leads GET]', error);
    return res.status(500).json({ error: 'Erro ao buscar leads.' });
  }

  return res.status(200).json({ leads: data, total: count, page: Number(page), limit: Number(limit) });
});
