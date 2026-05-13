/**
 * _lib/tenants.js — Configuração multi-tenant dinâmica (baseada em clientes)
 *
 * O mapeamento cliente → recursos Meta é salvo no Supabase (tabela meta_config).
 * Cada cliente possui um tenant (starken | alpha) e seus próprios ativos Meta.
 *
 * Funções principais:
 * - getTenant(tenantKey)    — Agrega todos os clientes de um tenant
 * - getClient(clientKey)   — Retorna config de um cliente específico
 * - validateTenant(req,res) — Valida param "tenant" e retorna dados agregados
 *
 * Env vars necessárias: apenas META_ACCESS_TOKEN
 */

const SUPABASE_URL = () => process.env.SUPABASE_URL || '';
const SUPABASE_KEY = () => process.env.SUPABASE_SERVICE_KEY || '';

// Cache em memória (reusado entre invocações warm do Vercel)
let _configCache = null;
let _configCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Carrega config de mapeamento do Supabase
 * Tabela: meta_config (id='default', config=JSON com estrutura de clientes)
 */
async function loadConfig() {
  const now = Date.now();
  if (_configCache && (now - _configCacheTime) < CACHE_TTL) {
    return _configCache;
  }

  const url = SUPABASE_URL();
  const key = SUPABASE_KEY();

  if (url && key) {
    try {
      const res = await fetch(
        `${url}/rest/v1/meta_config?id=eq.default&select=config`,
        { headers: { 'apikey': key, 'Authorization': `Bearer ${key}` } }
      );
      if (res.ok) {
        const rows = await res.json();
        if (rows.length > 0 && rows[0].config) {
          _configCache = rows[0].config;
          _configCacheTime = now;
          return _configCache;
        }
      }
    } catch (e) {
      // Supabase indisponível — usa cache se existir
    }
  }

  return _configCache || null;
}

/**
 * Salva config de mapeamento no Supabase
 */
async function saveConfig(config) {
  const url = SUPABASE_URL();
  const key = SUPABASE_KEY();

  if (!url || !key) {
    throw { error: true, code: 'NO_SUPABASE', message: 'Supabase não configurado para salvar config' };
  }

  const res = await fetch(`${url}/rest/v1/meta_config`, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      id: 'default',
      config: config,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw { error: true, code: 'SAVE_FAILED', message: 'Falha ao salvar config: ' + err };
  }

  // Invalida cache para forçar recarga na próxima chamada
  _configCache = config;
  _configCacheTime = Date.now();
  return config;
}

/**
 * Retorna config de um cliente específico
 * @param {string} clientKey - chave do cliente (ex: 'super-x')
 * @returns {{ key, name, tenant, adAccountId, adAccountIds, pageId, igUserId, igUsername, pageAccessToken, pageName }}
 */
async function getClient(clientKey) {
  const config = await loadConfig();

  if (!config || !config.clients || !config.clients[clientKey]) {
    throw {
      error: true,
      code: 'CLIENT_NOT_CONFIGURED',
      message: `Cliente "${clientKey}" não encontrado. Use a tela de Configuração Meta para cadastrar clientes.`,
    };
  }

  const c = config.clients[clientKey];
  return {
    key: clientKey,
    name: c.name || clientKey,
    tenant: c.tenant || null,
    adAccountId: c.adAccountId || null,
    // Mantém compatibilidade com endpoints que esperam adAccountIds (array)
    adAccountIds: c.adAccountId ? [c.adAccountId] : [],
    pageId: c.pageId || null,
    pageName: c.pageName || null,
    pageAccessToken: c.pageAccessToken || null,
    igUserId: c.igUserId || null,
    igUsername: c.igUsername || null,
  };
}

/**
 * Agrega todos os clientes de um tenant em um único objeto de tenant
 * Mantém compatibilidade total com balance.js e insights.js que usam adAccountIds[]
 *
 * @param {string} tenantKey - 'starken' ou 'alpha'
 * @returns {{ key, name, adAccountIds, clients, pageId, igUserId, pageAccessToken }}
 */
