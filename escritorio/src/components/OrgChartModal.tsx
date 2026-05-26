"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
  Handle,
  Position,
} from "@xyflow/react";
import dagre from "dagre";
import { X, UserPlus, Users, Link2, Unlink, RefreshCw } from "lucide-react";
import { EventBus } from "@/game/EventBus";
import "@xyflow/react/dist/style.css";

interface NpcRow {
  id: string;
  channelId: string;
  channelName: string | null;
  clientName: string | null;
  channelType: string | null;
  roomLabel: string | null;
  name: string;
  hasAgent: boolean;
  agentId: string | null;
  runtimeProvider: string | null;
  model: string | null;
  reportsToId: string | null;
}

interface OrgChartModalProps {
  channelId: string;
  isOpen: boolean;
  onClose: () => void;
  onHireNew: () => void;
  refreshTick?: number;
}

const NODE_WIDTH = 260;
const NODE_HEIGHT = 150;

function layoutDagre(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 64, ranksep: 96 });
  nodes.forEach((n) => g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);
  return nodes.map((n) => {
    const pos = g.node(n.id);
    return { ...n, position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 } };
  });
}

function providerBadgeColor(provider: string | null): string {
  if (!provider) return "#64748b";
  if (provider.includes("claude")) return "#a855f7";
  if (provider.includes("codex")) return "#10b981";
  return "#6366f1";
}

type NpcNodeData = {
  npc: NpcRow;
  allNpcs: NpcRow[];
  onDelegate: (targetId: string, bossId: string | null) => void;
  onEdit: (id: string) => void;
};

function NpcNode({ data }: NodeProps) {
  const d = data as unknown as NpcNodeData;
  const { npc, allNpcs, onDelegate, onEdit } = d;
  const boss = npc.reportsToId ? allNpcs.find((n) => n.id === npc.reportsToId) : null;
  const eligibleBosses = allNpcs.filter((n) => n.id !== npc.id);

  return (
    <div
      className="rounded-lg border border-border bg-surface shadow-lg overflow-hidden"
      style={{ width: NODE_WIDTH, minHeight: NODE_HEIGHT }}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="in"
        style={{ background: "#10b981", width: 16, height: 16, border: "2px solid #064e3b", top: -8 }}
      />
      <div
        className="px-3 py-2 cursor-pointer hover:bg-white/5"
        onClick={(e) => { e.stopPropagation(); onEdit(npc.id); }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: providerBadgeColor(npc.runtimeProvider) }}
            title={npc.runtimeProvider || "sem agente"}
          />
          <div className="font-semibold text-white truncate flex-1">{npc.name}</div>
        </div>
        <div className="text-xs text-text-secondary mt-1 truncate">
          {npc.runtimeProvider || "sem agente"}{npc.model ? ` · ${npc.model}` : ""}
        </div>
        {npc.roomLabel && (
          <div className="text-[10px] text-cyan-200/75 mt-0.5 truncate">
            sala: {npc.roomLabel}
          </div>
        )}
        {boss && (
          <div className="text-[10px] text-text-secondary/70 mt-0.5 truncate">
            ↑ reporta para <span className="text-white/80">{boss.name}</span>
            {boss.roomLabel ? <span className="text-white/45"> · {boss.roomLabel}</span> : null}
          </div>
        )}
      </div>
      <div className="border-t border-border/50 px-2 py-1.5 flex gap-1 items-center bg-black/20">
        <select
          className="nodrag flex-1 text-[11px] bg-surface border border-border rounded px-1.5 py-1 text-white focus:outline-none focus:border-primary"
          value={npc.reportsToId ?? ""}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => {
            e.stopPropagation();
            onDelegate(npc.id, e.target.value || null);
          }}
          title="Definir chefe"
        >
          <option value="">— sem chefe —</option>
          {eligibleBosses.map((b) => (
            <option key={b.id} value={b.id}>
              ↑ {b.name}{b.roomLabel ? ` — ${b.roomLabel}` : ""}
            </option>
          ))}
        </select>
        {npc.reportsToId && (
          <button
            className="nodrag text-[11px] px-2 py-1 bg-rose-600/80 hover:bg-rose-600 text-white rounded"
            onClick={(e) => { e.stopPropagation(); onDelegate(npc.id, null); }}
            title="Remover chefe"
          >
            <Unlink className="w-3 h-3" />
          </button>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="out"
        style={{ background: "#6366f1", width: 16, height: 16, border: "2px solid #312e81", bottom: -8 }}
      />
    </div>
  );
}

