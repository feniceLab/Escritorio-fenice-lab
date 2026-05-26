import fs from "node:fs";
import path from "node:path";
import { LOCAL_ARTIFACT_PATTERNS, MANUAL_ALIASES } from "./manual-config";
import { decodeSqlString, inferMediaKind, normalizeKey } from "./normalize";

export interface OperationalClient {
  clientSlug: string;
  clientName: string;
  tenant: "starken" | "alpha";
  segment: string;
  responsible: string;
}

export interface ClientHubImportRow {
  clientSlug: string;
  clientName: string;
  tenant: "starken" | "alpha";
  segment: string | null;
  responsible: string | null;
  status: string | null;
  contractPackage: string | null;
  websiteUrl: string | null;
  driveFolderUrl: string | null;
  approvalUrl: string | null;
  logoUrl: string | null;
  socialLinks: Record<string, string>;
  notes: string | null;
}

export interface DetectedReportRow {
  clientName: string;
  company: string;
  filename: string;
  filepath: string;
  year: string | null;
  month: string | null;
  monthName: string | null;
  periodLabel: string | null;
  periodFromFilename: string | null;
  fileDate: string | null;
  fileSize: number | null;
}

export interface LocalArtifact {
  clientSlug: string;
  clientNameGuess: string;
  filePath: string;
  fileName: string;
  title: string;
  summary: string;
  kind: "html" | "pdf" | "json" | "other";
}

export interface TrelloAttachment {
  id: string;
  name: string;
  url: string;
  mimeType: string | null;
  bytes: number | null;
}

export interface TrelloCardAsset {
  clientSlug: string;
  clientNameGuess: string;
  cardId: string;
  cardName: string;
  cardUrl: string | null;
  description: string | null;
  dueAt: string | null;
  labels: string[];
  itemType: "story" | "feed_post" | "carousel" | "video" | "reference" | "document";
  attachments: TrelloAttachment[];
}

export interface ClientSourceManifest {
  operationalClients: OperationalClient[];
  clientHubImportRows: ClientHubImportRow[];
  detectedReports: DetectedReportRow[];
  localArtifacts: LocalArtifact[];
  trelloAssets: TrelloCardAsset[];
}

function repoRootFrom(startDir = process.cwd()) {
  return path.resolve(startDir);
}

function parseSqlValues(valuesBlock: string): (string | null)[] {
  const values: (string | null)[] = [];
  let index = 0;

  while (index < valuesBlock.length) {
    while (index < valuesBlock.length && /\s/.test(valuesBlock[index]!)) index += 1;
    if (index >= valuesBlock.length) break;

    if (valuesBlock.startsWith("NULL", index)) {
      values.push(null);
      index += 4;
    } else if (valuesBlock[index] === "'") {
      index += 1;
      let buffer = "";
      while (index < valuesBlock.length) {
        const char = valuesBlock[index]!;
        if (char === "'") {
          if (valuesBlock[index + 1] === "'") {
            buffer += "'";
            index += 2;
            continue;
          }
          index += 1;
          break;
        }
        buffer += char;
        index += 1;
      }

      while (valuesBlock.slice(index, index + 2) === "::") {
        index += 2;
        while (index < valuesBlock.length && /[a-zA-Z0-9_]/.test(valuesBlock[index]!)) index += 1;
      }

      values.push(buffer);
    } else {
      let token = "";
      let depth = 0;
      while (index < valuesBlock.length) {
        const char = valuesBlock[index]!;
        if (char === "(") depth += 1;
        if (char === ")" && depth > 0) depth -= 1;
        if (char === "," && depth === 0) break;
        token += char;
        index += 1;
      }
      const trimmed = token.trim();
      values.push(trimmed && trimmed.toUpperCase() !== "NULL" ? trimmed : null);
    }

    while (index < valuesBlock.length && /\s/.test(valuesBlock[index]!)) index += 1;
    if (valuesBlock[index] === ",") index += 1;
  }

  return values;
}

export function loadOperationalClients(rootDir = repoRootFrom()) {
  const sqlPath = path.join(rootDir, "SQL_GESTAO_PROJETOS_v2.sql");
  const sql = fs.readFileSync(sqlPath, "utf-8");
  const pattern =
    /\(\(SELECT id FROM spaces WHERE name = '(Fenix|Alpha)'\),\s*'((?:''|[^'])+)',\s*'((?:''|[^'])*)',\s*\(SELECT id FROM users WHERE name = '((?:''|[^'])+)'\)\)/g;

  const rows: OperationalClient[] = [];
  for (const match of sql.matchAll(pattern)) {
    rows.push({
      tenant: match[1]!.toLowerCase() as "starken" | "alpha",
      clientName: decodeSqlString(match[2]!),
      clientSlug: normalizeKey(decodeSqlString(match[2]!)),
      segment: decodeSqlString(match[3]!),
      responsible: decodeSqlString(match[4]!),
    });
  }
  return rows;
}

