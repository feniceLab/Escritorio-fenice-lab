import { NextRequest, NextResponse } from "next/server";
import type { Dirent } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { desc, eq } from "drizzle-orm";
import { db, channels, isPostgres, jsonForDb, npcMemoryItems, npcs } from "@/db";
import { parseDbJson } from "@/lib/db-json";

const VALID_MEMORY_TYPES = ["fact", "episodic", "summary", "relationship", "working"];
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeText(value: unknown) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function slug(value: unknown) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "npc";
}

function memoryRoot() {
  return process.env.NPC_MEMORY_FILE_ROOT || path.resolve(/* turbopackIgnore: true */ process.cwd(), "..", "agent-memory");
}

function safeLimit(value: string | null, fallback = 50, max = 120) {
  const parsed = Number(value || "");
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(max, Math.floor(parsed));
}

async function verifyNpcToken(req: NextRequest, npcId: string) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token || !npcId) {
    return { ok: false as const, status: 401, errorCode: "unauthorized", error: "Missing token or npcId" };
  }

  const [npc] = await db
    .select({ id: npcs.id, name: npcs.name, channelId: npcs.channelId })
    .from(npcs)
    .where(eq(npcs.id, npcId))
    .limit(1);

  if (!npc?.channelId) {
    return { ok: false as const, status: 404, errorCode: "npc_not_found", error: "NPC not found" };
  }

  const [channel] = await db
    .select({ gatewayConfig: channels.gatewayConfig })
    .from(channels)
    .where(eq(channels.id, npc.channelId))
    .limit(1);

  const gatewayConfig = (parseDbJson(channel?.gatewayConfig) ?? channel?.gatewayConfig) as Record<string, unknown> | null;
  const validToken = typeof gatewayConfig?.libraryToken === "string" ? gatewayConfig.libraryToken : null;
  if (!validToken || token !== validToken) {
    return { ok: false as const, status: 403, errorCode: "forbidden", error: "Invalid token" };
  }

  return { ok: true as const, npc };
}

async function readMemoryFiles(npcName: string, maxFiles = 12) {
  const root = path.join(/* turbopackIgnore: true */ memoryRoot(), slug(npcName));
  const files: Array<{ path: string; preview: string; bytes: number }> = [];

  async function visit(dir: string) {
    if (files.length >= maxFiles) return;
    let entries: Dirent[];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (files.length >= maxFiles) break;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (["raw"].includes(entry.name)) continue;
        await visit(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        const stat = await fs.stat(fullPath).catch(() => null);
        const content = await fs.readFile(fullPath, "utf8").catch(() => "");
        files.push({
          path: path.relative(memoryRoot(), fullPath),
          preview: content.replace(/\s+/g, " ").trim().slice(0, 900),
          bytes: stat?.size || Buffer.byteLength(content),
        });
      }
    }
  }

  await visit(root);
  return files;
}

export async function GET(req: NextRequest) {
  const npcId = req.nextUrl.searchParams.get("npcId") || "";
  const verified = await verifyNpcToken(req, npcId);
  if (!verified.ok) {
    return NextResponse.json({ errorCode: verified.errorCode, error: verified.error }, { status: verified.status });
  }

  const query = req.nextUrl.searchParams.get("q") || "";
  const includeFiles = req.nextUrl.searchParams.get("includeFiles") === "1";
  const limit = safeLimit(req.nextUrl.searchParams.get("limit"));
  const queryNorm = normalizeText(query);

  const rows = await db
    .select()
    .from(npcMemoryItems)
    .where(eq(npcMemoryItems.npcId, npcId))
    .orderBy(desc(npcMemoryItems.pinned), desc(npcMemoryItems.updatedAt))
    .limit(queryNorm ? 200 : limit);

  const memories = rows
    .filter((memory) => {
      if (!queryNorm) return true;
      return normalizeText(`${memory.title}\n${memory.content}\n${JSON.stringify(parseDbJson(memory.metadata) || {})}`).includes(queryNorm);
    })
    .slice(0, limit)
    .map((memory) => ({
      ...memory,
      metadata: parseDbJson(memory.metadata) ?? memory.metadata,
    }));

  const fileMemories = includeFiles ? await readMemoryFiles(verified.npc.name).catch(() => []) : undefined;

  return NextResponse.json({
    ok: true,
    provider: "vps",
    source: "sqlite-local-plus-agent-memory-files",
    npc: verified.npc,
    query: query || null,
    memoryRoot: includeFiles ? memoryRoot() : undefined,
    memories,
    files: fileMemories,
  });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ errorCode: "invalid_json", error: "Invalid JSON" }, { status: 400 });
  }

  const npcId = typeof body.npcId === "string" ? body.npcId.trim() : "";
  const verified = await verifyNpcToken(req, npcId);
  if (!verified.ok) {
    return NextResponse.json({ errorCode: verified.errorCode, error: verified.error }, { status: verified.status });
  }

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

  for (const raw of rawMemories.slice(0, 30)) {
    const item = raw as Record<string, unknown>;
    const memoryType = typeof item.memoryType === "string" && VALID_MEMORY_TYPES.includes(item.memoryType)
      ? item.memoryType
      : "fact";
    const title = typeof item.title === "string" ? item.title.trim().slice(0, 200) : "";
    const content = typeof item.content === "string" ? item.content.trim().slice(0, 6000) : "";

    if (!title || !content) {
      errors.push("Skipped: missing title or content");
      continue;
    }

    try {
      const [inserted] = await db.insert(npcMemoryItems).values({
        npcId,
        memoryType,
        title,
        content,
        metadata: jsonForDb({
          ...(item.metadata && typeof item.metadata === "object" ? item.metadata as Record<string, unknown> : {}),
          provider: "vps",
          source: typeof item.source === "string" ? item.source : "vps-memory-api",
          automatic: Boolean(item.automatic),
        }),
        pinned: Boolean(item.pinned),
        sortOrder: typeof item.sortOrder === "number" ? item.sortOrder : 0,
        createdAt: now as unknown as Date,
        updatedAt: now as unknown as Date,
      }).returning({ id: npcMemoryItems.id });
      saved.push(inserted.id);
    } catch (error) {
      errors.push(`DB error: ${String(error).slice(0, 160)}`);
    }
  }

  return NextResponse.json({
    ok: true,
    provider: "vps",
    saved: saved.length,
    ids: saved,
    errors: errors.length ? errors : undefined,
  }, { status: 201 });
}
