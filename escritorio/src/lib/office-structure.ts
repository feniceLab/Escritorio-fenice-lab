import crypto from "node:crypto";

import { and, eq, inArray, or } from "drizzle-orm";

import {
  channelMembers,
  channels,
  db,
  isPostgres,
  jsonForDb,
} from "@/db";

export type OfficeChannelRow = {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  groupId: string | null;
  mapData: unknown;
  mapConfig: unknown;
  isPublic: boolean | null;
  inviteCode: string | null;
  maxPlayers: number | null;
  gatewayConfig: unknown;
  channelType: string | null;
  clientName: string | null;
  parentChannelId: string | null;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
};

export type OfficeRoomKind = "hq" | "department" | "client";

export type OfficeRoomSummary = {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  groupId: string | null;
  channelType: string | null;
  clientName: string | null;
  parentChannelId: string | null;
  roomKind: OfficeRoomKind;
  roomLabel: string;
  createdAt: Date | string | null;
};

const DEFAULT_OFFICE_DEPARTMENTS = [
  {
    name: "Operacoes",
    description: "Sala operacional central que coordena os bracos dos clientes.",
  },
  {
    name: "Financeiro",
    description: "Gestao financeira, custos, investimentos e resultados da agencia.",
  },
] as const;

function nowForDb() {
  return (isPostgres ? new Date() : new Date().toISOString()) as unknown as Date;
}

function generateInviteCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

function toRoomSummary(room: OfficeChannelRow, rootChannelId: string): OfficeRoomSummary {
  const roomKind: OfficeRoomKind = room.id === rootChannelId
    ? "hq"
    : room.channelType === "client"
      ? "client"
      : "department";

  return {
    id: room.id,
    name: room.name,
    description: room.description,
    ownerId: room.ownerId,
    groupId: room.groupId,
    channelType: room.channelType,
    clientName: room.clientName,
    parentChannelId: room.parentChannelId,
    roomKind,
    roomLabel: room.clientName?.trim() || room.name,
    createdAt: room.createdAt,
  };
}

async function getChannelRecord(channelId: string) {
  const [channel] = await db
    .select({
      id: channels.id,
      name: channels.name,
      description: channels.description,
      ownerId: channels.ownerId,
      groupId: channels.groupId,
      mapData: channels.mapData,
      mapConfig: channels.mapConfig,
      isPublic: channels.isPublic,
      inviteCode: channels.inviteCode,
      maxPlayers: channels.maxPlayers,
      gatewayConfig: channels.gatewayConfig,
      channelType: channels.channelType,
      clientName: channels.clientName,
      parentChannelId: channels.parentChannelId,
      createdAt: channels.createdAt,
      updatedAt: channels.updatedAt,
    })
    .from(channels)
    .where(eq(channels.id, channelId))
    .limit(1);

  return channel ?? null;
}

export async function getOfficeRootChannel(channelId: string) {
  const current = await getChannelRecord(channelId);
  if (!current) return null;

  if (current.channelType === "hq") {
    return current;
  }

  if (current.parentChannelId) {
    const parent = await getChannelRecord(current.parentChannelId);
    if (parent) {
      if (parent.channelType === "hq") return parent;
      return parent;
    }
  }

  if (current.groupId) {
    const [root] = await db
      .select({
        id: channels.id,
        name: channels.name,
        description: channels.description,
        ownerId: channels.ownerId,
        groupId: channels.groupId,
        mapData: channels.mapData,
        mapConfig: channels.mapConfig,
        isPublic: channels.isPublic,
        inviteCode: channels.inviteCode,
        maxPlayers: channels.maxPlayers,
        gatewayConfig: channels.gatewayConfig,
        channelType: channels.channelType,
        clientName: channels.clientName,
        parentChannelId: channels.parentChannelId,
        createdAt: channels.createdAt,
        updatedAt: channels.updatedAt,
      })
      .from(channels)
      .where(and(
        eq(channels.groupId, current.groupId),
        eq(channels.ownerId, current.ownerId),
        eq(channels.channelType, "hq"),
      ))
      .limit(1);

    if (root) return root;
  }

  return current;
}

