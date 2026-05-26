import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, npcLibraryItems, isPostgres, jsonForDb } from "@/db";
import { parseDbJson } from "@/lib/db-json";
import { verifyNpcOwnership } from "@/lib/npc-route-access";

const MAX_CONTENT_SIZE = 2 * 1024 * 1024;
const VALID_LAYERS = ["knowledge", "examples", "rules", "media", "outputs", "memory-sources"];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await verifyNpcOwnership(req, id);
  if (!access.ok) {
    return NextResponse.json({ errorCode: access.errorCode, error: access.error }, { status: access.status });
  }

  try {
    const rows = await db
      .select()
      .from(npcLibraryItems)
      .where(eq(npcLibraryItems.npcId, id))
      .orderBy(npcLibraryItems.sortOrder, npcLibraryItems.createdAt);

    const items = rows.map((row) => ({
      ...row,
      metadata: parseDbJson(row.metadata) ?? row.metadata,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Failed to load NPC library:", error);
    return NextResponse.json({ errorCode: "failed_to_load_npc_library", error: "Failed to load NPC library" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await verifyNpcOwnership(req, id);
  if (!access.ok) {
    return NextResponse.json({ errorCode: access.errorCode, error: access.error }, { status: access.status });
  }

  try {
    const body = await req.json();
    const layer = typeof body.layer === "string" ? body.layer.trim() : "";
    const category = typeof body.category === "string" ? body.category.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const content = typeof body.content === "string" ? body.content : null;

    if (!VALID_LAYERS.includes(layer) || !category || !name) {
      return NextResponse.json({ errorCode: "invalid_library_item", error: "Invalid NPC library item" }, { status: 400 });
    }

    if (content && content.length > MAX_CONTENT_SIZE) {
      return NextResponse.json({ errorCode: "content_too_large", error: "Content too large (max 2MB)" }, { status: 400 });
    }

    const now = isPostgres ? new Date() : new Date().toISOString();
    const [item] = await db.insert(npcLibraryItems).values({
      npcId: id,
      layer,
      category,
      name,
      content,
      metadata: body.metadata ? jsonForDb(body.metadata) : null,
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
      createdAt: now as unknown as Date,
      updatedAt: now as unknown as Date,
    }).returning();

    return NextResponse.json({
      item: {
        ...item,
        metadata: parseDbJson(item.metadata) ?? item.metadata,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to create NPC library item:", error);
    if (String(error).includes("UNIQUE constraint") || String(error).includes("unique")) {
      return NextResponse.json({ errorCode: "duplicate_library_item", error: "Item with this name already exists" }, { status: 409 });
    }
    return NextResponse.json({ errorCode: "failed_to_create_npc_library_item", error: "Failed to create NPC library item" }, { status: 500 });
  }
}
