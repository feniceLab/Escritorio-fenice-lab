import { db } from "@/db";
import { channels, npcs, tasks } from "@/db";
import { NextRequest, NextResponse } from "next/server";
import { eq, and, count } from "drizzle-orm";
import { getUserId } from "@/lib/internal-rpc";
import { ensureOfficeHierarchyForRoot, type OfficeChannelRow } from "@/lib/office-structure";

// GET /api/channels/client-rooms?parentChannelId=xxx
// Returns all client rooms linked to a parent HQ channel, with NPC/task counts
export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ errorCode: "unauthorized", error: "unauthorized" }, { status: 401 });

  const parentChannelId = req.nextUrl.searchParams.get("parentChannelId");
  if (!parentChannelId) {
    return NextResponse.json({ errorCode: "missing_parent_channel_id", error: "parentChannelId required" }, { status: 400 });
  }

  // Verify parent channel ownership
  const [parent] = await db
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
    .where(eq(channels.id, parentChannelId))
    .limit(1);

  if (!parent || parent.ownerId !== userId) {
    return NextResponse.json({ errorCode: "forbidden", error: "forbidden" }, { status: 403 });
  }

  if (parent.channelType === "hq") {
    await ensureOfficeHierarchyForRoot(parent as OfficeChannelRow);
  }

  // Fetch client rooms: either by parentChannelId or by same group + type=client
  const clientRooms = await db
    .select({
      id: channels.id,
      name: channels.name,
      clientName: channels.clientName,
      clientLogo: channels.clientLogo,
      channelType: channels.channelType,
      mapData: channels.mapData,
      mapConfig: channels.mapConfig,
      createdAt: channels.createdAt,
    })
    .from(channels)
    .where(
      parent.groupId
        ? and(eq(channels.groupId, parent.groupId), eq(channels.channelType, "client"))
        : eq(channels.parentChannelId, parentChannelId),
    );

  // Get NPC and task counts for each room
  const rooms = await Promise.all(
    clientRooms.map(async (room) => {
      const [npcCount] = await db.select({ value: count() }).from(npcs).where(eq(npcs.channelId, room.id));
      const [taskCount] = await db.select({ value: count() }).from(tasks).where(eq(tasks.channelId, room.id));

      return {
        id: room.id,
        name: room.name,
        clientName: room.clientName,
        clientLogo: room.clientLogo,
        channelType: room.channelType,
        mapData: room.mapData,
        mapConfig: room.mapConfig,
        npcCount: npcCount?.value ?? 0,
        taskCount: taskCount?.value ?? 0,
        createdAt: room.createdAt,
      };
    }),
  );

  return NextResponse.json({ rooms });
}
