import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/internal-rpc";
import { generateMagicLink } from "@/lib/auth/client-portal";
import { broadcastToGroup } from "@/lib/telegram/client";
import { db } from "@/db";
import { officeClients } from "@/db/schema";
import { eq } from "drizzle-orm";

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const clientId = typeof body.clientId === "string" ? body.clientId : null;
  if (!clientId) {
    return NextResponse.json({ error: "clientId_required" }, { status: 400 });
  }

  const [client] = await db
    .select({ id: officeClients.id, name: officeClients.name })
    .from(officeClients)
    .where(eq(officeClients.id, clientId))
    .limit(1);

  if (!client) {
    return NextResponse.json({ error: "client_not_found" }, { status: 404 });
  }

  const baseUrl = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
  const link = await generateMagicLink(clientId, baseUrl);

  try {
    const clientName = client.name ?? "Cliente";
    const msg = `Link de acesso ao portal: ${clientName}\n${link}`;
    await broadcastToGroup(msg, "operational");
  } catch (e) {
    console.error("Telegram notify failed:", e);
  }

  return NextResponse.json({ link });
}
