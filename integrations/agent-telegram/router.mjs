#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { OpenClawGateway } = require("../../escritorio/src/lib/openclaw-gateway.js");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnvFile(process.env.AGENT_TELEGRAM_ENV || path.join(__dirname, ".env"));

const DEFAULT_MANIFEST = path.join(__dirname, "agents.manifest.json");
const manifestPath = process.env.AGENT_TELEGRAM_MANIFEST || DEFAULT_MANIFEST;
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

const memoryRoot = process.env.AGENT_TELEGRAM_MEMORY_ROOT || manifest.memoryRoot || path.resolve("agent-memory");
const stateDir = process.env.AGENT_TELEGRAM_STATE_DIR || path.resolve(".runtime/agent-telegram");
const openclawBaseUrl = process.env.OPENCLAW_BASE_URL || manifest.openclaw?.baseUrl || "http://127.0.0.1:18789";
const openclawToken = process.env[manifest.openclaw?.tokenEnv || "OPENCLAW_TOKEN"] || process.env.OPENCLAW_TOKEN || "";
const pollMs = Number(process.env.AGENT_TELEGRAM_POLL_MS || 1200);
const maxResponseChars = Number(process.env.AGENT_TELEGRAM_MAX_RESPONSE_CHARS || 3500);
const importanceMin = Number(process.env.AGENT_TELEGRAM_MEMORY_IMPORTANCE_MIN || 0.62);

if (!openclawToken) {
  console.error("[agent-telegram] OPENCLAW_TOKEN is required.");
  process.exit(1);
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

fs.mkdirSync(memoryRoot, { recursive: true });
fs.mkdirSync(stateDir, { recursive: true });

const agents = manifest.agents
  .map((agent) => ({
    ...agent,
    token: process.env[agent.telegram?.tokenEnv || ""],
  }))
  .filter((agent) => agent.telegram?.enabled !== false || agent.token)
  .filter((agent) => Boolean(agent.token));

const groupChatId = process.env[manifest.group?.chatIdEnv || "TELEGRAM_AGENTS_GROUP_ID"] || "";
const groupEnabled = Boolean(groupChatId && manifest.group?.enabled !== false);

if (agents.length === 0) {
  console.error("[agent-telegram] No Telegram bot tokens were found. Fill .env and enable agents.");
  process.exit(1);
}

const gateway = new OpenClawGateway();
await gateway.connect(openclawBaseUrl, openclawToken);
console.log(`[agent-telegram] Connected to OpenClaw at ${openclawBaseUrl}`);
console.log(`[agent-telegram] Enabled bots: ${agents.map((agent) => agent.displayName).join(", ")}`);

function agentMemoryDir(agent) {
  return path.join(memoryRoot, agent.memorySlug || agent.id);
}

function ensureAgentMemory(agent) {
  const root = agentMemoryDir(agent);
  const rawTelegram = path.join(root, "raw", "telegram");
  const rawOffice = path.join(root, "raw", "escritorio");
  const rawOpenClaw = path.join(root, "raw", "openclaw");
  fs.mkdirSync(rawTelegram, { recursive: true });
  fs.mkdirSync(rawOffice, { recursive: true });
  fs.mkdirSync(rawOpenClaw, { recursive: true });

  writeIfMissing(path.join(root, "profile.md"), [
    `# ${agent.displayName}`,
    "",
    `- ID canonico: ${agent.id}`,
    `- Pronuncia/nome publico: ${agent.pronunciation || agent.displayName}`,
    `- OpenClaw agentId: ${agent.openclawAgentId}`,
    `- NPC do escritorio: ${agent.officeNpcId || "n/a"}`,
    `- Papel: ${agent.role || "Agente do escritorio"}`,
    `- Aliases: ${(agent.aliases || []).join(", ")}`,
    "",
    "## Regra",
    "Esta identidade e a mesma no escritorio, no OpenClaw e no Telegram.",
  ].join("\n"));
  writeIfMissing(path.join(root, "long-term.md"), `# Memoria de longo prazo - ${agent.displayName}\n\n`);
  writeIfMissing(path.join(root, "telegram-summary.md"), `# Resumo Telegram - ${agent.displayName}\n\n`);
  writeIfMissing(path.join(root, "escritorio-summary.md"), `# Resumo Escritorio - ${agent.displayName}\n\n`);
  writeIfMissing(path.join(root, "working-context.md"), `# Contexto de trabalho - ${agent.displayName}\n\n`);
}

function writeIfMissing(file, content) {
  if (!fs.existsSync(file)) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content, "utf8");
  }
}

