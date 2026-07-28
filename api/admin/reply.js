const { requireAdmin } = require('../_lib/auth');
const { getDb } = require('../_lib/db');
const { Resend } = require('resend');

const FROM_EMAIL = 'LUMI IDEA <onboarding@resend.dev>';

module.exports = requireAdmin(async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { prospectId, message } = req.body || {};

  if (!prospectId) return res.status(400).json({ error: 'prospectId obrigatório.' });
  if (!message || !message.trim()) return res.status(400).json({ error: 'Mensagem não pode estar vazia.' });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[Admin reply] RESEND_API_KEY não configurada.');
    return res.status(500).json({ error: 'Serviço de email não configurado. Configure RESEND_API_KEY nas variáveis de ambiente.' });
  }

  const db = getDb();
  const { data: prospect, error: dbError } = await db
    .from('lumi_prospects')
    .select('id, name, email')
    .eq('id', prospectId)
    .single();

  if (dbError || !prospect) {
    return res.status(404).json({ error: 'Interessado não encontrado.' });
  }

  const resend = new Resend(apiKey);
  const { error: emailError } = await resend.emails.send({
    from: FROM_EMAIL,
    to: prospect.email,
    subject: 'Retorno da equipe LUMI IDEA',
    html: `
      <div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:32px 24px;background:#0e0e0e;color:#f0f0f0;border-radius:12px;border:1px solid rgba(212,175,55,.3)">
        <p style="color:#ccc;margin:0 0 20px">Olá${prospect.name ? ', ' + prospect.name : ''},</p>
        <div style="white-space:pre-wrap;color:#f0f0f0;line-height:1.7;margin-bottom:28px">${message.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
        <hr style="border:none;border-top:1px solid rgba(212,175,55,.2);margin:24px 0">
        <p style="color:#999;font-size:.85rem;margin:0">Equipe LUMI IDEA<br>
          <a href="https://lumiidea.com" style="color:#D4AF37">lumiidea.com</a>
        </p>
      </div>
    `,
  });

  if (emailError) {
    const detail = emailError?.message || emailError?.name || JSON.stringify(emailError);
    console.error('[Admin reply] Resend error:', detail, emailError);
    return res.status(500).json({ error: 'Erro ao enviar email.', detail });
  }

  const now = new Date().toISOString();

  // Salvar resposta no histórico
  await db.from('prospect_messages').insert({
    prospect_id: prospectId,
    sender_type: 'admin',
    message:     message.trim(),
  });

  // Atualizar status e última interação
  await db
    .from('lumi_prospects')
    .update({ status: 'contacted', last_contacted_at: now })
    .eq('id', prospectId)
    .eq('status', 'new');

  await db
    .from('lumi_prospects')
    .update({ last_contacted_at: now })
    .eq('id', prospectId)
    .neq('status', 'new');

  return res.status(200).json({ ok: true, sentAt: now });
});
