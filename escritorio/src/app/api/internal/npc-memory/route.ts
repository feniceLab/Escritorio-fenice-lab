import { NextRequest, NextResponse } from "next/server";
import { db, npcMemoryItems, channels, isPostgres, jsonForDb } from "@/db";
import { eq } from "drizzle-orm";
import { npcs } from "@/db";

/**
 * POST /api/internal/npc-memory
 *
 * Endpoint interno chamado pelo próprio NPC via WebFetch tool dentro do Claude Code gateway.
 * Autentica via DESKRPG_LIBRARY_TOKEN (injetado como env var no agente).
 *
 * Headers: Authorization: Bearer <DESKRPG_LIBRARY_TOKEN>
 * Body: {
 *   npcId: string,
 *   memories: Array<{ memoryType, title, content, pinned? }>
 * }
 */

const VALID_MEMORY_TYPES = ["fact", "episodic", "summary", "relationship", "working"];

export async function POST(req: NextRequest) {
  // Auth via library token (same token injected into gateway env vars)
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";

  if (!token) {
    return NextResponse.json({ errorCode: "unauthorized", error: "Missing token" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ errorCode: "invalid_json", error: "Invalid JSON" }, { status: 400 });
  }

  const npcId = typeof body.npcId === "string" ? body.npcId.trim() : "";
  if (!npcId) {
    return NextResponse.json({ errorCode: "missing_npc_id", error: "npcId required" }, { status: 400 });
  }

  // Verify NPC exists + token matches the channel's library token
  const [npc] = await db.select({ channelId: npcs.channelId }).from(npcs).where(eq(npcs.id, npcId)).limit(1);
  if (!npc?.channelId) {
    return NextResponse.json({ errorCode: "npc_not_found", error: "NPC not found" }, { status: 404 });
  }

  const [ch] = await db.select({ gatewayConfig: channels.gatewayConfig }).from(channels).where(eq(channels.id, npc.channelId)).limit(1);
  const gwConfig = ch?.gatewayConfig as Record<string, unknown> | null;
  const validToken = typeof gwConfig?.libraryToken === "string" ? gwConfig.libraryToken : null;

  if (!validToken || token !== validToken) {
    return NextResponse.json({ errorCode: "forbidden", error: "Invalid token" }, { status: 403 });
  }

  // Accept array or single memory
  const rawMemories = Array.isArray(body.memories)
    ? body.memories
    : body.memoryType
      ? [body]
      : [];

  if (rawMemories.length === 0) {
    return NextResponse.json({ errorCode: "no_memories", error: "No memories to save" }, { status: 400 });
  }

  const now = isPostgres ? new Date() : new Date().toISOString();
  const saved: string[] = [];
  const errors: string[] = [];

  for (const raw of rawMemories.slice(0, 20)) {
    const r = raw as Record<string, unknown>;
    const memoryType = typeof r.memoryType === "string" && VALID_MEMORY_TYPES.includes(r.memoryType) ? r.memoryType : "fact";
    const title = typeof r.title === "string" ? r.title.trim().slice(0, 200) : "";
    const content = typeof r.content === "string" ? r.content.trim().slice(0, 4000) : "";

    if (!title || !content) {
      errors.push(`Skipped: missing title or content`);
      continue;
    }

    try {
      const [inserted] = await db.insert(npcMemoryItems).values({
        npcId,
        memoryType,
        title,
        content,
        metadata: r.metadata ? jsonForDb(r.metadata as Record<string, unknown>) : null,
        pinned: Boolean(r.pinned),
        sortOrder: typeof r.sortOrder === "number" ? r.sortOrder : 0,
        createdAt: now as unknown as Date,
        updatedAt: now as unknown as Date,
      }).returning({ id: npcMemoryItems.id });
      saved.push(inserted.id);
    } catch (err) {
      errors.push(`DB error: ${String(err).slice(0, 100)}`);
    }
  }

  return NextResponse.json({
    ok: true,
    saved: saved.length,
    errors: errors.length > 0 ? errors : undefined,
    ids: saved,
  }, { status: 201 });
}

/**
 * GET /api/internal/npc-memory?npcId=...
 * Permite o NPC ler suas próprias memórias consolidadas para o contexto.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const npcId = req.nextUrl.searchParams.get("npcId") || "";

  if (!token || !npcId) {
    return NextResponse.json({ errorCode: "unauthorized", error: "Missing token or npcId" }, { status: 401 });
  }

  const [npc] = await db.select({ channelId: npcs.channelId }).from(npcs).where(eq(npcs.id, npcId)).limit(1);
  if (!npc?.channelId) {
    return NextResponse.json({ errorCode: "npc_not_found", error: "NPC not found" }, { status: 404 });
  }

  const [ch] = await db.select({ gatewayConfig: channels.gatewayConfig }).from(channels).where(eq(channels.id, npc.channelId)).limit(1);
  const gwConfig = ch?.gatewayConfig as Record<string, unknown> | null;
  const validToken = typeof gwConfig?.libraryToken === "string" ? gwConfig.libraryToken : null;

  if (!validToken || token !== validToken) {
    return NextResponse.json({ errorCode: "forbidden", error: "Invalid token" }, { status: 403 });
  }

  const { desc } = await import("drizzle-orm");
  const memories = await db.select({
    id: npcMemoryItems.id,
    memoryType: npcMemoryItems.memoryType,
    title: npcMemoryItems.title,
    content: npcMemoryItems.content,
    pinned: npcMemoryItems.pinned,
    createdAt: npcMemoryItems.createdAt,
  })
    .from(npcMemoryItems)
    .where(eq(npcMemoryItems.npcId, npcId))
    .orderBy(desc(npcMemoryItems.pinned), desc(npcMemoryItems.createdAt))
    .limit(50);

  return NextResponse.json({ memories });
}
