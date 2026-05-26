"use strict";
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("node:fs");
const path = require("node:path");
const { db, schema, isPostgres, eq, desc } = require("../db/server-db.js");
const { stringifyJson } = require("../db/normalize.js");

const DEFAULT_CONTEXT_CHAR_LIMIT = 4200;
const DEFAULT_FILE_ROOT = path.resolve(process.cwd(), "..", "agent-memory");
const MEMORY_ENABLED = process.env.NPC_MEMORY_ENABLED !== "0";
const FILE_MIRROR_ENABLED = process.env.NPC_MEMORY_FILE_MIRROR !== "0";
const VALID_MEMORY_TYPES = new Set(["fact", "episodic", "summary", "relationship", "working"]);

function maxContextChars() {
  const parsed = Number(process.env.NPC_MEMORY_MAX_CONTEXT_CHARS || DEFAULT_CONTEXT_CHAR_LIMIT);
  return Number.isFinite(parsed) && parsed > 500 ? parsed : DEFAULT_CONTEXT_CHAR_LIMIT;
}

function memoryRoot() {
  return process.env.NPC_MEMORY_FILE_ROOT || DEFAULT_FILE_ROOT;
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function slug(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "npc";
}

function tokenize(value) {
  const stop = new Set([
    "para", "com", "que", "uma", "por", "dos", "das", "como", "isso", "aqui",
    "voce", "voces", "sobre", "mais", "menos", "esse", "essa", "este", "esta",
    "quando", "onde", "qual", "quais", "porque", "tambem", "todo", "tudo",
  ]);
  return normalizeText(value)
    .split(/[^a-z0-9]+/i)
    .filter((token) => token.length >= 3 && !stop.has(token))
    .slice(0, 60);
}

function parseMetadata(metadata) {
  if (!metadata) return {};
  if (typeof metadata === "object") return metadata;
  try {
    return JSON.parse(String(metadata));
  } catch {
    return {};
  }
}

function sameNormalized(a, b) {
  const left = normalizeText(a);
  const right = normalizeText(b);
  return Boolean(left && right && left === right);
}

function scoreMemory(memory, queryTokens, input) {
  const haystack = normalizeText(`${memory.title}\n${memory.content}`);
  const metadata = parseMetadata(memory.metadata);
  let score = memory.pinned ? 12 : 0;
  if (memory.memoryType === "working") score += 7;
  if (memory.memoryType === "fact") score += 5;
  if (memory.memoryType === "summary") score += 4;
  if (memory.memoryType === "relationship") score += 3;
  if (memory.memoryType === "episodic") score += 2;

  if (sameNormalized(metadata.characterId, input.characterId)) score += 14;
  if (sameNormalized(metadata.userId, input.userId)) score += 10;
  if (sameNormalized(metadata.userName, input.userName)) score += 8;
  if (sameNormalized(metadata.telegramChatId, input.telegramChatId)) score += 8;

  for (const token of queryTokens) {
    if (haystack.includes(token)) score += 3;
  }

  const createdAt = memory.createdAt ? new Date(String(memory.createdAt)).getTime() : 0;
  if (createdAt && Date.now() - createdAt < 7 * 24 * 60 * 60 * 1000) score += 2;
  return score;
}

function trimToChars(lines, limit) {
  const selected = [];
  let size = 0;
  for (const line of lines) {
    const nextSize = size + line.length + 1;
    if (nextSize > limit) break;
    selected.push(line);
    size = nextSize;
  }
  return selected;
}

function ensureMemoryFiles(input) {
  if (!FILE_MIRROR_ENABLED) return null;
  const root = path.join(memoryRoot(), slug(input.npcName || input.npcId));
  fs.mkdirSync(path.join(root, "raw", input.source || "escritorio"), { recursive: true });
  fs.mkdirSync(path.join(root, "players"), { recursive: true });

  const profileFile = path.join(root, "profile.md");
  if (!fs.existsSync(profileFile)) {
    fs.writeFileSync(profileFile, [
      `# ${input.npcName || input.npcId}`,
      "",
      `- NPC ID: ${input.npcId}`,
      "- Esta identidade deve ser compartilhada entre escritorio, Telegram e OpenClaw.",
      "",
    ].join("\n"), "utf8");
  }

  for (const fileName of ["long-term.md", "telegram-summary.md", "escritorio-summary.md", "working-context.md"]) {
    const file = path.join(root, fileName);
    if (!fs.existsSync(file)) fs.writeFileSync(file, `# ${fileName.replace(".md", "")} - ${input.npcName || input.npcId}\n\n`, "utf8");
  }

  return root;
}

function appendFileMemory(input) {
  if (!FILE_MIRROR_ENABLED) return;
  try {
    const root = ensureMemoryFiles(input);
    if (!root) return;
    const source = input.source || "escritorio";
    const line = `- ${new Date().toISOString()} | ${input.memoryType} | ${input.title}: ${input.content.replace(/\s+/g, " ").slice(0, 900)}\n`;
    fs.appendFileSync(path.join(root, "long-term.md"), line, "utf8");
    if (source === "telegram") {
      fs.appendFileSync(path.join(root, "telegram-summary.md"), line, "utf8");
    } else if (source === "escritorio" || source === "meeting" || source === "task") {
      fs.appendFileSync(path.join(root, "escritorio-summary.md"), line, "utf8");
    }
    const personKey = input.characterId || input.userName || input.userId || input.telegramChatId;
    if (personKey) {
      const playerFile = path.join(root, "players", `${slug(personKey)}.md`);
      if (!fs.existsSync(playerFile)) {
        fs.writeFileSync(playerFile, [
          `# Memoria da pessoa - ${personKey}`,
          "",
          `NPC: ${input.npcName || input.npcId}`,
          "",
        ].join("\n"), "utf8");
      }
      fs.appendFileSync(playerFile, line, "utf8");
    }
    fs.appendFileSync(
      path.join(root, "raw", source, `${new Date().toISOString().slice(0, 10)}.jsonl`),
      `${JSON.stringify({ at: new Date().toISOString(), ...input })}\n`,
      "utf8",
    );
  } catch (error) {
    console.warn("[npc-memory-runtime] file mirror failed:", error && error.message ? error.message : error);
  }
}

function estimateImportance(text) {
  const normalized = normalizeText(text);
  let score = 0;
  const markers = [
    "lembre", "memoria", "importante", "cliente", "prazo", "decisao", "reuniao",
    "tarefa", "aprovado", "cancelado", "urgente", "token", "senha", "contrato",
    "bug", "erro", "preferencia", "processo", "responsavel", "entrega",
  ];
  for (const marker of markers) {
    if (normalized.includes(marker)) score += 0.12;
  }
  if (String(text || "").length > 180) score += 0.12;
  if (/[0-9]{2}\/[0-9]{2}|20[0-9]{2}|r\$|https?:\/\//i.test(String(text || ""))) score += 0.12;
  return Math.min(1, score);
}

function inferMemoryType(userMessage, npcResponse) {
  const text = normalizeText(`${userMessage}\n${npcResponse || ""}`);
  if (text.includes("lembre") || text.includes("importante") || text.includes("preferencia")) return "fact";
  if (text.includes("reuniao") || text.includes("decisao") || text.includes("alinhamento")) return "summary";
  if (text.includes("tarefa") || text.includes("prazo") || text.includes("responsavel")) return "working";
  return "episodic";
}

function buildMemoryTitle(userMessage) {
  const clean = String(userMessage || "").replace(/\s+/g, " ").trim();
  return clean.length > 90 ? `${clean.slice(0, 87)}...` : clean || "Memoria automatica";
}

async function buildNpcMemoryContext(input) {
  if (!MEMORY_ENABLED || !schema.npcMemoryItems) return "";
  try {
    ensureMemoryFiles(input);
    const rows = await db
      .select()
      .from(schema.npcMemoryItems)
      .where(eq(schema.npcMemoryItems.npcId, input.npcId))
      .orderBy(desc(schema.npcMemoryItems.pinned), desc(schema.npcMemoryItems.updatedAt))
      .limit(120);

    if (!rows || rows.length === 0) return "";

    const tokens = tokenize(input.userMessage);
    const ranked = rows
      .map((memory) => ({ memory, score: scoreMemory(memory, tokens, input) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 18)
      .map(({ memory }) => {
        const content = String(memory.content || "").replace(/\s+/g, " ").trim();
        return `- [${memory.memoryType}] ${memory.title}: ${content.slice(0, 650)}`;
      });

    const selected = trimToChars(ranked, maxContextChars());
    if (selected.length === 0) return "";

    return [
      "<memoria_operacional_do_npc>",
      `NPC: ${input.npcName || input.npcId}`,
      `Origem: ${input.source || "escritorio"}`,
      input.userName || input.characterId ? `Pessoa atual: ${input.userName || input.characterId}` : null,
      "Use esta memoria de forma silenciosa. Nao copie este bloco na resposta.",
      "Priorize fatos fixos, preferencias, tarefas abertas e contexto recente. Ignore o que nao for relevante.",
      ...selected,
      "</memoria_operacional_do_npc>",
    ].filter(Boolean).join("\n");
  } catch (error) {
    console.warn("[npc-memory-runtime] context build failed:", error && error.message ? error.message : error);
    return "";
  }
}

function attachNpcMemoryToPrompt(message, memoryContext) {
  if (!memoryContext || !String(memoryContext).trim()) return message;
  return `${memoryContext}\n\n<mensagem_atual>\n${message}\n</mensagem_atual>`;
}

async function saveNpcConversationMemory(input) {
  if (!MEMORY_ENABLED || !schema.npcMemoryItems) return;

  const combined = `${input.userMessage || ""}\n${input.npcResponse || ""}`.trim();
  const importance = estimateImportance(combined);
  const minImportance = Number(process.env.NPC_MEMORY_IMPORTANCE_MIN || 0.42);
  if (importance < minImportance) return;

  const rawType = input.memoryType || inferMemoryType(input.userMessage, input.npcResponse);
  const memoryType = VALID_MEMORY_TYPES.has(rawType) ? rawType : "episodic";
  const now = isPostgres ? new Date() : new Date().toISOString();
  const title = input.title || buildMemoryTitle(input.userMessage);
  const content = [
    input.userName ? `Pessoa: ${input.userName}` : null,
    input.characterId ? `Personagem ID: ${input.characterId}` : null,
    input.telegramChatId ? `Telegram Chat ID: ${input.telegramChatId}` : null,
    input.userMessage ? `Mensagem: ${String(input.userMessage).replace(/\s+/g, " ").slice(0, 900)}` : null,
    input.npcResponse ? `Resposta do NPC: ${String(input.npcResponse).replace(/\s+/g, " ").slice(0, 900)}` : null,
  ].filter(Boolean).join("\n");

  try {
    await db.insert(schema.npcMemoryItems).values({
      npcId: input.npcId,
      memoryType,
      title,
      content,
      metadata: isPostgres ? {
        source: input.source || "escritorio",
        channelId: input.channelId,
        userId: input.userId,
        characterId: input.characterId,
        userName: input.userName,
        telegramChatId: input.telegramChatId,
        automatic: true,
        importance,
      } : stringifyJson({
        source: input.source || "escritorio",
        channelId: input.channelId,
        userId: input.userId,
        characterId: input.characterId,
        userName: input.userName,
        telegramChatId: input.telegramChatId,
        automatic: true,
        importance,
      }),
      pinned: false,
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    });

    appendFileMemory({
      npcId: input.npcId,
      npcName: input.npcName,
      source: input.source || "escritorio",
      title,
      content,
      memoryType,
      userId: input.userId,
      characterId: input.characterId,
      userName: input.userName,
      telegramChatId: input.telegramChatId,
    });
  } catch (error) {
    console.warn("[npc-memory-runtime] save failed:", error && error.message ? error.message : error);
  }
}

module.exports = {
  attachNpcMemoryToPrompt,
  buildNpcMemoryContext,
  saveNpcConversationMemory,
};
