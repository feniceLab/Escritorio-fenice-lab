"use client";

import { Monitor, Tablet, Smartphone, Sun, Moon, Palette, Grid3x3, BookOpen, Layers, Pencil, CheckCircle, XCircle, Eye, EyeOff, Copy, Check } from "lucide-react";
import { useState } from "react";
import type { LibraryItem, MetaData, ViewMode, CanvasBg, DeviceSize } from "./LibraryStorybook";

interface LibraryCanvasProps {
  item: LibraryItem | null;
  items: LibraryItem[];
  canvasBg: CanvasBg;
  setCanvasBg: (bg: CanvasBg) => void;
  deviceSize: DeviceSize;
  setDeviceSize: (size: DeviceSize) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onUpdate: (id: string, updates: Record<string, unknown>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onCreate: (layer: string, category: string, name: string, content: string | null, metadata?: Record<string, unknown>) => Promise<void>;
  saving: boolean;
  fileRef: React.RefObject<HTMLInputElement | null>;
  readOnly?: boolean;
}

const BG_STYLES: Record<CanvasBg, string> = {
  light: "bg-white",
  dark: "bg-gray-800",
  brand: "bg-indigo-950",
  checker: "bg-[length:20px_20px] bg-[image:linear-gradient(45deg,#1a1a2e_25%,transparent_25%,transparent_75%,#1a1a2e_75%),linear-gradient(45deg,#1a1a2e_25%,transparent_25%,transparent_75%,#1a1a2e_75%)] bg-[position:0_0,10px_10px] bg-gray-900",
};

const DEVICE_WIDTHS: Record<DeviceSize, string> = {
  mobile: "max-w-[375px]",
  tablet: "max-w-[768px]",
  desktop: "max-w-full",
};

export default function LibraryCanvas({
  item, canvasBg, setCanvasBg, deviceSize, setDeviceSize,
  viewMode, setViewMode, onUpdate, saving, readOnly = false,
}: LibraryCanvasProps) {
  const meta = (item?.metadata ?? {}) as MetaData;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* ── Toolbar ────────────────────────────────────────────────── */}
      <div className="h-10 bg-gray-900/50 border-b border-gray-800 flex items-center justify-between px-4 flex-shrink-0">
        {/* View tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode("canvas")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === "canvas" ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Canvas
          </button>
          <button
            onClick={() => setViewMode("docs")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === "docs" ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Docs
          </button>
        </div>

        {/* Canvas controls */}
        <div className="flex items-center gap-2">
          {/* Background */}
          <div className="flex items-center gap-0.5 bg-gray-800 rounded-md p-0.5">
            {([
              { key: "light" as CanvasBg, icon: Sun, title: "Claro" },
              { key: "dark" as CanvasBg, icon: Moon, title: "Escuro" },
              { key: "brand" as CanvasBg, icon: Palette, title: "Marca" },
              { key: "checker" as CanvasBg, icon: Grid3x3, title: "Grid" },
            ]).map(({ key, icon: Icon, title }) => (
              <button
                key={key}
                onClick={() => setCanvasBg(key)}
                title={title}
                className={`p-1 rounded transition-colors ${
                  canvasBg === key ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>

          {/* Device size */}
          <div className="flex items-center gap-0.5 bg-gray-800 rounded-md p-0.5">
            {([
              { key: "mobile" as DeviceSize, icon: Smartphone },
              { key: "tablet" as DeviceSize, icon: Tablet },
              { key: "desktop" as DeviceSize, icon: Monitor },
            ]).map(({ key, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setDeviceSize(key)}
                className={`p-1 rounded transition-colors ${
                  deviceSize === key ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Canvas Area ────────────────────────────────────────────── */}
      <div className={`flex-1 overflow-auto p-6 ${BG_STYLES[canvasBg]} transition-colors`}>
        <div className={`mx-auto ${DEVICE_WIDTHS[deviceSize]} transition-all`}>
          {!item ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-gray-600">
              <Layers className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">Selecione um item na sidebar</p>
              <p className="text-xs text-gray-700 mt-1">ou use Cmd+K para buscar</p>
            </div>
          ) : item.layer === "design" && meta.cssValue ? (
            <ColorCanvas item={item} meta={meta} canvasBg={canvasBg} />
          ) : item.layer === "design" && item.content?.startsWith("data:image") ? (
            <ImageCanvas item={item} meta={meta} />
          ) : item.layer === "design" && meta.componentType ? (
            <ComponentCanvas item={item} meta={meta} />
          ) : item.layer === "design" && item.category.startsWith("font-") ? (
            <FontCanvas item={item} meta={meta} canvasBg={canvasBg} />
          ) : item.layer === "documents" ? (
            <DocumentCanvas item={item} onUpdate={onUpdate} saving={saving} readOnly={readOnly} />
          ) : item.layer === "social" ? (
            <SocialCanvas item={item} meta={meta} />
          ) : item.layer === "creations" ? (
            <CreationCanvas item={item} meta={meta} onUpdate={onUpdate} readOnly={readOnly} />
          ) : item.layer === "api" ? (
            <ApiCanvas item={item} />
          ) : item.content?.startsWith("data:image") ? (
            <ImageCanvas item={item} meta={meta} />
          ) : (
            <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-2">{item.name}</h3>
              <p className="text-sm text-gray-400 whitespace-pre-wrap">{item.content || "(sem conteudo)"}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Canvas Previews
// ---------------------------------------------------------------------------

function ColorCanvas({ item, meta, canvasBg }: { item: LibraryItem; meta: MetaData; canvasBg: CanvasBg }) {
  const color = meta.cssValue || "#000";
  const textColor = canvasBg === "light" ? "text-gray-900" : "text-white";

  // Generate tints/shades
  const variants = [100, 200, 300, 400, 500, 600, 700, 800, 900].map((v) => ({
    label: String(v),
    opacity: v / 1000,
  }));

  return (
    <div className="flex flex-col items-center gap-8 py-12">
      {/* Main swatch */}
      <div className="flex items-center gap-8">
        <div
          className="w-32 h-32 rounded-2xl shadow-2xl border-2 border-white/10"
          style={{ backgroundColor: color }}
        />
        <div>
          <h2 className={`text-2xl font-bold ${textColor}`}>{item.name}</h2>
          <p className={`text-lg font-mono mt-1 ${textColor} opacity-80`}>{color}</p>
          <p className="text-xs text-gray-500 mt-2">{item.category}</p>
        </div>
      </div>

      {/* Variants */}
      <div>
        <p className={`text-xs font-semibold mb-3 ${textColor} opacity-60`}>VARIANTES</p>
        <div className="flex gap-2">
          {variants.map((v) => (
            <div key={v.label} className="flex flex-col items-center gap-1">
              <div
                className="w-12 h-12 rounded-lg border border-white/10"
                style={{ backgroundColor: color, opacity: v.opacity }}
              />
              <span className="text-[9px] text-gray-500">{v.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Usage example */}
      <div className="w-full max-w-md">
        <p className={`text-xs font-semibold mb-3 ${textColor} opacity-60`}>EXEMPLO DE USO</p>
        <div className="flex gap-3">
          <div className="px-6 py-3 rounded-lg text-white text-sm font-semibold" style={{ backgroundColor: color }}>
            Botao Primario
          </div>
          <div className="px-6 py-3 rounded-lg text-sm font-semibold border-2" style={{ borderColor: color, color }}>
            Botao Outline
          </div>
        </div>
      </div>
    </div>
  );
}

function ImageCanvas({ item, meta }: { item: LibraryItem; meta: MetaData }) {
  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <img
        src={item.content!}
        alt={item.name}
        className="max-w-full max-h-[500px] object-contain rounded-lg shadow-2xl"
      />
      <div className="text-center">
        <h3 className="text-sm font-semibold text-white">{item.name}</h3>
        {meta.filename && <p className="text-xs text-gray-500 mt-1">{meta.filename}</p>}
        <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-600">
          {meta.mime && <span>{String(meta.mime).replace("image/", "").toUpperCase()}</span>}
          {meta.size && <span>{Math.round(Number(meta.size) / 1024)}KB</span>}
        </div>
      </div>
    </div>
  );
}

function ComponentCanvas({ item, meta }: { item: LibraryItem; meta: MetaData }) {
  return (
    <div className="py-8">
      <p className="text-xs text-gray-500 mb-4 text-center">
        <span className="bg-indigo-900/30 text-indigo-300 px-2 py-0.5 rounded-full">{meta.componentType}</span>
      </p>

      {/* States row */}
      <div className="flex items-center justify-center gap-8">
        {["Default", "Hover", "Disabled"].map((state) => (
          <div key={state} className="flex flex-col items-center gap-2">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">{state}</span>
            <div className="bg-white rounded-lg p-4 min-w-[120px] flex items-center justify-center">
              {item.content ? (
                <div
                  dangerouslySetInnerHTML={{ __html: item.content }}
                  style={{ opacity: state === "Disabled" ? 0.4 : 1 }}
                />
              ) : (
                <div
                  className="px-6 py-2.5 rounded-lg text-white text-sm font-semibold"
                  style={{
                    backgroundColor: state === "Disabled" ? "#999" : state === "Hover" ? "#e55a2b" : (meta.cssValue || "#FF6B35"),
                    opacity: state === "Disabled" ? 0.5 : 1,
                  }}
                >
                  {item.name}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FontCanvas({ item, meta, canvasBg }: { item: LibraryItem; meta: MetaData; canvasBg: CanvasBg }) {
  const fontFamily = meta.fontFamily || "sans-serif";
  const textColor = canvasBg === "light" ? "text-gray-900" : "text-white";

  return (
    <div className="py-8 space-y-8">
      <div className="text-center">
        <h2 className={`text-4xl font-bold ${textColor}`} style={{ fontFamily }}>{item.name}</h2>
        <p className="text-xs text-gray-500 mt-2">{fontFamily} {meta.fontWeight ? `- ${meta.fontWeight}` : ""}</p>
      </div>

      <div className="space-y-4 max-w-lg mx-auto">
        {[48, 36, 24, 18, 14, 12].map((size) => (
          <div key={size} className="flex items-baseline gap-4">
            <span className="text-[10px] text-gray-600 w-8 text-right">{size}</span>
            <p className={textColor} style={{ fontFamily, fontSize: `${size}px`, lineHeight: 1.2 }}>
              Aa Bb Cc Dd Ee 0123
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DocumentCanvas({
  item,
  onUpdate,
  saving,
  readOnly,
}: {
  item: LibraryItem;
  onUpdate: (id: string, u: Record<string, unknown>) => Promise<void>;
  saving: boolean;
  readOnly: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(item.content ?? "");

  return (
    <div className="max-w-3xl mx-auto py-8">
      {editing ? (
        <div className="space-y-3">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl p-6 text-sm text-gray-300 min-h-[500px] resize-y font-mono focus:border-indigo-500 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={async () => { await onUpdate(item.id, { content: editContent }); setEditing(false); }}
              disabled={saving}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-xs rounded-lg font-medium"
            >Salvar</button>
            <button onClick={() => setEditing(false)} className="px-4 py-2 bg-gray-700 text-gray-300 text-xs rounded-lg">Cancelar</button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-900/50 rounded-xl p-8 border border-gray-800">
          <div className="prose prose-invert prose-sm max-w-none">
            <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
              {item.content || "(documento vazio)"}
            </div>
          </div>
          {!readOnly ? (
            <button
              onClick={() => { setEditContent(item.content ?? ""); setEditing(true); }}
              className="mt-6 flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300"
            >
              <Pencil className="w-3.5 h-3.5" /> Editar documento
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

function SocialCanvas({ item, meta }: { item: LibraryItem; meta: MetaData }) {
  const isStory = item.category === "story" || meta.postType === "story";
  const isImage = item.content?.startsWith("data:image");

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="flex items-center gap-2">
        {meta.platform && <span className="text-[10px] bg-pink-900/30 text-pink-300 px-2 py-0.5 rounded-full">{meta.platform}</span>}
        {meta.postType && <span className="text-[10px] bg-sky-900/30 text-sky-300 px-2 py-0.5 rounded-full">{meta.postType}</span>}
      </div>

      {isImage && (
        <div className={isStory ? "w-[270px]" : "max-w-md"}>
          <img src={item.content!} alt={item.name} className={`w-full rounded-xl shadow-2xl ${isStory ? "aspect-[9/16] object-cover" : "object-contain"}`} />
        </div>
      )}

      {meta.caption && (
        <div className="max-w-md bg-gray-900/50 rounded-xl p-4 border border-gray-800">
          <p className="text-xs text-gray-400">{meta.caption}</p>
        </div>
      )}
    </div>
  );
}

function CreationCanvas({
  item,
  meta,
  onUpdate,
  readOnly,
}: {
  item: LibraryItem;
  meta: MetaData;
  onUpdate: (id: string, u: Record<string, unknown>) => Promise<void>;
  readOnly: boolean;
}) {
  const status = meta.status || "pending";
  const isImage = item.content?.startsWith("data:image");

  const approve = () => onUpdate(item.id, { metadata: { ...meta, status: "approved", approvedAt: new Date().toISOString() } });
  const reject = () => onUpdate(item.id, { metadata: { ...meta, status: "rejected" } });

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {/* Status banner */}
      <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium ${
        status === "pending" ? "bg-amber-900/30 text-amber-300" :
        status === "approved" ? "bg-green-900/30 text-green-300" :
        "bg-red-900/30 text-red-300"
      }`}>
        {status === "pending" ? <span>Aguardando Aprovacao</span> :
         status === "approved" ? <span>Aprovado</span> :
         <span>Rejeitado</span>}
      </div>

      {isImage && (
        <img src={item.content!} alt={item.name} className="max-w-md max-h-[400px] object-contain rounded-xl shadow-2xl" />
      )}

      {meta.caption && (
        <div className="max-w-md bg-gray-900/50 rounded-xl p-4 border border-gray-800">
          <p className="text-xs text-gray-400">{meta.caption}</p>
        </div>
      )}

      {/* Action buttons */}
      {status === "pending" && !readOnly && (
        <div className="flex gap-3">
          <button onClick={approve} className="flex items-center gap-1.5 px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg font-medium">
            <CheckCircle className="w-4 h-4" /> Aprovar
          </button>
          <button onClick={reject} className="flex items-center gap-1.5 px-6 py-2.5 bg-red-600/80 hover:bg-red-500 text-white text-sm rounded-lg font-medium">
            <XCircle className="w-4 h-4" /> Rejeitar
          </button>
        </div>
      )}

      {meta.createdByNpcName && (
        <p className="text-[10px] text-gray-600">Criado por: {meta.createdByNpcName}</p>
      )}
    </div>
  );
}

function ApiCanvas({ item }: { item: LibraryItem }) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!item.content) return;
    await navigator.clipboard.writeText(item.content).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="max-w-lg mx-auto py-12 space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-mono font-bold text-amber-300">{item.name}</h2>
        <p className="text-xs text-gray-600 mt-1">Variavel de ambiente compartilhada com todos os agentes</p>
      </div>

      <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex items-center gap-3">
        <input
          type={show ? "text" : "password"}
          value={item.content ?? ""}
          readOnly
          className="flex-1 bg-transparent text-sm text-gray-300 font-mono focus:outline-none"
        />
        <button onClick={() => setShow(!show)} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
        <button onClick={handleCopy} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800">
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
