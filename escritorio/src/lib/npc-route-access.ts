import { NextRequest } from "next/server";
import { db, npcs, channels } from "@/db";
import { eq } from "drizzle-orm";
import { getUserId } from "@/lib/internal-rpc";

export type NpcOwnershipResult =
  | {
      ok: true;
      userId: string;
      npc: typeof npcs.$inferSelect;
      channel: typeof channels.$inferSelect;
    }
  | {
      ok: false;
      status: number;
      errorCode: string;
      error: string;
    };

export async function verifyNpcOwnership(req: NextRequest, npcId: string): Promise<NpcOwnershipResult> {
  const userId = getUserId(req);
  if (!userId) {
    return { ok: false, status: 401, errorCode: "unauthorized", error: "Unauthorized" };
  }

  const [npc] = await db.select().from(npcs).where(eq(npcs.id, npcId));
  if (!npc) {
    return { ok: false, status: 404, errorCode: "npc_not_found", error: "NPC not found" };
  }

  const [channel] = await db.select().from(channels).where(eq(channels.id, npc.channelId));
  if (!channel || channel.ownerId !== userId) {
    return {
      ok: false,
      status: 403,
      errorCode: "only_channel_owner_can_modify_npcs",
      error: "Only channel owner can modify NPCs",
    };
  }

  return { ok: true, userId, npc, channel };
}
