"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { X, BookOpen } from "lucide-react";
import LibrarySidebar from "./LibrarySidebar";
import LibraryCanvas from "./LibraryCanvas";
import LibraryBottomPanel from "./LibraryBottomPanel";
import LibraryDocsView from "./LibraryDocsView";
import {
  CLIENT_LIBRARY_MANIFEST,
  getClientLibraryManifestEntry,
  type ClientLibraryManifestEntry,
  type ClientTenant,
} from "@/lib/client-library-manifest";
import { getClientLibrarySeed } from "@/lib/client-library-defaults";

// ---------------------------------------------------------------------------
// Types (shared across library components)
// ---------------------------------------------------------------------------

export interface LibraryItem {
  id: string;
  channelId: string;
  layer: string;
  category: string;
  name: string;
  content: string | null;
  metadata: MetaData | null;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface MetaData {
  filename?: string;
  mime?: string;
  size?: number;
  cssValue?: string;
  fontFamily?: string;
  fontWeight?: string;
  componentType?: string;
  platform?: string;
  postType?: string;
  originalUrl?: string;
  capturedAt?: string;
  caption?: string;
  createdByNpcId?: string;
  createdByNpcName?: string;
  status?: string;
  scheduledAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  [key: string]: unknown;
}

export type ViewMode = "canvas" | "docs";
export type CanvasBg = "light" | "dark" | "brand" | "checker";
export type DeviceSize = "mobile" | "tablet" | "desktop";
export type BottomTab = "properties" | "code" | "history";

interface LibraryStorybookProps {
  channelId: string;
  channelName: string;
  onClose: () => void;
  visibleLayers?: string[];
}

interface ChannelDetailsResponse {
  channel?: {
    id: string;
    name: string;
    clientName?: string | null;
    channelType?: string | null;
    parentChannelId?: string | null;
  };
}

interface ClientRoomSummary {
  id: string;
  name: string;
  clientName?: string | null;
}

interface RelatedClientRoomsResponse {
  rooms?: ClientRoomSummary[];
}

interface LibraryScope {
  channelId: string;
  name: string;
  scopeType: "hq" | "client" | "manifest-client";
  badge: string;
  tenant?: ClientTenant;
  sourceClientName?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LibraryStorybook({ channelId, channelName, onClose, visibleLayers }: LibraryStorybookProps) {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [scopes, setScopes] = useState<LibraryScope[]>([
    { channelId, name: channelName, scopeType: "hq", badge: "Canal atual" },
  ]);
  const [activeScopeId, setActiveScopeId] = useState(channelId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("canvas");
  const [canvasBg, setCanvasBg] = useState<CanvasBg>("dark");
  const [deviceSize, setDeviceSize] = useState<DeviceSize>("desktop");
  const [bottomTab, setBottomTab] = useState<BottomTab>("properties");
  const [bottomCollapsed, setBottomCollapsed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [addDialog, setAddDialog] = useState<string | null>(null); // layer to add to

  const fileRef = useRef<HTMLInputElement>(null);
  const visibleLayerList = useMemo(
    () => (visibleLayers && visibleLayers.length > 0 ? visibleLayers : ["design", "documents", "social", "creations", "api"]),
    [visibleLayers],
  );
  const visibleLayerSet = useMemo(() => new Set(visibleLayerList), [visibleLayerList]);
  const activeScope = useMemo(
    () => scopes.find((scope) => scope.channelId === activeScopeId) ?? scopes[0] ?? null,
    [activeScopeId, scopes],
  );
  const isClientScope = activeScope?.scopeType === "client";
  const isManifestClientScope = activeScope?.scopeType === "manifest-client";
  const isReadOnlyScope = isManifestClientScope;

  const buildManifestPreviewItems = useCallback((entry: ClientLibraryManifestEntry): LibraryItem[] => {
    const virtualChannelId = `manifest:${entry.tenant}:${entry.clientName}`;
    const seedItems = getClientLibrarySeed({
      clientName: entry.clientName,
      businessType: entry.businessType,
    });

    const seedLibraryItems: LibraryItem[] = seedItems.map((item, index) => ({
      id: `${virtualChannelId}:${item.layer}:${item.category}:${index}`,
      channelId: virtualChannelId,
      layer: item.layer,
      category: item.category,
      name: item.name,
      content: item.content ?? item.assetPath ?? null,
      metadata: {
        ...(item.metadata ?? {}),
        previewScope: true,
        sourceMode: entry.source.mode,
        sourceQuality: entry.source.quality,
        brandFamily: entry.brandFamily,
      },
      sortOrder: index,
    }));

    const sourceSummary = [
      `Cliente: ${entry.clientName}`,
      `Tenant: ${entry.tenant}`,
      `Segmento: ${entry.segment}`,
      `Responsável: ${entry.responsible}`,
      `Tipo de origem: ${entry.source.mode}`,
      `Qualidade da fonte: ${entry.source.quality}`,
      `Fonte principal: ${entry.source.sourceLabel}`,
      entry.source.sharedBrandKey ? `Família de marca: ${entry.source.sharedBrandKey}` : null,
      entry.source.notes ? `Observações: ${entry.source.notes}` : null,
      "",
      "Cobertura de ativos:",
      `- Website: ${entry.source.assetCoverage.website ? "sim" : "não"}`,
      `- Drive: ${entry.source.assetCoverage.drive ? "sim" : "não"}`,
      `- Aprovação: ${entry.source.assetCoverage.approval ? "sim" : "não"}`,
      `- Logo: ${entry.source.assetCoverage.logo ? "sim" : "não"}`,
      `- Social: ${entry.source.assetCoverage.social ? "sim" : "não"}`,
      entry.source.repoArtifacts.length > 0 ? "" : null,
      entry.source.repoArtifacts.length > 0 ? "Artefatos locais encontrados:" : null,
      ...entry.source.repoArtifacts.map((artifact) => `- ${artifact}`),
    ].filter(Boolean).join("\n");

    const gapSummary = entry.source.gaps.length > 0
      ? entry.source.gaps.map((gap) => `- ${gap}`).join("\n")
      : "Nenhuma lacuna crítica mapeada para esta biblioteca.";

    const docs: LibraryItem[] = [
      {
        id: `${virtualChannelId}:documents:source-map`,
        channelId: virtualChannelId,
        layer: "documents",
        category: "source-map",
        name: `Fonte da biblioteca — ${entry.clientName}`,
        content: sourceSummary,
        metadata: {
          previewScope: true,
          sourceMode: entry.source.mode,
          sourceQuality: entry.source.quality,
        },
        sortOrder: 10_000,
      },
      {
        id: `${virtualChannelId}:documents:completion-checklist`,
        channelId: virtualChannelId,
        layer: "documents",
        category: "completion-checklist",
        name: `Checklist de completude — ${entry.clientName}`,
        content: gapSummary,
        metadata: {
          previewScope: true,
          sourceMode: entry.source.mode,
          sourceQuality: entry.source.quality,
        },
        sortOrder: 10_001,
      },
    ];

    return [...seedLibraryItems, ...docs];
  }, []);

  const manifestEntry = useMemo(() => {
    if (!activeScope || activeScope.scopeType !== "manifest-client" || !activeScope.sourceClientName) {
      return null;
    }

    return getClientLibraryManifestEntry(activeScope.sourceClientName, activeScope.tenant) ?? null;
  }, [activeScope]);

  const fetchScopes = useCallback(async () => {
    try {
      const response = await fetch(`/api/channels/${channelId}`);
      if (!response.ok) {
        setScopes([{ channelId, name: channelName, scopeType: "hq", badge: "Canal atual" }]);
        return;
      }

      const data = (await response.json()) as ChannelDetailsResponse;
      const current = data.channel;
      if (!current) {
        setScopes([{ channelId, name: channelName, scopeType: "hq", badge: "Canal atual" }]);
        return;
      }

      const currentName = current.clientName?.trim() || current.name || channelName;

      if (current.channelType === "hq") {
        const nextScopes: LibraryScope[] = [
          { channelId: current.id, name: currentName, scopeType: "hq", badge: "Base Starkën" },
        ];
        const existingClientNames = new Set<string>();

        const clientsResponse = await fetch(`/api/channels/client-rooms?parentChannelId=${current.id}`);
        if (clientsResponse.ok) {
          const clientsData = (await clientsResponse.json()) as RelatedClientRoomsResponse;
          for (const room of clientsData.rooms ?? []) {
            const roomName = room.clientName?.trim() || room.name;
            existingClientNames.add(roomName.toLowerCase());
            nextScopes.push({
              channelId: room.id,
              name: roomName,
              scopeType: "client",
              badge: "Cliente",
            });
          }
        }

        const manifestScopes = CLIENT_LIBRARY_MANIFEST
          .filter((entry) => !existingClientNames.has(entry.clientName.toLowerCase()))
          .sort((a, b) => {
            if (a.tenant !== b.tenant) return a.tenant.localeCompare(b.tenant);
            return a.clientName.localeCompare(b.clientName, "pt-BR");
          })
          .map<LibraryScope>((entry) => ({
            channelId: `manifest:${entry.tenant}:${entry.clientName}`,
            name: entry.clientName,
            scopeType: "manifest-client",
            badge: entry.tenant === "fenix" ? "Cliente Fenix Lab" : "Cliente Alpha",
            tenant: entry.tenant,
            sourceClientName: entry.clientName,
          }));

        nextScopes.push(...manifestScopes);

        setScopes(nextScopes);
        return;
      }

      if (current.channelType === "client" && current.parentChannelId) {
        const nextScopes: LibraryScope[] = [
          { channelId: current.id, name: currentName, scopeType: "client", badge: "Cliente atual" },
        ];

        const parentResponse = await fetch(`/api/channels/${current.parentChannelId}`);
        if (parentResponse.ok) {
          const parentData = (await parentResponse.json()) as ChannelDetailsResponse;
          if (parentData.channel) {
            nextScopes.unshift({
              channelId: parentData.channel.id,
              name: parentData.channel.clientName?.trim() || parentData.channel.name || "Starkën",
              scopeType: "hq",
              badge: "Base Starkën",
            });
          }
        }

        setScopes(nextScopes);
        return;
      }

      setScopes([{ channelId: current.id, name: currentName, scopeType: "hq", badge: "Canal atual" }]);
    } catch {
      setScopes([{ channelId, name: channelName, scopeType: "hq", badge: "Canal atual" }]);
    }
  }, [channelId, channelName]);

  // ── Data fetching ─────────────────────────────────────────────────────

  const fetchItems = useCallback(async () => {
    if (activeScope?.scopeType === "manifest-client") {
      if (manifestEntry) {
        setItems(buildManifestPreviewItems(manifestEntry));
      } else {
        setItems([]);
      }
      return;
    }

    try {
      const res = await fetch(`/api/channels/${activeScopeId}/library`);
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items ?? []);
    } catch { /* ignore */ }
  }, [activeScope, activeScopeId, buildManifestPreviewItems, manifestEntry]);

  useEffect(() => { void fetchScopes(); }, [fetchScopes]);
  useEffect(() => {
    setSelectedId(null);
    void fetchItems();
  }, [fetchItems]);

  // ── CRUD ──────────────────────────────────────────────────────────────

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const bootstrapClientLibraries = async () => {
    if (!activeScope || activeScope.scopeType !== "hq") return;

    setSaving(true);
    try {
      const res = await fetch(`/api/channels/${activeScope.channelId}/library/bootstrap-clients`, {
        method: "POST",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast((data as { error?: string }).error || "Erro ao criar bibliotecas dos clientes");
        return;
      }

      await fetchScopes();
      await fetchItems();
      const created = typeof (data as { channelsCreated?: number }).channelsCreated === "number"
        ? (data as { channelsCreated: number }).channelsCreated
        : 0;
      showToast(created > 0 ? `Bibliotecas dos clientes criadas (${created} novos canais)` : "Bibliotecas dos clientes atualizadas");
    } catch {
      showToast("Erro de rede");
    } finally {
      setSaving(false);
    }
  };

  const applyClientBase = async () => {
    if (!activeScope || activeScope.scopeType !== "client") return;

    setSaving(true);
    try {
      const res = await fetch(`/api/channels/${activeScope.channelId}/library/seed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "client-base",
          clientName: activeScope.name,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast((data as { error?: string }).error || "Erro ao aplicar base do cliente");
        return;
      }

      await fetchItems();
      showToast((data as { created?: number }).created ? `Base do cliente aplicada (${(data as { created: number }).created} itens)` : "Base do cliente já estava aplicada");
    } catch {
      showToast("Erro de rede");
    } finally {
      setSaving(false);
    }
  };

  const createItem = async (layer: string, category: string, name: string, content: string | null, metadata?: Record<string, unknown>) => {
    if (isReadOnlyScope) {
      showToast("Biblioteca em modo de visualização");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/channels/${activeScopeId}/library`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layer, category, name, content, metadata }),
      });
      if (res.ok) {
        const d = await res.json();
        await fetchItems();
        setSelectedId(d.item?.id ?? null);
        showToast("Salvo!");
      } else {
        const d = await res.json().catch(() => ({}));
        showToast(d.error || "Erro");
      }
    } catch { showToast("Erro de rede"); }
    finally { setSaving(false); }
  };

