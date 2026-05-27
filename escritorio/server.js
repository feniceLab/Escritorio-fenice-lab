require('dotenv').config({ path: '.env.local' });
// Custom server — wraps Next.js standalone with Socket.io on a single port
// Hooks into startServer's httpServer after it starts
/* eslint-disable @typescript-eslint/no-require-imports */

const path = require("node:path");
const { Server } = require("socket.io");
const {
  OpenClawGateway,
  buildGatewayErrorPayload,
  getGatewayErrorStatus,
} = require("./src/lib/openclaw-gateway.js");
const { ClaudeCodeGateway } = require("./src/lib/claude-code-gateway.js");
const { OllamaGateway } = require("./src/lib/ollama-gateway.js");
const { CodexGateway } = require("./src/lib/codex-gateway.js");
const { parseNpcResponse, isValidTaskAction } = require("./src/lib/task-parser.js");
const { TaskManager } = require("./src/lib/task-manager.js");
const { withTaskReminder, normalizeTaskPromptLocale } = require("./src/lib/task-prompt.js");
const {
  getInternalSocketHostname,
  isInternalRequestAuthorized,
} = require("./src/lib/internal-transport.js");

const dir = __dirname;
process.env.NODE_ENV = "production";
process.chdir(dir);

const currentPort = parseInt(process.env.PORT, 10) || 3000;
const hostname = process.env.HOSTNAME || "0.0.0.0";

// Load Next.js config from standalone build
const nextConfig = require(path.join(dir, ".next", "required-server-files.json")).config;
process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(nextConfig);

require("next");
const { startServer } = require("next/dist/server/lib/start-server");

