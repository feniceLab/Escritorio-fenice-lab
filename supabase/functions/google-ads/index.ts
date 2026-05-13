/**
 * Supabase Edge Function: google-ads
 * Proxies Google Ads REST API calls, handles OAuth2 token exchange server-side.
 *
 * GET /google-ads?customerId=8779278717&resource=campaigns&range=LAST_7_DAYS
 * GET /google-ads?customerId=8779278717&resource=audit&range=LAST_30_DAYS
 * GET /google-ads?customerId=8779278717&resource=keywords&range=LAST_7_DAYS
 * GET /google-ads?customerId=8779278717&resource=summary&range=TODAY
 */

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_ADS_BASE = 'https://googleads.googleapis.com/v21';

// Cache access token in memory (valid ~1h, edge function may restart)
let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry - 60000) return cachedToken;

  const resp = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
      refresh_token: Deno.env.get('GOOGLE_REFRESH_TOKEN')!,
      grant_type: 'refresh_token',
    }),
  });

  const data = await resp.json();
  if (!data.access_token) throw new Error('Token exchange failed: ' + JSON.stringify(data));

  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in || 3600) * 1000;
  return cachedToken!;
}

async function gadsQuery(customerId: string, query: string, accessToken: string): Promise<any[]> {
  const url = `${GOOGLE_ADS_BASE}/customers/${customerId}/googleAds:search`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': Deno.env.get('GOOGLE_DEVELOPER_TOKEN')!,
      'login-customer-id': Deno.env.get('GOOGLE_LOGIN_CUSTOMER_ID')!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  const data = await resp.json();
  if (data.error) throw new Error(JSON.stringify(data.error));
  return data.results || [];
}

function dateRange(range: string): string {
  const rangeMap: Record<string, string> = {
    'TODAY': "segments.date DURING TODAY",
    'YESTERDAY': "segments.date DURING YESTERDAY",
    'LAST_7_DAYS': "segments.date DURING LAST_7_DAYS",
    'LAST_30_DAYS': "segments.date DURING LAST_30_DAYS",
    'THIS_MONTH': "segments.date DURING THIS_MONTH",
    'LAST_MONTH': "segments.date DURING LAST_MONTH",
  };
  return rangeMap[range] || "segments.date DURING LAST_7_DAYS";
}

