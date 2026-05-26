/**
 * OAuth 2.0 PKCE flow para Claude Max.
 *
 * Reutiliza o mesmo client_id público usado pelo Claude Code CLI — o
 * provedor de identidade da Anthropic (claude.ai) já está configurado
 * para aceitar este client + redirect URI. O usuário autentica no
 * console.anthropic.com / claude.ai, recebe um authorization code na
 * tela de callback oficial da Anthropic (out-of-band) e cola o código
 * de volta na nossa UI.
 *
 * Endpoints:
 *   - AUTHORIZE: https://claude.ai/oauth/authorize
 *   - TOKEN:     https://console.anthropic.com/v1/oauth/token
 *   - REDIRECT:  https://console.anthropic.com/oauth/code/callback
 */

import crypto from "node:crypto";

export const ANTHROPIC_OAUTH_CLIENT_ID = "9d1c250a-e61b-44d9-88ed-5944d1962f5e";
export const ANTHROPIC_AUTHORIZE_URL = "https://claude.ai/oauth/authorize";
export const ANTHROPIC_TOKEN_URL = "https://console.anthropic.com/v1/oauth/token";
export const ANTHROPIC_REDIRECT_URI = "https://console.anthropic.com/oauth/code/callback";
export const ANTHROPIC_SCOPES = "org:create_api_key user:profile user:inference";

function base64url(input: Buffer) {
  return input.toString("base64")
    .replace(/=+$/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export function generatePkcePair() {
  const verifier = base64url(crypto.randomBytes(32));
  const challenge = base64url(
    crypto.createHash("sha256").update(verifier).digest(),
  );
  return { verifier, challenge };
}

export function buildAuthorizeUrl(params: {
  codeChallenge: string;
  state: string;
}): string {
  const url = new URL(ANTHROPIC_AUTHORIZE_URL);
  url.searchParams.set("code", "true");
  url.searchParams.set("client_id", ANTHROPIC_OAUTH_CLIENT_ID);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", ANTHROPIC_REDIRECT_URI);
  url.searchParams.set("scope", ANTHROPIC_SCOPES);
  url.searchParams.set("code_challenge", params.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", params.state);
  return url.toString();
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  account?: { uuid?: string; email_address?: string };
  organization?: { uuid?: string; name?: string };
}

export async function exchangeCodeForTokens(input: {
  code: string;
  verifier: string;
  state: string;
}): Promise<TokenResponse> {
  const res = await fetch(ANTHROPIC_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code: input.code,
      state: input.state,
      client_id: ANTHROPIC_OAUTH_CLIENT_ID,
      redirect_uri: ANTHROPIC_REDIRECT_URI,
      code_verifier: input.verifier,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`token_exchange_${res.status}: ${body.slice(0, 400)}`);
  }
  return (await res.json()) as TokenResponse;
}

export async function refreshTokens(refreshToken: string): Promise<TokenResponse> {
  const res = await fetch(ANTHROPIC_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: ANTHROPIC_OAUTH_CLIENT_ID,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`refresh_${res.status}: ${body.slice(0, 400)}`);
  }
  return (await res.json()) as TokenResponse;
}

export function parsePastedCode(raw: string): { code: string; state?: string } {
  // Anthropic mostra o código como "CODE#STATE" na tela de callback.
  const trimmed = raw.trim();
  const hashIdx = trimmed.indexOf("#");
  if (hashIdx === -1) return { code: trimmed };
  return {
    code: trimmed.slice(0, hashIdx),
    state: trimmed.slice(hashIdx + 1),
  };
}
