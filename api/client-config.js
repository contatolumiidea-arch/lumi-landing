const { getDb } = require('./_lib/db');

// Public endpoint — returns only the fields safe to expose on a client landing page.
// No auth required: client_id is a non-secret identifier, not a credential.
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { client_id } = req.query;
  if (!client_id) return res.status(400).json({ error: 'client_id obrigatório.' });

  const db = getDb();

  const { data, error } = await db
    .from('lumi_onboarding')
    .select('step1_business, step5_details')
    .eq('client_id', client_id)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'Configuração não encontrada.' });
  }

  // step1_business holds the full collected data from the final submit
  // step5_details holds step-by-step saves; use whichever has enabled_forms
  const full = data.step1_business || {};
  const s5   = data.step5_details  || {};
  const od   = Object.keys(full).length ? full : s5;

  // Return null (not []) when not configured — null means "show all forms".
  // An empty [] would mean "no forms enabled", hiding everything on the realtor page.
  const rawForms = od.enabled_forms || od.captureForms;
  const enabledForms = Array.isArray(rawForms) && rawForms.length > 0 ? rawForms : null;

  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
  return res.status(200).json({
    enabled_forms:    enabledForms,
    welcome_message:  od.leadWelcomeMessage || null,
    contact_channels: od.contactChannels    || [],
    whatsapp:         od.leadWhatsapp       || null,
  });
};
