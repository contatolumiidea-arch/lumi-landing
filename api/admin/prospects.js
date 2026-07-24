const { requireAdmin } = require('../_lib/auth');
const { getDb } = require('../_lib/db');

module.exports = requireAdmin(async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const db = getDb();
  const { origin, status, search, page = 1, limit = 50 } = req.query;

  let query = db
    .from('lumi_prospects')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (origin) query = query.eq('origin', origin);
  if (status) query = query.eq('status', status);
  if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);

  const { data, count, error } = await query;

  if (error) {
    console.error('[Admin prospects GET]', error);
    return res.status(500).json({ error: 'Erro ao buscar prospects.' });
  }

  return res.status(200).json({ prospects: data, total: count, page: Number(page), limit: Number(limit) });
});
