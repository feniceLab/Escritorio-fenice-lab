import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, npcs, channels, channelLibraryItems, isPostgres, jsonForDb, npcLibraryItems } from "@/db";

const VALID_PROVIDERS = new Set(["openai"]);

function extractBearer(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  return auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
}

export async function POST(req: NextRequest) {
  const token = extractBearer(req);
  if (!token) return NextResponse.json({ errorCode: "unauthorized", error: "Missing token" }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ errorCode: "invalid_json", error: "Invalid JSON" }, { status: 400 }); }

  const npcId = typeof body.npcId === "string" ? body.npcId.trim() : "";
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const provider = typeof body.provider === "string" ? body.provider.trim() : "openai";
  const saveToChannelLibrary = body.saveToChannelLibrary !== false;
  const alsoSaveToNpcOutputs = body.alsoSaveToNpcOutputs !== false;
  const title = typeof body.title === "string" ? body.title.trim() : "Imagem gerada por NPC";

  if (!npcId || !prompt) return NextResponse.json({ errorCode: "missing_fields", error: "npcId and prompt are required" }, { status: 400 });
  if (!VALID_PROVIDERS.has(provider)) return NextResponse.json({ errorCode: "unsupported_provider", error: "Unsupported provider" }, { status: 400 });

  const [npc] = await db.select({ id: npcs.id, channelId: npcs.channelId, name: npcs.name }).from(npcs).where(eq(npcs.id, npcId)).limit(1);
  if (!npc?.channelId) return NextResponse.json({ errorCode: "npc_not_found", error: "NPC not found" }, { status: 404 });

  const [ch] = await db.select({ gatewayConfig: channels.gatewayConfig }).from(channels).where(eq(channels.id, npc.channelId)).limit(1);
  const gwConfig = (() => {
    const raw = ch?.gatewayConfig;
    if (!raw) return null;
    if (typeof raw === "string") {
      try { return JSON.parse(raw) as Record<string, unknown>; } catch { return null; }
    }
    return raw as Record<string, unknown>;
  })();
  const validToken = typeof gwConfig?.libraryToken === "string" ? gwConfig.libraryToken : null;
  if (!validToken || token !== validToken) return NextResponse.json({ errorCode: "forbidden", error: "Invalid token" }, { status: 403 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ errorCode: "provider_not_configured", error: "OPENAI_API_KEY missing on server" }, { status: 500 });

  const imageResponse = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "gpt-image-1", prompt, size: "1024x1024" }),
  });

  if (!imageResponse.ok) {
    const errText = await imageResponse.text().catch(() => "");
    return NextResponse.json({ errorCode: "image_generation_failed", error: errText || "Image generation failed" }, { status: 502 });
  }

  const imageJson = await imageResponse.json() as { data?: Array<{ b64_json?: string }> };
  const b64 = imageJson.data?.[0]?.b64_json;
  if (!b64) return NextResponse.json({ errorCode: "invalid_provider_response", error: "No image returned by provider" }, { status: 502 });

  const dataUrl = `data:image/png;base64,${b64}`;
  const now = isPostgres ? new Date() : new Date().toISOString();
  const suffix = new Date().toISOString().slice(0, 16).replace("T", " ");
  const saved: Record<string, unknown> = {};

  if (saveToChannelLibrary) {
    const [item] = await db.insert(channelLibraryItems).values({
      channelId: npc.channelId,
      layer: "creations",
      category: "design",
      name: `${title} [${suffix}]`,
      content: dataUrl,
      metadata: jsonForDb({ fileType: "image", source: provider, prompt, creatorNpcId: npc.id, creatorNpcName: npc.name, status: "draft" }),
      sortOrder: 0,
      createdAt: now as unknown as Date,
      updatedAt: now as unknown as Date,
    }).returning({ id: channelLibraryItems.id, name: channelLibraryItems.name });
    saved.channelLibraryItem = item;
  }

  if (alsoSaveToNpcOutputs) {
    const [output] = await db.insert(npcLibraryItems).values({
      npcId: npc.id,
      layer: "outputs",
      category: "image",
      name: `${title} [${suffix}]`,
      content: null,
      metadata: jsonForDb({ fileType: "image", url: dataUrl, prompt, source: provider, savedByNpc: true, savedAt: new Date().toISOString() }),
      sortOrder: 0,
      createdAt: now as unknown as Date,
      updatedAt: now as unknown as Date,
    }).returning({ id: npcLibraryItems.id, name: npcLibraryItems.name });
    saved.npcOutputItem = output;
  }

  return NextResponse.json({ ok: true, provider, title, dataUrl, saved }, { status: 201 });
}
