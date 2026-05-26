"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  X, Image, FileText, Key, Loader2, Upload, Plus, Trash2,
  Save, Eye, EyeOff, Copy, Pencil, BookOpen, Check,
  Camera, Clock, CheckCircle, XCircle, Calendar, Sparkles,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LibraryItem {
  id: string;
  channelId: string;
  layer: string;
  category: string;
  name: string;
  content: string | null;
  metadata: Record<string, unknown> | null;
  sortOrder: number;
}

type Layer = "design" | "documents" | "api" | "social" | "creations";

interface MetaData {
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
}

interface LibraryViewerProps {
  channelId: string;
  channelName: string;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LAYERS: { key: Layer; label: string; icon: typeof Image }[] = [
  { key: "design", label: "Design System", icon: Image },
  { key: "documents", label: "Documentos", icon: FileText },
  { key: "social", label: "Stories & Feed", icon: Camera },
  { key: "creations", label: "Criacoes", icon: Sparkles },
  { key: "api", label: "APIs & Tokens", icon: Key },
];

const DESIGN_CATEGORIES = [
  // Logos
  { id: "logo-dark", label: "Logo (Fundo Preto)" },
  { id: "logo-light", label: "Logo (Fundo Branco)" },
  { id: "logo-transparent", label: "Logo (Transparente)" },
  { id: "logo-round", label: "Logo (Redonda)" },
  // Cores
  { id: "color-primary", label: "Cor Primaria" },
  { id: "color-secondary", label: "Cor Secundaria" },
  { id: "color-accent", label: "Cor de Destaque" },
  { id: "color-palette", label: "Paleta Completa" },
  // Fontes
  { id: "font-primary", label: "Fonte Principal" },
  { id: "font-secondary", label: "Fonte Secundaria" },
  // Componentes
  { id: "button-primary", label: "Botao Principal" },
  { id: "button-secondary", label: "Botao Secundario" },
  { id: "card-default", label: "Card Padrao" },
  { id: "card-highlight", label: "Card Destaque" },
  { id: "header-template", label: "Header" },
  { id: "footer-template", label: "Footer" },
  { id: "badge-template", label: "Badge / Tag" },
  { id: "input-template", label: "Input / Form" },
  { id: "icon-set", label: "Icones" },
  { id: "spacing-guide", label: "Guia de Espacamento" },
  { id: "card-template", label: "Template de Post" },
];

const DOC_CATEGORIES = [
  { id: "briefing", label: "Briefing" },
  { id: "prd", label: "PRD" },
  { id: "brand-book", label: "Brand Book" },
  { id: "brand-guidelines", label: "Diretrizes da Marca" },
  { id: "storybook", label: "Storybook / Design System" },
  { id: "other", label: "Outro Documento" },
];

const SOCIAL_CATEGORIES = [
  { id: "story", label: "Story" },
  { id: "feed-post", label: "Post de Feed" },
  { id: "reel", label: "Reel" },
  { id: "carousel", label: "Carrossel" },
  { id: "caption-template", label: "Template de Legenda" },
];

const CREATION_CATEGORIES = [
  { id: "image", label: "Imagem" },
  { id: "text", label: "Texto / Copy" },
  { id: "video", label: "Video" },
  { id: "carousel-draft", label: "Rascunho de Carrossel" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Aguardando Aprovacao", color: "text-amber-400", icon: Clock },
  approved: { label: "Aprovado", color: "text-green-400", icon: CheckCircle },
  rejected: { label: "Rejeitado", color: "text-red-400", icon: XCircle },
  scheduled: { label: "Agendado", color: "text-sky-400", icon: Calendar },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LibraryViewer({ channelId, channelName, onClose }: LibraryViewerProps) {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [layer, setLayer] = useState<Layer>("design");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch(`/api/channels/${channelId}/library`);
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items ?? []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [channelId]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const createItem = async (l: string, category: string, name: string, content: string | null, metadata?: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/channels/${channelId}/library`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layer: l, category, name, content, metadata }),
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
    setSaving(true);
    try {
      const res = await fetch(`/api/channels/${channelId}/library/${itemId}`, {
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
    try {
      await fetch(`/api/channels/${channelId}/library/${itemId}`, { method: "DELETE" });
      if (selectedId === itemId) setSelectedId(null);
      await fetchItems();
      showToast("Removido");
    } catch { /* ignore */ }
  };

  const approveItem = async (itemId: string) => {
    await updateItem(itemId, { metadata: { ...items.find((i) => i.id === itemId)?.metadata, status: "approved", approvedAt: new Date().toISOString() } });
  };

  const rejectItem = async (itemId: string) => {
    await updateItem(itemId, { metadata: { ...items.find((i) => i.id === itemId)?.metadata, status: "rejected" } });
  };

  const layerItems = items.filter((i) => i.layer === layer);
  const selected = selectedId ? items.find((i) => i.id === selectedId) : null;
  const pendingCount = items.filter((i) => i.layer === "creations" && (i.metadata as MetaData)?.status === "pending").length;

  useEffect(() => {
    const first = items.find((i) => i.layer === layer);
    setSelectedId(first?.id ?? null);
  }, [layer, items]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-5xl mx-4 flex flex-col"
        style={{ maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            Biblioteca: {channelName}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {toast && (
          <div className={`mx-5 mt-2 text-xs px-3 py-1.5 rounded-md flex-shrink-0 ${
            ["Salvo!", "Atualizado!", "Removido"].includes(toast)
              ? "bg-green-900/30 text-green-300"
              : "bg-red-900/30 text-red-300"
          }`}>{toast}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : (
          <div className="flex flex-1 min-h-0">
            {/* Sidebar */}
            <div className="w-56 border-r border-gray-700 flex flex-col flex-shrink-0">
              <div className="p-3 space-y-1 border-b border-gray-700">
                {LAYERS.map(({ key, label, icon: Icon }) => {
                  const count = items.filter((i) => i.layer === key).length;
                  const isPending = key === "creations" && pendingCount > 0;
                  return (
                    <button
                      key={key}
                      onClick={() => setLayer(key)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        layer === key
                          ? "bg-indigo-600 text-white"
                          : "text-gray-400 hover:text-white hover:bg-gray-800"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="truncate">{label}</span>
                      <span className="ml-auto flex items-center gap-1">
                        {isPending && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        )}
                        <span className="text-[10px] opacity-60">{count}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {layerItems.length === 0 ? (
                  <p className="text-[10px] text-gray-600 text-center py-4">Nenhum item</p>
                ) : (
                  layerItems.map((item) => {
                    const meta = (item.metadata ?? {}) as MetaData;
                    const status = meta.status as string | undefined;
                    const statusConf = status ? STATUS_CONFIG[status] : null;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelectedId(item.id)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                          selectedId === item.id
                            ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40"
                            : "text-gray-400 hover:text-white hover:bg-gray-800 border border-transparent"
                        }`}
                      >
                        <p className="truncate font-medium">{item.name}</p>
                        <div className="flex items-center gap-1">
                          <p className="text-[10px] opacity-50 truncate">{item.category}</p>
                          {statusConf && (
                            <span className={`text-[9px] ${statusConf.color}`}>{statusConf.label}</span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="p-2 border-t border-gray-700 flex-shrink-0">
                <AddItemButton layer={layer} saving={saving} onCreate={createItem} fileRef={fileRef} />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {!selected ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-600">
                  <BookOpen className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm">Selecione um item para visualizar</p>
                </div>
              ) : selected.layer === "design" ? (
                <DesignPreview item={selected} onUpdate={updateItem} onDelete={deleteItem} saving={saving} fileRef={fileRef} />
              ) : selected.layer === "documents" ? (
                <DocumentPreview item={selected} onUpdate={updateItem} onDelete={deleteItem} saving={saving} />
              ) : selected.layer === "social" ? (
                <SocialPreview item={selected} onUpdate={updateItem} onDelete={deleteItem} saving={saving} fileRef={fileRef} />
              ) : selected.layer === "creations" ? (
                <CreationPreview item={selected} onUpdate={updateItem} onDelete={deleteItem} onApprove={approveItem} onReject={rejectItem} saving={saving} />
              ) : (
                <ApiPreview item={selected} onDelete={deleteItem} />
              )}
            </div>
          </div>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Design Preview (with component support)
// ---------------------------------------------------------------------------

function DesignPreview({
  item, onUpdate, onDelete, saving, fileRef,
}: {
  item: LibraryItem;
  onUpdate: (id: string, u: Record<string, unknown>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  saving: boolean;
  fileRef: React.RefObject<HTMLInputElement | null>;
}) {
  const isImage = item.content?.startsWith("data:image");
  const meta = (item.metadata ?? {}) as MetaData;
  const isColor = item.category.startsWith("color-");
  const isComponent = !!meta.componentType;

  const handleReplace = () => {
    if (!fileRef.current) return;
    const handler = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        onUpdate(item.id, {
          content: reader.result as string,
          metadata: { ...meta, mime: file.type, size: file.size, filename: file.name },
        });
      };
      reader.readAsDataURL(file);
      fileRef.current?.removeEventListener("change", handler);
      (e.target as HTMLInputElement).value = "";
    };
    fileRef.current.addEventListener("change", handler);
    fileRef.current.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">{item.name}</h3>
          {meta.componentType && <span className="text-[10px] text-indigo-400 bg-indigo-900/30 px-2 py-0.5 rounded-full">{String(meta.componentType)}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleReplace} disabled={saving} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            <Upload className="w-3.5 h-3.5" /> Substituir
          </button>
          <button onClick={() => onDelete(item.id)} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
            <Trash2 className="w-3.5 h-3.5" /> Remover
          </button>
        </div>
      </div>

      {/* Color swatch */}
      {isColor && meta.cssValue && (
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-xl border-2 border-gray-600 shadow-lg" style={{ backgroundColor: String(meta.cssValue) }} />
          <div className="space-y-1">
            <p className="text-lg font-mono text-white">{String(meta.cssValue)}</p>
            <p className="text-xs text-gray-500">{item.name}</p>
          </div>
        </div>
      )}

      {/* Component preview */}
      {isComponent && item.content && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="text-xs text-gray-500 mb-3">Preview do Componente</div>
          <div className="bg-white rounded-lg p-4 min-h-[80px] flex items-center justify-center">
            <div dangerouslySetInnerHTML={{ __html: item.content }} />
          </div>
        </div>
      )}

      {/* Image preview */}
      {isImage && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center justify-center">
          <img src={item.content!} alt={item.name} className="max-w-full max-h-[400px] object-contain rounded" />
        </div>
      )}

      {/* Text content */}
      {!isImage && !isColor && !isComponent && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{item.content || "(sem conteudo)"}</p>
        </div>
      )}

      {/* Font preview */}
      {item.category.startsWith("font-") && meta.fontFamily && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-2">
          <p className="text-xs text-gray-500">Preview da Fonte</p>
          <p className="text-2xl text-white" style={{ fontFamily: String(meta.fontFamily) }}>
            Aa Bb Cc Dd Ee Ff Gg 0123456789
          </p>
          <p className="text-xs text-gray-400">
            {String(meta.fontFamily)} {meta.fontWeight ? `— ${meta.fontWeight}` : ""}
          </p>
        </div>
      )}

      {/* Metadata grid */}
      <div className="grid grid-cols-3 gap-3 text-xs">
        {meta.filename && (
          <div className="bg-gray-800/50 rounded-lg px-3 py-2">
            <p className="text-gray-500">Arquivo</p>
            <p className="text-gray-300 truncate">{String(meta.filename)}</p>
          </div>
        )}
        {meta.mime && (
          <div className="bg-gray-800/50 rounded-lg px-3 py-2">
            <p className="text-gray-500">Formato</p>
            <p className="text-gray-300">{String(meta.mime).replace("image/", "").toUpperCase()}</p>
          </div>
        )}
        {meta.size && (
          <div className="bg-gray-800/50 rounded-lg px-3 py-2">
            <p className="text-gray-500">Tamanho</p>
            <p className="text-gray-300">{Math.round(Number(meta.size) / 1024)}KB</p>
          </div>
        )}
        {meta.cssValue && (
          <div className="bg-gray-800/50 rounded-lg px-3 py-2">
            <p className="text-gray-500">CSS</p>
            <p className="text-gray-300 font-mono">{String(meta.cssValue)}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Document Preview
// ---------------------------------------------------------------------------

function DocumentPreview({
  item, onUpdate, onDelete, saving,
}: {
  item: LibraryItem;
  onUpdate: (id: string, u: Record<string, unknown>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  saving: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(item.content ?? "");

  useEffect(() => { setEditContent(item.content ?? ""); setEditing(false); }, [item.id, item.content]);

  const save = async () => {
    await onUpdate(item.id, { content: editContent });
    setEditing(false);
  };

  const catLabel = DOC_CATEGORIES.find((c) => c.id === item.category)?.label ?? item.category;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">{item.name}</h3>
          <p className="text-[10px] text-gray-500">{catLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <button onClick={save} disabled={saving} className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Salvar
            </button>
          ) : (
            <button onClick={() => setEditing(true)} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              <Pencil className="w-3.5 h-3.5" /> Editar
            </button>
          )}
          <button onClick={() => onDelete(item.id)} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
            <Trash2 className="w-3.5 h-3.5" /> Remover
          </button>
        </div>
      </div>

      {editing ? (
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg p-4 text-sm text-gray-300 min-h-[400px] resize-y font-mono focus:border-indigo-500 focus:outline-none"
          placeholder="Conteudo em markdown..."
        />
      ) : (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 min-h-[300px]">
          <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
            {item.content || "(documento vazio — clique em Editar para adicionar conteudo)"}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Social Preview (Stories & Feed)
// ---------------------------------------------------------------------------

function SocialPreview({
  item, onUpdate, onDelete, saving, fileRef,
}: {
  item: LibraryItem;
  onUpdate: (id: string, u: Record<string, unknown>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  saving: boolean;
  fileRef: React.RefObject<HTMLInputElement | null>;
}) {
  const isImage = item.content?.startsWith("data:image");
  const meta = (item.metadata ?? {}) as MetaData;
  const isStory = item.category === "story" || (meta.postType === "story");

  const handleReplace = () => {
    if (!fileRef.current) return;
    const handler = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        onUpdate(item.id, {
          content: reader.result as string,
          metadata: { ...meta, mime: file.type, size: file.size, filename: file.name },
        });
      };
      reader.readAsDataURL(file);
      fileRef.current?.removeEventListener("change", handler);
      (e.target as HTMLInputElement).value = "";
    };
    fileRef.current.addEventListener("change", handler);
    fileRef.current.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">{item.name}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            {meta.platform && <span className="text-[10px] text-pink-400 bg-pink-900/20 px-2 py-0.5 rounded-full">{String(meta.platform)}</span>}
            {meta.postType && <span className="text-[10px] text-sky-400 bg-sky-900/20 px-2 py-0.5 rounded-full">{String(meta.postType)}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleReplace} disabled={saving} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            <Upload className="w-3.5 h-3.5" /> Substituir
          </button>
          <button onClick={() => onDelete(item.id)} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
            <Trash2 className="w-3.5 h-3.5" /> Remover
          </button>
        </div>
      </div>

      {isImage && (
        <div className={`bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center justify-center ${isStory ? "max-w-[280px] mx-auto" : ""}`}>
          <img
            src={item.content!}
            alt={item.name}
            className={`rounded ${isStory ? "max-h-[500px] w-full object-cover" : "max-w-full max-h-[400px] object-contain"}`}
          />
        </div>
      )}

      {!isImage && item.content && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{item.content}</p>
        </div>
      )}

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        {meta.originalUrl && (
          <div className="bg-gray-800/50 rounded-lg px-3 py-2 col-span-2">
            <p className="text-gray-500">URL Original</p>
            <p className="text-indigo-300 truncate">{String(meta.originalUrl)}</p>
          </div>
        )}
        {meta.capturedAt && (
          <div className="bg-gray-800/50 rounded-lg px-3 py-2">
            <p className="text-gray-500">Capturado em</p>
            <p className="text-gray-300">{new Date(String(meta.capturedAt)).toLocaleDateString("pt-BR")}</p>
          </div>
        )}
        {meta.caption && (
          <div className="bg-gray-800/50 rounded-lg px-3 py-2 col-span-2">
            <p className="text-gray-500">Legenda</p>
            <p className="text-gray-300 text-xs">{String(meta.caption).slice(0, 300)}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Creation Preview (with approval flow)
// ---------------------------------------------------------------------------

function CreationPreview({
  item, onUpdate, onDelete, onApprove, onReject, saving,
}: {
  item: LibraryItem;
  onUpdate: (id: string, u: Record<string, unknown>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  saving: boolean;
}) {
  const isImage = item.content?.startsWith("data:image");
  const meta = (item.metadata ?? {}) as MetaData;
  const status = String(meta.status || "pending");
  const statusConf = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConf.icon;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">{item.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs flex items-center gap-1 ${statusConf.color}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {statusConf.label}
            </span>
          </div>
          {meta.createdByNpcName && (
            <p className="text-[10px] text-gray-500 mt-1">
              Criado por: <span className="text-violet-400">{String(meta.createdByNpcName)}</span>
            </p>
          )}
        </div>
        <button onClick={() => onDelete(item.id)} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
          <Trash2 className="w-3.5 h-3.5" /> Remover
        </button>
      </div>

      {/* Image preview */}
      {isImage && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center justify-center">
          <img src={item.content!} alt={item.name} className="max-w-full max-h-[400px] object-contain rounded" />
        </div>
      )}

      {/* Text content */}
      {!isImage && item.content && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{item.content}</p>
        </div>
      )}

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        {meta.platform && (
          <div className="bg-gray-800/50 rounded-lg px-3 py-2">
            <p className="text-gray-500">Plataforma</p>
            <p className="text-gray-300">{String(meta.platform)}</p>
          </div>
        )}
        {meta.postType && (
          <div className="bg-gray-800/50 rounded-lg px-3 py-2">
            <p className="text-gray-500">Tipo</p>
            <p className="text-gray-300">{String(meta.postType)}</p>
          </div>
        )}
        {meta.caption && (
          <div className="bg-gray-800/50 rounded-lg px-3 py-2 col-span-2">
            <p className="text-gray-500">Legenda</p>
            <p className="text-gray-300">{String(meta.caption)}</p>
          </div>
        )}
        {meta.scheduledAt && (
          <div className="bg-gray-800/50 rounded-lg px-3 py-2">
            <p className="text-gray-500">Agendado para</p>
            <p className="text-sky-300">{new Date(String(meta.scheduledAt)).toLocaleString("pt-BR")}</p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {status === "pending" && (
        <div className="flex items-center gap-2 pt-2 border-t border-gray-700">
          <button
            onClick={() => onApprove(item.id)}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 text-white text-xs rounded-lg font-medium"
          >
            <CheckCircle className="w-4 h-4" /> Aprovar
          </button>
          <button
            onClick={() => onReject(item.id)}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600/80 hover:bg-red-500 disabled:bg-gray-700 text-white text-xs rounded-lg font-medium"
          >
            <XCircle className="w-4 h-4" /> Rejeitar
          </button>
        </div>
      )}

      {status === "approved" && (
        <div className="flex items-center gap-2 pt-2 border-t border-gray-700">
          <button
            onClick={() => {
              const date = prompt("Data e hora para agendar (ex: 2026-04-10 15:00):");
              if (!date) return;
              onUpdate(item.id, { metadata: { ...meta, status: "scheduled", scheduledAt: new Date(date).toISOString() } });
            }}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:bg-gray-700 text-white text-xs rounded-lg font-medium"
          >
            <Calendar className="w-4 h-4" /> Agendar Postagem
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// API Preview
// ---------------------------------------------------------------------------

function ApiPreview({
  item, onDelete,
}: {
  item: LibraryItem;
  onDelete: (id: string) => Promise<void>;
}) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!item.content) return;
    try {
      await navigator.clipboard.writeText(item.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-white font-mono">{item.name}</h3>
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center gap-3">
        <input type={show ? "text" : "password"} value={item.content ?? ""} readOnly className="flex-1 bg-transparent text-sm text-gray-300 font-mono focus:outline-none" />
        <button onClick={() => setShow(!show)} className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-gray-700">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
        <button onClick={handleCopy} className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-gray-700">
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        </button>
        <button onClick={() => onDelete(item.id)} className="p-1.5 text-red-400 hover:text-red-300 rounded-md hover:bg-gray-700">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <p className="text-[10px] text-gray-600">
        Esta chave e compartilhada automaticamente com todos os agentes da sala como variavel de ambiente.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add Item Button
// ---------------------------------------------------------------------------

function AddItemButton({
  layer, saving, onCreate, fileRef,
}: {
  layer: Layer;
  saving: boolean;
  onCreate: (l: string, category: string, name: string, content: string | null, metadata?: Record<string, unknown>) => Promise<void>;
  fileRef: React.RefObject<HTMLInputElement | null>;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [newApiKey, setNewApiKey] = useState("");
  const [newApiValue, setNewApiValue] = useState("");
  const [showApiForm, setShowApiForm] = useState(false);

  const categories = layer === "design" ? DESIGN_CATEGORIES
    : layer === "documents" ? DOC_CATEGORIES
    : layer === "social" ? SOCIAL_CATEGORIES
    : layer === "creations" ? CREATION_CATEGORIES
    : [];

  if (layer === "design" || layer === "social") {
    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="w-full flex items-center justify-center gap-1 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-md text-xs text-indigo-300 font-medium"
        >
          <Upload className="w-3 h-3" /> {layer === "design" ? "Adicionar Asset" : "Adicionar Midia"}
        </button>
        {showMenu && (
          <div className="absolute bottom-full left-0 right-0 mb-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 max-h-48 overflow-y-auto">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setShowMenu(false);
                  if (!fileRef.current) return;
                  const handler = (e: Event) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      onCreate(layer, cat.id, cat.label, reader.result as string, {
                        mime: file.type, size: file.size, filename: file.name,
                        ...(layer === "social" ? { platform: "instagram", postType: cat.id } : {}),
                      });
                    };
                    reader.readAsDataURL(file);
                    fileRef.current?.removeEventListener("change", handler);
                    (e.target as HTMLInputElement).value = "";
                  };
                  fileRef.current.addEventListener("change", handler);
                  fileRef.current.click();
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (layer === "documents" || layer === "creations") {
    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="w-full flex items-center justify-center gap-1 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-md text-xs text-indigo-300 font-medium"
        >
          <Plus className="w-3 h-3" /> {layer === "documents" ? "Novo Documento" : "Nova Criacao"}
        </button>
        {showMenu && (
          <div className="absolute bottom-full left-0 right-0 mb-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setShowMenu(false);
                  const meta = layer === "creations" ? { status: "pending", postType: cat.id } : {};
                  onCreate(layer, cat.id, cat.label, "", meta);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // API layer
  if (showApiForm) {
    return (
      <div className="space-y-1.5">
        <input type="text" value={newApiKey} onChange={(e) => setNewApiKey(e.target.value)} placeholder="NOME_DA_CHAVE"
          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-[10px] text-white font-mono focus:border-indigo-500 focus:outline-none" />
        <input type="password" value={newApiValue} onChange={(e) => setNewApiValue(e.target.value)} placeholder="valor..."
          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-[10px] text-white font-mono focus:border-indigo-500 focus:outline-none" />
        <div className="flex gap-1">
          <button
            onClick={async () => {
              const key = newApiKey.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");
              if (!key || !newApiValue.trim()) return;
              await onCreate("api", "api-key", key, newApiValue.trim());
              setNewApiKey(""); setNewApiValue(""); setShowApiForm(false);
            }}
            disabled={saving || !newApiKey.trim() || !newApiValue.trim()}
            className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 text-white text-[10px] rounded font-medium"
          >Salvar</button>
          <button onClick={() => { setShowApiForm(false); setNewApiKey(""); setNewApiValue(""); }}
            className="px-2 py-1 bg-gray-700 text-gray-300 text-[10px] rounded">Cancelar</button>
        </div>
      </div>
    );
  }

  return (
    <button onClick={() => setShowApiForm(true)}
      className="w-full flex items-center justify-center gap-1 px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 rounded-md text-xs text-amber-300 font-medium">
      <Key className="w-3 h-3" /> Nova Chave API
    </button>
  );
}
