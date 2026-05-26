// =============================================================================
// Client Hub API — Multiplexed Vercel Serverless Function
// POST endpoint with action-based routing
//
// Actions:
//   hub_get        — Full client hub record with counts
//   hub_list       — List all hubs with completeness score
//   hub_upsert     — Create or update a hub + log activity
//   hub_delete     — Soft delete (status → encerrado)
//   hub_activity   — Activity log for a hub
//   hub_bulk_init  — Bootstrap hubs from existing meta_config
//   hub_materials_list   — List materials
//   hub_materials_delete — Delete material
//   hub_materials_insert — Insert material record
//   hub_materials_upload — Upload file to Storage + insert record
// =============================================================================

const crypto = require('node:crypto');
let metaGraphGet = null;
try {
  ({ graphGet: metaGraphGet } = require('../meta/_lib/graph'));
} catch (_) {
  metaGraphGet = null;
}

// ─── Supabase REST helpers (same pattern as publish.js / content.js) ───
const SUPABASE_URL = () => process.env.SUPABASE_URL || '';
const SUPABASE_KEY = () => process.env.SUPABASE_SERVICE_KEY || '';

function sbHeaders(prefer) {
  const key = SUPABASE_KEY();
  const h = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
  if (prefer) h['Prefer'] = prefer;
  return h;
}

