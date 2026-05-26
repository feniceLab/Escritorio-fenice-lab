import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray, isNull, lte, or } from "drizzle-orm";
import {
  agencyReports,
  automationJobs,
  approvalRequests,
  characters,
  channels,
  db,
  isPostgres,
  jsonForDb,
  meetingMinutes,
  npcActionLogs,
  npcMemoryItems,
  npcs,
  tasks,
} from "../db";

type AutomationStatus = "pending" | "running" | "completed" | "failed" | "needs_approval" | "cancelled";
type ApprovalStatus = "pending" | "approved" | "rejected" | "expired";

type AutomationPayload = Record<string, unknown>;

const automationJobsTable = automationJobs as any;
const approvalRequestsTable = approvalRequests as any;
const npcActionLogsTable = npcActionLogs as any;
const npcMemoryItemsTable = npcMemoryItems as any;
const tasksTable = tasks as any;
const channelsTable = channels as any;
const charactersTable = characters as any;
const npcsTable = npcs as any;
const meetingMinutesTable = meetingMinutes as any;
const agencyReportsTable = agencyReports as any;

const AUTO_APPROVED_ACTIONS = new Set([
  "create_task",
  "create_memory",
  "create_client_note",
  "create_meeting_minute",
  "create_report",
  "daily_operations_report",
  "scan_overdue_tasks",
  "send_alert",
]);

const APPROVAL_REQUIRED_ACTIONS = new Set([
  "assign_task",
  "request_approval",
  "send_external_message",
  "send_telegram_alert",
  "approve_publication",
  "change_important_deadline",
  "close_critical_task",
]);

const ACTION_ALIASES: Record<string, string> = {
  assignTask: "assign_task",
  createCalendarItem: "create_calendar_item",
  createClientNote: "create_client_note",
  createMeetingMinute: "create_meeting_minute",
  createReport: "create_report",
  createTask: "create_task",
  dailyOperationsReport: "daily_operations_report",
  markApprovalAsPending: "request_approval",
  requestApproval: "request_approval",
  scanOverdueTasks: "scan_overdue_tasks",
  sendTelegramAlert: "send_telegram_alert",
  updateTaskStatus: "update_task_status",
};

const ROLE_PERMISSIONS: Record<string, Set<string>> = {
  conteudo: new Set(["create_task", "create_memory", "create_client_note", "create_report", "request_approval", "send_alert", "send_telegram_alert"]),
  atendimento: new Set(["create_task", "create_memory", "create_client_note", "create_report", "request_approval", "send_alert", "send_telegram_alert"]),
  onboarding: new Set(["create_task", "create_memory", "create_client_note", "create_report", "request_approval", "send_alert", "send_telegram_alert"]),
  reunioes: new Set(["create_task", "create_memory", "create_meeting_minute", "create_report", "request_approval", "send_alert"]),
  relatorios: new Set(["create_task", "create_memory", "create_report", "daily_operations_report", "request_approval", "scan_overdue_tasks", "send_alert"]),
  gestao: new Set(["create_task", "update_task_status", "assign_task", "create_memory", "create_client_note", "create_meeting_minute", "create_report", "daily_operations_report", "request_approval", "scan_overdue_tasks", "send_alert", "send_telegram_alert"]),
  engenharia: new Set(["create_task", "update_task_status", "create_memory", "create_report", "request_approval", "scan_overdue_tasks", "send_alert"]),
  sistema: new Set(["create_task", "update_task_status", "assign_task", "create_memory", "create_client_note", "create_meeting_minute", "create_report", "daily_operations_report", "request_approval", "scan_overdue_tasks", "send_alert", "send_telegram_alert"]),
};

function nowIso() {
  return new Date().toISOString();
}

function fromDbJson(value: unknown): AutomationPayload {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return typeof value === "object" && !Array.isArray(value) ? value as AutomationPayload : {};
}

