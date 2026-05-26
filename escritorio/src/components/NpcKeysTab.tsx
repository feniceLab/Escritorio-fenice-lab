"use client";

import { useCallback, useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { Key, Plus, Trash2, Save, Loader2, Server, Zap, ChevronDown, ChevronUp } from "lucide-react";

// Catálogo de templates de MCP — preencha os campos marcados com [FILL]
const MCP_TEMPLATES: {
  id: string;
  label: string;
  description: string;
  badge: string;
  server: { name: string; command: string; args: string[]; env: Record<string, string> };
  envVars: { key: string; placeholder: string; hint: string }[];
}[] = [
  {
    id: "supabase-readonly",
    label: "Supabase (leitura)",
    description: "Consultas SQL diretas no banco. João usa pra relatórios, Zezin pra monitoramento.",
    badge: "Banco de dados",
    server: {
      name: "supabase",
      command: "npx",
      args: ["-y", "@supabase/mcp-server-supabase@latest", "--read-only", "--project-ref", "cpwpxckmuecejtkcobre"],
      env: { SUPABASE_ACCESS_TOKEN: "" },
    },
    envVars: [
      { key: "SUPABASE_ACCESS_TOKEN", placeholder: "sbp_xxxxxxxxxxxx", hint: "Supabase Dashboard → Account → Access Tokens" },
    ],
  },
  {
    id: "supabase-full",
    label: "Supabase (leitura + escrita)",
    description: "Acesso completo. Use apenas para NPCs que precisam criar/atualizar registros.",
    badge: "Banco de dados",
    server: {
      name: "supabase",
      command: "npx",
      args: ["-y", "@supabase/mcp-server-supabase@latest", "--project-ref", "cpwpxckmuecejtkcobre"],
      env: { SUPABASE_ACCESS_TOKEN: "" },
    },
    envVars: [
      { key: "SUPABASE_ACCESS_TOKEN", placeholder: "sbp_xxxxxxxxxxxx", hint: "Supabase Dashboard → Account → Access Tokens" },
    ],
  },
  {
    id: "meta-graph",
    label: "Meta Graph API",
    description: "Insights de ads, publicações do Facebook/Instagram. Josy e João.",
    badge: "Marketing",
    server: {
      name: "meta-graph",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-fetch@latest"],
      env: { META_ACCESS_TOKEN: "", META_BASE_URL: "https://graph.facebook.com/v25.0" },
    },
    envVars: [
      { key: "META_ACCESS_TOKEN", placeholder: "EAAxxxxxx...", hint: "Meta Business Suite → Configurações → Tokens de acesso" },
    ],
  },
  {
    id: "fetch-web",
    label: "Web Fetch",
    description: "Acesso a URLs públicas. Para buscar dados de APIs externas.",
    badge: "Utilidade",
    server: {
      name: "fetch",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-fetch@latest"],
      env: {},
    },
    envVars: [],
  },
  {
    id: "filesystem-local",
    label: "Filesystem (local)",
    description: "Leitura/escrita em arquivos locais. Para NPCs que geram relatórios em arquivo.",
    badge: "Sistema",
    server: {
      name: "filesystem",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem@latest", "/tmp/npc-workspace"],
      env: {},
    },
    envVars: [],
  },
];

interface EnvVar {
  key: string;
  value: string;
}

interface McpServer {
  name: string;
  command: string;
  args: string[];
  env: Record<string, string>;
}

interface PowersData {
  allowedTools: string[];
  envVars: Record<string, string>;
  mcpServers: McpServer[];
  maxTurns: number;
  timeoutMs: number;
}

interface NpcKeysTabProps {
  npcId: string;
}

const AVAILABLE_TOOLS = [
  { id: "Read", label: "Read", desc: "Ler arquivos" },
  { id: "Write", label: "Write", desc: "Criar arquivos" },
  { id: "Edit", label: "Edit", desc: "Editar arquivos" },
  { id: "Bash", label: "Bash", desc: "Executar comandos" },
  { id: "Glob", label: "Glob", desc: "Buscar arquivos" },
  { id: "Grep", label: "Grep", desc: "Buscar conteúdo" },
  { id: "WebFetch", label: "WebFetch", desc: "Buscar URLs" },
  { id: "WebSearch", label: "WebSearch", desc: "Pesquisar na web" },
  { id: "TodoRead", label: "TodoRead", desc: "Ler tarefas" },
  { id: "TodoWrite", label: "TodoWrite", desc: "Gerenciar tarefas" },
];

export default function NpcKeysTab({ npcId }: NpcKeysTabProps) {
  const t = useT();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateEnvInputs, setTemplateEnvInputs] = useState<Record<string, Record<string, string>>>({});

  // Powers state
  const [allowedTools, setAllowedTools] = useState<string[]>([]);
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);
  const [mcpServers, setMcpServers] = useState<McpServer[]>([]);
  const [maxTurns, setMaxTurns] = useState(25);
  const [timeoutMs, setTimeoutMs] = useState(180000);

  // Load powers
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/npcs/${npcId}/powers`)
      .then((r) => r.json())
      .then((data) => {
        const p: PowersData = data.powers || {};
        setAllowedTools(p.allowedTools || []);
        setEnvVars(
          Object.entries(p.envVars || {}).map(([key, value]) => ({ key, value })),
        );
        setMcpServers(
          (p.mcpServers || []).map((s) => ({
            name: s.name || "",
            command: s.command || "npx",
            args: s.args || [],
            env: s.env || {},
          })),
        );
        setMaxTurns(p.maxTurns || 25);
        setTimeoutMs(p.timeoutMs || 180000);
      })
      .catch(() => setError("Falha ao carregar powers"))
      .finally(() => setLoading(false));
  }, [npcId]);

  // Save powers
  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const envVarsObj: Record<string, string> = {};
      for (const { key, value } of envVars) {
        if (key.trim()) envVarsObj[key.trim()] = value;
      }

      const res = await fetch(`/api/npcs/${npcId}/powers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allowedTools,
          envVars: envVarsObj,
          mcpServers,
          maxTurns,
          timeoutMs,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Falha ao salvar");
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch {
      setError("Erro de rede");
    } finally {
      setSaving(false);
    }
  }, [npcId, allowedTools, envVars, mcpServers, maxTurns, timeoutMs]);

  // Tool toggle
  const toggleTool = (toolId: string) => {
    setAllowedTools((prev) =>
      prev.includes(toolId) ? prev.filter((t) => t !== toolId) : [...prev, toolId],
    );
  };

  // Env var handlers
  const addEnvVar = () => setEnvVars((prev) => [...prev, { key: "", value: "" }]);
  const removeEnvVar = (index: number) => setEnvVars((prev) => prev.filter((_, i) => i !== index));
  const updateEnvVar = (index: number, field: "key" | "value", val: string) => {
    setEnvVars((prev) => prev.map((ev, i) => (i === index ? { ...ev, [field]: val } : ev)));
  };

  // MCP server handlers
  const addMcpServer = () =>
    setMcpServers((prev) => [...prev, { name: "", command: "npx", args: [], env: {} }]);
  const removeMcpServer = (index: number) =>
    setMcpServers((prev) => prev.filter((_, i) => i !== index));
  const updateMcpServer = (index: number, field: string, val: unknown) => {
    setMcpServers((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: val } : s)),
    );
  };

  // Aplicar template de MCP
  const applyTemplate = (templateId: string) => {
    const tpl = MCP_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;

    // Merge env from template inputs
    const inputs = templateEnvInputs[templateId] || {};
    const env: Record<string, string> = {};
    for (const [k, v] of Object.entries(tpl.server.env)) {
      env[k] = inputs[k] || v;
    }

    // Avoid duplicate by name
    const alreadyExists = mcpServers.some((s) => s.name === tpl.server.name);
    if (alreadyExists) {
      // Update existing
      setMcpServers((prev) => prev.map((s) =>
        s.name === tpl.server.name
          ? { ...tpl.server, env }
          : s
      ));
    } else {
      setMcpServers((prev) => [...prev, { ...tpl.server, env }]);
    }

    // Also add env vars to the envVars list (for visibility)
    for (const { key } of tpl.envVars) {
      const val = inputs[key] || "";
      if (val && !envVars.some((ev) => ev.key === key)) {
        setEnvVars((prev) => [...prev, { key, value: val }]);
      }
    }

    setShowTemplates(false);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Carregando...
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
      {/* ── Tokens & API Keys ── */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5" />
            Tokens & API Keys
          </h3>
          <button
            onClick={addEnvVar}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Adicionar
          </button>
        </div>

        {envVars.length === 0 ? (
          <p className="text-xs text-gray-500 italic">Nenhum token configurado</p>
        ) : (
          <div className="space-y-2">
            {envVars.map((ev, i) => (
              <div key={i} className="flex gap-1.5 items-start">
                <input
                  type="text"
                  value={ev.key}
                  onChange={(e) => updateEnvVar(i, "key", e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
                  placeholder="NOME_DA_CHAVE"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white font-mono"
                />
                <input
                  type="password"
                  value={ev.value}
                  onChange={(e) => updateEnvVar(i, "value", e.target.value)}
                  placeholder="valor secreto"
                  className="flex-[2] bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white font-mono"
                />
                <button
                  onClick={() => removeEnvVar(i)}
                  className="text-red-500 hover:text-red-400 p-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── MCP Servers ── */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5" />
            MCP Servers
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTemplates((v) => !v)}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <Zap className="w-3 h-3" />
              Templates
              {showTemplates ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            <button
              onClick={addMcpServer}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Manual
            </button>
          </div>
        </div>

        {/* Templates catalog */}
        {showTemplates && (
          <div className="mb-3 space-y-2 border border-emerald-500/20 rounded-lg p-2 bg-emerald-950/20">
            <p className="text-[10px] text-emerald-400/70 mb-1">Clique em um template para pré-configurar o MCP. Preencha as chaves necessárias antes de aplicar.</p>
            {MCP_TEMPLATES.map((tpl) => {
              const inputs = templateEnvInputs[tpl.id] || {};
              return (
                <div key={tpl.id} className="bg-gray-800/60 border border-gray-700 rounded-lg p-2 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-white">{tpl.label}</span>
                        <span className="text-[9px] uppercase tracking-wider border border-emerald-500/30 text-emerald-400 rounded px-1">{tpl.badge}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">{tpl.description}</p>
                    </div>
                    <button
                      onClick={() => applyTemplate(tpl.id)}
                      className="shrink-0 text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded font-medium"
                    >
                      Aplicar
                    </button>
                  </div>
                  {tpl.envVars.map(({ key, placeholder, hint }) => (
                    <div key={key} className="space-y-0.5">
                      <label className="text-[10px] text-gray-400">{key}</label>
                      <input
                        type="password"
                        value={inputs[key] || ""}
                        onChange={(e) => setTemplateEnvInputs((prev) => ({
                          ...prev,
                          [tpl.id]: { ...prev[tpl.id], [key]: e.target.value },
                        }))}
                        placeholder={placeholder}
                        className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white font-mono"
                      />
                      <p className="text-[10px] text-gray-500">{hint}</p>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}


        {mcpServers.length === 0 ? (
          <p className="text-xs text-gray-500 italic">Nenhum MCP server configurado</p>
        ) : (
          <div className="space-y-3">
            {mcpServers.map((server, i) => (
              <div key={i} className="bg-gray-800/50 border border-gray-700 rounded-lg p-2 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={server.name}
                    onChange={(e) => updateMcpServer(i, "name", e.target.value.replace(/[^a-zA-Z0-9-_]/g, ""))}
                    placeholder="nome-do-server"
                    className="flex-1 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white font-mono"
                  />
                  <button
                    onClick={() => removeMcpServer(i)}
                    className="text-red-500 hover:text-red-400 p-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={server.command}
                    onChange={(e) => updateMcpServer(i, "command", e.target.value)}
                    placeholder="npx"
                    className="w-16 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white font-mono"
                  />
                  <input
                    type="text"
                    value={server.args.join(" ")}
                    onChange={(e) => updateMcpServer(i, "args", e.target.value.split(" ").filter(Boolean))}
                    placeholder="-y @pkg/mcp-server"
                    className="flex-1 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white font-mono"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Ferramentas ── */}
      <section>
        <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
          Ferramentas Permitidas
        </h3>
        <div className="grid grid-cols-2 gap-1">
          {AVAILABLE_TOOLS.map((tool) => (
            <label
              key={tool.id}
              className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white cursor-pointer py-0.5"
            >
              <input
                type="checkbox"
                checked={allowedTools.includes(tool.id)}
                onChange={() => toggleTool(tool.id)}
                className="rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500 w-3 h-3"
              />
              <span className="font-mono">{tool.label}</span>
              <span className="text-gray-500">— {tool.desc}</span>
            </label>
          ))}
        </div>
      </section>

      {/* ── Limites ── */}
      <section>
        <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
          Limites
        </h3>
        <div className="flex gap-3">
          <label className="flex-1 text-xs text-gray-400">
            Max Turns
            <input
              type="number"
              value={maxTurns}
              onChange={(e) => setMaxTurns(Math.max(1, Math.min(100, Number(e.target.value))))}
              className="w-full mt-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs"
            />
          </label>
          <label className="flex-1 text-xs text-gray-400">
            Timeout (seg)
            <input
              type="number"
              value={Math.floor(timeoutMs / 1000)}
              onChange={(e) => setTimeoutMs(Math.max(10, Math.min(600, Number(e.target.value))) * 1000)}
              className="w-full mt-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs"
            />
          </label>
        </div>
      </section>

      {/* ── Save Button ── */}
      <div className="pt-2 border-t border-gray-700">
        {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
        {success && <p className="text-xs text-green-400 mb-2">Powers salvos!</p>}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 text-white text-xs font-medium py-2 px-3 rounded transition-colors"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {saving ? "Salvando..." : "Salvar Powers"}
        </button>
      </div>
    </div>
  );
}
