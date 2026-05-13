// =============================================================================
// Traffic Management API - Multiplexed Vercel Serverless Function
// Single POST endpoint with action-based routing
// Meta Graph API integration for campaign metrics sync
// =============================================================================

const { graphGet } = require('./_lib/graph');
const { getClient } = require('./_lib/tenants');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

const HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

const HEADERS_RETURN = {
  ...HEADERS,
  Prefer: 'return=representation',
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// =============================================================================
// Helpers
// =============================================================================

function ok(data) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function fail(message, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

async function supaSelect(table, query = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers: HEADERS });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`SELECT ${table} failed: ${err}`);
  }
  return res.json();
}

async function supaInsert(table, record) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: HEADERS_RETURN,
    body: JSON.stringify(record),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`INSERT ${table} failed: ${err}`);
  }
  return res.json();
}

async function supaUpdate(table, id, updates) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: HEADERS_RETURN,
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`UPDATE ${table} failed: ${err}`);
  }
  return res.json();
}

async function supaDelete(table, id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'DELETE',
    headers: HEADERS,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DELETE ${table} failed: ${err}`);
  }
}

async function logActivity(task_id, actor, action, details = null) {
  await supaInsert('traffic_activity', {
    task_id,
    actor,
    action,
    details: details ? JSON.stringify(details) : null,
    created_at: new Date().toISOString(),
  });
}

// =============================================================================
// Group Actions
// =============================================================================

async function listGroups({ client_id }) {
  if (!client_id) return fail('client_id is required');

  const groups = await supaSelect(
    'traffic_groups',
    `select=*&client_id=eq.${client_id}&archived=eq.false&order=position.asc`
  );

  const tasks = await supaSelect(
    'traffic_tasks',
    `select=id,group_id&client_id=eq.${client_id}`
  );

  const countMap = {};
  for (const t of tasks) {
    countMap[t.group_id] = (countMap[t.group_id] || 0) + 1;
  }

  const result = groups.map((g) => ({
    ...g,
    task_count: countMap[g.id] || 0,
  }));

  return ok(result);
}

async function upsertGroup({ id, client_id, name, position, user }) {
  if (!client_id || !name) return fail('client_id and name are required');
  if (!user) return fail('user is required');

  const now = new Date().toISOString();

  if (id) {
    const data = await supaUpdate('traffic_groups', id, {
      name,
      ...(position !== undefined && { position }),
      updated_at: now,
    });
    return ok(data);
  }

  const data = await supaInsert('traffic_groups', {
    client_id,
    name,
    position: position ?? 0,
    created_by: user,
    created_at: now,
    updated_at: now,
    archived: false,
  });
  return ok(data);
}

async function deleteGroup({ id, user }) {
  if (!id) return fail('id is required');
  if (!user) return fail('user is required');

  const data = await supaUpdate('traffic_groups', id, {
    archived: true,
    updated_at: new Date().toISOString(),
  });
  return ok(data);
}

// =============================================================================
// Task Actions
// =============================================================================

async function listTasks({ group_id, client_id }) {
  if (!group_id && !client_id) return fail('group_id or client_id is required');

  const filter = group_id
    ? `group_id=eq.${group_id}`
    : `client_id=eq.${client_id}`;

  const tasks = await supaSelect(
    'traffic_tasks',
    `select=*&${filter}&order=position.asc`
  );

  const parentTasks = [];
  const childMap = {};

  for (const t of tasks) {
    if (t.parent_id) {
      if (!childMap[t.parent_id]) childMap[t.parent_id] = [];
      childMap[t.parent_id].push(t);
    } else {
      parentTasks.push(t);
    }
  }

  // Recursive nesting up to 5 levels
  function nestSubtasks(task, depth) {
    const children = childMap[task.id] || [];
    return {
      ...task,
      subtasks: depth < 5 ? children.map(c => nestSubtasks(c, depth + 1)) : children,
    };
  }

  const result = parentTasks.map(t => nestSubtasks(t, 0));

  return ok(result);
}

async function listMyTasks({ assignee }) {
  if (!assignee) return fail('assignee is required');

  const tasks = await supaSelect(
    'traffic_tasks',
    `select=*,traffic_groups!inner(id,name,client_id)&assignee=eq.${encodeURIComponent(assignee)}&parent_id=is.null&order=due_date.asc.nullslast,created_at.desc`
  );

  const result = tasks.map(t => ({
    ...t,
    group_name: t.traffic_groups?.name || '',
    client_id: t.traffic_groups?.client_id || '',
    group_id: t.traffic_groups?.id || t.group_id,
    traffic_groups: undefined,
  }));

  return ok(result);
}

async function getTask({ id }) {
  if (!id) return fail('id is required');

  const [tasks, comments, attachments, activity] = await Promise.all([
    supaSelect('traffic_tasks', `select=*&id=eq.${id}`),
    supaSelect('traffic_comments', `select=*&task_id=eq.${id}&order=created_at.desc`),
    supaSelect('traffic_attachments', `select=*&task_id=eq.${id}&order=created_at.desc`),
    supaSelect('traffic_activity', `select=*&task_id=eq.${id}&order=created_at.desc&limit=50`),
  ]);

  if (!tasks.length) return fail('Task not found', 404);

  return ok({
    ...tasks[0],
    comments,
    attachments,
    activity,
  });
}

async function upsertTask(params) {
  const {
    id, group_id, parent_id, client_id, name, description,
    campaign_objective, budget_type, budget_amount, target_audience,
    platform, ad_account_ref, campaign_id, adset_id, creative_refs,
    notes, status, assignee, priority, due_date, position, user,
  } = params;

  if (!user) return fail('user is required');
  const now = new Date().toISOString();

  if (id) {
    // Fetch current task for activity logging
    const existing = await supaSelect('traffic_tasks', `select=status&id=eq.${id}`);
    const oldStatus = existing.length ? existing[0].status : null;

    const updates = {
      ...(group_id !== undefined && { group_id }),
      ...(parent_id !== undefined && { parent_id }),
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(campaign_objective !== undefined && { campaign_objective }),
      ...(budget_type !== undefined && { budget_type }),
      ...(budget_amount !== undefined && { budget_amount }),
      ...(target_audience !== undefined && { target_audience }),
      ...(platform !== undefined && { platform }),
      ...(ad_account_ref !== undefined && { ad_account_ref }),
      ...(campaign_id !== undefined && { campaign_id }),
      ...(adset_id !== undefined && { adset_id }),
      ...(creative_refs !== undefined && { creative_refs }),
      ...(notes !== undefined && { notes }),
      ...(status !== undefined && { status }),
      ...(assignee !== undefined && { assignee }),
      ...(priority !== undefined && { priority }),
      ...(due_date !== undefined && { due_date }),
      ...(position !== undefined && { position }),
      updated_at: now,
    };

    const data = await supaUpdate('traffic_tasks', id, updates);

    if (status !== undefined && status !== oldStatus) {
      await logActivity(id, user, 'status_changed', {
        old_status: oldStatus,
        new_status: status,
      });
    }

    return ok(data);
  }

  if (!group_id || !client_id || !name) {
    return fail('group_id, client_id, and name are required for new tasks');
  }

  // Calculate next position (add to bottom)
  let nextPos = 0;
  if (position === undefined || position === null) {
    const existing = await supaSelect('traffic_tasks',
      `select=position&group_id=eq.${group_id}&parent_id=${parent_id ? 'eq.' + parent_id : 'is.null'}&order=position.desc&limit=1`
    );
    nextPos = existing.length ? (existing[0].position || 0) + 1 : 0;
  }

  const record = {
    group_id,
    parent_id: parent_id || null,
    client_id,
    name,
    description: description || null,
    campaign_objective: campaign_objective || null,
    budget_type: budget_type || null,
    budget_amount: budget_amount || null,
    target_audience: target_audience || null,
    platform: platform || null,
    ad_account_ref: ad_account_ref || null,
    campaign_id: campaign_id || null,
    adset_id: adset_id || null,
    creative_refs: creative_refs || null,
    notes: notes || null,
    metrics: null,
    metrics_updated_at: null,
    status: status || 'backlog',
    assignee: assignee || null,
    priority: priority || 'medium',
    due_date: due_date || null,
    position: position ?? nextPos,
    created_by: user,
    created_at: now,
    updated_at: now,
  };

  const data = await supaInsert('traffic_tasks', record);

  if (data.length) {
    await logActivity(data[0].id, user, 'task_created', { name });
  }

  return ok(data);
}

async function deleteTask({ id, user }) {
  if (!id) return fail('id is required');
  if (!user) return fail('user is required');

  // Delete subtasks recursively first (up to 5 levels)
  async function deleteChildren(parentId) {
    const children = await supaSelect('traffic_tasks', `select=id&parent_id=eq.${parentId}`);
    for (const child of children) {
      await deleteChildren(child.id);
      await supaDelete('traffic_tasks', child.id);
    }
  }
  await deleteChildren(id);

  // Delete related data
  await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/traffic_comments?task_id=eq.${id}`, { method: 'DELETE', headers: HEADERS }),
    fetch(`${SUPABASE_URL}/rest/v1/traffic_attachments?task_id=eq.${id}`, { method: 'DELETE', headers: HEADERS }),
    fetch(`${SUPABASE_URL}/rest/v1/traffic_activity?task_id=eq.${id}`, { method: 'DELETE', headers: HEADERS }),
  ]).catch(() => {});

  await supaDelete('traffic_tasks', id);
  return ok({ deleted: true });
}