async function sbFetch(path, opts = {}) {
  const url = SUPABASE_URL();
  if (!url) throw new Error('SUPABASE_URL not configured');
  const res = await fetch(`${url}${path}`, opts);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Supabase ${res.status}: ${text.substring(0, 300)}`);
  }
  if (!text || text.length === 0) return null;
  try { return JSON.parse(text); } catch { return text; }
}

// =============================================================================
// Completeness fields
// =============================================================================

const COMPLETENESS_FIELDS = [
  'client_name', 'segment', 'responsible', 'tone_of_voice',
  'brand_colors', 'logo_url', 'social_links', 'contract_start',
  'contract_package', 'drive_folder_url',
];

function computeCompleteness(row) {
  if (!row) return 0;
  let filled = 0;
  for (const field of COMPLETENESS_FIELDS) {
    const val = row[field];
    if (val === null || val === undefined || val === '') continue;
    if (typeof val === 'object' && Object.keys(val).length === 0) continue;
    filled++;
  }
  return Math.round((filled / COMPLETENESS_FIELDS.length) * 100);
}

function safeJson(value, fallback = {}) {
  if (value == null || value === '') return fallback;
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return fallback; }
}

function normalizeHubMaterialCategory(category) {
  const allowed = new Set([
    'logo', 'feed', 'stories', 'reels', 'product_photo', 'template',
    'mockup', 'uniform', 'reference', 'document', 'other',
  ]);
  const value = String(category || 'other').trim();
  if (value === 'cronograma') return 'document';
  return allowed.has(value) ? value : 'other';
}

async function deleteHubStorageObject(storagePath) {
  const url = SUPABASE_URL();
  const key = SUPABASE_KEY();
  if (!url || !key || !storagePath) return;
  const encodedPath = String(storagePath).split('/').map((part) => encodeURIComponent(part)).join('/');
  try {
    await fetch(`${url}/storage/v1/object/client-hub-materials/${encodedPath}`, {
      method: 'DELETE',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
      },
    });
  } catch (_) {}
}

function portalSlugify(value) {
  return String(value || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function portalClientCandidateSet(client_slug, client_name) {
  const values = [client_slug, client_name];
  const out = new Set();
  values.forEach((value) => {
    const raw = String(value || '').trim();
    if (!raw) return;
    out.add(raw.toLowerCase());
    out.add(portalSlugify(raw));
  });
  return out;
}

function portalSecret() {
  return process.env.CLIENT_PORTAL_SECRET || SUPABASE_KEY() || 'starken-client-portal';
}

function portalB64Url(input) {
  return Buffer.from(input).toString('base64url');
}

function portalSign(payloadB64) {
  return crypto.createHmac('sha256', portalSecret()).update(payloadB64).digest('base64url');
}

function portalMakeToken({ client_slug, name }) {
  const payload = {
    client_slug,
    name: name || 'Cliente',
    role: 'client',
    iat: Date.now(),
    exp: Date.now() + (1000 * 60 * 60 * 12),
  };
  const b64 = portalB64Url(JSON.stringify(payload));
  return `${b64}.${portalSign(b64)}`;
}

function portalVerifyToken(token, client_slug) {
  if (!token || typeof token !== 'string' || token.indexOf('.') < 0) {
    return { ok: false, message: 'Token do portal ausente.' };
  }
  const [payloadB64, sig] = token.split('.');
  const expected = portalSign(payloadB64);
  try {
    const a = Buffer.from(sig || '');
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return { ok: false, message: 'Sessão do portal inválida.' };
    }
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!payload.exp || Date.now() > payload.exp) return { ok: false, message: 'Sessão expirada.' };
    if (client_slug && payload.client_slug !== client_slug) return { ok: false, message: 'Sessão não pertence a este cliente.' };
    return { ok: true, payload };
  } catch (e) {
    return { ok: false, message: 'Sessão do portal inválida.' };
  }
}

async function portalGetHub(client_slug) {
  const data = await sbFetch(
    `/rest/v1/client_hub?client_slug=eq.${encodeURIComponent(client_slug)}&limit=1`,
    { headers: sbHeaders() }
  );
  return Array.isArray(data) ? data[0] : data;
}

async function portalGetPin(client_slug) {
  const rows = await sbFetch(
    `/rest/v1/admin_secrets?label=eq.${encodeURIComponent(`Portal PIN ${client_slug}`)}&select=value&limit=1`,
    { headers: sbHeaders() }
  );
  const row = Array.isArray(rows) ? rows[0] : rows;
  return row && row.value ? String(row.value) : '';
}

function portalSafeHub(hub, client_slug) {
  hub = hub || {};
  return {
    client_slug,
    client_name: hub.client_name || hub.name || client_slug,
    tenant: hub.tenant || null,
    segment: hub.segment || null,
    responsible: hub.responsible || null,
    logo_url: hub.logo_url || null,
    client_email: hub.client_email || null,
    client_phone: hub.client_phone || null,
    client_contact_name: hub.client_contact_name || null,
    social_links: safeJson(hub.social_links, {}),
    brand_colors: safeJson(hub.brand_colors, []),
    brand_fonts: safeJson(hub.brand_fonts, {}),
    tone_of_voice: hub.tone_of_voice || null,
    notes: hub.notes || null,
    status: hub.status || null,
    completeness: computeCompleteness(hub),
  };
}

function portalSafeMaterial(row) {
  return {
    id: row.id,
    client_slug: row.client_slug,
    file_name: row.file_name,
    file_url: row.file_url,
    category: row.category || 'other',
    mime_type: row.mime_type || null,
    file_size: row.file_size || null,
    uploaded_by: row.uploaded_by || null,
    created_at: row.created_at || null,
  };
}

function portalSafeTask(row, group) {
  const cfg = safeJson(row.publish_config, row.publish_config || {});
  return {
    id: row.id,
    client_id: row.client_id || (group && group.client_id) || null,
    parent_id: row.parent_id || null,
    group_id: row.group_id,
    group_name: group && group.name ? group.name : '',
    name: row.name,
    status: row.status,
    priority: row.priority,
    assignee: row.assignee,
    due_date: row.due_date,
    format: row.format,
    formats: row.formats,
    content_format: row.content_format,
    copy_text: row.copy_text,
    caption: row.caption,
    description: row.description,
    publish_config: cfg,
    created_at: row.created_at,
    updated_at: row.updated_at,
    attachments: [],
    publish_history: [],
  };
}

function portalSafeHistory(row) {
  return {
    id: row.id,
    task_id: row.task_id || row.content_task_id || null,
    client_slug: row.client_slug || row.client_key || row.client || row.client_id || null,
    client_key: row.client_key || row.client_slug || row.client || row.client_id || null,
    client_name: row.client_name || null,
    platform: row.platform || row.network || null,
    status: row.status || null,
    caption: row.caption || row.copy || null,
    image_url: row.image_url || row.media_url || null,
    image_urls: row.image_urls || row.media_urls || null,
    media_url: row.media_url || row.image_url || null,
    post_id: row.post_id || row.platform_post_id || row.fb_post_id || row.ig_media_id || null,
    user_name: row.user_name || row.user || row.created_by || null,
    scheduled_for: row.scheduled_for || row.scheduled_at || null,
    published_at: row.published_at || null,
    created_at: row.created_at || null,
  };
}

function portalMatchesClient(row, client_slug, client_name) {
  const wanted = portalClientCandidateSet(client_slug, client_name);
  const candidates = [
    row.client_slug, row.client_key, row.client, row.client_id, row.clientName,
    row.client_name, row.name,
  ].map((v) => String(v || '').trim()).filter(Boolean);
  return candidates.some((value) => {
    const raw = value.toLowerCase();
    const slug = portalSlugify(value);
    if (wanted.has(raw) || wanted.has(slug)) return true;
    for (const target of wanted) {
      if (target && target.length > 3 && (raw.includes(target) || slug.includes(target) || target.includes(slug))) return true;
    }
    return false;
  });
}

async function portalGetMetaConfig() {
  const rows = await sbFetch('/rest/v1/meta_config?id=eq.default&select=config&limit=1', { headers: sbHeaders() });
  const row = Array.isArray(rows) ? rows[0] : rows;
  return safeJson(row && row.config, { clients: {}, tenants: {} });
}

function portalFindMetaClient(config, client_slug, client_name) {
  const clients = (config && config.clients) || {};
  const slug = portalSlugify(client_slug);
  const nameSlug = portalSlugify(client_name);
  if (clients[client_slug]) return clients[client_slug];
  if (clients[slug]) return clients[slug];
  if (clients[nameSlug]) return clients[nameSlug];

  const entries = Object.entries(clients);
  const exact = entries.find(([key, value]) => {
    const v = value || {};
    return portalSlugify(key) === slug ||
      portalSlugify(v.slug || v.client_slug || v.name || v.client_name || v.pageName) === slug ||
      (nameSlug && portalSlugify(v.name || v.client_name || v.pageName) === nameSlug);
  });
  return exact ? exact[1] : null;
}

function portalMaskId(value) {
  const s = String(value || '').trim();
  if (!s) return '';
  if (s.length <= 8) return '••••' + s.slice(-2);
  return s.slice(0, 4) + '••••' + s.slice(-4);
}

function portalSafeMetaConfig(clientConfig) {
  const c = clientConfig || {};
  return {
    configured: !!clientConfig,
    page: {
      connected: !!c.pageId,
      id_masked: portalMaskId(c.pageId),
      name: c.pageName || c.name || '',
    },
    instagram: {
      connected: !!c.igUserId,
      id_masked: portalMaskId(c.igUserId),
      username: c.igUsername || '',
    },
    ads: {
      connected: !!c.adAccountId,
      id_masked: portalMaskId(c.adAccountId),
      name: c.adAccountName || '',
    },
    whatsapp: {
      connected: !!(c.whatsappGroupId || c.whatsappGroupJid || c.whatsapp_group_id),
      group_masked: portalMaskId(c.whatsappGroupId || c.whatsappGroupJid || c.whatsapp_group_id),
    },
    token: {
      page_token_configured: !!c.pageAccessToken,
      app_token_configured: !!(process.env.META_ACCESS_TOKEN || process.env.META_TOKEN),
    },
  };
}

async function portalOptionalTableRows(table, client_slug, client_name, limit = 180) {
  const rows = await sbFetch(
    `/rest/v1/${table}?select=*&limit=${limit}`,
    { headers: sbHeaders() }
  ).catch(() => []);
  return (Array.isArray(rows) ? rows : [])
    .filter((row) => portalMatchesClient(row, client_slug, client_name))
    .sort((a, b) => new Date(portalSnapshotDate(b) || 0) - new Date(portalSnapshotDate(a) || 0))
    .slice(0, limit);
}

function portalMetricValue(row, keys) {
  if (!row) return null;
  const metrics = safeJson(row.metrics || row.data || row.payload, {});
  for (const key of keys) {
    const value = row[key] ?? metrics[key];
    if (value !== undefined && value !== null && value !== '') {
      const n = Number(value);
      return Number.isFinite(n) ? n : value;
    }
  }
  return null;
}

function portalSnapshotDate(row) {
  return row.snapshot_date || row.period_date || row.date || row.created_at || row.updated_at || null;
}

function portalPickPreviousSnapshot(rows, days) {
  if (!rows || rows.length < 2) return null;
  const current = new Date(portalSnapshotDate(rows[0]) || 0);
  if (Number.isNaN(current.getTime())) return rows[rows.length - 1];
  const threshold = current.getTime() - (days * 24 * 60 * 60 * 1000);
  return rows.find((row, idx) => idx > 0 && new Date(portalSnapshotDate(row) || 0).getTime() <= threshold) || rows[rows.length - 1];
}

function portalDelta(current, previous, keys) {
  if (!current || !previous) return null;
  const currentValue = portalMetricValue(current, keys);
  const previousValue = portalMetricValue(previous, keys);
  if (currentValue === null || currentValue === undefined || previousValue === null || previousValue === undefined) return null;
  const cur = Number(currentValue);
  const prev = Number(previousValue);
  if (!Number.isFinite(cur) || !Number.isFinite(prev)) return null;
  return cur - prev;
}

function portalSumRows(rows, keys) {
  return (rows || []).reduce((sum, row) => {
    const value = Number(portalMetricValue(row, keys));
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);
}

function portalBuildSocialMetrics({ history, socialSnapshots, metaConfig }) {
  const rows = (Array.isArray(socialSnapshots) ? socialSnapshots : [])
    .slice()
    .sort((a, b) => new Date(portalSnapshotDate(b) || 0) - new Date(portalSnapshotDate(a) || 0));
  const current = rows[0] || null;
  const week = portalPickPreviousSnapshot(rows, 7);
  const month = portalPickPreviousSnapshot(rows, 30);
  const hist = Array.isArray(history) ? history : [];
  const publishedSocial = hist.filter((h) => /published|publicado|success/i.test(h.status || '') && /instagram|ig|facebook|fb/i.test(h.platform || '')).length;
  return {
    configured: !!(metaConfig && (metaConfig.instagram.connected || metaConfig.page.connected)),
    has_history: rows.length > 0,
    last_snapshot_at: current ? portalSnapshotDate(current) : null,
    followers: portalMetricValue(current, ['followers', 'followers_count', 'follower_count', 'ig_followers']),
    followers_growth_7d: portalDelta(current, week, ['followers', 'followers_count', 'follower_count', 'ig_followers']),
    followers_growth_30d: portalDelta(current, month, ['followers', 'followers_count', 'follower_count', 'ig_followers']),
    reach: portalMetricValue(current, ['reach', 'total_reach', 'ig_reach']),
    impressions: portalMetricValue(current, ['impressions', 'total_impressions', 'ig_impressions']),
    profile_views: portalMetricValue(current, ['profile_views', 'profile_view_count']),
    likes: portalMetricValue(current, ['likes', 'like_count']),
    comments: portalMetricValue(current, ['comments', 'comment_count']),
    views: portalMetricValue(current, ['views', 'video_views', 'plays']),
    posts_publicados: publishedSocial,
    chart: rows.slice(0, 60).reverse().map((row) => ({
      date: portalSnapshotDate(row),
      followers: portalMetricValue(row, ['followers', 'followers_count', 'follower_count', 'ig_followers']),
      reach: portalMetricValue(row, ['reach', 'total_reach', 'ig_reach']),
      impressions: portalMetricValue(row, ['impressions', 'total_impressions', 'ig_impressions']),
    })),
  };
}

function portalBuildAdsMetrics({ adsSnapshots, campaignEvents, metaConfig }) {
  const rows = (Array.isArray(adsSnapshots) ? adsSnapshots : [])
    .slice()
    .sort((a, b) => new Date(portalSnapshotDate(b) || 0) - new Date(portalSnapshotDate(a) || 0));
  const current = rows[0] || null;
  const last7 = rows.filter((row) => {
    if (!current) return false;
    const cur = new Date(portalSnapshotDate(current) || 0).getTime();
    const d = new Date(portalSnapshotDate(row) || 0).getTime();
    return Number.isFinite(cur) && Number.isFinite(d) && d >= cur - (7 * 24 * 60 * 60 * 1000);
  });
  const spend = portalMetricValue(current, ['spend', 'investment', 'investimento']);
  const clicks = portalMetricValue(current, ['clicks', 'link_clicks']);
  const impressions = portalMetricValue(current, ['impressions']);
  const ctr = portalMetricValue(current, ['ctr']);
  const cpc = portalMetricValue(current, ['cpc']);
  const cpm = portalMetricValue(current, ['cpm']);
  return {
    configured: !!(metaConfig && metaConfig.ads.connected),
    has_history: rows.length > 0,
    last_snapshot_at: current ? portalSnapshotDate(current) : null,
    spend,
    spend_7d: portalSumRows(last7, ['spend', 'investment', 'investimento']),
    reach: portalMetricValue(current, ['reach']),
    impressions,
    clicks,
    link_clicks: portalMetricValue(current, ['link_clicks']),
    messages: portalMetricValue(current, ['messages', 'messaging_conversations_started', 'whatsapp_conversations']),
    leads: portalMetricValue(current, ['leads', 'lead_count']),
    cpc,
    cpm,
    ctr,
    chart: rows.slice(0, 60).reverse().map((row) => ({
      date: portalSnapshotDate(row),
      spend: portalMetricValue(row, ['spend', 'investment', 'investimento']),
      reach: portalMetricValue(row, ['reach']),
      clicks: portalMetricValue(row, ['clicks', 'link_clicks']),
      impressions: portalMetricValue(row, ['impressions']),
    })),
    campaign_events: (Array.isArray(campaignEvents) ? campaignEvents : []).slice(0, 30).map((row) => ({
      id: row.id,
      title: row.title || row.name || row.campaign_name || 'Campanha',
      type: row.type || row.event_type || 'marco',
      started_at: row.started_at || row.start_date || row.created_at || null,
      ended_at: row.ended_at || row.end_date || null,
      notes: row.notes || row.description || '',
    })),
  };
}

function portalActionValue(actions, names) {
  const rows = Array.isArray(actions) ? actions : [];
  const wanted = new Set(names);
  return rows.reduce((sum, item) => {
    if (wanted.has(item.action_type)) {
      const value = Number(item.value);
      return sum + (Number.isFinite(value) ? value : 0);
    }
    return sum;
  }, 0);
}

function portalDateRange(days) {
  const until = new Date();
  const since = new Date();
  since.setDate(until.getDate() - days);
  const fmt = (d) => d.toISOString().slice(0, 10);
  return { since: fmt(since), until: fmt(until) };
}

async function portalLiveGraph(path, params = {}, token) {
  if (token) {
    const query = new URLSearchParams({ access_token: token, ...params });
    const res = await fetch(`https://graph.facebook.com/v25.0${path}?${query.toString()}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      const err = data && data.error ? data.error : {};
      throw new Error(err.message || `Meta API ${res.status}`);
    }
    return data;
  }
  if (!metaGraphGet) throw new Error('Meta Graph helper indisponível');
  return metaGraphGet(path, params);
}

