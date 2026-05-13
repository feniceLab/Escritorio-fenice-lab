/**
 * /api/meta/instagram — Perfil, métricas e mídia do Instagram do cliente
 *
 * GET ?client=slug
 */

const { getClient } = require('./_lib/tenants');

const BASE_URL = 'https://graph.facebook.com/v25.0';
const TIMEOUT_MS = 15000;

function numberOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeMetaError(data, status) {
  const err = data && data.error ? data.error : {};
  return {
    error: true,
    code: err.code === 190 ? 'TOKEN_EXPIRED' : 'META_API_ERROR',
    message: err.message || `Meta API ${status}`,
    meta_code: err.code || null,
    meta_subcode: err.error_subcode || null,
    fbtrace_id: err.fbtrace_id || null,
    status,
  };
}

async function graphGetWithToken(path, params, token) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const query = new URLSearchParams({ access_token: token, ...(params || {}) });
    const res = await fetch(`${BASE_URL}${path}?${query.toString()}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    const data = await res.json();
    if (!res.ok || data.error) throw normalizeMetaError(data, res.status);
    return data;
  } finally {
    clearTimeout(timer);
  }
}

function metricValue(metric) {
  if (metric && metric.total_value && metric.total_value.value !== undefined) {
    return numberOrNull(metric.total_value.value);
  }
  const values = metric && Array.isArray(metric.values) ? metric.values : [];
  const last = values[values.length - 1] || {};
  return numberOrNull(last.value);
}

function mediaImageUrl(item) {
  if (!item) return '';
  if (item.thumbnail_url) return item.thumbnail_url;
  if (item.media_url) return item.media_url;
  const children = item.children && Array.isArray(item.children.data) ? item.children.data : [];
  const child = children.find((c) => c && (c.thumbnail_url || c.media_url));
  return child ? (child.thumbnail_url || child.media_url || '') : '';
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: true, code: 'METHOD_NOT_ALLOWED', message: 'Use GET' });
  }

  const clientKey = req.query.client || req.query.client_slug;
  if (!clientKey) {
    return res.status(400).json({ error: true, code: 'MISSING_PARAM', message: 'Parâmetro "client" é obrigatório' });
  }

  let client;
  try {
    client = await getClient(clientKey);
  } catch (err) {
    return res.status(400).json(err);
  }

  if (!client.igUserId) {
    return res.status(400).json({
      error: true,
      code: 'IG_NOT_CONFIGURED',
      message: `Instagram ainda não configurado para "${client.name}". Vincule uma Página/Instagram na configuração Meta.`,
    });
  }

  const token = client.pageAccessToken || process.env.META_ACCESS_TOKEN;
  if (!token) {
    return res.status(400).json({
      error: true,
      code: 'TOKEN_MISSING',
      message: 'Token Meta não configurado para este cliente.',
    });
  }

  const out = {
    ok: true,
    client: {
      key: client.key,
      name: client.name,
      page_id: client.pageId || null,
      page_name: client.pageName || null,
      ig_user_id: client.igUserId || null,
      ig_username: client.igUsername || null,
    },
    profile: null,
    insights: {},
    media: [],
    errors: [],
    collected_at: new Date().toISOString(),
  };

  try {
    const profile = await graphGetWithToken(`/${client.igUserId}`, {
      fields: 'username,name,biography,website,profile_picture_url,followers_count,follows_count,media_count',
    }, token);
    out.profile = {
      id: profile.id || client.igUserId,
      username: profile.username || client.igUsername || '',
      name: profile.name || client.name || '',
      biography: profile.biography || '',
      website: profile.website || '',
      profile_picture_url: profile.profile_picture_url || '',
      followers_count: numberOrNull(profile.followers_count),
      follows_count: numberOrNull(profile.follows_count),
      media_count: numberOrNull(profile.media_count),
    };
  } catch (err) {
    out.errors.push({ scope: 'profile', message: err.message || 'Erro ao buscar perfil', code: err.code || null });
  }

  try {
    const insights = await graphGetWithToken(`/${client.igUserId}/insights`, {
      metric: 'reach,profile_views,views',
      period: 'day',
      metric_type: 'total_value',
    }, token);
    (insights.data || []).forEach((metric) => {
      const n = metricValue(metric);
      if (n !== null) {
        if (metric.name === 'reach') out.insights.reach = n;
        if (metric.name === 'profile_views') out.insights.profile_views = n;
        if (metric.name === 'views') out.insights.views = n;
      }
    });
  } catch (err) {
    out.errors.push({ scope: 'insights', message: err.message || 'Erro ao buscar métricas', code: err.code || null });
  }

  try {
    const media = await graphGetWithToken(`/${client.igUserId}/media`, {
      fields: 'id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,children{id,media_type,media_url,thumbnail_url,permalink,timestamp}',
      limit: '30',
    }, token);
    out.media = (media.data || []).map((item) => ({
      id: item.id,
      caption: item.caption || '',
      media_type: item.media_type || '',
      media_product_type: item.media_product_type || '',
      media_url: item.media_url || '',
      thumbnail_url: item.thumbnail_url || '',
      display_url: mediaImageUrl(item),
      permalink: item.permalink || '',
      timestamp: item.timestamp || '',
      like_count: numberOrNull(item.like_count),
      comments_count: numberOrNull(item.comments_count),
      children: item.children && Array.isArray(item.children.data)
        ? item.children.data.map((child) => ({
            id: child.id,
            media_type: child.media_type || '',
            media_url: child.media_url || '',
            thumbnail_url: child.thumbnail_url || '',
            display_url: mediaImageUrl(child),
            permalink: child.permalink || '',
            timestamp: child.timestamp || '',
          }))
        : [],
    }));
  } catch (err) {
    out.errors.push({ scope: 'media', message: err.message || 'Erro ao buscar mídia', code: err.code || null });
  }

  if (!out.profile && !out.media.length && Object.keys(out.insights).length === 0 && out.errors.length) {
    return res.status(502).json({ error: true, code: 'INSTAGRAM_FETCH_FAILED', message: out.errors[0].message, details: out.errors });
  }

  return res.status(200).json(out);
};
