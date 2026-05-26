import fs from "node:fs";
import path from "node:path";
import { desc, eq } from "drizzle-orm";
import { db, isPostgres, jsonForDb, npcMemoryItems } from "../db/index.ts";

type MemoryType = "fact" | "episodic" | "summary" | "relationship" | "working";

type NpcMemoryRow = {
  id: string;
  npcId: string;
  memoryType: string;
  title: string;
  content: string;
  metadata?: unknown;
  pinned?: boolean | number | null;
  sortOrder?: number | null;
  createdAt?: unknown;
  updatedAt?: unknown;
};

type BuildNpcMemoryContextInput = {
  npcId: string;
  npcName: string;
  channelId: string;
  userMessage: string;
  source?: "escritorio" | "meeting" | "task" | "telegram" | "openclaw";
};

type SaveNpcConversationMemoryInput = BuildNpcMemoryContextInput & {
  npcResponse?: string;
  userName?: string | null;
};

const DEFAULT_CONTEXT_CHAR_LIMIT = 4200;
const DEFAULT_FILE_ROOT = path.resolve(process.cwd(), "..", "agent-memory");
const MEMORY_ENABLED = process.env.NPC_MEMORY_ENABLED !== "0";
const FILE_MIRROR_ENABLED = process.env.NPC_MEMORY_FILE_MIRROR !== "0";

