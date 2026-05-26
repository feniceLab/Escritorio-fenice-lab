"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, Building2, Files, Loader2, MapPin, Sparkles, X } from "lucide-react";

interface LibrarySummary {
  channelId: string;
  name: string;
  isHq: boolean;
  designCount: number;
  docsCount: number;
  apiCount: number;
  socialCount: number;
  pendingCount: number;
}

interface LibraryLayerItem {
  layer: string;
  metadata?: { status?: string } | null;
}

interface LibraryPanelProps {
  channelId: string;
  channelName: string;
  channelType: string | null;
  variant?: "floating" | "embedded";
  visible?: boolean;
  onClose: () => void;
  onOpenLibrary: (targetChannelId: string, targetName: string) => void;
}

function buildLibrarySummary(
  channelId: string,
  name: string,
  channelType: string | null,
  items: LibraryLayerItem[]
): LibrarySummary {
  return {
    channelId,
    name,
    isHq: channelType === "hq",
    designCount: items.filter((item) => item.layer === "design").length,
    docsCount: items.filter((item) => item.layer === "documents").length,
    apiCount: items.filter((item) => item.layer === "api").length,
    socialCount: items.filter((item) => item.layer === "social").length,
    pendingCount: items.filter((item) => item.layer === "creations" && item.metadata?.status === "pending").length,
  };
}

function getLibraryTotal(library: LibrarySummary) {
  return library.designCount + library.docsCount + library.apiCount + library.socialCount + library.pendingCount;
}

function getLibraryBadge(library: LibrarySummary) {
  return library.isHq ? "Central" : "Cliente";
}