export async function ensureOfficeHierarchyForRoot(root: OfficeChannelRow) {
  if (root.channelType !== "hq") return;

  if (root.groupId) {
    const clientRooms = await db
      .select({
        id: channels.id,
        parentChannelId: channels.parentChannelId,
      })
      .from(channels)
      .where(and(
        eq(channels.groupId, root.groupId),
        eq(channels.ownerId, root.ownerId),
        eq(channels.channelType, "client"),
      ));

    const detachedClientIds = clientRooms
      .filter((room) => room.id !== root.id && room.parentChannelId !== root.id)
      .map((room) => room.id);

    if (detachedClientIds.length > 0) {
      await db
        .update(channels)
        .set({
          parentChannelId: root.id,
          updatedAt: nowForDb(),
        })
        .where(inArray(channels.id, detachedClientIds));
    }
  }

  const existingChildren = await db
    .select({
      id: channels.id,
      name: channels.name,
      channelType: channels.channelType,
    })
    .from(channels)
    .where(eq(channels.parentChannelId, root.id));

  for (const definition of DEFAULT_OFFICE_DEPARTMENTS) {
    const alreadyExists = existingChildren.some((room) =>
      room.channelType !== "client" && room.name.trim().toLowerCase() === definition.name.trim().toLowerCase(),
    );

    if (alreadyExists) continue;

    const [created] = await db
      .insert(channels)
      .values({
        name: definition.name,
        description: definition.description,
        ownerId: root.ownerId,
        groupId: root.groupId,
        mapData: root.mapData ?? null,
        mapConfig: root.mapConfig ?? null,
        isPublic: root.isPublic ?? true,
        inviteCode: generateInviteCode(),
        maxPlayers: root.maxPlayers ?? 50,
        gatewayConfig: jsonForDb({ libraryToken: crypto.randomUUID() }),
        channelType: "standard",
        parentChannelId: root.id,
      })
      .returning({
        id: channels.id,
      });

    if (created?.id) {
      await db.insert(channelMembers).values({
        channelId: created.id,
        userId: root.ownerId,
        role: "owner",
      });
    }
  }
}

export async function listOfficeRoomsForChannel(
  channelId: string,
  options?: { ensureDefaults?: boolean },
) {
  const root = await getOfficeRootChannel(channelId);
  if (!root) return null;

  if (options?.ensureDefaults !== false) {
    await ensureOfficeHierarchyForRoot(root);
  }

  const rows = await db
    .select({
      id: channels.id,
      name: channels.name,
      description: channels.description,
      ownerId: channels.ownerId,
      groupId: channels.groupId,
      mapData: channels.mapData,
      mapConfig: channels.mapConfig,
      isPublic: channels.isPublic,
      inviteCode: channels.inviteCode,
      maxPlayers: channels.maxPlayers,
      gatewayConfig: channels.gatewayConfig,
      channelType: channels.channelType,
      clientName: channels.clientName,
      parentChannelId: channels.parentChannelId,
      createdAt: channels.createdAt,
      updatedAt: channels.updatedAt,
    })
    .from(channels)
    .where(
      or(
        eq(channels.id, root.id),
        eq(channels.parentChannelId, root.id),
      ),
    );

  const normalizedRows = rows.some((room) => room.id === root.id)
    ? rows
    : [root, ...rows];

  const rooms = normalizedRows
    .filter((room) => room.channelType !== "client")
    .map((room) => toRoomSummary(room, root.id))
    .sort((a, b) => {
      const rank = (room: OfficeRoomSummary) => {
        if (room.roomKind === "hq") return 0;
        if (room.roomKind === "department") return 1;
        return 2;
      };

      const rankDiff = rank(a) - rank(b);
      if (rankDiff !== 0) return rankDiff;
      return a.roomLabel.localeCompare(b.roomLabel, "pt-BR");
    });

  return {
    root: toRoomSummary(root, root.id),
    rooms,
  };
}
