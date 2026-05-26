"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
  X,
  KeyRound,
  Server,
  Sparkles,
  Plus,
  Trash2,
  RefreshCw,
  Loader2,
  ShieldCheck,
  Building2,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface ApiItem {
  id: string;
  name: string;
  category: string;
  hasValue: boolean;
  updatedAt?: string | null;
  metadata?: Record<string, unknown> | null;
}

interface ClientConfig {
  id: string;
  channelId: string;
  channelName: string;
  config: {
    facebook_page_id?: string;
    instagram_handle?: string;
    ad_account_id?: string;
    whatsapp_group_id?: string;
  };
  updatedAt?: string | null;
}

interface McpServerSummary {
  id: string;
  name: string;
  description: string | null;
  command: string;
  args: string[] | null;
  envVariables?: Record<string, unknown> | null;
}

interface SkillSummary {
  id: string;
  name: string;
  description: string | null;
  instructions: string;
}

interface OpsLibraryResponse {
  channel?: {
    id: string;
    name: string;
    channelType?: string | null;
    parentChannelId?: string | null;
  };
  apiItems?: ApiItem[];
  allClientConfigs?: ClientConfig[];
  mcpServers?: McpServerSummary[];
  skills?: SkillSummary[];
}

interface ChannelOpsLibraryModalProps {
  channelId: string;
  channelName: string;
  onClose: () => void;
}

function formatDate(value?: string | null) {
  if (!value) return "sem data";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "sem data";
  return date.toLocaleDateString("pt-BR");
}

