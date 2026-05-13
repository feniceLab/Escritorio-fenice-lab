#!/usr/bin/env node
/* eslint-disable no-console, @typescript-eslint/no-require-imports */
"use strict";

const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { URL } = require("node:url");

const ROOT = process.env.STARKEN_OS_ROOT || __dirname;
const PORT = Number(process.env.LEGACY_API_PORT || 3010);

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
  }
}

loadEnvFile(path.join(ROOT, ".env"));
loadEnvFile(path.join(ROOT, ".env.local"));
loadEnvFile(path.join(ROOT, "escritorio", ".env.local"));

function sendJson(res, statusCode, body, headers = {}) {
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    ...headers,
  });
  res.end(payload);
}

function createVercelResponse(res) {
  let statusCode = 200;
  const headers = {};

  return {
    setHeader(name, value) {
      headers[name] = value;
      return this;
    },
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      sendJson(res, statusCode, body, headers);
    },
    end(body = "") {
      res.writeHead(statusCode, headers);
      res.end(body);
    },
  };
}

function resolveHandler(pathname) {
  const clean = pathname.replace(/^\/api\//, "");
  if (!clean || clean.includes("..")) return null;

  const candidates = [
    path.join(ROOT, "api", `${clean}.js`),
    path.join(ROOT, "api", clean, "index.js"),
  ];

  return candidates.find((candidate) => {
    const relative = path.relative(path.join(ROOT, "api"), candidate);
    return relative && !relative.startsWith("..") && fs.existsSync(candidate);
  }) || null;
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return null;

  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw.trim()) return null;

  const contentType = req.headers["content-type"] || "";
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  return raw;
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  const url = new URL(req.url || "/", "http://127.0.0.1");
  const handlerPath = resolveHandler(url.pathname);
  if (!handlerPath) {
    sendJson(res, 404, {
      error: true,
      code: "LEGACY_API_NOT_FOUND",
      message: `Legacy API not found: ${url.pathname}`,
    });
    return;
  }

  try {
    const handler = require(handlerPath);
    const body = await readBody(req);
    const query = Object.fromEntries(url.searchParams.entries());
    const vercelReq = {
      method: req.method,
      url: req.url,
      headers: req.headers,
      query,
      body: body || {},
    };
    const vercelRes = createVercelResponse(res);
    await handler(vercelReq, vercelRes);
  } catch (error) {
    console.error("[legacy-api] Request failed:", url.pathname, error);
    if (!res.headersSent) {
      sendJson(res, 500, {
        error: true,
        code: "LEGACY_API_ERROR",
        message: error?.message || "Erro interno na API legada",
      });
    }
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[legacy-api] Listening on http://127.0.0.1:${PORT}`);
});
