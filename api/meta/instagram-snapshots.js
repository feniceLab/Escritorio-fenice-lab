/**
 * /api/meta/instagram-snapshots — Histórico de métricas do Instagram 360
 *
 * GET  ?client=slug
 * POST { client, snapshot }
 *
 * Usa a tabela Supabase instagram_snapshots quando disponível. Se a tabela ainda
 * não existir, retorna vazio sem quebrar a tela.
 */

const { getClient } = require('./_lib/tenants');

const SUPABASE_URL = () => process.env.SUPABASE_URL || '';
const SUPABASE_KEY = () => process.env.SUPABASE_SERVICE_KEY || '';

function sbHeaders(prefer) {
  const key = SUPABASE_KEY();
  const h = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
  if (prefer) h.Prefer = prefer;
  return h;
}

async function sbFetch(path, options) {
  const url = SUPABASE_URL();
  const key = SUPABASE_KEY();
  if (!url || !key) throw new Error('Supabase não configurado');
  const res = await fetch(`${url}${path}`, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Supabase ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const clientKey = req.query.client || req.query.client_slug || (req.body && (req.body.client || req.body.client_slug));
  if (!clientKey) return res.status(400).json({ error: true, code: 'MISSING_PARAM', message: 'client é obrigatório' });

  let client;
  try {
    client = await getClient(clientKey);
  } catch (err) {
    return res.status(400).json(err);
  }

  if (req.method === 'GET') {
    try {
      const rows = await sbFetch(
        `/rest/v1/instagram_snapshots?client_slug=eq.${encodeURIComponent(client.key)}&order=collected_at.asc&limit=240`,
        { headers: sbHeaders() }
      );
      return res.status(200).json({ ok: true, snapshots: Array.isArray(rows) ? rows : [] });
    } catch (err) {
      return res.status(200).json({ ok: true, snapshots: [], warning: 'instagram_snapshots indisponível' });
    }
  }

  if (req.method === 'POST') {
    const snapshot = (req.body && req.body.snapshot) || {};
    const collectedAt = snapshot.collected_at || new Date().toISOString();
    const record = {
      client_slug: client.key,
      ig_user_id: client.igUserId || null,
      followers_count: Number(snapshot.followers_count || 0),
      follows_count: Number(snapshot.follows_count || 0),
      media_count: Number(snapshot.media_count || 0),
      reach: Number(snapshot.reach || 0),
      profile_views: Number(snapshot.profile_views || 0),
      views: Number(snapshot.views || 0),
      source: snapshot.source || 'instagram_360',
      snapshot_date: String(snapshot.snapshot_date || todayKey()),
      collected_at: collectedAt,
    };

    try {
      const saved = await sbFetch('/rest/v1/instagram_snapshots?on_conflict=client_slug,snapshot_date', {
        method: 'POST',
        headers: sbHeaders('resolution=merge-duplicates,return=representation'),
        body: JSON.stringify(record),
      });
      return res.status(200).json({ ok: true, snapshot: Array.isArray(saved) ? saved[0] : saved });
    } catch (err) {
      return res.status(200).json({ ok: false, warning: 'instagram_snapshots indisponível', message: err.message });
    }
  }

  return res.status(405).json({ error: true, code: 'METHOD_NOT_ALLOWED', message: 'Use GET ou POST' });
};
