// src/app/api/clients/[clientId]/publish/route.ts
// Publica um contentPiece aprovado imediatamente no Facebook e/ou Instagram.

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, officeClients, isPostgres } from "@/db";
import {
  officeContentPieces,
  officeMetaConfig,
  officePublishHistory,
} from "@/db/schema";
import { getUserId } from "@/lib/internal-rpc";
import { publishContent } from "@/lib/meta";
import type { MetaPublishResult } from "@/lib/meta";
import {
  notifyPublishSuccess,
  notifyPublishFailed,
} from "@/lib/telegram/client";

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 });
}

function nowForDb() {
  return isPostgres ? new Date() : new Date().toISOString();
}

function resolvePlatform(
  piecePlatform: string,
  config: { fbPageId: string | null; igUserId: string | null },
): "facebook" | "instagram" | "both" {
  if (piecePlatform === "facebook" || piecePlatform === "instagram") {
    return piecePlatform;
  }
  // "both" — degrada se faltar uma config
  if (config.fbPageId && config.igUserId) return "both";
  if (config.fbPageId) return "facebook";
  if (config.igUserId) return "instagram";
  return "both";
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
  if (!contentPieceId) return badRequest("contentPieceId_required");

  try {
    const [client] = await db
      .select({ id: officeClients.id, name: officeClients.name })
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

    if (piece.status !== "approved") {
      return badRequest("content_piece_not_approved", { status: piece.status });
    }

    const [metaConfig] = await db
      .select()
      .from(officeMetaConfig)
      .where(eq(officeMetaConfig.clientId, clientId))
      .limit(1);

    if (!metaConfig) {
      return NextResponse.json(
        { error: "meta_config_not_found" },
        { status: 404 },
      );
    }

    const caption = piece.caption ?? "";
    const imageUrls = Array.isArray(piece.mediaUrls)
      ? (piece.mediaUrls as string[])
      : [];

    const targetPlatform = resolvePlatform(piece.platform, {
      fbPageId: metaConfig.fbPageId ?? null,
      igUserId: metaConfig.igUserId ?? null,
    });

    const results: MetaPublishResult[] = await publishContent({
      caption,
      imageUrls,
      platform: targetPlatform,
      config: {
        accessToken: metaConfig.accessToken,
        fbPageId: metaConfig.fbPageId,
        igUserId: metaConfig.igUserId,
      },
    });

    // Histórico
    for (const r of results) {
      await db.insert(officePublishHistory).values({
        contentPieceId,
        platform: r.platform,
        externalPostId: r.externalPostId ?? null,
        status: r.success ? "published" : "failed",
        errorMessage: r.errorMessage ?? null,
        publishedAt: nowForDb() as never,
      });
    }

    const anySuccess = results.some((r) => r.success);
    const allSuccess = results.every((r) => r.success);

    if (anySuccess) {
      await db
        .update(officeContentPieces)
        .set({
          status: "published",
          publishedAt: nowForDb() as never,
          updatedAt: nowForDb() as never,
        })
        .where(eq(officeContentPieces.id, contentPieceId));
    }

    // Notificações Telegram (best-effort, não derruba a resposta)
    const clientName = client.name ?? "Cliente";
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
        console.error("Telegram notify failed:", notifyErr);
      }
    }

    return NextResponse.json(
      {
        success: allSuccess,
        results,
      },
      { status: anySuccess ? 200 : 502 },
    );
  } catch (error) {
    console.error("Failed to publish content piece:", error);
    return NextResponse.json(
      { error: "failed_to_publish", message: String(error) },
      { status: 500 },
    );
  }
}
