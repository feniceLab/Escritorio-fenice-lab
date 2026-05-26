import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray, ne, or, sql } from "drizzle-orm";
import {
  approvalRequests,
  automationJobs,
  channelLibraryItems,
  channels,
  db,
  isPostgres,
  jsonForDb,
  meetingMinutes,
  npcActionLogs,
  npcMemoryItems,
  npcs,
  officeAgentRuns,
  officeClients,
  officeContextSnapshots,
  officeMemories,
  officeNotifications,
  tasks,
  tokenUsageLogs,
} from "@/db";
import { parseDbArray, parseDbJson, parseDbObject } from "@/lib/db-json";

const ACTIVE_TASK_STATUSES = ["pending", "in_progress", "blocked", "stalled"];
const DONE_TASK_STATUSES = ["complete", "completed", "cancelled", "done"];

function nowForDb() {
  return isPostgres ? new Date() : new Date().toISOString();
}

function textOf(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function estimateTokens(value: unknown) {
  const chars = JSON.stringify(value ?? {}).length;
  return Math.max(1, Math.ceil(chars / 4));
}

function compactText(value: unknown, max = 900) {
  if (typeof value !== "string") return "";
  const text = value.replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

function compactLibraryContent(item: {
  layer?: string | null;
  category?: string | null;
  name?: string | null;
  content?: string | null;
}) {
  const layer = String(item.layer || "").toLowerCase();
  const category = String(item.category || "").toLowerCase();
  const name = String(item.name || "").toLowerCase();
  if (
    layer === "api"
    || category.includes("api")
    || category.includes("token")
    || category.includes("credential")
    || /token|secret|password|api[_-]?key|access[_-]?key/.test(name)
  ) {
    return "[credencial redigida; consultar biblioteca operacional apenas quando a tarefa exigir]";
  }

  const content = String(item.content || "");
  if (/^data:image\//i.test(content)) {
    return "[imagem armazenada na biblioteca; usar o item por id/nome quando necessario]";
  }

  return compactText(content, 700);
}

function compactAgentConfig(config: Record<string, unknown>) {
  return {
    agentId: typeof config.agentId === "string" ? config.agentId : typeof config.agent_id === "string" ? config.agent_id : null,
    runtimeProvider: typeof config.runtimeProvider === "string" ? config.runtimeProvider : null,
    model: typeof config.model === "string" ? config.model : null,
    locale: typeof config.locale === "string" ? config.locale : null,
  };
}

function buildClientSummary(input: {
  name: string;
  taskCount: number;
  overdueCount: number;
  memoryCount: number;
  libraryCount: number;
  agentCount: number;
}) {
  const parts = [
    `${input.name} tem ${input.agentCount} agente(s), ${input.taskCount} tarefa(s) aberta(s)`,
    `${input.overdueCount} vencida(s)`,
    `${input.memoryCount} memória(s) relevante(s)`,
    `${input.libraryCount} item(ns) na biblioteca`,
  ];
  return parts.join(", ") + ".";
}

function clientLogoFromProfile(profileJson: unknown) {
  const profile = parseDbObject(profileJson) ?? {};
  return typeof profile.clientLogo === "string" && profile.clientLogo.trim() ? profile.clientLogo.trim() : null;
}

export async function syncOfficeClients() {
  const channelRows = await db
    .select({
      id: channels.id,
      name: channels.name,
      channelType: channels.channelType,
      clientName: channels.clientName,
      clientLogo: channels.clientLogo,
      ownerId: channels.ownerId,
      parentChannelId: channels.parentChannelId,
      updatedAt: channels.updatedAt,
    })
    .from(channels)
    .where(or(eq(channels.channelType, "client"), sql`${channels.clientName} IS NOT NULL`))
    .orderBy(channels.name);

  const synced = [];
  for (const channel of channelRows) {
    const name = textOf(channel.clientName, channel.name);
    const existing = await db
      .select({
        id: officeClients.id,
        profileJson: officeClients.profileJson,
      })
      .from(officeClients)
      .where(eq(officeClients.channelId, channel.id))
      .limit(1);

    const existingProfile = existing[0] ? parseDbObject(existing[0].profileJson) ?? {} : {};
    const profile = {
      ...existingProfile,
      source: "channel",
      channelType: channel.channelType,
      clientLogo: channel.clientLogo,
      parentChannelId: channel.parentChannelId,
    };
    const now = nowForDb();

    if (existing[0]) {
      await db
        .update(officeClients)
        .set({
          name,
          ownerUserId: channel.ownerId,
          profileJson: jsonForDb(profile) as never,
          updatedAt: now as never,
        })
        .where(eq(officeClients.id, existing[0].id));
      synced.push(existing[0].id);
      continue;
    }

    const [inserted] = await db
      .insert(officeClients)
      .values({
        id: randomUUID(),
        channelId: channel.id,
        name,
        ownerUserId: channel.ownerId,
        status: "active",
        summary: null,
        profileJson: jsonForDb(profile) as never,
        createdAt: now as never,
        updatedAt: now as never,
      })
      .returning({ id: officeClients.id });
    synced.push(inserted.id);
  }

  return { synced: synced.length };
}

export async function listOfficeClients() {
  await syncOfficeClients();
  const rows = await db
    .select({
      id: officeClients.id,
      channelId: officeClients.channelId,
      name: officeClients.name,
      status: officeClients.status,
      summary: officeClients.summary,
      profileJson: officeClients.profileJson,
      updatedAt: officeClients.updatedAt,
    })
    .from(officeClients)
    .orderBy(officeClients.name);

  const channelIds = rows.map((row) => row.channelId);
  if (channelIds.length === 0) return [];

  const [taskRows, npcRows, notificationRows] = await Promise.all([
    db.select({ channelId: tasks.channelId, status: tasks.status, dueAt: tasks.dueAt }).from(tasks).where(inArray(tasks.channelId, channelIds)),
    db.select({ channelId: npcs.channelId }).from(npcs).where(inArray(npcs.channelId, channelIds)),
    db.select({ channelId: officeNotifications.channelId, status: officeNotifications.status }).from(officeNotifications).where(inArray(officeNotifications.channelId, channelIds)),
  ]);

  return rows.map((row) => {
    const clientTasks = taskRows.filter((task) => task.channelId === row.channelId);
    const openTasks = clientTasks.filter((task) => !DONE_TASK_STATUSES.includes(task.status));
    const profile = parseDbObject(row.profileJson) ?? {};
    return {
      ...row,
      profile,
      clientLogo: clientLogoFromProfile(row.profileJson),
      agents: npcRows.filter((npc) => npc.channelId === row.channelId).length,
      openTasks: openTasks.length,
      overdueTasks: openTasks.filter((task) => task.dueAt && new Date(String(task.dueAt)).getTime() < Date.now()).length,
      unreadNotifications: notificationRows.filter((item) => item.channelId === row.channelId && item.status === "unread").length,
    };
  });
}

export async function getOfficeClient(clientId: string) {
  await syncOfficeClients();
  const [client] = await db.select().from(officeClients).where(eq(officeClients.id, clientId)).limit(1);
  if (!client) return null;
  const [channel] = await db.select().from(channels).where(eq(channels.id, client.channelId)).limit(1);
  return {
    ...client,
    profile: parseDbObject(client.profileJson) ?? {},
    channel,
  };
}

async function getClientByChannel(channelId: string) {
  await syncOfficeClients();
  const [client] = await db.select().from(officeClients).where(eq(officeClients.channelId, channelId)).limit(1);
  return client ?? null;
}

async function getOrCreateOfficeClientByChannel(channelId: string) {
  const existing = await getClientByChannel(channelId);
  if (existing) return existing;

  const [channel] = await db
    .select({
      id: channels.id,
      name: channels.name,
      channelType: channels.channelType,
      clientName: channels.clientName,
      clientLogo: channels.clientLogo,
      ownerId: channels.ownerId,
      parentChannelId: channels.parentChannelId,
    })
    .from(channels)
    .where(eq(channels.id, channelId))
    .limit(1);

  if (!channel) return null;

  const name = textOf(channel.clientName, channel.name || "Escritorio");
  const now = nowForDb();
  const [inserted] = await db
    .insert(officeClients)
    .values({
      id: randomUUID(),
      channelId: channel.id,
      name,
      ownerUserId: channel.ownerId,
      status: "active",
      summary: null,
      profileJson: jsonForDb({
        source: "office-channel",
        channelType: channel.channelType,
        clientLogo: channel.clientLogo,
        parentChannelId: channel.parentChannelId,
      }) as never,
      createdAt: now as never,
      updatedAt: now as never,
    })
    .returning();

  return inserted ?? null;
}

export async function buildOfficeContext(input: {
  clientId?: string | null;
  channelId?: string | null;
  npcId?: string | null;
  contextKind?: string | null;
  query?: string | null;
  persistSnapshot?: boolean;
}) {
  await syncOfficeClients();
  const contextKind = input.contextKind || "client-workspace";
  const client = input.clientId
    ? await getOfficeClient(input.clientId)
    : input.channelId
      ? await getOrCreateOfficeClientByChannel(input.channelId)
      : null;

  if (!client) return null;
  const channelId = client.channelId;

  const [
    agentRows,
    taskRows,
    libraryRows,
    manualMemories,
    officeMemoryRows,
    meetingRows,
    actionRows,
    approvalRows,
    notificationRows,
    tokenRows,
  ] = await Promise.all([
    db.select().from(npcs).where(eq(npcs.channelId, channelId)).orderBy(npcs.name).limit(30),
    db.select().from(tasks).where(eq(tasks.channelId, channelId)).orderBy(desc(tasks.updatedAt)).limit(80),
    db.select().from(channelLibraryItems).where(eq(channelLibraryItems.channelId, channelId)).orderBy(channelLibraryItems.layer, channelLibraryItems.sortOrder).limit(80),
    input.npcId
      ? db.select().from(npcMemoryItems).where(eq(npcMemoryItems.npcId, input.npcId)).orderBy(desc(npcMemoryItems.pinned), desc(npcMemoryItems.createdAt)).limit(25)
      : Promise.resolve([]),
    db.select().from(officeMemories).where(eq(officeMemories.clientId, client.id)).orderBy(desc(officeMemories.importance), desc(officeMemories.createdAt)).limit(40),
    db.select().from(meetingMinutes).where(eq(meetingMinutes.channelId, channelId)).orderBy(desc(meetingMinutes.createdAt)).limit(12),
    db.select().from(npcActionLogs).where(eq(npcActionLogs.channelId, channelId)).orderBy(desc(npcActionLogs.createdAt)).limit(25),
    db.select().from(approvalRequests).where(and(eq(approvalRequests.channelId, channelId), eq(approvalRequests.status, "pending"))).orderBy(desc(approvalRequests.createdAt)).limit(20),
    db.select().from(officeNotifications).where(and(eq(officeNotifications.channelId, channelId), ne(officeNotifications.status, "resolved"))).orderBy(desc(officeNotifications.createdAt)).limit(30),
    db.select().from(tokenUsageLogs).where(eq(tokenUsageLogs.channelId, channelId)).orderBy(desc(tokenUsageLogs.createdAt)).limit(30),
  ]);

  const openTasks = taskRows.filter((task) => !DONE_TASK_STATUSES.includes(task.status));
  const overdueTasks = openTasks.filter((task) => task.dueAt && new Date(String(task.dueAt)).getTime() < Date.now());
  const compactLibrary = libraryRows.slice(0, contextKind === "client-summary" ? 8 : 24).map((item) => ({
    id: item.id,
    layer: item.layer,
    category: item.category,
    name: item.name,
    content: compactLibraryContent(item),
    metadata: parseDbObject(item.metadata) ?? {},
  }));

  const payload = {
    client: {
      id: client.id,
      channelId,
      name: client.name,
      status: client.status,
      profile: parseDbObject(client.profileJson) ?? {},
      clientLogo: clientLogoFromProfile(client.profileJson),
    },
    summary: client.summary || buildClientSummary({
      name: client.name,
      taskCount: openTasks.length,
      overdueCount: overdueTasks.length,
      memoryCount: officeMemoryRows.length + manualMemories.length,
      libraryCount: libraryRows.length,
      agentCount: agentRows.length,
    }),
    query: input.query || null,
    agents: agentRows.map((agent) => ({
      id: agent.id,
      name: agent.name,
      totalTokens: agent.totalTokens,
      reportsToId: agent.reportsToId,
      config: compactAgentConfig(parseDbObject(agent.openclawConfig) ?? {}),
    })),
    openTasks: openTasks.slice(0, 25).map((task) => ({
      id: task.id,
      npcId: task.npcId,
      title: task.title,
      summary: compactText(task.summary, 500),
      status: task.status,
      dueAt: task.dueAt,
      requiresApproval: task.requiresApproval,
    })),
    overdueTasks: overdueTasks.slice(0, 12).map((task) => ({
      id: task.id,
      title: task.title,
      npcId: task.npcId,
      dueAt: task.dueAt,
    })),
    memories: [
      ...officeMemoryRows.map((memory) => ({
        id: memory.id,
        scope: memory.scope,
        memoryType: memory.memoryType,
        title: memory.title,
        content: compactText(memory.content, 900),
        importance: memory.importance,
        sourceType: memory.sourceType,
      })),
      ...manualMemories.map((memory) => ({
        id: memory.id,
        scope: "npc",
        memoryType: memory.memoryType,
        title: memory.title,
        content: compactText(memory.content, 900),
        pinned: memory.pinned,
      })),
    ].slice(0, 40),
    library: compactLibrary,
    meetings: meetingRows.map((minute) => ({
      id: minute.id,
      topic: minute.topic,
      keyTopics: parseDbArray<string>(minute.keyTopics),
      conclusions: compactText(minute.conclusions, 700),
      createdAt: minute.createdAt,
    })),
    pendingApprovals: approvalRows.map((approval) => ({
      id: approval.id,
      actionType: approval.actionType,
      title: approval.title,
      summary: compactText(approval.summary, 600),
      payload: parseDbJson(approval.payload) ?? {},
      createdAt: approval.createdAt,
    })),
    notifications: notificationRows.map((notice) => ({
      id: notice.id,
      type: notice.type,
      priority: notice.priority,
      title: notice.title,
      body: compactText(notice.body, 500),
      status: notice.status,
      sourceType: notice.sourceType,
      sourceId: notice.sourceId,
      createdAt: notice.createdAt,
    })),
    recentActions: actionRows.map((log) => ({
      id: log.id,
      npcId: log.npcId,
      actionType: log.actionType,
      status: log.status,
      reason: compactText(log.reason, 500),
      error: compactText(log.error, 500),
      createdAt: log.createdAt,
    })),
    tokenUsage: {
      recentTokens: tokenRows.reduce((sum, row) => sum + Number(row.promptTokens || 0) + Number(row.completionTokens || 0), 0),
      recentCalls: tokenRows.length,
    },
    allowedActions: [
      "read_client",
      "create_task",
      "create_memory",
      "create_notification",
      "draft_response",
      "request_approval",
    ],
  };

  const tokenEstimate = estimateTokens(payload);
  let snapshotId: string | null = null;
  if (input.persistSnapshot !== false) {
    const now = nowForDb();
    const [snapshot] = await db.insert(officeContextSnapshots).values({
      id: randomUUID(),
      clientId: client.id,
      channelId,
      contextKind,
      summary: payload.summary,
      payload: jsonForDb(payload) as never,
      tokenEstimate,
      createdAt: now as never,
      expiresAt: (isPostgres ? new Date(Date.now() + 3600_000) : new Date(Date.now() + 3600_000).toISOString()) as never,
    }).returning({ id: officeContextSnapshots.id });
    snapshotId = snapshot.id;
  }

  return { ...payload, contextKind, snapshotId, tokenEstimate };
}

export async function getOfficeOverview() {
  await syncOfficeClients();
  await generateOperationalNotifications();
  const [clients, notificationRows, approvalRows, jobRows, taskRows, runRows] = await Promise.all([
    listOfficeClients(),
    db.select().from(officeNotifications).where(ne(officeNotifications.status, "resolved")).orderBy(desc(officeNotifications.createdAt)).limit(12),
    db.select().from(approvalRequests).where(eq(approvalRequests.status, "pending")).orderBy(desc(approvalRequests.createdAt)).limit(12),
    db.select().from(automationJobs).where(inArray(automationJobs.status, ["pending", "running", "failed"])).orderBy(desc(automationJobs.createdAt)).limit(20),
    db.select().from(tasks).where(inArray(tasks.status, ACTIVE_TASK_STATUSES)).orderBy(desc(tasks.updatedAt)).limit(40),
    db.select().from(officeAgentRuns).orderBy(desc(officeAgentRuns.createdAt)).limit(12),
  ]);

  return {
    totals: {
      clients: clients.length,
      openTasks: clients.reduce((sum, client) => sum + client.openTasks, 0),
      overdueTasks: clients.reduce((sum, client) => sum + client.overdueTasks, 0),
      unreadNotifications: notificationRows.filter((notice) => notice.status === "unread").length,
      pendingApprovals: approvalRows.length,
      activeAutomationJobs: jobRows.filter((job) => job.status !== "failed").length,
      failedAutomationJobs: jobRows.filter((job) => job.status === "failed").length,
    },
    clients: clients.slice(0, 12),
    notifications: notificationRows.map(normalizeNotification),
    approvals: approvalRows.map((approval) => ({ ...approval, payload: parseDbJson(approval.payload) ?? {} })),
    automationJobs: jobRows.map((job) => ({ ...job, payload: parseDbJson(job.payload) ?? {}, result: parseDbJson(job.result) ?? null })),
    openTasks: taskRows,
    recentAgentRuns: runRows.map((run) => ({ ...run, request: parseDbJson(run.request) ?? {} })),
  };
}

function normalizeNotification(row: typeof officeNotifications.$inferSelect) {
  return {
    ...row,
    actionPayload: parseDbJson(row.actionPayload) ?? {},
  };
}

export async function listOfficeNotifications(status?: string | null) {
  await generateOperationalNotifications();
  const rows = await db
    .select()
    .from(officeNotifications)
    .where(status && status !== "all" ? eq(officeNotifications.status, status) : sql`1 = 1`)
    .orderBy(desc(officeNotifications.createdAt))
    .limit(100);
  return rows.map(normalizeNotification);
}

async function notificationExists(sourceType: string, sourceId: string, type: string) {
  const rows = await db
    .select({ id: officeNotifications.id })
    .from(officeNotifications)
    .where(and(eq(officeNotifications.sourceType, sourceType), eq(officeNotifications.sourceId, sourceId), eq(officeNotifications.type, type)))
    .limit(1);
  return Boolean(rows[0]);
}

export async function createOfficeNotification(input: {
  clientId?: string | null;
  channelId?: string | null;
  npcId?: string | null;
  userId?: string | null;
  type: string;
  priority?: string;
  title: string;
  body?: string | null;
  actionType?: string | null;
  actionPayload?: Record<string, unknown> | null;
  sourceType?: string | null;
  sourceId?: string | null;
}) {
  const now = nowForDb();
  const [notice] = await db.insert(officeNotifications).values({
    id: randomUUID(),
    clientId: input.clientId || null,
    channelId: input.channelId || null,
    npcId: input.npcId || null,
    userId: input.userId || null,
    type: input.type,
    priority: input.priority || "normal",
    title: input.title,
    body: input.body || null,
    status: "unread",
    actionType: input.actionType || null,
    actionPayload: jsonForDb(input.actionPayload || {}) as never,
    sourceType: input.sourceType || null,
    sourceId: input.sourceId || null,
    createdAt: now as never,
  }).returning();
  return normalizeNotification(notice);
}

export async function updateOfficeNotification(id: string, status: "unread" | "read" | "resolved") {
  const now = nowForDb();
  const values: Record<string, unknown> = { status };
  if (status === "read") values.readAt = now;
  if (status === "resolved") values.resolvedAt = now;
  const [notice] = await db.update(officeNotifications).set(values as never).where(eq(officeNotifications.id, id)).returning();
  return notice ? normalizeNotification(notice) : null;
}

export async function generateOperationalNotifications() {
  await syncOfficeClients();
  const clientRows = await db.select().from(officeClients);
  const byChannel = new Map(clientRows.map((client) => [client.channelId, client]));

  const [pendingApprovals, failedJobs, taskRows] = await Promise.all([
    db.select().from(approvalRequests).where(eq(approvalRequests.status, "pending")).orderBy(desc(approvalRequests.createdAt)).limit(80),
    db.select().from(automationJobs).where(eq(automationJobs.status, "failed")).orderBy(desc(automationJobs.updatedAt)).limit(80),
    db.select().from(tasks).where(inArray(tasks.status, ACTIVE_TASK_STATUSES)).orderBy(desc(tasks.updatedAt)).limit(200),
  ]);

  let created = 0;
  for (const approval of pendingApprovals) {
    if (await notificationExists("approval_request", approval.id, "approval_required")) continue;
    const client = approval.channelId ? byChannel.get(approval.channelId) : null;
    await createOfficeNotification({
      clientId: client?.id,
      channelId: approval.channelId,
      npcId: approval.npcId,
      userId: approval.requestedByUserId,
      type: "approval_required",
      priority: "high",
      title: `Aprovacao pendente: ${approval.title}`,
      body: approval.summary,
      actionType: "review_approval",
      actionPayload: { approvalRequestId: approval.id },
      sourceType: "approval_request",
      sourceId: approval.id,
    });
    created++;
  }

  for (const job of failedJobs) {
    if (await notificationExists("automation_job", job.id, "automation_failed")) continue;
    const client = job.channelId ? byChannel.get(job.channelId) : null;
    await createOfficeNotification({
      clientId: client?.id,
      channelId: job.channelId,
      npcId: job.npcId,
      type: "automation_failed",
      priority: "high",
      title: `Automacao falhou: ${job.type}`,
      body: job.error,
      actionType: "inspect_job",
      actionPayload: { automationJobId: job.id },
      sourceType: "automation_job",
      sourceId: job.id,
    });
    created++;
  }

  for (const task of taskRows) {
    if (!task.dueAt || new Date(String(task.dueAt)).getTime() >= Date.now()) continue;
    if (await notificationExists("task", task.id, "task_overdue")) continue;
    const client = byChannel.get(task.channelId);
    await createOfficeNotification({
      clientId: client?.id,
      channelId: task.channelId,
      npcId: task.npcId,
      type: "task_overdue",
      priority: "high",
      title: `Tarefa vencida: ${task.title}`,
      body: task.summary,
      actionType: "open_task",
      actionPayload: { taskId: task.id },
      sourceType: "task",
      sourceId: task.id,
    });
    created++;
  }

  return { created };
}

export async function getOfficeTimeline(clientId: string) {
  const client = await getOfficeClient(clientId);
  if (!client) return null;
  const channelId = client.channelId;
  const [taskRows, meetingRows, notificationRows, actionRows, memoryRows] = await Promise.all([
    db.select().from(tasks).where(eq(tasks.channelId, channelId)).orderBy(desc(tasks.updatedAt)).limit(25),
    db.select().from(meetingMinutes).where(eq(meetingMinutes.channelId, channelId)).orderBy(desc(meetingMinutes.createdAt)).limit(20),
    db.select().from(officeNotifications).where(eq(officeNotifications.clientId, clientId)).orderBy(desc(officeNotifications.createdAt)).limit(30),
    db.select().from(npcActionLogs).where(eq(npcActionLogs.channelId, channelId)).orderBy(desc(npcActionLogs.createdAt)).limit(30),
    db.select().from(officeMemories).where(eq(officeMemories.clientId, clientId)).orderBy(desc(officeMemories.createdAt)).limit(30),
  ]);

  const events = [
    ...taskRows.map((item) => ({ type: "task", at: item.updatedAt || item.createdAt, title: item.title, body: item.summary, item })),
    ...meetingRows.map((item) => ({ type: "meeting", at: item.createdAt, title: item.topic, body: item.conclusions, item })),
    ...notificationRows.map((item) => ({ type: "notification", at: item.createdAt, title: item.title, body: item.body, item: normalizeNotification(item) })),
    ...actionRows.map((item) => ({ type: "agent_action", at: item.createdAt, title: item.actionType, body: item.reason || item.error, item })),
    ...memoryRows.map((item) => ({ type: "memory", at: item.createdAt, title: item.title, body: item.content, item })),
  ].sort((a, b) => new Date(String(b.at)).getTime() - new Date(String(a.at)).getTime());

  return { client, events: events.slice(0, 80) };
}

export async function searchOffice(query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return { clients: [], notifications: [], memories: [], library: [] };
  await syncOfficeClients();
  const [clientRows, notificationRows, memoryRows, libraryRows] = await Promise.all([
    db.select().from(officeClients).orderBy(officeClients.name).limit(200),
    db.select().from(officeNotifications).orderBy(desc(officeNotifications.createdAt)).limit(200),
    db.select().from(officeMemories).orderBy(desc(officeMemories.createdAt)).limit(200),
    db.select().from(channelLibraryItems).orderBy(desc(channelLibraryItems.createdAt)).limit(200),
  ]);
  const contains = (...values: unknown[]) => values.some((value) => String(value || "").toLowerCase().includes(needle));
  return {
    clients: clientRows.filter((row) => contains(row.name, row.summary)).slice(0, 20),
    notifications: notificationRows.filter((row) => contains(row.title, row.body, row.type)).map(normalizeNotification).slice(0, 20),
    memories: memoryRows.filter((row) => contains(row.title, row.content, row.memoryType)).slice(0, 20),
    library: libraryRows.filter((row) => contains(row.name, row.content, row.category, row.layer)).slice(0, 20),
  };
}