for (const agent of agents) ensureAgentMemory(agent);

function statePath(agent) {
  return path.join(stateDir, `${agent.id}.json`);
}

function readState(agent) {
  try {
    return JSON.parse(fs.readFileSync(statePath(agent), "utf8"));
  } catch {
    return { offset: 0 };
  }
}

function writeState(agent, state) {
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(statePath(agent), `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

async function telegramApi(agent, method, body) {
  const res = await fetch(`https://api.telegram.org/bot${agent.token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) {
    throw new Error(`Telegram ${method} failed: ${res.status} ${JSON.stringify(data)}`);
  }
  return data.result;
}

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

function appendRawTelegram(agent, entry) {
  const file = path.join(agentMemoryDir(agent), "raw", "telegram", `${todayStamp()}.jsonl`);
  fs.appendFileSync(file, `${JSON.stringify(entry)}\n`, "utf8");
}

function appendMemoryLine(agent, fileName, line) {
  const file = path.join(agentMemoryDir(agent), fileName);
  fs.appendFileSync(file, `${line}\n`, "utf8");
}

function readMemoryFile(agent, fileName, maxChars = 5000) {
  const file = path.join(agentMemoryDir(agent), fileName);
  try {
    const text = fs.readFileSync(file, "utf8");
    return text.length > maxChars ? text.slice(-maxChars) : text;
  } catch {
    return "";
  }
}

function detectMentionedAgent(text) {
  const normalized = normalizeText(text);
  return agents.find((agent) => (agent.aliases || [agent.displayName]).some((alias) => {
    const candidate = normalizeText(alias);
    return candidate && normalized.includes(candidate);
  }));
}

