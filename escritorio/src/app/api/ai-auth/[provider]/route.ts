import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db, gatewayResources } from "@/db";
import { getUserId } from "@/lib/internal-rpc";

const AI_AUTH_PROVIDERS = ["anthropic-max", "openai"];

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ errorCode: "unauthorized" }, { status: 401 });

  const { provider } = await ctx.params;
  if (!AI_AUTH_PROVIDERS.includes(provider)) {
    return NextResponse.json({ errorCode: "invalid_provider" }, { status: 400 });
  }

  await db
    .delete(gatewayResources)
    .where(
      and(
        eq(gatewayResources.ownerUserId, userId),
        eq(gatewayResources.provider, provider),
      ),
    );

  return NextResponse.json({ ok: true });
}
