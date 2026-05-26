import { and, asc, eq, isNull } from "drizzle-orm";

// -- Types & Interfaces --
export interface TaskReportingConfig {
  autoProgressNudgeEnabled: boolean;
  autoProgressNudgeMinutes: number;
  autoProgressNudgeMax: number;
  reportWaitSeconds: number;
}

export interface QueuedReportRow {
  id: string;
  npcId: string;
  channelId: string;
  targetUserId: string;
  taskId: string;
  kind: "complete" | "update" | "stalled";
  message: string;
  status: "pending" | "delivered" | "consumed";
  createdAt: string;
  deliveredAt: Date | null;
  consumedAt: Date | null;
}

export interface ReportReadyPayload {
  reportId: string;
  npcId: string;
  npcName?: string;
  message: string;
  kind: string;
}

interface QueuedReportRowInput {
  npcId: string;
  channelId: string;
  targetUserId: string;
  taskId: string;
  message: string;
  kind?: string;
}

type CompletionReportRowInput = QueuedReportRowInput;

interface PendingReportLookupInput {
  channelId: string;
  userId: string;
}

// -- Helpers --
const nowIso = () => new Date().toISOString();

function asReportDb(db: any): any { return db; }
function asReportSchema(schema: any): any { return schema; }
function asRecord(val: any): Record<string, any> { return (val && typeof val === "object") ? val : {}; }

function normalizeReportRow(row: any): QueuedReportRow | null {
  if (!row) return null;
  return {
    ...row,
    deliveredAt: row.deliveredAt ? new Date(row.deliveredAt) : null,
    consumedAt: row.consumedAt ? new Date(row.consumedAt) : null,
  };
}

function parseGatewayConfig(input: any): any {
  if (typeof input === "string") {
    try { return JSON.parse(input); } catch { return {}; }
  }
  return asRecord(input);
}

export function getTaskAutomationConfig(source: any): TaskReportingConfig {
  const ta = asRecord(source?.taskAutomation);
  return {
    autoProgressNudgeEnabled: !!ta.autoProgressNudgeEnabled,
    autoProgressNudgeMinutes: typeof ta.autoProgressNudgeMinutes === "number" ? ta.autoProgressNudgeMinutes : 30,
    autoProgressNudgeMax: typeof ta.autoProgressNudgeMax === "number" ? ta.autoProgressNudgeMax : 5,
    reportWaitSeconds: typeof ta.reportWaitSeconds === "number" ? ta.reportWaitSeconds : 10,
  };
}

// -- Prompts --

