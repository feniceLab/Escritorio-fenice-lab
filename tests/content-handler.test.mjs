import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock environment before importing handler
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'test-key';

const handler = (await import('../api/content.js')).default;

function mockReq(method, query = {}, body = {}) {
  return { method, query, body };
}

function mockRes() {
  const res = {
    _status: null,
    _json: null,
    _headers: {},
    _ended: false,
    setHeader(key, value) {
      res._headers[key] = value;
      return res;
    },
    status(code) {
      res._status = code;
      return res;
    },
    json(data) {
      res._json = data;
      return res;
    },
    end() {
      res._ended = true;
      return res;
    },
  };
  return res;
}

describe('Content API Handler', () => {
  it('returns 204 for OPTIONS (CORS preflight)', async () => {
    const req = mockReq('OPTIONS');
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(204);
    expect(res._ended).toBe(true);
  });

  it('returns 405 for unsupported methods', async () => {
    const req = mockReq('PUT');
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(405);
    expect(res._json.error).toContain('GET ou POST');
  });

  it('returns 400 when action is missing', async () => {
    const req = mockReq('POST', {}, {});
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res._json.error).toContain('action');
  });

  it('returns 400 for unknown action', async () => {
    const req = mockReq('POST', {}, { action: 'nonexistent_action' });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res._json.error).toContain('nonexistent_action');
  });

  it('extracts action from GET query params', async () => {
    const req = mockReq('GET', { action: 'unknown_test_action' });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res._json.error).toContain('unknown_test_action');
  });

  it('sets CORS headers on every request', async () => {
    const req = mockReq('POST', {}, { action: 'test' });
    const res = mockRes();
    await handler(req, res);
    expect(res._headers['Access-Control-Allow-Origin']).toBe('*');
    expect(res._headers['Access-Control-Allow-Methods']).toContain('POST');
  });

  it('returns 400 when list_groups called without client_id', async () => {
    // list_groups requires client_id — calling without it should return 400
    // We need to mock fetch for the Supabase call, but list_groups validates first
    const req = mockReq('POST', {}, { action: 'list_groups' });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res._json.error).toContain('client_id');
  });
});
