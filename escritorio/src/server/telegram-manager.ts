import { eq } from "drizzle-orm";
import TelegramBot from "node-telegram-bot-api";
import { createRequire } from "node:module";

import codexGatewayModule from "../lib/codex-gateway.js";

const require = createRequire(import.meta.url);
const { CodexGateway } = (codexGatewayModule as any);
const { groqTranscribeAudio } = require("../lib/groq-client.js");
const { elevenLabsGenerateSpeech } = require("../lib/elevenlabs-client.js");
const {
  attachNpcMemoryToPrompt,
  buildNpcMemoryContext,
  saveNpcConversationMemory,
} = require("../lib/npc-memory-runtime.js") as {
  attachNpcMemoryToPrompt: (message: string, memoryContext: string) => string;
  buildNpcMemoryContext: (input: Record<string, unknown>) => Promise<string>;
  saveNpcConversationMemory: (input: Record<string, unknown>) => Promise<void>;
};

type NpcRow = {
  id: string;
  name: string;
  channelId?: string | null;
  channel_id?: string | null;
  openclawConfig?: unknown;
  openclaw_config?: unknown;
};

type TelegramNpcConfig = {
  agentId?: string;
  agent_id?: string;
  sessionKeyPrefix?: string;
  voiceId?: string;
  telegramToken?: string;
  telegramTokenEnv?: string;
  telegramSetup?: {
    tokenEnv?: string;
    defaultGroupId?: string;
    clientGroups?: unknown;
    status?: string;
  };
  telegramAliases?: string[];
  telegramCoordinator?: boolean;
  telegramMeetingBridge?: boolean;
  powers?: Record<string, unknown>;
};

type SharedHistoryMessage = {
  role: "player" | "npc";
  content: string;
  timestamp: number;
};

type SharedHistoryMap = Map<string, SharedHistoryMessage[]>;

type TelegramIdentity = {
  characterId: string | null;
  userId: string | null;
  characterName: string | null;
};

function normalizeText(value: string) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function splitTelegramMessage(text: string) {
  const chunks: string[] = [];
  let remaining = String(text || "").trim();
  if (!remaining) return ["OK."];
  while (remaining.length > 3800) {
    chunks.push(remaining.slice(0, 3800));
    remaining = remaining.slice(3800);
  }
  chunks.push(remaining);
  return chunks;
}

const TELEGRAM_AGENT_SYSTEM_PROMPT = [
  "Voce esta respondendo como um NPC/agente do escritorio Fenix dentro do Telegram.",
  "Responda somente a mensagem final que deve aparecer para o usuario, em portugues do Brasil.",
  "Use memoria e contexto apenas de forma interna e silenciosa.",
  "Nunca mencione que vai consultar memoria, arquivos, /tmp, projeto, repositorio, terminal, Codex, prompt, instrucoes internas ou ferramentas.",
  "Nunca descreva seu processo interno. Nao diga 'vou consultar', 'antes de responder', 'vou ler', 'vou gravar' ou frases parecidas.",
  "Para mensagens simples como /start, oi, opa, bom dia ou boa tarde, apenas cumprimente e se coloque a disposicao dentro da sua especialidade.",
  "Se faltar contexto, faca uma pergunta curta e util. Nao invente acesso a dados que nao foram fornecidos.",
].join("\n");

function cleanModelResponse(response: string) {
  const cleaned = String(response || "")
    .replace(/\[thought\][\s\S]*?\[\/thought\]/g, "")
    .replace(/```memory\s*[\s\S]*?```/gi, "")
    .trim();

  const normalized = normalizeText(cleaned);
  const leakedInternalProcess = [
    "vou consultar a memoria",
    "vou consultar memoria",
    "memoria rapida",
    "antes de responder",
    "a partir de `/tmp`",
    "a partir de /tmp",
    "sem alterar nada no projeto",
    "nao alterar nada no projeto",
    "vou ler",
    "vou acessar",
    "arquivo de memoria",
  ].some((pattern) => normalized.includes(normalizeText(pattern)));

  if (leakedInternalProcess && cleaned.length < 700) {
    return "Estou online por aqui. Me manda o que voce precisa e eu te ajudo direto.";
  }

  return cleaned
    .split("\n")
    .filter((line) => {
      const normalizedLine = normalizeText(line);
      if (normalizedLine.includes("vou consultar") && normalizedLine.includes("memoria")) return false;
      if (normalizedLine.includes("antes de responder")) return false;
      if (normalizedLine.includes("/tmp")) return false;
      if (normalizedLine.includes("sem alterar nada no projeto")) return false;
      return true;
    })
    .join("\n")
    .trim();
}

