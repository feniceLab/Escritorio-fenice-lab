/**
 * /api/meta/discover — Descobre todos os ativos acessíveis pelo token
 *
 * GET — Retorna:
 *   - Páginas do Facebook (com IG vinculado)
 *   - Contas de anúncios (ad accounts do portfólio)
 *   - Status do token (validade, permissões)
 *
 * Não precisa de config prévia — usa apenas META_ACCESS_TOKEN
 */

const { graphGet } = require('./_lib/graph');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: true, code: 'METHOD_NOT_ALLOWED', message: 'Use GET' });
  }

  try {
    // Helper: buscar todas as páginas seguindo paginação
    async function fetchAllPages(path, params) {
      const allData = [];
      let url = path;
      let queryParams = { ...params };
      let hasNext = true;

      while (hasNext) {
        const result = await graphGet(url, queryParams);
        if (result.data) allData.push(...result.data);

        if (result.paging && result.paging.cursors && result.paging.cursors.after) {
          queryParams = { ...params, after: result.paging.cursors.after };
        } else {
          hasNext = false;
        }
      }
      return allData;
    }

    // 1. Páginas do Facebook + IG vinculado
    // 1a. Buscar via /me/accounts (páginas diretas do usuário)
    const pagesRaw = await fetchAllPages('/me/accounts', {
      fields: 'name,id,category,access_token,instagram_business_account{id,username,name,profile_picture_url,followers_count}',
      limit: '100',
    });

    // 1b. Buscar via Business Manager (páginas de negócios)
    let businessPages = [];
    try {
      const businesses = await fetchAllPages('/me/businesses', { fields: 'id,name', limit: '100' });
      for (const biz of businesses) {
        try {
          const bizPages = await fetchAllPages(`/${biz.id}/owned_pages`, {
            fields: 'name,id,category,access_token,instagram_business_account{id,username,name,profile_picture_url,followers_count}',
            limit: '100',
          });
          businessPages.push(...bizPages);
        } catch (e) { /* ignora business sem permissão */ }
        try {
          const clientPages = await fetchAllPages(`/${biz.id}/client_pages`, {
            fields: 'name,id,category,access_token,instagram_business_account{id,username,name,profile_picture_url,followers_count}',
            limit: '100',
          });
          businessPages.push(...clientPages);
        } catch (e) { /* ignora se não tiver client_pages */ }
      }
    } catch (e) { /* sem acesso a businesses */ }

    // Mesclar e remover duplicatas (por ID)
    const allPagesRaw = [...pagesRaw, ...businessPages];
    const seenPageIds = new Set();
    const uniquePages = [];
    for (const page of allPagesRaw) {
      if (!seenPageIds.has(page.id)) {
        seenPageIds.add(page.id);
        uniquePages.push(page);
      }
    }

    const pages = uniquePages.map(page => ({
      id: page.id,
      name: page.name,
      category: page.category,
      access_token: page.access_token,
      ig_account: page.instagram_business_account || null,
    }));

    // 2. Contas de anúncios (com paginação completa)
    const adAccountsRaw = await fetchAllPages('/me/adaccounts', {
      fields: 'name,account_id,id,account_status,currency,balance,amount_spent,business{id,name}',
      limit: '100',
    });

    const adAccounts = adAccountsRaw.map(acc => ({
      id: acc.id,
      account_id: acc.account_id,
      name: acc.name,
      account_status: acc.account_status,
      currency: acc.currency,
      balance: acc.balance,
      amount_spent: acc.amount_spent,
      business: acc.business || null,
    }));

    // 2b. Contas do Instagram via Business Manager (inclui IGs sem página FB)
    // Busca em 3 endpoints: instagram_accounts, owned_instagram_accounts, client_instagram_accounts
    let igAccounts = [];
    const igFields = 'id,username,name,profile_picture_url,followers_count';
    try {
      const businesses = await fetchAllPages('/me/businesses', { fields: 'id,name', limit: '100' }).catch(() => []);
      for (const biz of businesses) {
        // Endpoint 1: instagram_accounts (contas IG conectadas ao BM)
        try {
          const bizIgs = await fetchAllPages(`/${biz.id}/instagram_accounts`, {
            fields: igFields, limit: '100',
          });
          igAccounts.push(...bizIgs);
        } catch (e) { /* ignora */ }
        // Endpoint 2: owned_instagram_accounts (contas IG de propriedade do BM)
        try {
          const ownedIgs = await fetchAllPages(`/${biz.id}/owned_instagram_accounts`, {
            fields: igFields, limit: '100',
          });
          igAccounts.push(...ownedIgs);
        } catch (e) { /* ignora */ }
        // Endpoint 3: client_instagram_accounts (contas IG de clientes do BM)
        try {
          const clientIgs = await fetchAllPages(`/${biz.id}/client_instagram_accounts`, {
            fields: igFields, limit: '100',
          });
          igAccounts.push(...clientIgs);
        } catch (e) { /* ignora */ }
      }
    } catch (e) { /* sem acesso a businesses */ }

    // Deduplica IGs (remove os que já vieram vinculados a uma página)
    const pageIgIds = new Set(pages.filter(p => p.ig_account).map(p => p.ig_account.id));
    const standaloneIgs = [];
    const seenIgIds = new Set();
    for (const ig of igAccounts) {
      if (!seenIgIds.has(ig.id) && !pageIgIds.has(ig.id)) {
        seenIgIds.add(ig.id);
        standaloneIgs.push({
          id: ig.id,
          username: ig.username,
          name: ig.name || ig.username,
          profile_picture_url: ig.profile_picture_url || null,
          followers_count: ig.followers_count || 0,
        });
      }
    }

    // 3. Status do token
    let tokenStatus = null;
    try {
      const tokenInfo = await graphGet('/debug_token', {
        input_token: process.env.META_ACCESS_TOKEN,
      });
      if (tokenInfo.data) {
        tokenStatus = {
          valid: tokenInfo.data.is_valid,
          app_id: tokenInfo.data.app_id,
          expires_at: tokenInfo.data.expires_at,
          expires_at_date: tokenInfo.data.expires_at
            ? new Date(tokenInfo.data.expires_at * 1000).toISOString()
            : null,
          scopes: tokenInfo.data.scopes,
        };
      }
    } catch (e) {
      tokenStatus = { valid: true, note: 'debug_token não acessível (normal para user tokens)' };
    }

    // 4. Info do usuário
    let user = null;
    try {
      const userData = await graphGet('/me', { fields: 'name,id' });
      user = { id: userData.id, name: userData.name };
    } catch (e) {
      // Ignora
    }

    // Todas as contas IG (vinculadas a páginas + standalone)
    const allIgAccounts = [
      ...pages.filter(p => p.ig_account).map(p => ({
        id: p.ig_account.id,
        username: p.ig_account.username,
        name: p.ig_account.name || p.ig_account.username,
        profile_picture_url: p.ig_account.profile_picture_url || null,
        followers_count: p.ig_account.followers_count || 0,
        linked_page: { id: p.id, name: p.name },
      })),
      ...standaloneIgs.map(ig => ({ ...ig, linked_page: null })),
    ];

    return res.status(200).json({
      connected: true,
      user,
      pages,
      ig_accounts: allIgAccounts,
      ad_accounts: adAccounts,
      token_status: tokenStatus,
      summary: {
        total_pages: pages.length,
        total_ig_accounts: allIgAccounts.length,
        total_ad_accounts: adAccounts.length,
      },
    });
  } catch (err) {
    if (err.error) {
      return res.status(err.status || 500).json(err);
    }
    return res.status(500).json({
      error: true,
      code: 'INTERNAL_ERROR',
      message: err.message || 'Erro interno',
    });
  }
};