async function portalFetchLiveMetaMetrics(clientConfig) {
  const c = clientConfig || {};
  const out = {
    social: { collected_at: new Date().toISOString(), errors: [] },
    ads: { collected_at: new Date().toISOString(), errors: [] },
  };
  const token = c.pageAccessToken || '';

  if (c.igUserId) {
    try {
      const ig = await portalLiveGraph(`/${c.igUserId}`, {
        fields: 'username,followers_count,follows_count,media_count',
      }, token);
      out.social.username = ig.username || c.igUsername || '';
      out.social.followers = Number(ig.followers_count || 0);
      out.social.following = Number(ig.follows_count || 0);
      out.social.media_count = Number(ig.media_count || 0);
    } catch (err) {
      out.social.errors.push({ scope: 'instagram_profile', message: err.message });
    }

    try {
      const insights = await portalLiveGraph(`/${c.igUserId}/insights`, {
        metric: 'reach,profile_views,views',
        period: 'day',
        metric_type: 'total_value',
      }, token);
      (insights.data || []).forEach((metric) => {
        const values = metric.values || [];
        const last = values[values.length - 1] || {};
        const rawValue = metric.total_value && metric.total_value.value !== undefined
          ? metric.total_value.value
          : last.value;
        const n = Number(rawValue);
        if (Number.isFinite(n)) {
          if (metric.name === 'reach') out.social.reach = n;
          if (metric.name === 'profile_views') out.social.profile_views = n;
          if (metric.name === 'views') out.social.views = n;
        }
      });
    } catch (err) {
      out.social.errors.push({ scope: 'instagram_insights', message: err.message });
    }
  }

  if (c.pageId) {
    try {
      const page = await portalLiveGraph(`/${c.pageId}`, {
        fields: 'name,fan_count,followers_count',
      }, token);
      out.social.page_name = page.name || c.pageName || '';
      out.social.page_fans = Number(page.fan_count || 0);
      out.social.page_followers = Number(page.followers_count || 0);
    } catch (err) {
      out.social.errors.push({ scope: 'facebook_page', message: err.message });
    }
  }

  if (c.adAccountId) {
    try {
      const range = portalDateRange(7);
      const ads = await portalLiveGraph(`/${c.adAccountId}/insights`, {
        fields: 'spend,impressions,reach,clicks,cpc,cpm,ctr,actions',
        time_range: JSON.stringify(range),
        level: 'account',
        limit: '1',
      });
      const row = (ads.data || [])[0] || {};
      out.ads.spend = Number(row.spend || 0);
      out.ads.spend_7d = Number(row.spend || 0);
      out.ads.impressions = Number(row.impressions || 0);
      out.ads.reach = Number(row.reach || 0);
      out.ads.clicks = Number(row.clicks || 0);
      out.ads.cpc = row.cpc != null ? Number(row.cpc) : null;
      out.ads.cpm = row.cpm != null ? Number(row.cpm) : null;
      out.ads.ctr = row.ctr != null ? Number(row.ctr) : null;
      out.ads.messages = portalActionValue(row.actions, ['onsite_conversion.messaging_conversation_started_7d', 'onsite_conversion.total_messaging_connection', 'post_engagement']);
      out.ads.leads = portalActionValue(row.actions, ['lead', 'onsite_conversion.lead_grouped']);
    } catch (err) {
      out.ads.errors.push({ scope: 'ads_insights', message: err.message });
    }
  }

  return out;
}

