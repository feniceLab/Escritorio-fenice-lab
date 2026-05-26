import { NextRequest, NextResponse } from "next/server";
import {
  enqueueNpcAutomation,
  getNpcAutomationRuntimeInfo,
  listNpcAutomationState,
  processPendingNpcAutomations,
} from "@/lib/npc-automation";
import { channels, db, npcs } from "@/db";
import { eq } from "drizzle-orm";

function getLimit(req: NextRequest, fallback = 50) {
  const raw = Number(req.nextUrl.searchParams.get("limit"));
  return Number.isFinite(raw) ? raw : fallback;
}

function parseGatewayConfig(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  if (typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed as Record<string, unknown>
        : null;
    } catch {
      return null;
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ errorCode: "unauthorized", error: "Unauthorized" }, { status: 401 });
  }

  const jobs = await listNpcAutomationState({
    channelId: req.nextUrl.searchParams.get("channelId"),
    npcId: req.nextUrl.searchParams.get("npcId"),
    status: req.nextUrl.searchParams.get("status"),
    limit: getLimit(req),
  });

  return NextResponse.json({ jobs, runtime: getNpcAutomationRuntimeInfo() });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let userId = req.headers.get("x-user-id");
    if (!userId) {
      const auth = req.headers.get("authorization") || "";
      const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
      const npcId = typeof body?.npcId === "string" ? body.npcId.trim() : "";

      if (!token || !npcId) {
        return NextResponse.json({ errorCode: "unauthorized", error: "Unauthorized" }, { status: 401 });
      }

      const [npc] = await db.select({ channelId: npcs.channelId }).from(npcs).where(eq(npcs.id, npcId)).limit(1);
      if (!npc?.channelId) {
        return NextResponse.json({ errorCode: "npc_not_found", error: "NPC not found" }, { status: 404 });
      }

      const [channel] = await db
        .select({ gatewayConfig: channels.gatewayConfig })
        .from(channels)
        .where(eq(channels.id, npc.channelId))
        .limit(1);
      const gatewayConfig = parseGatewayConfig(channel?.gatewayConfig);
      const validToken = typeof gatewayConfig?.libraryToken === "string" ? gatewayConfig.libraryToken : null;
      if (!validToken || token !== validToken) {
        return NextResponse.json({ errorCode: "forbidden", error: "Invalid token" }, { status: 403 });
      }
      userId = null;
    }

    const job = await enqueueNpcAutomation({
      type: body?.type,
      channelId: body?.channelId ?? null,
      npcId: body?.npcId ?? null,
      createdByUserId: userId,
      payload: body?.payload ?? {},
      runAfter: body?.runAfter ?? null,
      maxAttempts: body?.maxAttempts,
    });

    const processed = body?.processNow ? await processPendingNpcAutomations(1) : [];
    return NextResponse.json({ job, processed }, { status: 201 });
  } catch (error) {
    console.error("[npc-automation] enqueue failed:", error);
    return NextResponse.json(
      { errorCode: "failed_to_enqueue_automation", error: String(error) },
      { status: 400 },
    );
  }
}
