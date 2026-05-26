"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, Settings, Code, History, Trash2, Copy, Check } from "lucide-react";
import type { LibraryItem, MetaData, BottomTab } from "./LibraryStorybook";

interface LibraryBottomPanelProps {
  item: LibraryItem | null;
  tab: BottomTab;
  setTab: (tab: BottomTab) => void;
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
  onDelete: (id: string) => Promise<void>;
  saving: boolean;
  readOnly?: boolean;
}

export default function LibraryBottomPanel({
  item, tab, setTab, collapsed, setCollapsed, onDelete, saving, readOnly = false,
}: LibraryBottomPanelProps) {
  const meta = (item?.metadata ?? {}) as MetaData;

  return (
    <div className={`bg-gray-950 border-t border-gray-800 flex flex-col flex-shrink-0 transition-all ${collapsed ? "h-8" : "h-52"}`}>
      {/* Tab bar */}
      <div className="h-8 flex items-center justify-between px-2 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-0.5">
          {([
            { key: "properties" as BottomTab, label: "Propriedades", icon: Settings },
            { key: "code" as BottomTab, label: "Codigo", icon: Code },
            { key: "history" as BottomTab, label: "Historico", icon: History },
          ]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setTab(key); if (collapsed) setCollapsed(false); }}
              className={`flex items-center gap-1 px-3 py-1 text-[11px] rounded transition-colors ${
                tab === key && !collapsed ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 text-gray-500 hover:text-white rounded"
        >
          {collapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Content */}
      {!collapsed && item && (
        <div className="flex-1 overflow-y-auto p-3">
          {tab === "properties" ? (
            <PropertiesTab item={item} meta={meta} onDelete={onDelete} saving={saving} readOnly={readOnly} />
          ) : tab === "code" ? (
            <CodeTab item={item} meta={meta} />
          ) : (
            <HistoryTab item={item} meta={meta} />
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Properties Tab
// ---------------------------------------------------------------------------

function PropertiesTab({
  item, meta, onDelete, saving, readOnly,
}: {
  item: LibraryItem;
  meta: MetaData;
  onDelete: (id: string) => Promise<void>;
  saving: boolean;
  readOnly: boolean;
}) {
  const rows: { label: string; value: string; type: string }[] = [
    { label: "nome", value: item.name, type: "string" },
    { label: "camada", value: item.layer, type: "enum" },
    { label: "categoria", value: item.category, type: "enum" },
  ];

  if (meta.cssValue) rows.push({ label: "cssValue", value: meta.cssValue, type: "color" });
  if (meta.fontFamily) rows.push({ label: "fontFamily", value: meta.fontFamily, type: "string" });
  if (meta.fontWeight) rows.push({ label: "fontWeight", value: meta.fontWeight, type: "string" });
  if (meta.componentType) rows.push({ label: "componentType", value: meta.componentType, type: "string" });
  if (meta.platform) rows.push({ label: "platform", value: meta.platform, type: "string" });
  if (meta.postType) rows.push({ label: "postType", value: meta.postType, type: "string" });
  if (meta.mime) rows.push({ label: "formato", value: String(meta.mime).replace("image/", "").toUpperCase(), type: "string" });
  if (meta.size) rows.push({ label: "tamanho", value: `${Math.round(Number(meta.size) / 1024)}KB`, type: "string" });
  if (meta.status) rows.push({ label: "status", value: meta.status, type: "enum" });

  return (
    <div className="space-y-1">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-gray-600 text-left">
            <th className="pb-1 font-medium w-32">Propriedade</th>
            <th className="pb-1 font-medium w-20">Tipo</th>
            <th className="pb-1 font-medium">Valor</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t border-gray-800/50">
              <td className="py-1.5 text-indigo-300 font-mono">{row.label}</td>
              <td className="py-1.5 text-gray-600 font-mono">{row.type}</td>
              <td className="py-1.5">
                {row.type === "color" ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded border border-gray-600" style={{ backgroundColor: row.value }} />
                    <span className="text-gray-300 font-mono">{row.value}</span>
                  </div>
                ) : (
                  <span className="text-gray-300">{row.value}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!readOnly ? (
        <div className="flex items-center gap-2 pt-3 border-t border-gray-800">
          <button
            onClick={() => onDelete(item.id)}
            disabled={saving}
            className="flex items-center gap-1 px-3 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Excluir
          </button>
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Code Tab
// ---------------------------------------------------------------------------

function CodeTab({ item, meta }: { item: LibraryItem; meta: MetaData }) {
  const [copied, setCopied] = useState(false);

  let code = "";
  if (meta.cssValue) {
    code = `.${item.category} {\n  color: ${meta.cssValue};\n  /* ${item.name} */\n}`;
  } else if (meta.fontFamily) {
    code = `font-family: '${meta.fontFamily}', sans-serif;\nfont-weight: ${meta.fontWeight || "400"};`;
  } else if (meta.componentType) {
    code = item.content || `<!-- ${item.name} -->\n<button class="${item.category}">\n  ${item.name}\n</button>`;
  } else if (item.layer === "api") {
    code = `# Variavel de ambiente\n${item.name}=***\n\n# Uso no codigo\nprocess.env.${item.name}`;
  } else {
    code = `/* ${item.name} */\n/* Layer: ${item.layer} */\n/* Category: ${item.category} */`;
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 text-gray-500 hover:text-white bg-gray-800 rounded-lg"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
      <pre className="bg-gray-900 rounded-lg p-4 text-xs text-gray-300 font-mono overflow-x-auto whitespace-pre">
        {code}
      </pre>
    </div>
  );
}

// ---------------------------------------------------------------------------
// History Tab
// ---------------------------------------------------------------------------

function HistoryTab({ item, meta }: { item: LibraryItem; meta: MetaData }) {
  const events: { date: string; label: string }[] = [];

  if (item.createdAt) {
    events.push({
      date: new Date(item.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }),
      label: meta.createdByNpcName ? `Criado por ${meta.createdByNpcName} (NPC)` : "Criado",
    });
  }

  if (meta.approvedAt) {
    events.push({
      date: new Date(meta.approvedAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }),
      label: "Aprovado",
    });
  }

  if (meta.scheduledAt) {
    events.push({
      date: new Date(meta.scheduledAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }),
      label: "Agendado para postagem",
    });
  }

  if (item.updatedAt && item.updatedAt !== item.createdAt) {
    events.push({
      date: new Date(item.updatedAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }),
      label: "Ultima atualizacao",
    });
  }

  if (events.length === 0) {
    return <p className="text-xs text-gray-600">Nenhum historico disponivel</p>;
  }

  return (
    <div className="space-y-2">
      {events.map((ev, i) => (
        <div key={i} className="flex items-center gap-3 text-xs">
          <span className="text-gray-600 font-mono w-28 flex-shrink-0">{ev.date}</span>
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
          <span className="text-gray-300">{ev.label}</span>
        </div>
      ))}
    </div>
  );
}