function portalApplyLiveMetrics(metrics, live) {
  if (!live) return metrics;
  metrics.social = metrics.social || {};
  metrics.ads = metrics.ads || {};

  const s = live.social || {};
  ['followers', 'reach', 'profile_views', 'views', 'page_fans', 'page_followers', 'media_count'].forEach((key) => {
    if (s[key] !== undefined && s[key] !== null && Number.isFinite(Number(s[key]))) metrics.social[key] = Number(s[key]);
  });
  if (s.collected_at) metrics.social.live_collected_at = s.collected_at;
  if (s.username) metrics.social.username = s.username;
  if (Array.isArray(s.errors) && s.errors.length) metrics.social.live_errors = s.errors.slice(0, 3);

  const a = live.ads || {};
  ['spend', 'spend_7d', 'reach', 'impressions', 'clicks', 'cpc', 'cpm', 'ctr', 'messages', 'leads'].forEach((key) => {
    if (a[key] !== undefined && a[key] !== null && Number.isFinite(Number(a[key]))) metrics.ads[key] = Number(a[key]);
  });
  if (a.collected_at) metrics.ads.live_collected_at = a.collected_at;
  if (Array.isArray(a.errors) && a.errors.length) metrics.ads.live_errors = a.errors.slice(0, 3);

  return metrics;
}

function portalBuildMetrics({ history, tasks, materials, cronogramas }) {
  const hist = Array.isArray(history) ? history : [];
  const taskRows = Array.isArray(tasks) ? tasks : [];
  const byPlatform = (needle) => hist.filter((h) => String(h.platform || '').toLowerCase().includes(needle));
  const summarize = (rows) => ({
    publicados: rows.filter((h) => /published|publicado|success/i.test(h.status || '')).length,
    agendados: rows.filter((h) => /scheduled|agendado|queued|fila/i.test(h.status || '')).length,
    falhas: rows.filter((h) => /failed|erro|error/i.test(h.status || '')).length,
  });
  const openTasks = taskRows.filter((t) => !/publicado|conclu|feito|fechado|aprovado|agendado/i.test(t.status || '')).length;
  return {
    facebook: summarize(byPlatform('facebook').concat(byPlatform('fb'))),
    instagram: summarize(byPlatform('instagram').concat(byPlatform('ig'))),
    trafego_pago: {
      investimento: null,
      alcance: null,
      cliques: null,
      observacao: 'Métricas Meta serão exibidas quando o ativo de anúncios estiver conectado ao cliente.',
    },
    conteudo: {
      tarefas_abertas: openTasks,
      tarefas_total: taskRows.length,
      materiais: (materials || []).length,
      cronogramas: (cronogramas || []).length,
    },
  };
}

