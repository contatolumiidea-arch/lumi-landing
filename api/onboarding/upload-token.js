const { getDb } = require('../_lib/db');

const BUCKET = 'onboarding-files';

const ALLOWED_FOLDERS = ['logo', 'brand', 'team', 'gallery', 'videos', 'ebooks'];

const ALLOWED_TYPES = new Set([
  'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml',
  'application/pdf',
  'video/mp4', 'video/quicktime',
]);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { uuid, folder, filename, contentType } = req.body || {};

  if (!uuid || !folder || !filename || !contentType) {
    return res.status(400).json({ error: 'uuid, folder, filename e contentType são obrigatórios.' });
  }

  if (!ALLOWED_FOLDERS.includes(folder)) {
    return res.status(400).json({ error: 'Pasta não permitida.' });
  }

  if (!ALLOWED_TYPES.has(contentType)) {
    return res.status(400).json({ error: 'Tipo de arquivo não permitido.' });
  }

  // Sanitise filename — keep only extension, use timestamp for the name
  const ext = filename.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '');
  const safePath = `${uuid}/${folder}/${Date.now()}.${ext}`;

  const db = getDb();

  const { data, error } = await db.storage
    .from(BUCKET)
    .createSignedUploadUrl(safePath);

  if (error) {
    console.error('[upload-token]', error);
    return res.status(500).json({ error: 'Erro ao gerar URL de upload.' });
  }

  const publicUrl = db.storage.from(BUCKET).getPublicUrl(safePath).data.publicUrl;

  return res.status(200).json({
    signedUrl: data.signedUrl,
    token:     data.token,
    publicUrl,
  });
};