function text(value: unknown, max = 2000): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function bool(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

function shouldRequireApproval(type: string, payload: AutomationPayload) {
  if (APPROVAL_REQUIRED_ACTIONS.has(type)) return true;
  if (bool(payload.requiresApproval)) return true;
  return !AUTO_APPROVED_ACTIONS.has(type);
}

function normalizeActionType(type: unknown) {
  const raw = text(type, 120);
  if (!raw) return null;
  return ACTION_ALIASES[raw] || raw.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`).replace(/-/g, "_");
}

function normalizeForMatch(value: unknown) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function inferOperationalRole(input: { name?: unknown; agentId?: unknown }) {
  const haystack = normalizeForMatch(`${input.name || ""} ${input.agentId || ""}`);
  if (haystack.includes("lord") || haystack.includes("gestao") || haystack.includes("gerente") || haystack.includes("lurdinha")) return "gestao";
  if (haystack.includes("conteudo") || haystack.includes("noel") || haystack.includes("nina") || haystack.includes("design") || haystack.includes("sneider") || haystack.includes("gabriel")) return "conteudo";
  if (haystack.includes("atendimento") || haystack.includes("gabi")) return "atendimento";
  if (haystack.includes("onboarding") || haystack.includes("maria")) return "onboarding";
  if (haystack.includes("reuniao") || haystack.includes("meeting")) return "reunioes";
  if (haystack.includes("relatorio") || haystack.includes("analise") || haystack.includes("joao") || haystack.includes("clara")) return "relatorios";
  if (haystack.includes("ravi") || haystack.includes("engenharia") || haystack.includes("josy") || haystack.includes("gaia") || haystack.includes("maya")) return "engenharia";
  return "sistema";
}

async function getNpcPermissionContext(npcId?: string | null) {
  if (!npcId) return { role: "sistema", npc: null as any };
  const rows = await db
    .select({ id: npcsTable.id, name: npcsTable.name, openclawConfig: npcsTable.openclawConfig })
    .from(npcsTable)
    .where(eq(npcsTable.id, npcId))
    .limit(1);
  const npc = rows[0] || null;
  const config = fromDbJson(npc?.openclawConfig);
  const role = typeof config.operationalRole === "string"
    ? config.operationalRole
    : inferOperationalRole({ name: npc?.name, agentId: config.agentId || config.agent_id });
  return { role, npc };
}

async function assertNpcCanRunAction(npcId: string | null | undefined, type: string) {
  const context = await getNpcPermissionContext(npcId);
  const allowed = ROLE_PERMISSIONS[context.role] || ROLE_PERMISSIONS.sistema;
  if (!allowed.has(type)) {
    throw new Error(`npc_action_not_allowed:${context.role}:${type}`);
  }
  return context;
}

async function writeActionLog(input: {
  channelId?: string | null;
  npcId?: string | null;
  jobId?: string | null;
  approvalRequestId?: string | null;
  actionType: string;
  status: string;
  reason?: string | null;
  input?: unknown;
  output?: unknown;
  error?: unknown;
}) {
  await db.insert(npcActionLogsTable).values({
    channelId: input.channelId ?? null,
    npcId: input.npcId ?? null,
    jobId: input.jobId ?? null,
    approvalRequestId: input.approvalRequestId ?? null,
    actionType: input.actionType,
    status: input.status,
    reason: input.reason ?? null,
    input: jsonForDb(input.input ?? null),
    output: jsonForDb(input.output ?? null),
    error: input.error ? String(input.error).slice(0, 4000) : null,
  });
}

export async function enqueueNpcAutomation(input: {
  type: string;
  channelId?: string | null;
  npcId?: string | null;
  createdByUserId?: string | null;
  payload?: AutomationPayload;
  runAfter?: string | null;
  maxAttempts?: number;
}) {
  const type = normalizeActionType(input.type);
  if (!type) throw new Error("automation_type_required");
  await assertNpcCanRunAction(input.npcId, type);

  const payload = input.payload ?? {};
  const createdAt = nowIso();
  const requiresApproval = shouldRequireApproval(type, payload);
  let approvalId: string | null = null;

  if (requiresApproval) {
    const approvalRows = await (db as any).insert(approvalRequestsTable).values({
      channelId: input.channelId ?? null,
      npcId: input.npcId ?? null,
      requestedByUserId: input.createdByUserId ?? null,
      actionType: type,
      title: text(payload.title, 240) || `Aprovar acao: ${type}`,
      summary: text(payload.summary, 4000),
      payload: jsonForDb(payload),
      status: "pending",
      createdAt,
      updatedAt: createdAt,
    }).returning({ id: approvalRequestsTable.id });
    const approval = approvalRows[0];
    approvalId = approval.id;
  }

  const jobRows = await (db as any).insert(automationJobsTable).values({
    type,
    status: requiresApproval ? "needs_approval" : "pending",
    channelId: input.channelId ?? null,
    npcId: input.npcId ?? null,
    createdByUserId: input.createdByUserId ?? null,
    approvalRequestId: approvalId,
    payload: jsonForDb(payload),
    attempts: 0,
    maxAttempts: Math.max(1, Math.min(input.maxAttempts ?? 3, 10)),
    runAfter: input.runAfter ?? null,
    createdAt,
    updatedAt: createdAt,
  }).returning();
  const job = jobRows[0];

  await writeActionLog({
    channelId: input.channelId,
    npcId: input.npcId,
    jobId: job.id,
    approvalRequestId: approvalId,
    actionType: type,
    status: requiresApproval ? "needs_approval" : "queued",
    reason: requiresApproval ? "A acao precisa de aprovacao humana." : "Acao enfileirada para processamento automatico.",
    input: payload,
  });

  return job;
}

async function executeCreateTask(job: any, payload: AutomationPayload) {
  const channelId = text(payload.channelId, 80) || job.channelId;
  const npcId = text(payload.npcId, 80) || job.npcId;
  const assignerId = text(payload.assignerId, 80) || await getDefaultAssignerId(channelId);
  const title = text(payload.title, 500);
  if (!channelId || !npcId || !assignerId || !title) {
    throw new Error("create_task requires channelId, npcId, assignerId and title");
  }

  const now = nowIso();
  const taskRows = await (db as any).insert(tasksTable).values({
    channelId,
    npcId,
    assignerId,
    assignerNpcId: text(payload.assignerNpcId, 80),
    npcTaskId: text(payload.npcTaskId, 64) || `auto-${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`,
    title,
    summary: text(payload.summary, 8000),
    status: text(payload.status, 20) || "pending",
    recurrence: text(payload.recurrence, 20) || "once",
    scheduledTime: text(payload.scheduledTime, 8),
    scheduledDay: typeof payload.scheduledDay === "number" ? payload.scheduledDay : null,
    dueAt: text(payload.dueAt, 80),
    requiresApproval: false,
    createdAt: now,
    updatedAt: now,
  }).returning();
  const task = taskRows[0];

  return { task };
}

async function getDefaultAssignerId(channelId?: string | null) {
  if (!channelId) return null;
  const channelRows = await db
    .select({ ownerId: channelsTable.ownerId })
    .from(channelsTable)
    .where(eq(channelsTable.id, channelId))
    .limit(1);
  const ownerId = channelRows[0]?.ownerId;
  if (!ownerId) return null;
  const characterRows = await db
    .select({ id: charactersTable.id })
    .from(charactersTable)
    .where(eq(charactersTable.userId, ownerId))
    .limit(1);
  return characterRows[0]?.id || null;
}

async function executeCreateMemory(job: any, payload: AutomationPayload) {
  const npcId = text(payload.npcId, 80) || job.npcId;
  const title = text(payload.title, 200);
  const content = text(payload.content, 12000);
  if (!npcId || !title || !content) {
    throw new Error("create_memory requires npcId, title and content");
  }

  const now = nowIso();
  const memoryRows = await (db as any).insert(npcMemoryItemsTable).values({
    npcId,
    memoryType: text(payload.memoryType, 40) || "working",
    title,
    content,
    metadata: jsonForDb({
      ...(fromDbJson(payload.metadata)),
      source: "npc_automation",
      automationJobId: job.id,
    }),
    pinned: bool(payload.pinned),
    sortOrder: typeof payload.sortOrder === "number" ? payload.sortOrder : 0,
    createdAt: now,
    updatedAt: now,
  }).returning();
  const memory = memoryRows[0];

  return { memory };
}

async function executeSendAlert(job: any, payload: AutomationPayload) {
  const message = text(payload.message || payload.summary || payload.title, 4000);
  if (!message) throw new Error("send_alert requires message");

  return {
    alert: {
      channelId: text(payload.channelId, 80) || job.channelId,
      npcId: text(payload.npcId, 80) || job.npcId,
      message,
      delivery: "logged",
    },
  };
}

async function executeUpdateTaskStatus(job: any, payload: AutomationPayload) {
  const taskId = text(payload.taskId, 80);
  const npcTaskId = text(payload.npcTaskId, 80);
  const channelId = text(payload.channelId, 80) || job.channelId;
  const npcId = text(payload.npcId, 80) || job.npcId;
  const status = text(payload.status, 40);
  if (!channelId) throw new Error("update_task_status requires channelId");
  if (!status || (!taskId && !npcTaskId)) {
    throw new Error("update_task_status requires status and taskId or npcTaskId");
  }

  const conditions = [eq(tasksTable.channelId, channelId)];
  if (taskId) conditions.push(eq(tasksTable.id, taskId));
  if (npcTaskId && npcId) {
    conditions.push(eq(tasksTable.npcId, npcId), eq(tasksTable.npcTaskId, npcTaskId));
  }

  const now = nowIso();
  const rows = await db.update(tasksTable).set({
    status,
    summary: text(payload.summary, 8000) ?? undefined,
    updatedAt: now,
    completedAt: ["complete", "completed", "cancelled"].includes(status) ? now : null,
  }).where(and(...conditions)).returning();

  return { task: rows[0] || null };
}

async function executeAssignTask(job: any, payload: AutomationPayload) {
  const taskId = text(payload.taskId, 80);
  const targetNpcId = text(payload.targetNpcId, 80);
  const channelId = text(payload.channelId, 80) || job.channelId;
  if (!taskId || !targetNpcId || !channelId) {
    throw new Error("assign_task requires taskId, targetNpcId and channelId");
  }

  const now = nowIso();
  const rows = await db.update(tasksTable).set({
    npcId: targetNpcId,
    summary: text(payload.summary, 8000) ?? undefined,
    updatedAt: now,
  }).where(and(eq(tasksTable.id, taskId), eq(tasksTable.channelId, channelId))).returning();

  return { task: rows[0] || null };
}

async function executeCreateClientNote(job: any, payload: AutomationPayload) {
  const npcId = text(payload.npcId, 80) || job.npcId;
  const clientName = text(payload.clientName, 200) || "Cliente";
  const content = text(payload.content || payload.note || payload.summary, 12000);
  if (!npcId || !content) throw new Error("create_client_note requires npcId and content");

  const now = nowIso();
  const rows = await (db as any).insert(npcMemoryItemsTable).values({
    npcId,
    memoryType: "client",
    title: text(payload.title, 200) || `Nota de cliente - ${clientName}`,
    content,
    metadata: jsonForDb({
      clientName,
      channelId: text(payload.channelId, 80) || job.channelId,
      source: "npc_automation",
      automationJobId: job.id,
    }),
    pinned: bool(payload.pinned),
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
  }).returning();

  return { memory: rows[0] || null };
}

async function executeCreateMeetingMinute(job: any, payload: AutomationPayload) {
  const channelId = text(payload.channelId, 80) || job.channelId;
  const topic = text(payload.topic || payload.title, 300);
  const transcript = text(payload.transcript || payload.summary || payload.content, 30000);
  if (!channelId || !topic || !transcript) {
    throw new Error("create_meeting_minute requires channelId, topic and transcript");
  }

  const rows = await (db as any).insert(meetingMinutesTable).values({
    channelId,
    topic,
    transcript,
    participants: jsonForDb(Array.isArray(payload.participants) ? payload.participants : []),
    totalTurns: typeof payload.totalTurns === "number" ? payload.totalTurns : 0,
    durationSeconds: typeof payload.durationSeconds === "number" ? payload.durationSeconds : null,
    initiatorId: text(payload.initiatorId, 80),
    keyTopics: jsonForDb(Array.isArray(payload.keyTopics) ? payload.keyTopics : []),
    conclusions: text(payload.conclusions, 12000),
    createdAt: nowIso(),
  }).returning();

  return { meetingMinute: rows[0] || null };
}

async function buildOperationsReport(channelId: string | null, title = "Resumo operacional") {
  const taskRows = channelId
    ? await db.select().from(tasksTable).where(eq(tasksTable.channelId, channelId)).limit(200)
    : await db.select().from(tasksTable).limit(200);
  const pending = taskRows.filter((task: any) => !["complete", "completed", "cancelled"].includes(task.status));
  const overdue = pending.filter((task: any) => task.dueAt && new Date(task.dueAt).getTime() < Date.now());
  return [
    `# ${title}`,
    "",
    `Gerado em: ${nowIso()}`,
    `Tarefas abertas: ${pending.length}`,
    `Tarefas vencidas: ${overdue.length}`,
    "",
    ...overdue.slice(0, 20).map((task: any) => `- Vencida: ${task.title} (${task.status})`),
  ].join("\n");
}

async function executeCreateReport(job: any, payload: AutomationPayload) {
  const channelId = text(payload.channelId, 80) || job.channelId;
  if (!channelId) throw new Error("create_report requires channelId");
  const content = text(payload.content, 30000) || await buildOperationsReport(channelId, text(payload.title, 200) || "Relatorio operacional");
  const rows = await (db as any).insert(agencyReportsTable).values({
    channelId,
    agentId: text(payload.agentId, 120) || text(payload.npcId, 120) || job.npcId,
    content,
    analysisMode: text(payload.analysisMode, 40) || "operational",
    reportDate: text(payload.reportDate, 80) || nowIso(),
    createdAt: nowIso(),
  }).returning();
  return { report: rows[0] || null };
}

async function executeScanOverdueTasks(job: any, payload: AutomationPayload) {
  const channelId = text(payload.channelId, 80) || job.channelId;
  if (!channelId) throw new Error("scan_overdue_tasks requires channelId");
  const rows = await db.select().from(tasksTable).where(eq(tasksTable.channelId, channelId)).limit(300);
  const overdue = rows.filter((task: any) => (
    task.dueAt
    && new Date(task.dueAt).getTime() < Date.now()
    && !["complete", "completed", "cancelled"].includes(task.status)
  ));

  for (const task of overdue.slice(0, 30)) {
    await writeActionLog({
      channelId,
      npcId: job.npcId,
      jobId: job.id,
      actionType: "overdue_task_detected",
      status: "logged",
      reason: `Tarefa vencida detectada: ${task.title}`,
      input: { taskId: task.id, dueAt: task.dueAt, status: task.status },
    });
  }

  return {
    overdueCount: overdue.length,
    overdueTasks: overdue.slice(0, 30).map((task: any) => ({
      id: task.id,
      npcId: task.npcId,
      title: task.title,
      status: task.status,
      dueAt: task.dueAt,
    })),
  };
}

async function executeSendTelegramAlert(job: any, payload: AutomationPayload) {
  const message = text(payload.message || payload.summary || payload.title, 4000);
  if (!message) throw new Error("send_telegram_alert requires message");
  const manager = (globalThis as any).telegramManager;
  if (manager && typeof manager.sendOperationalAlert === "function") {
    const channelId = text(payload.channelId, 80) || job.channelId;
    const npcId = text(payload.npcId, 80) || job.npcId;
    await manager.sendOperationalAlert({ channelId, npcId, message });
    if (typeof manager.sendClientAlert === "function") {
      await manager.sendClientAlert({ channelId, npcId, message }).catch(() => false);
    }
    return { alert: { delivery: "telegram", message } };
  }
  return { alert: { delivery: "logged", message, reason: "telegram_manager_unavailable" } };
}

async function executeJob(job: any) {
  const payload = fromDbJson(job.payload);
  switch (job.type) {
    case "create_task":
      return executeCreateTask(job, payload);
    case "create_memory":
      return executeCreateMemory(job, payload);
    case "update_task_status":
      return executeUpdateTaskStatus(job, payload);
    case "assign_task":
      return executeAssignTask(job, payload);
    case "create_client_note":
      return executeCreateClientNote(job, payload);
    case "create_meeting_minute":
      return executeCreateMeetingMinute(job, payload);
    case "create_report":
    case "daily_operations_report":
      return executeCreateReport(job, payload);
    case "scan_overdue_tasks":
      return executeScanOverdueTasks(job, payload);
    case "send_alert":
      return executeSendAlert(job, payload);
    case "send_telegram_alert":
      return executeSendTelegramAlert(job, payload);
    case "request_approval":
      return { approvalRequestId: job.approvalRequestId, status: "needs_approval" };
    default:
      throw new Error(`unsupported_automation_type:${job.type}`);
  }
}

export async function processPendingNpcAutomations(limit = 5) {
  const now = nowIso();
  const statuses: AutomationStatus[] = ["pending"];
  const pending = await db.select()
    .from(automationJobsTable)
    .where(and(
      inArray(automationJobsTable.status, statuses),
      or(isNull(automationJobsTable.runAfter), lte(automationJobsTable.runAfter, now)),
    ))
    .orderBy(automationJobsTable.createdAt)
    .limit(Math.max(1, Math.min(limit, 20)));

  const results = [];
  for (const job of pending) {
    const startedAt = nowIso();
    const attempts = (job.attempts ?? 0) + 1;
    await db.update(automationJobsTable).set({
      status: "running",
      attempts,
      lockedAt: startedAt,
      startedAt,
      updatedAt: startedAt,
    }).where(eq(automationJobsTable.id, job.id));

    try {
      const result = await executeJob(job);
      const completedAt = nowIso();
      await db.update(automationJobsTable).set({
        status: "completed",
        result: jsonForDb(result),
        error: null,
        processedAt: completedAt,
        updatedAt: completedAt,
      }).where(eq(automationJobsTable.id, job.id));
      await writeActionLog({
        channelId: job.channelId,
        npcId: job.npcId,
        jobId: job.id,
        approvalRequestId: job.approvalRequestId,
        actionType: job.type,
        status: "completed",
        input: fromDbJson(job.payload),
        output: result,
      });
      results.push({ id: job.id, status: "completed", result });
    } catch (error) {
      const failedAt = nowIso();
      const finalStatus = attempts >= (job.maxAttempts ?? 3) ? "failed" : "pending";
      await db.update(automationJobsTable).set({
        status: finalStatus,
        error: String(error).slice(0, 4000),
        lockedAt: null,
        updatedAt: failedAt,
      }).where(eq(automationJobsTable.id, job.id));
      await writeActionLog({
        channelId: job.channelId,
        npcId: job.npcId,
        jobId: job.id,
        approvalRequestId: job.approvalRequestId,
        actionType: job.type,
        status: finalStatus,
        input: fromDbJson(job.payload),
        error,
      });
      results.push({ id: job.id, status: finalStatus, error: String(error) });
    }
  }

  return results;
}

export async function reviewNpcAutomationApproval(input: {
  approvalId: string;
  reviewerUserId: string;
  decision: "approve" | "reject";
  reason?: string | null;
}) {
  const status: ApprovalStatus = input.decision === "approve" ? "approved" : "rejected";
  const reviewedAt = nowIso();

  const approvalRows = await (db as any).update(approvalRequestsTable).set({
    status,
    reviewedByUserId: input.reviewerUserId,
    decisionReason: input.reason ?? null,
    reviewedAt,
    updatedAt: reviewedAt,
  }).where(eq(approvalRequestsTable.id, input.approvalId)).returning();
  const approval = approvalRows[0];

  if (!approval) throw new Error("approval_not_found");

  const jobStatus: AutomationStatus = status === "approved" ? "pending" : "cancelled";
  await db.update(automationJobsTable).set({
    status: jobStatus,
    updatedAt: reviewedAt,
  }).where(eq(automationJobsTable.approvalRequestId, input.approvalId));

  await writeActionLog({
    channelId: approval.channelId,
    npcId: approval.npcId,
    approvalRequestId: approval.id,
    actionType: approval.actionType,
    status,
    reason: input.reason ?? null,
    input: fromDbJson(approval.payload),
  });

  return approval;
}

export async function listNpcAutomationState(input: {
  channelId?: string | null;
  npcId?: string | null;
  status?: string | null;
  limit?: number;
}) {
  const conditions = [];
  if (input.channelId) conditions.push(eq(automationJobsTable.channelId, input.channelId));
  if (input.npcId) conditions.push(eq(automationJobsTable.npcId, input.npcId));
  if (input.status) conditions.push(eq(automationJobsTable.status, input.status));

  return db.select()
    .from(automationJobsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(automationJobsTable.createdAt))
    .limit(Math.max(1, Math.min(input.limit ?? 50, 200)));
}

export async function listNpcActionLogs(input: {
  channelId?: string | null;
  npcId?: string | null;
  limit?: number;
}) {
  const conditions = [];
  if (input.channelId) conditions.push(eq(npcActionLogsTable.channelId, input.channelId));
  if (input.npcId) conditions.push(eq(npcActionLogsTable.npcId, input.npcId));

  return db.select()
    .from(npcActionLogsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(npcActionLogsTable.createdAt))
    .limit(Math.max(1, Math.min(input.limit ?? 100, 300)));
}

export async function listApprovalRequests(input: {
  channelId?: string | null;
  npcId?: string | null;
  status?: string | null;
  limit?: number;
}) {
  const conditions = [];
  if (input.channelId) conditions.push(eq(approvalRequestsTable.channelId, input.channelId));
  if (input.npcId) conditions.push(eq(approvalRequestsTable.npcId, input.npcId));
  if (input.status) conditions.push(eq(approvalRequestsTable.status, input.status));

  return db.select()
    .from(approvalRequestsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(approvalRequestsTable.createdAt))
    .limit(Math.max(1, Math.min(input.limit ?? 50, 200)));
}

export function getNpcAutomationRuntimeInfo() {
  return {
    database: isPostgres ? "postgresql" : "sqlite",
    autoApprovedActions: Array.from(AUTO_APPROVED_ACTIONS),
    approvalRequiredActions: Array.from(APPROVAL_REQUIRED_ACTIONS),
    rolePermissions: Object.fromEntries(
      Object.entries(ROLE_PERMISSIONS).map(([role, actions]) => [role, Array.from(actions)]),
    ),
  };
}
