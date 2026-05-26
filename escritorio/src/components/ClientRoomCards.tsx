"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Building2, Users, Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface ClientRoom {
  id: string;
  name: string;
  clientName: string | null;
  clientLogo?: string | null;
  npcCount: number;
  taskCount: number;
}

interface ClientRoomCardsProps {
  channelId: string;
  characterId: string;
}

// Office dock constants: keep client-room shortcuts clear of the NPC rail.
const CARD_WIDTH = 154;
const MINIMAP_PADDING = 10;
const NPC_DOCK_WIDTH = 260;
// Top bar height in px
const TOP_BAR_HEIGHT = 48;

export default function ClientRoomCards({ channelId, characterId }: ClientRoomCardsProps) {
  const router = useRouter();
  const [rooms, setRooms] = useState<ClientRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch(`/api/channels/client-rooms?parentChannelId=${channelId}`);
      if (!res.ok) return;
      const data = await res.json();
      setRooms(data.rooms ?? []);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  useEffect(() => {
    fetchRooms();
    // Refresh every 30 seconds
    const interval = setInterval(fetchRooms, 30_000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  const topOffset = TOP_BAR_HEIGHT + MINIMAP_PADDING;
  const rightOffset = NPC_DOCK_WIDTH + MINIMAP_PADDING;

  return (
    <div
      className="fixed z-30 flex flex-col gap-1"
      style={{ top: topOffset, right: rightOffset, width: CARD_WIDTH }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-2 py-1 bg-bg/80 border border-border rounded-[var(--radius-sm)] cursor-pointer select-none"
        onClick={() => setCollapsed((c) => !c)}
      >
        <span className="text-[10px] text-primary font-semibold flex items-center gap-1">
          <Building2 className="w-3 h-3" />
          Clientes {rooms.length > 0 && `(${rooms.length})`}
        </span>
        {collapsed ? (
          <ChevronDown className="w-3 h-3 text-gray-400" />
        ) : (
          <ChevronUp className="w-3 h-3 text-gray-400" />
        )}
      </div>

      {/* Cards */}
      {!collapsed && (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-2 bg-bg/80 border border-border rounded-[var(--radius-sm)]">
              <Loader2 className="w-3.5 h-3.5 text-text-secondary animate-spin" />
            </div>
          ) : rooms.length === 0 ? (
            <div className="px-2 py-1.5 bg-bg/80 border border-border rounded-[var(--radius-sm)] text-[10px] text-text-muted text-center">
              Nenhum cliente ainda
            </div>
          ) : (
            rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => router.push(`/game?channelId=${room.id}&characterId=${characterId}`)}
                className="w-full text-left px-2 py-1.5 bg-bg/85 hover:bg-primary/10 border border-border hover:border-primary/40 rounded-[var(--radius-sm)] transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  {room.clientLogo ? (
                    <img src={room.clientLogo} alt="" className="h-5 w-5 rounded object-cover border border-border" />
                  ) : (
                    <span className="h-5 w-5 rounded bg-primary/10 text-primary border border-primary/30 inline-flex items-center justify-center text-[9px] font-bold">
                      {(room.clientName || room.name)?.[0]?.toUpperCase() || "?"}
                    </span>
                  )}
                  <p className="min-w-0 flex-1 text-[10px] text-white font-medium truncate group-hover:text-primary">
                    {room.clientName || room.name}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9px] text-primary flex items-center gap-0.5">
                    <Users className="w-2.5 h-2.5" />
                    {room.npcCount}
                  </span>
                  <span className="text-[9px] text-sky-300 flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block" />
                    {room.taskCount} tarefas
                  </span>
                </div>
              </button>
            ))
          )}
        </>
      )}
    </div>
  );
}