async function changeStatus({ id, status, user }) {
  if (!id || !status) return fail('id and status are required');
  if (!user) return fail('user is required');

  const existing = await supaSelect('traffic_tasks', `select=status&id=eq.${id}`);
  if (!existing.length) return fail('Task not found', 404);

  const oldStatus = existing[0].status;

  const data = await supaUpdate('traffic_tasks', id, {
    status,
    updated_at: new Date().toISOString(),
  });

  await logActivity(id, user, 'status_changed', {
    old_status: oldStatus,
    new_status: status,
  });

  return ok(data);
}

async function reorder({ items, user }) {
  if (!items || !Array.isArray(items)) return fail('items array is required');
  if (!user) return fail('user is required');

  const results = await Promise.all(
    items.map(({ id, position }) =>
      supaUpdate('traffic_tasks', id, { position, updated_at: new Date().toISOString() })
    )
  );

  return ok({ updated: results.length });
}

// =============================================================================
// Comment Actions
// =============================================================================

async function addComment({ task_id, body, user }) {
  if (!task_id || !body) return fail('task_id and body are required');
  if (!user) return fail('user is required');

  const data = await supaInsert('traffic_comments', {
    task_id,
    author: user,
    body,
    created_at: new Date().toISOString(),
  });

  await logActivity(task_id, user, 'comment_added', {
    preview: body.substring(0, 100),
  });

  return ok(data);
}

