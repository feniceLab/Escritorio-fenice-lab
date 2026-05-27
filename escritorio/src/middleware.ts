import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "@/lib/jwt";
import { parseClientSessionCookie } from "@/lib/auth/client-portal-edge";

const EMBEDDED_USER_ID = "fenix-embed-user";
const EMBEDDED_NICKNAME = "Fenix OS";
const IS_EMBEDDED = process.env.FENIX_EMBEDDED === "true";

const PUBLIC_PATHS = ["/", "/auth", "/api/auth", "/api/health", "/api/embed"];

const PORTAL_PUBLIC_PATHS = ["/portal/login", "/api/portal/verify"];

// Rotas do portal acessíveis por usuários internos com JWT
const PORTAL_INTERNAL_PATHS = ["/portal/instagram"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isPortalPublic(pathname: string): boolean {
  return PORTAL_PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isPortalInternal(pathname: string): boolean {
  return PORTAL_INTERNAL_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isPortalPath(pathname: string): boolean {
  return pathname.startsWith("/portal") || pathname.startsWith("/api/portal");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/assets")) {
    return NextResponse.next();
  }

  // Portal routes
  if (isPortalPath(pathname)) {
    if (isPortalPublic(pathname)) {
      return NextResponse.next();
    }

    // Rotas internas do portal — aceita JWT do usuário interno
    if (isPortalInternal(pathname)) {
      const token = req.cookies.get("token")?.value;
      if (token) {
        const payload = await verifyJWT(token);
        if (payload) {
          const requestHeaders = new Headers(req.headers);
          requestHeaders.set("x-user-id", payload.userId);
          requestHeaders.set("x-user-nickname", encodeURIComponent(payload.nickname));
          return NextResponse.next({ request: { headers: requestHeaders } });
        }
      }
    }

    const sessionCookie = req.cookies.get("client-portal-session")?.value;
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/portal/login", req.url));
    }

    const session = parseClientSessionCookie(sessionCookie);
    if (!session) {
      const response = NextResponse.redirect(new URL("/portal/login", req.url));
      response.cookies.delete("client-portal-session");
      return response;
    }

    return NextResponse.next();
  }

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

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
