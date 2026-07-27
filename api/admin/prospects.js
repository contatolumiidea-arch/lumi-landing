const { requireAdmin } = require('../_lib/auth');
const { getDb } = require('../_lib/db');

const VALID_STATUSES = ['new', 'contacted', 'potential', 'closed', 'archived', 'converted'];

module.exports = requireAdmin(async function handler(req, res) {
  const db = getDb();

  // GET /admin/prospects?id=... — detalhes de um prospect
  if (req.method === 'GET' && req.query.id) {
    const { data, error } = await db
      .from('lumi_prospects')
      .select('*')
      .eq('id', req.query.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Prospect não encontrado.' });
    return res.status(200).json({ prospect: data });
  }

  // GET /admin/prospects — listagem com filtros
  if (req.method === 'GET') {
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
  }

  // PATCH /admin/prospects — atualizar status
  if (req.method === 'PATCH') {
    const { id, status } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id obrigatório.' });
    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Status inválido.' });
    }

    const { data, error } = await db
      .from('lumi_prospects')
      .update({ status })
      .eq('id', id)
      .select('id, status')
      .single();

    if (error) {
      console.error('[Admin prospects PATCH]', error);
      return res.status(500).json({ error: 'Erro ao atualizar status.' });
    }
    return res.status(200).json({ prospect: data });
  }

  return res.status(405).end();
});
