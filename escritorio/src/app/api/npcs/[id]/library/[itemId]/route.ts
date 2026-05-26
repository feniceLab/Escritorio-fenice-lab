import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, npcLibraryItems, isPostgres, jsonForDb } from "@/db";
import { verifyNpcOwnership } from "@/lib/npc-route-access";
import { parseDbJson } from "@/lib/db-json";

const MAX_CONTENT_SIZE = 2 * 1024 * 1024;

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const { id, itemId } = await params;
  const access = await verifyNpcOwnership(req, id);
  if (!access.ok) {
    return NextResponse.json({ errorCode: access.errorCode, error: access.error }, { status: access.status });
  }

  try {
    const body = await req.json();
    const updates: Record<string, unknown> = {
      updatedAt: (isPostgres ? new Date() : new Date().toISOString()) as unknown as Date,
    };

    if (body.name !== undefined) updates.name = String(body.name).trim();
    if (body.category !== undefined) updates.category = String(body.category).trim();
    if (body.layer !== undefined) updates.layer = String(body.layer).trim();
    if (body.sortOrder !== undefined) updates.sortOrder = Number(body.sortOrder) || 0;
    if (body.content !== undefined) {
      if (body.content && String(body.content).length > MAX_CONTENT_SIZE) {
        return NextResponse.json({ errorCode: "content_too_large", error: "Content too large (max 2MB)" }, { status: 400 });
      }
      updates.content = body.content;
    }
    if (body.metadata !== undefined) {
      updates.metadata = jsonForDb(body.metadata);
    }

    const [updated] = await db.update(npcLibraryItems)
      .set(updates)
      .where(and(eq(npcLibraryItems.id, itemId), eq(npcLibraryItems.npcId, id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ errorCode: "npc_library_item_not_found", error: "NPC library item not found" }, { status: 404 });
    }

    return NextResponse.json({
      item: {
        ...updated,
        metadata: parseDbJson(updated.metadata) ?? updated.metadata,
      },
    });
  } catch (error) {
    console.error("Failed to update NPC library item:", error);
    return NextResponse.json({ errorCode: "failed_to_update_npc_library_item", error: "Failed to update NPC library item" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const { id, itemId } = await params;
  const access = await verifyNpcOwnership(req, id);
  if (!access.ok) {
    return NextResponse.json({ errorCode: access.errorCode, error: access.error }, { status: access.status });
  }

  try {
    await db.delete(npcLibraryItems).where(and(eq(npcLibraryItems.id, itemId), eq(npcLibraryItems.npcId, id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete NPC library item:", error);
    return NextResponse.json({ errorCode: "failed_to_delete_npc_library_item", error: "Failed to delete NPC library item" }, { status: 500 });
  }
}
