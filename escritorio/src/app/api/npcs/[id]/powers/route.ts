import { NextRequest, NextResponse } from "next/server";
import { db, jsonForDb } from "@/db";
import { npcs, channels } from "@/db";
import { eq } from "drizzle-orm";
import { getUserId } from "@/lib/internal-rpc";
import { parseDbObject } from "@/lib/db-json";

async function verifyNpcOwnership(req: NextRequest, npcId: string) {
  const userId = getUserId(req);
  if (!userId) return { errorCode: "unauthorized", error: "Unauthorized", status: 401 };

  const [npc] = await db.select().from(npcs).where(eq(npcs.id, npcId));
  if (!npc) return { errorCode: "npc_not_found", error: "NPC not found", status: 404 };

  const [channel] = await db.select().from(channels).where(eq(channels.id, npc.channelId));
  if (!channel || channel.ownerId !== userId) {
    return { errorCode: "only_channel_owner_can_modify_npcs", error: "Only channel owner can modify NPCs", status: 403 };
  }

  return { npc, channel, userId };
}

// GET /api/npcs/:id/powers — get NPC powers config
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await verifyNpcOwnership(req, id);
  if ("status" in result) {
    return NextResponse.json({ errorCode: result.errorCode, error: result.error }, { status: result.status });
  }

  const oc = parseDbObject(result.npc.openclawConfig) || {};
  const powers = oc.powers && typeof oc.powers === "object" ? oc.powers : null;

  return NextResponse.json({
    powers: powers || {
      allowedTools: [],
      envVars: {},
      mcpServers: [],
      maxTurns: 25,
      timeoutMs: 180000,
    },
  });
}

// PUT /api/npcs/:id/powers — update NPC powers config
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await verifyNpcOwnership(req, id);
  if ("status" in result) {
    return NextResponse.json({ errorCode: result.errorCode, error: result.error }, { status: result.status });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ errorCode: "invalid_json", error: "Invalid JSON" }, { status: 400 });
  }

  const oc = parseDbObject(result.npc.openclawConfig) || {};

  // Validate and sanitize powers
  const newPowers: Record<string, unknown> = {};

  if (Array.isArray(body.allowedTools)) {
    newPowers.allowedTools = body.allowedTools.filter((t: unknown) => typeof t === "string");
  }

  if (body.envVars && typeof body.envVars === "object" && !Array.isArray(body.envVars)) {
    const sanitized: Record<string, string> = {};
    for (const [key, value] of Object.entries(body.envVars as Record<string, unknown>)) {
      if (typeof key === "string" && typeof value === "string" && key.length <= 100 && value.length <= 20000) {
        sanitized[key] = value;
      }
    }
    newPowers.envVars = sanitized;
  }

  if (Array.isArray(body.mcpServers)) {
    newPowers.mcpServers = (body.mcpServers as Record<string, unknown>[])
      .filter((s) => s && typeof s === "object" && typeof s.name === "string")
      .slice(0, 10) // max 10 MCP servers per NPC
      .map((s) => ({
        name: String(s.name),
        command: typeof s.command === "string" ? s.command : "npx",
        args: Array.isArray(s.args) ? (s.args as unknown[]).filter((a): a is string => typeof a === "string") : [],
        env: s.env && typeof s.env === "object" && !Array.isArray(s.env)
          ? Object.fromEntries(
              Object.entries(s.env as Record<string, unknown>)
                .filter(([k, v]) => typeof k === "string" && typeof v === "string")
            )
          : undefined,
      }));
  }

  if (typeof body.maxTurns === "number" && body.maxTurns >= 1 && body.maxTurns <= 100) {
    newPowers.maxTurns = Math.floor(body.maxTurns);
  }

  if (typeof body.timeoutMs === "number" && body.timeoutMs >= 10000 && body.timeoutMs <= 600000) {
    newPowers.timeoutMs = Math.floor(body.timeoutMs);
  }

  if (Array.isArray(body.sandboxPaths)) {
    newPowers.sandboxPaths = (body.sandboxPaths as unknown[]).filter((s): s is string => typeof s === "string").slice(0, 10);
  }

  // Merge into existing openclawConfig
  const updatedOc = { ...oc, powers: newPowers };

  await db
    .update(npcs)
    .set({ openclawConfig: jsonForDb(updatedOc) })
    .where(eq(npcs.id, id));

  return NextResponse.json({ powers: newPowers });
}