async function main() {
  const { jwtVerify } = await import("jose");
  const unwrapTsModule = (moduleNamespace) => {
    if (
      moduleNamespace &&
      typeof moduleNamespace === "object" &&
      "default" in moduleNamespace &&
      moduleNamespace.default &&
      typeof moduleNamespace.default === "object"
    ) {
      return { ...moduleNamespace.default, ...moduleNamespace };
    }
    return moduleNamespace;
  };
  const taskReporting = unwrapTsModule(await import("./src/lib/task-reporting.ts"));
  const {
    buildAutoExecutionPrompt,
    buildCompletionReportRow,
    buildResumeTaskExecutionPrompt,
    buildTaskActionStartMessage,
    buildQueuedReportRow,
    buildManualTaskReportPrompt,
    enqueueCompletionReport,
    enqueueQueuedReport,
    getProgressNudgeCutoff,
    getPendingReportsForUserAndChannel,
    getTaskAutomationConfig,
    markReportConsumed,
    markReportDelivered,
    shouldDeliverCompletionReport,
    toReportReadyPayload,
  } = taskReporting;

  let getTaskAutomationConfigLocal = getTaskAutomationConfig;
  if (typeof getTaskAutomationConfigLocal !== "function") {
    console.warn("[task-reporting] getTaskAutomationConfig is not a function, applying fallback.");
    getTaskAutomationConfigLocal = function(source) {
      const ta = (source && typeof source === "object" && source.taskAutomation) || {};
      return {
        autoProgressNudgeEnabled: !!ta.autoProgressNudgeEnabled,
        autoProgressNudgeMinutes: typeof ta.autoProgressNudgeMinutes === "number" ? ta.autoProgressNudgeMinutes : 30,
        autoProgressNudgeMax: typeof ta.autoProgressNudgeMax === "number" ? ta.autoProgressNudgeMax : 5,
        reportWaitSeconds: typeof ta.reportWaitSeconds === "number" ? ta.reportWaitSeconds : 10,
      };
    };
  }
  const channelAccess = unwrapTsModule(await import("./src/lib/rbac/channel-access.ts"));
  const {
    buildChannelAccessDeniedPayload,
    summarizeChannelParticipationAccess,
  } = channelAccess;
  const meetingSocket = unwrapTsModule(await import("./src/server/meeting-socket.ts"));
  const {
    registerMeetingSocketHandlers,
  } = meetingSocket;
  const meetingDiscussion = unwrapTsModule(await import("./src/server/meeting-discussion.ts"));
  const {
    registerMeetingDiscussionHandlers,
  } = meetingDiscussion;
  const {
    enqueueOperationalEventJobs,
    processPendingNpcAutomations,
  } = require("./src/lib/npc-automation-runtime.js");

  const { db, schema } = require("./src/db/server-db.js");
  const { eq, and } = require("drizzle-orm");
  const { parseJson } = require("./src/db/normalize.js");
  const taskManager = new TaskManager(db, schema);
  const { MeetingBroker } = require("./src/lib/meeting-broker.js");
  const reportSchema = { npcReports: schema.npcReports };
  const {
    attachNpcMemoryToPrompt,
    buildNpcMemoryContext,
    saveNpcConversationMemory,
  } = require("./src/lib/npc-memory-runtime.js");

  function compactOfficeText(value, maxLength = 420) {
    const text = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
    if (!text) return "";
    return text.length > maxLength ? `${text.slice(0, maxLength - 3).trim()}...` : text;
  }

  function listOfficeItems(items, formatter, maxItems = 6) {
    if (!Array.isArray(items) || items.length === 0) return "- nenhum item relevante";
    return items.slice(0, maxItems).map((item) => `- ${formatter(item)}`).join("\n");
  }

  async function buildOfficeCentralPromptContext({ channelId, npcId, message }) {
    if (!channelId) return "";
    const apiBase = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://127.0.0.1:3000";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    try {
      const response = await fetch(`${apiBase}/api/office/context`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          channelId,
          npcId,
          contextKind: "agent-task",
          query: compactOfficeText(message, 320),
          persistSnapshot: true,
        }),
        signal: controller.signal,
      });
      if (!response.ok) return "";
      const data = await response.json();
      const context = data?.context;
      if (!context?.client) return "";

      const tasks = listOfficeItems(context.openTasks, (task) => `${task.title || task.id} [${task.status || "open"}] ${compactOfficeText(task.summary, 220)}`);
      const overdue = listOfficeItems(context.overdueTasks, (task) => `${task.title || task.id}${task.dueAt ? ` vence ${task.dueAt}` : ""}`, 4);
      const memories = listOfficeItems(context.memories, (memory) => `${memory.title || memory.memoryType || "memoria"}: ${compactOfficeText(memory.content, 260)}`);
      const notifications = listOfficeItems(context.notifications, (notice) => `${notice.priority || "normal"}: ${notice.title || notice.type} ${compactOfficeText(notice.body, 180)}`, 5);
      const approvals = listOfficeItems(context.pendingApprovals, (approval) => `${approval.title || approval.actionType}: ${compactOfficeText(approval.summary, 180)}`, 5);
      const library = listOfficeItems(context.library, (item) => `${item.name || item.category}: ${compactOfficeText(item.content, 220)}`, 5);

      return [
        "[CENTRAL DO ESCRITORIO - CONTEXTO OPERACIONAL OBRIGATORIO]",
        `Cliente: ${context.client.name} (${context.client.status || "status indefinido"})`,
        `Resumo: ${compactOfficeText(context.summary, 520)}`,
        `Consulta atual: ${compactOfficeText(context.query || message, 260)}`,
        "",
        "Tarefas abertas:",
        tasks,
        "",
        "Tarefas atrasadas:",
        overdue,
        "",
        "Memorias relevantes:",
        memories,
        "",
        "Biblioteca do cliente:",
        library,
        "",
        "Aprovacoes pendentes:",
        approvals,
        "",
        "Notificacoes abertas:",
        notifications,
        "",
        "Use este bloco como fonte principal antes de responder. Se gerar trabalho novo, registre tarefa, memoria, notificacao ou aprovacao conforme necessario.",
        "[/CENTRAL DO ESCRITORIO]",
      ].join("\n");
    } catch (error) {
      console.warn("[office-context] failed to attach central context:", error?.message || error);
      return "";
    } finally {
      clearTimeout(timeout);
    }
  }

  // Start Next.js (this creates and listens on the HTTP server)
  await startServer({
    dir,
    isDev: false,
    config: nextConfig,
    hostname,
    port: currentPort,
    allowRetry: false,
  });

  // Get the underlying HTTP server from the return value
  // startServer returns { port, hostname } but the HTTP server is
  // already listening. We need to access it differently.
  //
  // Alternative: use the http module to find the listening server
  const http = require("node:http");
  // Simpler: create Socket.io on a separate internal port, proxy via Caddy path
  const SOCKET_PORT = currentPort + 1; // 3001
  const socketHttpServer = http.createServer();
  const io = new Server(socketHttpServer, {
    path: "/socket.io",
    cors: { origin: "*" },
    maxHttpBufferSize: 20e6, // 20 MB — supports 3 × 5 MB file attachments
  });

  globalThis.sharedNpcChatHistory = globalThis.sharedNpcChatHistory || new Map();
  const telegramManagerModule = unwrapTsModule(await import("./src/server/telegram-manager.ts"));
  const { TelegramManager } = telegramManagerModule;
  const telegramManager = new TelegramManager(io, db, schema, parseJson);
  globalThis.telegramManager = telegramManager;
  await telegramManager.start();

  // JWT helpers
  function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("Missing JWT_SECRET");
    return new TextEncoder().encode(secret);
  }

  async function authenticateSocket(socket) {
    if (process.env.STARKEN_EMBEDDED === "true") {
      return { userId: "starken-embed-user", nickname: "Fenix OS" };
    }

    try {
      const cookieHeader = socket.handshake.headers.cookie || "";
      const tokenMatch = cookieHeader.match(/token=([^;]+)/);
      if (!tokenMatch) return null;
      const { payload } = await jwtVerify(tokenMatch[1], getJwtSecret());
      return { userId: payload.userId, nickname: payload.nickname };
    } catch {
      return null;
    }
  }

  function emitChannelAccessDenied(socket, input) {
    socket.emit("channel:access-denied", buildChannelAccessDeniedPayload(input));
  }

  async function getSocketChannelParticipationAccess(channelId, userId) {
    const channelRows = await db
      .select({
        id: schema.channels.id,
        groupId: schema.channels.groupId,
        isPublic: schema.channels.isPublic,
        ownerId: schema.channels.ownerId,
      })
      .from(schema.channels)
      .where(eq(schema.channels.id, channelId))
      .limit(1);

    const channel = channelRows[0];
    if (!channel) {
      return null;
    }

    const groupMembershipRows = channel.groupId
      ? await db
          .select({ role: schema.groupMembers.role })
          .from(schema.groupMembers)
          .where(
            and(
              eq(schema.groupMembers.groupId, channel.groupId),
              eq(schema.groupMembers.userId, userId),
            ),
          )
          .limit(1)
      : [];

    const channelMembershipRows = await db
      .select({ userId: schema.channelMembers.userId })
      .from(schema.channelMembers)
      .where(
        and(
          eq(schema.channelMembers.channelId, channelId),
          eq(schema.channelMembers.userId, userId),
        ),
      )
      .limit(1);

    const access = summarizeChannelParticipationAccess({
      groupId: channel.groupId,
      isPublic: channel.isPublic ?? true,
      hasActiveGroupMembership: groupMembershipRows.length > 0,
      isChannelMember: channel.ownerId === userId || channelMembershipRows.length > 0,
    });

    return { channel, access };
  }

  // In-memory state
  const players = new Map();
  const npcConfigCache = new Map();
  const lastChatTime = new Map();
  const meetingRooms = new Map(); // channelId → { participants: Set, messages: [] }
  const activeBrokers = new Map(); // channelId -> MeetingBroker instance
  const discussionInitiators = new Map(); // channelId → userId
  const userSockets = new Map(); // userId -> Set<socketId> (all active sessions/devices)
  const channelOwners = new Map(); // channelId → ownerId
  const channelGateways = new Map();
  const ollamaGateway = new OllamaGateway(process.cwd()); // channelId → OpenClawGateway instance
  const channelChatHistory = new Map(); // channelId -> message[] (all messages kept for session lifetime)
  const npcChatHistory = globalThis.sharedNpcChatHistory || new Map(); // `${channelId}:${npcId}` -> message[] (all messages kept for session lifetime)
  globalThis.sharedNpcChatHistory = npcChatHistory;
  globalThis.sharedMeetingRooms = meetingRooms;
  globalThis.sharedActiveBrokers = activeBrokers;
  const CHAT_COOLDOWN_MS = 2000;
  const PROGRESS_NUDGE_SCAN_MS = 60_000;
  const progressNudgeInFlight = new Set();
  const progressNudgeCooldowns = new Map();

  function getSocketLocale(socket) {
    const cookieHeader = socket.handshake.headers.cookie || "";
    const localeMatch = cookieHeader.match(/(?:^|;\s*)deskrpg-locale=([^;]+)/);
    return normalizeTaskPromptLocale(localeMatch && localeMatch[1]);
  }

  function getJoinedSocketsForUserAndChannel(userId, channelId) {
    return Array.from(players.values())
      .filter((player) => player.userId === userId && player.mapId === channelId)
      .map((player) => io.sockets.sockets.get(player.id))
      .filter(Boolean);
  }

  function addUserSocket(userId, socketId) {
    const sockets = userSockets.get(userId) || new Set();
    sockets.add(socketId);
    userSockets.set(userId, sockets);
  }

  function removeUserSocket(userId, socketId) {
    const sockets = userSockets.get(userId);
    if (!sockets) return;
    sockets.delete(socketId);
    if (sockets.size === 0) userSockets.delete(userId);
  }

  function getSocketsForUser(userId) {
    return Array.from(userSockets.get(userId) || [])
      .map((socketId) => io.sockets.sockets.get(socketId))
      .filter(Boolean);
  }

  function appendNpcHistoryMessage(channelId, npcId, content) {
    const sanitizedContent = require("./src/lib/task-block-utils.js").sanitizeNpcResponseText(content);
    if (!sanitizedContent.trim()) return null;
    const historyKey = `${channelId}:${npcId}`;
    const history = npcChatHistory.get(historyKey) || [];
    history.push({ role: "npc", content: sanitizedContent, timestamp: Date.now() });
    npcChatHistory.set(historyKey, history);
    return sanitizedContent;
  }

  function appendNpcHistoryMessageForUser(userId, channelId, npcId, content) {
    const sanitizedContent = appendNpcHistoryMessage(channelId, npcId, content);
    if (!sanitizedContent) return;

    const joinedSockets = getJoinedSocketsForUserAndChannel(userId, channelId);
    for (const joinedSocket of joinedSockets) {
      joinedSocket.emit("npc:history-append", { npcId, message: sanitizedContent, role: "npc", timestamp: Date.now() });
    }
  }

  async function deliverPendingReportsToSocket(socket, userId, channelId) {
    const pendingReports = await getPendingReportsForUserAndChannel(
      db,
      reportSchema,
      { userId, channelId },
    );

    for (const report of pendingReports) {
      const npcConfig = await getNpcConfig(report.npcId);
      socket.emit("npc:report-ready", toReportReadyPayload(report, npcConfig?._name));
      await markReportDelivered(db, reportSchema, report.id);
    }
  }

  async function getAssignerUserId(assignerId) {
    const rows = await db
      .select({ userId: schema.characters.userId })
      .from(schema.characters)
      .where(eq(schema.characters.id, assignerId));
    return rows[0]?.userId || null;
  }

  async function getChannelTaskAutomation(channelId) {
    const rows = await db
      .select({ gatewayConfig: schema.channels.gatewayConfig })
      .from(schema.channels)
      .where(eq(schema.channels.id, channelId));
    return getTaskAutomationConfigLocal(rows[0]?.gatewayConfig || null);
  }

  async function processNpcTaskActions(parsed, input) {
    const taskAutomation = await getChannelTaskAutomation(input.channelId);
    for (const taskAction of parsed.tasks) {
      if (!isValidTaskAction(taskAction)) {
        console.warn("[TaskManager] Invalid task action:", taskAction);
        continue;
      }

      try {
        const task = await taskManager.handleTaskAction(
          taskAction,
          input.channelId,
          input.npcId,
          input.assignerCharacterId,
          { autoNudgeMax: taskAutomation.autoProgressNudgeMax },
        );

        if (!task) continue;

        io.to(input.channelId).emit("task:updated", { task, action: taskAction.action });

        if (shouldDeliverCompletionReport(taskAction)) {
          appendNpcHistoryMessage(input.channelId, input.npcId, parsed.message);
          const report = await enqueueCompletionReport(
            db,
            reportSchema,
            buildCompletionReportRow({
              channelId: input.channelId,
              npcId: input.npcId,
              taskId: task.id,
              targetUserId: input.targetUserId,
              message: parsed.message,
            }),
          );

          if (report) {
            const joinedSockets = getJoinedSocketsForUserAndChannel(input.targetUserId, input.channelId);
            if (joinedSockets.length > 0) {
              const payload = toReportReadyPayload(report, input.npcName);
              for (const joinedSocket of joinedSockets) {
                joinedSocket.emit("npc:report-ready", payload);
              }
              await markReportDelivered(db, reportSchema, report.id);
            }
          }
        }
      } catch (err) {
        console.error("[TaskManager] Error handling task action:", err);
      }
    }
  }

  async function runProgressNudgeForTask(task, promptOverride, reportKind = "progress") {
    if (progressNudgeInFlight.has(task.id)) return;
    progressNudgeInFlight.add(task.id);

    try {
      const npcConfig = await getNpcConfig(task.npcId);
      const agentId = npcConfig?.agentId || npcConfig?.agent_id || null;
      if (!npcConfig || !agentId) return;

      const targetUserId = await getAssignerUserId(task.assignerId);
      if (!targetUserId) return;

      const gateway = await getOrConnectGateway(task.channelId);
      if (!gateway) return;

      const sessionKey = `${npcConfig.sessionKeyPrefix || task.npcId}-dm-${targetUserId}`;
      await taskManager.markTaskNudged(task.id, task.channelId);
      const taskPrompt = withTaskReminder(promptOverride || buildAutoExecutionPrompt(task));
      const memoryContext = await buildNpcMemoryContext({
        npcId: task.npcId,
        npcName: npcConfig._name,
        channelId: task.channelId,
        userMessage: taskPrompt,
        source: "task",
      });
      const response = await gateway.chatSend(
        agentId,
        sessionKey,
        attachNpcMemoryToPrompt(taskPrompt, memoryContext),
        () => {},
      );
      const parsed = parseNpcResponse(response);

      await processNpcTaskActions(parsed, {
        channelId: task.channelId,
        npcId: task.npcId,
        npcName: npcConfig._name,
        assignerCharacterId: task.assignerId,
        targetUserId,
      });

      const preview = (parsed.message || "").trim() || `O progresso de ${task.title} foi relatado.`;
      void saveNpcConversationMemory({
        npcId: task.npcId,
        npcName: npcConfig._name,
        channelId: task.channelId,
        userMessage: taskPrompt,
        npcResponse: preview,
        source: "task",
      });
      appendNpcHistoryMessage(task.channelId, task.npcId, preview);

      const report = await enqueueQueuedReport(
        db,
        reportSchema,
        buildQueuedReportRow({
          channelId: task.channelId,
          npcId: task.npcId,
          taskId: task.id,
          targetUserId,
          message: preview,
          kind: reportKind,
        }),
      );

      if (report) {
        const joinedSockets = getJoinedSocketsForUserAndChannel(targetUserId, task.channelId);
        if (joinedSockets.length > 0) {
          const payload = toReportReadyPayload(report, npcConfig._name);
          for (const joinedSocket of joinedSockets) {
            joinedSocket.emit("npc:report-ready", payload);
          }
          await markReportDelivered(db, reportSchema, report.id);
        }
      }
    } catch (err) {
      console.error("[task-reporting] Progress nudge failed:", err);
    } finally {
      progressNudgeInFlight.delete(task.id);
    }
  }

  async function scanProgressNudges() {
    try {
      const channelRows = await db
        .select({ id: schema.channels.id, gatewayConfig: schema.channels.gatewayConfig })
        .from(schema.channels);

      for (const channelRow of channelRows) {
        const taskAutomation = getTaskAutomationConfigLocal(channelRow.gatewayConfig);
        if (!taskAutomation.autoProgressNudgeEnabled) continue;

        const cutoffIso = new Date(
          getProgressNudgeCutoff(taskAutomation.autoProgressNudgeMinutes),
        ).toISOString();

        const staleTasks = await taskManager.getStaleInProgressTasks(channelRow.id, cutoffIso);
        for (const task of staleTasks) {
          const autoNudgeMax = task.autoNudgeMax ?? taskAutomation.autoProgressNudgeMax;
          if ((task.autoNudgeCount ?? 0) >= autoNudgeMax) {
            const stalledTask = await taskManager.markTaskStalled(task.id, channelRow.id, "max_nudges_reached");
            if (stalledTask) {
              io.to(channelRow.id).emit("task:updated", { task: stalledTask, action: "stalled" });
            }
            continue;
          }

          const lastNudgedAt = progressNudgeCooldowns.get(task.id) || 0;
          if (Date.now() - lastNudgedAt < taskAutomation.autoProgressNudgeMinutes * 60 * 1000) {
            continue;
          }

          progressNudgeCooldowns.set(task.id, Date.now());
          await runProgressNudgeForTask(task, buildAutoExecutionPrompt(task));
        }
      }
    } catch (err) {
      console.error("[task-reporting] Progress nudge scan failed:", err);
    }
  }

  setInterval(() => {
    void scanProgressNudges();
  }, PROGRESS_NUDGE_SCAN_MS);

  const NPC_AUTOMATION_WORKER_ENABLED = process.env.NPC_AUTOMATION_WORKER_ENABLED !== "0";
  const NPC_AUTOMATION_WORKER_INTERVAL_MS = Math.max(
    5000,
    Number(process.env.NPC_AUTOMATION_WORKER_INTERVAL_MS || 15000),
  );
  const NPC_AUTOMATION_WORKER_BATCH = Math.max(
    1,
    Math.min(Number(process.env.NPC_AUTOMATION_WORKER_BATCH || 5), 20),
  );

	  if (NPC_AUTOMATION_WORKER_ENABLED && typeof processPendingNpcAutomations === "function") {
    let automationWorkerRunning = false;
    setInterval(() => {
      if (automationWorkerRunning) return;
      automationWorkerRunning = true;
      processPendingNpcAutomations(NPC_AUTOMATION_WORKER_BATCH)
        .catch((err) => {
          console.error("[npc-automation] Worker scan failed:", err);
        })
        .finally(() => {
          automationWorkerRunning = false;
        });
    }, NPC_AUTOMATION_WORKER_INTERVAL_MS);
	    console.log(`[npc-automation] Worker enabled — interval=${NPC_AUTOMATION_WORKER_INTERVAL_MS}ms batch=${NPC_AUTOMATION_WORKER_BATCH}`);
	  }

  const NPC_OPERATIONAL_EVENTS_ENABLED = process.env.NPC_OPERATIONAL_EVENTS_ENABLED !== "0";
  const NPC_OVERDUE_SCAN_INTERVAL_MS = Math.max(
    60_000,
    Number(process.env.NPC_OVERDUE_SCAN_INTERVAL_MS || 15 * 60_000),
  );
  const NPC_DAILY_REPORT_INTERVAL_MS = Math.max(
    60_000,
    Number(process.env.NPC_DAILY_REPORT_INTERVAL_MS || 60 * 60_000),
  );

  if (NPC_OPERATIONAL_EVENTS_ENABLED && typeof enqueueOperationalEventJobs === "function") {
    setInterval(() => {
      try {
        const jobs = enqueueOperationalEventJobs("scan_overdue_tasks");
        if (jobs.length) console.log(`[npc-automation] Overdue scan queued ${jobs.length} job(s).`);
      } catch (err) {
        console.error("[npc-automation] Overdue event failed:", err);
      }
    }, NPC_OVERDUE_SCAN_INTERVAL_MS);

    setInterval(() => {
      try {
        const jobs = enqueueOperationalEventJobs("daily_operations_report");
        if (jobs.length) console.log(`[npc-automation] Daily report queued ${jobs.length} job(s).`);
      } catch (err) {
        console.error("[npc-automation] Daily report event failed:", err);
      }
    }, NPC_DAILY_REPORT_INTERVAL_MS);

    console.log(`[npc-automation] Operational events enabled — overdue=${NPC_OVERDUE_SCAN_INTERVAL_MS}ms daily=${NPC_DAILY_REPORT_INTERVAL_MS}ms`);
  }

  async function getNpcConfig(npcId) {
    if (npcConfigCache.has(npcId)) return npcConfigCache.get(npcId);
    try {
      const rows = await db.select({
        name: schema.npcs.name,
        openclawConfig: schema.npcs.openclawConfig,
        channelId: schema.npcs.channelId,
      }).from(schema.npcs).where(eq(schema.npcs.id, npcId));
      if (rows.length === 0) return null;
      const r = rows[0];
      const openclawConfig = parseJson(r.openclawConfig);
      const config = { ...openclawConfig, _channelId: r.channelId, _name: r.name };
      npcConfigCache.set(npcId, config);
      return config;
    } catch (err) {
      console.error("[npc] DB error:", err);
      return null;
    }
  }

  function decryptGatewayToken(payload) {
    const crypto = require("node:crypto");
    const secret = process.env.INTERNAL_RPC_SECRET || process.env.JWT_SECRET;
    if (!secret) throw new Error("Missing JWT_SECRET for gateway token decryption");
    const key = crypto.createHash("sha256").update(secret).digest();
    const [version, ivB64, tagB64, encryptedB64] = payload.split(":");
    if (version !== "v1" || !ivB64 || !tagB64 || !encryptedB64) {
      throw new Error("Invalid gateway token payload");
    }
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64url"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(encryptedB64, "base64url")), decipher.final()]).toString("utf8");
  }

  function normalizeGatewayModel(model) {
    const value = typeof model === "string" ? model.trim() : "";
    if (!value || value === "provider-default" || value === "default" || value === "channel-default") {
      return null;
    }
    return value;
  }

  async function getOrConnectGateway(channelId, overrides = {}) {
    const requestedProvider = overrides.provider && overrides.provider !== "channel-default"
      ? String(overrides.provider)
      : null;
    const requestedModel = normalizeGatewayModel(overrides.model);

    let gatewayKey = channelId;
    if (channelGateways.has(gatewayKey)) {
      const gw = channelGateways.get(gatewayKey);
      if (gw.isConnected()) return gw;
      gw.disconnect();
      channelGateways.delete(gatewayKey);
    }

    try {
      // Look up gateway via channel_gateway_bindings → gateway_resources
      const bindings = await db
        .select({ gatewayId: schema.channelGatewayBindings.gatewayId })
        .from(schema.channelGatewayBindings)
        .where(eq(schema.channelGatewayBindings.channelId, channelId))
        .limit(1);

      let bindingGatewayId = bindings[0]?.gatewayId || null;
      let resource = null;

      if (bindingGatewayId) {
        const [boundResource] = await db
          .select({
            id: schema.gatewayResources.id,
            baseUrl: schema.gatewayResources.baseUrl,
            tokenEncrypted: schema.gatewayResources.tokenEncrypted,
            provider: schema.gatewayResources.provider,
            workspacePath: schema.gatewayResources.workspacePath,
          })
          .from(schema.gatewayResources)
          .where(eq(schema.gatewayResources.id, bindingGatewayId))
          .limit(1);
        resource = boundResource || null;
      }

      if (requestedProvider && resource?.provider !== requestedProvider) {
        const [runtimeResource] = await db
          .select({
            id: schema.gatewayResources.id,
            baseUrl: schema.gatewayResources.baseUrl,
            tokenEncrypted: schema.gatewayResources.tokenEncrypted,
            provider: schema.gatewayResources.provider,
            workspacePath: schema.gatewayResources.workspacePath,
          })
          .from(schema.gatewayResources)
          .where(eq(schema.gatewayResources.provider, requestedProvider))
          .limit(1);
        if (runtimeResource) {
          resource = runtimeResource;
          bindingGatewayId = runtimeResource.id;
        }
      }

      if (!resource?.provider) return null;

      const provider = requestedProvider || resource.provider;
      const workspacePath = overrides.workspacePath || resource.workspacePath || process.cwd();
      gatewayKey = [
        bindingGatewayId || channelId,
        provider,
        workspacePath,
        requestedModel || "",
      ].join(":");

      if (channelGateways.has(gatewayKey)) {
        const gw = channelGateways.get(gatewayKey);
        if (gw.isConnected()) return gw;
        gw.disconnect();
        channelGateways.delete(gatewayKey);
      }

      let gateway;
      if (provider === "claude-code") {
        gateway = new ClaudeCodeGateway(workspacePath, requestedModel ? { model: requestedModel } : undefined);
        await gateway.connect();
      } else if (provider === "codex") {
        gateway = new CodexGateway(workspacePath, requestedModel ? { model: requestedModel } : undefined);
        await gateway.connect();
      } else {
        if (!resource?.baseUrl || !resource?.tokenEncrypted) return null;
        const token = decryptGatewayToken(resource.tokenEncrypted);
        gateway = new OpenClawGateway();
        await gateway.connect(resource.baseUrl, token);
      }

      channelGateways.set(gatewayKey, gateway);
      return gateway;
    } catch (err) {
      console.error(`[gateway] Failed to connect for channel ${channelId.slice(0, 8)}:`, err.message);
      return null;
    }
  }

  async function callGatewayRpc(gateway, method, params = {}) {
    if (typeof gateway?._rpcRequest === "function") {
      return gateway._rpcRequest(method, params);
    }

    switch (method) {
      case "agents.list":
        if (typeof gateway?.agentsList === "function") return gateway.agentsList();
        break;
      case "agents.create":
        if (typeof gateway?.agentsCreate === "function") {
          return gateway.agentsCreate(params.name, params.workspace, params.emoji);
        }
        break;
      case "agents.delete":
        if (typeof gateway?.agentsDelete === "function") {
          return gateway.agentsDelete(params.agentId, Boolean(params.deleteFiles));
        }
        break;
      case "agents.files.get":
        if (typeof gateway?.agentsFileGet === "function") {
          return gateway.agentsFileGet(params.agentId, params.name);
        }
        break;
      case "agents.files.set":
        if (typeof gateway?.agentsFileSet === "function") {
          return gateway.agentsFileSet(params.agentId, params.name, params.content);
        }
        break;
      case "chat.abort":
        if (typeof gateway?.chatAbort === "function") {
          return gateway.chatAbort(params.agentId, params.sessionKey);
        }
        break;
      default:
        break;
    }

    throw new Error(`Gateway method not supported: ${method}`);
  }

  async function streamNpcResponse(socket, npcId, npcConfig, userId, message, player) {
    const agentId = npcConfig.agentId || npcConfig.agent_id || null;
    if (!agentId) {
      socket.emit("npc:response", { npcId, chunk: "[This NPC has no AI agent connected]", done: true });
      return null;
    }

    const channelId = npcConfig._channelId;
    const gateway = channelId ? await getOrConnectGateway(channelId, {
      provider: npcConfig.runtimeProvider,
      model: npcConfig.model,
    }) : null;
    if (!gateway) {
      socket.emit("npc:response", { npcId, chunk: "[Gateway not connected]", done: true });
      return null;
    }

    const sessionKey = `${npcConfig.sessionKeyPrefix || npcId}-dm-${userId}`;
    const provider = npcConfig.runtimeProvider && npcConfig.runtimeProvider !== "channel-default"
      ? npcConfig.runtimeProvider
      : gateway.constructor.name.replace("Gateway", "").toLowerCase();
    console.log(`[npc:chat] NPC: ${npcConfig._name || npcId}, Provider: ${provider}, Session: ${sessionKey}`);
    const model = npcConfig.model || "Default";
    try {

        const memoryContext = await buildNpcMemoryContext({
        npcId,
        npcName: npcConfig._name || npcId,
        channelId,
        userMessage: message,
        source: "escritorio",
        userId,
        characterId: player?.characterId || null,
        userName: player?.characterName || null,
      });

      const officeContext = await buildOfficeCentralPromptContext({
        channelId,
        npcId,
        message,
      });
      const fullPrompt = attachNpcMemoryToPrompt(
        [officeContext, message].filter(Boolean).join("\n\n"),
        memoryContext,
      );
      const powersWithContext = npcConfig.powers ? { ...npcConfig.powers } : {};
      const envVars = { ...(powersWithContext.envVars || {}) };
      const starkenRoot = process.env.STARKEN_OS_ROOT || require("node:path").resolve(process.cwd(), "..");
      envVars.DESKRPG_CHANNEL_ID = channelId;
      envVars.DESKRPG_NPC_ID = npcId;
      envVars.DESKRPG_API_BASE = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      envVars.DESKRPG_MEMORY_PROVIDER = "vps";
      envVars.STARKEN_OS_ROOT = envVars.STARKEN_OS_ROOT || starkenRoot;
      envVars.STARKEN_WORKSPACE_DATA_ROOT = envVars.STARKEN_WORKSPACE_DATA_ROOT || require("node:path").join(starkenRoot, "workspace-data");
      envVars.NPC_MEMORY_FILE_ROOT = envVars.NPC_MEMORY_FILE_ROOT || process.env.NPC_MEMORY_FILE_ROOT || require("node:path").join(starkenRoot, "agent-memory");
      try {
        const [channelRow] = await db
          .select({ gatewayConfig: schema.channels.gatewayConfig })
          .from(schema.channels)
          .where(eq(schema.channels.id, channelId))
          .limit(1);
        const gatewayConfig = parseJson(channelRow?.gatewayConfig) || {};
        if (gatewayConfig.libraryToken) envVars.DESKRPG_LIBRARY_TOKEN = String(gatewayConfig.libraryToken);
      } catch { /* token is optional for non-internal calls */ }
      powersWithContext.envVars = envVars;
      const sandboxPaths = Array.isArray(powersWithContext.sandboxPaths) ? powersWithContext.sandboxPaths : [];
      powersWithContext.sandboxPaths = Array.from(new Set([
        ...sandboxPaths,
        starkenRoot,
        require("node:path").join(starkenRoot, "escritorio"),
        require("node:path").join(starkenRoot, "agent-memory"),
        require("node:path").join(starkenRoot, "workspace-data"),
      ]));

      try {
        const response = await gateway.chatSend(agentId, sessionKey, fullPrompt, (delta) => {
          socket.emit("npc:response", { npcId, chunk: delta, done: false, provider, model });
        }, undefined, undefined, undefined, powersWithContext);
        socket.emit("npc:response", { npcId, chunk: "", done: true, provider, model });
        return { text: response || "", provider, model };
      } catch (err) {
        console.warn(`[npc:chat] Primary gateway failed (${provider}), attempting Ollama fallback...`, err.message);
        try {
          const ollamaConnected = await ollamaGateway.connect();
          if (!ollamaConnected) throw new Error("Ollama not available");
          socket.emit("npc:response", { npcId, chunk: "[Conexão instável. Usando backup local...] ", done: false });
          const response = await ollamaGateway.chatSend(null, sessionKey, fullPrompt, (delta) => {
            socket.emit("npc:response", { npcId, chunk: delta, done: false, provider: "ollama", model: "llama3.2" });
          });
          socket.emit("npc:response", { npcId, chunk: "", done: true, provider: "ollama", model: "llama3.2" });
          return { text: response || "", provider: "ollama", model: "llama3.2" };
        } catch (fErr) {
          console.error("[npc:chat] Fallback failed:", fErr.message);
          throw err;
        }
      }
      } catch (err) {
      console.error("[npc] Chat error:", err.message);
      socket.emit("npc:response", { npcId, chunk: "[AI Gateway error]", done: true });
      return null;
    }
  }

  async function sendNpcMessageViaRuntime({ channelId, npcConfig, sessionKey, message, onDelta, logPrefix }) {
    const agentId = npcConfig.agentId || npcConfig.agent_id || null;
    if (!agentId) {
      throw new Error(`NPC ${npcConfig.id} has no agent configured`);
    }

    const gateway = await getOrConnectGateway(channelId, {
      provider: npcConfig.runtimeProvider,
      model: npcConfig.model,
    });
    if (!gateway) {
      throw new Error(`Gateway not connected for channel ${channelId}`);
    }

    const personaConfig = npcConfig.personaConfig || {};
    const personaParts = [personaConfig.identity, personaConfig.soul].filter(Boolean);
    const npcSystemPrompt = personaParts.length > 0 ? personaParts.join("\n\n") : null;

    try {
      const memoryContext = await buildNpcMemoryContext({
        npcId: npcConfig.id || agentId,
        npcName: npcConfig._name || npcConfig.name || agentId,
        channelId,
        userMessage: message,
        source: "escritorio",
      });
      const response = await gateway.chatSend(
        agentId,
        sessionKey,
        attachNpcMemoryToPrompt(message, memoryContext),
        onDelta,
        undefined,
        npcSystemPrompt,
        npcConfig.powers || undefined,
      );
      void saveNpcConversationMemory({
        npcId: npcConfig.id || agentId,
        npcName: npcConfig._name || npcConfig.name || agentId,
        channelId,
        userMessage: message,
        npcResponse: response || "",
        source: "escritorio",
      });
      return { response: response || "", usageModel: npcConfig.model || "" };
    } catch (err) {
      console.error(`[${logPrefix || "npc-runtime"}] NPC runtime failed for ${npcConfig.id || agentId}:`, err);
      throw err;
    }
  }

  async function generateMeetingSummary(gateway, agentId, sessionKeyPrefix, meetingId, topic, transcript) {
    const summaryPrompt = `Analise o conteúdo desta reunião e responda apenas em JSON, em português do Brasil.

Tema da reunião: ${topic}

${transcript}

Formato de resposta (somente JSON, sem nenhum outro texto):
{
  "keyTopics": ["Tópico 1", "Tópico 2", "Tópico 3"],
  "conclusions": "Resumo conclusivo em 2 ou 3 frases"
}`;

    try {
      const sessionKey = `${sessionKeyPrefix}-summary-${meetingId}`;
      const response = await Promise.race([
        gateway.chatSend(agentId, sessionKey, summaryPrompt, () => {}),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Summary timeout")), 60000)),
      ]);
      const text = response || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          keyTopics: Array.isArray(parsed.keyTopics) ? parsed.keyTopics : [],
          conclusions: typeof parsed.conclusions === "string" ? parsed.conclusions : null,
        };
      }
      return { keyTopics: [], conclusions: null };
    } catch (err) {
      console.warn("[meeting] Summary generation failed:", err.message);
      return { keyTopics: [], conclusions: null };
    }
  }

  async function getNpcConfigsForChannel(channelId) {
    try {
      const rows = await db.select({
        id: schema.npcs.id,
        name: schema.npcs.name,
        openclawConfig: schema.npcs.openclawConfig,
      }).from(schema.npcs).where(eq(schema.npcs.channelId, channelId));
      return rows.map(r => {
        const config = parseJson(r.openclawConfig) || {};
        const personaConfig = config.personaConfig && typeof config.personaConfig === "object"
          ? config.personaConfig
          : null;
        return {
          id: r.id,
          npcId: r.id,
          name: r.name,
          _name: r.name,
          _channelId: channelId,
          agentId: config.agentId || config.agent_id || null,
          sessionKeyPrefix: config.sessionKeyPrefix || config.session_key_prefix || "",
          role: "Participant",
          passPolicy: config.passPolicy || null,
          runtimeProvider: config.runtimeProvider || config.provider || null,
          provider: config.runtimeProvider || config.provider || null,
          model: typeof config.model === "string" ? config.model : null,
          personaConfig: personaConfig ? {
            identity: typeof personaConfig.identity === "string" ? personaConfig.identity : undefined,
            soul: typeof personaConfig.soul === "string" ? personaConfig.soul : undefined,
          } : null,
          powers: config.powers || null,
        };
      });
    } catch (err) {
      console.error("[meeting] Failed to load NPCs:", err);
      return [];
    }
  }

  function isMeetingController(channelId, userId) {
    return discussionInitiators.get(channelId) === userId
        || channelOwners.get(channelId) === userId;
  }

  
  /**
   * Detects if an NPC mentioned another NPC and triggers a response from the mentioned agent.
   */
  async function handleInterAgentMentions(socket, channelId, lastNpcId, responseText, depth = 0) {
    if (depth > 1) return; // Limit to 1 level of automatic follow-up to prevent infinite loops

    const allNpcs = await getNpcConfigsForChannel(channelId);
    // Find all NPCs mentioned in the text (excluding the one who just spoke)
    const mentionedNpcs = allNpcs.filter(n => {
      const currentNpcId = n?.npcId || n?.id;
      if (!n || !currentNpcId || currentNpcId === lastNpcId) return false;
      const name = String(n._name || n.name || currentNpcId || "").toLowerCase();
      if (!name) return false;
      const firstName = name.split(' ')[0];
      const text = (responseText || "").toLowerCase();
      return text.includes(name) || (firstName.length > 3 && text.includes(firstName));
    });

    for (const npc of mentionedNpcs) {
      const mentionedNpcId = npc.npcId || npc.id;
      console.log(`[Inter-Agent] Triggering ${npc._name || npc.name || mentionedNpcId} due to mention by ${lastNpcId}`);
      
      const player = players.get(socket.id);
      const historyKey = player ? `${player.mapId}:${mentionedNpcId}` : mentionedNpcId;
      const history = npcChatHistory.get(historyKey) || [];
      
      const contextMessage = `[Internal System] You were mentioned by ${lastNpcId} in the conversation. They said: "${responseText}". Please respond to them or address the mention if appropriate.`;
      history.push({ role: "system", content: contextMessage, timestamp: Date.now() });
      
      // We don't await here to allow parallel processing if multiple mentioned, 
      // but we do it sequentially to keep the chat flow readable.
      const followUpResult = await streamNpcResponse(socket, mentionedNpcId, npc, player?.userId || "system", contextMessage, player);
      const followUpResponse = followUpResult?.text || "";
      if (followUpResponse) {
        history.push({ 
          role: "npc", 
          content: followUpResponse, 
          timestamp: Date.now(), 
          provider: followUpResult.provider || npc.provider || "codex", 
          model: followUpResult.model || npc.model || "Default" 
        });
        npcChatHistory.set(historyKey, history);
        
        // Recursive check (one level deep)
        await handleInterAgentMentions(socket, channelId, mentionedNpcId, followUpResponse, depth + 1);
      }
    }
  }

  io.on("connection", async (socket) => {
    const user = await authenticateSocket(socket);
    if (!user) { socket.disconnect(true); return; }

    socket.on("player:join", async (data) => {
      // Verify channel membership
      try {
        const memberRows = await db.select({ role: schema.channelMembers.role })
          .from(schema.channelMembers)
          .where(and(eq(schema.channelMembers.channelId, data.mapId), eq(schema.channelMembers.userId, user.userId)));
        if (memberRows.length === 0) {
          socket.emit("join-error", { error: "Not a member of this channel" });
          return;
        }
      } catch (err) {
        console.error("[socket] Membership check failed:", err);
        // Allow join on DB error (safety net should not block)
      }

      // Cache channel owner and connect gateway
      try {
        const ownerRows = await db.select({ ownerId: schema.channels.ownerId })
          .from(schema.channels).where(eq(schema.channels.id, data.mapId));
        if (ownerRows.length > 0) {
          channelOwners.set(data.mapId, ownerRows[0].ownerId);
        }
        // Connect gateway (non-blocking)
        getOrConnectGateway(data.mapId).catch(() => {});
      } catch (err) {
        console.error("[socket] Channel cache failed:", err);
      }

      let canonicalCharacterName = data.characterName;
      try {
        if (data.characterId) {
          const characterRows = await db.select({ name: schema.characters.name })
            .from(schema.characters)
            .where(and(eq(schema.characters.id, data.characterId), eq(schema.characters.userId, user.userId)))
            .limit(1);
          if (characterRows.length > 0) {
            canonicalCharacterName = characterRows[0].name;
          }
        }
      } catch (err) {
        console.error("[socket] Character identity check failed:", err);
      }

      const playerState = {
        id: socket.id, userId: user.userId,
        characterId: data.characterId, characterName: canonicalCharacterName,
        appearance: data.appearance, mapId: data.mapId,
        x: data.x, y: data.y, direction: "down", animation: "idle",
      };
      players.set(socket.id, playerState);
      addUserSocket(user.userId, socket.id);
      socket.join(data.mapId);
      const mapPlayers = Array.from(players.values()).filter(p => p.mapId === data.mapId && p.id !== socket.id);
      socket.emit("players:state", { players: mapPlayers });
      // Send channel chat history to the joining player
      const chatHistory = channelChatHistory.get(data.mapId);
      if (chatHistory && chatHistory.length > 0) {
        socket.emit("chat:history", { messages: chatHistory });
      }
      // Send pending NPC reports
      await deliverPendingReportsToSocket(socket, user.userId, data.mapId);
      socket.to(data.mapId).emit("player:joined", playerState);
    });

    socket.on("player:move", (data) => {
      const player = players.get(socket.id);
      if (!player) return;
      Object.assign(player, { x: data.x, y: data.y, direction: data.direction, animation: data.animation });
      socket.to(player.mapId).emit("player:moved", { id: socket.id, ...data });
    });

    socket.on("npc:chat", async (data) => {
      const { npcId, message } = data || {};
      if (!npcId || !message) return;
      const trimmed = String(message).trim().slice(0, 500);
      if (!trimmed) return;
      const now = Date.now();
      if (now - (lastChatTime.get(socket.id) || 0) < CHAT_COOLDOWN_MS) {
        socket.emit("npc:response", { npcId, chunk: "[Wait before sending.]", done: true });
        return;
      }
      lastChatTime.set(socket.id, now);
      const npcConfig = await getNpcConfig(npcId);
      if (!npcConfig) { socket.emit("npc:response", { npcId, chunk: "[NPC not found]", done: true }); return; }
      const player = players.get(socket.id);
      const historyKey = player ? `${player.mapId}:${npcId}` : npcId;
      const npcHistory = npcChatHistory.get(historyKey) || [];
      npcHistory.push({ role: "player", content: trimmed, timestamp: Date.now(), sender: player?.characterName });
      // Inject the task protocol reminder into every message.
      const messageToSend = withTaskReminder(trimmed, getSocketLocale(socket));
      const responseResult = await streamNpcResponse(socket, npcId, npcConfig, user.userId, messageToSend, player);
      const response = responseResult?.text || "";
      if (response) {
        npcHistory.push({ role: "npc", content: response, timestamp: Date.now(), provider: responseResult.provider || "codex", model: responseResult.model || "Default" });
        void saveNpcConversationMemory({
          npcId,
          npcName: npcConfig._name || npcId,
          channelId: npcConfig._channelId || player?.mapId || "",
          userMessage: trimmed,
          npcResponse: response,
          source: "escritorio",
          userName: player?.characterName || null,
          userId: player?.userId || user.userId,
          characterId: player?.characterId || null,
        });

        // Task Parser: extract task metadata from the response.
        const parsed = parseNpcResponse(response);

        // Process task actions. The client strips json:task blocks when done=true.
        if (parsed.tasks.length > 0 && player?.characterId) {
          await processNpcTaskActions(parsed, {
            channelId: npcConfig._channelId,
            npcId,
            npcName: npcConfig._name,
            assignerCharacterId: player.characterId,
            targetUserId: player.userId,
          });
        } else if (parsed.tasks.length > 0) {
          console.warn("[TaskManager] No characterId for socket", socket.id);
        }

                // Trigger inter-agent collaboration if other NPCs are mentioned
        void handleInterAgentMentions(socket, npcConfig._channelId || player?.mapId, npcId, response);

        // Notify client that NPC has a completed response — client will check distance and move NPC if needed
        socket.emit("npc:response-complete", { npcId, npcName: npcConfig._name || npcId });
      }
      npcChatHistory.set(historyKey, npcHistory);
    });

    socket.on("task:list", async ({ channelId, npcId }) => {
      try {
        const tasks = npcId
          ? await taskManager.getTasksByNpc(npcId)
          : await taskManager.getTasksByChannel(channelId);
        socket.emit("task:list-response", { tasks, npcId: npcId || null });
      } catch (err) {
        console.error("[TaskManager] Error fetching tasks:", err);
        socket.emit("task:list-response", { tasks: [], npcId: npcId || null });
      }
    });

    socket.on("task:delete", async ({ taskId }) => {
      try {
        const player = players.get(socket.id);
        if (!player) return;
        // Only allow deleting tasks that belong to the current channel.
        const deleted = await taskManager.deleteTask(taskId, player.mapId);
        if (deleted) {
          io.to(player.mapId).emit("task:deleted", { taskId });
        }
      } catch (err) {
        console.error("[TaskManager] Error deleting task:", err);
      }
    });

    socket.on("task:request-report", async ({ taskId }) => {
      try {
        const player = players.get(socket.id);
        if (!player || !taskId) return;

        const task = await taskManager.getTaskById(taskId, player.mapId);
        if (!task) return;
        if (task.status === "complete" || task.status === "cancelled") return;

        let runnableTask = task;
        if (task.status === "stalled") {
          const resumedTask = await taskManager.resumeTask(task.id, player.mapId);
          if (!resumedTask) return;
          io.to(player.mapId).emit("task:updated", { task: resumedTask, action: "resume" });
          runnableTask = resumedTask;
        }

        appendNpcHistoryMessageForUser(
          player.userId,
          player.mapId,
          runnableTask.npcId,
          buildTaskActionStartMessage({ title: runnableTask.title }, "request-report"),
        );

        await runProgressNudgeForTask(runnableTask, buildManualTaskReportPrompt({
          title: runnableTask.title,
          summary: runnableTask.summary,
          npcTaskId: runnableTask.npcTaskId,
          status: runnableTask.status,
        }), "manual");
      } catch (err) {
        console.error("[TaskManager] Error requesting task report:", err);
      }
    });

    socket.on("task:resume", async ({ taskId }) => {
      try {
        const player = players.get(socket.id);
        if (!player || !taskId) return;

        const resumedTask = await taskManager.resumeTask(taskId, player.mapId);
        if (resumedTask) {
          io.to(player.mapId).emit("task:updated", { task: resumedTask, action: "resume" });

          appendNpcHistoryMessageForUser(
            player.userId,
            player.mapId,
            resumedTask.npcId,
            buildTaskActionStartMessage({ title: resumedTask.title }, "resume"),
          );

          await runProgressNudgeForTask(resumedTask, buildResumeTaskExecutionPrompt({
            title: resumedTask.title,
            summary: resumedTask.summary,
            npcTaskId: resumedTask.npcTaskId,
          }), "resume");
        }
      } catch (err) {
        console.error("[TaskManager] Error resuming task:", err);
      }
    });

    socket.on("task:complete", async ({ taskId }) => {
      try {
        const player = players.get(socket.id);
        if (!player || !taskId) return;

        const completedTask = await taskManager.completeTask(taskId, player.mapId);
        if (completedTask) {
          io.to(player.mapId).emit("task:updated", { task: completedTask, action: "complete_manual" });
        }
      } catch (err) {
        console.error("[TaskManager] Error completing task:", err);
      }
    });

    socket.on("npc:history", ({ npcId }) => {
      const player = players.get(socket.id);
      if (!player || !npcId) return;
      const historyKey = `${player.mapId}:${npcId}`;
      const history = npcChatHistory.get(historyKey) || [];
      socket.emit("npc:history", { npcId, messages: history });
    });

    socket.on("npc:reset-chat", ({ npcId }) => {
      const player = players.get(socket.id);
      if (!player || !npcId) return;
      const historyKey = `${player.mapId}:${npcId}`;
      npcChatHistory.delete(historyKey);
    });

    socket.on("npc:report-consumed", async ({ reportId }) => {
      if (!reportId) return;
      try {
        await markReportConsumed(db, reportSchema, reportId);
      } catch (err) {
        console.error("[task-reporting] Error marking report consumed:", err);
      }
    });

    registerMeetingSocketHandlers({
      io,
      socket,
      deps: {
        meetingRooms,
        players,
        lastChatTime,
        chatCooldownMs: CHAT_COOLDOWN_MS,
        user,
        getParticipationAccess: getSocketChannelParticipationAccess,
        emitChannelAccessDenied,
        storeMeetingFallbackPlayer: true,
        onMeetingChat: ({ channelId, message, player }) => {
          const broker = activeBrokers.get(channelId);
          if (broker && broker.isRunning()) {
            const userName = player?.characterName || user.nickname;
            broker.addUserMessage(userName, message);
          }
          void globalThis.telegramManager?.sendMeetingMessage?.({
            channelId,
            sender: player?.characterName || user.nickname || "Escritorio",
            content: message,
            senderType: "user",
          });
        },
      },
    });

    registerMeetingDiscussionHandlers({
      io,
      socket,
      deps: {
        activeBrokers,
        discussionInitiators,
        meetingRooms,
        players,
        user,
        getOrConnectGateway,
        getNpcConfigsForChannel,
        canControlMeeting: isMeetingController,
        sendNpcMessageViaRuntime,
        createMeetingBroker: (config, callbacks) => new MeetingBroker(config, callbacks),
        generateMeetingSummary,
        persistMeetingMinutes: async (input) => {
          try {
            const [minutesRow] = await db.insert(schema.meetingMinutes).values({
              channelId: input.channelId,
              topic: input.topic,
              transcript: input.transcript,
              participants: JSON.stringify(input.participants),
              totalTurns: input.totalTurns,
              durationSeconds: input.durationSeconds || null,
              initiatorId: input.initiatorId,
              keyTopics: JSON.stringify(input.keyTopics),
              conclusions: input.conclusions,
            }).returning();
            return minutesRow?.id ?? null;
          } catch (err) {
            console.error("[meeting] Failed to save minutes:", err.message);
            return null;
          }
        },
      },
    });

    // --- NPC Movement ---
    socket.on("npc:call", ({ channelId, npcId }) => {
      if (!channelId || !npcId) return;
      const player = players.get(socket.id);
      if (!player) return;
      io.to(channelId).emit("npc:come-to-player", {
        npcId,
        targetPlayerId: socket.id,
      });
    });

    socket.on("npc:return-home", ({ channelId, npcId }) => {
      if (!channelId || !npcId) return;
      io.to(channelId).emit("npc:returning", { npcId });
    });

    socket.on("npc:position-update", ({ channelId, npcId, x, y, direction }) => {
      if (!channelId || !npcId) return;
      socket.to(channelId).emit("npc:position-sync", { npcId, x, y, direction });
    });

    socket.on("npc:arrived", ({ channelId, npcId }) => {
      if (!channelId || !npcId) return;
      socket.to(channelId).emit("npc:stop-moving", { npcId });
    });

    // Channel chat (user-to-user)
    socket.on("chat:send", ({ message }) => {
      const player = players.get(socket.id);
      if (!player) return;
      const trimmed = String(message || "").trim().slice(0, 500);
      if (!trimmed) return;
      const now = Date.now();
      if (now - (lastChatTime.get(socket.id) || 0) < CHAT_COOLDOWN_MS) return;
      lastChatTime.set(socket.id, now);

      const chatMessage = {
        id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sender: player.characterName || user.nickname,
        senderId: socket.id,
        senderCharacterId: player.characterId || null,
        senderUserId: player.userId || user.userId,
        content: trimmed,
        timestamp: now,
      };
      // Store in channel chat history
      const history = channelChatHistory.get(player.mapId) || [];
      history.push(chatMessage);
      channelChatHistory.set(player.mapId, history);
      io.to(player.mapId).emit("chat:message", chatMessage);
    });

    // NPC management broadcasts (re-broadcast to room)
    socket.on("npc:broadcast-add", (npcData) => {
      const player = players.get(socket.id);
      if (!player) return;
      socket.to(player.mapId).emit("npc:added", npcData);
      npcConfigCache.delete(npcData.id);
    });

    socket.on("npc:broadcast-update", (data) => {
      const player = players.get(socket.id);
      if (!player) return;
      socket.to(player.mapId).emit("npc:updated", data);
      if (data.npcId) npcConfigCache.delete(data.npcId);
    });

    socket.on("npc:broadcast-remove", (data) => {
      const player = players.get(socket.id);
      if (!player) return;
      socket.to(player.mapId).emit("npc:removed", data);
      if (data.npcId) npcConfigCache.delete(data.npcId);
    });

    // Map editing broadcasts (owner only)
    socket.on("map:object-add", (data) => {
      const player = players.get(socket.id);
      if (!player) return;
      if (channelOwners.get(player.mapId) !== user.userId) return;
      socket.to(player.mapId).emit("map:object-added", data);
    });

    socket.on("map:object-remove", (data) => {
      const player = players.get(socket.id);
      if (!player) return;
      if (channelOwners.get(player.mapId) !== user.userId) return;
      socket.to(player.mapId).emit("map:object-removed", data);
    });

    socket.on("map:tiles-update", (data) => {
      const player = players.get(socket.id);
      if (!player) return;
      if (channelOwners.get(player.mapId) !== user.userId) return;
      socket.to(player.mapId).emit("map:tiles-updated", data);
    });

    socket.on("disconnect", () => {
      const player = players.get(socket.id);
      if (player) {
        socket.to(player.mapId).emit("player:left", { id: socket.id });
        players.delete(socket.id);
        removeUserSocket(user.userId, socket.id);

        // Disconnect gateway if channel is now empty
        const leftChannelId = player.mapId;
        if (leftChannelId) {
          const remaining = Array.from(players.values()).filter(p => p.mapId === leftChannelId);
          if (remaining.length === 0) {
            const gw = channelGateways.get(leftChannelId);
            if (gw) {
              gw.disconnect();
              channelGateways.delete(leftChannelId);
            }
          }
        }
      }
      // Clean up meeting room participation
      for (const [chId, room] of meetingRooms.entries()) {
        if (room.participants.has(socket.id)) {
          room.participants.delete(socket.id);
          socket.to(`meeting-${chId}`).emit("meeting:participant-left", { id: socket.id });
        }
      }
      // Stop broker if no participants remain
      for (const [chId, broker] of activeBrokers.entries()) {
        const room = meetingRooms.get(chId);
        if (room && room.participants.size === 0) {
          broker.stop();
          activeBrokers.delete(chId);
        }
      }
      lastChatTime.delete(socket.id);
    });
  });

  // Internal HTTP endpoints for cross-process communication
  socketHttpServer.on("request", (req, res) => {
    if (!req.url || !req.url.startsWith("/_internal")) return;

    res.setHeader("Content-Type", "application/json");

    if (!isInternalRequestAuthorized(req.headers)) {
      res.writeHead(403);
      res.end(JSON.stringify({ ok: false, error: "Forbidden" }));
      return;
    }

    // POST /_internal/rpc — proxy RPC calls from API routes to gateway
    if (req.method === "POST" && req.url === "/_internal/rpc") {
      let body = "";
      req.on("data", (chunk) => { body += chunk; });
      req.on("end", async () => {
        try {
          const { channelId, method, params } = JSON.parse(body);
          const gateway = await getOrConnectGateway(channelId);
          if (!gateway) {
            res.writeHead(503, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: false, error: "Gateway not connected" }));
            return;
          }
          const result = await callGatewayRpc(gateway, method, params || {});
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: true, result }));
        } catch (err) {
          const status = getGatewayErrorStatus(err, 500);
          res.writeHead(status, { "Content-Type": "application/json" });
          res.end(JSON.stringify(buildGatewayErrorPayload(err)));
        }
      });
      return;
    }

    // POST /_internal/emit
    if (req.method === "POST" && req.url === "/_internal/emit") {
      let body = "";
      req.on("data", (chunk) => { body += chunk; });
      req.on("end", () => {
        try {
          const { event, room, targetUserId, payload } = JSON.parse(body);

          // Gateway reconnection on config change
          if (event === "gateway:config-updated" && payload?.channelId) {
            const gw = channelGateways.get(payload.channelId);
            if (gw) {
              gw.disconnect();
              channelGateways.delete(payload.channelId);
            }
          }

          if (targetUserId) {
            const targetSockets = getSocketsForUser(targetUserId);
            if (targetSockets.length > 0) {
              for (const targetSocket of targetSockets) {
                targetSocket.emit(event, payload);
              }
              if (event === "member:kicked" && payload?.channelId) {
                for (const targetSocket of targetSockets) {
                  targetSocket.leave(payload.channelId);
                }
              }
            }
          } else if (room) {
            io.to(room).emit(event, payload);
          }

          res.writeHead(200);
          res.end(JSON.stringify({ ok: true }));
        } catch {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "Invalid request" }));
        }
      });
      return;
    }

    // GET /_internal/room-members?channelId=X
    if (req.method === "GET" && req.url.startsWith("/_internal/room-members")) {
      const url = new URL(req.url, "http://localhost");
      const channelId = url.searchParams.get("channelId");

      if (!channelId) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "channelId required" }));
        return;
      }

      const roomSockets = io.sockets.adapter.rooms.get(channelId);
      const userIds = [];

      if (roomSockets) {
        for (const socketId of roomSockets) {
          const player = players.get(socketId);
          if (player && player.userId) {
            userIds.push(player.userId);
          }
        }
      }

      res.writeHead(200);
      res.end(JSON.stringify({ userIds }));
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: "Not found" }));
  });

  const internalHostname = getInternalSocketHostname(process.env);
  socketHttpServer.listen(SOCKET_PORT, internalHostname, () => {
    console.log(`[socket.io] Listening on http://${internalHostname}:${SOCKET_PORT}`);
  });
}

main().catch(err => { console.error(err); process.exit(1); });
