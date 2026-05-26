import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "@/lib/jwt";

const EMBEDDED_USER_ID = "fenix-embed-user";
const EMBEDDED_NICKNAME = "Fenix OS";
const IS_EMBEDDED = process.env.FENIX_EMBEDDED === "true";

const PUBLIC_PATHS = ["/", "/auth", "/api/auth", "/api/health", "/api/embed"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname) || pathname.startsWith("/_next") || pathname.startsWith("/assets")) {
    return NextResponse.next();
  }

  // Fenix OS embedded mode — bypass all auth, inject fixed user
  if (IS_EMBEDDED) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-user-id", EMBEDDED_USER_ID);
    requestHeaders.set("x-user-nickname", encodeURIComponent(EMBEDDED_NICKNAME));
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/auth", req.url));
  }

  const payload = await verifyJWT(token);
  if (!payload) {
    const response = NextResponse.redirect(new URL("/auth", req.url));
    response.cookies.delete("token");
    return response;
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-user-id", payload.userId);
  requestHeaders.set("x-user-nickname", encodeURIComponent(payload.nickname));

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