function parseConfig(parseJson: (value: unknown) => unknown, npc: NpcRow): TelegramNpcConfig {
  const raw = npc.openclawConfig ?? npc.openclaw_config;
  const parsed = parseJson(raw);
  return parsed && typeof parsed === "object" ? parsed as TelegramNpcConfig : {};
}

function isPlaceholderToken(value: string) {
  const normalized = String(value || "").trim().toUpperCase();
  return !normalized || normalized.startsWith("SET_ME") || normalized.startsWith("YOUR_") || normalized.includes("TELEGRAM_BOT_TOKEN");
}

function resolveTelegramToken(config: TelegramNpcConfig) {
  const directToken = typeof config.telegramToken === "string" ? config.telegramToken.trim() : "";
  if (directToken && !isPlaceholderToken(directToken)) return directToken;

  const envName = (
    typeof config.telegramTokenEnv === "string"
      ? config.telegramTokenEnv
      : config.telegramSetup?.tokenEnv
  )?.trim();
  if (!envName) return "";

  const envToken = (process.env[envName] || "").trim();
  return envToken && !isPlaceholderToken(envToken) ? envToken : "";
}

export class TelegramManager {
  private bots = new Map<string, TelegramBot>();
  private botUsernames = new Map<string, string>();
  private io: any;
  private db: any;
  private schema: any;
  private parseJson: (value: unknown) => unknown;
  private gateway: any;
  private sharedHistory: SharedHistoryMap;
  private operationalGroupChatId: string | null;
  private meetingGroupChatId: string | null;
  private meetingChannelId: string | null;

  constructor(io: any, db: any, schema: any, parseJson: (value: unknown) => unknown) {
    this.io = io;
    this.db = db;
    this.schema = schema;
    this.parseJson = parseJson;
    this.gateway = null;
    this.sharedHistory = ((globalThis as any).sharedNpcChatHistory ||= new Map());
    this.operationalGroupChatId = process.env.TELEGRAM_OPERATIONAL_GROUP_ID || process.env.TELEGRAM_AGENTS_GROUP_ID || null;
    this.meetingGroupChatId = process.env.TELEGRAM_MEETING_GROUP_ID || null;
    this.meetingChannelId = process.env.TELEGRAM_MEETING_CHANNEL_ID || process.env.TELEGRAM_CHANNEL_ID || null;
  }

  public async start() {
    console.log("[TelegramManager] Iniciando Hub Multi-Telegram com memória compartilhada...");
    try {
      const workspace = process.env.TELEGRAM_CODEX_WORKSPACE || process.env.CODEX_WORKSPACE || "/var/www/fenix-lab";
      this.gateway = new CodexGateway(workspace, { timeoutMs: Number(process.env.TELEGRAM_CODEX_TIMEOUT_MS || 90_000) });
      await this.gateway.connect();
      console.log("[TelegramManager] CodexGateway conectado com sucesso.");

      const npcs = await this.db.select().from(this.schema.npcs);
      let count = 0;
      for (const npc of npcs as NpcRow[]) {
        const config = parseConfig(this.parseJson, npc);
        const token = resolveTelegramToken(config);
        if (token && (config.agentId || config.agent_id)) {
          await this.initBot(npc, config, token);
          count++;
        }
      }
      console.log(`[TelegramManager] Inicializado. Bots ativos: ${count}`);
    } catch (error: any) {
      console.error("[TelegramManager] Erro crítico ao iniciar:", error?.message || error);
    }
  }