// Campaigns: full metrics including competitive and efficiency data
async function getCampaigns(customerId: string, range: string, token: string) {
  const query = `
    SELECT
      campaign.id, campaign.name, campaign.status,
      campaign.advertising_channel_type,
      campaign_budget.amount_micros,
      metrics.cost_micros, metrics.impressions, metrics.clicks,
      metrics.conversions, metrics.cost_per_conversion,
      metrics.average_cpc,
      metrics.ctr,
      metrics.conversions_from_interactions_rate,
      metrics.conversions_value,
      metrics.search_impression_share,
      metrics.search_top_impression_share,
      metrics.search_absolute_top_impression_share,
      metrics.search_budget_lost_impression_share,
      metrics.search_rank_lost_impression_share,
      metrics.content_impression_share,
      metrics.content_budget_lost_impression_share,
      metrics.content_rank_lost_impression_share,
      metrics.view_through_conversions,
      metrics.all_conversions
    FROM campaign
    WHERE campaign.status IN ('ENABLED', 'PAUSED')
    AND ${dateRange(range)}
    ORDER BY metrics.cost_micros DESC
  `;
  const results = await gadsQuery(customerId, query, token);
  return results.map((r: any) => {
    const m = r.metrics || {};
    const spend = (m.costMicros || 0) / 1e6;
    const convVal = parseFloat(m.conversionsValue || '0');
    const conv = parseFloat(m.conversions || '0');
    return {
      id: r.campaign?.id,
      name: r.campaign?.name,
      status: r.campaign?.status,
      type: r.campaign?.advertisingChannelType,
      budget_brl: (r.campaignBudget?.amountMicros || 0) / 1e6,
      spend_brl: spend,
      impressions: m.impressions || 0,
      clicks: m.clicks || 0,
      conversions: conv,
      cpa_brl: (m.costPerConversion || 0) / 1e6,
      avg_cpc_brl: (m.averageCpc || 0) / 1e6,
      ctr_pct: parseFloat(m.ctr || '0') * 100,
      conv_rate_pct: parseFloat(m.conversionsFromInteractionsRate || '0') * 100,
      conv_value_brl: convVal,
      roas: spend > 0 ? convVal / spend : 0,
      // Competitive: Search IS (values come as 0.0-1.0 doubles)
      search_is_pct: m.searchImpressionShare != null ? parseFloat(m.searchImpressionShare) * 100 : null,
      search_top_is_pct: m.searchTopImpressionShare != null ? parseFloat(m.searchTopImpressionShare) * 100 : null,
      search_abs_top_is_pct: m.searchAbsoluteTopImpressionShare != null ? parseFloat(m.searchAbsoluteTopImpressionShare) * 100 : null,
      search_budget_lost_is_pct: m.searchBudgetLostImpressionShare != null ? parseFloat(m.searchBudgetLostImpressionShare) * 100 : null,
      search_rank_lost_is_pct: m.searchRankLostImpressionShare != null ? parseFloat(m.searchRankLostImpressionShare) * 100 : null,
      // Display IS
      content_is_pct: m.contentImpressionShare != null ? parseFloat(m.contentImpressionShare) * 100 : null,
      content_budget_lost_is_pct: m.contentBudgetLostImpressionShare != null ? parseFloat(m.contentBudgetLostImpressionShare) * 100 : null,
      content_rank_lost_is_pct: m.contentRankLostImpressionShare != null ? parseFloat(m.contentRankLostImpressionShare) * 100 : null,
      // Extra
      view_through_conv: parseInt(m.viewThroughConversions || '0'),
      all_conversions: parseFloat(m.allConversions || '0'),
    };
  });
}

// Audit summary: total spend, conversions, CPA, waste
async function getAudit(customerId: string, range: string, token: string) {
  const campaigns = await getCampaigns(customerId, range, token);
  const totalSpend = campaigns.reduce((s, c) => s + c.spend_brl, 0);
  const totalBudget = campaigns.reduce((s, c) => s + c.budget_brl, 0);
  const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0);
  const totalImpressions = campaigns.reduce((s, c) => s + Number(c.impressions), 0);
  const totalClicks = campaigns.reduce((s, c) => s + Number(c.clicks), 0);
  const avgCpa = totalConversions > 0 ? totalSpend / totalConversions : 0;
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const budgetUtilization = totalBudget > 0 ? (totalSpend / totalBudget) * 100 : 0;

  const totalConvValue = campaigns.reduce((s, c) => s + c.conv_value_brl, 0);
  const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const convRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
  const roas = totalSpend > 0 ? totalConvValue / totalSpend : 0;

  // Weighted avg impression share for enabled Search campaigns
  const searchCamps = campaigns.filter(c => c.type === 'SEARCH' && c.status === 'ENABLED' && c.search_is_pct != null);
  const totalSearchImpr = searchCamps.reduce((s, c) => s + Number(c.impressions), 0);
  const avgSearchIS = totalSearchImpr > 0
    ? searchCamps.reduce((s, c) => s + (c.search_is_pct || 0) * Number(c.impressions), 0) / totalSearchImpr
    : null;
  const avgSearchTopIS = totalSearchImpr > 0
    ? searchCamps.reduce((s, c) => s + (c.search_top_is_pct || 0) * Number(c.impressions), 0) / totalSearchImpr
    : null;
  const avgSearchAbsTopIS = totalSearchImpr > 0
    ? searchCamps.reduce((s, c) => s + (c.search_abs_top_is_pct || 0) * Number(c.impressions), 0) / totalSearchImpr
    : null;
  const avgBudgetLostIS = totalSearchImpr > 0
    ? searchCamps.reduce((s, c) => s + (c.search_budget_lost_is_pct || 0) * Number(c.impressions), 0) / totalSearchImpr
    : null;
  const avgRankLostIS = totalSearchImpr > 0
    ? searchCamps.reduce((s, c) => s + (c.search_rank_lost_is_pct || 0) * Number(c.impressions), 0) / totalSearchImpr
    : null;

  return {
    total_spend_brl: totalSpend,
    total_budget_brl: totalBudget,
    budget_utilization_pct: budgetUtilization,
    total_conversions: totalConversions,
    total_impressions: totalImpressions,
    total_clicks: totalClicks,
    avg_cpa_brl: avgCpa,
    avg_cpc_brl: avgCpc,
    ctr_pct: ctr,
    conv_rate_pct: convRate,
    total_conv_value_brl: totalConvValue,
    roas: roas,
    campaign_count: campaigns.length,
    enabled_count: campaigns.filter(c => c.status === 'ENABLED').length,
    // Competitive
    search_is_pct: avgSearchIS,
    search_top_is_pct: avgSearchTopIS,
    search_abs_top_is_pct: avgSearchAbsTopIS,
    search_budget_lost_is_pct: avgBudgetLostIS,
    search_rank_lost_is_pct: avgRankLostIS,
  };
}

