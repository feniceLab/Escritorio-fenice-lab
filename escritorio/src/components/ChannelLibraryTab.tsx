"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Image,
  Key,
  Loader2,
  Palette,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Type,
  Upload,
} from "lucide-react";
import { getFenixLibrarySeed, type LibrarySeedItem } from "@/lib/fenix-library-defaults";

interface LibraryMetadata {
  filename?: string;
  mime?: string;
  size?: number;
  cssValue?: string;
  token?: string;
  usage?: string;
  fontFamily?: string;
  fontWeight?: string;
  componentType?: string;
  source?: string;
  audience?: string;
  [key: string]: unknown;
}

interface LibraryItem {
  id: string;
  channelId: string;
  layer: string;
  category: string;
  name: string;
  content: string | null;
  metadata: LibraryMetadata | null;
  sortOrder: number;
}

interface ChannelLibraryTabProps {
  channelId: string;
  channelName: string;
}

type SubTab = "design" | "documents" | "api";

const DESIGN_SECTIONS = [
  { key: "logos", title: "Logos oficiais", description: "Versões prontas para uso no canal e pelos agentes.", icon: Image },
  { key: "tokens", title: "Tokens visuais", description: "Cores centrais e variáveis que devem orientar toda interface.", icon: Palette },
  { key: "typography", title: "Tipografia", description: "Famílias tipográficas e o papel de cada uma no sistema.", icon: Type },
  { key: "components", title: "Componentes aprovados", description: "Peças recorrentes para guiar criação de relatórios, cards e UI.", icon: Sparkles },
] as const;

const DOC_CATEGORIES = [
  { id: "briefing", label: "Briefing" },
  { id: "prd", label: "PRD" },
  { id: "brand-book", label: "Brand Book" },
  { id: "brand-guidelines", label: "Diretrizes da Marca" },
  { id: "storybook", label: "Storybook / Design System" },
  { id: "other", label: "Outro Documento" },
];

function getMetadata(item?: LibraryItem | LibrarySeedItem | null): LibraryMetadata {
  return ((item?.metadata as LibraryMetadata | null) ?? {}) as LibraryMetadata;
}

function isImageContent(content: string | null | undefined) {
  return Boolean(content?.startsWith("data:image"));
}

async function assetPathToDataUrl(assetPath: string): Promise<string> {
  const res = await fetch(assetPath);
  if (!res.ok) {
    throw new Error(`Falha ao carregar asset ${assetPath}`);
  }
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`Falha ao ler asset ${assetPath}`));
    reader.readAsDataURL(blob);
  });
}