  private async initBot(npc: NpcRow, config: TelegramNpcConfig, resolvedToken?: string) {
    if (this.bots.has(npc.id)) return;

    const token = resolvedToken || resolveTelegramToken(config);
    if (!token) return;
    const agentId = String(config.agentId || config.agent_id || "");
    const bot = new TelegramBot(token, { polling: true });
    const me = await bot.getMe().catch(() => null);
    if (me?.username) this.botUsernames.set(npc.id, me.username);

    console.log(`[TelegramManager] Bot conectado: ${npc.name} -> ${agentId}${me?.username ? ` (@${me.username})` : ""}`);

    
    bot.on("voice", async (msg) => {
      if (!agentId) return;
      const voice = msg.voice;
      if (!voice) return;
      try {
        const fileLink = await bot.getFileLink(voice.file_id);
        const fileResp = await fetch(fileLink);
        const buffer = Buffer.from(await fileResp.arrayBuffer());
        const transcribedText = await groqTranscribeAudio(buffer);
        
        console.log(`[TelegramManager] Voz transcrita (${npc.name}): ${transcribedText}`);
        
        await this.handleMessage({ 
          bot, npc, config, agentId, 
          text: transcribedText, 
          msg, 
          isGroup: msg.chat.type !== "private", 
          isMeetingGroup: String(msg.chat.id) === String(this.meetingGroupChatId),
          isVoiceRequest: true
        });
      } catch (error) {
        console.error(`[TelegramManager] Erro ao processar voz para ${npc.name}:`, error);
        bot.sendMessage(msg.chat.id, "Nao consegui entender seu audio. Pode repetir?").catch(() => {});
      }
    });

    bot.on("message", async (msg) => {
      if (!msg.text || !agentId) return;
      const chatType = msg.chat.type;
      const isGroup = chatType === "group" || chatType === "supergroup";
      const chatId = String(msg.chat.id);

      const isMeetingGroup = this.meetingGroupChatId && chatId === String(this.meetingGroupChatId);
      const isOperationalGroup = this.operationalGroupChatId && chatId === String(this.operationalGroupChatId);
      const hasConfiguredGroups = Boolean(this.operationalGroupChatId || this.meetingGroupChatId);

      if (isGroup && hasConfiguredGroups && !isOperationalGroup && !isMeetingGroup) return;

      if (isMeetingGroup && this.isBridgeBot(npc, config)) {
        this.mirrorTelegramToMeeting(npc, config, msg);
      }

      const shouldRespond = this.shouldGroupBotRespond(npc, config, msg.text);
      if (isGroup && !shouldRespond) return;

      await this.handleMessage({ bot, npc, config, agentId, text: msg.text, msg, isGroup, isMeetingGroup: Boolean(isMeetingGroup) }).catch((error: any) => {
        console.error(`[TelegramManager] Erro no bot de ${npc.name}:`, error?.message || error);
        void bot.sendMessage(msg.chat.id, "Tive um erro ao processar essa mensagem. Registrei aqui e vou tentar estabilizar.").catch(() => {});
      });
      });

    bot.on("polling_error", (error) => {
      console.error(`[TelegramManager] Polling error em ${npc.name}:`, error.message);
    });

    this.bots.set(npc.id, bot);
  }

  private shouldGroupBotRespond(npc: NpcRow, config: TelegramNpcConfig, text: string) {
    const normalized = normalizeText(text);
    if (normalized.startsWith("/reuniao") && this.isBridgeBot(npc, config)) return true;
    const username = this.botUsernames.get(npc.id);
    const aliases = [
      npc.name,
      username ? `@${username}` : "",
      ...(config.telegramAliases || []),
    ].filter(Boolean);

    if (aliases.some((alias) => normalized.includes(normalizeText(alias)))) return true;
    return Boolean(config.telegramCoordinator && !/@[a-z0-9_]+/i.test(text));
  }

  private isBridgeBot(npc: NpcRow, config: TelegramNpcConfig) {
    return Boolean(
      config.telegramMeetingBridge
      || config.telegramCoordinator
      || normalizeText(npc.name).includes("lurdinha")
      || String(config.agentId || config.agent_id || "") === "gerente-operacional",
    );
  }

  private getMeetingRoomId(channelId: string) {
    return `meeting-${channelId}`;
  }

  private getMeetingChannelId(npc?: NpcRow) {
    return this.meetingChannelId || npc?.channelId || npc?.channel_id || "";
  }

  private async resolveTelegramIdentity(chatId: string): Promise<TelegramIdentity> {
    try {
      const telegramChatIdColumn = this.schema.characters?.telegramChatId;
      if (!telegramChatIdColumn) {
        return { characterId: null, userId: null, characterName: null };
      }

      const charRows = await this.db.select({
        id: this.schema.characters.id,
        userId: this.schema.characters.userId,
        name: this.schema.characters.name,
      })
        .from(this.schema.characters)
        .where(eq(telegramChatIdColumn, chatId))
        .limit(1);

      const character = charRows?.[0];
      return {
        characterId: character?.id || null,
        userId: character?.userId || null,
        characterName: character?.name || null,
      };
    } catch (err: any) {
      console.warn("[TelegramManager] Identity lookup failed (will use Telegram name):", err?.message || err);
      return { characterId: null, userId: null, characterName: null };
    }
  }

  private mirrorNpcPanelHistory(input: {
    channelId: string;
    npcId: string;
    role: "player" | "npc";
    content: string;
    sender?: string;
    timestamp?: number;
    provider?: string;
    model?: string;
  }) {
    const content = String(input.content || "").trim();
    if (!input.channelId || !input.npcId || !content) return;
    this.io.to(input.channelId).emit("npc:history-append", {
      npcId: input.npcId,
      role: input.role,
      content,
      message: content,
      sender: input.sender,
      timestamp: input.timestamp || Date.now(),
      provider: input.provider,
      model: input.model,
    });
  }

