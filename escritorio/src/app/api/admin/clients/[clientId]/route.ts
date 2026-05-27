// src/app/api/admin/clients/[clientId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { officeClients } from "@/db/schema";
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
    .select()
    .from(officeClients)
    .where(eq(officeClients.id, clientId))
    .limit(1);

  if (!client) {
    return NextResponse.json({ error: "cliente não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ client });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const { clientId } = await params;

  const body = await req.json().catch(() => ({})) as {
    name?: string;
    status?: string;
    summary?: string;
  };

  const [client] = await db
    .select({ id: officeClients.id })
    .from(officeClients)
    .where(eq(officeClients.id, clientId))
    .limit(1);

  if (!client) {
    return NextResponse.json({ error: "cliente não encontrado" }, { status: 404 });
  }

  const [updated] = await db
    .update(officeClients)
    .set({
      ...(body.name && { name: body.name }),
      ...(body.status && { status: body.status }),
      ...(body.summary !== undefined && { summary: body.summary }),
      updatedAt: new Date(),
    })
    .where(eq(officeClients.id, clientId))
    .returning();

  return NextResponse.json({ client: updated });
}
