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

  const { client_id, step, data, social_links, testimonials, properties, onboarding_data } = req.body || {};

  console.log('[ONBOARDING] client_id recebido:', client_id || '(nenhum)');

  const db = getDb();
  let resolvedClientId = client_id || null;
  let mode; // 'CREATE' | 'UPDATE' | 'REUSE'

  if (!resolvedClientId) {
    // ── Cenário 1 e 3 (sem Stripe): find-or-create por email ─────────────
    const name  = onboarding_data?.fullName  || onboarding_data?.businessName || 'Sem nome';
    const email = onboarding_data?.email     || null;
    const phone = onboarding_data?.phone     || null;

    // Busca registro existente pelo email primeiro (evita duplicata)
    if (email) {
      const { data: existing } = await db
        .from('lumi_clients')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existing) {
        resolvedClientId = existing.id;
        mode = 'REUSE';
      }
    }

    // Sem match por email: cria novo registro
    if (!resolvedClientId) {
      const { data: newClient, error: insertErr } = await db
        .from('lumi_clients')
        .insert({
          full_name:     name,
          email,
          phone,
          client_status: 'pending_onboarding',
        })
        .select('id')
        .single();

      if (insertErr || !newClient) {
        console.error('[ONBOARDING] erro ao criar cliente:', {
          message: insertErr?.message,
          code:    insertErr?.code,
          details: insertErr?.details,
          hint:    insertErr?.hint,
        });
        return res.status(500).json({
          error:  'Erro ao registrar cliente.',
          detail: insertErr?.message || null,
          code:   insertErr?.code    || null,
        });
      }

      resolvedClientId = newClient.id;
      mode = 'CREATE';
    }
  } else {
    // ── Cenário 2 (com Stripe) e Cenário 3 (re-envio com client_id) ──────
    const { data: client } = await db
      .from('lumi_clients')
      .select('id')
      .eq('id', resolvedClientId)
      .single();

    if (!client) {
      console.error('[ONBOARDING] client_id não encontrado em lumi_clients:', resolvedClientId);
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }

    mode = 'UPDATE';
  }

  console.log('[ONBOARDING] modo:', mode, '| client_id:', resolvedClientId);

  // ── Monta payload para lumi_onboarding ───────────────────────────────────
  const update = { updated_at: new Date().toISOString() };

  if (step && STEP_FIELDS[step] && data !== undefined) {
    update[STEP_FIELDS[step]] = data;
    update.current_step = Math.max(step, 1);
  }

  if (social_links    !== undefined) update.social_links   = social_links;
  if (testimonials    !== undefined) update.testimonials   = testimonials;
  if (properties      !== undefined) update.properties     = properties;
  if (onboarding_data !== undefined) update.step1_business = onboarding_data; // coluna real na lumi_onboarding

  // Marcar como concluído no envio final (onboarding_data presente = submit final)
  if (onboarding_data !== undefined) {
    update.status       = 'completed';
    update.completed_at = new Date().toISOString();

    // Atualiza status em lumi_clients
    await db
      .from('lumi_clients')
      .update({
        client_status:           'onboarding_received',
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq('id', resolvedClientId);
  }

  // ── Persiste em lumi_onboarding (upsert = INSERT ou UPDATE sem duplicata) ─
  const { error: upsertErr } = await db
    .from('lumi_onboarding')
    .upsert({ client_id: resolvedClientId, ...update }, { onConflict: 'client_id' });

  if (upsertErr) {
    console.error('[ONBOARDING] erro ao salvar em lumi_onboarding:', {
      message: upsertErr?.message,
      code:    upsertErr?.code,
      details: upsertErr?.details,
      hint:    upsertErr?.hint,
    });
    return res.status(500).json({
      error:  'Erro ao salvar dados.',
      detail: upsertErr?.message || null,
      code:   upsertErr?.code    || null,
    });
  }

  console.log('[ONBOARDING] cliente salvo:', { client_id: resolvedClientId, mode, status: update.status || 'partial' });

  return res.status(200).json({ ok: true, client_id: resolvedClientId });
};