  private mirrorTelegramToMeeting(npc: NpcRow, _config: TelegramNpcConfig, msg: TelegramBot.Message) {
    const channelId = this.getMeetingChannelId(npc);
    if (!channelId || !msg.text) return;
    const fromName = [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(" ") || msg.from?.username || "Telegram";
    const meetingRooms = (globalThis as any).sharedMeetingRooms as Map<string, { messages: unknown[] }> | undefined;
    const activeBrokers = (globalThis as any).sharedActiveBrokers as Map<string, { isRunning: () => boolean; addUserMessage: (name: string, content: string) => void }> | undefined;
    const room = meetingRooms?.get(channelId);
    const message = {
      id: `tg-meeting-${msg.message_id}-${Date.now()}`,
      sender: `${fromName} (Telegram)`,
      senderId: `tg-${msg.chat.id}`,
      senderType: "user",
      content: msg.text,
      timestamp: Date.now(),
    };

    if (room?.messages) {
      room.messages.push(message);
      if (room.messages.length > 100) room.messages.splice(0, room.messages.length - 100);
    }

    this.io.to(this.getMeetingRoomId(channelId)).emit("meeting:message", message);

    const broker = activeBrokers?.get(channelId);
    if (broker?.isRunning?.()) {
      broker.addUserMessage(fromName, msg.text);
    }
  }

  public async sendMeetingMessage(input: { channelId: string; sender: string; content: string; senderType?: "user" | "npc" | "system" }) {
    if (!this.meetingGroupChatId || !input.channelId || input.channelId !== this.getMeetingChannelId()) return;
    const bot = this.bots.values().next().value as TelegramBot | undefined;
    if (!bot) return;
    const prefix = input.senderType === "system" ? "[Reuniao]" : input.sender;
    const text = `${prefix}: ${input.content}`.trim();
    for (const chunk of splitTelegramMessage(text)) {
      await bot.sendMessage(this.meetingGroupChatId, chunk, { disable_web_page_preview: true }).catch((error) => {
        console.error("[TelegramManager] Falha ao espelhar reuniao no Telegram:", error?.message || error);
      });
    }
  }

  public async sendOperationalAlert(input: { channelId?: string | null; npcId?: string | null; message: string }) {
    if (!this.operationalGroupChatId) return false;
    const bot = this.bots.values().next().value as TelegramBot | undefined;
    if (!bot) return false;
    const text = `[Fenix-OS] ${input.message}`.trim();
    for (const chunk of splitTelegramMessage(text)) {
      await bot.sendMessage(this.operationalGroupChatId, chunk, { disable_web_page_preview: true }).catch((error) => {
        console.error("[TelegramManager] Falha ao enviar alerta operacional:", error?.message || error);
      });
    }
    return true;
  }

  private async handleMessage(input: {
    bot: TelegramBot;
    npc: NpcRow;
    config: TelegramNpcConfig;
    agentId: string;
    text: string;
    msg: TelegramBot.Message;
    isGroup: boolean;
    isMeetingGroup: boolean;
    isVoiceRequest?: boolean;
  }) {
    const { bot, npc, config, agentId, text, msg, isGroup, isMeetingGroup, isVoiceRequest } = input;
    const targetChannelId = npc.channelId || npc.channel_id || "";
    const fromName = [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(" ") || msg.from?.username || "Cliente";
    const chatId = String(msg.chat.id);
    const historyKey = `${targetChannelId}:${npc.id}`;
    const history = this.sharedHistory.get(historyKey) || [];
    const identity = await this.resolveTelegramIdentity(chatId);
    const displayName = identity.characterName || fromName;
    const telegramDisplayName = identity.characterName || `${fromName} (Telegram)`;
    const provider = "codex";
    const model = "Default";

    history.push({ role: "player", content: text, timestamp: Date.now() });
    this.sharedHistory.set(historyKey, history);

    // Mirror to Web UI with correct identity
    this.mirrorNpcPanelHistory({
      channelId: targetChannelId,
      npcId: npc.id,
      role: "player",
      content: text,
      sender: telegramDisplayName,
      timestamp: Date.now(),
    });

    if (targetChannelId) {
      this.io.to(targetChannelId).emit("chat:message", {
        id: `chat-tg-${Date.now()}`,
        sender: telegramDisplayName,
        senderId: `tg-${chatId}`,
        senderCharacterId: identity.characterId,
        senderUserId: identity.userId,
        content: text,
        timestamp: Date.now(),
      });
    }

    await bot.sendChatAction(msg.chat.id, "typing").catch(() => {});

    const recentHistory = history.slice(-10);
    const historyString = recentHistory
      .map((entry) => `${entry.role === "player" ? displayName : npc.name}: ${entry.content}`)
      .join("\n");

    const memoryContext = await buildNpcMemoryContext({
      npcId: npc.id,
      npcName: npc.name,
      channelId: targetChannelId,
      userMessage: text,
      source: "telegram",
      userName: displayName,
      telegramChatId: chatId,
      characterId: identity.characterId,
      userId: identity.userId,
    });

    const promptText = attachNpcMemoryToPrompt([
      `[Contexto recente da conversa (${isGroup ? "Grupo Telegram" : "Telegram direto"}/Web)]:`,
      historyString || "(sem historico recente)",
      "",
      `[Aviso do Sistema: ${displayName} enviou esta mensagem pelo Telegram. Responda diretamente, em português do Brasil, mantendo a identidade de ${npc.name}.]`,
      `Mensagem: ${text}`,
    ].join("\n"), memoryContext);

    const sessionKeyPrefix = config.sessionKeyPrefix || npc.id;
    const sessionKey = `telegram:${sessionKeyPrefix}:${chatId}`;
    let fullResponse = "";
    const response = await this.gateway.chatSend(
      agentId,
      sessionKey,
      promptText,
      (delta: string) => { fullResponse += delta; },
      undefined,
      TELEGRAM_AGENT_SYSTEM_PROMPT,
      config.powers || undefined,
    );

    const cleanResponse = cleanModelResponse(response || fullResponse);
    if (!cleanResponse) {
      console.warn(`[TelegramManager] Resposta vazia de ${npc.name}, ignorando envio.`);
      return;
    }

    history.push({ role: "npc", content: cleanResponse, timestamp: Date.now() });
    this.sharedHistory.set(historyKey, history);

    this.mirrorNpcPanelHistory({
      channelId: targetChannelId,
      npcId: npc.id,
      role: "npc",
      content: cleanResponse,
      timestamp: Date.now(),
      provider,
      model,
    });

    void saveNpcConversationMemory({
      npcId: npc.id,
      npcName: npc.name,
      channelId: targetChannelId,
      userMessage: text,
      npcResponse: cleanResponse,
      source: "telegram",
      userName: displayName,
      telegramChatId: chatId,
    });

    for (const chunk of splitTelegramMessage(cleanResponse)) {
      await bot.sendMessage(msg.chat.id, chunk, {
        reply_to_message_id: isGroup ? msg.message_id : undefined,
        disable_web_page_preview: true,
      });
    }

    if (isVoiceRequest) {
      try {
        const audioBuffer = await elevenLabsGenerateSpeech(cleanResponse, config.voiceId);
        const replyOptions = {
          reply_to_message_id: isGroup ? msg.message_id : undefined,
        };

        await bot.sendAudio(msg.chat.id, audioBuffer, replyOptions, {
          filename: `${npc.name.replace(/[^a-z0-9_-]+/gi, "-").toLowerCase() || "fenix-lab"}-resposta.mp3`,
          contentType: "audio/mpeg",
        });
      } catch (ttsErr: any) {
        console.error(`[TelegramManager] Erro TTS (${npc.name}):`, ttsErr?.message || ttsErr);
      }
    }

    if (targetChannelId) {
      this.io.to(targetChannelId).emit("chat:message", {
        id: `chat-tg-resp-${Date.now()}`,
        sender: npc.name,
        senderId: npc.id,
        senderCharacterId: null,
        senderUserId: null,
        content: `*(Para ${displayName})* ${cleanResponse}`,
        timestamp: Date.now(),
        provider,
        model,
      });
    }

    if (isMeetingGroup) {
      const channelId = this.getMeetingChannelId(npc);
      if (channelId) {
        const meetingMessage = {
          id: `tg-meeting-npc-${Date.now()}`,
          sender: npc.name,
          senderId: `npc-${npc.id}`,
          senderType: "npc",
          content: cleanResponse,
          timestamp: Date.now(),
        };
        const meetingRooms = (globalThis as any).sharedMeetingRooms as Map<string, { messages: unknown[] }> | undefined;
        const room = meetingRooms?.get(channelId);
        if (room?.messages) {
          room.messages.push(meetingMessage);
          if (room.messages.length > 100) room.messages.splice(0, room.messages.length - 100);
        }
        this.io.to(this.getMeetingRoomId(channelId)).emit("meeting:message", meetingMessage);
      }
    }
  }

}
