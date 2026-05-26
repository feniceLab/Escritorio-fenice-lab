import fs from "node:fs";
import path from "node:path";
import type { ClientLibraryManifestEntry } from "@/lib/client-library-manifest";
import type { LibrarySeedItem } from "@/lib/fenix-library-defaults";

interface ClientHubImportRow {
  clientSlug: string;
  clientName: string;
  tenant: string;
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

interface DetectedReportRow {
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

interface LocalArtifactSummary {
  slug: string;
  title: string;
  filePath: string;
  summary: string;
}

const EXTRA_REPO_ARTIFACTS_BY_CLIENT: Record<string, string[]> = {
  "oklahoma-burger": ["Visao_Macro_Oklahoma_Burger.html"],
  "mestre-do-frango": ["Visao_Macro_MDF_PF.html"],
};

const REPORT_CLIENT_ALIASES: Record<string, string> = {
  "mestre-do-frango-passo-fundo": "mestre-do-frango",
  "patricia-salgados": "patricia-salgados",
  "pizzaria-do-nei": "pizzaria-do-nei",
};

let cachedImportRows: ClientHubImportRow[] | null = null;
let cachedDetectedReports: DetectedReportRow[] | null = null;

function getRepoRoot() {
  return path.resolve(/* turbopackIgnore: true */ process.cwd(), "..");
}

function normalizeKey(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/['".]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseNullable(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.toUpperCase() === "NULL") return null;
  return trimmed;
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

      values.push(parseNullable(token));
    }

    while (index < valuesBlock.length && /\s/.test(valuesBlock[index]!)) index += 1;
    if (valuesBlock[index] === ",") index += 1;
  }

