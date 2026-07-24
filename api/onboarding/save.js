const { getDb } = require('../_lib/db');

// Campos permitidos por step (whitelist)
const STEP_FIELDS = {
  1: 'step1_business',
  2: 'step2_template',
  3: 'step3_brand',
  4: 'step4_languages',
  5: 'step5_details',
  6: 'step6_services',
  7: 'step7_leadgen',
  8: 'step8_ebook',
  9: 'step9_crm',
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { client_id, step, data, social_links, testimonials, properties } = req.body || {};

  if (!client_id) {
    return res.status(400).json({ error: 'client_id é obrigatório.' });
  }

  const db = getDb();

  // Verificar se o cliente existe
  const { data: client } = await db
    .from('lumi_clients')
    .select('id')
    .eq('id', client_id)
    .single();

  if (!client) {
    return res.status(404).json({ error: 'Cliente não encontrado.' });
  }

  const update = { updated_at: new Date().toISOString() };

  if (step && STEP_FIELDS[step] && data !== undefined) {
    update[STEP_FIELDS[step]] = data;
    update.current_step = Math.max(step, 1);
  }

  if (social_links !== undefined)  update.social_links  = social_links;
  if (testimonials  !== undefined) update.testimonials  = testimonials;
  if (properties    !== undefined) update.properties    = properties;

  // Marcar como concluído se for o último passo
  if (step === 9) {
    update.status       = 'completed';
    update.completed_at = new Date().toISOString();

    await db
      .from('lumi_clients')
      .update({
        client_status: 'in_production',
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq('id', client_id);
  }

  const { error } = await db
    .from('lumi_onboarding')
    .upsert({ client_id, ...update }, { onConflict: 'client_id' });

  if (error) {
    console.error('[Onboarding save]', error);
    return res.status(500).json({ error: 'Erro ao salvar dados.' });
  }

  return res.status(200).json({ ok: true });
};
