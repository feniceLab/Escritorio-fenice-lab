/**
 * /api/meta/balance — Saldo das contas de anúncios de um tenant
 *
 * GET ?tenant=starken|alpha
 *
 * Retorna array de saldos (um tenant pode ter múltiplas ad accounts)
 */

const { graphGet } = require('./_lib/graph');
const { validateTenant } = require('./_lib/tenants');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: true, code: 'METHOD_NOT_ALLOWED', message: 'Use GET' });
  }

  const tenant = await validateTenant(req, res);
  if (!tenant) return;

  if (!tenant.adAccountIds || !tenant.adAccountIds.length) {
    return res.status(400).json({
      error: true,
      code: 'NOT_CONFIGURED',
      message: `Nenhuma conta de anúncios configurada para "${tenant.name}". Use a tela de Configuração Meta.`,
    });
  }

  try {
    const accounts = [];

    for (const adAccountId of tenant.adAccountIds) {
      try {
        const data = await graphGet(`/${adAccountId}`, {
          fields: 'name,balance,amount_spent,account_status,currency',
        });
        accounts.push({
          ad_account_id: adAccountId,
          account_name: data.name || adAccountId,
          balance: data.balance || '0',
          amount_spent: data.amount_spent || '0',
          account_status: data.account_status,
          currency: data.currency || 'BRL',
        });
      } catch (err) {
        accounts.push({
          ad_account_id: adAccountId,
          error: err.message || 'Erro ao consultar conta',
        });
      }
    }

    return res.status(200).json({
      tenant: tenant.key,
      tenant_name: tenant.name,
      accounts,
    });
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
