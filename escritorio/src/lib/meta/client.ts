// src/lib/meta/client.ts
// Cliente HTTP para Graph API (Meta) com retry simples em 500/503.

import type { MetaFetchOptions } from "./types";

const GRAPH_BASE = "https://graph.facebook.com/v21.0";
const RETRYABLE_STATUSES = new Set([500, 503]);

export class MetaApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "MetaApiError";
    this.status = status;
    this.body = body;
  }
}

function buildUrl(path: string): string {
  const trimmed = path.startsWith("/") ? path : `/${path}`;
  return `${GRAPH_BASE}${trimmed}`;
}

async function performFetch(
  url: string,
  init: RequestInit,
): Promise<{ status: number; body: unknown }> {
  const res = await fetch(url, init);
  let body: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  return { status: res.status, body };
}

/**
 * metaFetch — chama Graph API com retry 1x em 500/503.
 * GET: payload entra como query string. POST: payload entra como JSON.
 */
export async function metaFetch<T = unknown>(
  path: string,
  opts: MetaFetchOptions,
): Promise<T> {
  const method = opts.method ?? "GET";
  const token = opts.token;
  const body = opts.body ?? {};

  let url = buildUrl(path);
  const init: RequestInit = { method };

  if (method === "GET" || method === "DELETE") {
    const params = new URLSearchParams();
    params.set("access_token", token);
    for (const [k, v] of Object.entries(body)) {
      if (v === undefined || v === null) continue;
      params.set(k, typeof v === "string" ? v : JSON.stringify(v));
    }
    url += (url.includes("?") ? "&" : "?") + params.toString();
  } else {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify({ ...body, access_token: token });
  }

  let attempt = 0;
  // 1 retry => até 2 tentativas
  while (true) {
    attempt += 1;
    const { status, body: respBody } = await performFetch(url, init);
    if (status >= 200 && status < 300) {
      return respBody as T;
    }
    if (RETRYABLE_STATUSES.has(status) && attempt === 1) {
      await new Promise((r) => setTimeout(r, 500));
      continue;
    }
    const msg =
      typeof respBody === "object" && respBody !== null && "error" in respBody
        ? JSON.stringify((respBody as { error: unknown }).error)
        : `Graph API error ${status}`;
    throw new MetaApiError(msg, status, respBody);
  }
}
