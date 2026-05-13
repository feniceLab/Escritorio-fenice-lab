/**
 * _lib/graph.js — Serviço base de conexão com Meta Graph API v25.0
 *
 * Centraliza: base URL, injeção de token, tratamento de erros,
 * retry em rate-limit (HTTP 429) e timeout.
 *
 * Exports: graphGet(path, params), graphPost(path, body)
 */

const BASE_URL = 'https://graph.facebook.com/v25.0';
const TIMEOUT_MS = 15000;
const TIMEOUT_VIDEO_MS = 120000; // 120s for video uploads (Meta needs time to download large files)
const MAX_RETRIES = 2;

function getToken() {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) throw { error: true, code: 'TOKEN_MISSING', message: 'META_ACCESS_TOKEN not configured' };
  return token;
}

function normalizeError(metaError, status) {
  const err = metaError?.error || {};
  return {
    error: true,
    code: err.code === 190 ? 'TOKEN_EXPIRED' : 'META_API_ERROR',
    message: err.message || 'Unknown Meta API error',
    meta_code: err.code || null,
    meta_subcode: err.error_subcode || null,
    fbtrace_id: err.fbtrace_id || null,
    status,
  };
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs || TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

async function requestWithRetry(url, options, retries = 0, timeoutMs) {
  const response = await fetchWithTimeout(url, options, timeoutMs);

  if (response.status === 429 && retries < MAX_RETRIES) {
    const retryAfter = parseInt(response.headers.get('Retry-After') || '2', 10);
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
    return requestWithRetry(url, options, retries + 1, timeoutMs);
  }

  return response;
}

/**
 * GET request to Graph API
 * @param {string} path - e.g. '/act_123456789' or '/me/accounts'
 * @param {object} params - query parameters (fields, time_range, etc.)
 * @returns {Promise<object>} parsed JSON response
 */
async function graphGet(path, params = {}) {
  const token = getToken();
  const query = new URLSearchParams({ access_token: token, ...params });
  const url = `${BASE_URL}${path}?${query.toString()}`;

  const response = await requestWithRetry(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  const data = await response.json();

  if (!response.ok) {
    throw normalizeError(data, response.status);
  }

  return data;
}

/**
 * POST request to Graph API
 * @param {string} path - e.g. '/{page_id}/feed'
 * @param {object} body - request body fields
 * @param {object} opts - { videoMode: true } for extended timeout on video uploads
 * @returns {Promise<object>} parsed JSON response
 */
async function graphPost(path, body = {}, opts = {}) {
  const token = getToken();
  const url = `${BASE_URL}${path}`;

  const postBody = { access_token: token, ...body };
  const timeoutMs = opts.videoMode ? TIMEOUT_VIDEO_MS : undefined;

  const response = await requestWithRetry(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(postBody),
  }, 0, timeoutMs);

  const data = await response.json();

  if (!response.ok) {
    throw normalizeError(data, response.status);
  }

  return data;
}

/**
 * POST request using application/x-www-form-urlencoded
 * Necessário para attached_media e outros params que Meta não aceita em JSON
 */
async function graphPostForm(path, body = {}) {
  const token = getToken();
  const url = `${BASE_URL}${path}`;

  const params = new URLSearchParams();
  params.append('access_token', token);
  for (const [key, value] of Object.entries(body)) {
    if (value !== undefined && value !== null) {
      params.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
    }
  }

  const response = await requestWithRetry(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: params.toString(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw normalizeError(data, response.status);
  }

  return data;
}

/**
 * DELETE request to Graph API
 * Used to delete/cancel posts and scheduled posts
 */
async function graphDelete(path, params = {}) {
  const token = getToken();
  const query = new URLSearchParams({ access_token: token, ...params });
  const url = `${BASE_URL}${path}?${query.toString()}`;

  const response = await requestWithRetry(url, {
    method: 'DELETE',
    headers: { 'Accept': 'application/json' },
  });

  const data = await response.json();

  if (!response.ok) {
    throw normalizeError(data, response.status);
  }

  return data;
}

/**
 * Verify a media URL is accessible before sending to Meta API
 * Returns { ok, size, contentType } or throws with details
 */
async function verifyMediaUrl(url) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) {
      throw { error: true, code: 'MEDIA_URL_INACCESSIBLE', message: `Mídia inacessível (HTTP ${res.status}): ${url}` };
    }
    return {
      ok: true,
      size: parseInt(res.headers.get('content-length') || '0', 10),
      contentType: res.headers.get('content-type') || 'unknown',
    };
  } catch (e) {
    if (e.code === 'MEDIA_URL_INACCESSIBLE') throw e;
    throw { error: true, code: 'MEDIA_URL_INACCESSIBLE', message: `Não foi possível acessar a mídia: ${e.message}. URL: ${url}` };
  }
}

module.exports = { graphGet, graphPost, graphPostForm, graphDelete, verifyMediaUrl, BASE_URL, TIMEOUT_VIDEO_MS };