function maxContextChars() {
  const parsed = Number(process.env.NPC_MEMORY_MAX_CONTEXT_CHARS || DEFAULT_CONTEXT_CHAR_LIMIT);
  return Number.isFinite(parsed) && parsed > 500 ? parsed : DEFAULT_CONTEXT_CHAR_LIMIT;
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function tokenize(value: string) {
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

function scoreMemory(memory: NpcMemoryRow, queryTokens: string[]) {
  const haystack = normalizeText(`${memory.title}\n${memory.content}`);
  let score = memory.pinned ? 12 : 0;
  if (memory.memoryType === "working") score += 7;
  if (memory.memoryType === "fact") score += 5;
  if (memory.memoryType === "summary") score += 4;
  if (memory.memoryType === "relationship") score += 3;
  if (memory.memoryType === "episodic") score += 2;

  for (const token of queryTokens) {
    if (haystack.includes(token)) score += 3;
  }

  const createdAt = memory.createdAt ? new Date(String(memory.createdAt)).getTime() : 0;
  if (createdAt && Date.now() - createdAt < 7 * 24 * 60 * 60 * 1000) score += 2;
  return score;
}

function trimToChars(lines: string[], limit: number) {
  const selected: string[] = [];
  let size = 0;
  for (const line of lines) {
    const nextSize = size + line.length + 1;
    if (nextSize > limit) break;
    selected.push(line);
    size = nextSize;
  }
  return selected;
}

function memoryRoot() {
  return process.env.NPC_MEMORY_FILE_ROOT || DEFAULT_FILE_ROOT;
}

function slug(value: string) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "npc";
}

function appendFileMemory(input: {
  npcId: string;
  npcName: string;
  source: string;
  title: string;
  content: string;
  memoryType: MemoryType;
}) {
  if (!FILE_MIRROR_ENABLED) return;
  try {
    const root = path.join(memoryRoot(), slug(input.npcName || input.npcId));
    fs.mkdirSync(path.join(root, "raw", input.source), { recursive: true });
    fs.appendFileSync(
      path.join(root, "long-term.md"),
      `- ${new Date().toISOString()} | ${input.memoryType} | ${input.title}: ${input.content.replace(/\s+/g, " ").slice(0, 900)}\n`,
      "utf8",
    );
    fs.appendFileSync(
      path.join(root, "raw", input.source, `${new Date().toISOString().slice(0, 10)}.jsonl`),
      `${JSON.stringify({ at: new Date().toISOString(), ...input })}\n`,
      "utf8",
    );
  } catch (error) {
    console.warn("[npc-memory] file mirror failed:", error instanceof Error ? error.message : error);
  }
}

function estimateImportance(text: string) {
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
  if (text.length > 180) score += 0.12;
  if (/[0-9]{2}\/[0-9]{2}|20[0-9]{2}|r\$|https?:\/\//i.test(text)) score += 0.12;
  return Math.min(1, score);
}

function inferMemoryType(userMessage: string, npcResponse?: string): MemoryType {
  const text = normalizeText(`${userMessage}\n${npcResponse || ""}`);
  if (text.includes("lembre") || text.includes("importante") || text.includes("preferencia")) return "fact";
  if (text.includes("reuniao") || text.includes("decisao") || text.includes("alinhamento")) return "summary";
  if (text.includes("tarefa") || text.includes("prazo") || text.includes("responsavel")) return "working";
  return "episodic";
}

function buildMemoryTitle(userMessage: string) {
  const clean = userMessage.replace(/\s+/g, " ").trim();
  return clean.length > 90 ? `${clean.slice(0, 87)}...` : clean || "Memoria automatica";
}

export async function buildNpcMemoryContext(input: BuildNpcMemoryContextInput) {
  if (!MEMORY_ENABLED) return "";

  try {
    const rows = await db
      .select()
      .from(npcMemoryItems)
      .where(eq(npcMemoryItems.npcId, input.npcId))
      .orderBy(desc(npcMemoryItems.pinned), desc(npcMemoryItems.updatedAt))
      .limit(120) as NpcMemoryRow[];

    if (rows.length === 0) return "";

    const tokens = tokenize(input.userMessage);
    const ranked = rows
      .map((memory) => ({ memory, score: scoreMemory(memory, tokens) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 18)
      .map(({ memory }) => {
        const content = memory.content.replace(/\s+/g, " ").trim();
        return `- [${memory.memoryType}] ${memory.title}: ${content.slice(0, 650)}`;
      });

    const selected = trimToChars(ranked, maxContextChars());
    if (selected.length === 0) return "";

    return [
      "<memoria_operacional_do_npc>",
      `NPC: ${input.npcName}`,
      `Origem: ${input.source || "escritorio"}`,
      "Use esta memoria de forma silenciosa. Nao copie este bloco na resposta.",
      "Priorize fatos fixos, preferencias, tarefas abertas e contexto recente. Se algo antigo nao for relevante, ignore.",
      ...selected,
      "</memoria_operacional_do_npc>",
    ].join("\n");
  } catch (error) {
    console.warn("[npc-memory] context build failed:", error instanceof Error ? error.message : error);
    return "";
  }
}

export function attachNpcMemoryToPrompt(message: string, memoryContext: string) {
  if (!memoryContext.trim()) return message;
  return `${memoryContext}\n\n<mensagem_atual>\n${message}\n</mensagem_atual>`;
}

export async function saveNpcConversationMemory(input: SaveNpcConversationMemoryInput) {
  if (!MEMORY_ENABLED) return;

  const combined = `${input.userMessage}\n${input.npcResponse || ""}`.trim();
  const importance = estimateImportance(combined);
  const minImportance = Number(process.env.NPC_MEMORY_IMPORTANCE_MIN || 0.42);
  if (importance < minImportance) return;

  const memoryType = inferMemoryType(input.userMessage, input.npcResponse);
  const now = isPostgres ? new Date() : new Date().toISOString();
  const title = buildMemoryTitle(input.userMessage);
  const content = [
    input.userName ? `Usuario: ${input.userName}` : null,
    `Mensagem: ${input.userMessage.replace(/\s+/g, " ").slice(0, 900)}`,
    input.npcResponse ? `Resposta do NPC: ${input.npcResponse.replace(/\s+/g, " ").slice(0, 900)}` : null,
  ].filter(Boolean).join("\n");

  try {
    await db.insert(npcMemoryItems).values({
      npcId: input.npcId,
      memoryType,
      title,
      content,
      metadata: jsonForDb({
        source: input.source || "escritorio",
        channelId: input.channelId,
        automatic: true,
        importance,
      }),
      pinned: false,
      sortOrder: 0,
      createdAt: now as unknown as Date,
      updatedAt: now as unknown as Date,
    });

    appendFileMemory({
      npcId: input.npcId,
      npcName: input.npcName,
      source: input.source || "escritorio",
      title,
      content,
      memoryType,
    });
  } catch (error) {
    console.warn("[npc-memory] save failed:", error instanceof Error ? error.message : error);
  }
}
