// src/app/api/admin/clients/[clientId]/meta-config/route.ts
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { officeMetaConfig, officeClients } from "@/db/schema";
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

  const [client] = await db
    .select({ id: officeClients.id, name: officeClients.name })
    .from(officeClients)
    .where(eq(officeClients.id, clientId))
    .limit(1);

  if (!client) {
    return NextResponse.json({ error: "cliente não encontrado" }, { status: 404 });
  }

  const [config] = await db
    .select()
    .from(officeMetaConfig)
    .where(eq(officeMetaConfig.clientId, clientId))
    .limit(1);

  if (!config) {
    return NextResponse.json({ config: null });
  }

  const maskedToken =
    config.accessToken.length > 10
      ? config.accessToken.slice(0, 10) + "..."
      : "***";

  return NextResponse.json({
    config: {
      id: config.id,
      clientId: config.clientId,
      accessToken: maskedToken,
      fbPageId: config.fbPageId,
      igUserId: config.igUserId,
      notifChatIds: config.notifChatIds,
      tokenExpiresAt: config.tokenExpiresAt,
      updatedAt: config.updatedAt,
    },
  });
}

async function validateMetaToken(token: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/me?access_token=${encodeURIComponent(token)}`,
      { cache: "no-store" },
    );
    const data = await res.json().catch(() => ({}));
    return res.ok && !!data.id;
  } catch {
    return false;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  return upsertConfig(req, params);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  return upsertConfig(req, params);
}

async function upsertConfig(
  req: NextRequest,
  params: Promise<{ clientId: string }>,
) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const { clientId } = await params;

  const [client] = await db
    .select({ id: officeClients.id })
    .from(officeClients)
    .where(eq(officeClients.id, clientId))
    .limit(1);

  if (!client) {
    return NextResponse.json({ error: "cliente não encontrado" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({})) as {
    accessToken?: string;
    fbPageId?: string;
    igUserId?: string;
    notifChatIds?: string[];
  };

  const [existing] = await db
    .select({ id: officeMetaConfig.id, accessToken: officeMetaConfig.accessToken })
    .from(officeMetaConfig)
    .where(eq(officeMetaConfig.clientId, clientId))
    .limit(1);

  const tokenToValidate = body.accessToken ?? existing?.accessToken;

  if (body.accessToken) {
    const valid = await validateMetaToken(body.accessToken);
    if (!valid) {
      return NextResponse.json({ error: "Token Meta inválido" }, { status: 400 });
    }
  }

  if (!existing && !body.accessToken) {
    return NextResponse.json(
      { error: "accessToken obrigatório na criação" },
      { status: 400 },
    );
  }

  const now = new Date();

  if (existing) {
    const [updated] = await db
      .update(officeMetaConfig)
      .set({
        ...(body.accessToken && { accessToken: body.accessToken }),
        ...(body.fbPageId !== undefined && { fbPageId: body.fbPageId }),
        ...(body.igUserId !== undefined && { igUserId: body.igUserId }),
        ...(body.notifChatIds !== undefined && { notifChatIds: body.notifChatIds }),
        updatedAt: now,
      })
      .where(eq(officeMetaConfig.clientId, clientId))
      .returning();
    return NextResponse.json({ config: updated, updated: true });
  }

  const [created] = await db
    .insert(officeMetaConfig)
    .values({
      clientId,
      accessToken: body.accessToken!,
      fbPageId: body.fbPageId ?? null,
      igUserId: body.igUserId ?? null,
      notifChatIds: body.notifChatIds ?? [],
    })
    .returning();

  return NextResponse.json({ config: created, created: true }, { status: 201 });
}
