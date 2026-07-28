/**
 * POST /api/webhooks/email-inbound
 *
 * Recebe emails de entrada via Resend Inbound.
 * Identifica o prospect pelo email remetente e salva a mensagem
 * em prospect_messages com sender_type='cliente'.
 *
 * Configuração no Resend Dashboard:
 *   Inbound → Webhook URL: https://lumiidea.com/api/webhooks/email-inbound
 *   Header personalizado:  X-Webhook-Secret: <valor de RESEND_WEBHOOK_SECRET>
 */

const { getDb } = require('../_lib/db');

// Extrai somente o corpo novo da resposta, descartando o texto citado.
function extractReplyBody(text) {
  if (!text) return '';

  const lines = text.split('\n');
  const result = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Linhas citadas (padrão universal)
    if (trimmed.startsWith('>')) break;

    // Separadores comuns de email clients
    if (/^[-_]{2,}$/.test(trimmed)) break;
    if (/^(On|Em)\s.+wrote:|escreveu:/i.test(trimmed)) break;
    if (/^(De|From|Enviado|Sent|Date|Data|To|Para):\s/i.test(trimmed)) break;

    result.push(line);
  }

  return result.join('\n').trim();
}

// Normaliza o campo "from" que pode vir como string ou objeto
function extractFromEmail(from) {
  if (!from) return null;
  if (typeof from === 'string') {
    // "Nome <email@domain.com>" ou "email@domain.com"
    const match = from.match(/<([^>]+)>/);
    return (match ? match[1] : from).toLowerCase().trim();
  }
  if (typeof from === 'object') {
    return (from.email || from.address || '').toLowerCase().trim();
  }
  return null;
}

const SKIP_SENDERS = /mailer-daemon|no-?reply|postmaster|noreply|auto-?reply|bounce/i;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // ── Verificação do segredo ───────────────────────────────────────────────
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (secret) {
    const provided =
      req.headers['x-webhook-secret'] ||
      req.headers['x-resend-secret']  ||
      req.query.secret;

    if (provided !== secret) {
      console.warn('[inbound] Webhook secret inválido');
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  // ── Parse do payload ─────────────────────────────────────────────────────
  // Resend pode enviar o email diretamente ou dentro de data/record
  const body   = req.body || {};
  const record = body.data || body.record || body;

  const fromRaw = record.from || record.sender;
  const text    = record.text || record.plain_text || record.body_plain || '';
  const subject = record.subject || '';
  const emailId = record.email_id || record.id || record.message_id || null;

  const fromEmail = extractFromEmail(fromRaw);

  if (!fromEmail) {
    console.warn('[inbound] Remetente não identificado:', fromRaw);
    return res.status(200).json({ ok: true, skipped: 'no_sender' });
  }

  // Ignorar bounces e auto-replies
  if (SKIP_SENDERS.test(fromEmail)) {
    return res.status(200).json({ ok: true, skipped: 'auto_sender' });
  }

  console.log(`[inbound] Email de ${fromEmail} — assunto: "${subject}"`);

  const db = getDb();

  // ── Deduplicação pelo email_id do Resend ─────────────────────────────────
  if (emailId) {
    const { data: existing } = await db
      .from('prospect_messages')
      .select('id')
      .eq('external_id', emailId)
      .maybeSingle();

    if (existing) {
      console.log(`[inbound] Mensagem duplicada ignorada: ${emailId}`);
      return res.status(200).json({ ok: true, skipped: 'duplicate' });
    }
  }

  // ── Buscar prospect pelo email do remetente ──────────────────────────────
  const { data: prospect } = await db
    .from('lumi_prospects')
    .select('id, name, email')
    .eq('email', fromEmail)
    .maybeSingle();

  if (!prospect) {
    console.log(`[inbound] Nenhum prospect encontrado para: ${fromEmail}`);
    return res.status(200).json({ ok: true, skipped: 'unknown_sender' });
  }

  // ── Extrair corpo da mensagem ────────────────────────────────────────────
  const body_text = extractReplyBody(text);
  const message   = body_text || subject || '(sem conteúdo)';

  // ── Salvar no histórico ──────────────────────────────────────────────────
  const { error: insertError } = await db
    .from('prospect_messages')
    .insert({
      prospect_id: prospect.id,
      sender_type: 'cliente',
      message,
      external_id: emailId || null,
    });

  if (insertError) {
    console.error('[inbound] Erro ao salvar mensagem:', insertError);
    return res.status(500).json({ error: 'Erro ao salvar mensagem.' });
  }

  // Atualizar last_contacted_at do prospect
  await db
    .from('lumi_prospects')
    .update({ last_contacted_at: new Date().toISOString() })
    .eq('id', prospect.id);

  console.log(`[inbound] Mensagem de ${fromEmail} salva para prospect ${prospect.id}`);
  return res.status(200).json({ ok: true });
};