export function loadClientHubImportRows(rootDir = repoRootFrom()) {
  const sqlPath = path.join(rootDir, "SQL_CLIENT_HUB_IMPORT.sql");
  const sql = fs.readFileSync(sqlPath, "utf-8");
  const pattern = /INSERT INTO client_hub\s*\(([\s\S]*?)\)\s*VALUES\s*\(([\s\S]*?)\)\s*ON CONFLICT/g;
  const rows: ClientHubImportRow[] = [];

  for (const match of sql.matchAll(pattern)) {
    const columns = match[1]!.split(",").map((value) => value.trim()).filter(Boolean);
    const values = parseSqlValues(match[2]!);
    const row = Object.fromEntries(columns.map((column, index) => [column, values[index] ?? null]));
    const socialRaw = row.social_links ? String(row.social_links) : null;
    let socialLinks: Record<string, string> = {};
    if (socialRaw && socialRaw !== "NULL") {
      try {
        socialLinks = JSON.parse(socialRaw);
      } catch {
        socialLinks = {};
      }
    }

    rows.push({
      clientSlug: String(row.client_slug ?? normalizeKey(String(row.client_name ?? ""))),
      clientName: String(row.client_name ?? ""),
      tenant: String(row.tenant ?? "starken").toLowerCase() as "starken" | "alpha",
      segment: row.segment ? String(row.segment) : null,
      responsible: row.responsible ? String(row.responsible) : null,
      status: row.status ? String(row.status) : null,
      contractPackage: row.contract_package ? String(row.contract_package) : null,
      websiteUrl: row.website_url ? String(row.website_url) : null,
      driveFolderUrl: row.drive_folder_url ? String(row.drive_folder_url) : null,
      approvalUrl: row.approval_url ? String(row.approval_url) : null,
      logoUrl: row.logo_url ? String(row.logo_url) : null,
      socialLinks,
      notes: row.notes ? String(row.notes) : null,
    });
  }

  return rows;
}

export function loadDetectedReports(rootDir = repoRootFrom()) {
  const jsonPath = path.join(rootDir, "relatorios-detectados.json");
  if (!fs.existsSync(jsonPath)) return [] as DetectedReportRow[];
  const raw = fs.readFileSync(jsonPath, "utf-8").replace(/^\uFEFF/, "");
  const data = JSON.parse(raw) as { reports?: DetectedReportRow[] };
  return Array.isArray(data.reports) ? data.reports : [];
}

function scanFilesRecursively(startDir: string, maxDepth = 3) {
  const files: string[] = [];
  function walk(currentDir: string, depth: number) {
    if (depth > maxDepth) return;
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      if (entry.name === ".git" || entry.name === "node_modules") continue;
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath, depth + 1);
      } else {
        files.push(fullPath);
      }
    }
  }
  walk(startDir, 0);
  return files;
}

function extractTitleAndSummary(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();
  const raw = fs.readFileSync(filePath, "utf-8");

  if (extension === ".html") {
    const title = raw.match(/<title>(.*?)<\/title>/i)?.[1]?.trim() || path.basename(filePath);
    const summary = raw
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 320);
    return { title, summary };
  }

  return {
    title: path.basename(filePath),
    summary: raw.replace(/\s+/g, " ").trim().slice(0, 320),
  };
}

export function loadLocalArtifacts(rootDir = repoRootFrom()) {
  const files = scanFilesRecursively(rootDir, 2);
  const artifacts: LocalArtifact[] = [];

  for (const filePath of files) {
    const relative = path.relative(rootDir, filePath);
    const lower = relative.toLowerCase();
    const extension = path.extname(relative).toLowerCase();
    if (![".html", ".pdf", ".json", ".md"].includes(extension)) continue;
    if (!LOCAL_ARTIFACT_PATTERNS.some((pattern) => lower.includes(pattern))) continue;
    if (lower.includes("parallel-client-library")) continue;

    const { title, summary } = extractTitleAndSummary(filePath);
    const tokens = normalizeKey(`${relative} ${title}`).split("-").filter(Boolean);
    const guess = tokens.slice(0, 4).join(" ");

    artifacts.push({
      clientSlug: normalizeKey(guess),
      clientNameGuess: guess,
      filePath,
      fileName: path.basename(filePath),
      title,
      summary,
      kind: extension === ".html" ? "html" : extension === ".pdf" ? "pdf" : extension === ".json" ? "json" : "other",
    });
  }

  return artifacts;
}

