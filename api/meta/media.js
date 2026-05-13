/**
 * /api/meta/media — Upload/criação de container de mídia
 *
 * POST {
 *   destination: "ig" | "fb",
 *   client: "estilo-tulipa",
 *   image_url: "https://...",              // URL pública da imagem (opção 1)
 *   source_base64: "data:image/jpeg;...",  // Upload local via base64 (opção 2)
 *   filename: "post-starken.jpg",          // Nome do arquivo (opção 2)
 *   media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM",
 *   caption: "...",
 *   children: [{ image_url }]             // Apenas para CAROUSEL_ALBUM
 * }
 *
 * Fluxo com base64:
 *   1. Recebe arquivo em base64 do frontend
 *   2. Upload para Supabase Storage (bucket: media-uploads)
 *   3. Gera URL pública
 *   4. Envia URL para Meta Graph API
 *
 * Retorna: container_id (IG) ou photo_id (FB) + public_url
 */

const { graphPost, graphGet } = require('./_lib/graph');
const { validateTenant } = require('./_lib/tenants');

const POLL_INTERVAL = 5000;
const POLL_MAX_ATTEMPTS = 12;
const POLL_MAX_ATTEMPTS_VIDEO = 36; // 36 × 5s = 180s for videos
const SUPABASE_BUCKET = 'media-uploads';

// ─── Supabase Storage helpers ───

function getSupabaseHeaders() {
  const key = process.env.SUPABASE_SERVICE_KEY;
  return {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
  };
}

function getSupabaseUrl() {
  return process.env.SUPABASE_URL || '';
}

/**
 * Upload base64 file to Supabase Storage
 * Returns public URL
 */