function portalUniqueCronogramas(rows) {
  const seen = new Set();
  return (Array.isArray(rows) ? rows : []).filter((row) => {
    const url = row.pdf_url || row.html_url || row.file_url || '';
    const key = row.period_key ? `period:${row.period_key}` : (url ? `url:${url}` : `id:${row.id || ''}`);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// =============================================================================
// 1. hub_get — Full client hub record
// =============================================================================

async function hubGet({ client_slug }) {
  if (!client_slug) return { error: true, message: 'client_slug is required' };

  const data = await sbFetch(
    `/rest/v1/client_hub?client_slug=eq.${encodeURIComponent(client_slug)}&limit=1`,
    { headers: sbHeaders() }
  );

  const hub = Array.isArray(data) ? data[0] : data;
  if (!hub) return { error: true, message: `Hub not found for slug: ${client_slug}` };

  // Counts
  const [matsRes, postsRes] = await Promise.all([
    sbFetch(`/rest/v1/client_hub_materials?client_slug=eq.${encodeURIComponent(client_slug)}&select=id`, {
      method: 'HEAD', headers: { ...sbHeaders(), 'Prefer': 'count=exact' }
    }).catch(() => null),
    sbFetch(`/rest/v1/publish_history?client_slug=eq.${encodeURIComponent(client_slug)}&select=id`, {
      method: 'HEAD', headers: { ...sbHeaders(), 'Prefer': 'count=exact' }
    }).catch(() => null),
  ]);

  return {
    ...hub,
    materials_count: 0,
    recent_posts_count: 0,
    completeness: computeCompleteness(hub),
  };
}

// =============================================================================
// 2. hub_list — List all hubs
// =============================================================================

async function hubList({ tenant }) {
  let path = '/rest/v1/client_hub?select=*&order=client_name.asc';
  if (tenant) path += `&tenant=eq.${encodeURIComponent(tenant)}`;

  const data = await sbFetch(path, { headers: sbHeaders() });

  return (data || []).map((row) => ({
    client_slug: row.client_slug,
    client_name: row.client_name,
    tenant: row.tenant,
    segment: row.segment,
    logo_url: row.logo_url || null,
    status: row.status,
    responsible: row.responsible,
    contract_start: row.contract_start,
    contract_package: row.contract_package,
    completeness: computeCompleteness(row),
  }));
}

// =============================================================================
// 3. hub_upsert — Create or update hub + log activity
// =============================================================================

async function hubUpsert({ client_slug, user, data }) {
  if (!client_slug) return { error: true, message: 'client_slug is required' };
  if (!user) return { error: true, message: 'user is required' };
  if (!data || typeof data !== 'object') {
    return { error: true, message: 'data object is required' };
  }

  const now = new Date().toISOString();

  // Check if exists
  const existing = await sbFetch(
    `/rest/v1/client_hub?client_slug=eq.${encodeURIComponent(client_slug)}&select=client_slug&limit=1`,
    { headers: sbHeaders() }
  );
  const isNew = !existing || (Array.isArray(existing) && existing.length === 0);

  const record = { ...data, client_slug, updated_at: now };
  if (isNew) record.created_at = now;

  // Upsert
  const upserted = await sbFetch('/rest/v1/client_hub?on_conflict=client_slug', {
    method: 'POST',
    headers: sbHeaders('resolution=merge-duplicates,return=representation'),
    body: JSON.stringify(record),
  });

  // Log activity
  await sbFetch('/rest/v1/client_hub_activity', {
    method: 'POST',
    headers: sbHeaders('return=minimal'),
    body: JSON.stringify({
      client_slug,
      actor: user,
      action: isNew ? 'hub_created' : 'hub_updated',
      details: JSON.stringify({ fields: Object.keys(data) }),
      created_at: now,
    }),
  });

  return Array.isArray(upserted) ? upserted[0] : upserted;
}

// =============================================================================
// 4. hub_delete — Soft delete
// =============================================================================

async function hubDelete({ client_slug }) {
  if (!client_slug) return { error: true, message: 'client_slug is required' };

  const data = await sbFetch(
    `/rest/v1/client_hub?client_slug=eq.${encodeURIComponent(client_slug)}`,
    {
      method: 'PATCH',
      headers: sbHeaders('return=representation'),
      body: JSON.stringify({ status: 'encerrado', updated_at: new Date().toISOString() }),
    }
  );

  const row = Array.isArray(data) ? data[0] : data;
  return { success: true, client_slug: row?.client_slug, status: row?.status };
}

// =============================================================================
// 5. hub_activity — Activity log
// =============================================================================

async function hubActivity({ client_slug, limit }) {
  if (!client_slug) return { error: true, message: 'client_slug is required' };

  const cap = Math.min(Number(limit) || 20, 200);

  const data = await sbFetch(
    `/rest/v1/client_hub_activity?client_slug=eq.${encodeURIComponent(client_slug)}&order=created_at.desc&limit=${cap}`,
    { headers: sbHeaders() }
  );

  return (data || []).map((row) => ({
    ...row,
    details: typeof row.details === 'string' ? JSON.parse(row.details) : row.details,
  }));
}

async function hubPortalLogin({ client_slug, pin, client_name }) {
  if (!client_slug) return { error: true, message: 'client_slug is required' };
  if (!pin) return { error: true, message: 'PIN é obrigatório.' };

  const hub = await portalGetHub(client_slug).catch(() => null);
  const storedPin = await portalGetPin(client_slug).catch(() => '');
  const fallbackPin = process.env.STARKEN_PORTAL_DEFAULT_PIN || '';
  const expected = storedPin || fallbackPin;

  if (!expected) {
    return {
      error: true,
      setup_required: true,
      message: 'PIN do portal ainda não configurado para este cliente.',
    };
  }

  const a = Buffer.from(String(pin));
  const b = Buffer.from(String(expected));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { error: true, message: 'PIN inválido.' };
  }

  const safeHub = portalSafeHub(hub, client_slug);
  return {
    success: true,
    token: portalMakeToken({ client_slug, name: safeHub.client_name || client_name || 'Cliente' }),
    client: {
      slug: client_slug,
      name: safeHub.client_name || client_name || client_slug,
      tenant: safeHub.tenant || 'starken',
    },
    hub: safeHub,
  };
}

async function hubPortalBundle({ client_slug, token, trusted_admin }) {
  if (!client_slug) return { error: true, message: 'client_slug is required' };
  const session = trusted_admin
    ? { ok: true, payload: { client_slug, role: 'admin', name: 'Escritório Fenix' } }
    : portalVerifyToken(token, client_slug);
  if (!session.ok) return { error: true, message: session.message };

  const hub = await portalGetHub(client_slug).catch(() => null);
  const safeHub = portalSafeHub(hub, client_slug);
  const clientName = safeHub.client_name || client_slug;

  const materialsRaw = await sbFetch(
    `/rest/v1/client_hub_materials?client_slug=eq.${encodeURIComponent(client_slug)}&order=created_at.desc&limit=500`,
    { headers: sbHeaders() }
  ).catch(() => []);
  const materials = (materialsRaw || []).map(portalSafeMaterial);

  const groupsRaw = await sbFetch(
    `/rest/v1/content_groups?client_id=eq.${encodeURIComponent(client_slug)}&order=created_at.desc&limit=200`,
    { headers: sbHeaders() }
  ).catch(() => []);

  const groups = [];
  const taskIds = [];
  for (const group of (groupsRaw || [])) {
    const tasksRaw = await sbFetch(
      `/rest/v1/content_tasks?group_id=eq.${encodeURIComponent(group.id)}&order=position.asc,created_at.asc&limit=500`,
      { headers: sbHeaders() }
    ).catch(() => []);
    const tasks = (tasksRaw || []).map((row) => {
      const task = portalSafeTask(row, group);
      if (task.id) taskIds.push(task.id);
      return task;
    });
    groups.push({
      id: group.id,
      client_id: group.client_id,
      name: group.name,
      type: group.type || null,
      created_at: group.created_at || null,
      updated_at: group.updated_at || null,
      tasks,
    });
  }

  if (taskIds.length) {
    for (let i = 0; i < taskIds.length; i += 80) {
      const batch = taskIds.slice(i, i + 80);
      const attachments = await sbFetch(
        `/rest/v1/content_attachments?task_id=in.(${batch.map(encodeURIComponent).join(',')})&select=id,task_id,file_url,file_type,file_name,category,created_at&order=created_at.desc`,
        { headers: sbHeaders() }
      ).catch(() => []);
      const byId = new Map();
      groups.forEach((g) => (g.tasks || []).forEach((t) => byId.set(String(t.id), t)));
      (attachments || []).forEach((a) => {
        const t = byId.get(String(a.task_id));
        if (t && a.file_url) t.attachments.push(a);
      });
    }
  }

  const historyRaw = await sbFetch('/rest/v1/publish_history?select=*&order=created_at.desc&limit=1000', { headers: sbHeaders() }).catch(() => []);
  const history = (historyRaw || [])
    .filter((row) => portalMatchesClient(row, client_slug, clientName))
    .slice(0, 200)
    .map(portalSafeHistory);

  const tasksById = new Map();
  groups.forEach((group) => {
    (group.tasks || []).forEach((task) => {
      if (task && task.id) tasksById.set(String(task.id), task);
    });
  });
  history.forEach((row) => {
    const taskId = row && row.task_id ? String(row.task_id) : '';
    const task = taskId ? tasksById.get(taskId) : null;
    if (task) task.publish_history.push(row);
  });

  const cronRaw = await sbFetch('/rest/v1/cronograma_status?select=*&order=updated_at.desc&limit=500', { headers: sbHeaders() }).catch(() => []);
  const cronogramaRows = (cronRaw || [])
    .filter((row) => portalMatchesClient(row, client_slug, clientName))
    .slice(0, 120);

  const activityRaw = await sbFetch(
    `/rest/v1/client_hub_activity?client_slug=eq.${encodeURIComponent(client_slug)}&order=created_at.desc&limit=80`,
    { headers: sbHeaders() }
  ).catch(() => []);
  const activities = (activityRaw || []).map((row) => ({
    id: row.id,
    client_slug: row.client_slug,
    actor: row.actor,
    action: row.action,
    details: safeJson(row.details, {}),
    created_at: row.created_at,
  }));

  const metaConfigRaw = await portalGetMetaConfig().catch(() => ({ clients: {} }));
  const metaClientConfig = portalFindMetaClient(metaConfigRaw, client_slug, clientName);
  const safeMetaConfig = portalSafeMetaConfig(metaClientConfig);
  const [socialSnapshots, adsSnapshots, campaignEvents] = await Promise.all([
    portalOptionalTableRows('social_metrics_snapshots', client_slug, clientName, 180),
    portalOptionalTableRows('ads_metrics_snapshots', client_slug, clientName, 180),
    portalOptionalTableRows('client_campaign_events', client_slug, clientName, 80),
  ]);
  const liveMetaMetrics = await portalFetchLiveMetaMetrics(metaClientConfig).catch((err) => ({
    social: { errors: [{ scope: 'live_fetch', message: err.message }] },
    ads: { errors: [{ scope: 'live_fetch', message: err.message }] },
  }));

  const flatTasks = groups.flatMap((g) => (g.tasks || []));
  const cronogramaMetricRows = portalUniqueCronogramas(cronogramaRows.concat(materials.filter((m) => m.category === 'cronograma')));
  const metrics = portalBuildMetrics({ history, tasks: flatTasks, materials, cronogramas: cronogramaMetricRows });
  metrics.social = portalBuildSocialMetrics({ history, socialSnapshots, metaConfig: safeMetaConfig });
  metrics.ads = portalBuildAdsMetrics({ adsSnapshots, campaignEvents, metaConfig: safeMetaConfig });
  portalApplyLiveMetrics(metrics, liveMetaMetrics);

  return {
    success: true,
    session: session.payload,
    client: { slug: client_slug, name: clientName, tenant: safeHub.tenant || 'starken' },
    hub: safeHub,
    groups,
    tasks: flatTasks,
    materials,
    history,
    cronogramaRows,
    activities,
    metaConfig: safeMetaConfig,
    socialSnapshots: socialSnapshots.slice(0, 90),
    adsSnapshots: adsSnapshots.slice(0, 90),
    campaignEvents,
    liveMetaMetrics,
    metrics,
  };
}

async function hubPortalAdminBundle({ client_slug }) {
  return hubPortalBundle({ client_slug, trusted_admin: true });
}

async function hubPortalFeedback({
  client_slug,
  user,
  token,
  feedback_type,
  message,
  cronograma_url,
  period_key,
  material_id,
  title,
}) {
  if (!client_slug) return { error: true, message: 'client_slug is required' };
  if (!message) return { error: true, message: 'message is required' };
  if (user === 'Cliente') {
    const session = portalVerifyToken(token, client_slug);
    if (!session.ok) return { error: true, message: session.message };
  }

  const now = new Date().toISOString();
  const details = {
    type: feedback_type || 'general',
    message,
    cronograma_url: cronograma_url || null,
    period_key: period_key || null,
    material_id: material_id || null,
    title: title || null,
  };

  const data = await sbFetch('/rest/v1/client_hub_activity', {
    method: 'POST',
    headers: sbHeaders('return=representation'),
    body: JSON.stringify({
      client_slug,
      actor: user || 'Cliente',
      action: 'portal_feedback',
      details: JSON.stringify(details),
      created_at: now,
    }),
  });

  return {
    success: true,
    feedback: Array.isArray(data) ? data[0] : data,
  };
}

// =============================================================================
// 6. hub_bulk_init — Bootstrap from meta_config
// =============================================================================

async function hubBulkInit({ user }) {
  if (!user) return { error: true, message: 'user is required' };

  const now = new Date().toISOString();

  // Fetch all meta_config clients
  const clients = await sbFetch('/rest/v1/meta_config?select=*', { headers: sbHeaders() });
  if (!clients || clients.length === 0) {
    return { created: 0, message: 'No clients found in meta_config' };
  }

  // Fetch existing hub slugs
  const existingHubs = await sbFetch('/rest/v1/client_hub?select=client_slug', { headers: sbHeaders() });
  const existingSlugs = new Set((existingHubs || []).map((h) => h.client_slug));

  const newHubs = [];
  for (const client of clients) {
    const slug = client.client_slug || client.clientSlug || client.slug;
    if (!slug || existingSlugs.has(slug)) continue;

    const socialLinks = {};
    if (client.igUsername) socialLinks.instagram = `https://instagram.com/${client.igUsername}`;
    if (client.pageId) socialLinks.facebook = `https://facebook.com/${client.pageId}`;

    newHubs.push({
      client_slug: slug,
      client_name: client.name || client.clientName || slug,
      tenant: client.tenant || null,
      status: 'ativo',
      social_links: Object.keys(socialLinks).length > 0 ? socialLinks : null,
      created_at: now,
      updated_at: now,
    });
  }

  if (newHubs.length === 0) {
    return { created: 0, message: 'All clients already have hubs' };
  }

  await sbFetch('/rest/v1/client_hub', {
    method: 'POST',
    headers: sbHeaders('return=minimal'),
    body: JSON.stringify(newHubs),
  });

  // Log activity
  await sbFetch('/rest/v1/client_hub_activity', {
    method: 'POST',
    headers: sbHeaders('return=minimal'),
    body: JSON.stringify(
      newHubs.map((h) => ({
        client_slug: h.client_slug,
        actor: user,
        action: 'hub_bulk_created',
        details: JSON.stringify({ source: 'meta_config' }),
        created_at: now,
      }))
    ),
  });

  return { created: newHubs.length, slugs: newHubs.map((h) => h.client_slug) };
}

// =============================================================================
// 7. hub_materials_list
// =============================================================================

async function hubMaterialsList({ client_slug, category }) {
  if (!client_slug) return { error: true, message: 'client_slug is required' };

  let path = `/rest/v1/client_hub_materials?client_slug=eq.${encodeURIComponent(client_slug)}&order=created_at.desc`;
  if (category && category !== 'all') path += `&category=eq.${encodeURIComponent(category)}`;

  const data = await sbFetch(path, { headers: sbHeaders() });
  return data || [];
}

// =============================================================================
// 8. hub_materials_delete
// =============================================================================

async function hubMaterialsDelete({ client_slug, material_id }) {
  if (!client_slug) return { error: true, message: 'client_slug is required' };
  if (!material_id) return { error: true, message: 'material_id is required' };

  // Fetch first
  const mats = await sbFetch(
    `/rest/v1/client_hub_materials?id=eq.${encodeURIComponent(material_id)}&client_slug=eq.${encodeURIComponent(client_slug)}&limit=1`,
    { headers: sbHeaders() }
  );
  const mat = Array.isArray(mats) ? mats[0] : null;
  if (!mat) return { error: true, message: 'Material not found' };

  // Delete storage file if path exists
  if (mat.storage_path) await deleteHubStorageObject(mat.storage_path);

  // Delete DB record
  await sbFetch(
    `/rest/v1/client_hub_materials?id=eq.${encodeURIComponent(material_id)}&client_slug=eq.${encodeURIComponent(client_slug)}`,
    { method: 'DELETE', headers: sbHeaders() }
  );

  return { success: true, deleted_id: material_id };
}

// =============================================================================
// 9. hub_materials_insert
// =============================================================================

async function hubMaterialsInsert({ client_slug, user, material }) {
  if (!client_slug) return { error: true, message: 'client_slug is required' };
  if (!material || !material.file_name) return { error: true, message: 'material.file_name is required' };

  const now = new Date().toISOString();

  const record = {
    client_slug,
    file_name:    material.file_name,
    file_url:     material.file_url     || null,
    storage_path: material.storage_path || null,
    category:     normalizeHubMaterialCategory(material.category),
    mime_type:    material.mime_type     || null,
    file_size:    material.file_size    || null,
    uploaded_by:  user || 'Sistema',
    created_at:   now,
  };

  const data = await sbFetch('/rest/v1/client_hub_materials', {
    method: 'POST',
    headers: sbHeaders('return=representation'),
    body: JSON.stringify(record),
  });

  return Array.isArray(data) ? data[0] : data;
}

// 10. hub_materials_upload — Upload file to Supabase Storage + insert record
// =============================================================================

async function hubMaterialsUpload({ client_slug, user, file_name, file_base64, mime_type, category, file_size }) {
  if (!client_slug) return { error: true, message: 'client_slug is required' };
  if (!file_base64) return { error: true, message: 'file_base64 is required' };
  if (!file_name) return { error: true, message: 'file_name is required' };

  const url = SUPABASE_URL();
  const key = SUPABASE_KEY();
  if (!url) throw new Error('SUPABASE_URL not configured');
  if (/^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?\b/i.test(url)) {
    return {
      error: true,
      message: 'SUPABASE_URL está apontando para Storage local. Configure a API com o Supabase público antes de salvar materiais.',
    };
  }

  // Generate unique storage path
  const ext = file_name.split('.').pop() || 'bin';
  const safeName = file_name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${client_slug}/${Date.now()}_${safeName}`;

  // Decode base64 to binary
  const binaryStr = atob(file_base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  // Upload to Supabase Storage
  const uploadRes = await fetch(
    `${url}/storage/v1/object/client-hub-materials/${storagePath}`,
    {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': mime_type || 'application/octet-stream',
        'x-upsert': 'true',
      },
      body: bytes,
    }
  );

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    return { error: true, message: `Storage upload failed: ${errText.substring(0, 200)}` };
  }

  // Build public URL
  const fileUrl = `${url}/storage/v1/object/public/client-hub-materials/${storagePath}`;

  const verifyRes = await fetch(fileUrl, {
    method: 'GET',
    headers: { Range: 'bytes=0-0' },
  }).catch((error) => ({ ok: false, status: 'NETWORK', statusText: error?.message || 'Network error' }));

  if (!verifyRes.ok) {
    await deleteHubStorageObject(storagePath);
    return {
      error: true,
      message: `Upload feito, mas a URL pública não abriu (${verifyRes.status} ${verifyRes.statusText || ''}). Registro não foi salvo.`,
      storage_path: storagePath,
      file_url: fileUrl,
    };
  }

  // Insert material record
  const record = {
    client_slug,
    file_name,
    file_url: fileUrl,
    storage_path: storagePath,
    category: normalizeHubMaterialCategory(category),
    mime_type: mime_type || null,
    file_size: file_size || bytes.length,
    uploaded_by: user || 'Sistema',
    created_at: new Date().toISOString(),
  };

  let data;
  try {
    data = await sbFetch('/rest/v1/client_hub_materials', {
      method: 'POST',
      headers: sbHeaders('return=representation'),
      body: JSON.stringify(record),
    });
  } catch (error) {
    await deleteHubStorageObject(storagePath);
    return {
      error: true,
      message: `Arquivo enviado, mas o registro no banco falhou: ${error?.message || error}`,
      storage_path: storagePath,
      file_url: fileUrl,
    };
  }

  const inserted = Array.isArray(data) ? data[0] : data;
  return { ...inserted, file_url: fileUrl };
}

// =============================================================================
// Action router
// =============================================================================

const ACTIONS = {
  hub_get: hubGet,
  hub_list: hubList,
  hub_upsert: hubUpsert,
  hub_delete: hubDelete,
  hub_activity: hubActivity,
  hub_portal_login: hubPortalLogin,
  hub_portal_bundle: hubPortalBundle,
  hub_portal_admin_bundle: hubPortalAdminBundle,
  hub_portal_feedback: hubPortalFeedback,
  hub_bulk_init: hubBulkInit,
  hub_materials_list:   hubMaterialsList,
  hub_materials_delete: hubMaterialsDelete,
  hub_materials_insert: hubMaterialsInsert,
  hub_materials_upload: hubMaterialsUpload,
};

// =============================================================================
// Asana task helpers (legacy GET/PUT/POST without hub action)
// =============================================================================

const ASANA_BASE = 'https://app.asana.com/api/1.0';

function asanaHeaders() {
  const token = process.env.ASANA_PAT;
  if (!token) throw new Error('ASANA_PAT not configured');
  return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function asanaListTasks(query) {
  const project = query.project;
  if (!project) return { error: true, message: 'project query param is required' };

  const completed = query.completed || 'false';
  let url;
  if (completed === 'all') {
    url = `${ASANA_BASE}/tasks?project=${project}&opt_fields=name,completed,completed_at,due_on,assignee.name&limit=100`;
  } else {
    url = `${ASANA_BASE}/tasks?project=${project}&completed_since=now&opt_fields=name,completed,completed_at,due_on,assignee.name&limit=100`;
  }

  const resp = await fetch(url, { headers: asanaHeaders() });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Asana API ${resp.status}: ${err.substring(0, 300)}`);
  }
  return resp.json();
}

