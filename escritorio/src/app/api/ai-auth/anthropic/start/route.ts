import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

import { getUserId } from "@/lib/internal-rpc";
import {
  buildAuthorizeUrl,
  generatePkcePair,
} from "@/lib/anthropic-oauth";

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) {
    return NextResponse.json({ errorCode: "unauthorized" }, { status: 401 });
  }

  const { verifier, challenge } = generatePkcePair();
  const state = crypto.randomBytes(16).toString("hex");
  const authorizeUrl = buildAuthorizeUrl({ codeChallenge: challenge, state });

  const res = NextResponse.json({ authorizeUrl, state });
  const cookieOpts = {
    httpOnly: true,
    secure: req.nextUrl.protocol === "https:",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 10, // 10 minutos
  };
  res.cookies.set("aia_verifier", verifier, cookieOpts);
  res.cookies.set("aia_state", state, cookieOpts);
  return res;
}
