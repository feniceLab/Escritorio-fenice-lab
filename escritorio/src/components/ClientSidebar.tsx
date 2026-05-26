"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Plus, Users, ClipboardList, ChevronRight, Loader2, RefreshCw } from "lucide-react";

interface ClientRoom {
  id: string;
  name: string;
  clientName: string | null;
  clientLogo: string | null;
  npcCount: number;
  taskCount: number;
}

interface ClientSidebarProps {
  channelId: string;
  characterId: string;
  onCreateClient: () => void;
}

export default function ClientSidebar({ channelId, characterId, onCreateClient }: ClientSidebarProps) {
  const router = useRouter();
  const [rooms, setRooms] = useState<ClientRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/channels/client-rooms?parentChannelId=${channelId}`);
      if (res.ok) {
        const data = await res.json();
        setRooms(data.rooms || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  useEffect(() => {
    void loadRooms();
  }, [loadRooms]);

  const navigateToRoom = (roomId: string) => {
    router.push(`/game?channelId=${roomId}&characterId=${characterId}`);
  };

  if (collapsed) {
    return (
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40">
        <button
          onClick={() => setCollapsed(false)}
        className="bg-bg-deep/95 border border-border border-r-0 rounded-l-[var(--radius-md)] px-2 py-3 hover:bg-surface transition-colors"
          title="Mostrar clientes"
        >
          <Building2 className="w-4 h-4 text-primary" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed right-0 top-16 bottom-0 w-64 z-40 bg-bg-deep/95 border-l border-border flex flex-col shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
        <h2 className="text-sm font-semibold text-primary flex items-center gap-1.5">
          <Building2 className="w-4 h-4" />
          Clientes
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={loadRooms}
            className="text-text-secondary hover:text-white p-1 rounded-[var(--radius-sm)]"
            title="Atualizar"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCollapsed(true)}
            className="text-text-secondary hover:text-white p-1 rounded-[var(--radius-sm)]"
            title="Minimizar"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Room list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-text-muted">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            <span className="text-xs">Carregando...</span>
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="w-8 h-8 text-text-muted mx-auto mb-2" />
            <p className="text-xs text-text-muted">Nenhum cliente ainda</p>
            <p className="text-xs text-text-muted mt-1">Crie seu primeiro cliente abaixo</p>
          </div>
        ) : (
          rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => navigateToRoom(room.id)}
              className="w-full text-left bg-surface/70 hover:bg-primary/10 border border-border hover:border-primary/40 rounded-[var(--radius-md)] p-2.5 transition-all group"
            >
              <div className="flex items-start gap-2">
                {room.clientLogo ? (
                  <img src={room.clientLogo} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary text-xs font-bold">
                      {(room.clientName || room.name)?.[0]?.toUpperCase() || "?"}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate group-hover:text-primary transition-colors">
                    {room.clientName || room.name}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-text-muted flex items-center gap-0.5">
                      <Users className="w-3 h-3" />
                      {room.npcCount}
                    </span>
                    <span className="text-xs text-text-muted flex items-center gap-0.5">
                      <ClipboardList className="w-3 h-3" />
                      {room.taskCount}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text-secondary flex-shrink-0 mt-1" />
              </div>
            </button>
          ))
        )}
      </div>

      {/* Create client button */}
      <div className="px-2 py-2 border-t border-border">
        <button
          onClick={onCreateClient}
          className="w-full flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-medium py-2 px-3 rounded-[var(--radius-md)] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Novo Cliente
        </button>
      </div>
    </div>
  );
}
