// Edge-safe helper to parse the client-portal session cookie.
// Mantemos este modulo separado de client-portal.ts para nao arrastar imports
// incompativeis com Edge Runtime (crypto, drizzle, etc.) ao middleware.

export function parseClientSessionCookie(cookie: string): { clientId: string } | null {
  try {
    const json = typeof atob === "function"
      ? atob(cookie)
      : Buffer.from(cookie, "base64").toString();
    const payload = JSON.parse(json) as { clientId?: string; exp?: number };
    if (!payload || typeof payload.clientId !== "string") return null;
    if (typeof payload.exp === "number" && payload.exp < Date.now()) return null;
    return { clientId: payload.clientId };
  } catch {
    return null;
  }
}