async function listComments({ task_id }) {
  if (!task_id) return fail('task_id is required');

  const data = await supaSelect(
    'traffic_comments',
    `select=*&task_id=eq.${task_id}&order=created_at.desc`
  );
  return ok(data);
}

// =============================================================================
// Attachment Actions
// =============================================================================

async function addAttachment({ task_id, file_name, file_url, file_type, file_size, category, user }) {
  if (!task_id || !file_name || !file_url) {
    return fail('task_id, file_name, and file_url are required');
  }
  if (!user) return fail('user is required');

  const data = await supaInsert('traffic_attachments', {
    task_id,
    file_name,
    file_url,
    file_type: file_type || null,
    file_size: file_size || null,
    category: category || null,
    uploaded_by: user,
    created_at: new Date().toISOString(),
  });

  await logActivity(task_id, user, 'attachment_added', {
    file_name,
    category: category || null,
  });

  return ok(data);
}

async function deleteAttachment({ id, user }) {
  if (!id) return fail('id is required');
  if (!user) return fail('user is required');

  await supaDelete('traffic_attachments', id);
  return ok({ deleted: true });
}

async function listAttachments({ task_id }) {
  if (!task_id) return fail('task_id is required');

  const data = await supaSelect(
    'traffic_attachments',
    `select=*&task_id=eq.${task_id}&order=created_at.desc`
  );
  return ok(data);
}

