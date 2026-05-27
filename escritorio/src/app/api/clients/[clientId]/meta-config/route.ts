import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { officeMetaConfig } from "@/db/schema";
import { getUserId } from "@/lib/internal-rpc";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId } = await params;
  const config = await db.select().from(officeMetaConfig).where(eq(officeMetaConfig.clientId, clientId)).limit(1);

  if (!config.length) return NextResponse.json(null);

  const c = config[0];
  return NextResponse.json({
    ...c,
    accessToken: c.accessToken ? "••••••••" + c.accessToken.slice(-6) : null,
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId } = await params;
  const body = await req.json();
  const { accessToken, fbPageId, igUserId, notifChatIds } = body;

  const values = {
    clientId,
    accessToken: accessToken && !accessToken.startsWith("••") ? accessToken : undefined,
    fbPageId: fbPageId || null,
    igUserId: igUserId || null,
    notifChatIds: notifChatIds ? notifChatIds.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
    updatedAt: new Date(),
  };

  const existing = await db.select({ id: officeMetaConfig.id }).from(officeMetaConfig).where(eq(officeMetaConfig.clientId, clientId)).limit(1);

  if (existing.length) {
    const update: Record<string, unknown> = { updatedAt: values.updatedAt, fbPageId: values.fbPageId, igUserId: values.igUserId, notifChatIds: values.notifChatIds };
    if (values.accessToken) update.accessToken = values.accessToken;
    await db.update(officeMetaConfig).set(update).where(eq(officeMetaConfig.clientId, clientId));
  } else {
    await db.insert(officeMetaConfig).values({ ...values, accessToken: accessToken || "" });
  }

  return NextResponse.json({ ok: true });
}