  return values;
}

function parseClientHubImportRows() {
  if (cachedImportRows) return cachedImportRows;

  const sqlPath = path.join(getRepoRoot(), "SQL_CLIENT_HUB_IMPORT.sql");
  if (!fs.existsSync(sqlPath)) {
    cachedImportRows = [];
    return cachedImportRows;
  }

  const sql = fs.readFileSync(sqlPath, "utf-8");
  const pattern = /INSERT INTO client_hub\s*\(([\s\S]*?)\)\s*VALUES\s*\(([\s\S]*?)\)\s*ON CONFLICT/g;
  const rows: ClientHubImportRow[] = [];

  for (const match of sql.matchAll(pattern)) {
    const columns = match[1]!
      .split(",")
      .map((column) => column.trim())
      .filter(Boolean);
    const values = parseSqlValues(match[2]!);
    const row = Object.fromEntries(columns.map((column, columnIndex) => [column, values[columnIndex] ?? null]));

    let socialLinks: Record<string, string> = {};
    const socialValue = parseNullable(String(row.social_links ?? ""));
    if (socialValue) {
      try {
        socialLinks = JSON.parse(socialValue);
      } catch {
        socialLinks = {};
      }
    }

    rows.push({
      clientSlug: String(row.client_slug ?? ""),
      clientName: String(row.client_name ?? ""),
      tenant: String(row.tenant ?? ""),
      segment: parseNullable(String(row.segment ?? "")),
      responsible: parseNullable(String(row.responsible ?? "")),
      status: parseNullable(String(row.status ?? "")),
      contractPackage: parseNullable(String(row.contract_package ?? "")),
      websiteUrl: parseNullable(String(row.website_url ?? "")),
      driveFolderUrl: parseNullable(String(row.drive_folder_url ?? "")),
      approvalUrl: parseNullable(String(row.approval_url ?? "")),
      logoUrl: parseNullable(String(row.logo_url ?? "")),
      socialLinks,
      notes: parseNullable(String(row.notes ?? "")),
    });
  }

  cachedImportRows = rows;
  return rows;
}

function parseDetectedReports() {
  if (cachedDetectedReports) return cachedDetectedReports;

  const reportsPath = path.join(getRepoRoot(), "relatorios-detectados.json");
  if (!fs.existsSync(reportsPath)) {
    cachedDetectedReports = [];
    return cachedDetectedReports;
  }

  try {
    const raw = fs.readFileSync(reportsPath, "utf-8").replace(/^\uFEFF/, "");
    const payload = JSON.parse(raw) as {
      reports?: DetectedReportRow[];
    };
    cachedDetectedReports = Array.isArray(payload.reports) ? payload.reports : [];
  } catch {
    cachedDetectedReports = [];
  }

  return cachedDetectedReports;
}

function resolveImportRow(entry: ClientLibraryManifestEntry) {
  const rows = parseClientHubImportRows();
  const byKey = new Map(rows.map((row) => [normalizeKey(row.clientName), row]));
  const candidates = [
    entry.clientName,
    entry.source.sourceLabel,
    entry.source.sharedBrandKey,
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    const match = byKey.get(normalizeKey(candidate));
    if (match) return match;
  }

  return null;
}

function readLocalArtifactSummary(fileName: string): LocalArtifactSummary | null {
  if (fileName === "relatorios-detectados.json") return null;

  const absolutePath = path.join(/* turbopackIgnore: true */ getRepoRoot(), fileName);
  if (!fs.existsSync(absolutePath)) return null;

  const extension = path.extname(fileName).toLowerCase();
  if (extension === ".html") {
    const html = fs.readFileSync(absolutePath, "utf-8");
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const text = html
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return {
      slug: normalizeKey(fileName.replace(/\.html$/i, "")),
      title: titleMatch?.[1]?.trim() || fileName,
      filePath: absolutePath,
      summary: text.slice(0, 280),
    };
  }

  return {
    slug: normalizeKey(fileName),
    title: fileName,
    filePath: absolutePath,
    summary: "Artefato local detectado no repositório e associado a esta biblioteca.",
  };
}

function buildImportSummary(entry: ClientLibraryManifestEntry, row: ClientHubImportRow) {
  const socialKeys = Object.keys(row.socialLinks);

  return [
    `# Importação consolidada — ${entry.clientName}`,
    "",
    `- Fonte importada: ${row.clientName}`,
    `- Tenant: ${row.tenant}`,
    row.segment ? `- Segmento: ${row.segment}` : null,
    row.responsible ? `- Responsável: ${row.responsible}` : null,
    row.status ? `- Status: ${row.status}` : null,
    row.contractPackage ? `- Pacote/contrato: ${row.contractPackage}` : null,
    row.websiteUrl ? `- Website: ${row.websiteUrl}` : null,
    row.driveFolderUrl ? `- Drive: ${row.driveFolderUrl}` : null,
    row.approvalUrl ? `- Aprovação: ${row.approvalUrl}` : null,
    row.logoUrl ? `- Logo: ${row.logoUrl}` : null,
    socialKeys.length > 0 ? `- Redes mapeadas: ${socialKeys.join(", ")}` : null,
    row.notes ? "" : null,
    row.notes ? "## Observações" : null,
    row.notes ?? null,
  ].filter(Boolean).join("\n");
}

function buildSocialLinksDocument(links: Record<string, string>) {
  const entries = Object.entries(links);
  if (entries.length === 0) return null;

  return [
    "# Links sociais consolidados",
    "",
    ...entries.map(([platform, url]) => `- ${platform}: ${url}`),
  ].join("\n");
}

function buildDetectedReportItems(entry: ClientLibraryManifestEntry): LibrarySeedItem[] {
  const reports = parseDetectedReports();
  const targetKey = normalizeKey(entry.clientName);

  return reports
    .filter((report) => {
      const reportKey = REPORT_CLIENT_ALIASES[normalizeKey(report.clientName)] ?? normalizeKey(report.clientName);
      return reportKey === targetKey;
    })
    .map((report) => ({
      layer: "documents",
      group: "docs",
      category: `detected-report-${normalizeKey(report.filename || report.periodLabel || entry.clientName)}`,
      name: `Relatório detectado — ${report.periodLabel || report.filename}`,
      content: [
        `# Relatório detectado — ${entry.clientName}`,
        "",
        `- Arquivo: ${report.filename}`,
        report.periodLabel ? `- Período: ${report.periodLabel}` : null,
        report.periodFromFilename ? `- Faixa detectada: ${report.periodFromFilename}` : null,
        report.fileDate ? `- Data do arquivo: ${report.fileDate}` : null,
        report.filepath ? `- Caminho de origem: ${report.filepath}` : null,
      ].filter(Boolean).join("\n"),
      metadata: {
        source: "detected-report",
        placeholder: false,
        originalPath: report.filepath,
        filename: report.filename,
      },
    }));
}

function buildLocalArtifactItems(entry: ClientLibraryManifestEntry): LibrarySeedItem[] {
  const files = new Set<string>([
    ...entry.source.repoArtifacts,
    ...(EXTRA_REPO_ARTIFACTS_BY_CLIENT[normalizeKey(entry.clientName)] ?? []),
  ]);

  const items: LibrarySeedItem[] = [];
  for (const fileName of files) {
    const artifact = readLocalArtifactSummary(fileName);
    if (!artifact) continue;

    items.push({
      layer: "documents",
      group: "docs",
      category: `repo-artifact-${artifact.slug}`,
      name: `Artefato local — ${artifact.title}`,
      content: [
        `# Artefato local — ${entry.clientName}`,
        "",
        `- Arquivo: ${path.basename(artifact.filePath)}`,
        `- Caminho: ${artifact.filePath}`,
        "",
        "## Resumo",
        artifact.summary,
      ].join("\n"),
      metadata: {
        source: "repo-artifact",
        placeholder: false,
        originalPath: artifact.filePath,
      },
    });
  }

  return [...items, ...buildDetectedReportItems(entry)];
}

export function buildImportedLibrarySeed(entry: ClientLibraryManifestEntry): LibrarySeedItem[] {
  const items: LibrarySeedItem[] = [];
  const importRow = resolveImportRow(entry);

  if (importRow) {
    items.push({
      layer: "documents",
      group: "docs",
      category: "import-summary",
      name: `Importação consolidada — ${entry.clientName}`,
      content: buildImportSummary(entry, importRow),
      metadata: {
        source: "client-hub-import",
        placeholder: false,
        importedClientName: importRow.clientName,
      },
    });

    if (importRow.contractPackage) {
      items.push({
        layer: "documents",
        group: "docs",
        category: "contract-package",
        name: `Pacote contratado — ${entry.clientName}`,
        content: `# Pacote contratado — ${entry.clientName}\n\n${importRow.contractPackage}`,
        metadata: {
          source: "client-hub-import",
          placeholder: false,
        },
      });
    }

    if (importRow.websiteUrl) {
      items.push({
        layer: "documents",
        group: "docs",
        category: "website-source",
        name: `Website oficial — ${entry.clientName}`,
        content: `# Website oficial — ${entry.clientName}\n\n${importRow.websiteUrl}`,
        metadata: {
          source: "client-hub-import",
          placeholder: false,
          originalUrl: importRow.websiteUrl,
        },
      });
    }

    if (importRow.driveFolderUrl) {
      items.push({
        layer: "documents",
        group: "docs",
        category: "drive-source",
        name: `Drive de materiais — ${entry.clientName}`,
        content: `# Drive de materiais — ${entry.clientName}\n\n${importRow.driveFolderUrl}`,
        metadata: {
          source: "client-hub-import",
          placeholder: false,
          originalUrl: importRow.driveFolderUrl,
        },
      });
    }

    if (importRow.approvalUrl) {
      items.push({
        layer: "documents",
        group: "docs",
        category: "approval-source",
        name: `Canva de aprovação — ${entry.clientName}`,
        content: `# Canva de aprovação — ${entry.clientName}\n\n${importRow.approvalUrl}`,
        metadata: {
          source: "client-hub-import",
          placeholder: false,
          originalUrl: importRow.approvalUrl,
        },
      });
    }

    if (importRow.logoUrl) {
      items.push({
        layer: "documents",
        group: "docs",
        category: "logo-source",
        name: `Logo oficial — ${entry.clientName}`,
        content: `# Logo oficial — ${entry.clientName}\n\n${importRow.logoUrl}\n\nObservação: o arquivo oficial atual está mapeado como referência externa.`,
        metadata: {
          source: "client-hub-import",
          placeholder: false,
          originalUrl: importRow.logoUrl,
          assetType: "logo-reference",
        },
      });
    }

    const socialDocument = buildSocialLinksDocument(importRow.socialLinks);
    if (socialDocument) {
      items.push({
        layer: "documents",
        group: "docs",
        category: "social-links-source",
        name: `Links sociais — ${entry.clientName}`,
        content: socialDocument,
        metadata: {
          source: "client-hub-import",
          placeholder: false,
          socialPlatforms: Object.keys(importRow.socialLinks),
        },
      });
    }
  }

  return [...items, ...buildLocalArtifactItems(entry)];
}