async function getTenant(tenantKey) {
  const config = await loadConfig();

  if (!config) {
    throw {
      error: true,
      code: 'NOT_CONFIGURED',
      message: 'Nenhuma configuração encontrada. Use a tela de Configuração Meta para cadastrar clientes.',
    };
  }

  // Suporta config legada (estrutura antiga com tenants diretos)
  if (!config.clients && config.tenants && config.tenants[tenantKey]) {
    const t = config.tenants[tenantKey];
    return {
      key: tenantKey,
      name: t.name || tenantKey,
      adAccountIds: t.adAccountIds || [],
      pageId: t.pageId || null,
      pageAccessToken: t.pageAccessToken || null,
      igUserId: t.igUserId || null,
      clients: [],
    };
  }

  // Nova estrutura baseada em clientes
  const clients = config.clients || {};
  const tenantMeta = (config.tenants && config.tenants[tenantKey]) || {};

  // Filtra clientes do tenant solicitado
  const tenantClients = Object.entries(clients)
    .filter(([, c]) => c.tenant === tenantKey)
    .map(([key, c]) => ({
      key,
      name: c.name || key,
      adAccountId: c.adAccountId || null,
      adAccountIds: c.adAccountId ? [c.adAccountId] : [],
      pageId: c.pageId || null,
      pageName: c.pageName || null,
      pageAccessToken: c.pageAccessToken || null,
      igUserId: c.igUserId || null,
      igUsername: c.igUsername || null,
    }));

  if (tenantClients.length === 0 && !tenantMeta.name) {
    throw {
      error: true,
      code: 'TENANT_NOT_CONFIGURED',
      message: `Tenant "${tenantKey}" não possui clientes configurados. Use a tela de Configuração Meta para cadastrar clientes.`,
    };
  }

  // Agrega todas as ad accounts do tenant (removendo duplicatas)
  const allAdAccountIds = [...new Set(
    tenantClients
      .map(c => c.adAccountId)
      .filter(Boolean)
  )];

  // Usa a página do primeiro cliente do tenant como referência (para endpoints que precisam de uma única página)
  const primaryClient = tenantClients[0] || {};

  return {
    key: tenantKey,
    name: tenantMeta.name || tenantKey,
    adAccountIds: allAdAccountIds,
    clients: tenantClients,
    // Campos de página do cliente primário (compatibilidade com media.js e publish.js)
    pageId: primaryClient.pageId || null,
    pageAccessToken: primaryClient.pageAccessToken || null,
    igUserId: primaryClient.igUserId || null,
  };
}

/**
 * Lista todos os clientes configurados
 */
async function listClients() {
  const config = await loadConfig();
  if (!config || !config.clients) return [];

  return Object.entries(config.clients).map(([key, c]) => ({
    key,
    name: c.name || key,
    tenant: c.tenant || null,
    adAccountId: c.adAccountId || null,
    adAccountIds: c.adAccountId ? [c.adAccountId] : [],
    pageId: c.pageId || null,
    pageName: c.pageName || null,
    pageAccessToken: c.pageAccessToken || null,
    igUserId: c.igUserId || null,
    igUsername: c.igUsername || null,
  }));
}

/**
 * Lista todos os tenants configurados (compatibilidade com código legado)
 */
async function listTenants() {
  const config = await loadConfig();
  if (!config) return [];

  // Suporte à estrutura legada
  if (!config.clients && config.tenants) {
    return Object.entries(config.tenants).map(([key, t]) => ({
      key,
      name: t.name || key,
      adAccountIds: t.adAccountIds || [],
      pageId: t.pageId || null,
      igUserId: t.igUserId || null,
    }));
  }

  // Nova estrutura: agrega por tenant
  const tenants = config.tenants || {};
  const clients = config.clients || {};

  return Object.keys(tenants).map(tenantKey => {
    const tenantClients = Object.entries(clients)
      .filter(([, c]) => c.tenant === tenantKey)
      .map(([key, c]) => ({ key, ...c }));

    const adAccountIds = [...new Set(
      tenantClients.map(c => c.adAccountId).filter(Boolean)
    )];

    const primary = tenantClients[0] || {};
    return {
      key: tenantKey,
      name: tenants[tenantKey].name || tenantKey,
      adAccountIds,
      pageId: primary.pageId || null,
      igUserId: primary.igUserId || null,
    };
  });
}

/**
 * Valida que o parâmetro tenant (ou client) foi fornecido e é válido.
 * Suporta:
 *   ?tenant=starken  → retorna dados agregados do tenant
 *   ?client=super-x  → retorna dados do cliente específico
 */
async function validateTenant(req, res) {
  const tenantKey = req.query?.tenant || req.body?.tenant;
  const clientKey = req.query?.client || req.body?.client;

  if (!tenantKey && !clientKey) {
    res.status(400).json({ error: true, code: 'MISSING_PARAM', message: 'Parâmetro "tenant" ou "client" é obrigatório' });
    return null;
  }

  try {
    if (clientKey) {
      return await getClient(clientKey);
    }
    return await getTenant(tenantKey);
  } catch (err) {
    res.status(400).json(err);
    return null;
  }
}

module.exports = { getTenant, getClient, listTenants, listClients, validateTenant, loadConfig, saveConfig };
