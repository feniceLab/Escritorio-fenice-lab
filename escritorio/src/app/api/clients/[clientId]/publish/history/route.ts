// src/app/api/clients/[clientId]/publish/history/route.ts
// Histórico de publicações de um cliente, paginado.

import { NextRequest, NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { db, officeClients } from "@/db";
import { officeContentPieces, officePublishHistory } from "@/db/schema";
import { getUserId } from "@/lib/internal-rpc";

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const { clientId } = await params;

  const pageRaw = Number(req.nextUrl.searchParams.get("page") ?? "1");
  const limitRaw = Number(req.nextUrl.searchParams.get("limit") ?? "20");
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0
      ? Math.min(Math.floor(limitRaw), 100)
      : 20;
  const offset = (page - 1) * limit;

  try {
    const [client] = await db
      .select({ id: officeClients.id })
      .from(officeClients)
      .where(eq(officeClients.id, clientId))
      .limit(1);
    if (!client) {
      return NextResponse.json({ error: "client_not_found" }, { status: 404 });
    }

    const rows = await db
      .select({
        id: officePublishHistory.id,
        contentPieceId: officePublishHistory.contentPieceId,
        platform: officePublishHistory.platform,
        externalPostId: officePublishHistory.externalPostId,
        status: officePublishHistory.status,
        errorMessage: officePublishHistory.errorMessage,
        publishedAt: officePublishHistory.publishedAt,
        title: officeContentPieces.title,
      })
      .from(officePublishHistory)
      .innerJoin(
        officeContentPieces,
        eq(officePublishHistory.contentPieceId, officeContentPieces.id),
      )
      .where(eq(officeContentPieces.clientId, clientId))
      .orderBy(desc(officePublishHistory.publishedAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(officePublishHistory)
      .innerJoin(
        officeContentPieces,
        eq(officePublishHistory.contentPieceId, officeContentPieces.id),
      )
      .where(eq(officeContentPieces.clientId, clientId));

    return NextResponse.json({
      history: rows,
      pagination: {
        page,
        limit,
        total: Number(count) || 0,
        totalPages: Math.max(1, Math.ceil((Number(count) || 0) / limit)),
      },
    });
  } catch (error) {
    console.error("Failed to list publish history:", error);
    return NextResponse.json(
      { error: "failed_to_list_history" },
      { status: 500 },
    );
  }
}
