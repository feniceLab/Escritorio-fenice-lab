#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnvFile(process.env.AGENT_TELEGRAM_ENV || path.join(__dirname, ".env"));

const manifestPath = process.env.AGENT_TELEGRAM_MANIFEST || path.join(__dirname, "agents.manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const memoryRoot = process.env.AGENT_TELEGRAM_MEMORY_ROOT || manifest.memoryRoot || path.resolve("agent-memory");
const cliAgentsRoot = process.env.DESKRPG_CLI_AGENTS_ROOT || "/var/www/starken-os/.deskrpg-cli-agents";
const openclawAgentsRoot = process.env.OPENCLAW_AGENTS_ROOT || "/var/lib/containers/storage/volumes/openclaw-data/_data/agents";

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeIfChanged(file, content) {
  ensureDir(path.dirname(file));
  if (fs.existsSync(file) && fs.readFileSync(file, "utf8") === content) return false;
  fs.writeFileSync(file, content, "utf8");
  return true;
}

function writeIfMissing(file, content) {
  ensureDir(path.dirname(file));
  if (fs.existsSync(file)) return false;
  fs.writeFileSync(file, content, "utf8");
  return true;
}

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] != null) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

let changed = 0;

for (const agent of manifest.agents || []) {
  const root = path.join(memoryRoot, agent.memorySlug || agent.id);
  ensureDir(path.join(root, "raw", "telegram"));
  ensureDir(path.join(root, "raw", "escritorio"));
  ensureDir(path.join(root, "raw", "openclaw"));

  const profile = [
    `# ${agent.displayName}`,
    "",
    `- ID canonico: ${agent.id}`,
    `- Pronuncia/nome publico: ${agent.pronunciation || agent.displayName}`,
    `- OpenClaw agentId: ${agent.openclawAgentId}`,
    `- NPC do escritorio: ${agent.officeNpcId || "n/a"}`,
    `- Papel: ${agent.role || "Agente do escritorio"}`,
    `- Aliases: ${(agent.aliases || []).join(", ")}`,
    "",
    "Esta identidade e compartilhada entre escritorio, Telegram e OpenClaw.",
  ].join("\n");

  changed += writeIfChanged(path.join(root, "profile.md"), `${profile}\n`) ? 1 : 0;
  for (const file of ["long-term.md", "telegram-summary.md", "escritorio-summary.md", "working-context.md"]) {
    changed += writeIfMissing(path.join(root, file), `# ${file.replace(".md", "")} - ${agent.displayName}\n\n`) ? 1 : 0;
  }

  const memoryInstruction = [
    `# Memoria compartilhada - ${agent.displayName}`,
    "",
    `Use a memoria em: ${root}`,
    "",
    "- Leia `profile.md`, `long-term.md`, `telegram-summary.md`, `escritorio-summary.md` e `working-context.md` antes de responder quando possivel.",
    "- Grave fatos importantes em `long-term.md`.",
    "- Grave resumos de conversa do Telegram em `telegram-summary.md`.",
    "- Grave resumos de conversa do escritorio em `escritorio-summary.md`.",
    "- Consulte `raw/` apenas quando precisar de detalhe historico.",
  ].join("\n");

  const cliAgentDir = path.join(cliAgentsRoot, agent.openclawAgentId);
  if (fs.existsSync(cliAgentDir)) {
    changed += writeIfChanged(path.join(cliAgentDir, "MEMORY.md"), `${memoryInstruction}\n`) ? 1 : 0;
  }

  const openclawAgentDir = path.join(openclawAgentsRoot, agent.openclawAgentId, "agent");
  if (fs.existsSync(openclawAgentDir)) {
    changed += writeIfChanged(path.join(openclawAgentDir, "MEMORY.md"), `${memoryInstruction}\n`) ? 1 : 0;
  }
}

console.log(JSON.stringify({ ok: true, changed, memoryRoot, cliAgentsRoot, openclawAgentsRoot }, null, 2));