// Keywords: top keywords with status (waste/good) and performance
async function getKeywords(customerId: string, range: string, token: string) {
  const query = `
    SELECT
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      campaign.name,
      metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions,
      metrics.search_impression_share,
      ad_group_criterion.quality_info.quality_score
    FROM keyword_view
    WHERE campaign.status = 'ENABLED'
    AND ad_group_criterion.status = 'ENABLED'
    AND ${dateRange(range)}
    ORDER BY metrics.cost_micros DESC
    LIMIT 50
  `;
  const results = await gadsQuery(customerId, query, token);
  return results.map((r: any) => {
    const spend = (r.metrics?.costMicros || 0) / 1e6;
    const conversions = parseFloat(r.metrics?.conversions || '0');
    const clicks = parseInt(r.metrics?.clicks || '0');
    const cpa = conversions > 0 ? spend / conversions : null;
    const ctr = parseInt(r.metrics?.impressions || '0') > 0
      ? (clicks / parseInt(r.metrics.impressions)) * 100 : 0;
    // Classify: WASTE if spend > 0 and 0 conversions and > 5 clicks
    const status = spend > 2 && conversions === 0 && clicks > 5 ? 'WASTE'
      : conversions > 0 ? 'GOOD' : 'NEUTRAL';
    return {
      text: r.adGroupCriterion?.keyword?.text,
      match_type: r.adGroupCriterion?.keyword?.matchType,
      campaign: r.campaign?.name,
      spend_brl: spend,
      impressions: parseInt(r.metrics?.impressions || '0'),
      clicks,
      conversions,
      cpa_brl: cpa,
      ctr_pct: ctr,
      quality_score: r.adGroupCriterion?.qualityInfo?.qualityScore,
      status,
    };
  });
}

