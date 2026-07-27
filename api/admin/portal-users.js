const bcrypt = require('bcryptjs');
const { requireAdmin } = require('../_lib/auth');
const { getDb } = require('../_lib/db');

module.exports = requireAdmin(async function handler(req, res) {
  const db = getDb();

  // GET — listar usuários do portal (opcionalmente filtrar por client_id)
  if (req.method === 'GET') {
    const { client_id } = req.query;
    let query = db
      .from('lumi_portal_users')
      .select('id, client_id, name, email, is_active, created_at, updated_at, lumi_clients(full_name, business_name)')
      .order('created_at', { ascending: false });
    if (client_id) query = query.eq('client_id', client_id);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: 'Erro ao buscar usuários.' });
    return res.status(200).json({ users: data });
  }

  // POST — criar novo usuário do portal
  if (req.method === 'POST') {
    const { client_id, name, email, password } = req.body || {};

    if (!client_id || !name || !email || !password) {
      return res.status(400).json({ error: 'client_id, name, email e password são obrigatórios.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'A senha deve ter no mínimo 8 caracteres.' });
    }

    // Verificar email duplicado
    const { data: existing } = await db
      .from('lumi_portal_users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();
    if (existing) return res.status(409).json({ error: 'Email já cadastrado.' });

    const password_hash = await bcrypt.hash(password, 12);
    const { data: created, error } = await db
      .from('lumi_portal_users')
      .insert({
        client_id,
        name:          name.trim(),
        email:         email.toLowerCase().trim(),
        password_hash,
        is_active:     true,
      })
      .select('id, client_id, name, email, is_active, created_at')
      .single();

    if (error) {
      console.error('[Portal users POST]', error);
      return res.status(500).json({ error: 'Erro ao criar usuário.' });
    }

    return res.status(201).json({ user: created });
  }

  // PATCH — ativar/desativar ou redefinir senha
  if (req.method === 'PATCH') {
    const { id, is_active, password } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id é obrigatório.' });

    const updates = { updated_at: new Date().toISOString() };
    if (typeof is_active === 'boolean') updates.is_active = is_active;
    if (password) {
      if (password.length < 8) return res.status(400).json({ error: 'Senha muito curta.' });
      updates.password_hash = await bcrypt.hash(password, 12);
    }

    const { data: updated, error } = await db
      .from('lumi_portal_users')
      .update(updates)
      .eq('id', id)
      .select('id, name, email, is_active')
      .single();

    if (error) return res.status(500).json({ error: 'Erro ao atualizar usuário.' });
    return res.status(200).json({ user: updated });
  }

  return res.status(405).end();
});