// =============================================================================
// Activity Actions
// =============================================================================

async function listActivity({ task_id, limit }) {
  if (!task_id) return fail('task_id is required');

  const cap = Math.min(limit || 50, 200);
  const data = await supaSelect(
    'traffic_activity',
    `select=*&task_id=eq.${task_id}&order=created_at.desc&limit=${cap}`
  );

  const parsed = data.map((row) => ({
    ...row,
    details: typeof row.details === 'string' ? JSON.parse(row.details) : row.details,
  }));

  return ok(parsed);
}

// =============================================================================
// Traffic-Specific: Meta Graph API Integration
// =============================================================================

const INSIGHTS_FIELDS = [
  'spend', 'impressions', 'reach', 'clicks',
  'cpc', 'ctr', 'cpm',
  'actions', 'cost_per_action_type', 'purchase_roas',
].join(',');

/**
 * Parse Meta insights response into a flat metrics object
 */
function parseInsights(insightsData) {
  if (!insightsData || !insightsData.data || !insightsData.data.length) {
    return null;
  }

  const row = insightsData.data[0];

  // Extract purchase/lead counts from actions array
  const actions = row.actions || [];
  const costPerAction = row.cost_per_action_type || [];
  const roas = row.purchase_roas || [];

  function findAction(arr, type) {
    const found = arr.find(a => a.action_type === type);
    return found ? parseFloat(found.value) : null;
  }

  return {
    spend: parseFloat(row.spend || 0),
    impressions: parseInt(row.impressions || 0, 10),
    reach: parseInt(row.reach || 0, 10),
    clicks: parseInt(row.clicks || 0, 10),
    cpc: parseFloat(row.cpc || 0),
    ctr: parseFloat(row.ctr || 0),
    cpm: parseFloat(row.cpm || 0),
    // Conversion metrics from actions array
    purchases: findAction(actions, 'purchase'),
    leads: findAction(actions, 'lead'),
    add_to_cart: findAction(actions, 'add_to_cart'),
    initiate_checkout: findAction(actions, 'initiate_checkout'),
    link_clicks: findAction(actions, 'link_click'),
    // Cost per action
    cost_per_purchase: findAction(costPerAction, 'purchase'),
    cost_per_lead: findAction(costPerAction, 'lead'),
    // ROAS
    purchase_roas: findAction(roas, 'omni_purchase'),
    // Date range
    date_start: row.date_start || null,
    date_stop: row.date_stop || null,
  };
}

/**
 * Sync metrics for a single task from Meta Graph API
 */
async function syncMetricsForTask(taskId) {
  const tasks = await supaSelect('traffic_tasks', `select=campaign_id,client_id&id=eq.${taskId}`);
  if (!tasks.length) throw new Error('Task not found');

  const task = tasks[0];
  if (!task.campaign_id) throw new Error('Task has no linked campaign_id');

  // Fetch campaign insights from Meta Graph API
  const insightsData = await graphGet(`/${task.campaign_id}/insights`, {
    fields: INSIGHTS_FIELDS,
    date_preset: 'last_7d',
  });

  const metrics = parseInsights(insightsData);
  const now = new Date().toISOString();

  // Update task with metrics
  const updated = await supaUpdate('traffic_tasks', taskId, {
    metrics: metrics || {},
    metrics_updated_at: now,
    updated_at: now,
  });

  return { task_id: taskId, metrics, updated_at: now };
}