// Ads: RSA headlines, descriptions, final URLs, performance per campaign
async function getAds(customerId: string, range: string, token: string, campaignId?: string) {
  const campaignFilter = campaignId
    ? `AND campaign.id = ${campaignId}`
    : '';

  // Try ad_group_ad first (works for Search, Display, etc.)
  const query = `
    SELECT
      campaign.id, campaign.name,
      ad_group.id, ad_group.name,
      ad_group_ad.ad.id,
      ad_group_ad.ad.type,
      ad_group_ad.ad.responsive_search_ad.headlines,
      ad_group_ad.ad.responsive_search_ad.descriptions,
      ad_group_ad.ad.final_urls,
      ad_group_ad.ad.name,
      ad_group_ad.status,
      ad_group_ad.ad.display_url,
      metrics.impressions, metrics.clicks, metrics.conversions, metrics.cost_micros,
      metrics.ctr
    FROM ad_group_ad
    WHERE campaign.status IN ('ENABLED', 'PAUSED')
    AND ad_group_ad.status != 'REMOVED'
    ${campaignFilter}
    AND ${dateRange(range)}
    ORDER BY metrics.impressions DESC
    LIMIT 50
  `;

  let results: any[] = [];
  try {
    results = await gadsQuery(customerId, query, token);
  } catch (_) { /* PMax may fail on ad_group_ad */ }

  if (results.length > 0) {
    return results.map((r: any) => {
      const ad = r.adGroupAd?.ad || {};
      const rsa = ad.responsiveSearchAd || {};
      return {
        campaign_id: r.campaign?.id,
        campaign_name: r.campaign?.name,
        ad_group_name: r.adGroup?.name,
        ad_id: ad.id,
        ad_type: ad.type,
        ad_name: ad.name || '',
        status: r.adGroupAd?.status,
        headlines: (rsa.headlines || []).map((h: any) => h.text),
        descriptions: (rsa.descriptions || []).map((d: any) => d.text),
        final_urls: ad.finalUrls || [],
        display_url: ad.displayUrl || '',
        impressions: parseInt(r.metrics?.impressions || '0'),
        clicks: parseInt(r.metrics?.clicks || '0'),
        conversions: parseFloat(r.metrics?.conversions || '0'),
        spend_brl: (r.metrics?.costMicros || 0) / 1e6,
        ctr_pct: parseFloat(r.metrics?.ctr || '0') * 100,
      };
    });
  }

  // Fallback: PMax asset groups
  const assetQuery = `
    SELECT
      campaign.id, campaign.name,
      asset_group.id, asset_group.name, asset_group.status,
      asset_group_asset.asset,
      asset_group_asset.field_type,
      asset.text_asset.text,
      asset.image_asset.full_size.url,
      asset.name
    FROM asset_group_asset
    WHERE campaign.status IN ('ENABLED', 'PAUSED')
    ${campaignFilter}
    AND asset_group.status = 'ENABLED'
    AND asset_group_asset.field_type IN ('HEADLINE', 'DESCRIPTION', 'LONG_HEADLINE')
  `;

  let assetResults: any[] = [];
  try {
    assetResults = await gadsQuery(customerId, assetQuery, token);
  } catch (_) { /* may fail */ }

  if (!assetResults.length) return [];

  // Group assets by asset_group
  const groups: Record<string, any> = {};
  for (const r of assetResults) {
    const gid = r.assetGroup?.id || 'unknown';
    if (!groups[gid]) {
      groups[gid] = {
        campaign_id: r.campaign?.id,
        campaign_name: r.campaign?.name,
        ad_group_name: r.assetGroup?.name || '',
        ad_id: gid,
        ad_type: 'PERFORMANCE_MAX',
        ad_name: r.assetGroup?.name || '',
        status: r.assetGroup?.status || 'ENABLED',
        headlines: [],
        descriptions: [],
        final_urls: [],
        display_url: '',
        impressions: 0, clicks: 0, conversions: 0, spend_brl: 0, ctr_pct: 0,
      };
    }
    const text = r.asset?.textAsset?.text;
    if (!text) continue;
    const fieldType = r.assetGroupAsset?.fieldType;
    if (fieldType === 'HEADLINE' || fieldType === 'LONG_HEADLINE') {
      groups[gid].headlines.push(text);
    } else if (fieldType === 'DESCRIPTION') {
      groups[gid].descriptions.push(text);
    }
  }

  return Object.values(groups);
}

