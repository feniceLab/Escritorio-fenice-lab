// src/app/api/clients/[clientId]/content/route.ts
import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, officeClients, isPostgres, jsonForDb } from "@/db";
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

function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 });
}

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  if (typeof value !== "string") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function nowForDb() {
  return isPostgres ? new Date() : new Date().toISOString();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const { clientId } = await params;

  try {
    const [client] = await db
      .select({ id: officeClients.id })
      .from(officeClients)
      .where(eq(officeClients.id, clientId))
      .limit(1);

    if (!client) {
      return NextResponse.json({ error: "client_not_found" }, { status: 404 });
    }

    const statusFilter = req.nextUrl.searchParams.get("status");
    const platformFilter = req.nextUrl.searchParams.get("platform");
    const limitParam = Number(req.nextUrl.searchParams.get("limit") ?? "100");
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(limitParam, 1), 200)
      : 100;

    const conditions = [eq(officeContentPieces.clientId, clientId)];
    if (statusFilter && ALLOWED_STATUSES.has(statusFilter)) {
      conditions.push(eq(officeContentPieces.status, statusFilter));
    }
    if (platformFilter && ALLOWED_PLATFORMS.has(platformFilter)) {
      conditions.push(eq(officeContentPieces.platform, platformFilter));
    }

    const rows = await db
      .select()
      .from(officeContentPieces)
      .where(and(...conditions))
      .orderBy(desc(officeContentPieces.updatedAt))
      .limit(limit);

    return NextResponse.json({ pieces: rows });
  } catch (error) {
    console.error("Failed to list content pieces:", error);
    return NextResponse.json(
      { error: "failed_to_list_content_pieces" },
      { status: 500 },
    );
  }
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

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return badRequest("title_required");
  if (title.length > 200) return badRequest("title_too_long");

  const caption =
    typeof body.caption === "string" ? body.caption.trim() : null;

  const mediaUrls = Array.isArray(body.mediaUrls)
    ? body.mediaUrls.filter((u): u is string => typeof u === "string" && u.trim().length > 0)
    : [];

  const platform =
    typeof body.platform === "string" && ALLOWED_PLATFORMS.has(body.platform)
      ? body.platform
      : "both";

  const status =
    typeof body.status === "string" && ALLOWED_STATUSES.has(body.status)
      ? body.status
      : "draft";

  const scheduledAt = parseDate(body.scheduledAt);
  const npcId = typeof body.npcId === "string" && body.npcId ? body.npcId : null;

  try {
    const [client] = await db
      .select({ id: officeClients.id })
      .from(officeClients)
      .where(eq(officeClients.id, clientId))
      .limit(1);
    if (!client) {
      return NextResponse.json({ error: "client_not_found" }, { status: 404 });
    }

    const [inserted] = await db
      .insert(officeContentPieces)
      .values({
        clientId,
        title,
        caption,
        mediaUrls: jsonForDb(mediaUrls) as never,
        platform,
        status,
        scheduledAt: scheduledAt ?? undefined,
        createdBy: userId,
        npcId: npcId ?? undefined,
        createdAt: nowForDb() as never,
        updatedAt: nowForDb() as never,
      })
      .returning();

    return NextResponse.json({ piece: inserted }, { status: 201 });
  } catch (error) {
    console.error("Failed to create content piece:", error);
    return NextResponse.json(
      { error: "failed_to_create_content_piece" },
      { status: 500 },
    );
  }
}