async function syncMetrics({ task_id, client_id, user }) {
  if (!task_id) return fail('task_id is required');

  try {
    const result = await syncMetricsForTask(task_id);

    if (user) {
      await logActivity(task_id, user, 'metrics_synced', {
        spend: result.metrics?.spend,
        impressions: result.metrics?.impressions,
      });
    }

    return ok(result);
  } catch (err) {
    const message = err.message || (err.error ? err.message : 'Failed to sync metrics');
    return fail(message, err.status || 500);
  }
}

async function bulkSyncMetrics({ client_id, user }) {
  if (!client_id) return fail('client_id is required');

  // Find all tasks with a linked campaign_id
  const tasks = await supaSelect(
    'traffic_tasks',
    `select=id,campaign_id,name&client_id=eq.${client_id}&campaign_id=not.is.null`
  );

  if (!tasks.length) {
    return ok({ synced: 0, total: 0, results: [], message: 'No tasks with linked campaigns found' });
  }

  const results = [];
  let synced = 0;
  let failed = 0;

  for (const task of tasks) {
    try {
      const result = await syncMetricsForTask(task.id);
      results.push({ task_id: task.id, name: task.name, status: 'ok', metrics: result.metrics });
      synced++;
    } catch (err) {
      results.push({ task_id: task.id, name: task.name, status: 'error', error: err.message || 'Unknown error' });
      failed++;
    }

    // 200ms delay between API calls to respect rate limits
    if (tasks.indexOf(task) < tasks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  return ok({
    synced,
    failed,
    total: tasks.length,
    results,
  });
}

async function linkCampaign({ task_id, campaign_id, client_id, user }) {
  if (!task_id || !campaign_id) return fail('task_id and campaign_id are required');
  if (!user) return fail('user is required');

  const now = new Date().toISOString();

  // Update the task with the campaign_id
  await supaUpdate('traffic_tasks', task_id, {
    campaign_id,
    updated_at: now,
  });

  await logActivity(task_id, user, 'campaign_linked', { campaign_id });

  // Immediately sync metrics for the newly linked campaign
  try {
    const syncResult = await syncMetricsForTask(task_id);
    return ok({
      linked: true,
      campaign_id,
      metrics: syncResult.metrics,
      metrics_updated_at: syncResult.updated_at,
    });
  } catch (err) {
    // Campaign linked successfully but metrics sync failed — still return success
    return ok({
      linked: true,
      campaign_id,
      metrics: null,
      metrics_error: err.message || 'Failed to sync metrics after linking',
    });
  }
}

// =============================================================================
// Action Router
// =============================================================================

const ACTIONS = {
  // Groups
  list_groups: listGroups,
  upsert_group: upsertGroup,
  delete_group: deleteGroup,
  // Tasks
  list_tasks: listTasks,
  list_my_tasks: listMyTasks,
  get_task: getTask,
  upsert_task: upsertTask,
  delete_task: deleteTask,
  change_status: changeStatus,
  reorder,
  // Comments
  add_comment: addComment,
  list_comments: listComments,
  // Attachments
  add_attachment: addAttachment,
  delete_attachment: deleteAttachment,
  list_attachments: listAttachments,
  // Activity
  list_activity: listActivity,
  // Traffic-specific: Meta API
  sync_metrics: syncMetrics,
  bulk_sync_metrics: bulkSyncMetrics,
  link_campaign: linkCampaign,
};

// =============================================================================
// Main Handler
// =============================================================================

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  let action, params;

  if (req.method === 'GET') {
    const q = req.query || {};
    action = q.action;
    params = { ...q };
    delete params.action;
  } else if (req.method === 'POST') {
    const body = req.body || {};
    action = body.action;
    params = { ...body };
    delete params.action;
  } else {
    return res.status(405).json({ error: 'Use GET ou POST' });
  }

  if (!action) return res.status(400).json({ error: 'Campo "action" obrigatório' });

  const handler_fn = ACTIONS[action];
  if (!handler_fn) return res.status(400).json({ error: `Action desconhecida: ${action}` });

  try {
    const response = await handler_fn(params);
    // Response is a Web Response object — extract body and status
    const body = await response.json();
    return res.status(response.status).json(body);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Erro interno' });
  }
};