async function asanaCompleteTask(body) {
  const { task_gid, completed } = body;
  if (!task_gid) return { error: true, message: 'task_gid is required' };

  const resp = await fetch(`${ASANA_BASE}/tasks/${task_gid}`, {
    method: 'PUT',
    headers: asanaHeaders(),
    body: JSON.stringify({ data: { completed: !!completed } }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Asana API ${resp.status}: ${err.substring(0, 300)}`);
  }
  return resp.json();
}

async function asanaCreateTask(body) {
  const { name, project, due_on, notes } = body;
  if (!name) return { error: true, message: 'name is required' };

  const taskData = { name };
  if (project) taskData.projects = [project];
  if (due_on) taskData.due_on = due_on;
  if (notes) taskData.notes = notes;

  const resp = await fetch(`${ASANA_BASE}/tasks`, {
    method: 'POST',
    headers: asanaHeaders(),
    body: JSON.stringify({ data: taskData }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Asana API ${resp.status}: ${err.substring(0, 300)}`);
  }
  return resp.json();
}

// =============================================================================
// Main handler
// =============================================================================

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── GET: Legacy Asana task listing ──
  if (req.method === 'GET') {
    try {
      const result = await asanaListTasks(req.query || {});
      if (result && result.error === true) return res.status(400).json(result);
      return res.status(200).json(result);
    } catch (err) {
      console.error('[asana-tasks] GET error:', err);
      return res.status(500).json({ error: true, message: err.message });
    }
  }

  // ── PUT: Legacy Asana task completion ──
  if (req.method === 'PUT') {
    try {
      const result = await asanaCompleteTask(req.body || {});
      if (result && result.error === true) return res.status(400).json(result);
      return res.status(200).json(result);
    } catch (err) {
      console.error('[asana-tasks] PUT error:', err);
      return res.status(500).json({ error: true, message: err.message });
    }
  }

  // ── POST: Route by action field ──
  if (req.method !== 'POST') {
    return res.status(405).json({ error: true, message: 'Method not allowed' });
  }

  const body = req.body || {};
  const { action, ...params } = body;

  // No action field → legacy Asana task creation
  if (!action) {
    try {
      const result = await asanaCreateTask(body);
      if (result && result.error === true) return res.status(400).json(result);
      return res.status(200).json(result);
    } catch (err) {
      console.error('[asana-tasks] POST create error:', err);
      return res.status(500).json({ error: true, message: err.message });
    }
  }

  // Action field present → Client Hub routing
  const fn = ACTIONS[action];
  if (!fn) {
    return res.status(400).json({
      error: true,
      message: `Unknown action: ${action}. Valid: ${Object.keys(ACTIONS).join(', ')}`,
    });
  }

  try {
    const result = await fn(params);

    if (result && result.error === true) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error(`[client-hub] action=${action} error:`, err);
    return res.status(500).json({
      error: true,
      message: err.message || 'Internal server error',
    });
  }
};
