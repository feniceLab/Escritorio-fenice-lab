#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.STARKEN_OS_ROOT || path.resolve(__dirname, "..");
const HTML_PATH = process.env.STARKEN_HTML_PATH || path.join(ROOT, "checklist-relatorios.html");
const DATA_ROOT = process.env.LOCAL_SUPABASE_DATA_ROOT || path.join(ROOT, "workspace-data", "local-supabase");
const TABLE_ROOT = path.join(DATA_ROOT, "tables");

const DEFAULT_TABLES = [
  "meta_config",
  "publish_history",
  "publish_queue",
  "content_groups",
  "content_tasks",
  "content_comments",
  "content_attachments",
  "content_activity",
  "cronograma_status",
  "clients",
  "reports",
  "client_info",
  "client_hub",
  "client_hub_materials",
  "client_hub_activity",
  "ai_generation_history",
  "video_renders",
  "traffic_groups",
  "traffic_tasks",
  "traffic_comments",
  "traffic_attachments",
  "traffic_activity",
  "users",
  "spaces",
  "sections",
  "projects",
  "tasks",
  "schedules",
  "schedule_items",
  "activity_log",
  "clients_v2",
  "asana_config",
  "asana_projects",
  "asana_sections",
  "asana_custom_fields",
];

function readConfigFromHtml() {
  const html = fs.readFileSync(HTML_PATH, "utf8");
  const url = process.env.REMOTE_SUPABASE_URL
    || html.match(/const\s+SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/)?.[1]
    || html.match(/var\s+SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/)?.[1];
  const key = process.env.REMOTE_SUPABASE_KEY
    || html.match(/const\s+SUPABASE_KEY\s*=\s*['"]([^'"]+)['"]/)?.[1]
    || html.match(/var\s+SUPABASE_ANON\s*=\s*SUPABASE_KEY/)?.[0] && html.match(/const\s+SUPABASE_KEY\s*=\s*['"]([^'"]+)['"]/)?.[1];

  if (!url || !key) {
    throw new Error("Nao consegui localizar SUPABASE_URL/SUPABASE_KEY. Defina REMOTE_SUPABASE_URL e REMOTE_SUPABASE_KEY.");
  }
  return { url, key };
}

function tablePath(table) {
  return path.join(TABLE_ROOT, `${table.replace(/[^a-zA-Z0-9_-]/g, "_")}.json`);
}

function backupExistingTables() {
  fs.mkdirSync(TABLE_ROOT, { recursive: true });
  const files = fs.existsSync(TABLE_ROOT)
    ? fs.readdirSync(TABLE_ROOT).filter((file) => file.endsWith(".json"))
    : [];
  if (!files.length) return null;

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(DATA_ROOT, "backups", `tables-before-supabase-migration-${stamp}`);
  fs.mkdirSync(backupDir, { recursive: true });
  for (const file of files) {
    fs.copyFileSync(path.join(TABLE_ROOT, file), path.join(backupDir, file));
  }
  return backupDir;
}

async function fetchPage({ url, key, table, offset, limit }) {
  const params = new URLSearchParams({
    select: "*",
    limit: String(limit),
    offset: String(offset),
  });
  const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/${table}?${params}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 300)}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

async function fetchAll(config, table) {
  const limit = Number(process.env.MIGRATION_PAGE_SIZE || 1000);
  const all = [];
  for (let offset = 0; ; offset += limit) {
    const page = await fetchPage({ ...config, table, offset, limit });
    all.push(...page);
    if (page.length < limit) return all;
  }
}

function writeTable(table, rows) {
  fs.mkdirSync(TABLE_ROOT, { recursive: true });
  const file = tablePath(table);
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(rows, null, 2));
  fs.renameSync(tmp, file);
}

async function main() {
  const config = readConfigFromHtml();
  const tables = (process.env.MIGRATION_TABLES || DEFAULT_TABLES.join(","))
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const backupDir = backupExistingTables();
  if (backupDir) console.log(`[migration] Backup local criado em ${backupDir}`);

  const summary = [];
  for (const table of tables) {
    try {
      const rows = await fetchAll(config, table);
      writeTable(table, rows);
      summary.push({ table, rows: rows.length, status: "ok" });
      console.log(`[migration] ${table}: ${rows.length} linha(s)`);
    } catch (error) {
      summary.push({ table, rows: 0, status: "skipped", error: error.message });
      console.warn(`[migration] ${table}: pulada (${error.message})`);
    }
  }

  const reportPath = path.join(DATA_ROOT, "last-supabase-migration-report.json");
  fs.writeFileSync(reportPath, JSON.stringify({
    migratedAt: new Date().toISOString(),
    source: config.url,
    tableRoot: TABLE_ROOT,
    backupDir,
    summary,
  }, null, 2));

  const ok = summary.filter((item) => item.status === "ok").length;
  const skipped = summary.length - ok;
  console.log(`[migration] Concluida: ${ok} tabela(s) migradas, ${skipped} pulada(s).`);
  console.log(`[migration] Relatorio: ${reportPath}`);
}

main().catch((error) => {
  console.error(`[migration] Falhou: ${error.message}`);
  process.exit(1);
});
