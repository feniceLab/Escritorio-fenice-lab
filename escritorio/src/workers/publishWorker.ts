// src/workers/publishWorker.ts
// Worker standalone que consome office_publish_queue e publica nos canais Meta.
// Executar com: tsx src/workers/publishWorker.ts  (ou compilado via PM2).

import "dotenv/config";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  officePublishQueue,
  officeContentPieces,
  officeMetaConfig,
  officePublishHistory,
  officeClients,
} from "../db/schema";
import { publishContent } from "../lib/meta";
import type { MetaPublishResult } from "../lib/meta";
import {
  notifyPublishSuccess,
  notifyPublishFailed,
} from "../lib/telegram/client";

const TICK_MS = 60_000;
const BATCH_SIZE = 5;
const WORKER_ID = `worker-${process.pid}-${Math.random().toString(36).slice(2, 8)}`;

const connectionString = process.env.DATABASE_DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  // eslint-disable-next-line no-console
  console.error("[publishWorker] DATABASE_URL not set. Exiting.");
  process.exit(1);
}

const pool = new Pool({ connectionString });
const db = drizzle(pool);

function resolvePlatform(
  piecePlatform: string,
  cfg: { fbPageId: string | null; igUserId: string | null },
): "facebook" | "instagram" | "both" {
  if (piecePlatform === "facebook" || piecePlatform === "instagram") {
    return piecePlatform;
  }
  if (cfg.fbPageId && cfg.igUserId) return "both";
  if (cfg.fbPageId) return "facebook";
  if (cfg.igUserId) return "instagram";
  return "both";
}

async function claimBatch(): Promise<Array<typeof officePublishQueue.$inferSelect>> {
  // Atualiza locked_at/locked_by para um lote pending cujo run_at já passou.
  const claimed = await db
    .update(officePublishQueue)
    .set({
      lockedAt: new Date(),
      lockedBy: WORKER_ID,
      status: "processing",
    })
    .where(
      sql`${officePublishQueue.id} IN (
        SELECT ${officePublishQueue.id} FROM ${officePublishQueue}
        WHERE ${officePublishQueue.status} = 'pending'
          AND ${officePublishQueue.runAt} <= NOW()
        ORDER BY ${officePublishQueue.runAt} ASC
        LIMIT ${BATCH_SIZE}
        FOR UPDATE SKIP LOCKED
      )`,
    )
    .returning();
  return claimed;
}

async function processItem(
  item: typeof officePublishQueue.$inferSelect,
): Promise<void> {
  const [piece] = await db
    .select()
    .from(officeContentPieces)
    .where(eq(officeContentPieces.id, item.contentPieceId))
    .limit(1);

  if (!piece) {
    await db
      .update(officePublishQueue)
      .set({ status: "failed", lastError: "content_piece_not_found" })
      .where(eq(officePublishQueue.id, item.id));
    return;
  }

  const [metaConfig] = await db
    .select()
    .from(officeMetaConfig)
    .where(eq(officeMetaConfig.clientId, piece.clientId))
    .limit(1);

  if (!metaConfig) {
    await db
      .update(officePublishQueue)
      .set({ status: "failed", lastError: "meta_config_not_found" })
      .where(eq(officePublishQueue.id, item.id));
    return;
  }

  const [client] = await db
    .select({ name: officeClients.name })
    .from(officeClients)
    .where(eq(officeClients.id, piece.clientId))
    .limit(1);
  const clientName = client?.name ?? "Cliente";

  const targetPlatform = resolvePlatform(piece.platform, {
    fbPageId: metaConfig.fbPageId ?? null,
    igUserId: metaConfig.igUserId ?? null,
  });

  let results: MetaPublishResult[] = [];
  try {
    results = await publishContent({
      caption: piece.caption ?? "",
      imageUrls: Array.isArray(piece.mediaUrls)
        ? (piece.mediaUrls as string[])
        : [],
      platform: targetPlatform,
      config: {
        accessToken: metaConfig.accessToken,
        fbPageId: metaConfig.fbPageId,
        igUserId: metaConfig.igUserId,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await db
      .update(officePublishQueue)
      .set({
        status: "failed",
        lastError: msg,
        attempts: (item.attempts ?? 0) + 1,
      })
      .where(eq(officePublishQueue.id, item.id));
    return;
  }

  // Histórico
  for (const r of results) {
    await db.insert(officePublishHistory).values({
      contentPieceId: piece.id,
      platform: r.platform,
      externalPostId: r.externalPostId ?? null,
      status: r.success ? "published" : "failed",
      errorMessage: r.errorMessage ?? null,
      publishedAt: new Date(),
    });
  }

  const anySuccess = results.some((r) => r.success);
  const allSuccess = results.every((r) => r.success);

  if (anySuccess) {
    await db
      .update(officeContentPieces)
      .set({
        status: "published",
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(officeContentPieces.id, piece.id));
  }

  await db
    .update(officePublishQueue)
    .set({
      status: allSuccess ? "completed" : anySuccess ? "partial" : "failed",
      attempts: (item.attempts ?? 0) + 1,
      lastError: allSuccess
        ? null
        : results
            .filter((r) => !r.success)
            .map((r) => `${r.platform}:${r.errorMessage}`)
            .join("; "),
    })
    .where(eq(officePublishQueue.id, item.id));

  // Notificações Telegram (best-effort)
  for (const r of results) {
    try {
      if (r.success) {
        await notifyPublishSuccess(clientName, r.platform, piece.title);
      } else {
        await notifyPublishFailed(
          clientName,
          r.platform,
          r.errorMessage ?? "erro desconhecido",
        );
      }
    } catch (notifyErr) {
      // eslint-disable-next-line no-console
      console.error("[publishWorker] telegram notify failed:", notifyErr);
    }
  }
}

let running = false;
async function tick() {
  if (running) return;
  running = true;
  try {
    const batch = await claimBatch();
    if (batch.length === 0) return;
    // eslint-disable-next-line no-console
    console.log(`[publishWorker] processing ${batch.length} item(s)`);
    for (const item of batch) {
      try {
        await processItem(item);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[publishWorker] item error:", err);
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[publishWorker] tick error:", err);
  } finally {
    running = false;
  }
}

async function main() {
  // eslint-disable-next-line no-console
  console.log(`[publishWorker] starting (id=${WORKER_ID})`);

  let usedCron = false;
  try {
    // Tenta usar node-cron — fallback para setInterval se não estiver disponível.
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const cron = require("node-cron");
    cron.schedule("* * * * *", () => {
      void tick();
    });
    usedCron = true;
    // eslint-disable-next-line no-console
    console.log("[publishWorker] using node-cron (every minute)");
  } catch {
    // eslint-disable-next-line no-console
    console.log("[publishWorker] node-cron not available — using setInterval");
  }
  if (!usedCron) {
    setInterval(() => void tick(), TICK_MS);
  }

  // Dispara um tick inicial
  void tick();
}

process.on("SIGINT", async () => {
  // eslint-disable-next-line no-console
  console.log("[publishWorker] SIGINT — shutting down");
  await pool.end();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  // eslint-disable-next-line no-console
  console.log("[publishWorker] SIGTERM — shutting down");
  await pool.end();
  process.exit(0);
});

void main();
