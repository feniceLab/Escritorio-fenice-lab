import { db, channelLibraryItems, channels, isPostgres, jsonForDb } from "@/db";
import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getUserId } from "@/lib/internal-rpc";
import { parseDbJson } from "@/lib/db-json";

// POST /api/channels/:id/library/:itemId/approve — approve a creation
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id, itemId } = await params;

  try {
    const [ch] = await db.select({ ownerId: channels.ownerId }).from(channels).where(eq(channels.id, id)).limit(1);
    if (!ch) return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    if (ch.ownerId !== userId) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

    const [item] = await db
      .select()
      .from(channelLibraryItems)
      .where(and(eq(channelLibraryItems.id, itemId), eq(channelLibraryItems.channelId, id)))
      .limit(1);

    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    const existingMeta = (typeof item.metadata === "string" ? parseDbJson(item.metadata) : item.metadata) as Record<string, unknown> ?? {};
    const updatedMeta = {
      ...existingMeta,
      status: "approved",
      approvedAt: new Date().toISOString(),
      approvedBy: userId,
    };

    const now = isPostgres ? new Date() : new Date().toISOString();
    const [updated] = await db
      .update(channelLibraryItems)
      .set({
        metadata: jsonForDb(updatedMeta) as string,
        updatedAt: now as unknown as Date,
      })
      .where(and(eq(channelLibraryItems.id, itemId), eq(channelLibraryItems.channelId, id)))
      .returning();

    return NextResponse.json({ item: updated });
  } catch (err) {
    console.error("Failed to approve library item:", err);
    return NextResponse.json({ error: "Failed to approve" }, { status: 500 });
  }
}

// DELETE /api/channels/:id/library/:itemId/approve — reject a creation
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id, itemId } = await params;

  try {
    const [ch] = await db.select({ ownerId: channels.ownerId }).from(channels).where(eq(channels.id, id)).limit(1);
    if (!ch) return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    if (ch.ownerId !== userId) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

    const [item] = await db
      .select()
      .from(channelLibraryItems)
      .where(and(eq(channelLibraryItems.id, itemId), eq(channelLibraryItems.channelId, id)))
      .limit(1);

    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    const existingMeta = (typeof item.metadata === "string" ? parseDbJson(item.metadata) : item.metadata) as Record<string, unknown> ?? {};
    const updatedMeta = { ...existingMeta, status: "rejected" };

    const now = isPostgres ? new Date() : new Date().toISOString();
    await db
      .update(channelLibraryItems)
      .set({
        metadata: jsonForDb(updatedMeta) as string,
        updatedAt: now as unknown as Date,
      })
      .where(and(eq(channelLibraryItems.id, itemId), eq(channelLibraryItems.channelId, id)));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to reject library item:", err);
    return NextResponse.json({ error: "Failed to reject" }, { status: 500 });
  }
}
