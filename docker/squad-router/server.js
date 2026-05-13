/**
 * Starken Squad Router
 * =====================
 * Lightweight Express API that routes agent requests to LiteLLM proxy.
 *
 * POST /squad/:squadName/run
 * Body: { agent: string, task: string, brief: string, context?: string }
 *
 * Each squad's system prompt is loaded from the mounted xquads volume:
 *   /squads/<squad-name>/agents/<agent-name>.md
 */

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json({ limit: '1mb' }));

const PORT = process.env.PORT || 4001;
const LITELLM_URL = process.env.LITELLM_BASE_URL || 'http://litellm-proxy:4000';
const LITELLM_KEY = process.env.LITELLM_MASTER_KEY || '';
const SQUADS_BASE = process.env.SQUADS_BASE_PATH || '/squads';
const DEFAULT_MODEL = process.env.DEFAULT_SQUAD_MODEL || 'gemini-flash';

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────

function loadAgentPrompt(squadName, agentName) {
  const agentFile = path.join(SQUADS_BASE, squadName, 'agents', `${agentName}.md`);
  if (!fs.existsSync(agentFile)) return null;
  return fs.readFileSync(agentFile, 'utf-8');
}

function listAgents(squadName) {
  const agentsDir = path.join(SQUADS_BASE, squadName, 'agents');
  if (!fs.existsSync(agentsDir)) return [];
  return fs.readdirSync(agentsDir)
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace('.md', ''));
}

function loadSquadMeta(squadName) {
  const yamlPath = path.join(SQUADS_BASE, squadName, 'squad.yaml');
  if (!fs.existsSync(yamlPath)) return null;
  const content = fs.readFileSync(yamlPath, 'utf-8');
  // Simple key: value parser — avoids full yaml dep at runtime
  const meta = {};
  for (const line of content.split('\n')) {
    const m = line.match(/^(\w[\w-]*):\s+"?([^"]+)"?/);
    if (m) meta[m[1]] = m[2].trim();
  }
  return meta;
}

async function callLiteLLM(systemPrompt, userMessage, model = DEFAULT_MODEL) {
  const body = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    max_tokens: 4096,
    temperature: 0.7
  };

  const res = await fetch(`${LITELLM_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LITELLM_KEY}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LiteLLM error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// ────────────────────────────────────────────
// Routes
// ────────────────────────────────────────────

// Health
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'squad-router' }));

// List all available squads
app.get('/squad', (req, res) => {
  try {
    const squads = fs.readdirSync(SQUADS_BASE)
      .filter(d => fs.statSync(path.join(SQUADS_BASE, d)).isDirectory())
      .map(d => {
        const meta = loadSquadMeta(d);
        const agents = listAgents(d);
        return { name: d, agents, description: meta?.description || '' };
      });
    res.json({ squads });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// List agents in a squad
app.get('/squad/:squadName', (req, res) => {
  const { squadName } = req.params;
  const agents = listAgents(squadName);
  if (!agents.length) return res.status(404).json({ error: `Squad "${squadName}" not found` });
  const meta = loadSquadMeta(squadName);
  res.json({ squad: squadName, agents, meta });
});

// Run an agent
app.post('/squad/:squadName/run', async (req, res) => {
  const { squadName } = req.params;
  const { agent, task, brief, context, model } = req.body || {};

  if (!agent) return res.status(400).json({ error: 'agent is required' });
  if (!brief) return res.status(400).json({ error: 'brief is required' });

  const systemPrompt = loadAgentPrompt(squadName, agent);
  if (!systemPrompt) {
    return res.status(404).json({
      error: `Agent "${agent}" not found in squad "${squadName}"`,
      available: listAgents(squadName)
    });
  }

  const userMessage = [
    task ? `## Task: ${task}` : '',
    `## Brief\n${brief}`,
    context ? `## Context\n${context}` : ''
  ].filter(Boolean).join('\n\n');

  try {
    const output = await callLiteLLM(systemPrompt, userMessage, model || DEFAULT_MODEL);
    res.json({
      squad: squadName,
      agent,
      task: task || 'general',
      output,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ────────────────────────────────────────────
// Start
// ────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Starken Squad Router running on port ${PORT}`);
  console.log(`📂 Squads path: ${SQUADS_BASE}`);
  console.log(`🤖 LiteLLM: ${LITELLM_URL}`);
});
