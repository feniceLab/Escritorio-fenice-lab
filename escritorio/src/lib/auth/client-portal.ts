import crypto from "crypto";
import { db } from "@/db";
import { officeClientSessions } from "@/db/schema";
import { eq, and, gt, isNull } from "drizzle-orm";

export async function generateMagicLink(clientId: string, baseUrl: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await db.insert(officeClientSessions).values({ clientId, token, expiresAt });
  return baseUrl + "/portal/login?token=" + token;
}

export async function verifyMagicToken(token: string): Promise<{ clientId: string } | null> {
  const [session] = await db
    .select()
    .from(officeClientSessions)
    .where(
      and(
        eq(officeClientSessions.token, token),
        gt(officeClientSessions.expiresAt, new Date()),
        isNull(officeClientSessions.usedAt),
      )
    )
    .limit(1);
  if (!session) return null;
  await db.update(officeClientSessions).set({ usedAt: new Date() }).where(eq(officeClientSessions.id, session.id));
  return { clientId: session.clientId };
}

export function createClientSessionCookie(clientId: string): string {
  const payload = Buffer.from(JSON.stringify({ clientId, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString("base64");
  return payload;
}

export function parseClientSessionCookie(cookie: string): { clientId: string } | null {
  try {
    const payload = JSON.parse(Buffer.from(cookie, "base64").toString());
    if (payload.exp < Date.now()) return null;
    return { clientId: payload.clientId };
  } catch { return null; }
}
