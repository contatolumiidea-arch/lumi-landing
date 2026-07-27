const { getDb } = require('../_lib/db');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, source } = req.body || {};

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Email inválido.' });
  }

  const db = getDb();

  const { error } = await db.from('lumi_waitlist').upsert(
    {
      name:       name?.trim()   || null,
      email:      email.trim().toLowerCase(),
      source:     source         || 'lumi_flow_waitlist',
      created_at: new Date().toISOString(),
    },
    { onConflict: 'email,source', ignoreDuplicates: true }
  );

  if (error) {
    console.error('[WAITLIST] erro ao salvar:', error.message);
    return res.status(500).json({ error: 'Erro ao salvar. Tente novamente.' });
  }

  return res.status(200).json({ ok: true });
};
