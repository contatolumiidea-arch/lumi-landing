const { requireAdmin } = require('../_lib/auth');
const { getDb } = require('../_lib/db');

const VALID_STATUSES = ['new', 'pending_onboarding', 'in_production', 'review', 'published', 'canceled'];

module.exports = requireAdmin(async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'ID do cliente é obrigatório.' });

  const db = getDb();

  // GET /api/admin/client?id=xxx — detalhes completos
  if (req.method === 'GET') {
    const [clientRes, onboardingRes, leadsRes] = await Promise.all([
      db.from('lumi_clients')
        .select(`*, lumi_subscriptions(*), landing_pages(*)`)
        .eq('id', id)
        .single(),
      db.from('lumi_onboarding').select('*').eq('client_id', id).single(),
      db.from('realtor_leads').select('*').eq('client_id', id).order('created_at', { ascending: false }).limit(50),
    ]);

    if (!clientRes.data) return res.status(404).json({ error: 'Cliente não encontrado.' });

    return res.status(200).json({
      client: clientRes.data,
      onboarding: onboardingRes.data || null,
      leads: leadsRes.data || [],
    });
  }

  // PATCH /api/admin/client?id=xxx — atualizar campos
  if (req.method === 'PATCH') {
    const { client_status, notes, landing_page_url } = req.body || {};

    if (client_status && !VALID_STATUSES.includes(client_status)) {
      return res.status(400).json({ error: 'Status inválido.' });
    }

    const update = {};
    if (client_status    !== undefined) update.client_status = client_status;
    if (notes            !== undefined) update.notes         = notes;

    if (Object.keys(update).length > 0) {
      const { error } = await db.from('lumi_clients').update(update).eq('id', id);
      if (error) return res.status(500).json({ error: 'Erro ao atualizar cliente.' });
    }

    if (landing_page_url !== undefined) {
      await db.from('landing_pages')
        .update({ published_url: landing_page_url, status: 'published', published_at: new Date().toISOString() })
        .eq('client_id', id);
    }

    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
});
