"use client";

import { useState, useMemo } from "react";
import {
  Search, ChevronRight, ChevronDown, Image, FileText, Key,
  Camera, Sparkles, Clock, CheckCircle, XCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LibraryItem {
  id: string;
  layer: string;
  category: string;
  name: string;
  metadata: MetaData | null;
}

interface MetaData {
  status?: string;
  createdByNpcName?: string;
  [key: string]: unknown;
}

interface LibrarySidebarProps {
  items: LibraryItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: (layer: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  visibleLayers?: string[];
  readOnly?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LAYERS = [
  { key: "design", label: "Design System", icon: Image, color: "text-pink-400" },
  { key: "documents", label: "Documentos", icon: FileText, color: "text-sky-400" },
  { key: "social", label: "Stories & Feed", icon: Camera, color: "text-purple-400" },
  { key: "creations", label: "Criacoes", icon: Sparkles, color: "text-amber-400" },
  { key: "api", label: "APIs & Tokens", icon: Key, color: "text-green-400" },
] as const;

const CATEGORY_GROUPS: Record<string, { label: string; match: (cat: string) => boolean }> = {
  logos: { label: "Logos", match: (c) => c.startsWith("logo-") },
  cores: { label: "Cores", match: (c) => c.startsWith("color-") },
  tipografia: { label: "Tipografia", match: (c) => c.startsWith("font-") },
  componentes: { label: "Componentes", match: (c) => ["button-primary", "button-secondary", "card-default", "card-highlight", "header-template", "footer-template", "badge-template", "input-template"].includes(c) },
  templates: { label: "Templates", match: (c) => ["card-template", "icon-set", "spacing-guide"].includes(c) },
  stories: { label: "Stories", match: (c) => c === "story" },
  feed: { label: "Feed", match: (c) => c === "feed-post" || c === "reel" || c === "carousel" },
};

const STATUS_ICONS: Record<string, { icon: typeof Clock; color: string }> = {
  pending: { icon: Clock, color: "text-amber-400" },
  approved: { icon: CheckCircle, color: "text-green-400" },
  rejected: { icon: XCircle, color: "text-red-400" },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LibrarySidebar({
  items, selectedId, onSelect, onAdd, searchQuery, onSearchChange, visibleLayers, readOnly = false,
}: LibrarySidebarProps) {
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set(["design", "documents"]));
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const allowedLayers = useMemo(() => new Set(visibleLayers && visibleLayers.length > 0 ? visibleLayers : LAYERS.map((layer) => layer.key)), [visibleLayers]);

  const toggleLayer = (key: string) => {
    setExpandedLayers((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Filter items by search
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (i) => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q) || i.layer.toLowerCase().includes(q),
    );
  }, [items, searchQuery]);

  // Group items by layer, then by category group
  const tree = useMemo(() => {
    return LAYERS.filter((layer) => allowedLayers.has(layer.key)).map((layer) => {
      const layerItems = filtered.filter((i) => i.layer === layer.key);
      const groups: { key: string; label: string; items: LibraryItem[] }[] = [];
      const ungrouped: LibraryItem[] = [];

      if (layer.key === "design") {
        for (const [gKey, gDef] of Object.entries(CATEGORY_GROUPS)) {
          if (["stories", "feed"].includes(gKey)) continue;
          const matched = layerItems.filter((i) => gDef.match(i.category));
          if (matched.length > 0) groups.push({ key: gKey, label: gDef.label, items: matched });
        }
        const grouped = groups.flatMap((g) => g.items.map((i) => i.id));
        ungrouped.push(...layerItems.filter((i) => !grouped.includes(i.id)));
      } else if (layer.key === "social") {
        const storiesGroup = layerItems.filter((i) => CATEGORY_GROUPS.stories.match(i.category));
        const feedGroup = layerItems.filter((i) => CATEGORY_GROUPS.feed.match(i.category));
        if (storiesGroup.length > 0) groups.push({ key: "stories", label: "Stories", items: storiesGroup });
        if (feedGroup.length > 0) groups.push({ key: "feed", label: "Feed", items: feedGroup });
        const grouped = [...storiesGroup, ...feedGroup].map((i) => i.id);
        ungrouped.push(...layerItems.filter((i) => !grouped.includes(i.id)));
      } else {
        ungrouped.push(...layerItems);
      }

      return { ...layer, items: layerItems, groups, ungrouped };
    });
  }, [allowedLayers, filtered]);

  const pendingCount = items.filter((i) => i.layer === "creations" && i.metadata?.status === "pending").length;
  const totalCount = filtered.length;

  return (
    <div className="w-64 bg-gray-950 border-r border-gray-800 flex flex-col h-full flex-shrink-0">
      {/* Search */}
      <div className="p-3 border-b border-gray-800">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar..."
            data-library-search
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {tree.map((layer) => {
          const isExpanded = expandedLayers.has(layer.key);
          const Icon = layer.icon;
          const count = layer.items.length;
          const isPending = layer.key === "creations" && pendingCount > 0;

          return (
            <div key={layer.key}>
              {/* Layer header */}
              <button
                onClick={() => toggleLayer(layer.key)}
                className="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold hover:bg-gray-900 transition-colors group"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 text-gray-500" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-gray-500" />
                )}
                <Icon className={`w-3.5 h-3.5 ${layer.color}`} />
                <span className="text-gray-300 group-hover:text-white">{layer.label}</span>
                <span className="ml-auto flex items-center gap-1">
                  {isPending && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
                  <span className="text-[10px] text-gray-600">{count}</span>
                </span>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="ml-3">
                  {/* Category groups */}
                  {layer.groups.map((group) => {
                    const groupKey = `${layer.key}-${group.key}`;
                    const groupExpanded = expandedGroups.has(groupKey);

                    return (
                      <div key={groupKey}>
                        <button
                          onClick={() => toggleGroup(groupKey)}
                          className="w-full flex items-center gap-1.5 px-3 py-1 text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
                        >
                          {groupExpanded ? (
                            <ChevronDown className="w-2.5 h-2.5" />
                          ) : (
                            <ChevronRight className="w-2.5 h-2.5" />
                          )}
                          <span>{group.label}</span>
                          <span className="ml-auto text-[9px] text-gray-700">{group.items.length}</span>
                        </button>

                        {groupExpanded && group.items.map((item) => (
                          <SidebarItem
                            key={item.id}
                            item={item}
                            selected={selectedId === item.id}
                            onSelect={onSelect}
                            indent={2}
                          />
                        ))}
                      </div>
                    );
                  })}

                  {/* Ungrouped items */}
                  {layer.ungrouped.map((item) => (
                    <SidebarItem
                      key={item.id}
                      item={item}
                      selected={selectedId === item.id}
                      onSelect={onSelect}
                      indent={layer.groups.length > 0 ? 1 : 0}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-800 space-y-1.5">
        {readOnly ? (
          <div className="rounded-lg border border-sky-500/10 bg-sky-500/5 px-2 py-2 text-center">
            <p className="text-[10px] font-medium text-sky-200">Modo visualização</p>
            <p className="mt-1 text-[9px] text-gray-500">Prévia gerada a partir do manifesto do cliente.</p>
          </div>
        ) : (
          <>
            <p className="text-[9px] text-gray-600 text-center mb-1">Adicionar a:</p>
            <div className="grid grid-cols-2 gap-1">
              {LAYERS.filter((layer) => allowedLayers.has(layer.key)).map((l) => (
                <button
                  key={l.key}
                  onClick={() => onAdd(l.key)}
                  className="flex items-center gap-1 px-2 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-indigo-500/30 rounded-md text-[10px] text-gray-400 hover:text-white transition-colors"
                >
                  <l.icon className={`w-2.5 h-2.5 ${l.color}`} />
                  <span className="truncate">{l.label.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </>
        )}
        <p className="text-[10px] text-gray-700 text-center pt-1">{totalCount} itens</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar Item
// ---------------------------------------------------------------------------

function SidebarItem({
  item, selected, onSelect, indent,
}: {
  item: LibraryItem;
  selected: boolean;
  onSelect: (id: string) => void;
  indent: number;
}) {
  const status = item.metadata?.status as string | undefined;
  const StatusIcon = status ? STATUS_ICONS[status]?.icon : null;
  const statusColor = status ? STATUS_ICONS[status]?.color : "";

  return (
    <button
      onClick={() => onSelect(item.id)}
      className={`w-full text-left px-3 py-1 text-[11px] rounded-md mx-1 transition-all ${
        selected
          ? "bg-indigo-600/20 text-indigo-300 border-l-2 border-indigo-500"
          : "text-gray-400 hover:text-white hover:bg-gray-900 border-l-2 border-transparent"
      }`}
      style={{ paddingLeft: `${12 + indent * 12}px` }}
    >
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${selected ? "bg-indigo-400" : "bg-gray-700"}`} />
        <span className="truncate">{item.name}</span>
        {StatusIcon && <StatusIcon className={`w-3 h-3 flex-shrink-0 ${statusColor}`} />}
      </div>
    </button>
  );
}