  const updateItem = async (itemId: string, updates: Record<string, unknown>) => {
    if (isReadOnlyScope) {
      showToast("Biblioteca em modo de visualização");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/channels/${activeScopeId}/library/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) { await fetchItems(); showToast("Atualizado!"); }
      else showToast("Erro ao atualizar");
    } catch { showToast("Erro de rede"); }
    finally { setSaving(false); }
  };

  const deleteItem = async (itemId: string) => {
    if (isReadOnlyScope) {
      showToast("Biblioteca em modo de visualização");
      return;
    }
    try {
      await fetch(`/api/channels/${activeScopeId}/library/${itemId}`, { method: "DELETE" });
      if (selectedId === itemId) setSelectedId(null);
      await fetchItems();
      showToast("Removido");
    } catch { /* ignore */ }
  };

  // ── Derived ───────────────────────────────────────────────────────────

  const visibleItems = useMemo(
    () => items.filter((item) => visibleLayerSet.has(item.layer)),
    [items, visibleLayerSet],
  );

  const selected = selectedId ? visibleItems.find((i) => i.id === selectedId) ?? null : null;
  const isSuccessToast =
    toast != null &&
    (["Salvo!", "Atualizado!", "Removido"].includes(toast) ||
      toast.startsWith("Base do cliente aplicada") ||
      toast === "Base do cliente já estava aplicada" ||
      toast.startsWith("Bibliotecas dos clientes criadas") ||
      toast === "Bibliotecas dos clientes atualizadas");