export default function LibraryPanel({
  channelId,
  channelName,
  channelType,
  visible = true,
  onClose,
  onOpenLibrary,
}: LibraryPanelProps) {
  const [currentLibrary, setCurrentLibrary] = useState<LibrarySummary | null>(null);
  const [clientLibraries, setClientLibraries] = useState<LibrarySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLibraries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const ownLibRes = await fetch(`/api/channels/${channelId}/library`);
      if (!ownLibRes.ok) {
        const data = await ownLibRes.json().catch(() => ({}));
        throw new Error(data.error || "Falha ao carregar biblioteca");
      }

      const ownLibData = await ownLibRes.json();
      const ownItems: LibraryLayerItem[] = ownLibData.items ?? [];
      setCurrentLibrary(
        buildLibrarySummary(channelId, channelType === "hq" ? "Fenix Lab HQ" : channelName, channelType, ownItems)
      );

      if (channelType !== "hq") {
        setClientLibraries([]);
        return;
      }

      const clientsRes = await fetch(`/api/channels/client-rooms?parentChannelId=${channelId}`);
      if (!clientsRes.ok) {
        const data = await clientsRes.json().catch(() => ({}));
        throw new Error(data.error || "Falha ao carregar bibliotecas dos clientes");
      }

      const clientData = await clientsRes.json();
      const rooms = Array.isArray(clientData.rooms) ? clientData.rooms : [];
      const summaries = await Promise.all(
        rooms.map(async (room: { id: string; clientName?: string | null; name?: string | null }) => {
          try {
            const libRes = await fetch(`/api/channels/${room.id}/library`);
            const libData = libRes.ok ? await libRes.json() : {};
            const items: LibraryLayerItem[] = libData.items ?? [];
            return buildLibrarySummary(room.id, room.clientName || room.name || "Cliente", "client", items);
          } catch {
            return buildLibrarySummary(room.id, room.clientName || room.name || "Cliente", "client", []);
          }
        })
      );

      summaries.sort((left, right) => left.name.localeCompare(right.name, "pt-BR", { sensitivity: "base" }));
      setClientLibraries(summaries);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar bibliotecas");
      setCurrentLibrary(null);
      setClientLibraries([]);
    } finally {
      setLoading(false);
    }
  }, [channelId, channelName, channelType]);

  useEffect(() => {
    if (!visible) return;
    void fetchLibraries();
  }, [fetchLibraries, visible]);

  useEffect(() => {
    if (!visible) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose, visible]);

  const sections = useMemo(() => {
    if (!currentLibrary) {
      return {
        primaryTitle: channelType === "hq" ? "Central" : "Biblioteca atual",
        primaryItems: [] as LibrarySummary[],
        clientItems: clientLibraries,
      };
    }

    return {
      primaryTitle: channelType === "hq" ? "Central" : "Biblioteca atual",
      primaryItems: [currentLibrary],
      clientItems: channelType === "hq" ? clientLibraries : [],
    };
  }, [channelType, clientLibraries, currentLibrary]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center bg-black/55 px-4 pt-20 pb-6" onClick={onClose}>
      <div
        className="w-full max-w-[840px] rounded-2xl border border-white/10 bg-[#0f131e] shadow-2xl overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-white/10 flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-white">Bibliotecas da Fenix Lab</div>
            <div className="text-[11px] text-white/55">Abra a biblioteca certa direto da central ou dos clientes</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void fetchLibraries()}
              className="text-[11px] px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-white/70"
            >
              Atualizar
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-md bg-white/5 hover:bg-white/10 text-white/70"
              aria-label="Fechar janela de bibliotecas"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-3 py-3 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-white/60">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : error ? (
            <div className="px-3 py-4 rounded-lg border border-rose-400/20 bg-rose-500/10 text-sm text-rose-200">
              {error}
            </div>
          ) : (
            <>
              {sections.primaryItems.length > 0 && (
                <LibraryGroup
                  title={sections.primaryTitle}
                  items={sections.primaryItems}
                  currentChannelId={channelId}
                  onOpenLibrary={onOpenLibrary}
                />
              )}

              {sections.clientItems.length > 0 && (
                <LibraryGroup
                  title="Clientes"
                  items={sections.clientItems}
                  currentChannelId={channelId}
                  onOpenLibrary={onOpenLibrary}
                />
              )}

              {!loading && sections.primaryItems.length === 0 && sections.clientItems.length === 0 && (
                <div className="px-3 py-4 rounded-lg border border-white/10 bg-white/5 text-sm text-white/55">
                  Nenhuma biblioteca encontrada ainda.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function LibraryGroup({
  title,
  items,
  currentChannelId,
  onOpenLibrary,
}: {
  title: string;
  items: LibrarySummary[];
  currentChannelId: string;
  onOpenLibrary: (targetChannelId: string, targetName: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="px-1 text-[11px] uppercase tracking-wide text-white/45">{title}</div>
      <div className="space-y-2">
        {items.map((library) => {
          const total = getLibraryTotal(library);
          const isCurrent = library.channelId === currentChannelId;

          return (
            <button
              key={library.channelId}
              onClick={() => onOpenLibrary(library.channelId, library.name)}
              className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                isCurrent
                  ? "border-emerald-400/35 bg-emerald-500/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-white">{library.name}</span>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/60">
                      {getLibraryBadge(library)}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-white/50">
                    <span className="flex items-center gap-1">
                      {library.isHq ? <Building2 className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                      {total} itens
                    </span>
                    <span className="flex items-center gap-1">
                      <Files className="w-3 h-3" />
                      {library.docsCount} docs
                    </span>
                    <span>{library.designCount} design</span>
                    <span>{library.apiCount} APIs</span>
                    <span>{library.socialCount} social</span>
                    {library.pendingCount > 0 && (
                      <span className="flex items-center gap-1 text-amber-200">
                        <Sparkles className="w-3 h-3" />
                        {library.pendingCount} pendentes
                      </span>
                    )}
                  </div>
                </div>

                {isCurrent && (
                  <span className="shrink-0 flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-1 text-[10px] text-emerald-200">
                    <MapPin className="w-3 h-3" />
                    atual
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