// Funnel: conversions segmented by conversion action (VIEW_ITEM, ADD_TO_CART, BEGIN_CHECKOUT, PURCHASE)
async function getFunnel(customerId: string, range: string, token: string, campaignId?: string) {
  const campaignFilter = campaignId ? `AND campaign.id = ${campaignId}` : '';
  const query = `
    SELECT
      campaign.id, campaign.name,
      segments.conversion_action_name,
      segments.conversion_action_category,
      metrics.conversions,
      metrics.conversions_value,
      metrics.all_conversions,
      metrics.all_conversions_value
    FROM campaign
    WHERE campaign.status = 'ENABLED'
    ${campaignFilter}
    AND ${dateRange(range)}
    ORDER BY segments.conversion_action_name
  `;
  const results = await gadsQuery(customerId, query, token);

  // Aggregate by conversion action
  const actions: Record<string, any> = {};
  for (const r of results) {
    const name = r.segments?.conversionActionName || 'Unknown';
    const category = r.segments?.conversionActionCategory || '';
    if (!actions[name]) {
      actions[name] = {
        name,
        category,
        conversions: 0,
        value: 0,
        all_conversions: 0,
        all_value: 0,
        campaigns: [],
      };
    }
    const conv = parseFloat(r.metrics?.conversions || '0');
    const val = parseFloat(r.metrics?.conversionsValue || '0');
    const allConv = parseFloat(r.metrics?.allConversions || '0');
    const allVal = parseFloat(r.metrics?.allConversionsValue || '0');
    actions[name].conversions += conv;
    actions[name].value += val;
    actions[name].all_conversions += allConv;
    actions[name].all_value += allVal;
    actions[name].campaigns.push({
      id: r.campaign?.id,
      name: r.campaign?.name,
      conversions: conv,
      value: val,
    });
  }

  // Map to funnel stages (match by common naming patterns)
  const allActions = Object.values(actions);
  const funnel_stages = ['VIEW_ITEM', 'ADD_TO_CART', 'BEGIN_CHECKOUT', 'PURCHASE'];
  const stagePatterns: Record<string, RegExp> = {
    VIEW_ITEM: /view.?item|acesso.?card|visualiza/i,
    ADD_TO_CART: /add.?to.?cart|carrinho|adição/i,
    BEGIN_CHECKOUT: /begin.?checkout|checkout|finaliza/i,
    PURCHASE: /purchase|compra/i,
  };

  const funnel = funnel_stages.map(stage => {
    const pattern = stagePatterns[stage];
    const matched = allActions.filter(a => pattern.test(a.name) || pattern.test(a.category));
    const totalConv = matched.reduce((s, a) => s + a.conversions, 0);
    const totalVal = matched.reduce((s, a) => s + a.value, 0);
    const totalAllConv = matched.reduce((s, a) => s + a.all_conversions, 0);
    const totalAllVal = matched.reduce((s, a) => s + a.all_value, 0);
    // Per-campaign breakdown for this stage
    const campMap: Record<string, { name: string; conversions: number; value: number }> = {};
    for (const a of matched) {
      for (const c of a.campaigns) {
        if (!campMap[c.id]) campMap[c.id] = { name: c.name, conversions: 0, value: 0 };
        campMap[c.id].conversions += c.conversions;
        campMap[c.id].value += c.value;
      }
    }
    return {
      stage,
      action_names: matched.map(a => a.name),
      conversions: totalConv,
      value_brl: totalVal,
      all_conversions: totalAllConv,
      all_value_brl: totalAllVal,
      per_campaign: Object.values(campMap).filter(c => c.conversions > 0),
    };
  });

  return {
    funnel,
    all_actions: allActions.map(a => ({
      name: a.name,
      category: a.category,
      conversions: a.conversions,
      value: a.value,
    })),
  };
}

Deno.serve(async (req: Request) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

  try {
    const url = new URL(req.url);
    const customerId = url.searchParams.get('customerId') || '8779278717';
    const resource = url.searchParams.get('resource') || 'audit';
    const range = (url.searchParams.get('range') || 'LAST_7_DAYS').toUpperCase();

    const token = await getAccessToken();
    let data: any;

    const campaignId = url.searchParams.get('campaignId') || undefined;

    switch (resource) {
      case 'campaigns': data = await getCampaigns(customerId, range, token); break;
      case 'audit':     data = await getAudit(customerId, range, token); break;
      case 'keywords':  data = await getKeywords(customerId, range, token); break;
      case 'ads':       data = await getAds(customerId, range, token, campaignId); break;
      case 'funnel':    data = await getFunnel(customerId, range, token, campaignId); break;
      default: return new Response(JSON.stringify({ error: 'Unknown resource' }), { status: 400, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ ok: true, resource, range, data }), { headers: corsHeaders });
  } catch (err: any) {
    console.error('google-ads edge error:', err);
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500, headers: corsHeaders });
  }
});
