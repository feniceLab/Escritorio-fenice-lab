import { NextRequest, NextResponse } from "next/server";
import { db, npcLibraryItems, channels, isPostgres, jsonForDb } from "@/db";
import { eq } from "drizzle-orm";
import { npcs } from "@/db";

/**
 * POST /api/internal/npc-output
 *
 * Endpoint interno chamado pelo próprio NPC via WebFetch tool.
 * Permite que o NPC salve artefatos que criou (PDFs, imagens, vídeos, textos)
 * na sua biblioteca pessoal (layer: "outputs").
 *
 * Auth via DESKRPG_LIBRARY_TOKEN (injetado como env var no agente).
 *
 * Body: {
 *   npcId: string,
 *   title: string,               // nome do arquivo/relatório
 *   fileType: "pdf"|"image"|"video"|"text"|"spreadsheet"|"code"|"other",
 *   url?: string,                // URL pública do arquivo (se hospedado externamente)
 *   content?: string,            // conteúdo textual (se não houver URL)
 *   description?: string,        // breve descrição do que é este arquivo
 *   clientName?: string,         // cliente relacionado (opcional)
 *   tags?: string[],             // tags para busca (opcional)
 * }
 */

const VALID_FILE_TYPES = ["pdf", "image", "video", "text", "spreadsheet", "code", "other"] as const;

export async function POST(req: NextRequest) {
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

  const title = typeof body.title === "string" ? body.title.trim().slice(0, 200) : "";
  if (!title) {
    return NextResponse.json({ errorCode: "missing_title", error: "title required" }, { status: 400 });
  }

  const rawFileType = typeof body.fileType === "string" ? body.fileType.trim() : "other";
  const fileType = (VALID_FILE_TYPES as readonly string[]).includes(rawFileType) ? rawFileType : "other";

  // Verify NPC exists + token matches channel's library token
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

  const url = typeof body.url === "string" ? body.url.trim().slice(0, 2000) : null;
  const content = typeof body.content === "string" ? body.content.trim().slice(0, 50000) : null;
  const description = typeof body.description === "string" ? body.description.trim().slice(0, 500) : null;
  const clientName = typeof body.clientName === "string" ? body.clientName.trim().slice(0, 100) : null;
  const tags = Array.isArray(body.tags)
    ? (body.tags as unknown[]).filter((t): t is string => typeof t === "string").slice(0, 10)
    : [];

  const metadata = {
    fileType,
    ...(url ? { url } : {}),
    ...(description ? { description } : {}),
    ...(clientName ? { clientName } : {}),
    ...(tags.length > 0 ? { tags } : {}),
    savedByNpc: true,
    savedAt: new Date().toISOString(),
  };

  const now = isPostgres ? new Date() : new Date().toISOString();

  // Use a unique name based on title + timestamp to avoid uniqueness constraint conflicts
  const uniqueName = `${title} [${new Date().toISOString().slice(0, 16).replace("T", " ")}]`;

  try {
    const [item] = await db.insert(npcLibraryItems).values({
      npcId,
      layer: "outputs",
      category: fileType,
      name: uniqueName,
      content,
      metadata: jsonForDb(metadata),
      sortOrder: 0,
      createdAt: now as unknown as Date,
      updatedAt: now as unknown as Date,
    }).returning({ id: npcLibraryItems.id, name: npcLibraryItems.name });

    return NextResponse.json({
      ok: true,
      id: item.id,
      name: item.name,
      message: `Artefato "${title}" salvo na biblioteca (${fileType})`,
    }, { status: 201 });
  } catch (err) {
    const msg = String(err);
    if (msg.includes("UNIQUE constraint") || msg.includes("unique")) {
      return NextResponse.json({ errorCode: "duplicate", error: "Item with this name already exists" }, { status: 409 });
    }
    console.error("[npc-output] DB error:", err);
    return NextResponse.json({ errorCode: "db_error", error: "Failed to save output" }, { status: 500 });
  }
}

/**
 * GET /api/internal/npc-output?npcId=...
 * Permite o NPC listar seus próprios artefatos salvos.
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
  const outputs = await db.select()
    .from(npcLibraryItems)
    .where(eq(npcLibraryItems.npcId, npcId))
    .orderBy(desc(npcLibraryItems.createdAt))
    .limit(50);

  const filtered = outputs.filter((o) => o.layer === "outputs");

  return NextResponse.json({ outputs: filtered });
}
