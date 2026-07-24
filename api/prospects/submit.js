const { getDb } = require('../_lib/db');

const VALID_ORIGINS = ['leadmagnet', 'newsletter', 'contact_form', 'other'];

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, phone, country, origin, metadata } = req.body || {};

  if (!email) {
    return res.status(400).json({ error: 'Email é obrigatório.' });
  }

  if (!origin || !VALID_ORIGINS.includes(origin)) {
    return res.status(400).json({ error: 'Origem inválida.' });
  }

  const db = getDb();

  const { error } = await db.from('lumi_prospects').insert({
    name:     name    || null,
    email:    email.toLowerCase().trim(),
    phone:    phone   || null,
    country:  country || null,
    origin,
    status:   'new',
    metadata: metadata || null,
  });

  if (error) {
    // Email duplicado não é um erro fatal para o usuário
    if (error.code === '23505') {
      return res.status(200).json({ ok: true });
    }
    console.error('[Prospect submit]', error);
    return res.status(500).json({ error: 'Erro ao salvar contato.' });
  }

  return res.status(200).json({ ok: true });
};