export function buildProgressNudgePrompt(task: {
  title: string;
  summary?: string | null;
  npcTaskId: string;
}) {
  const summaryLine = task.summary ? `Nota atual: ${task.summary}\n` : "";
  return [
    "Este é um alerta do sistema.",
    `A tarefa \"${task.title}\" ainda não foi concluída.`,
    summaryLine.trim(),
    "Se ainda não terminou, explique o status atual em uma ou duas frases e inclua obrigatoriamente um bloco de código ```json:task com a ação de atualização (update).",
    `Use o task id \"${task.npcTaskId}\" exatamente como fornecido.`,
    "Se estiver concluído, você pode usar a ação de conclusão (complete).",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildAutoExecutionPrompt(task: {
  title: string;
  summary?: string | null;
  npcTaskId: string;
}) {
  const summaryLine = task.summary ? `Nota atual: ${task.summary}\n` : "";
  return [
    "Este é um alerta do sistema.",
    `Por favor, continue executando a tarefa \"${task.title}\" agora.`,
    summaryLine.trim(),
    "Prossiga para a próxima etapa e explique o resultado em uma ou duas frases.",
    "Inclua obrigatoriamente um bloco de código ```json:task com a ação update ou complete.",
    `Use o task id \"${task.npcTaskId}\" exatamente como fornecido.`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildManualTaskReportPrompt(task: {
  title: string;
  summary?: string | null;
  npcTaskId: string;
  status?: string | null;
}) {
  const summaryLine = task.summary ? `Nota atual: ${task.summary}\n` : "";
  const statusLine = task.status === "pending"
    ? "Se ainda não começou, inicie o trabalho agora e faça um breve relato do progresso inicial."
    : "O usuário solicitou um relatório atualizado sobre o progresso desta tarefa.";

  return [
    "Este é um alerta do sistema.",
    statusLine,
    `Tarefa: \"${task.title}\"`,
    summaryLine.trim(),
    "Explique o status atual em uma ou duas frases e inclua obrigatoriamente um bloco de código ```json:task com a ação update.",
    `Use o task id \"${task.npcTaskId}\" exatamente como fornecido.`,
    "Se o trabalho já foi finalizado, utilize a ação complete para o relatório final.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildResumeTaskExecutionPrompt(task: {
  title: string;
  summary?: string | null;
  npcTaskId: string;
}) {
  const summaryLine = task.summary ? `Nota atual: ${task.summary}\n` : "";
  return [
    "Este é um alerta do sistema.",
    `Retome a tarefa interrompida \"${task.title}\" e continue a execução imediatamente.`,
    summaryLine.trim(),
    "Realize o próximo passo e descreva o resultado em uma ou duas frases.",
    "Inclua obrigatoriamente um bloco de código ```json:task com a ação update ou complete.",
    `Use o task id \"${task.npcTaskId}\" exatamente como fornecido.`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildTaskActionStartMessage(
  task: { title: string },
  action: "request-report" | "resume",
) {
  if (action === "resume") {
    return `Retomando o trabalho na tarefa: ${task.title}.`;
  }
  return `Vou processar a tarefa: ${task.title}.`;
}

export function buildCompletionReportRow(input: CompletionReportRowInput) {
  return buildQueuedReportRow({
    ...input,
    kind: "complete",
  });
}

export function buildQueuedReportRow(input: QueuedReportRowInput) {
  return {
    ...input,
    kind: input.kind ?? "complete",
    status: "pending" as const,
    createdAt: nowIso(),
    deliveredAt: null,
    consumedAt: null,
  };
}

export function getProgressNudgeCutoff(minutes: number, now = Date.now()) {
  return now - minutes * 60 * 1000;
}

export async function enqueueCompletionReport(
  db: any,
  schema: any,
  row: ReturnType<typeof buildCompletionReportRow>,
): Promise<QueuedReportRow | null> {
  return enqueueQueuedReport(db, schema, row);
}

export async function enqueueQueuedReport(
  db: any,
  schema: any,
  row: ReturnType<typeof buildQueuedReportRow>,
): Promise<QueuedReportRow | null> {
  const reportDb = asReportDb(db);
  const reportSchema = asReportSchema(schema);
  const [created] = await reportDb.insert(reportSchema.npcReports).values(row).returning();
  return normalizeReportRow(created);
}

export async function getPendingReportsForUserAndChannel(
  db: any,
  schema: any,
  input: PendingReportLookupInput,
): Promise<QueuedReportRow[]> {
  const reportDb = asReportDb(db);
  const reportSchema = asReportSchema(schema);
  const reports = reportSchema.npcReports;
  const rows = await reportDb
    .select()
    .from(reports)
    .where(
      and(
        eq(reports.channelId, input.channelId),
        eq(reports.targetUserId, input.userId),
        isNull(reports.consumedAt),
      ),
    )
    .orderBy(asc(reports.createdAt));

  return (rows as any[]).map((row: any) => normalizeReportRow(row)).filter((row: any): row is QueuedReportRow => row !== null);
}

export function toReportReadyPayload(
  report: Pick<QueuedReportRow, "id" | "npcId" | "message" | "kind">,
  npcName?: string,
): ReportReadyPayload {
  return {
    reportId: report.id,
    npcId: report.npcId,
    npcName,
    message: report.message,
    kind: report.kind,
  };
}

export async function markReportDelivered(
  db: any,
  schema: any,
  reportId: string,
) {
  const reportDb = asReportDb(db);
  const reportSchema = asReportSchema(schema);
  const reports = reportSchema.npcReports;
  await reportDb
    .update(reports)
    .set({
      status: "delivered",
      deliveredAt: nowIso() as any,
    })
    .where(eq(reports.id, reportId));
}

export async function markReportConsumed(
  db: any,
  schema: any,
  reportId: string,
) {
  const reportDb = asReportDb(db);
  const reportSchema = asReportSchema(schema);
  const reports = reportSchema.npcReports;
  await reportDb
    .update(reports)
    .set({
      status: "consumed",
      consumedAt: nowIso() as any,
    })
    .where(eq(reports.id, reportId));
}

export function buildGatewayConfig(input: any) {
  const source = parseGatewayConfig(input);

  return {
    url: typeof source?.url === "string" ? source.url.trim() || null : null,
    token: typeof source?.token === "string" ? source.token.trim() || null : null,
    taskAutomation: getTaskAutomationConfig(source),
  };
}

export function mergeGatewayConfig(existingConfig: any, patch: any) {
  const existing = buildGatewayConfig(existingConfig);
  const update = parseGatewayConfig(patch);
  const updateTaskAutomation = asRecord(update?.taskAutomation);
  const existingTaskAutomation = existing.taskAutomation;
  const hasUrl = update ? Object.hasOwn(update, "url") : false;
  const hasToken = update ? Object.hasOwn(update, "token") : false;

  return {
    url: hasUrl
      ? (update?.url === null
        ? null
        : typeof update?.url === "string"
          ? update.url.trim() || null
          : existing.url)
      : existing.url,
    token: hasToken
      ? (update?.token === null
        ? null
        : typeof update?.token === "string"
          ? update.token.trim() || null
          : existing.token)
      : existing.token,
    taskAutomation: {
      autoProgressNudgeEnabled:
        typeof updateTaskAutomation?.autoProgressNudgeEnabled === "boolean"
          ? updateTaskAutomation.autoProgressNudgeEnabled
          : existingTaskAutomation.autoProgressNudgeEnabled,
      autoProgressNudgeMinutes:
        typeof updateTaskAutomation?.autoProgressNudgeMinutes === "number"
          ? updateTaskAutomation.autoProgressNudgeMinutes
          : existingTaskAutomation.autoProgressNudgeMinutes,
      autoProgressNudgeMax:
        typeof updateTaskAutomation?.autoProgressNudgeMax === "number"
          ? updateTaskAutomation.autoProgressNudgeMax
          : existingTaskAutomation.autoProgressNudgeMax,
      reportWaitSeconds:
        typeof updateTaskAutomation?.reportWaitSeconds === "number"
          ? updateTaskAutomation.reportWaitSeconds
          : existingTaskAutomation.reportWaitSeconds,
    },
  };
}
export function shouldDeliverCompletionReport(action: { action?: string }) { return action?.action === "complete"; }
