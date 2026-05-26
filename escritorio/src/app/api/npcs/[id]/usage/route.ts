import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db, npcs, tokenUsageLogs } from "@/db";
import { verifyNpcOwnership } from "@/lib/npc-route-access";

/**
 * GET /api/npcs/[id]/usage?range=today|7d|30d|all
 *
 * Per-NPC token usage breakdown with operation-type buckets.
 * Returns totals, breakdown by contextKind, breakdown by provider,
 * top tools invoked and recent log entries.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await verifyNpcOwnership(req, id);
  if (!access.ok) {
    return NextResponse.json({ errorCode: access.errorCode, error: access.error }, { status: access.status });
  }

  const rangeParam = req.nextUrl.searchParams.get("range") || "30d";
  const rangeFilter = rangeToSinceIso(rangeParam);

  try {
    const filters = [eq(tokenUsageLogs.npcId, id)];
    if (rangeFilter) filters.push(gte(tokenUsageLogs.createdAt, rangeFilter as unknown as Date));

    // 1. Total across all kinds
    const [totals] = await db
      .select({
        promptTokens: sql<number>`coalesce(sum(${tokenUsageLogs.promptTokens}), 0)`.mapWith(Number),
        completionTokens: sql<number>`coalesce(sum(${tokenUsageLogs.completionTokens}), 0)`.mapWith(Number),
        cost: sql<number>`coalesce(sum(${tokenUsageLogs.estimatedCost}), 0)`.mapWith(Number),
        count: sql<number>`count(*)`.mapWith(Number),
        lastAt: sql<string>`max(${tokenUsageLogs.createdAt})`,
      })
      .from(tokenUsageLogs)
      .where(and(...filters));

    // 2. Breakdown by operation kind
    const kindRows = await db
      .select({
        kind: tokenUsageLogs.contextKind,
        promptTokens: sql<number>`sum(${tokenUsageLogs.promptTokens})`.mapWith(Number),
        completionTokens: sql<number>`sum(${tokenUsageLogs.completionTokens})`.mapWith(Number),
        cost: sql<number>`sum(${tokenUsageLogs.estimatedCost})`.mapWith(Number),
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(tokenUsageLogs)
      .where(and(...filters))
      .groupBy(tokenUsageLogs.contextKind);

    const byKind: Record<string, { tokens: number; cost: number; count: number }> = {};
    for (const row of kindRows) {
      byKind[row.kind] = {
        tokens: (row.promptTokens || 0) + (row.completionTokens || 0),
        cost: row.cost || 0,
        count: row.count || 0,
      };
    }

    // 3. Breakdown by provider
    const providerRows = await db
      .select({
        provider: tokenUsageLogs.provider,
        promptTokens: sql<number>`sum(${tokenUsageLogs.promptTokens})`.mapWith(Number),
        completionTokens: sql<number>`sum(${tokenUsageLogs.completionTokens})`.mapWith(Number),
        cost: sql<number>`sum(${tokenUsageLogs.estimatedCost})`.mapWith(Number),
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(tokenUsageLogs)
      .where(and(...filters))
      .groupBy(tokenUsageLogs.provider);

    const byProvider = providerRows.map((row) => ({
      provider: row.provider || "unknown",
      tokens: (row.promptTokens || 0) + (row.completionTokens || 0),
      cost: row.cost || 0,
      count: row.count || 0,
    }));

    // 4. Top tools invoked
    const toolRows = await db
      .select({
        toolName: tokenUsageLogs.toolName,
        promptTokens: sql<number>`sum(${tokenUsageLogs.promptTokens})`.mapWith(Number),
        completionTokens: sql<number>`sum(${tokenUsageLogs.completionTokens})`.mapWith(Number),
        cost: sql<number>`sum(${tokenUsageLogs.estimatedCost})`.mapWith(Number),
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(tokenUsageLogs)
      .where(and(...filters, sql`${tokenUsageLogs.toolName} is not null`))
      .groupBy(tokenUsageLogs.toolName)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    const topTools = toolRows.map((row) => ({
      toolName: row.toolName,
      tokens: (row.promptTokens || 0) + (row.completionTokens || 0),
      cost: row.cost || 0,
      count: row.count || 0,
    }));

    // 5. Recent logs (timeline)
    const recentLogs = await db
      .select({
        id: tokenUsageLogs.id,
        promptTokens: tokenUsageLogs.promptTokens,
        completionTokens: tokenUsageLogs.completionTokens,
        estimatedCost: tokenUsageLogs.estimatedCost,
        contextKind: tokenUsageLogs.contextKind,
        provider: tokenUsageLogs.provider,
        toolName: tokenUsageLogs.toolName,
        label: tokenUsageLogs.label,
        model: tokenUsageLogs.model,
        durationMs: tokenUsageLogs.durationMs,
        isRealUsage: tokenUsageLogs.isRealUsage,
        createdAt: tokenUsageLogs.createdAt,
      })
      .from(tokenUsageLogs)
      .where(and(...filters))
      .orderBy(desc(tokenUsageLogs.createdAt))
      .limit(100);

    // 6. Cached total on the NPC record (cross-check)
    const [npcRow] = await db
      .select({ totalTokens: npcs.totalTokens })
      .from(npcs)
      .where(eq(npcs.id, id));

    return NextResponse.json({
      npcId: id,
      range: rangeParam,
      totals: {
        promptTokens: totals?.promptTokens || 0,
        completionTokens: totals?.completionTokens || 0,
        tokens: (totals?.promptTokens || 0) + (totals?.completionTokens || 0),
        cost: totals?.cost || 0,
        count: totals?.count || 0,
        lastAt: totals?.lastAt || null,
        npcTotalTokensCached: npcRow?.totalTokens ?? 0,
      },
      byKind,
      byProvider,
      topTools,
      recentLogs,
    });
  } catch (error) {
    console.error("[api/npcs/usage] Error:", error);
    return NextResponse.json({ errorCode: "internal_error", error: "Internal Server Error" }, { status: 500 });
  }
}

function rangeToSinceIso(range: string): string | null {
  const now = Date.now();
  switch (range) {
    case "today": {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d.toISOString();
    }
    case "7d":
      return new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    case "30d":
      return new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    case "all":
    default:
      return null;
  }
}