export default function ChannelOpsLibraryModal({ channelId, channelName, onClose }: ChannelOpsLibraryModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [apiItems, setApiItems] = useState<ApiItem[]>([]);
  const [clientConfigs, setClientConfigs] = useState<ClientConfig[]>([]);
  const [mcpServers, setMcpServers] = useState<McpServerSummary[]>([]);
  const [skills, setSkills] = useState<SkillSummary[]>([]);
  const [resolvedName, setResolvedName] = useState(channelName);
  const [channelType, setChannelType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"infra" | "clients">("infra");
  const [clientSearch, setClientSearch] = useState("");
  const [editingToken, setEditingToken] = useState<{ id?: string; name: string; value: string }>({ name: "", value: "" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/channels/${channelId}/ops-library`);
      if (!res.ok) {
        throw new Error("Não foi possível carregar MCPs e APIs deste canal");
      }

      const data = (await res.json()) as OpsLibraryResponse;
      setResolvedName(data.channel?.name || channelName);
      setChannelType(data.channel?.channelType || null);
      setApiItems(data.apiItems ?? []);
      setClientConfigs(data.allClientConfigs ?? []);
      setMcpServers(data.mcpServers ?? []);
      setSkills(data.skills ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar recursos operacionais");
    } finally {
      setLoading(false);
    }
  }, [channelId, channelName]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const tokenStats = useMemo(
    () => ({
      configured: apiItems.filter((item) => item.hasValue).length,
      total: apiItems.length,
    }),
    [apiItems],
  );

  const resetTokenForm = () => {
    setEditingToken({ name: "", value: "" });
  };

  const handleSaveToken = async () => {
    if (!editingToken.name.trim() || !editingToken.value.trim()) return;

    setSaving(true);
    setError(null);
    try {
      const endpoint = editingToken.id
        ? `/api/channels/${channelId}/library/${editingToken.id}`
        : `/api/channels/${channelId}/library`;
      const method = editingToken.id ? "PUT" : "POST";
      const body = editingToken.id
        ? { name: editingToken.name.trim(), content: editingToken.value.trim() }
        : {
            layer: "api",
            category: "api-key",
            name: editingToken.name.trim(),
            content: editingToken.value.trim(),
            metadata: { source: "ops-library" },
          };

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || "Falha ao salvar token");
      }

      resetTokenForm();
      await fetchData();
      setToast(editingToken.id ? "Token atualizado" : "Token criado");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar token");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteToken = async (itemId: string) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/channels/${channelId}/library/${itemId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || "Falha ao remover token");
      }

      await fetchData();
      setToast("Token removido");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover token");
    } finally {
      setSaving(false);
    }
  };

  const filteredClientConfigs = useMemo(() => {
    if (!clientSearch.trim()) return clientConfigs;
    const s = clientSearch.toLowerCase();
    return clientConfigs.filter((c) => c.channelName.toLowerCase().includes(s));
  }, [clientConfigs, clientSearch]);

  const infraItems = apiItems.filter((i) => i.category !== "client-config");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 py-6" onClick={onClose}>
      <div className="flex h-[min(90vh,900px)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-gray-800 bg-gray-950 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header Section */}
        <div className="border-b border-gray-800 bg-gray-900 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                Infra do canal
              </div>
              <h2 className="mt-3 text-lg font-semibold text-white">MCP & APIs · {resolvedName}</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-400">
                Gerencie tokens, MCP servers e os dados operacionais (APIs) dos seus clientes de forma centralizada.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {toast ? <div className="rounded-full bg-green-900/50 px-3 py-1 text-xs text-green-300">{toast}</div> : null}
              <button
                type="button"
                onClick={() => void fetchData()}
                className="rounded-lg border border-gray-700 bg-gray-800 p-2 text-gray-300 transition hover:border-gray-600 hover:text-white"
                title="Atualizar"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button onClick={onClose} className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-800 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="mt-5 flex gap-1 border-t border-gray-800/50 pt-4">
            <button
              onClick={() => setActiveTab("infra")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                activeTab === "infra"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                  : "text-gray-500 hover:bg-gray-800 hover:text-gray-300"
              }`}
            >
              <Server className="h-3.5 w-3.5" />
              Infra Estrutura
            </button>
            <button
              onClick={() => setActiveTab("clients")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                activeTab === "clients"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                  : "text-gray-500 hover:bg-gray-800 hover:text-gray-300"
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              APIs de Clientes
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          {activeTab === "infra" ? (
            <div className="grid h-full grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
              {/* Left Column: Tokens */}
              <div className="overflow-y-auto border-r border-gray-800 p-5">
                <div className="grid gap-3 md:grid-cols-3">
                  <OpsStatCard label="Tokens ativos" value={String(tokenStats.configured)} hint={`${tokenStats.total} cadastrados`} icon={<KeyRound className="h-4 w-4 text-amber-300" />} />
                  <OpsStatCard label="MCP servers" value={String(mcpServers.length)} hint="ligados ao canal" icon={<Server className="h-4 w-4 text-emerald-300" />} />
                  <OpsStatCard label="Skills" value={String(skills.length)} hint="habilidades disponíveis" icon={<Sparkles className="h-4 w-4 text-fuchsia-300" />} />
                </div>

                {error ? (
                  <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
                ) : null}

                <section className="mt-6 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-white">Tokens & API Keys</h3>
                      <p className="mt-1 text-xs text-gray-500">Chaves globais de API do canal.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingToken({ name: "", value: "" })}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-xs font-medium text-indigo-200 transition hover:bg-indigo-500/20"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Novo token
                    </button>
                  </div>

                  <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-4">
                    <div className="grid gap-3 md:grid-cols-[1fr_1.2fr_auto]">
                      <input
                        type="text"
                        value={editingToken.name}
                        onChange={(e) => setEditingToken((prev) => ({ ...prev, name: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") }))}
                        placeholder="NOME_DA_VARIAVEL"
                        className="rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none"
                      />
                      <input
                        type="password"
                        value={editingToken.value}
                        onChange={(e) => setEditingToken((prev) => ({ ...prev, value: e.target.value }))}
                        placeholder={editingToken.id ? "Novo valor secreto" : "Valor secreto"}
                        className="rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-sm font-mono text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void handleSaveToken()}
                          disabled={saving || !editingToken.name.trim() || !editingToken.value.trim()}
                          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:bg-gray-700"
                        >
                          {saving ? "..." : editingToken.id ? "Atualizar" : "Salvar"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center py-10 text-gray-500"><Loader2 className="animate-spin h-5 w-5" /></div>
                  ) : infraItems.length === 0 ? (
                    <EmptyCard text="Nenhum token global." />
                  ) : (
                    <div className="grid gap-3">
                      {infraItems.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-gray-800 bg-gray-900/50 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-white">{item.name}</div>
                              <div className="mt-1 text-xs text-gray-500">{item.category} · {formatDate(item.updatedAt)}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => setEditingToken({ id: item.id, name: item.name, value: "" })} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-gray-200 hover:text-white transition">Substituir</button>
                              <button onClick={() => void handleDeleteToken(item.id)} className="rounded-lg bg-red-500/10 p-2 text-red-300 hover:bg-red-500/20 transition"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              {/* Right Column: MCP & Skills */}
              <div className="overflow-y-auto p-5">
                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-white">MCP servers do canal</h3>
                  {mcpServers.map((server) => (
                    <div key={server.id} className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                      <div className="text-sm font-semibold text-white">{server.name}</div>
                      <p className="mt-1 text-xs text-gray-400">{server.description}</p>
                    </div>
                  ))}
                  <h3 className="mt-6 text-sm font-semibold text-white">Skills ativas</h3>
                  {skills.map((skill) => (
                    <div key={skill.id} className="rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/5 p-4">
                      <div className="text-sm font-semibold text-white">{skill.name}</div>
                      <p className="mt-2 text-xs text-gray-400 line-clamp-2">{skill.instructions}</p>
                    </div>
                  ))}
                </section>
              </div>
            </div>
          ) : (
            /* Clients Tab: Grid of cards */
            <div className="flex h-full flex-col p-5">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    placeholder="Buscar cliente pelo nome..."
                    className="w-full rounded-xl border border-gray-800 bg-gray-900 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {filteredClientConfigs.length} clientes configurados
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2">
                {loading ? (
                   <div className="flex h-40 items-center justify-center"><Loader2 className="animate-spin text-indigo-500" /></div>
                ) : filteredClientConfigs.length === 0 ? (
                  <EmptyCard text="Nenhum cliente com APIs configuradas encontrado." />
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 pb-8">
                    {filteredClientConfigs.map((c) => (
                      <ClientConfigCard key={c.id} data={c} onSave={fetchData} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ClientConfigCard({ data, onSave }: { data: ClientConfig; onSave: () => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(data.config);

  const isConfigured = Object.values(data.config).some(v => !!v);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/channels/${data.channelId}/library/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "CLIENT_METADATA_OPERATIONAL",
          content: JSON.stringify(form)
        })
      });
      if (!res.ok) throw new Error("Falha ao salvar");
      setEditing(false);
      await onSave();
    } catch (err) {
      alert("Erro ao salvar dados do cliente");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`group rounded-2xl border transition-all duration-300 ${
      isConfigured ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-gray-800 bg-gray-900/40 hover:border-gray-700'
    }`}>
      <div className="flex items-center justify-between border-b border-gray-800/50 p-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold text-lg ${
            isConfigured ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-500'
          }`}>
            {data.channelName.charAt(0)}
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">{data.channelName}</h4>
            <span className="text-[10px] uppercase tracking-wider text-gray-500">Fenix Lab · Client</span>
          </div>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            editing ? 'bg-gray-800 text-white' : 'text-indigo-400 hover:bg-indigo-500/10'
          }`}
        >
          {editing ? 'Cancelar' : 'Editar'}
        </button>
      </div>

      <div className="p-4 space-y-4">
        <MetadataField label="PG. FACEBOOK" value={form.facebook_page_id} editing={editing} onChange={(v) => setForm(f => ({ ...f, facebook_page_id: v }))} placeholder="317556..." />
        <MetadataField label="INSTAGRAM" value={form.instagram_handle} editing={editing} onChange={(v) => setForm(f => ({ ...f, instagram_handle: v }))} placeholder="@perfil" />
        <MetadataField label="CONTA DE ANÚNCIOS" value={form.ad_account_id} editing={editing} onChange={(v) => setForm(f => ({ ...f, ad_account_id: v }))} placeholder="act_..." />
        <MetadataField label="GRUPO WHATSAPP" value={form.whatsapp_group_id} editing={editing} onChange={(v) => setForm(f => ({ ...f, whatsapp_group_id: v }))} placeholder="120363..." />
        
        {editing && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full mt-2 rounded-xl bg-indigo-600 py-2 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition disabled:bg-gray-700"
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        )}
      </div>
    </div>
  );
}

function MetadataField({ label, value, editing, onChange, placeholder }: { label: string; value?: string; editing: boolean; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-gray-500">{label}</label>
      {editing ? (
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-xs text-white placeholder-gray-700 focus:border-indigo-500 focus:outline-none"
        />
      ) : (
        <div className="flex items-center gap-2 rounded-lg bg-black/40 px-3 py-2 text-xs font-mono text-gray-300">
          {value || "—"}
          {value && <CheckCircle2 className="h-3 w-3 text-emerald-500/50" />}
        </div>
      )}
    </div>
  );
}

function OpsStatCard({ label, value, hint, icon }: { label: string; value: string; hint: string; icon: ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">{label}</div>
          <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
          <div className="mt-1 text-xs text-gray-500">{hint}</div>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-950 p-2.5">{icon}</div>
      </div>
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/30 px-4 py-8 text-center text-sm text-gray-500">
      {text}
    </div>
  );
}
