import { db, channelLibraryItems, channels, isPostgres, jsonForDb } from "@/db";
import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getUserId } from "@/lib/internal-rpc";
import { parseDbJson } from "@/lib/db-json";
import { syncChannelApiKeysToNpcs } from "@/lib/library-sync";

const MAX_CONTENT_SIZE = 2 * 1024 * 1024;

async function isNpcTokenAuthorized(req: NextRequest, channelId: string): Promise<boolean> {
  const token = req.headers.get("x-library-token");
  if (!token) return false;
  try {
    const [ch] = await db.select({ gatewayConfig: channels.gatewayConfig }).from(channels).where(eq(channels.id, channelId)).limit(1);
    if (!ch) return false;
    const config = (typeof ch.gatewayConfig === "string" ? parseDbJson(ch.gatewayConfig) : ch.gatewayConfig) as Record<string, unknown> | null;
    return config?.libraryToken === token;
  } catch { return false; }
}

// PUT /api/channels/:id/library/:itemId — update a library item
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const { id, itemId } = await params;
  const userId = getUserId(req);
  const npcAuthorized = await isNpcTokenAuthorized(req, id);
  if (!userId && !npcAuthorized) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    if (!npcAuthorized) {
      const [ch] = await db.select({ ownerId: channels.ownerId }).from(channels).where(eq(channels.id, id)).limit(1);
      if (!ch) return NextResponse.json({ error: "Channel not found" }, { status: 404 });
      if (ch.ownerId !== userId) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await req.json();
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.content !== undefined) {
      if (body.content && body.content.length > MAX_CONTENT_SIZE) {
        return NextResponse.json({ error: "Content too large (max 2MB)" }, { status: 400 });
      }
      updates.content = body.content;
    }
    if (body.metadata !== undefined) updates.metadata = jsonForDb(body.metadata);
    if (body.category !== undefined) updates.category = body.category;
    if (body.sortOrder !== undefined) updates.sortOrder = body.sortOrder;

    updates.updatedAt = (isPostgres ? new Date() : new Date().toISOString()) as unknown as Date;

    const [updated] = await db
      .update(channelLibraryItems)
      .set(updates)
      .where(and(eq(channelLibraryItems.id, itemId), eq(channelLibraryItems.channelId, id)))
      .returning();

    if (!updated) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    if ((updated as Record<string, unknown>).layer === "api") {
      syncChannelApiKeysToNpcs(id).catch(() => {});
    }

    return NextResponse.json({ item: updated });
  } catch (err) {
    console.error("Failed to update library item:", err);
    return NextResponse.json({ error: "Failed to update library item" }, { status: 500 });
  }
}

// DELETE /api/channels/:id/library/:itemId — delete a library item
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const { id, itemId } = await params;
  const userId = getUserId(req);
  const npcAuthorized = await isNpcTokenAuthorized(req, id);
  if (!userId && !npcAuthorized) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    if (!npcAuthorized) {
      const [ch] = await db.select({ ownerId: channels.ownerId }).from(channels).where(eq(channels.id, id)).limit(1);
      if (!ch) return NextResponse.json({ error: "Channel not found" }, { status: 404 });
      if (ch.ownerId !== userId) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Check if it's an API item before deleting
    const [existing] = await db
      .select({ layer: channelLibraryItems.layer })
      .from(channelLibraryItems)
      .where(and(eq(channelLibraryItems.id, itemId), eq(channelLibraryItems.channelId, id)))
      .limit(1);

    await db
      .delete(channelLibraryItems)
      .where(and(eq(channelLibraryItems.id, itemId), eq(channelLibraryItems.channelId, id)));

    if (existing?.layer === "api") {
      syncChannelApiKeysToNpcs(id).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete library item:", err);
    return NextResponse.json({ error: "Failed to delete library item" }, { status: 500 });
  }
}
