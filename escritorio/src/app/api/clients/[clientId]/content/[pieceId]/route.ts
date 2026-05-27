// src/app/api/clients/[clientId]/content/[pieceId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, isPostgres, jsonForDb } from "@/db";
import { officeContentPieces } from "@/db/schema";
import { getUserId } from "@/lib/internal-rpc";

const ALLOWED_PLATFORMS = new Set(["instagram", "facebook", "both"]);
const ALLOWED_STATUSES = new Set([
  "draft",
  "in_review",
  "approved",
  "scheduled",
  "published",
  "rejected",
  "archived",
]);

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

function nowForDb() {
  return isPostgres ? new Date() : new Date().toISOString();
}

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  if (typeof value !== "string") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string; pieceId: string }> },
) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const { clientId, pieceId } = await params;

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

    return NextResponse.json({ piece });
  } catch (error) {
    console.error("Failed to load content piece:", error);
    return NextResponse.json(
      { error: "failed_to_load_content_piece" },
      { status: 500 },
    );
  }
}

export async function PATCH(
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

  const updates: Record<string, unknown> = {};

  if (typeof body.title === "string") {
    const t = body.title.trim();
    if (!t) return NextResponse.json({ error: "title_required" }, { status: 400 });
    if (t.length > 200) {
      return NextResponse.json({ error: "title_too_long" }, { status: 400 });
    }
    updates.title = t;
  }

  if (body.caption !== undefined) {
    updates.caption =
      typeof body.caption === "string" ? body.caption.trim() : null;
  }

  if (Array.isArray(body.mediaUrls)) {
    const urls = body.mediaUrls.filter(
      (u): u is string => typeof u === "string" && u.trim().length > 0,
    );
    updates.mediaUrls = jsonForDb(urls);
  }

  if (typeof body.platform === "string" && ALLOWED_PLATFORMS.has(body.platform)) {
    updates.platform = body.platform;
  }

  if (typeof body.status === "string" && ALLOWED_STATUSES.has(body.status)) {
    updates.status = body.status;
  }

  if (body.scheduledAt !== undefined) {
    const d = parseDate(body.scheduledAt);
    updates.scheduledAt = d ?? null;
  }

  if (body.revisionNote !== undefined) {
    updates.revisionNote =
      typeof body.revisionNote === "string" ? body.revisionNote : null;
  }

  if (body.npcId !== undefined) {
    updates.npcId =
      typeof body.npcId === "string" && body.npcId ? body.npcId : null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "no_fields_to_update" }, { status: 400 });
  }

  updates.updatedAt = nowForDb();

  try {
    const [existing] = await db
      .select({ id: officeContentPieces.id })
      .from(officeContentPieces)
      .where(
        and(
          eq(officeContentPieces.id, pieceId),
          eq(officeContentPieces.clientId, clientId),
        ),
      )
      .limit(1);
    if (!existing) {
      return NextResponse.json({ error: "piece_not_found" }, { status: 404 });
    }

    const [updated] = await db
      .update(officeContentPieces)
      .set(updates as never)
      .where(eq(officeContentPieces.id, pieceId))
      .returning();

    return NextResponse.json({ piece: updated });
  } catch (error) {
    console.error("Failed to update content piece:", error);
    return NextResponse.json(
      { error: "failed_to_update_content_piece" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string; pieceId: string }> },
) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const { clientId, pieceId } = await params;

  try {
    const [existing] = await db
      .select({ id: officeContentPieces.id, status: officeContentPieces.status })
      .from(officeContentPieces)
      .where(
        and(
          eq(officeContentPieces.id, pieceId),
          eq(officeContentPieces.clientId, clientId),
        ),
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "piece_not_found" }, { status: 404 });
    }

    if (existing.status === "published") {
      return NextResponse.json(
        { error: "cannot_delete_published_piece" },
        { status: 409 },
      );
    }

    await db
      .delete(officeContentPieces)
      .where(eq(officeContentPieces.id, pieceId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete content piece:", error);
    return NextResponse.json(
      { error: "failed_to_delete_content_piece" },
      { status: 500 },
    );
  }
}
