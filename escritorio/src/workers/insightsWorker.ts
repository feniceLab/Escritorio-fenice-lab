// src/workers/insightsWorker.ts
// Worker que coleta insights das publicações Meta e persiste em officeSocialMetrics.
// Roda a cada 6 horas via node-cron: '0 */6 * * *'

import "dotenv/config";
import { and, eq, gte, isNotNull, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  officeMetaConfig,
  officePublishHistory,
  officeContentPieces,
  officeSocialMetrics,
} from "../db/schema";

const WORKER_ID = `insights-worker-${process.pid}`;

const connectionString = process.env.DATABASE_DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("[insightsWorker] DATABASE_URL not set. Exiting.");
  process.exit(1);
}

const pool = new Pool({ connectionString });
const db = drizzle(pool);

type InsightMetric = {
  name: string;
  value: number;
  platform: "facebook" | "instagram";
};

async function fetchFbInsights(postId: string, token: string): Promise<InsightMetric[]> {
  try {
    const metrics = "post_impressions,post_engaged_users,post_reactions_like_total";
    const url = `https://graph.facebook.com/v21.0/${postId}/insights?metric=${metrics}&access_token=${encodeURIComponent(token)}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json().catch(() => ({ data: [] }));
    const items: Array<{ name: string; values?: Array<{ value: number }> }> = Array.isArray(data.data) ? data.data : [];
    return items.map((item) => ({
      name: `fb_${item.name.replace("post_", "")}`,
      value: item.values?.[0]?.value ?? 0,
      platform: "facebook" as const,
    }));
  } catch {
    return [];
  }
}

async function fetchIgInsights(mediaId: string, token: string): Promise<InsightMetric[]> {
  try {
    const metrics = "reach,saved,likes";
    const url = `https://graph.facebook.com/v21.0/${mediaId}/insights?metric=${metrics}&access_token=${encodeURIComponent(token)}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json().catch(() => ({ data: [] }));
    const items: Array<{ name: string; values?: Array<{ value: number }>; id?: string }> = Array.isArray(data.data) ? data.data : [];
    return items.map((item) => ({
      name: `ig_${item.name}`,
      value: item.values?.[0]?.value ?? 0,
      platform: "instagram" as const,
    }));
  } catch {
    return [];
  }
}

async function collectInsights() {
  console.log(`[insightsWorker] starting collection run (${new Date().toISOString()})`);

  const configs = await db
    .select({
      clientId: officeMetaConfig.clientId,
      accessToken: officeMetaConfig.accessToken,
      fbPageId: officeMetaConfig.fbPageId,
      igUserId: officeMetaConfig.igUserId,
    })
    .from(officeMetaConfig);

  if (configs.length === 0) {
    console.log("[insightsWorker] no meta configs found, skipping");
    return;
  }

  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

  for (const config of configs) {
    try {
      console.log(`[insightsWorker] processing client ${config.clientId}`);

      const recentPieces = await db
        .select({ id: officeContentPieces.id })
        .from(officeContentPieces)
        .where(
          and(
            eq(officeContentPieces.clientId, config.clientId),
            eq(officeContentPieces.status, "published"),
            gte(officeContentPieces.publishedAt, cutoff),
          ),
        );

      if (recentPieces.length === 0) continue;

      const pieceIds = recentPieces.map((p) => p.id);

      const histories = await db
        .select({
          platform: officePublishHistory.platform,
          externalPostId: officePublishHistory.externalPostId,
          publishedAt: officePublishHistory.publishedAt,
        })
        .from(officePublishHistory)
        .where(
          and(
            isNotNull(officePublishHistory.externalPostId),
            eq(officePublishHistory.status, "published"),
            sql`${officePublishHistory.contentPieceId} = ANY(${sql.raw(`ARRAY[${pieceIds.map((id) => `'${id}'`).join(",")}]::uuid[]`)})`,
          ),
        );

      for (const history of histories) {
        if (!history.externalPostId) continue;

        let insights: InsightMetric[] = [];

        if (history.platform === "facebook" && config.fbPageId) {
          insights = await fetchFbInsights(history.externalPostId, config.accessToken);
        } else if (history.platform === "instagram" && config.igUserId) {
          insights = await fetchIgInsights(history.externalPostId, config.accessToken);
        }

        for (const insight of insights) {
          try {
            await db.insert(officeSocialMetrics).values({
              clientId: config.clientId,
              platform: insight.platform,
              metricName: insight.name,
              metricValue: String(insight.value),
              metricDate: new Date(),
            });
          } catch (insertErr) {
            console.error("[insightsWorker] insert error:", insertErr);
          }
        }
      }
    } catch (clientErr) {
      console.error(`[insightsWorker] client ${config.clientId} error:`, clientErr);
    }
  }

  console.log("[insightsWorker] collection run complete");
}

async function main() {
  console.log(`[insightsWorker] starting (id=${WORKER_ID})`);

  let usedCron = false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cron = require("node-cron");
    cron.schedule("0 */6 * * *", () => {
      void collectInsights();
    });
    usedCron = true;
    console.log("[insightsWorker] using node-cron (every 6 hours)");
  } catch {
    console.log("[insightsWorker] node-cron not available — using setInterval (6h)");
  }

  if (!usedCron) {
    setInterval(() => void collectInsights(), 6 * 60 * 60 * 1000);
  }

  void collectInsights();
}

process.on("SIGINT", async () => {
  console.log("[insightsWorker] SIGINT — shutting down");
  await pool.end();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("[insightsWorker] SIGTERM — shutting down");
  await pool.end();
  process.exit(0);
});

void main();
