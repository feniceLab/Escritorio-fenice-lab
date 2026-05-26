import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tasks, npcs } from "@/db";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ errorCode: "unauthorized", error: "Unauthorized" }, { status: 401 });
  }

  const channelId = req.nextUrl.searchParams.get("channelId");
  const npcId = req.nextUrl.searchParams.get("npcId");
  const scope = req.nextUrl.searchParams.get("scope");

  if (!channelId && !npcId && scope !== "overview" && scope !== "agents") {
    return NextResponse.json({ errorCode: "channel_id_required", error: "channelId required" }, { status: 400 });
  }

  try {
    if (scope === "overview" || scope === "agents") {
      const result = await db
        .select({
          id: tasks.id,
          channelId: tasks.channelId,
          npcId: tasks.npcId,
          assignerId: tasks.assignerId,
          assignerNpcId: tasks.assignerNpcId,
          npcTaskId: tasks.npcTaskId,
          title: tasks.title,
          summary: tasks.summary,
          status: tasks.status,
          recurrence: tasks.recurrence,
          scheduledTime: tasks.scheduledTime,
          scheduledDay: tasks.scheduledDay,
          dueAt: tasks.dueAt,
          requiresApproval: tasks.requiresApproval,
          approvedAt: tasks.approvedAt,
          approvedBy: tasks.approvedBy,
          createdAt: tasks.createdAt,
          updatedAt: tasks.updatedAt,
          completedAt: tasks.completedAt,
          npcName: npcs.name,
        })
        .from(tasks)
        .leftJoin(npcs, eq(tasks.npcId, npcs.id))
        .orderBy(desc(tasks.createdAt));

      if (scope === "overview") {
        const doneStatuses = new Set(["complete", "completed", "cancelled"]);
        const done = result.filter((task) => doneStatuses.has(task.status));
        const open = result.filter((task) => !doneStatuses.has(task.status));
        const byStatus = result.reduce<Record<string, number>>((acc, task) => {
          acc[task.status] = (acc[task.status] || 0) + 1;
          return acc;
        }, {});
        const byNpc = result.reduce<Record<string, { total: number; open: number; done: number }>>((acc, task) => {
          const key = task.npcName || task.npcId || "Sem agente";
          if (!acc[key]) acc[key] = { total: 0, open: 0, done: 0 };
          acc[key].total += 1;
          if (doneStatuses.has(task.status)) acc[key].done += 1;
          else acc[key].open += 1;
          return acc;
        }, {});
        const durations = done
          .map((task) => {
            const start = task.createdAt ? new Date(task.createdAt).getTime() : 0;
            const end = task.completedAt ? new Date(task.completedAt).getTime() : 0;
            return start && end && end > start ? end - start : null;
          })
          .filter((value): value is number => Boolean(value));
        return NextResponse.json({
          total: result.length,
          open: open.length,
          done: done.length,
          byStatus,
          byNpc,
          avgCompletionMinutes: durations.length
            ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length / 60000)
            : null,
        });
      }

      return NextResponse.json(result);
    }

    if (npcId) {
      const result = await db
        .select()
        .from(tasks)
        .where(eq(tasks.npcId, npcId))
        .orderBy(desc(tasks.createdAt));
      return NextResponse.json(result);
    }

    const targetChannelId = channelId;
    if (!targetChannelId) {
      return NextResponse.json({ errorCode: "channel_id_required", error: "channelId required" }, { status: 400 });
    }

    const result = await db
      .select({
        id: tasks.id,
        channelId: tasks.channelId,
        npcId: tasks.npcId,
        assignerId: tasks.assignerId,
        assignerNpcId: tasks.assignerNpcId,
        npcTaskId: tasks.npcTaskId,
        title: tasks.title,
        summary: tasks.summary,
        status: tasks.status,
        recurrence: tasks.recurrence,
        scheduledTime: tasks.scheduledTime,
        scheduledDay: tasks.scheduledDay,
        dueAt: tasks.dueAt,
        requiresApproval: tasks.requiresApproval,
        approvedAt: tasks.approvedAt,
        approvedBy: tasks.approvedBy,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        completedAt: tasks.completedAt,
        npcName: npcs.name,
      })
      .from(tasks)
      .leftJoin(npcs, eq(tasks.npcId, npcs.id))
      .where(eq(tasks.channelId, targetChannelId))
      .orderBy(desc(tasks.createdAt));

    return NextResponse.json(result);
  } catch (err) {
    console.error("[Tasks API] Error:", err);
    return NextResponse.json({ errorCode: "internal_server_error", error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ errorCode: "unauthorized", error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      channelId,
      npcId,
      assignerId,
      assignerNpcId,
      title,
      summary,
      recurrence,
      scheduledTime,
      scheduledDay,
      dueAt,
      requiresApproval,
    } = body ?? {};

    if (!channelId || !npcId || !assignerId || !title) {
      return NextResponse.json(
        { errorCode: "missing_fields", error: "channelId, npcId, assignerId, title required" },
        { status: 400 },
      );
    }

    const validRecurrence = ["once", "daily", "weekly", "monthly"];
    const rec = validRecurrence.includes(recurrence) ? recurrence : "once";

    const npcTaskId = `task-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    const [row] = await db
      .insert(tasks)
      .values({
        channelId,
        npcId,
        assignerId,
        assignerNpcId: assignerNpcId || null,
        npcTaskId,
        title: String(title).slice(0, 500),
        summary: summary ? String(summary) : null,
        status: "pending",
        recurrence: rec,
        scheduledTime: scheduledTime || null,
        scheduledDay: typeof scheduledDay === "number" ? scheduledDay : null,
        dueAt: dueAt || null,
        requiresApproval: Boolean(requiresApproval),
      })
      .returning();

    const telegramMessage = `Nova task de agente: ${String(title).slice(0, 160)}`;
    const telegramManager = (globalThis as {
      telegramManager?: {
        sendOperationalAlert?: (input: { channelId?: string | null; npcId?: string | null; message: string }) => Promise<boolean>;
        sendClientAlert?: (input: { channelId?: string | null; npcId?: string | null; message: string }) => Promise<boolean>;
      };
    }).telegramManager;
    void telegramManager?.sendOperationalAlert?.({ channelId, npcId, message: telegramMessage });
    void telegramManager?.sendClientAlert?.({ channelId, npcId, message: telegramMessage });

    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    console.error("[Tasks API] POST error:", err);
    return NextResponse.json({ errorCode: "internal_server_error", error: "Internal server error" }, { status: 500 });
  }
}
