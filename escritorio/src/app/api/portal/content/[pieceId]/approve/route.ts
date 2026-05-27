import { NextRequest, NextResponse } from "next/server";
import { parseClientSessionCookie } from "@/lib/auth/client-portal";
import { db } from "@/db";
import { officeContentPieces } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ pieceId: string }> },
) {
  const sessionCookie = req.cookies.get("client-portal-session")?.value;
  if (!sessionCookie) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const session = parseClientSessionCookie(sessionCookie);
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { pieceId } = await params;

  const [piece] = await db
    .select({ id: officeContentPieces.id, clientId: officeContentPieces.clientId })
    .from(officeContentPieces)
    .where(eq(officeContentPieces.id, pieceId))
    .limit(1);

  if (!piece || piece.clientId !== session.clientId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await db
    .update(officeContentPieces)
    .set({ status: "approved", approvedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(officeContentPieces.id, pieceId), eq(officeContentPieces.clientId, session.clientId)));

  return NextResponse.json({ ok: true });
}
