"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, ChevronDown, Loader2, MapPin, Users, X } from "lucide-react";

type OfficeRoom = {
  id: string;
  roomLabel: string;
  roomKind: "hq" | "department" | "client";
  channelType: string | null;
  clientName: string | null;
  npcCount: number;
  taskCount: number;
  isCurrent: boolean;
};

interface OfficeRoomsMenuProps {
  channelId: string;
  characterId: string;
}

function roomKindLabel(room: OfficeRoom) {
  if (room.roomKind === "hq") return "Central";
  if (room.roomKind === "department") return "Interna";
  return "Cliente";
}

export default function OfficeRoomsMenu({ channelId, characterId }: OfficeRoomsMenuProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<OfficeRoom[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/channels/office-rooms?channelId=${encodeURIComponent(channelId)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Falha ao carregar salas");
      }
      setRooms(Array.isArray(data.rooms) ? data.rooms : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar salas");
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  useEffect(() => {
    void loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  const groupedRooms = useMemo(() => {
    return {
      central: rooms.filter((room) => room.roomKind === "hq"),
      departments: rooms.filter((room) => room.roomKind === "department"),
      clients: rooms.filter((room) => room.roomKind === "client"),
    };
  }, [rooms]);

  const handleTeleport = (roomId: string) => {
    setOpen(false);
    if (roomId === channelId) return;
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("channelId", roomId);
    nextParams.set("characterId", characterId);
    router.push(`/game?${nextParams.toString()}`);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-caption text-text-secondary"
      >
        <Building2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Salas</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[90] flex items-start justify-center bg-black/55 px-4 pt-20 pb-6" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-[420px] rounded-2xl border border-white/10 bg-[#0f131e] shadow-2xl overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-white/10 flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white">Salas do escritorio</div>
                <div className="text-[11px] text-white/55">Teleporte rapido entre a central e as operacoes</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => void loadRooms()}
                  className="text-[11px] px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-white/70"
                >
                  Atualizar
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-md bg-white/5 hover:bg-white/10 text-white/70"
                  aria-label="Fechar janela de salas"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-3 py-3 space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8 text-white/60">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              ) : error ? (
                <div className="px-3 py-4 rounded-lg border border-rose-400/20 bg-rose-500/10 text-sm text-rose-200">
                  {error}
                </div>
              ) : (
                <>
                  {groupedRooms.central.length > 0 && (
                    <RoomGroup
                      title="Central"
                      rooms={groupedRooms.central}
                      onTeleport={handleTeleport}
                    />
                  )}
                  {groupedRooms.departments.length > 0 && (
                    <RoomGroup
                      title="Internas"
                      rooms={groupedRooms.departments}
                      onTeleport={handleTeleport}
                    />
                  )}
                  {groupedRooms.clients.length > 0 && (
                    <RoomGroup
                      title="Clientes"
                      rooms={groupedRooms.clients}
                      onTeleport={handleTeleport}
                    />
                  )}
                  {!loading && rooms.length === 0 && (
                    <div className="px-3 py-4 rounded-lg border border-white/10 bg-white/5 text-sm text-white/55">
                      Nenhuma sala encontrada ainda.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RoomGroup({
  title,
  rooms,
  onTeleport,
}: {
  title: string;
  rooms: OfficeRoom[];
  onTeleport: (roomId: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="px-1 text-[11px] uppercase tracking-wide text-white/45">{title}</div>
      <div className="space-y-2">
        {rooms.map((room) => (
          <button
            key={room.id}
            onClick={() => onTeleport(room.id)}
            className={`w-full rounded-lg border px-3 py-3 text-left transition-colors ${
              room.isCurrent
                ? "border-emerald-400/35 bg-emerald-500/10"
                : "border-white/10 bg-white/5 hover:bg-white/10"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold text-white">{room.roomLabel}</span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/60">
                    {roomKindLabel(room)}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-[11px] text-white/50">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {room.npcCount} agentes
                  </span>
                  <span>{room.taskCount} tarefas</span>
                </div>
              </div>
              {room.isCurrent && (
                <span className="shrink-0 flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-1 text-[10px] text-emerald-200">
                  <MapPin className="w-3 h-3" />
                  atual
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