function parseTrelloListName(listName: string) {
  const tenant = listName.toUpperCase().startsWith("ALPHA |") ? "alpha" : "starken";
  let core = listName.replace(/^ALPHA \|/i, "").replace(/^STARKEN \|/i, "").trim();
  core = core.replace(/\(STANDBY\)/gi, "").trim();
  core = core.replace(/\((BRUNA|MARINA|EMILLY|EMILY)\)/gi, "").trim();
  if (core.includes(",")) core = core.split(",")[0]!.trim();
  return {
    tenant,
    clientNameGuess: core,
    clientSlug: normalizeKey(core),
  };
}

function classifyTrelloCard(card: {
  name?: string;
  desc?: string;
  labels?: Array<{ name?: string }>;
  attachments?: Array<{ url?: string; name?: string; mimeType?: string; bytes?: number }>;
}) {
  const labels = (card.labels ?? []).map((label) => label.name ?? "").filter(Boolean);
  const haystack = `${card.name ?? ""} ${card.desc ?? ""} ${labels.join(" ")}`.toLowerCase();
  const attachments = card.attachments ?? [];
  const imageCount = attachments.filter((attachment) => inferMediaKind(attachment.mimeType || attachment.url) === "image").length;
  const videoCount = attachments.filter((attachment) => inferMediaKind(attachment.mimeType || attachment.url) === "video").length;

  if (haystack.includes("story")) return "story" as const;
  if (videoCount > 0 || haystack.includes("reel") || haystack.includes("video")) return "video" as const;
  if (imageCount > 1 || haystack.includes("carrossel") || haystack.includes("carousel")) return "carousel" as const;
  if (imageCount === 1) return "feed_post" as const;
  if (attachments.length > 0) return "reference" as const;
  return "document" as const;
}

export function loadTrelloAssets(rootDir = repoRootFrom()) {
  const exportPath = path.join(rootDir, "Exportacao Trello", "8kSs8AcB - starken-alpha.json");
  if (!fs.existsSync(exportPath)) return [] as TrelloCardAsset[];

  const payload = JSON.parse(fs.readFileSync(exportPath, "utf-8").replace(/^\uFEFF/, "")) as {
    lists?: Array<{ id: string; name: string }>;
    cards?: Array<{
      id: string;
      idList: string;
      name: string;
      desc?: string;
      due?: string | null;
      url?: string;
      labels?: Array<{ name?: string }>;
      attachments?: Array<{ id?: string; name?: string; url?: string; mimeType?: string; bytes?: number }>;
    }>;
  };

  const relevantLists = new Map<string, { clientSlug: string; clientNameGuess: string; tenant: string }>();
  for (const list of payload.lists ?? []) {
    if (!/\|/.test(list.name)) continue;
    const parsed = parseTrelloListName(list.name);
    relevantLists.set(list.id, parsed);
  }

  const assets: TrelloCardAsset[] = [];
  for (const card of payload.cards ?? []) {
    const list = relevantLists.get(card.idList);
    if (!list) continue;
    const hasAttachments = (card.attachments ?? []).length > 0;
    const hasDescription = Boolean(card.desc?.trim());
    if (!hasAttachments && !hasDescription) continue;

    assets.push({
      clientSlug: list.clientSlug,
      clientNameGuess: list.clientNameGuess,
      cardId: card.id,
      cardName: card.name,
      cardUrl: card.url ?? null,
      description: card.desc?.trim() || null,
      dueAt: card.due ?? null,
      labels: (card.labels ?? []).map((label) => label.name ?? "").filter(Boolean),
      itemType: classifyTrelloCard(card),
      attachments: (card.attachments ?? [])
        .filter((attachment) => attachment.url)
        .map((attachment) => ({
          id: attachment.id ?? `${card.id}-${normalizeKey(attachment.name ?? attachment.url ?? "attachment")}`,
          name: attachment.name ?? "Attachment",
          url: attachment.url ?? "",
          mimeType: attachment.mimeType ?? null,
          bytes: attachment.bytes ?? null,
        })),
    });
  }

  return assets;
}

export function buildClientSourceManifest(rootDir = repoRootFrom()): ClientSourceManifest {
  return {
    operationalClients: loadOperationalClients(rootDir),
    clientHubImportRows: loadClientHubImportRows(rootDir),
    detectedReports: loadDetectedReports(rootDir),
    localArtifacts: loadLocalArtifacts(rootDir),
    trelloAssets: loadTrelloAssets(rootDir),
  };
}

export function buildAliasSetForClient(clientSlug: string, clientName: string, importRows: ClientHubImportRow[]) {
  const aliases = new Set<string>([clientName, clientSlug]);
  for (const manualAlias of MANUAL_ALIASES[clientSlug] ?? []) aliases.add(manualAlias);
  for (const row of importRows) {
    if (row.clientSlug === clientSlug) aliases.add(row.clientName);
  }
  return [...aliases].map((alias) => alias.trim()).filter(Boolean);
}
