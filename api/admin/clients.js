const { requireAdmin } = require('../_lib/auth');
const { getDb } = require('../_lib/db');

module.exports = requireAdmin(async function handler(req, res) {
  const db = getDb();

  // GET /api/admin/clients — lista todos os clientes
  if (req.method === 'GET') {
    const { status, search, page = 1, limit = 25 } = req.query;

    let query = db
      .from('lumi_clients')
      .select(`
        id, full_name, email, phone, business_name, country,
        client_status, purchased_at, onboarding_completed_at, created_at,
        lumi_subscriptions ( plan_type, status ),
        landing_pages ( id, status, published_url )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status) query = query.eq('client_status', status);
    if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,business_name.ilike.%${search}%`);

    const { data, count, error } = await query;

    if (error) {
      console.error('[Admin clients GET]', error);
      return res.status(500).json({ error: 'Erro ao buscar clientes.' });
    }

    return res.status(200).json({ clients: data, total: count, page: Number(page), limit: Number(limit) });
  }

  return res.status(405).end();
});
