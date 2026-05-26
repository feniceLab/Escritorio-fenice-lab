import { NextRequest, NextResponse } from "next/server";
import { eq, or } from "drizzle-orm";

import { channels, db, npcs } from "@/db";
import { enqueueNpcAutomation, processPendingNpcAutomations } from "@/lib/npc-automation";

function parseConfig(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
    } catch {
      return {};
    }
  }
  return {};
}

async function findOperatorNpc(channelId: string, preferredRole: "gestao" | "relatorios" = "gestao") {
  const rows = await db
    .select({ id: npcs.id, name: npcs.name, openclawConfig: npcs.openclawConfig })
    .from(npcs)
    .where(eq(npcs.channelId, channelId));

  const preferredNeedle = preferredRole === "relatorios" ? "relatorio" : "gerente";
  return rows.find((npc) => {
    const config = parseConfig(npc.openclawConfig);
    const agentId = String(config.agentId || config.agent_id || "");
    const haystack = `${npc.name} ${agentId}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return haystack.includes(preferredNeedle) || haystack.includes("lord") || haystack.includes("lurdinha");
  }) || rows[0] || null;
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ errorCode: "unauthorized", error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const eventType = typeof body?.eventType === "string" ? body.eventType : "";
  const channelId = typeof body?.channelId === "string" ? body.channelId : null;
  const processNow = body?.processNow !== false;

  try {
    const targetChannels = channelId
      ? await db.select({ id: channels.id, name: channels.name }).from(channels).where(eq(channels.id, channelId)).limit(1)
      : await db
          .select({ id: channels.id, name: channels.name })
          .from(channels)
          .where(or(eq(channels.channelType, "standard"), eq(channels.channelType, "client")))
          .limit(100);

    const jobs = [];
    for (const channel of targetChannels) {
      const operator = await findOperatorNpc(channel.id, eventType === "daily_operations_report" ? "relatorios" : "gestao");
      if (!operator) continue;

      if (eventType === "scan_overdue_tasks") {
        jobs.push(await enqueueNpcAutomation({
          type: "scan_overdue_tasks",
          channelId: channel.id,
          npcId: operator.id,
          createdByUserId: userId,
          payload: { channelId: channel.id, title: `Verificar tarefas atrasadas - ${channel.name}` },
        }));
      } else if (eventType === "daily_operations_report") {
        jobs.push(await enqueueNpcAutomation({
          type: "daily_operations_report",
          channelId: channel.id,
          npcId: operator.id,
          createdByUserId: userId,
          payload: {
            channelId: channel.id,
            title: `Resumo diario operacional - ${channel.name}`,
            analysisMode: "daily",
          },
        }));
      } else {
        return NextResponse.json({ errorCode: "unsupported_event_type", error: "Unsupported event type" }, { status: 400 });
      }
    }

    const processed = processNow ? await processPendingNpcAutomations(Math.min(jobs.length || 1, 20)) : [];
    return NextResponse.json({ jobs, processed });
  } catch (error) {
    console.error("[npc-automation] event failed:", error);
    return NextResponse.json(
      { errorCode: "failed_to_process_automation_event", error: String(error) },
      { status: 500 },
    );
  }
}