function normalizeText(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function estimateImportance(text) {
  const normalized = normalizeText(text);
  let score = 0;
  const markers = [
    "lembre", "memoria", "importante", "cliente", "senha", "token",
    "prazo", "decisao", "tarefa", "reuniao", "contrato", "erro",
    "problema", "bug", "aprovado", "cancelado", "urgente"
  ];
  for (const marker of markers) {
    if (normalized.includes(marker)) score += 0.12;
  }
  if (text.length > 220) score += 0.15;
  if (/[0-9]{2}\/[0-9]{2}|20[0-9]{2}|r\$|https?:\/\//i.test(text)) score += 0.12;
  return Math.min(1, score);
}

function buildPrompt(agent, message, meta) {
  const profile = readMemoryFile(agent, "profile.md", 3000);
  const longTerm = readMemoryFile(agent, "long-term.md", 6000);
  const telegramSummary = readMemoryFile(agent, "telegram-summary.md", 6000);
  const officeSummary = readMemoryFile(agent, "escritorio-summary.md", 4000);
  const workingContext = readMemoryFile(agent, "working-context.md", 4000);

  return [
    "Voce esta respondendo pelo Telegram, mas e a mesma identidade do escritorio virtual.",
    "Responda em Portugues do Brasil, com objetividade e memoria operacional.",
    "Use a memoria abaixo como contexto. Consulte memoria bruta apenas quando uma ferramenta ou instrucao explicita permitir.",
    "",
    profile,
    "",
    "## Memoria de longo prazo",
    longTerm,
    "",
    "## Resumo Telegram",
    telegramSummary,
    "",
    "## Resumo Escritorio",
    officeSummary,
    "",
    "## Contexto de trabalho",
    workingContext,
    "",
    "## Origem da mensagem",
    `Canal: ${meta.isGroup ? "grupo-telegram-agentes" : "telegram-direto"}`,
    `Usuario: ${meta.fromName || "desconhecido"}`,
    `Chat: ${meta.chatId}`,
    "",
    "## Mensagem",
    message,
    "",
    "Ao final, se houver algo importante para memoria, acrescente um bloco curto:",
    "```memory",
    "- fato importante aqui",
    "```",
    "Se nao houver nada importante, nao use bloco de memoria.",
  ].join("\n");
}

function extractMemoryBlock(response) {
  const match = String(response || "").match(/```memory\s*([\s\S]*?)```/i);
  if (!match) return { clean: response, memory: "" };
  const memory = match[1].trim();
  const clean = String(response).replace(match[0], "").trim();
  return { clean, memory };
}

async function sendToOpenClaw(agent, sessionKey, prompt) {
  let full = "";
  const response = await gateway.chatSend(
    agent.openclawAgentId,
    sessionKey,
    prompt,
    (chunk) => { full += chunk; },
  );
  return response || full;
}

function splitTelegramMessage(text) {
  const chunks = [];
  let remaining = String(text || "").trim();
  if (!remaining) return ["OK."];
  while (remaining.length > maxResponseChars) {
    chunks.push(remaining.slice(0, maxResponseChars));
    remaining = remaining.slice(maxResponseChars);
  }
  chunks.push(remaining);
  return chunks;
}

async function handleMessage(agent, message, updateId) {
  const text = message.text || message.caption || "";
  if (!text.trim()) return;

  const chatId = message.chat.id;
  const isGroup = message.chat.type === "group" || message.chat.type === "supergroup";
  const fromName = [message.from?.first_name, message.from?.last_name].filter(Boolean).join(" ") || message.from?.username || "";
  const targetAgent = isGroup ? (detectMentionedAgent(text) || agents.find((a) => a.id === manifest.group?.defaultAgentId) || agent) : agent;

  if (isGroup && groupChatId && String(chatId) !== String(groupChatId)) return;
  if (isGroup && targetAgent.id !== agent.id) return;

  const receivedAt = new Date().toISOString();
  const rawEntry = {
    updateId,
    receivedAt,
    source: "telegram",
    botAgentId: agent.id,
    targetAgentId: targetAgent.id,
    chatId,
    messageId: message.message_id,
    from: message.from || null,
    chat: message.chat || null,
    text,
  };
  appendRawTelegram(targetAgent, rawEntry);

  const importance = estimateImportance(text);
  appendMemoryLine(
    targetAgent,
    "telegram-summary.md",
    `- ${receivedAt} | ${fromName || "usuario"}: ${text.slice(0, 500).replace(/\n/g, " ")}`
  );
  if (importance >= importanceMin) {
    appendMemoryLine(
      targetAgent,
      "long-term.md",
      `- ${receivedAt} | Telegram | ${fromName || "usuario"}: ${text.slice(0, 700).replace(/\n/g, " ")}`
    );
  }

  await telegramApi(agent, "sendChatAction", { chat_id: chatId, action: "typing" }).catch(() => {});

  const sessionKey = `telegram:${targetAgent.id}:${chatId}`;
  const prompt = buildPrompt(targetAgent, text, { chatId, fromName, isGroup });
  const response = await sendToOpenClaw(targetAgent, sessionKey, prompt);
  const { clean, memory } = extractMemoryBlock(response);

  if (memory) {
    appendMemoryLine(targetAgent, "long-term.md", `- ${new Date().toISOString()} | ${memory.replace(/\n/g, " ")}`);
  }

  appendRawTelegram(targetAgent, {
    updateId,
    receivedAt: new Date().toISOString(),
    source: "telegram-response",
    botAgentId: agent.id,
    targetAgentId: targetAgent.id,
    chatId,
    replyToMessageId: message.message_id,
    text: clean,
  });

  for (const chunk of splitTelegramMessage(clean)) {
    await telegramApi(agent, "sendMessage", {
      chat_id: chatId,
      text: chunk,
      reply_to_message_id: isGroup ? message.message_id : undefined,
      disable_web_page_preview: true,
    });
  }
}

async function pollAgent(agent) {
  const state = readState(agent);
  const updates = await telegramApi(agent, "getUpdates", {
    offset: state.offset || 0,
    timeout: 25,
    allowed_updates: ["message"],
  });

  for (const update of updates) {
    state.offset = update.update_id + 1;
    writeState(agent, state);
    try {
      if (update.message) await handleMessage(agent, update.message, update.update_id);
    } catch (error) {
      console.error(`[agent-telegram] ${agent.id} update ${update.update_id} failed:`, error);
      try {
        const chatId = update.message?.chat?.id;
        if (chatId) {
          await telegramApi(agent, "sendMessage", {
            chat_id: chatId,
            text: "Tive um erro ao processar essa mensagem. Vou registrar e tentar novamente quando o serviço estabilizar.",
          });
        }
      } catch {
        // ignore notification failure
      }
    }
  }
}

let stopping = false;
process.on("SIGINT", () => { stopping = true; gateway.disconnect(); });
process.on("SIGTERM", () => { stopping = true; gateway.disconnect(); });

async function loop(agent) {
  while (!stopping) {
    try {
      await pollAgent(agent);
    } catch (error) {
      console.error(`[agent-telegram] poll failed for ${agent.id}:`, error.message || error);
      await new Promise((resolve) => setTimeout(resolve, Math.max(5000, pollMs)));
    }
    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }
}

await Promise.all(agents.map((agent) => loop(agent)));
