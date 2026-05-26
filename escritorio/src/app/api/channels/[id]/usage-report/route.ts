import { db, npcs, tokenUsageLogs, channels } from "@/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/internal-rpc";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const channelId = (await params).id;
  const userId = getUserId(req);
  const npcId = req.nextUrl.searchParams.get("npcId");

  if (!userId) {
    return NextResponse.json({ errorCode: "unauthorized", error: "unauthorized" }, { status: 401 });
  }

  try {
    // 1. Verify channel exists
    const [channel] = await db
      .select({ id: channels.id })
      .from(channels)
      .where(eq(channels.id, channelId))
      .limit(1);

    if (!channel) {
      return NextResponse.json({ errorCode: "channel_not_found", error: "Channel not found" }, { status: 404 });
    }

    // 2. Fetch logs with optional filtering by NPC
    const logFilters = [eq(tokenUsageLogs.channelId, channelId)];
    if (npcId) {
      logFilters.push(eq(tokenUsageLogs.npcId, npcId));
    }

    const recentLogs = await db
      .select({
        id: tokenUsageLogs.id,
        npcId: tokenUsageLogs.npcId,
        npcName: npcs.name,
        promptTokens: tokenUsageLogs.promptTokens,
        completionTokens: tokenUsageLogs.completionTokens,
        estimatedCost: tokenUsageLogs.estimatedCost,
        contextKind: tokenUsageLogs.contextKind,
        provider: tokenUsageLogs.provider,
        toolName: tokenUsageLogs.toolName,
        label: tokenUsageLogs.label,
        model: tokenUsageLogs.model,
        isRealUsage: tokenUsageLogs.isRealUsage,
        createdAt: tokenUsageLogs.createdAt,
      })
      .from(tokenUsageLogs)
      .innerJoin(npcs, eq(tokenUsageLogs.npcId, npcs.id))
      .where(and(...logFilters))
      .orderBy(desc(tokenUsageLogs.createdAt))
      .limit(npcId ? 200 : 50);

    // 3. Get NPC summaries (always return all for the channel to populate sidebar/list)
    const usageStats = await db
      .select({
        npcId: tokenUsageLogs.npcId,
        totalPromptTokens: sql<number>`sum(${tokenUsageLogs.promptTokens})`.mapWith(Number),
        totalCompletionTokens: sql<number>`sum(${tokenUsageLogs.completionTokens})`.mapWith(Number),
        totalCost: sql<number>`sum(${tokenUsageLogs.estimatedCost})`.mapWith(Number),
        lastInteraction: sql<string>`max(${tokenUsageLogs.createdAt})`,
      })
      .from(tokenUsageLogs)
      .where(eq(tokenUsageLogs.channelId, channelId))
      .groupBy(tokenUsageLogs.npcId);

    // 3b. Breakdown by contextKind (per NPC) — so UI can show "chat vs task vs tool vs automation vs meeting"
    const kindBreakdown = await db
      .select({
        npcId: tokenUsageLogs.npcId,
        contextKind: tokenUsageLogs.contextKind,
        promptTokens: sql<number>`sum(${tokenUsageLogs.promptTokens})`.mapWith(Number),
        completionTokens: sql<number>`sum(${tokenUsageLogs.completionTokens})`.mapWith(Number),
        cost: sql<number>`sum(${tokenUsageLogs.estimatedCost})`.mapWith(Number),
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(tokenUsageLogs)
      .where(eq(tokenUsageLogs.channelId, channelId))
      .groupBy(tokenUsageLogs.npcId, tokenUsageLogs.contextKind);

    // Shape: { [npcId]: { [kind]: { tokens, cost, count } } }
    const breakdownByNpc: Record<string, Record<string, { tokens: number; cost: number; count: number }>> = {};
    for (const row of kindBreakdown) {
      const bucket = (breakdownByNpc[row.npcId] ??= {});
      bucket[row.contextKind] = {
        tokens: (row.promptTokens || 0) + (row.completionTokens || 0),
        cost: row.cost || 0,
        count: row.count || 0,
      };
    }

    // Aggregated across the channel — same shape, keyed by kind
    const channelKindTotals: Record<string, { tokens: number; cost: number; count: number }> = {};
    for (const row of kindBreakdown) {
      const entry = (channelKindTotals[row.contextKind] ??= { tokens: 0, cost: 0, count: 0 });
      entry.tokens += (row.promptTokens || 0) + (row.completionTokens || 0);
      entry.cost += row.cost || 0;
      entry.count += row.count || 0;
    }

    const channelNpcs = await db
      .select({
        id: npcs.id,
        name: npcs.name,
        appearance: npcs.appearance,
        totalTokens: npcs.totalTokens,
      })
      .from(npcs)
      .where(eq(npcs.channelId, channelId));

    const npcReports = channelNpcs.map((npc) => {
      const stats = usageStats.find((s) => s.npcId === npc.id);
      return {
        id: npc.id,
        name: npc.name,
        appearance: npc.appearance,
        totalTokens: (stats?.totalPromptTokens || 0) + (stats?.totalCompletionTokens || 0),
        promptTokens: stats?.totalPromptTokens || 0,
        completionTokens: stats?.totalCompletionTokens || 0,
        totalCost: stats?.totalCost || 0,
        lastInteraction: stats?.lastInteraction || null,
        breakdown: breakdownByNpc[npc.id] || {},
      };
    });

    return NextResponse.json({
      npcs: npcReports,
      recentLogs,
      summary: {
        totalChannelCost: npcReports.reduce((sum, n) => sum + n.totalCost, 0),
        totalChannelTokens: npcReports.reduce((sum, n) => sum + n.totalTokens, 0),
        breakdown: channelKindTotals,
      }
    });
  } catch (error) {
    console.error("[api/usage-report] Error:", error);
    return NextResponse.json({ errorCode: "internal_error", error: "Internal Server Error" }, { status: 500 });
  }
}
