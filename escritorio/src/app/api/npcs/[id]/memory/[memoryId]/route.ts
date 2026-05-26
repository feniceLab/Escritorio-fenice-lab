import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, npcMemoryItems, isPostgres, jsonForDb } from "@/db";
import { verifyNpcOwnership } from "@/lib/npc-route-access";
import { parseDbJson } from "@/lib/db-json";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memoryId: string }> },
) {
  const { id, memoryId } = await params;
  const access = await verifyNpcOwnership(req, id);
  if (!access.ok) {
    return NextResponse.json({ errorCode: access.errorCode, error: access.error }, { status: access.status });
  }

  try {
    const body = await req.json();
    const updates: Record<string, unknown> = {
      updatedAt: (isPostgres ? new Date() : new Date().toISOString()) as unknown as Date,
    };

    if (body.memoryType !== undefined) updates.memoryType = String(body.memoryType).trim();
    if (body.title !== undefined) updates.title = String(body.title).trim();
    if (body.content !== undefined) updates.content = String(body.content).trim();
    if (body.pinned !== undefined) updates.pinned = Boolean(body.pinned);
    if (body.sortOrder !== undefined) updates.sortOrder = Number(body.sortOrder) || 0;
    if (body.metadata !== undefined) updates.metadata = jsonForDb(body.metadata);

    const [updated] = await db.update(npcMemoryItems)
      .set(updates)
      .where(and(eq(npcMemoryItems.id, memoryId), eq(npcMemoryItems.npcId, id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ errorCode: "npc_memory_item_not_found", error: "NPC memory item not found" }, { status: 404 });
    }

    return NextResponse.json({
      memory: {
        ...updated,
        metadata: parseDbJson(updated.metadata) ?? updated.metadata,
      },
    });
  } catch (error) {
    console.error("Failed to update NPC memory item:", error);
    return NextResponse.json({ errorCode: "failed_to_update_npc_memory_item", error: "Failed to update NPC memory item" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memoryId: string }> },
) {
  const { id, memoryId } = await params;
  const access = await verifyNpcOwnership(req, id);
  if (!access.ok) {
    return NextResponse.json({ errorCode: access.errorCode, error: access.error }, { status: access.status });
  }

  try {
    await db.delete(npcMemoryItems).where(and(eq(npcMemoryItems.id, memoryId), eq(npcMemoryItems.npcId, id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete NPC memory item:", error);
    return NextResponse.json({ errorCode: "failed_to_delete_npc_memory_item", error: "Failed to delete NPC memory item" }, { status: 500 });
  }
}
