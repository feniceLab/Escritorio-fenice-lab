/**
 * /api/meta/config — Salvar/carregar mapeamento de clientes
 *
 * GET  — Retorna config atual (estrutura baseada em clientes)
 * POST — Salva nova config
 *
 * Body POST:
 * {
 *   clients: {
 *     "super-x": {
 *       name: "Super X",
 *       tenant: "starken",
 *       pageId: "123",
 *       pageName: "Super X - Itapoá",
 *       pageAccessToken: "EAA...",
 *       igUserId: "456",
 *       igUsername: "@superx_itapoa",
 *       adAccountId: "act_789",
 *       adAccountName: "Super X - Conta"
 *     }
 *   },
 *   tenants: {
 *     starken: { name: "Starken Performance" },
 *     alpha: { name: "Alpha Assessoria" }
 *   }
 * }
 */

const { loadConfig, saveConfig } = require('./_lib/tenants');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // ─── GET: Retorna config atual ───
  if (req.method === 'GET') {
    try {
      const config = await loadConfig();
      return res.status(200).json({
        configured: !!config,
        config: config || { clients: {}, tenants: { starken: { name: 'Starken Performance' }, alpha: { name: 'Alpha Assessoria' } } },
      });
    } catch (err) {
      return res.status(500).json({
        error: true,
        code: 'INTERNAL_ERROR',
        message: err.message || 'Erro ao carregar config',
      });
    }
  }

  // ─── POST: Salva config ───
  if (req.method === 'POST') {
    const { clients, tenants } = req.body || {};

    if (!clients || typeof clients !== 'object') {
      return res.status(400).json({
        error: true,
        code: 'MISSING_PARAM',
        message: 'Body deve conter { clients: { "id-cliente": { name, tenant, pageId, adAccountId, ... } }, tenants: {...} }',
      });
    }

    try {
      const config = {
        clients,
        tenants: tenants || { starken: { name: 'Starken Performance' }, alpha: { name: 'Alpha Assessoria' } },
        updated_at: new Date().toISOString(),
      };

      await saveConfig(config);

      return res.status(200).json({ ok: true, config });
    } catch (err) {
      if (err.error) return res.status(500).json(err);
      return res.status(500).json({
        error: true,
        code: 'INTERNAL_ERROR',
        message: err.message || 'Erro ao salvar config',
      });
    }
  }

  return res.status(405).json({ error: true, code: 'METHOD_NOT_ALLOWED', message: 'Use GET ou POST' });
};
