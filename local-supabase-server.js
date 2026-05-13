#!/usr/bin/env node
/* eslint-disable no-console */
"use strict";

const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { URL } = require("node:url");

const ROOT = process.env.STARKEN_OS_ROOT || __dirname;
const PORT = Number(process.env.LOCAL_SUPABASE_PORT || 3020);
const DATA_ROOT = process.env.LOCAL_SUPABASE_DATA_ROOT
  || path.join(ROOT, "workspace-data", "local-supabase");
const TABLE_ROOT = path.join(DATA_ROOT, "tables");
const STORAGE_ROOT = path.join(DATA_ROOT, "storage");

fs.mkdirSync(TABLE_ROOT, { recursive: true });
fs.mkdirSync(STORAGE_ROOT, { recursive: true });

function tablePath(table) {
  return path.join(TABLE_ROOT, `${table.replace(/[^a-zA-Z0-9_-]/g, "_")}.json`);
}

function readTable(table) {
  const file = tablePath(table);
  if (!fs.existsSync(file)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeTable(table, rows) {
  const file = tablePath(table);
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(rows, null, 2));
  fs.renameSync(tmp, file);
}

function coerceValue(value) {
  if (value === "null") return null;
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  // URLSearchParams already decodes query values. Decoding again breaks filters
  // that intentionally contain literal percent signs, such as ilike.%Juan%.
  return value;
}

function compare(rowValue, op, rawValue) {
  if (op === "is") {
    return rawValue === "null" ? rowValue == null : String(rowValue) === rawValue;
  }
  if (op === "not.is") {
    return rawValue === "null" ? rowValue != null : String(rowValue) !== rawValue;
  }
  if (op === "in") {
    const values = rawValue.replace(/^\(|\)$/g, "").split(",").map(coerceValue);
    return values.some((value) => String(rowValue) === String(value));
  }

  const value = coerceValue(rawValue);
  if (op === "eq") return String(rowValue) === String(value);
  if (op === "ilike") {
    const pattern = String(value).replace(/%/g, "").toLowerCase();
    return String(rowValue || "").toLowerCase().includes(pattern);
  }
  if (op === "lte") return String(rowValue) <= String(value);
  if (op === "gte") return String(rowValue) >= String(value);
  if (op === "lt") return String(rowValue) < String(value);
  if (op === "gt") return String(rowValue) > String(value);
  return true;
}

function applyQuery(rows, searchParams) {
  let result = rows.slice();

  for (const [key, value] of searchParams.entries()) {
    if (["select", "order", "limit", "offset"].includes(key)) continue;
    const match = value.match(/^(not\.is|eq|ilike|is|in|lte|gte|lt|gt)\.(.*)$/);
    if (!match) continue;
    const [, op, rawValue] = match;
    result = result.filter((row) => compare(row[key], op, rawValue));
  }

  const order = searchParams.get("order");
  if (order) {
    const [field, direction = "asc"] = order.split(".").filter(Boolean);
    if (field) {
      result.sort((a, b) => {
        const av = a[field] ?? "";
        const bv = b[field] ?? "";
        const cmp = String(av).localeCompare(String(bv), "pt-BR", { numeric: true });
        return direction.startsWith("desc") ? -cmp : cmp;
      });
    }
  }

  const offset = Number(searchParams.get("offset") || 0);
  const limit = Number(searchParams.get("limit") || result.length);
  return result.slice(offset, offset + limit);
}

function applyEmbeddedSelect(table, rows, searchParams) {
  const select = searchParams.get("select") || "";
  if (table === "content_tasks" && select.includes("content_groups")) {
    const groups = readTable("content_groups");
    const groupsById = new Map(groups.map((group) => [String(group.id), group]));
    return rows.map((row) => ({
      ...row,
      content_groups: groupsById.get(String(row.group_id)) || null,
    }));
  }
  return rows;
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return null;
  const buffer = Buffer.concat(chunks);
  const contentType = req.headers["content-type"] || "";
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(buffer.toString("utf8"));
    } catch {
      return {};
    }
  }
  return buffer;
}

