// src/app/api/clients/[clientId]/metrics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { officeSocialMetrics, officeClients, officePublishHistory, officeContentPieces } from "@/db/schema";
import { getUserId } from "@/lib/internal-rpc";

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

function getPeriodDates(period: string): { start: Date; end: Date; prevStart: Date; prevEnd: Date } {
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  const prevEnd = new Date(start.getTime());
  const prevStart = new Date(prevEnd.getTime() - days * 24 * 60 * 60 * 1000);
  return { start, end, prevStart, prevEnd };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const { clientId } = await params;

  const [client] = await db
    .select({ id: officeClients.id, name: officeClients.name })
    .from(officeClients)
    .where(eq(officeClients.id, clientId))
    .limit(1);

  if (!client) {
    return NextResponse.json({ error: "cliente não encontrado" }, { status: 404 });
  }

  const period = req.nextUrl.searchParams.get("period") ?? "30d";
  const { start, end, prevStart, prevEnd } = getPeriodDates(period);

  const currentRows = await db
    .select({
      metricName: officeSocialMetrics.metricName,
      total: sql<number>`SUM(${officeSocialMetrics.metricValue})`.as("total"),
    })
    .from(officeSocialMetrics)
    .where(
      and(
        eq(officeSocialMetrics.clientId, clientId),
        gte(officeSocialMetrics.metricDate, start),
        lt(officeSocialMetrics.metricDate, end),
      ),
    )
    .groupBy(officeSocialMetrics.metricName);

  const prevRows = await db
    .select({
      metricName: officeSocialMetrics.metricName,
      total: sql<number>`SUM(${officeSocialMetrics.metricValue})`.as("total"),
    })
    .from(officeSocialMetrics)
    .where(
      and(
        eq(officeSocialMetrics.clientId, clientId),
        gte(officeSocialMetrics.metricDate, prevStart),
        lt(officeSocialMetrics.metricDate, prevEnd),
      ),
    )
    .groupBy(officeSocialMetrics.metricName);

  const prevMap = new Map(prevRows.map((r) => [r.metricName, Number(r.total)]));

  const metrics = currentRows.map((r) => {
    const current = Number(r.total);
    const previous = prevMap.get(r.metricName) ?? 0;
    const change = previous > 0 ? Math.round(((current - previous) / previous) * 100) : 0;
    return { metric: r.metricName, total: current, change };
  });

  const contentPieceIds = await db
    .select({ id: officeContentPieces.id })
    .from(officeContentPieces)
    .where(eq(officeContentPieces.clientId, clientId));

  const pieceIds = contentPieceIds.map((p) => p.id);

  let postsCount = 0;
  if (pieceIds.length > 0) {
    const countResult = await db
      .select({ count: sql<number>`COUNT(*)`.as("count") })
      .from(officePublishHistory)
      .where(
        and(
          sql`${officePublishHistory.contentPieceId} = ANY(${sql.raw(`ARRAY[${pieceIds.map((id) => `'${id}'`).join(",")}]::uuid[]`)})`,
          gte(officePublishHistory.publishedAt, start),
          lt(officePublishHistory.publishedAt, end),
          eq(officePublishHistory.status, "published"),
        ),
      );
    postsCount = Number(countResult[0]?.count ?? 0);
  }

  return NextResponse.json({ metrics, postsCount, period });
}