  // Auto-select first item
  useEffect(() => {
    if (!selectedId && visibleItems.length > 0) setSelectedId(visibleItems[0].id);
    if (selectedId && !visibleItems.some((item) => item.id === selectedId)) setSelectedId(visibleItems[0]?.id ?? null);
  }, [selectedId, visibleItems]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.querySelector<HTMLInputElement>("[data-library-search]")?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Breadcrumb
  const breadcrumb = selected
    ? `${selected.layer === "design" ? "Design System" : selected.layer === "documents" ? "Documentos" : selected.layer === "social" ? "Social" : selected.layer === "creations" ? "Criacoes" : "APIs"} > ${selected.category} > ${selected.name}`
    : "";

  return (
    <div className="fixed inset-0 z-[70] bg-gray-950 flex flex-col">
      {/* ── Top Bar ──────────────────────────────────────────────────── */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex-shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <div className="min-w-0">
                <h1 className="truncate text-sm font-semibold text-white">Biblioteca de Marca</h1>
                <p className="mt-0.5 text-xs text-gray-400">
                  {activeScope ? `${activeScope.name} · ${visibleItems.length} itens visíveis` : `${channelName} · ${visibleItems.length} itens visíveis`}
                </p>
              </div>
            </div>

            <div className="mt-3 max-w-md">
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                Biblioteca ativa
              </label>
              <select
                value={activeScopeId}
                onChange={(e) => setActiveScopeId(e.target.value)}
                className="w-full rounded-xl border border-gray-700 bg-gray-800/90 px-3 py-2.5 text-sm text-white outline-none transition focus:border-indigo-500"
              >
                {scopes.map((scope) => (
                  <option key={scope.channelId} value={scope.channelId}>
                    {scope.scopeType === "hq"
                      ? `Base Starkën · ${scope.name}`
                      : scope.scopeType === "manifest-client"
                        ? `${scope.badge} · ${scope.name}`
                        : `Cliente · ${scope.name}`}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-gray-500">
                {isReadOnlyScope
                  ? "Você está vendo uma prévia da biblioteca do cliente baseada no manifesto."
                  : "Selecione aqui a biblioteca de design que você quer visualizar."}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {activeScope?.scopeType === "hq" ? (
              <button
                type="button"
                onClick={() => void bootstrapClientLibraries()}
                disabled={saving}
                className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3 py-2 text-xs font-medium text-indigo-200 transition hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Criando..." : "Criar bibliotecas dos clientes"}
              </button>
            ) : null}
            {isClientScope ? (
              <button
                type="button"
                onClick={() => void applyClientBase()}
                disabled={saving}
                className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-200 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Aplicando..." : "Aplicar base do cliente"}
              </button>
            ) : null}
            {isManifestClientScope ? (
              <div className="rounded-lg border border-sky-500/20 bg-sky-500/10 px-3 py-2 text-xs font-medium text-sky-200">
                Prévia do cliente
              </div>
            ) : null}
            {toast && (
              <div className={`text-xs px-3 py-1 rounded-full ${
                isSuccessToast
                  ? "bg-green-900/50 text-green-300"
                  : "bg-red-900/50 text-red-300"
              }`}>{toast}</div>
            )}

            <span className="hidden text-[10px] text-gray-600 sm:block">ESC para fechar · Cmd+K buscar</span>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Area ────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <LibrarySidebar
          items={visibleItems}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onAdd={(layer) => setAddDialog(layer)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          visibleLayers={visibleLayerList}
          readOnly={isReadOnlyScope}
        />

        {/* Canvas + Bottom Panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {viewMode === "canvas" ? (
            <>
              <LibraryCanvas
                item={selected}
                items={visibleItems}
                canvasBg={canvasBg}
                setCanvasBg={setCanvasBg}
                deviceSize={deviceSize}
                setDeviceSize={setDeviceSize}
                viewMode={viewMode}
                setViewMode={setViewMode}
                onUpdate={updateItem}
                onDelete={deleteItem}
                onCreate={createItem}
                saving={saving}
                fileRef={fileRef}
                readOnly={isReadOnlyScope}
              />

              {/* Bottom Panel */}
              <LibraryBottomPanel
                item={selected}
                tab={bottomTab}
                setTab={setBottomTab}
                collapsed={bottomCollapsed}
                setCollapsed={setBottomCollapsed}
                onDelete={deleteItem}
                saving={saving}
                readOnly={isReadOnlyScope}
              />
            </>
          ) : (
            <LibraryDocsView
              items={visibleItems}
              viewMode={viewMode}
              setViewMode={setViewMode}
              onSelect={setSelectedId}
            />
          )}
        </div>
      </div>

      {/* ── Status Bar ───────────────────────────────────────────────── */}
      <div className="h-6 bg-gray-900 border-t border-gray-800 flex items-center justify-between px-4 flex-shrink-0">
        <span className="text-[10px] text-gray-600 truncate">{breadcrumb}</span>
        <span className="text-[10px] text-gray-600">
          {selected?.createdAt ? `Criado: ${new Date(selected.createdAt).toLocaleDateString("pt-BR")}` : ""}
        </span>
      </div>

      {/* Add Item Dialog */}
      {addDialog && (
        <AddItemDialog
          layer={addDialog}
          onClose={() => setAddDialog(null)}
          onCreate={async (layer, category, name, content, metadata) => {
            await createItem(layer, category, name, content, metadata);
            setAddDialog(null);
          }}
          saving={saving}
          fileRef={fileRef}
        />
      )}

      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add Item Dialog
// ---------------------------------------------------------------------------

const ADD_OPTIONS: Record<string, { label: string; categories: { id: string; label: string; isImage?: boolean }[] }> = {
  design: {
    label: "Design System",
    categories: [
      { id: "logo-dark", label: "Logo (Fundo Preto)", isImage: true },
      { id: "logo-light", label: "Logo (Fundo Branco)", isImage: true },
      { id: "logo-transparent", label: "Logo (Transparente)", isImage: true },
      { id: "logo-round", label: "Logo (Redonda)", isImage: true },
      { id: "logo-alt", label: "Logo Branca Alternativa", isImage: true },
      { id: "logo-favicon", label: "Favicon Oficial", isImage: true },
      { id: "color-primary", label: "Cor Primaria" },
      { id: "color-secondary", label: "Cor Secundaria" },
      { id: "color-accent", label: "Cor de Destaque" },
      { id: "font-primary", label: "Fonte Principal" },
      { id: "font-secondary", label: "Fonte Secundaria" },
      { id: "button-primary", label: "Botao Principal" },
      { id: "button-secondary", label: "Botao Secundario" },
      { id: "card-default", label: "Card Padrao" },
      { id: "card-template", label: "Template de Post", isImage: true },
    ],
  },
  documents: {
    label: "Documentos",
    categories: [
      { id: "briefing", label: "Briefing da Empresa" },
      { id: "prd", label: "PRD (Requisitos)" },
      { id: "brand-book", label: "Brand Book" },
      { id: "brand-guidelines", label: "Diretrizes da Marca" },
      { id: "design-pillars", label: "Pilares do Design" },
      { id: "storybook", label: "Storybook / Design System" },
      { id: "tone-of-voice", label: "Tom de Voz" },
      { id: "target-audience", label: "Publico Alvo" },
      { id: "competitors", label: "Analise de Concorrentes" },
      { id: "content-calendar", label: "Calendario de Conteudo" },
      { id: "menu-products", label: "Cardapio / Produtos" },
      { id: "pricing", label: "Tabela de Precos" },
      { id: "faq", label: "FAQ / Perguntas Frequentes" },
      { id: "testimonials", label: "Depoimentos / Cases" },
      { id: "seo-keywords", label: "Palavras-chave SEO" },
      { id: "social-bio", label: "Bio das Redes Sociais" },
      { id: "hashtags", label: "Hashtags Padrao" },
      { id: "copy-templates", label: "Templates de Copy" },
      { id: "other", label: "Outro Documento" },
    ],
  },
  social: {
    label: "Stories & Feed",
    categories: [
      { id: "story", label: "Story", isImage: true },
      { id: "feed-post", label: "Post de Feed", isImage: true },
      { id: "reel", label: "Reel", isImage: true },
      { id: "carousel", label: "Carrossel", isImage: true },
    ],
  },
  creations: {
    label: "Criacoes",
    categories: [
      { id: "image", label: "Imagem", isImage: true },
      { id: "text", label: "Texto / Copy" },
      { id: "video", label: "Video" },
    ],
  },
  api: {
    label: "APIs & Tokens",
    categories: [
      { id: "api-key", label: "Chave de API" },
    ],
  },
};

function AddItemDialog({
  layer, onClose, onCreate, saving, fileRef,
}: {
  layer: string;
  onClose: () => void;
  onCreate: (layer: string, category: string, name: string, content: string | null, metadata?: Record<string, unknown>) => Promise<void>;
  saving: boolean;
  fileRef: React.RefObject<HTMLInputElement | null>;
}) {
  const [step, setStep] = useState<"category" | "form">("category");
  const [selectedCat, setSelectedCat] = useState<{ id: string; label: string; isImage?: boolean } | null>(null);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");

  const options = ADD_OPTIONS[layer] || ADD_OPTIONS.design;

  const handleSelectCategory = (cat: { id: string; label: string; isImage?: boolean }) => {
    setSelectedCat(cat);
    setName(cat.label);

    if (cat.isImage && fileRef.current) {
      const handler = (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) { setStep("category"); return; }
        const reader = new FileReader();
        reader.onload = () => {
          onCreate(layer, cat.id, cat.label, reader.result as string, {
            mime: file.type, size: file.size, filename: file.name,
            ...(layer === "social" ? { platform: "instagram", postType: cat.id } : {}),
            ...(layer === "creations" ? { status: "pending" } : {}),
          });
        };
        reader.readAsDataURL(file);
        fileRef.current?.removeEventListener("change", handler);
        (e.target as HTMLInputElement).value = "";
      };
      fileRef.current.addEventListener("change", handler);
      fileRef.current.click();
      return;
    }

    setStep("form");
  };

  const handleSubmit = () => {
    if (!selectedCat || !name.trim()) return;

    const metadata: Record<string, unknown> = {};
    if (layer === "api") {
      // content is the API key value
    } else if (selectedCat.id.startsWith("color-")) {
      metadata.cssValue = content.trim() || "#000000";
    } else if (selectedCat.id.startsWith("font-")) {
      metadata.fontFamily = content.trim() || "sans-serif";
    } else if (selectedCat.id.startsWith("button-") || selectedCat.id.startsWith("card-")) {
      metadata.componentType = selectedCat.id;
    }
    if (layer === "creations") metadata.status = "pending";

    onCreate(layer, selectedCat.id, name.trim(), content.trim() || null, Object.keys(metadata).length > 0 ? metadata : undefined);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
          <h3 className="text-sm font-semibold text-white">
            {step === "category" ? `Adicionar a ${options.label}` : `Novo: ${selectedCat?.label}`}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-lg">&times;</button>
        </div>

        <div className="p-4">
          {step === "category" ? (
            <div className="grid grid-cols-2 gap-2">
              {options.categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat)}
                  className="text-left px-3 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-indigo-500/50 rounded-lg text-xs text-gray-300 hover:text-white transition-colors"
                >
                  {cat.label}
                  {cat.isImage && <span className="text-[9px] text-gray-600 ml-1">(imagem)</span>}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-gray-500 mb-1">Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-1">
                  {layer === "api" ? "Valor da chave" : selectedCat?.id.startsWith("color-") ? "Valor CSS (ex: #FF6B35)" : selectedCat?.id.startsWith("font-") ? "Nome da fonte (ex: Inter)" : "Conteudo"}
                </label>
                {layer === "api" ? (
                  <input
                    type="password"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="sk-..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                ) : selectedCat?.id.startsWith("color-") ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={content || "#FF6B35"}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-10 h-10 rounded border border-gray-600 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="#FF6B35"
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                ) : (
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={4}
                    placeholder="Conteudo..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none resize-y"
                  />
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setStep("category")}
                  className="flex-1 py-2 text-xs text-gray-400 hover:text-white border border-gray-700 rounded-lg"
                >
                  Voltar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving || !name.trim()}
                  className="flex-1 py-2 text-xs text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 rounded-lg font-medium"
                >
                  {saving ? "Salvando..." : "Criar"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