async function uploadToSupabaseStorage(base64Data, filename) {
  const supabaseUrl = getSupabaseUrl();
  if (!supabaseUrl) {
    throw { error: true, code: 'STORAGE_ERROR', message: 'SUPABASE_URL não configurado' };
  }

  // Parse base64 data URI
  let buffer, contentType;
  if (base64Data.startsWith('data:')) {
    const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) throw { error: true, code: 'INVALID_DATA', message: 'Formato base64 inválido' };
    contentType = matches[1];
    buffer = Buffer.from(matches[2], 'base64');
  } else {
    // Raw base64 without data URI prefix
    buffer = Buffer.from(base64Data, 'base64');
    contentType = 'image/jpeg';
  }

  // File size check (10MB limit)
  if (buffer.length > 10 * 1024 * 1024) {
    throw { error: true, code: 'FILE_TOO_LARGE', message: 'Arquivo excede 10MB' };
  }

  // Generate unique filename
  const timestamp = Date.now();
  const ext = filename ? filename.split('.').pop() : (contentType.includes('png') ? 'png' : 'jpg');
  const storagePath = `posts/${timestamp}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  // Upload to Supabase Storage
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${SUPABASE_BUCKET}/${storagePath}`;
  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      ...getSupabaseHeaders(),
      'Content-Type': contentType,
      'x-upsert': 'true',
    },
    body: buffer,
  });

  if (!uploadRes.ok) {
    const errBody = await uploadRes.text();
    // If bucket doesn't exist, try to create it
    if (uploadRes.status === 404 || errBody.includes('not found')) {
      await createBucket();
      // Retry upload
      const retryRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          ...getSupabaseHeaders(),
          'Content-Type': contentType,
          'x-upsert': 'true',
        },
        body: buffer,
      });
      if (!retryRes.ok) {
        const retryErr = await retryRes.text();
        throw { error: true, code: 'STORAGE_UPLOAD_ERROR', message: `Upload falhou: ${retryErr}` };
      }
    } else {
      throw { error: true, code: 'STORAGE_UPLOAD_ERROR', message: `Upload falhou (${uploadRes.status}): ${errBody}` };
    }
  }

  // Public URL
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${SUPABASE_BUCKET}/${storagePath}`;
  return { publicUrl, storagePath, size: buffer.length };
}

/**
 * Create the storage bucket if it doesn't exist
 */
async function createBucket() {
  const supabaseUrl = getSupabaseUrl();
  const createRes = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
    method: 'POST',
    headers: {
      ...getSupabaseHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: SUPABASE_BUCKET,
      name: SUPABASE_BUCKET,
      public: true,
      file_size_limit: 10485760, // 10MB
      allowed_mime_types: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'application/pdf', 'text/html'],
    }),
  });
  // If bucket already exists, update its config to include new mime types
  if (!createRes.ok) {
    const body = await createRes.text();
    if (body.includes('already exists')) {
      // Update bucket to ensure allowed_mime_types includes pdf/html
      await fetch(`${supabaseUrl}/storage/v1/bucket/${SUPABASE_BUCKET}`, {
        method: 'PUT',
        headers: {
          ...getSupabaseHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public: true,
          file_size_limit: 10485760,
          allowed_mime_types: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'application/pdf', 'text/html'],
        }),
      });
    } else {
      console.warn('Bucket creation warning:', body);
    }
  }
}

async function pollContainerStatus(containerId, pageToken, isVideo) {
  const maxAttempts = isVideo ? POLL_MAX_ATTEMPTS_VIDEO : POLL_MAX_ATTEMPTS;
  for (let i = 0; i < maxAttempts; i++) {
    const params = { fields: 'status_code,status' };
    if (pageToken) params.access_token = pageToken;
    const status = await graphGet(`/${containerId}`, params);
    if (status.status_code === 'FINISHED') return true;
    if (status.status_code === 'ERROR') {
      throw { error: true, code: 'MEDIA_ERROR', message: 'Container de mídia falhou: ' + (status.status || 'erro de processamento') };
    }
    await new Promise(r => setTimeout(r, POLL_INTERVAL));
  }
  const totalSec = Math.round(maxAttempts * POLL_INTERVAL / 1000);
  throw { error: true, code: 'MEDIA_TIMEOUT', message: `Timeout aguardando processamento da mídia (${totalSec}s)` };
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: true, code: 'METHOD_NOT_ALLOWED', message: 'Use POST' });
  }

  const { destination, image_url, source_base64, filename, media_type, caption, children } = req.body || {};

  if (!destination || !['ig', 'fb', 'report'].includes(destination)) {
    return res.status(400).json({ error: true, code: 'MISSING_PARAM', message: 'destination deve ser "ig", "fb" ou "report"' });
  }

  // ─── REPORT UPLOAD (Supabase Storage only, no Meta API — skip tenant validation) ───
  if (destination === 'report') {
    if (!source_base64) {
      return res.status(400).json({ error: true, code: 'MISSING_PARAM', message: 'source_base64 obrigatório para report upload' });
    }
    try {
      // Parse base64
      let buffer, contentType2;
      if (source_base64.startsWith('data:')) {
        const m = source_base64.match(/^data:([^;]+);base64,(.+)$/);
        if (!m) return res.status(400).json({ error: true, code: 'INVALID_DATA', message: 'Formato base64 inválido' });
        contentType2 = m[1];
        buffer = Buffer.from(m[2], 'base64');
      } else {
        buffer = Buffer.from(source_base64, 'base64');
        contentType2 = 'application/pdf';
      }
      const supabaseUrl = getSupabaseUrl();
      const ext = contentType2.includes('pdf') ? 'pdf' : 'html';
      const storagePath = 'reports/' + (filename || ('relatorio-' + Date.now())) + '.' + ext;
      const uploadUrl2 = supabaseUrl + '/storage/v1/object/media-uploads/' + storagePath;
      let upRes = await fetch(uploadUrl2, {
        method: 'POST',
        headers: { ...getSupabaseHeaders(), 'Content-Type': contentType2, 'x-upsert': 'true' },
        body: buffer,
      });
      if (!upRes.ok) {
        await createBucket();
        upRes = await fetch(uploadUrl2, {
          method: 'POST',
          headers: { ...getSupabaseHeaders(), 'Content-Type': contentType2, 'x-upsert': 'true' },
          body: buffer,
        });
        if (!upRes.ok) {
          const errText = await upRes.text();
          return res.status(500).json({ error: true, code: 'STORAGE_ERROR', message: 'Upload failed: ' + errText });
        }
      }
      const publicUrl = supabaseUrl + '/storage/v1/object/public/media-uploads/' + storagePath;
      return res.status(201).json({ publicUrl, storagePath, size: buffer.length });
    } catch (err) {
      return res.status(500).json({ error: true, code: 'UPLOAD_ERROR', message: err.message || 'Erro no upload' });
    }
  }

  // ─── IG / FB paths require tenant validation ───
  const tenant = await validateTenant(req, res);
  if (!tenant) return;

  // Resolve image URL: either direct URL or upload base64 to Supabase Storage
  let resolvedImageUrl = image_url;
  let uploadInfo = null;

  if (!resolvedImageUrl && source_base64) {
    try {
      uploadInfo = await uploadToSupabaseStorage(source_base64, filename);
      resolvedImageUrl = uploadInfo.publicUrl;
    } catch (err) {
      if (err.error) return res.status(400).json(err);
      return res.status(500).json({ error: true, code: 'UPLOAD_ERROR', message: err.message });
    }
  }

  if (!resolvedImageUrl && media_type !== 'CAROUSEL_ALBUM') {
    return res.status(400).json({ error: true, code: 'MISSING_PARAM', message: 'image_url ou source_base64 é obrigatório' });
  }

  try {
    // ─── INSTAGRAM ───
    if (destination === 'ig') {
      if (!tenant.igUserId) {
        return res.status(400).json({ error: true, code: 'MISSING_PARAM', message: `IG User ID não configurado para "${tenant.key}"` });
      }

      if (media_type === 'CAROUSEL_ALBUM') {
        if (!children || !children.length) {
          return res.status(400).json({ error: true, code: 'MISSING_PARAM', message: 'children[] obrigatório para carrossel' });
        }

        const childIds = [];
        for (const child of children) {
          const childBody = {
            image_url: child.image_url,
            is_carousel_item: true,
          };
          if (tenant.pageAccessToken) childBody.access_token = tenant.pageAccessToken;
          const childRes = await graphPost(`/${tenant.igUserId}/media`, childBody);
          await pollContainerStatus(childRes.id, tenant.pageAccessToken);
          childIds.push(childRes.id);
        }

        const carouselBody = {
          media_type: 'CAROUSEL',
          caption: caption || '',
          children: childIds.join(','),
        };
        if (tenant.pageAccessToken) carouselBody.access_token = tenant.pageAccessToken;
        const carouselRes = await graphPost(`/${tenant.igUserId}/media`, carouselBody);
        await pollContainerStatus(carouselRes.id, tenant.pageAccessToken);

        return res.status(201).json({
          container_id: carouselRes.id,
          type: 'CAROUSEL_ALBUM',
          children_count: childIds.length,
          status: 'FINISHED',
          upload: uploadInfo,
        });
      }

      // Single image/video/reel
      const isVideoMedia = media_type === 'VIDEO' || media_type === 'REELS';
      const body = { image_url: resolvedImageUrl };
      if (isVideoMedia) {
        body.video_url = resolvedImageUrl;
        delete body.image_url;
        body.media_type = media_type === 'REELS' ? 'REELS' : 'VIDEO';
      }
      if (caption) body.caption = caption;
      if (tenant.pageAccessToken) body.access_token = tenant.pageAccessToken;

      const containerRes = await graphPost(`/${tenant.igUserId}/media`, body, isVideoMedia ? { videoMode: true } : {});
      await pollContainerStatus(containerRes.id, tenant.pageAccessToken, isVideoMedia);

      return res.status(201).json({
        container_id: containerRes.id,
        type: media_type || 'IMAGE',
        status: 'FINISHED',
        upload: uploadInfo,
      });
    }

    // ─── FACEBOOK ───
    if (destination === 'fb') {
      if (!tenant.pageId) {
        return res.status(400).json({ error: true, code: 'MISSING_PARAM', message: `Page ID não configurado para "${tenant.key}"` });
      }
      if (!tenant.pageAccessToken) {
        return res.status(400).json({ error: true, code: 'MISSING_PAGE_TOKEN', message: `Page Access Token não encontrado para "${tenant.name || tenant.key}". Re-descubra ativos na Configuração Meta.` });
      }

      const photoRes = await graphPost(`/${tenant.pageId}/photos`, {
        url: resolvedImageUrl,
        published: false,
        caption: caption || '',
        access_token: tenant.pageAccessToken,
      });

      return res.status(201).json({
        photo_id: photoRes.id,
        type: 'PHOTO',
        status: 'UPLOADED',
        upload: uploadInfo,
      });
    }
  } catch (err) {
    if (err.error) {
      return res.status(err.status || 502).json(err);
    }
    return res.status(500).json({
      error: true,
      code: 'INTERNAL_ERROR',
      message: err.message || 'Erro interno',
    });
  }
};
