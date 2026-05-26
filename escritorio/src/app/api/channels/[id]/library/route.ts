import { db, channelLibraryItems, channels, isPostgres, jsonForDb } from "@/db";
import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getUserId } from "@/lib/internal-rpc";
import { parseDbJson } from "@/lib/db-json";
import { syncChannelApiKeysToNpcs } from "@/lib/library-sync";

const MAX_CONTENT_SIZE = 2 * 1024 * 1024; // 2MB

/** Check if request is authorized via NPC service token (X-Library-Token header) */
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

// GET /api/channels/:id/library — list all library items grouped by layer
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const rows = await db
      .select()
      .from(channelLibraryItems)
      .where(eq(channelLibraryItems.channelId, id))
      .orderBy(channelLibraryItems.sortOrder, channelLibraryItems.createdAt);

    const items = rows.map((r) => ({
      ...r,
      metadata: parseDbJson(r.metadata) ?? r.metadata,
    }));

    const grouped: Record<string, typeof items> = { design: [], documents: [], api: [] };
    for (const item of items) {
      const layer = item.layer as string;
      if (!grouped[layer]) grouped[layer] = [];
      grouped[layer].push(item);
    }

    return NextResponse.json({ items, grouped });
  } catch (err) {
    console.error("Failed to fetch library:", err);
    return NextResponse.json({ error: "Failed to fetch library" }, { status: 500 });
  }
}

// POST /api/channels/:id/library — create a library item
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Auth: owner session OR NPC service token
  const userId = getUserId(req);
  const npcAuthorized = await isNpcTokenAuthorized(req, id);

  if (!userId && !npcAuthorized) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    if (!npcAuthorized) {
      // Standard ownership check for non-NPC requests
      const [ch] = await db.select({ ownerId: channels.ownerId }).from(channels).where(eq(channels.id, id)).limit(1);
      if (!ch) return NextResponse.json({ error: "Channel not found" }, { status: 404 });
      if (ch.ownerId !== userId) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await req.json();
    const { layer, category, name, content, metadata } = body;

    if (!layer || !category || !name) {
      return NextResponse.json({ error: "layer, category, and name are required" }, { status: 400 });
    }
    if (!["design", "documents", "api", "social", "creations"].includes(layer)) {
      return NextResponse.json({ error: "Invalid layer" }, { status: 400 });
    }
    if (content && content.length > MAX_CONTENT_SIZE) {
      return NextResponse.json({ error: "Content too large (max 2MB)" }, { status: 400 });
    }

    const now = isPostgres ? new Date() : new Date().toISOString();

    const [item] = await db.insert(channelLibraryItems).values({
      channelId: id,
      layer,
      category,
      name: name.trim(),
      content: content ?? null,
      metadata: metadata ? jsonForDb(metadata) : null,
      sortOrder: body.sortOrder ?? 0,
      createdAt: now as unknown as Date,
      updatedAt: now as unknown as Date,
    }).returning();

    // Sync API keys to all NPCs when adding API layer items
    if (layer === "api") {
      syncChannelApiKeysToNpcs(id).catch(() => {});
    }

    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    console.error("Failed to create library item:", err);
    if (String(err).includes("UNIQUE constraint") || String(err).includes("unique")) {
      return NextResponse.json({ error: "Item with this name already exists in this layer/category" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create library item" }, { status: 500 });
  }
}
