const { requireAdmin } = require('../_lib/auth');
const { getDb } = require('../_lib/db');

module.exports = requireAdmin(async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const db = getDb();

  const [
    { count: totalClients },
    { count: activeSubscriptions },
    { count: pendingOnboarding },
    { count: totalLeads },
    { count: leadsToday },
    { count: totalProspects },
    { count: prospectsThisWeek },
  ] = await Promise.all([
    db.from('lumi_clients').select('*', { count: 'exact', head: true }),
    db.from('lumi_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('lumi_clients').select('*', { count: 'exact', head: true }).eq('client_status', 'pending_onboarding'),
    db.from('realtor_leads').select('*', { count: 'exact', head: true }),
    db.from('realtor_leads').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 86400000).toISOString()),
    db.from('lumi_prospects').select('*', { count: 'exact', head: true }),
    db.from('lumi_prospects').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
  ]);

  // Últimos 5 clientes
  const { data: recentClients } = await db
    .from('lumi_clients')
    .select('id, full_name, email, client_status, purchased_at')
    .order('created_at', { ascending: false })
    .limit(5);

  // Últimos 5 leads
  const { data: recentLeads } = await db
    .from('realtor_leads')
    .select('id, lead_name, lead_email, origin, created_at, client_id')
    .order('created_at', { ascending: false })
    .limit(5);

  return res.status(200).json({
    stats: {
      totalClients,
      activeSubscriptions,
      pendingOnboarding,
      totalLeads,
      leadsToday,
      totalProspects,
      prospectsThisWeek,
    },
    recentClients,
    recentLeads,
  });
});
