import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db, gatewayResources } from "@/db";
import { getUserId } from "@/lib/internal-rpc";
import {
  encryptGatewayToken,
} from "@/lib/gateway-resources";
import {
  exchangeCodeForTokens,
  parsePastedCode,
} from "@/lib/anthropic-oauth";

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) {
    return NextResponse.json({ errorCode: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null) as { code?: string } | null;
  if (!body?.code || typeof body.code !== "string" || !body.code.trim()) {
    return NextResponse.json({ errorCode: "missing_code" }, { status: 400 });
  }

  const verifier = req.cookies.get("aia_verifier")?.value;
  const stateCookie = req.cookies.get("aia_state")?.value;
  if (!verifier || !stateCookie) {
    return NextResponse.json({ errorCode: "expired_session" }, { status: 400 });
  }

  const { code, state: pastedState } = parsePastedCode(body.code);
  const effectiveState = pastedState || stateCookie;
  if (pastedState && pastedState !== stateCookie) {
    return NextResponse.json({ errorCode: "state_mismatch" }, { status: 400 });
  }

  let tokens;
  try {
    tokens = await exchangeCodeForTokens({
      code,
      verifier,
      state: effectiveState,
    });
  } catch (err) {
    return NextResponse.json(
      { errorCode: "exchange_failed", detail: (err as Error).message },
      { status: 400 },
    );
  }

  const displayName = tokens.account?.email_address
    ? `Claude Max · ${tokens.account.email_address}`
    : tokens.organization?.name
      ? `Claude Max · ${tokens.organization.name}`
      : "Claude Max";

  // Guardamos um payload JSON cifrado com access + refresh + expiry.
  const storedPayload = JSON.stringify({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? null,
    expires_at: tokens.expires_in
      ? Date.now() + tokens.expires_in * 1000
      : null,
    account: tokens.account ?? null,
    organization: tokens.organization ?? null,
  });

  const tokenEncrypted = encryptGatewayToken(storedPayload);
  const now = new Date();

  const [existing] = await db
    .select()
    .from(gatewayResources)
    .where(
      and(
        eq(gatewayResources.ownerUserId, userId),
        eq(gatewayResources.provider, "anthropic-max"),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .update(gatewayResources)
      .set({
        displayName,
        tokenEncrypted,
        baseUrl: "https://api.anthropic.com",
        lastValidatedAt: now,
        lastValidationStatus: "valid",
        lastValidationError: null,
        updatedAt: now,
      })
      .where(eq(gatewayResources.id, existing.id));
  } else {
    await db
      .insert(gatewayResources)
      .values({
        ownerUserId: userId,
        displayName,
        baseUrl: "https://api.anthropic.com",
        tokenEncrypted,
        provider: "anthropic-max",
        lastValidatedAt: now,
        lastValidationStatus: "valid",
      });
  }

  const res = NextResponse.json({ ok: true, displayName });
  // Limpa cookies PKCE
  res.cookies.set("aia_verifier", "", { path: "/", maxAge: 0 });
  res.cookies.set("aia_state", "", { path: "/", maxAge: 0 });
  return res;
}
