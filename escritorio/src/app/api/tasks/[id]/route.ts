import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tasks } from "@/db";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ errorCode: "unauthorized", error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const action = body?.action as string | undefined;
    const now = new Date().toISOString();

    const updates: Record<string, unknown> = { updatedAt: now };

    if (action === "approve") {
      updates.approvedAt = now;
      updates.approvedBy = userId;
      updates.status = "complete";
      updates.completedAt = now;
    } else if (action === "complete") {
      updates.status = "complete";
      updates.completedAt = now;
    } else if (action === "cancel") {
      updates.status = "cancelled";
    } else if (action === "reopen") {
      updates.status = "pending";
      updates.completedAt = null;
      updates.approvedAt = null;
      updates.approvedBy = null;
    } else {
      if (typeof body.title === "string") updates.title = body.title.slice(0, 500);
      if (body.summary !== undefined) updates.summary = body.summary;
      if (body.status) updates.status = body.status;
      if (body.recurrence) updates.recurrence = body.recurrence;
      if (body.scheduledTime !== undefined) updates.scheduledTime = body.scheduledTime;
      if (body.scheduledDay !== undefined) updates.scheduledDay = body.scheduledDay;
      if (body.dueAt !== undefined) updates.dueAt = body.dueAt;
      if (body.requiresApproval !== undefined) updates.requiresApproval = Boolean(body.requiresApproval);
    }

    const [row] = await db
      .update(tasks)
      .set(updates)
      .where(eq(tasks.id, id))
      .returning();

    if (!row) {
      return NextResponse.json({ errorCode: "not_found", error: "Task not found" }, { status: 404 });
    }

    const statusLabel = typeof updates.status === "string" ? updates.status : row.status;
    const telegramMessage = `Task de agente atualizada: ${row.title} (${statusLabel})`;
    const telegramManager = (globalThis as {
      telegramManager?: {
        sendOperationalAlert?: (input: { channelId?: string | null; npcId?: string | null; message: string }) => Promise<boolean>;
        sendClientAlert?: (input: { channelId?: string | null; npcId?: string | null; message: string }) => Promise<boolean>;
      };
    }).telegramManager;
    void telegramManager?.sendOperationalAlert?.({ channelId: row.channelId, npcId: row.npcId, message: telegramMessage });
    void telegramManager?.sendClientAlert?.({ channelId: row.channelId, npcId: row.npcId, message: telegramMessage });

    return NextResponse.json(row);
  } catch (err) {
    console.error("[Task PATCH] error:", err);
    return NextResponse.json({ errorCode: "internal_server_error", error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ errorCode: "unauthorized", error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await db.delete(tasks).where(eq(tasks.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Task DELETE] error:", err);
    return NextResponse.json({ errorCode: "internal_server_error", error: "Internal server error" }, { status: 500 });
  }
}