function json(res, status, body, extraHeaders = {}) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS, PUT",
    "Access-Control-Allow-Headers": "apikey, Authorization, Content-Type, Prefer",
    ...extraHeaders,
  });
  res.end(JSON.stringify(body));
}

function withIds(input) {
  const now = new Date().toISOString();
  const rows = Array.isArray(input) ? input : [input];
  return rows.map((row) => ({
    id: row.id || randomUUID(),
    ...row,
    created_at: row.created_at || now,
    updated_at: row.updated_at || now,
  }));
}

async function handleRest(req, res, url) {
  const table = decodeURIComponent(url.pathname.replace(/^\/rest\/v1\//, "").split("/")[0] || "");
  if (!table) return json(res, 404, { error: "missing_table" });

  const rows = readTable(table);

  if (req.method === "GET") {
    const queried = applyQuery(rows, url.searchParams);
    return json(res, 200, applyEmbeddedSelect(table, queried, url.searchParams));
  }

  if (req.method === "POST") {
    const body = await readBody(req);
    const incoming = withIds(body || {});
    const byId = new Map(rows.map((row) => [row.id, row]));
    for (const row of incoming) byId.set(row.id, { ...(byId.get(row.id) || {}), ...row });
    const next = Array.from(byId.values());
    writeTable(table, next);
    return json(res, 201, incoming);
  }

  if (req.method === "PATCH") {
    const patch = await readBody(req);
    let updated = [];
    const next = rows.map((row) => {
      const matched = applyQuery([row], url.searchParams).length > 0;
      if (!matched) return row;
      const nextRow = { ...row, ...(patch || {}), updated_at: new Date().toISOString() };
      updated.push(nextRow);
      return nextRow;
    });
    writeTable(table, next);
    return json(res, 200, updated);
  }

  if (req.method === "DELETE") {
    const deleted = [];
    const kept = rows.filter((row) => {
      const matched = applyQuery([row], url.searchParams).length > 0;
      if (matched) deleted.push(row);
      return !matched;
    });
    writeTable(table, kept);
    return json(res, 200, deleted);
  }

  return json(res, 405, { error: "method_not_allowed" });
}

async function handleStorage(req, res, url) {
  const rel = decodeURIComponent(url.pathname.replace(/^\/storage\/v1\/object\/(?:public\/)?/, ""));
  if (!rel || rel.includes("..")) return json(res, 400, { error: "invalid_path" });
  const filePath = path.join(STORAGE_ROOT, rel);

  if (req.method === "GET") {
    if (!fs.existsSync(filePath)) return json(res, 404, { error: "not_found" });
    res.writeHead(200, { "Access-Control-Allow-Origin": "*" });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  if (req.method === "POST" || req.method === "PUT") {
    const body = await readBody(req);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, Buffer.isBuffer(body) ? body : Buffer.from(JSON.stringify(body || {})));
    return json(res, 200, { Key: rel, path: rel });
  }

  return json(res, 405, { error: "method_not_allowed" });
}

http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return json(res, 204, {});
  const url = new URL(req.url || "/", "http://127.0.0.1");
  try {
    if (url.pathname.startsWith("/rest/v1/")) return await handleRest(req, res, url);
    if (url.pathname.startsWith("/storage/v1/object/")) return await handleStorage(req, res, url);
    if (url.pathname === "/health") return json(res, 200, { ok: true, provider: "local-supabase", dataRoot: DATA_ROOT });
    return json(res, 404, { error: "not_found" });
  } catch (error) {
    console.error("[local-supabase] failed:", error);
    return json(res, 500, { error: "internal_error", message: error?.message || "internal error" });
  }
}).listen(PORT, "127.0.0.1", () => {
  console.log(`[local-supabase] Listening on http://127.0.0.1:${PORT}`);
  console.log(`[local-supabase] Data root: ${DATA_ROOT}`);
});
