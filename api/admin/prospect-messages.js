const { requireAdmin } = require('../_lib/auth');
const { getDb } = require('../_lib/db');

module.exports = requireAdmin(async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { prospectId } = req.query;
  if (!prospectId) return res.status(400).json({ error: 'prospectId obrigatório.' });

  const db = getDb();
  const { data, error } = await db
    .from('prospect_messages')
    .select('id, sender_type, message, created_at')
    .eq('prospect_id', prospectId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[prospect-messages GET]', error);
    return res.status(500).json({ error: 'Erro ao buscar histórico.' });
  }

  return res.status(200).json({ messages: data || [] });
});
