/**
 * /api/asana/config — Asana configuration + consolidated actions
 *
 * GET  — Returns current config (workspace, mapping) + validates token
 * POST — Action-based routing:
 *   { action: "save_config", ... }   — Save configuration
 *   { action: "list_projects", workspace }  — List workspace projects
 *   { action: "list_sections", project }    — List project sections
 *   (no action / legacy) — Save configuration (backwards compat)
 */

const ASANA_BASE = 'https://app.asana.com/api/1.0';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.ASANA_PAT;
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

  // ─── GET: Return config + validate token ──────────────────
  if (req.method === 'GET') {
    const result = {
      connected: !!token,
      workspace: null,
      user: null,
      config: null,
    };

    if (token) {
      try {
        const meRes = await fetch(`${ASANA_BASE}/users/me?opt_fields=name,email,workspaces.name`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (meRes.ok) {
          const me = await meRes.json();
          result.user = { name: me.data.name, email: me.data.email };
          result.workspaces = (me.data.workspaces || []).map(w => ({ gid: w.gid, name: w.name }));
        } else {
          result.connected = false;
          result.error = 'Token inválido';
        }
      } catch (e) {
        result.connected = false;
        result.error = e.message;
      }
    }

    if (supabaseUrl && supabaseKey) {
      try {
        const cfgRes = await fetch(
          `${supabaseUrl}/rest/v1/asana_config?id=eq.default&select=*`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
            },
          }
        );
        if (cfgRes.ok) {
          const rows = await cfgRes.json();
          if (rows.length > 0) result.config = rows[0];
        }
      } catch (e) {
        // Config not available — frontend uses defaults
      }
    }

    return res.status(200).json(result);
  }

  // ─── POST: Action-based routing ───────────────────────────
  if (req.method === 'POST') {
    const body = req.body || {};
    const action = body.action || 'save_config';

    // ── list_projects ───────────────────────────────────────
    if (action === 'list_projects') {
      if (!token) return res.status(500).json({ error: 'ASANA_PAT not configured' });
      const workspace = body.workspace;
      if (!workspace) return res.status(400).json({ error: 'workspace field required' });

      try {
        const url = `${ASANA_BASE}/projects?workspace=${workspace}&opt_fields=name,color,archived,created_at,modified_at,notes,owner.name&limit=100&archived=false`;
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          return res.status(response.status).json({ error: 'Asana API error', details: err });
        }
        return res.status(200).json(await response.json());
      } catch (e) {
        return res.status(500).json({ error: 'Internal error', message: e.message });
      }
    }

    // ── list_sections ───────────────────────────────────────
    if (action === 'list_sections') {
      if (!token) return res.status(500).json({ error: 'ASANA_PAT not configured' });
      const project = body.project;
      if (!project) return res.status(400).json({ error: 'project field required' });

      try {
        const url = `${ASANA_BASE}/projects/${project}/sections?opt_fields=name,created_at`;
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          return res.status(response.status).json({ error: 'Asana API error', details: err });
        }
        return res.status(200).json(await response.json());
      } catch (e) {
        return res.status(500).json({ error: 'Internal error', message: e.message });
      }
    }

    // ── save_config (default) ───────────────────────────────
    const { workspace_gid, default_assignee_gid, default_project_gid, client_project_map } = body;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase not configured on server' });
    }

    const configData = {
      id: 'default',
      workspace_gid: workspace_gid || null,
      default_assignee_gid: default_assignee_gid || null,
      default_project_gid: default_project_gid || null,
      client_project_map: client_project_map || {},
      updated_at: new Date().toISOString(),
    };

    try {
      const upsertRes = await fetch(
        `${supabaseUrl}/rest/v1/asana_config`,
        {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates',
          },
          body: JSON.stringify(configData),
        }
      );

      if (!upsertRes.ok) {
        const err = await upsertRes.text();
        return res.status(500).json({ error: 'Failed to save config', details: err });
      }

      return res.status(200).json({ ok: true, config: configData });
    } catch (e) {
      return res.status(500).json({ error: 'Internal error', message: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