export default function ChannelLibraryTab({ channelId, channelName }: ChannelLibraryTabProps) {
  const [subTab, setSubTab] = useState<SubTab>("design");
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applyingBase, setApplyingBase] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const seedItems = useMemo(() => getFenixLibrarySeed(channelName), [channelName]);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch(`/api/channels/${channelId}/library`);
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const itemsByLayer = useMemo(
    () => ({
      design: items.filter((item) => item.layer === "design"),
      documents: items.filter((item) => item.layer === "documents"),
      api: items.filter((item) => item.layer === "api"),
    }),
    [items],
  );

  const seedMissingCount = useMemo(
    () =>
      seedItems.filter(
        (seed) => !items.some((item) => item.layer === seed.layer && item.category === seed.category),
      ).length,
    [items, seedItems],
  );

  const showSaveMsg = (msg: string) => {
    setSaveMsg(msg);
    window.setTimeout(() => setSaveMsg(null), 3200);
  };

  const postLibraryItem = useCallback(
    async (
      layer: string,
      category: string,
      name: string,
      content: string | null,
      metadata?: Record<string, unknown>,
    ) => {
      const res = await fetch(`/api/channels/${channelId}/library`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layer, category, name, content, metadata }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao salvar");
      }

      return res.json().catch(() => ({}));
    },
    [channelId],
  );

  const createItem = async (
    layer: string,
    category: string,
    name: string,
    content: string | null,
    metadata?: Record<string, unknown>,
  ) => {
    setSaving(true);
    try {
      await postLibraryItem(layer, category, name, content, metadata);
      await fetchItems();
      showSaveMsg("Salvo!");
    } catch (error) {
      showSaveMsg(error instanceof Error ? error.message : "Erro de rede");
    } finally {
      setSaving(false);
    }
  };

  const createSeedItemRaw = useCallback(
    async (seed: LibrarySeedItem) => {
      const exists = items.some((item) => item.layer === seed.layer && item.category === seed.category);
      if (exists) return;

      let nextContent = seed.content ?? null;
      if (seed.assetPath) {
        nextContent = await assetPathToDataUrl(seed.assetPath);
      }

      await postLibraryItem(seed.layer, seed.category, seed.name, nextContent, seed.metadata ?? undefined);
    },
    [items, postLibraryItem],
  );

  const createSeedItem = useCallback(
    async (seed: LibrarySeedItem) => {
      setSaving(true);
      try {
        await createSeedItemRaw(seed);
        await fetchItems();
        showSaveMsg("Item base adicionado");
      } catch (error) {
        showSaveMsg(error instanceof Error ? error.message : "Erro ao adicionar item base");
      } finally {
        setSaving(false);
      }
    },
    [createSeedItemRaw, fetchItems],
  );

  const applyFenixBase = useCallback(async () => {
    if (applyingBase) return;

    setApplyingBase(true);
    try {
      let created = 0;
      for (const seed of seedItems) {
        const exists = items.some((item) => item.layer === seed.layer && item.category === seed.category);
        if (exists) continue;
        await createSeedItemRaw(seed);
        created += 1;
      }

      await fetchItems();
      showSaveMsg(created > 0 ? `Base Starkën aplicada (${created} itens)` : "Base Starkën já estava aplicada");
    } catch (error) {
      showSaveMsg(error instanceof Error ? error.message : "Erro ao aplicar base Starkën");
    } finally {
      setApplyingBase(false);
    }
  }, [applyingBase, createSeedItemRaw, fetchItems, items, seedItems]);

  const updateItem = async (itemId: string, updates: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/channels/${channelId}/library/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao atualizar");
      }
      await fetchItems();
      showSaveMsg("Atualizado!");
    } catch (error) {
      showSaveMsg(error instanceof Error ? error.message : "Erro de rede");
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (itemId: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/channels/${channelId}/library/${itemId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao remover");
      }
      await fetchItems();
      showSaveMsg("Removido");
    } catch (error) {
      showSaveMsg(error instanceof Error ? error.message : "Erro ao remover");
    } finally {
      setSaving(false);
    }
  };

  const openStorybook = () => {
    window.open("/storybook/index.html", "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 p-5">
      <div className="rounded-2xl border border-gray-700 bg-gradient-to-br from-gray-900 via-gray-900 to-emerald-950/30 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
              <BookOpen className="h-3.5 w-3.5" />
              Biblioteca operacional do canal
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Use a biblioteca como fonte principal dos agentes</h3>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-400">
                Aqui ficam logos, tokens, componentes aprovados e documentos vivos da Starkën. O Storybook continua disponível,
                mas entra como aprofundamento, não como ponto de partida.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <StatCard label="Itens na biblioteca" value={String(items.length)} hint="conteúdo já salvo neste canal" />
              <StatCard label="Design + docs" value={String(itemsByLayer.design.length + itemsByLayer.documents.length)} hint="base que guia os agentes" />
              <StatCard
                label="Base Starkën pendente"
                value={String(seedMissingCount)}
                hint={seedMissingCount > 0 ? "itens sugeridos para completar a base" : "fundação inicial já aplicada"}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:max-w-xs lg:justify-end">
            <button
              type="button"
              onClick={() => void applyFenixBase()}
              disabled={applyingBase || saving}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {applyingBase ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Aplicar base Starkën
            </button>
            <button
              type="button"
              onClick={openStorybook}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm font-semibold text-gray-200 transition hover:border-emerald-500/50 hover:text-white"
            >
              <ExternalLink className="h-4 w-4" />
              Abrir Storybook
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-1 rounded-xl bg-gray-900/70 p-1">
        {([
          { key: "design" as SubTab, label: "Design System", icon: Image },
          { key: "documents" as SubTab, label: "Documentos", icon: FileText },
          { key: "api" as SubTab, label: "APIs & Tokens", icon: Key },
        ]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setSubTab(key)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              subTab === key ? "bg-indigo-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {label}
            </span>
          </button>
        ))}
      </div>

      {saveMsg && (
        <div className={`rounded-lg px-3 py-2 text-sm ${saveMsg.includes("Erro") || saveMsg.includes("Falha") ? "bg-red-900/30 text-red-300" : "bg-emerald-900/30 text-emerald-300"}`}>
          {saveMsg}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {subTab === "design" && (
          <DesignSubTab
            items={itemsByLayer.design}
            seedItems={seedItems.filter((seed) => seed.layer === "design")}
            onCreate={createItem}
            onCreateSeed={createSeedItem}
            onUpdate={updateItem}
            onDelete={deleteItem}
            saving={saving || applyingBase}
            onApplyBase={applyFenixBase}
          />
        )}
        {subTab === "documents" && (
          <DocumentsSubTab
            items={itemsByLayer.documents}
            seedItems={seedItems.filter((seed) => seed.layer === "documents")}
            onCreate={createItem}
            onCreateSeed={createSeedItem}
            onUpdate={updateItem}
            onDelete={deleteItem}
            saving={saving || applyingBase}
            onApplyBase={applyFenixBase}
            onOpenStorybook={openStorybook}
          />
        )}
        {subTab === "api" && (
          <ApiSubTab items={itemsByLayer.api} onCreate={createItem} onDelete={deleteItem} saving={saving || applyingBase} />
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="text-[11px] uppercase tracking-[0.14em] text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-white">{value}</div>
      <div className="mt-1 text-xs text-gray-500">{hint}</div>
    </div>
  );
}

function DesignSubTab({
  items,
  seedItems,
  onCreate,
  onCreateSeed,
  onUpdate,
  onDelete,
  saving,
  onApplyBase,
}: {
  items: LibraryItem[];
  seedItems: LibrarySeedItem[];
  onCreate: (layer: string, category: string, name: string, content: string | null, metadata?: Record<string, unknown>) => Promise<void>;
  onCreateSeed: (seed: LibrarySeedItem) => Promise<void>;
  onUpdate: (itemId: string, updates: Record<string, unknown>) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
  saving: boolean;
  onApplyBase: () => Promise<void>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadSeed, setUploadSeed] = useState<LibrarySeedItem | null>(null);

  const itemsByCategory = useMemo(() => new Map(items.map((item) => [item.category, item])), [items]);
  const groupedSeedItems = useMemo(() => {
    const groups: Record<string, LibrarySeedItem[]> = {
      logos: [],
      tokens: [],
      typography: [],
      components: [],
    };
    for (const item of seedItems) {
      groups[item.group] = [...(groups[item.group] ?? []), item];
    }
    return groups;
  }, [seedItems]);

  const extraItems = items.filter((item) => !seedItems.some((seed) => seed.category === item.category));

  const handleUploadSeed = (seed: LibrarySeedItem) => {
    setUploadSeed(seed);
    fileRef.current?.click();
  };

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !uploadSeed) return;

    const existing = itemsByCategory.get(uploadSeed.category);
    const reader = new FileReader();

    reader.onload = async () => {
      const content = String(reader.result);
      const metadata = {
        ...(uploadSeed.metadata ?? {}),
        mime: file.type,
        size: file.size,
        filename: file.name,
        source: "manual-upload",
      };

      if (existing) {
        await onUpdate(existing.id, { content, metadata });
      } else {
        await onCreate("design", uploadSeed.category, uploadSeed.name, content, metadata);
      }
    };

    reader.readAsDataURL(file);
    event.target.value = "";
    setUploadSeed(null);
  };

  return (
    <div className="space-y-6">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />

      <div className="rounded-2xl border border-gray-700 bg-gray-900/60 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h4 className="text-base font-semibold text-white">Design operacional da Starkën</h4>
            <p className="mt-1 text-sm leading-6 text-gray-400">
              Esta área concentra a fundação visual que os agentes devem consultar antes de abrir o Storybook.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void onApplyBase()}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Completar fundação
          </button>
        </div>
      </div>

      {DESIGN_SECTIONS.map(({ key, title, description, icon: Icon }) => (
        <section key={key} className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-emerald-300">
              <Icon className="h-4.5 w-4.5" />
            </div>
            <div>
              <h5 className="text-sm font-semibold text-white">{title}</h5>
              <p className="text-xs text-gray-500">{description}</p>
            </div>
          </div>

          <div className={`grid gap-3 ${key === "logos" ? "lg:grid-cols-2" : "xl:grid-cols-2"}`}>
            {groupedSeedItems[key].map((seed) => {
              const item = itemsByCategory.get(seed.category);

              if (key === "logos") {
                return (
                  <LogoCard
                    key={seed.category}
                    item={item}
                    seed={seed}
                    saving={saving}
                    onUpload={handleUploadSeed}
                    onCreateSeed={onCreateSeed}
                    onDelete={onDelete}
                  />
                );
              }

              if (key === "tokens") {
                return (
                  <TokenCard
                    key={seed.category}
                    item={item}
                    seed={seed}
                    saving={saving}
                    onCreateSeed={onCreateSeed}
                    onDelete={onDelete}
                  />
                );
              }

              if (key === "typography") {
                return (
                  <FontCard
                    key={seed.category}
                    item={item}
                    seed={seed}
                    saving={saving}
                    onCreateSeed={onCreateSeed}
                    onDelete={onDelete}
                  />
                );
              }

              return (
                <ComponentCard
                  key={seed.category}
                  item={item}
                  seed={seed}
                  saving={saving}
                  onCreateSeed={onCreateSeed}
                  onDelete={onDelete}
                />
              );
            })}
          </div>
        </section>
      ))}

      {extraItems.length > 0 && (
        <section className="space-y-3">
          <div>
            <h5 className="text-sm font-semibold text-white">Itens adicionais do canal</h5>
            <p className="text-xs text-gray-500">Materiais extras que já foram adicionados manualmente a este canal.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {extraItems.map((item) => (
              <div key={item.id} className="rounded-2xl border border-gray-700 bg-gray-900/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">{item.name}</div>
                    <div className="mt-1 text-xs text-gray-500">{item.category}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void onDelete(item.id)}
                    className="rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 text-sm text-gray-400">
                  {isImageContent(item.content) ? (
                    <img src={item.content ?? ""} alt={item.name} className="h-24 w-full rounded-xl bg-gray-950 object-contain p-3" />
                  ) : (
                    <p className="line-clamp-3">{item.content || "(sem conteúdo)"}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function LogoCard({
  item,
  seed,
  saving,
  onUpload,
  onCreateSeed,
  onDelete,
}: {
  item?: LibraryItem;
  seed: LibrarySeedItem;
  saving: boolean;
  onUpload: (seed: LibrarySeedItem) => void;
  onCreateSeed: (seed: LibrarySeedItem) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
}) {
  const meta = getMetadata(item ?? seed);
  const isCircular = seed.category === "logo-round" || seed.category === "logo-favicon";
  const previewSrc = item?.content || seed.assetPath || "";
  const previewBackground =
    seed.category === "logo-light"
      ? "linear-gradient(135deg, #0f172a, #020617)"
      : seed.category === "logo-favicon"
        ? "#020617"
        : "rgba(255,255,255,0.02)";
  const badge = typeof meta.badge === "string" ? meta.badge : null;

  return (
    <div className="relative rounded-2xl border border-gray-700 bg-gray-900/50 p-4">
      {badge ? (
        <div className="absolute right-4 top-4 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
          {badge}
        </div>
      ) : null}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">{item?.name || seed.name}</div>
          <div className="mt-1 text-xs text-gray-500">{String(meta.usage || "Ativo oficial da marca")}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onUpload(seed)}
            disabled={saving}
            className="rounded-lg border border-gray-600 bg-gray-800 p-2 text-gray-300 transition hover:border-emerald-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            title={item ? "Substituir logo" : "Enviar logo"}
          >
            <Upload className="h-4 w-4" />
          </button>
          {item ? (
            <button
              type="button"
              onClick={() => void onDelete(item.id)}
              disabled={saving}
              className="rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              title="Remover"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void onCreateSeed(seed)}
              disabled={saving}
              className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              title="Adicionar à biblioteca"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 flex h-36 items-center justify-center rounded-2xl border border-white/5 p-5" style={{ background: previewBackground }}>
        <img
          src={previewSrc}
          alt={item?.name || seed.name}
          className={`max-h-full max-w-full object-contain ${isCircular ? "rounded-full" : ""}`}
        />
      </div>
    </div>
  );
}

function TokenCard({
  item,
  seed,
  saving,
  onCreateSeed,
  onDelete,
}: {
  item?: LibraryItem;
  seed: LibrarySeedItem;
  saving: boolean;
  onCreateSeed: (seed: LibrarySeedItem) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
}) {
  const meta = getMetadata(item ?? seed);
  return (
    <div className="rounded-2xl border border-gray-700 bg-gray-900/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">{item?.name || seed.name}</div>
          <div className="mt-1 text-xs text-gray-500">{String(meta.token || "Token visual Starkën")}</div>
        </div>
        {item ? (
          <button
            type="button"
            onClick={() => void onDelete(item.id)}
            disabled={saving}
            className="rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void onCreateSeed(seed)}
            disabled={saving}
            className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div className="h-16 w-16 rounded-2xl border border-white/10 shadow-sm" style={{ backgroundColor: String(meta.cssValue || "#0f172a") }} />
        <div className="space-y-1">
          <div className="font-mono text-sm text-white">{String(meta.cssValue || "sem valor")}</div>
          <div className="text-sm leading-6 text-gray-400">{item?.content || seed.content}</div>
          <div className="text-xs text-gray-500">{String(meta.usage || "")}</div>
        </div>
      </div>
    </div>
  );
}

function FontCard({
  item,
  seed,
  saving,
  onCreateSeed,
  onDelete,
}: {
  item?: LibraryItem;
  seed: LibrarySeedItem;
  saving: boolean;
  onCreateSeed: (seed: LibrarySeedItem) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
}) {
  const meta = getMetadata(item ?? seed);
  return (
    <div className="rounded-2xl border border-gray-700 bg-gray-900/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">{item?.name || seed.name}</div>
          <div className="mt-1 text-xs text-gray-500">{String(meta.token || "Família tipográfica")}</div>
        </div>
        {item ? (
          <button
            type="button"
            onClick={() => void onDelete(item.id)}
            disabled={saving}
            className="rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void onCreateSeed(seed)}
            disabled={saving}
            className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-white/5 bg-black/20 p-4">
        <div
          className="text-3xl leading-tight text-white"
          style={{ fontFamily: String(meta.fontFamily || "Inter"), fontWeight: 700 }}
        >
          Aa Bb Cc 0123
        </div>
        <div className="mt-3 text-sm leading-6 text-gray-400">{item?.content || seed.content}</div>
        <div className="mt-3 text-xs text-gray-500">
          {String(meta.fontFamily || "")}
          {meta.fontWeight ? ` · ${String(meta.fontWeight)}` : ""}
          {meta.usage ? ` · ${String(meta.usage)}` : ""}
        </div>
      </div>
    </div>
  );
}

function ComponentCard({
  item,
  seed,
  saving,
  onCreateSeed,
  onDelete,
}: {
  item?: LibraryItem;
  seed: LibrarySeedItem;
  saving: boolean;
  onCreateSeed: (seed: LibrarySeedItem) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
}) {
  const meta = getMetadata(item ?? seed);
  return (
    <div className="rounded-2xl border border-gray-700 bg-gray-900/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">{item?.name || seed.name}</div>
          <div className="mt-1 text-xs text-gray-500">{String(meta.componentType || "componente aprovado")}</div>
        </div>
        {item ? (
          <button
            type="button"
            onClick={() => void onDelete(item.id)}
            disabled={saving}
            className="rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void onCreateSeed(seed)}
            disabled={saving}
            className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-white/5 bg-white p-4">
        <div dangerouslySetInnerHTML={{ __html: item?.content || seed.content || "" }} />
      </div>
      <div className="mt-3 text-xs leading-6 text-gray-500">{String(meta.usage || "Componente de referência do design system")}</div>
    </div>
  );
}

function DocumentsSubTab({
  items,
  seedItems,
  onCreate,
  onCreateSeed,
  onUpdate,
  onDelete,
  saving,
  onApplyBase,
  onOpenStorybook,
}: {
  items: LibraryItem[];
  seedItems: LibrarySeedItem[];
  onCreate: (layer: string, category: string, name: string, content: string | null, metadata?: Record<string, unknown>) => Promise<void>;
  onCreateSeed: (seed: LibrarySeedItem) => Promise<void>;
  onUpdate: (itemId: string, updates: Record<string, unknown>) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
  saving: boolean;
  onApplyBase: () => Promise<void>;
  onOpenStorybook: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editContent, setEditContent] = useState("");
  const [newDocCat, setNewDocCat] = useState<string | null>(null);
  const [newDocName, setNewDocName] = useState("");
  const [newDocContent, setNewDocContent] = useState("");

  const itemsByCategory = useMemo(() => new Map(items.map((item) => [item.category, item])), [items]);
  const extraDocs = items.filter((item) => !seedItems.some((seed) => seed.category === item.category));

  const startEdit = (item: LibraryItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditContent(item.content ?? "");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await onUpdate(editingId, { name: editName.trim(), content: editContent });
    setEditingId(null);
  };

  const saveNewDoc = async () => {
    if (!newDocCat || !newDocName.trim()) return;
    await onCreate("documents", newDocCat, newDocName.trim(), newDocContent);
    setNewDocCat(null);
    setNewDocName("");
    setNewDocContent("");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-700 bg-gray-900/60 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h4 className="text-base font-semibold text-white">Documentos vivos da operação</h4>
            <p className="mt-1 text-sm leading-6 text-gray-400">
              Estes documentos servem como briefing, brand book e guia de trabalho. Quando o agente tiver dúvida, ele deve começar por aqui.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void onApplyBase()}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Semear documentos
            </button>
            <button
              type="button"
              onClick={onOpenStorybook}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-200 transition hover:text-white"
            >
              <ExternalLink className="h-4 w-4" />
              Consultar Storybook
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {seedItems.map((seed) => {
          const item = itemsByCategory.get(seed.category);
          const categoryLabel = DOC_CATEGORIES.find((category) => category.id === seed.category)?.label || seed.category;
          const isEditing = item && editingId === item.id;

          return (
            <div key={seed.category} className="rounded-2xl border border-gray-700 bg-gray-900/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">{item?.name || seed.name}</div>
                  <div className="mt-1 text-xs text-gray-500">{categoryLabel}</div>
                </div>
                <div className="flex items-center gap-2">
                  {item ? (
                    <>
                      {isEditing ? (
                        <button
                          type="button"
                          onClick={() => void saveEdit()}
                          disabled={saving}
                          className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          disabled={saving}
                          className="rounded-lg border border-gray-600 bg-gray-800 p-2 text-gray-300 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void onDelete(item.id)}
                        disabled={saving}
                        className="rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void onCreateSeed(seed)}
                      disabled={saving}
                      className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="mt-4 space-y-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                    className="w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <textarea
                    value={editContent}
                    onChange={(event) => setEditContent(event.target.value)}
                    className="min-h-[220px] w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-3 font-mono text-sm text-gray-300 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-white/5 bg-black/20 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-6 text-gray-400">
                    {(item?.content || seed.content || "").slice(0, 520)}
                    {(item?.content || seed.content || "").length > 520 ? "..." : ""}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {extraDocs.length > 0 && (
        <section className="space-y-3">
          <div>
            <h5 className="text-sm font-semibold text-white">Outros documentos do canal</h5>
            <p className="text-xs text-gray-500">Itens adicionais que não fazem parte da fundação inicial da Starkën.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {extraDocs.map((item) => (
              <div key={item.id} className="rounded-2xl border border-gray-700 bg-gray-900/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">{item.name}</div>
                    <div className="mt-1 text-xs text-gray-500">{item.category}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void onDelete(item.id)}
                    disabled={saving}
                    className="rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 text-sm leading-6 text-gray-400">
                  {(item.content || "").slice(0, 320)}
                  {(item.content || "").length > 320 ? "..." : ""}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {newDocCat ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-gray-900/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white">Novo documento</div>
              <div className="mt-1 text-xs text-gray-500">{DOC_CATEGORIES.find((category) => category.id === newDocCat)?.label}</div>
            </div>
            <button
              type="button"
              onClick={() => setNewDocCat(null)}
              className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 transition hover:text-white"
            >
              Cancelar
            </button>
          </div>
          <div className="mt-4 space-y-3">
            <input
              type="text"
              value={newDocName}
              onChange={(event) => setNewDocName(event.target.value)}
              placeholder="Nome do documento"
              className="w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
            <textarea
              value={newDocContent}
              onChange={(event) => setNewDocContent(event.target.value)}
              placeholder="Conteúdo em markdown..."
              className="min-h-[180px] w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-3 font-mono text-sm text-gray-300 focus:border-emerald-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => void saveNewDoc()}
              disabled={saving || !newDocName.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar documento
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {DOC_CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => {
                setNewDocCat(category.id);
                setNewDocName(category.label);
              }}
              className="flex items-center gap-2 rounded-2xl border border-dashed border-gray-600 bg-gray-900/40 px-4 py-3 text-sm text-gray-400 transition hover:border-emerald-500/40 hover:text-white"
            >
              <Plus className="h-4 w-4" />
              {category.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ApiSubTab({
  items,
  onCreate,
  onDelete,
  saving,
}: {
  items: LibraryItem[];
  onCreate: (layer: string, category: string, name: string, content: string | null) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
  saving: boolean;
}) {
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});

  const addKey = async () => {
    const key = newKey.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");
    if (!key || !newValue.trim()) return;
    await onCreate("api", "api-key", key, newValue.trim());
    setNewKey("");
    setNewValue("");
  };

  const toggleShow = (id: string) => setShowValues((current) => ({ ...current, [id]: !current[id] }));

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-700 bg-gray-900/60 p-4">
        <h4 className="text-base font-semibold text-white">Tokens compartilhados com os agentes</h4>
        <p className="mt-1 text-sm leading-6 text-gray-400">
          Tudo o que for salvo aqui pode ser sincronizado com os agentes da sala. Use apenas chaves realmente necessárias.
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-gray-700 bg-gray-900/50 p-4 md:flex-row md:items-center">
            <div className="min-w-[180px]">
              <div className="font-mono text-sm font-semibold text-amber-300">{item.name}</div>
              <div className="mt-1 text-xs text-gray-500">Disponível para os agentes do canal</div>
            </div>
            <div className="flex flex-1 items-center gap-2">
              <input
                type={showValues[item.id] ? "text" : "password"}
                value={item.content ?? ""}
                readOnly
                className="flex-1 rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 font-mono text-sm text-gray-300"
              />
              <button
                type="button"
                onClick={() => toggleShow(item.id)}
                className="rounded-lg border border-gray-700 bg-gray-800 p-2 text-gray-300 transition hover:text-white"
              >
                {showValues[item.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => void onDelete(item.id)}
                disabled={saving}
                className="rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-700 bg-gray-900/50 p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Nome da chave</label>
            <input
              type="text"
              value={newKey}
              onChange={(event) => setNewKey(event.target.value)}
              placeholder="META_ADS_TOKEN"
              className="w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 font-mono text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Valor</label>
            <input
              type="password"
              value={newValue}
              onChange={(event) => setNewValue(event.target.value)}
              placeholder="sk-..."
              className="w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 font-mono text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => void addKey()}
              disabled={saving || !newKey.trim() || !newValue.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Adicionar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
