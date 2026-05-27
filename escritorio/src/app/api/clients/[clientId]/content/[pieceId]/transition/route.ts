// src/app/api/clients/[clientId]/content/[pieceId]/transition/route.ts
import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, isPostgres } from "@/db";
import { officeContentPieces } from "@/db/schema";
import { getUserId } from "@/lib/internal-rpc";

type Status =
  | "draft"
  | "in_review"
  | "approved"
  | "scheduled"
  | "published"
  | "rejected"
  | "archived";

// State machine: which targets are valid from each source
const TRANSITIONS: Record<Status, Status[]> = {
  draft: ["in_review", "archived"],
  in_review: ["approved", "rejected", "draft"],
  approved: ["scheduled", "published", "draft"],
  scheduled: ["published", "approved", "draft"],
  published: ["archived"],
  rejected: ["draft", "archived"],
  archived: ["draft"],
};

function nowForDb() {
  return isPostgres ? new Date() : new Date().toISOString();
}

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string; pieceId: string }> },
) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const { clientId, pieceId } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const target = typeof body.to === "string" ? (body.to as Status) : null;
  if (!target || !(target in TRANSITIONS)) {
    return NextResponse.json(
      { error: "invalid_target_status" },
      { status: 400 },
    );
  }

  const note = typeof body.note === "string" ? body.note.trim() : null;

  try {
    const [piece] = await db
      .select()
      .from(officeContentPieces)
      .where(
        and(
          eq(officeContentPieces.id, pieceId),
          eq(officeContentPieces.clientId, clientId),
        ),
      )
      .limit(1);

    if (!piece) {
      return NextResponse.json({ error: "piece_not_found" }, { status: 404 });
    }

    const current = piece.status as Status;
    const allowed = TRANSITIONS[current] ?? [];
    if (!allowed.includes(target)) {
      return NextResponse.json(
        {
          error: "invalid_transition",
          from: current,
          to: target,
          allowed,
        },
        { status: 409 },
      );
    }

    const updates: Record<string, unknown> = {
      status: target,
      updatedAt: nowForDb(),
    };

    if (target === "approved") {
      updates.approvedBy = userId;
      updates.approvedAt = nowForDb();
    }

    if (target === "scheduled") {
      if (!piece.scheduledAt) {
        return NextResponse.json(
          { error: "scheduled_at_required" },
          { status: 400 },
        );
      }
    }

    if (target === "published") {
      updates.publishedAt = nowForDb();
    }

    if (target === "rejected" || target === "draft") {
      if (note) updates.revisionNote = note;
    }

    const [updated] = await db
      .update(officeContentPieces)
      .set(updates as never)
      .where(eq(officeContentPieces.id, pieceId))
      .returning();

    return NextResponse.json({ piece: updated });
  } catch (error) {
    console.error("Failed to transition content piece:", error);
    return NextResponse.json(
      { error: "failed_to_transition_content_piece" },
      { status: 500 },
    );
  }
}
