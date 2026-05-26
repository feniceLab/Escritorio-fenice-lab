import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";

import { db, gatewayResources } from "@/db";
import { getUserId } from "@/lib/internal-rpc";
import {
  encryptGatewayToken,
  upsertOwnedGatewayResource,
} from "@/lib/gateway-resources";
import {
  providerBaseUrl,
  providerDisplayName,
  validateAnthropicCredential,
  validateOpenAiCredential,
  type AiAuthProvider,
} from "@/lib/ai-auth-validators";

const AI_AUTH_PROVIDERS: AiAuthProvider[] = ["anthropic-max", "openai"];

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) {
    return NextResponse.json({ errorCode: "unauthorized" }, { status: 401 });
  }
  const rows = await db
    .select({
      id: gatewayResources.id,
      provider: gatewayResources.provider,
      displayName: gatewayResources.displayName,
      lastValidatedAt: gatewayResources.lastValidatedAt,
      lastValidationStatus: gatewayResources.lastValidationStatus,
      createdAt: gatewayResources.createdAt,
    })
    .from(gatewayResources)
    .where(
      and(
        eq(gatewayResources.ownerUserId, userId),
        inArray(gatewayResources.provider, AI_AUTH_PROVIDERS),
      ),
    );
  return NextResponse.json({ connections: rows });
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) {
    return NextResponse.json({ errorCode: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null) as
    | { provider?: AiAuthProvider; credential?: string }
    | null;
  if (!body?.provider || !AI_AUTH_PROVIDERS.includes(body.provider)) {
    return NextResponse.json({ errorCode: "invalid_provider" }, { status: 400 });
  }
  if (!body.credential || typeof body.credential !== "string" || !body.credential.trim()) {
    return NextResponse.json({ errorCode: "missing_credential" }, { status: 400 });
  }

  const credential = body.credential.trim();
  const validation = body.provider === "anthropic-max"
    ? await validateAnthropicCredential(credential)
    : await validateOpenAiCredential(credential);

  if (!validation.ok) {
    return NextResponse.json(
      { errorCode: "validation_failed", detail: validation.error ?? "unknown" },
      { status: 400 },
    );
  }

  const baseUrl = providerBaseUrl(body.provider);
  const displayName = validation.label || providerDisplayName(body.provider);

  // Reusa gatewayResources como storage para login de IA.
  // Cada usuário pode ter um registro por provider (upsert por provider).
  const [existing] = await db
    .select()
    .from(gatewayResources)
    .where(
      and(
        eq(gatewayResources.ownerUserId, userId),
        eq(gatewayResources.provider, body.provider),
      ),
    )
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(gatewayResources)
      .set({
        displayName,
        tokenEncrypted: encryptGatewayToken(credential),
        baseUrl,
        lastValidatedAt: new Date(),
        lastValidationStatus: "valid",
        lastValidationError: null,
        updatedAt: new Date(),
      })
      .where(eq(gatewayResources.id, existing.id))
      .returning();
    return NextResponse.json({ connection: summarise(updated) });
  }

  const created = await upsertOwnedGatewayResource({
    ownerUserId: userId,
    baseUrl,
    token: credential,
    displayName,
    provider: body.provider,
  });

  await db
    .update(gatewayResources)
    .set({
      lastValidatedAt: new Date(),
      lastValidationStatus: "valid",
      lastValidationError: null,
    })
    .where(eq(gatewayResources.id, created.id));

  return NextResponse.json({ connection: summarise(created) });
}

type GatewayRow = typeof gatewayResources.$inferSelect;
function summarise(row: GatewayRow) {
  return {
    id: row.id,
    provider: row.provider,
    displayName: row.displayName,
    lastValidatedAt: row.lastValidatedAt,
    lastValidationStatus: row.lastValidationStatus,
  };
}