const nodeTypes = { npc: NpcNode };

function OrgChartInner({ channelId, onClose, onHireNew, refreshTick }: Omit<OrgChartModalProps, "isOpen">) {
  const [npcs, setNpcs] = useState<NpcRow[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; kind: "ok" | "err" } | null>(null);
  const [filter, setFilter] = useState("");
  const [roomCount, setRoomCount] = useState(0);

  const showToast = useCallback((msg: string, kind: "ok" | "err" = "ok") => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const officeRes = await fetch(`/api/channels/office-rooms?channelId=${encodeURIComponent(channelId)}`);
      if (!officeRes.ok) throw new Error("Falha ao carregar salas do escritorio");
      const officeJson = await officeRes.json();
      const officeRooms = Array.isArray(officeJson.rooms) ? officeJson.rooms : [];
      const officeRoomIds = officeRooms.map((room: { id: string }) => room.id).filter(Boolean);
      setRoomCount(officeRoomIds.length);

      const params = new URLSearchParams();
      if (officeRoomIds.length > 0) {
        params.set("channelIds", officeRoomIds.join(","));
      } else {
        params.set("channelId", channelId);
      }

      const res = await fetch(`/api/npcs?${params.toString()}`);
      if (!res.ok) throw new Error("Falha ao carregar NPCs");
      const json = await res.json();
      setNpcs(json.npcs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  useEffect(() => { refresh(); }, [refresh, refreshTick]);

  const patchReportsTo = useCallback(async (npcId: string, reportsToId: string | null) => {
    const res = await fetch(`/api/npcs/${npcId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportsToId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Falha ao atualizar hierarquia");
    }
  }, []);

  const onDelegate = useCallback(async (targetId: string, bossId: string | null) => {
    try {
      await patchReportsTo(targetId, bossId);
      showToast(bossId ? "Delegação registrada" : "Subordinação removida", "ok");
      await refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erro", "err");
    }
  }, [patchReportsTo, refresh, showToast]);

  const onEditNode = useCallback((id: string) => {
    EventBus.emit("npc:edit", { npcId: id });
    // NOTE: we intentionally do NOT close the org-chart here — NpcHireModal
    // opens stacked on top (z-120 vs z-100) so the user returns to the
    // org-chart after saving.
  }, []);

  const filteredNpcs = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return npcs;
    return npcs.filter((n) =>
      n.name.toLowerCase().includes(q)
      || n.roomLabel?.toLowerCase().includes(q),
    );
  }, [npcs, filter]);

  const { baseNodes, baseEdges } = useMemo(() => {
    const ns: Node[] = filteredNpcs.map((n) => ({
      id: n.id,
      type: "npc",
      position: { x: 0, y: 0 },
      data: { npc: n, allNpcs: npcs, onDelegate, onEdit: onEditNode },
    }));
    const visible = new Set(filteredNpcs.map((n) => n.id));
    const es: Edge[] = filteredNpcs
      .filter((n) => n.reportsToId && visible.has(n.reportsToId))
      .map((n) => ({
        id: `e-${n.reportsToId}-${n.id}`,
        source: n.reportsToId as string,
        target: n.id,
        type: "smoothstep",
        animated: false,
        markerEnd: { type: MarkerType.ArrowClosed, color: "#6366f1" },
        style: { stroke: "#6366f1", strokeWidth: 2 },
      }));
    return { baseNodes: layoutDagre(ns, es), baseEdges: es };
  }, [filteredNpcs, npcs, onDelegate, onEditNode]);

  useEffect(() => {
    setNodes(baseNodes);
    setEdges(baseEdges);
  }, [baseNodes, baseEdges, setNodes, setEdges]);

  const onConnect = useCallback(async (conn: Connection) => {
    if (!conn.source || !conn.target || conn.source === conn.target) return;
    // optimistic edge
    const newEdge: Edge = {
      id: `e-${conn.source}-${conn.target}`,
      source: conn.source,
      target: conn.target,
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed, color: "#6366f1" },
      style: { stroke: "#6366f1", strokeWidth: 2 },
    };
    setEdges((eds) => addEdge(newEdge, eds.filter((e) => e.target !== conn.target)));
    try {
      await patchReportsTo(conn.target, conn.source);
      showToast("Delegação via drag registrada", "ok");
      await refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erro", "err");
      await refresh();
    }
  }, [setEdges, patchReportsTo, refresh, showToast]);

  const onEdgeClick = useCallback(async (_e: React.MouseEvent, edge: Edge) => {
    if (!confirm(`Remover subordinação?`)) return;
    setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    try {
      await patchReportsTo(edge.target, null);
      showToast("Subordinação removida", "ok");
      await refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erro", "err");
      await refresh();
    }
  }, [setEdges, patchReportsTo, refresh, showToast]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border" style={{ backgroundColor: "#161824" }}>
        <div className="flex items-center gap-3">
          <Users className="w-4 h-4 text-primary" />
          <h2 className="text-lg font-semibold text-white">Organograma</h2>
          <span className="text-xs text-text-secondary">{npcs.length} agente(s)</span>
          <span className="text-xs text-text-secondary">{roomCount} sala(s)</span>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="🔍 filtrar por nome…"
            className="ml-2 px-2 py-1 text-xs rounded bg-surface border border-border text-white placeholder:text-text-secondary focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="p-1.5 rounded-md hover:bg-white/10 text-text-secondary hover:text-white"
            title="Recarregar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onHireNew}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-md text-sm font-semibold"
          >
            <UserPlus className="w-3.5 h-3.5" /> Adicionar Agente
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-white/10 text-text-secondary hover:text-white"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 relative" style={{ backgroundColor: "#0b0c12" }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-text-secondary pointer-events-none z-10">Carregando…</div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center text-danger">{error}</div>
        )}
        {!loading && !error && npcs.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-text-secondary">
            Nenhum agente contratado ainda. Clique em &quot;Adicionar Agente&quot; para começar.
          </div>
        )}
        {toast && (
          <div
            className={`absolute top-3 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-md text-sm shadow-lg ${
              toast.kind === "ok" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
            }`}
          >
            {toast.msg}
          </div>
        )}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeClick={onEdgeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.25 }}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{ type: "smoothstep" }}
          connectionLineStyle={{ stroke: "#10b981", strokeWidth: 3 }}
          connectionRadius={30}
        >
          <Background color="#333" gap={16} />
          <Controls />
          <MiniMap pannable zoomable nodeColor={() => "#6366f1"} maskColor="rgba(0,0,0,0.6)" />
        </ReactFlow>
      </div>
      <div className="px-4 py-2 text-xs text-text-secondary border-t border-border flex items-center gap-4 flex-wrap" style={{ backgroundColor: "#161824" }}>
        <span className="flex items-center gap-1.5"><Link2 className="w-3 h-3 text-emerald-400" /> Arraste do círculo verde (abaixo do chefe) até o círculo verde (acima do subordinado)</span>
        <span>· ou use o <b>select &quot;— sem chefe —&quot;</b> dentro de cada card</span>
        <span>· clique no nome para editar</span>
        <span>· clique numa seta para remover a relação</span>
      </div>
    </div>
  );
}

export default function OrgChartModal(props: OrgChartModalProps) {
  if (!props.isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" onClick={props.onClose}>
      <div
        className="w-full h-full max-w-[1400px] max-h-[90vh] rounded-xl border border-border overflow-hidden flex flex-col"
        style={{ backgroundColor: "#0f1117" }}
        onClick={(e) => e.stopPropagation()}
      >
        <ReactFlowProvider>
          <OrgChartInner channelId={props.channelId} onClose={props.onClose} onHireNew={props.onHireNew} refreshTick={props.refreshTick} />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
