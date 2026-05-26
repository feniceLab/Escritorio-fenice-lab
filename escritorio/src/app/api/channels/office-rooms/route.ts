import { count, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { channels, db, npcs, tasks } from "@/db";
import { getUserId } from "@/lib/internal-rpc";
import {
  ensureOfficeHierarchyForRoot,
  getOfficeRootChannel,
  listOfficeRoomsForChannel,
} from "@/lib/office-structure";

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) {
    return NextResponse.json({ errorCode: "unauthorized", error: "unauthorized" }, { status: 401 });
  }

  const channelId = req.nextUrl.searchParams.get("channelId");
  if (!channelId) {
    return NextResponse.json({ errorCode: "missing_channel_id", error: "channelId required" }, { status: 400 });
  }

  const root = await getOfficeRootChannel(channelId);
  if (!root) {
    return NextResponse.json({ errorCode: "channel_not_found", error: "Channel not found" }, { status: 404 });
  }

  const [rootChannel] = await db
    .select({ ownerId: channels.ownerId })
    .from(channels)
    .where(eq(channels.id, root.id))
    .limit(1);

  if (!rootChannel || rootChannel.ownerId !== userId) {
    return NextResponse.json({ errorCode: "forbidden", error: "forbidden" }, { status: 403 });
  }

  await ensureOfficeHierarchyForRoot(root);

  const refreshedOffice = await listOfficeRoomsForChannel(channelId, { ensureDefaults: false });
  if (!refreshedOffice) {
    return NextResponse.json({ errorCode: "channel_not_found", error: "Channel not found" }, { status: 404 });
  }

  const rooms = await Promise.all(
    refreshedOffice.rooms.map(async (room) => {
      const [npcCountRow] = await db
        .select({ value: count() })
        .from(npcs)
        .where(eq(npcs.channelId, room.id));
      const [taskCountRow] = await db
        .select({ value: count() })
        .from(tasks)
        .where(eq(tasks.channelId, room.id));

      return {
        ...room,
        npcCount: npcCountRow?.value ?? 0,
        taskCount: taskCountRow?.value ?? 0,
        isCurrent: room.id === channelId,
      };
    }),
  );

  return NextResponse.json({
    root: refreshedOffice.root,
    currentRoomId: channelId,
    rooms,
  });
}
