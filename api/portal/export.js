const { requirePortal } = require('../_lib/portal-auth');
const { getDb } = require('../_lib/db');

const SOURCE_LABELS = {
  buyer_form:     'Formulário de Consulta do Comprador',
  seller_form:    'Formulário de Avaliação do Vendedor',
  newsletter:     'Inscrição no Boletim',
  ebook_download: 'Download de Ebook',
};

function toCSV(rows) {
  const headers = ['Nome', 'Email', 'Telefone', 'Origem', 'Data', 'Mensagem'];
  const escape = (v) => {
    if (v == null) return '';
    const s = String(v).replace(/"/g, '""');
    return /[",\n\r]/.test(s) ? `"${s}"` : s;
  };
  const lines = [
    headers.join(','),
    ...rows.map(r => [
      escape(r.lead_name),
      escape(r.lead_email),
      escape(r.lead_phone),
      escape(SOURCE_LABELS[r.lead_source] || r.lead_source || r.origin || ''),
      escape(r.created_at ? new Date(r.created_at).toLocaleString('pt-BR') : ''),
      escape(r.message),
    ].join(',')),
  ];
  return lines.join('\r\n');
}

module.exports = requirePortal(async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { client_id } = req.portalUser;
  const db = getDb();

  const { data, error } = await db
    .from('realtor_leads')
    .select('lead_name, lead_email, lead_phone, origin, lead_source, message, created_at')
    .eq('client_id', client_id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Portal export]', error);
    return res.status(500).json({ error: 'Erro ao exportar leads.' });
  }

  const csv = toCSV(data || []);
  const filename = `leads-${new Date().toISOString().slice(0, 10)}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  // BOM para Excel reconhecer UTF-8
  return res.status(200).send('﻿' + csv);
});
