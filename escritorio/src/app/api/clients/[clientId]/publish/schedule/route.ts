// src/app/api/clients/[clientId]/publish/schedule/route.ts
// Agenda um contentPiece para publicação futura (insere na publish_queue).

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, officeClients, isPostgres } from "@/db";
import { officeContentPieces, officePublishQueue } from "@/db/schema";
import { getUserId } from "@/lib/internal-rpc";

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 });
}

function nowForDb() {
  return isPostgres ? new Date() : new Date().toISOString();
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const { clientId } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("invalid_json");
  }

  const contentPieceId =
    typeof body.contentPieceId === "string" ? body.contentPieceId : null;
  const runAtRaw = typeof body.runAt === "string" ? body.runAt : null;

  if (!contentPieceId) return badRequest("contentPieceId_required");
  if (!runAtRaw) return badRequest("runAt_required");

  const runAt = new Date(runAtRaw);
  if (Number.isNaN(runAt.getTime())) {
    return badRequest("runAt_invalid");
  }

  try {
    const [client] = await db
      .select({ id: officeClients.id })
      .from(officeClients)
      .where(eq(officeClients.id, clientId))
      .limit(1);
    if (!client) {
      return NextResponse.json({ error: "client_not_found" }, { status: 404 });
    }

    const [piece] = await db
      .select()
      .from(officeContentPieces)
      .where(eq(officeContentPieces.id, contentPieceId))
      .limit(1);

    if (!piece || piece.clientId !== clientId) {
      return NextResponse.json(
        { error: "content_piece_not_found" },
        { status: 404 },
      );
    }

    const [queued] = await db
      .insert(officePublishQueue)
      .values({
        contentPieceId,
        runAt: runAt as never,
        status: "pending",
        attempts: 0,
        createdAt: nowForDb() as never,
      })
      .returning();

    const [updated] = await db
      .update(officeContentPieces)
      .set({
        status: "scheduled",
        scheduledAt: runAt as never,
        updatedAt: nowForDb() as never,
      })
      .where(eq(officeContentPieces.id, contentPieceId))
      .returning();

    return NextResponse.json(
      { queued, piece: updated },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to schedule content piece:", error);
    return NextResponse.json(
      { error: "failed_to_schedule" },
      { status: 500 },
    );
  }
}
