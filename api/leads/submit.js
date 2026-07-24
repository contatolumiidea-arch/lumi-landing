const { getDb } = require('../_lib/db');

const VALID_ORIGINS = ['buyer_guide', 'seller_guide', 'contact_form', 'whatsapp', 'sms', 'email', 'other'];

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { client_id, landing_page_id, name, email, phone, origin, message } = req.body || {};

  if (!origin || !VALID_ORIGINS.includes(origin)) {
    return res.status(400).json({ error: 'Origem inválida.' });
  }

  if (!name && !email && !phone) {
    return res.status(400).json({ error: 'Pelo menos um campo de contato é obrigatório.' });
  }

  const db = getDb();

  const { error } = await db.from('realtor_leads').insert({
    client_id:       client_id || null,
    landing_page_id: landing_page_id || null,
    lead_name:       name   || null,
    lead_email:      email  || null,
    lead_phone:      phone  || null,
    origin,
    message:         message || null,
    status:          'new',
  });

  if (error) {
    console.error('[Lead submit]', error);
    return res.status(500).json({ error: 'Erro ao salvar lead.' });
  }

  return res.status(200).json({ ok: true });
};
