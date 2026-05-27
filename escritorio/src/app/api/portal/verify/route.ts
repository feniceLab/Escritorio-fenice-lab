import { NextRequest, NextResponse } from "next/server";
import { verifyMagicToken, createClientSessionCookie } from "@/lib/auth/client-portal";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/portal/login?error=invalid", req.url));
  }

  const result = await verifyMagicToken(token);

  if (!result) {
    return NextResponse.redirect(new URL("/portal/login?error=invalid", req.url));
  }

  const cookieValue = createClientSessionCookie(result.clientId);
  const response = NextResponse.redirect(new URL("/portal", req.url));

  response.cookies.set("client-portal-session", cookieValue, {
    httpOnly: true,
    path: "/portal",
    maxAge: 7 * 24 * 60 * 60,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
