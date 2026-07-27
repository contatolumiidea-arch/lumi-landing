const { getDb } = require('../_lib/db');

const VALID_ORIGINS = ['buyer_guide', 'seller_guide', 'contact_form', 'landing_page', 'whatsapp', 'sms', 'email', 'other'];
const VALID_SOURCES = ['buyer_form', 'seller_form', 'newsletter', 'ebook_download'];

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { client_id, landing_page_id, name, email, phone, origin, lead_source, message } = req.body || {};

  if (!origin || !VALID_ORIGINS.includes(origin)) {
    return res.status(400).json({ error: 'Origem inválida.' });
  }

  if (lead_source && !VALID_SOURCES.includes(lead_source)) {
    return res.status(400).json({ error: 'lead_source inválido.' });
  }

  if (!name && !email && !phone) {
    return res.status(400).json({ error: 'Pelo menos um campo de contato é obrigatório.' });
  }

  const db = getDb();

  const { error } = await db.from('realtor_leads').insert({
    client_id:       client_id || null,
    landing_page_id: landing_page_id || null,
    lead_name:       name        || null,
    lead_email:      email       || null,
    lead_phone:      phone       || null,
    origin,
    lead_source:     lead_source || null,
    message:         message     || null,
    status:          'new',
  });

  if (error) {
    console.error('[Lead submit]', error);
    return res.status(500).json({ error: 'Erro ao salvar lead.' });
  }

  return res.status(200).json({ ok: true });
};
