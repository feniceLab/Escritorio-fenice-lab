"use client";

import { Key, Plus, Trash2, Server } from "lucide-react";

export interface EnvVar { key: string; value: string }
export interface McpServerDraft {
  name: string;
  command: string;
  args: string[];
  env: Record<string, string>;
}
export interface NpcPowersState {
  allowedTools: string[];
  envVars: EnvVar[];
  mcpServers: McpServerDraft[];
  maxTurns: number;
  timeoutMs: number;
}

export const DEFAULT_NPC_POWERS: NpcPowersState = {
  allowedTools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep", "WebFetch", "WebSearch", "TodoRead", "TodoWrite"],
  envVars: [],
  mcpServers: [],
  maxTurns: 25,
  timeoutMs: 180000,
};

export const AVAILABLE_TOOLS = [
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

interface Props {
  value: NpcPowersState;
  onChange: (next: NpcPowersState) => void;
}

export default function NpcPowersFields({ value, onChange }: Props) {
  const { allowedTools, envVars, mcpServers, maxTurns, timeoutMs } = value;
  const patch = (p: Partial<NpcPowersState>) => onChange({ ...value, ...p });

  const toggleTool = (id: string) =>
    patch({ allowedTools: allowedTools.includes(id) ? allowedTools.filter((t) => t !== id) : [...allowedTools, id] });

  const addEnvVar = () => patch({ envVars: [...envVars, { key: "", value: "" }] });
  const removeEnvVar = (i: number) => patch({ envVars: envVars.filter((_, idx) => idx !== i) });
  const updateEnvVar = (i: number, field: "key" | "value", val: string) =>
    patch({ envVars: envVars.map((ev, idx) => (idx === i ? { ...ev, [field]: val } : ev)) });

  const addMcp = () =>
    patch({ mcpServers: [...mcpServers, { name: "", command: "npx", args: [], env: {} }] });
  const removeMcp = (i: number) => patch({ mcpServers: mcpServers.filter((_, idx) => idx !== i) });
  const updateMcp = (i: number, field: string, val: unknown) =>
    patch({ mcpServers: mcpServers.map((s, idx) => (idx === i ? { ...s, [field]: val } : s)) });

  return (
    <div className="space-y-4">
      {/* Tokens & API Keys */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5" />
            Tokens & API Keys
          </h3>
          <button type="button" onClick={addEnvVar} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
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
                  type="text" value={ev.key}
                  onChange={(e) => updateEnvVar(i, "key", e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
                  placeholder="NOME_DA_CHAVE"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white font-mono"
                />
                <input
                  type="password" value={ev.value}
                  onChange={(e) => updateEnvVar(i, "value", e.target.value)}
                  placeholder="valor secreto"
                  className="flex-[2] bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white font-mono"
                />
                <button type="button" onClick={() => removeEnvVar(i)} className="text-red-500 hover:text-red-400 p-1">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MCP Servers */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5" />
            MCP Servers
          </h3>
          <button type="button" onClick={addMcp} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            <Plus className="w-3 h-3" /> Adicionar
          </button>
        </div>
        {mcpServers.length === 0 ? (
          <p className="text-xs text-gray-500 italic">Nenhum MCP server configurado</p>
        ) : (
          <div className="space-y-3">
            {mcpServers.map((server, i) => (
              <div key={i} className="bg-gray-800/50 border border-gray-700 rounded-lg p-2 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text" value={server.name}
                    onChange={(e) => updateMcp(i, "name", e.target.value.replace(/[^a-zA-Z0-9-_]/g, ""))}
                    placeholder="nome-do-server"
                    className="flex-1 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white font-mono"
                  />
                  <button type="button" onClick={() => removeMcp(i)} className="text-red-500 hover:text-red-400 p-1">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="text" value={server.command}
                    onChange={(e) => updateMcp(i, "command", e.target.value)}
                    placeholder="npx"
                    className="w-16 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white font-mono"
                  />
                  <input
                    type="text" value={server.args.join(" ")}
                    onChange={(e) => updateMcp(i, "args", e.target.value.split(" ").filter(Boolean))}
                    placeholder="-y @pkg/mcp-server"
                    className="flex-1 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white font-mono"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Ferramentas */}
      <section>
        <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">Ferramentas Permitidas</h3>
        <div className="grid grid-cols-2 gap-1">
          {AVAILABLE_TOOLS.map((tool) => (
            <label key={tool.id} className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white cursor-pointer py-0.5">
              <input
                type="checkbox" checked={allowedTools.includes(tool.id)}
                onChange={() => toggleTool(tool.id)}
                className="rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500 w-3 h-3"
              />
              <span className="font-mono">{tool.label}</span>
              <span className="text-gray-500">— {tool.desc}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Limites */}
      <section>
        <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">Limites</h3>
        <div className="flex gap-3">
          <label className="flex-1 text-xs text-gray-400">
            Max Turns
            <input
              type="number" value={maxTurns}
              onChange={(e) => patch({ maxTurns: Math.max(1, Math.min(100, Number(e.target.value))) })}
              className="w-full mt-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs"
            />
          </label>
          <label className="flex-1 text-xs text-gray-400">
            Timeout (seg)
            <input
              type="number" value={Math.floor(timeoutMs / 1000)}
              onChange={(e) => patch({ timeoutMs: Math.max(10, Math.min(600, Number(e.target.value))) * 1000 })}
              className="w-full mt-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs"
            />
          </label>
        </div>
      </section>
    </div>
  );
}

export function powersStateToPayload(state: NpcPowersState) {
  const envVarsObj: Record<string, string> = {};
  for (const { key, value } of state.envVars) {
    if (key.trim()) envVarsObj[key.trim()] = value;
  }
  return {
    allowedTools: state.allowedTools,
    envVars: envVarsObj,
    mcpServers: state.mcpServers,
    maxTurns: state.maxTurns,
    timeoutMs: state.timeoutMs,
  };
}
