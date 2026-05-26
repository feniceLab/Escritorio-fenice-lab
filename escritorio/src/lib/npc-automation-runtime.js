"use strict";

const os = require("node:os");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const Database = require("better-sqlite3");
const { ensureSqliteBaseSchema } = require("../db/sqlite-base-schema.js");

let sqlite = null;

function nowIso() {
  return new Date().toISOString();
}

function getSqlitePath() {
  const deskRpgHome = process.env.DESKRPG_HOME || path.join(os.homedir(), ".deskrpg");
  return process.env.SQLITE_PATH || path.join(deskRpgHome, "data", "deskrpg.db");
}

function getSqlite() {
  if (sqlite) return sqlite;
  if ((process.env.DB_TYPE || "postgresql").toLowerCase().startsWith("postgres")) {
    throw new Error("npc_automation_runtime_postgres_not_enabled");
  }
  sqlite = new Database(getSqlitePath());
  ensureSqliteBaseSchema(sqlite);
  return sqlite;
}

function readJson(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeJson(value) {
  return JSON.stringify(value ?? null);
}

function text(value, max = 2000) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function bool(value) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function normalizeActionType(value) {
  const raw = text(value, 120);
  if (!raw) return null;
  const aliases = {
    assignTask: "assign_task",
    createClientNote: "create_client_note",
    createMeetingMinute: "create_meeting_minute",
    createReport: "create_report",
    createTask: "create_task",
    dailyOperationsReport: "daily_operations_report",
    requestApproval: "request_approval",
    scanOverdueTasks: "scan_overdue_tasks",
    sendTelegramAlert: "send_telegram_alert",
    updateTaskStatus: "update_task_status",
  };
  return aliases[raw] || raw.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`).replace(/-/g, "_");
}

function writeActionLog(db, input) {
  db.prepare(`
    INSERT INTO npc_action_logs (
      id, channel_id, npc_id, job_id, approval_request_id, action_type, status,
      reason, input, output, error, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    randomUUID(),
    input.channelId || null,
    input.npcId || null,
    input.jobId || null,
    input.approvalRequestId || null,
    input.actionType,
    input.status,
    input.reason || null,
    input.input === undefined ? null : writeJson(input.input),
    input.output === undefined ? null : writeJson(input.output),
    input.error ? String(input.error).slice(0, 4000) : null,
    nowIso(),
  );
}

function getDefaultAssignerId(db, channelId) {
  if (!channelId) return null;
  const channel = db.prepare("SELECT owner_id FROM channels WHERE id = ?").get(channelId);
  if (!channel?.owner_id) return null;
  const character = db.prepare("SELECT id FROM characters WHERE user_id = ? ORDER BY created_at ASC LIMIT 1").get(channel.owner_id);
  return character?.id || null;
}

function executeCreateTask(db, job, payload) {
  const channelId = text(payload.channelId, 80) || job.channel_id;
  const npcId = text(payload.npcId, 80) || job.npc_id;
  const assignerId = text(payload.assignerId, 80) || getDefaultAssignerId(db, channelId);
  const title = text(payload.title, 500);
  if (!channelId || !npcId || !assignerId || !title) {
    throw new Error("create_task requires channelId, npcId, assignerId and title");
  }

  const id = randomUUID();
  const now = nowIso();
  db.prepare(`
    INSERT INTO tasks (
      id, channel_id, npc_id, assigner_id, assigner_npc_id, npc_task_id, title,
      summary, status, recurrence, scheduled_time, scheduled_day, due_at,
      requires_approval, approved_at, approved_by, auto_nudge_count,
      auto_nudge_max, last_nudged_at, last_reported_at, stalled_at,
      stalled_reason, created_at, updated_at, completed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, NULL, 0, 5, NULL, NULL, NULL, NULL, ?, ?, NULL)
  `).run(
    id,
    channelId,
    npcId,
    assignerId,
    text(payload.assignerNpcId, 80),
    text(payload.npcTaskId, 64) || `auto-${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`,
    title,
    text(payload.summary, 8000),
    text(payload.status, 20) || "pending",
    text(payload.recurrence, 20) || "once",
    text(payload.scheduledTime, 8),
    typeof payload.scheduledDay === "number" ? payload.scheduledDay : null,
    text(payload.dueAt, 80),
    now,
    now,
  );
  return { task: { id, channelId, npcId, title } };
}

function executeCreateMemory(db, job, payload) {
  const npcId = text(payload.npcId, 80) || job.npc_id;
  const title = text(payload.title, 200);
  const content = text(payload.content, 12000);
  if (!npcId || !title || !content) {
    throw new Error("create_memory requires npcId, title and content");
  }

  const id = randomUUID();
  const now = nowIso();
  db.prepare(`
    INSERT INTO npc_memory_items (
      id, npc_id, memory_type, title, content, metadata, pinned,
      sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    npcId,
    text(payload.memoryType, 40) || "working",
    title,
    content,
    writeJson({ ...readJson(payload.metadata), source: "npc_automation", automationJobId: job.id }),
    bool(payload.pinned) ? 1 : 0,
    typeof payload.sortOrder === "number" ? payload.sortOrder : 0,
    now,
    now,
  );
  return { memory: { id, npcId, title } };
}

function executeSendAlert(job, payload) {
  const message = text(payload.message || payload.summary || payload.title, 4000);
  if (!message) throw new Error("send_alert requires message");
  return {
    alert: {
      channelId: text(payload.channelId, 80) || job.channel_id,
      npcId: text(payload.npcId, 80) || job.npc_id,
      message,
      delivery: "logged",
    },
  };
}

function executeUpdateTaskStatus(db, job, payload) {
  const taskId = text(payload.taskId, 80);
  const npcTaskId = text(payload.npcTaskId, 80);
  const channelId = text(payload.channelId, 80) || job.channel_id;
  const npcId = text(payload.npcId, 80) || job.npc_id;
  const status = text(payload.status, 40);
  if (!channelId || !status || (!taskId && !npcTaskId)) {
    throw new Error("update_task_status requires channelId, status and taskId or npcTaskId");
  }

  const now = nowIso();
  let result;
  if (taskId) {
    result = db.prepare(`
      UPDATE tasks
      SET status = ?, summary = COALESCE(?, summary), updated_at = ?,
          completed_at = CASE WHEN ? IN ('complete', 'completed', 'cancelled') THEN ? ELSE completed_at END
      WHERE id = ? AND channel_id = ?
    `).run(status, text(payload.summary, 8000), now, status, now, taskId, channelId);
  } else {
    result = db.prepare(`
      UPDATE tasks
      SET status = ?, summary = COALESCE(?, summary), updated_at = ?,
          completed_at = CASE WHEN ? IN ('complete', 'completed', 'cancelled') THEN ? ELSE completed_at END
      WHERE npc_id = ? AND npc_task_id = ? AND channel_id = ?
    `).run(status, text(payload.summary, 8000), now, status, now, npcId, npcTaskId, channelId);
  }
  return { updated: result.changes };
}

function executeAssignTask(db, job, payload) {
  const taskId = text(payload.taskId, 80);
  const targetNpcId = text(payload.targetNpcId, 80);
  const channelId = text(payload.channelId, 80) || job.channel_id;
  if (!taskId || !targetNpcId || !channelId) {
    throw new Error("assign_task requires taskId, targetNpcId and channelId");
  }
  const result = db.prepare(`
    UPDATE tasks
    SET npc_id = ?, summary = COALESCE(?, summary), updated_at = ?
    WHERE id = ? AND channel_id = ?
  `).run(targetNpcId, text(payload.summary, 8000), nowIso(), taskId, channelId);
  return { updated: result.changes };
}

function executeCreateClientNote(db, job, payload) {
  const npcId = text(payload.npcId, 80) || job.npc_id;
  const clientName = text(payload.clientName, 200) || "Cliente";
  const content = text(payload.content || payload.note || payload.summary, 12000);
  if (!npcId || !content) throw new Error("create_client_note requires npcId and content");

  const id = randomUUID();
  const now = nowIso();
  db.prepare(`
    INSERT INTO npc_memory_items (
      id, npc_id, memory_type, title, content, metadata, pinned, sort_order, created_at, updated_at
    ) VALUES (?, ?, 'client', ?, ?, ?, ?, 0, ?, ?)
  `).run(
    id,
    npcId,
    text(payload.title, 200) || `Nota de cliente - ${clientName}`,
    content,
    writeJson({ clientName, channelId: text(payload.channelId, 80) || job.channel_id, source: "npc_automation", automationJobId: job.id }),
    bool(payload.pinned) ? 1 : 0,
    now,
    now,
  );
  return { memory: { id, npcId, title: text(payload.title, 200) || `Nota de cliente - ${clientName}` } };
}

function executeCreateMeetingMinute(db, job, payload) {
  const channelId = text(payload.channelId, 80) || job.channel_id;
  const topic = text(payload.topic || payload.title, 300);
  const transcript = text(payload.transcript || payload.summary || payload.content, 30000);
  if (!channelId || !topic || !transcript) {
    throw new Error("create_meeting_minute requires channelId, topic and transcript");
  }
  const id = randomUUID();
  db.prepare(`
    INSERT INTO meeting_minutes (
      id, channel_id, topic, transcript, participants, total_turns, duration_seconds,
      initiator_id, key_topics, conclusions, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    channelId,
    topic,
    transcript,
    writeJson(Array.isArray(payload.participants) ? payload.participants : []),
    typeof payload.totalTurns === "number" ? payload.totalTurns : 0,
    typeof payload.durationSeconds === "number" ? payload.durationSeconds : null,
    text(payload.initiatorId, 80),
    writeJson(Array.isArray(payload.keyTopics) ? payload.keyTopics : []),
    text(payload.conclusions, 12000),
    nowIso(),
  );
  return { meetingMinute: { id, channelId, topic } };
}

function buildOperationsReport(db, channelId, title) {
  const tasks = channelId
    ? db.prepare("SELECT * FROM tasks WHERE channel_id = ? ORDER BY created_at DESC LIMIT 200").all(channelId)
    : db.prepare("SELECT * FROM tasks ORDER BY created_at DESC LIMIT 200").all();
  const pending = tasks.filter((task) => !["complete", "completed", "cancelled"].includes(task.status));
  const overdue = pending.filter((task) => task.due_at && new Date(task.due_at).getTime() < Date.now());
  return [
    `# ${title || "Resumo operacional"}`,
    "",
    `Gerado em: ${nowIso()}`,
    `Tarefas abertas: ${pending.length}`,
    `Tarefas vencidas: ${overdue.length}`,
    "",
    ...overdue.slice(0, 20).map((task) => `- Vencida: ${task.title} (${task.status})`),
  ].join("\n");
}

function executeCreateReport(db, job, payload) {
  const channelId = text(payload.channelId, 80) || job.channel_id;
  if (!channelId) throw new Error("create_report requires channelId");
  const content = text(payload.content, 30000) || buildOperationsReport(db, channelId, text(payload.title, 200) || "Relatorio operacional");
  const id = randomUUID();
  db.prepare(`
    INSERT INTO agency_reports (id, channel_id, agent_id, content, analysis_mode, report_date, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    channelId,
    text(payload.agentId, 120) || text(payload.npcId, 120) || job.npc_id,
    content,
    text(payload.analysisMode, 40) || "operational",
    text(payload.reportDate, 80) || nowIso(),
    nowIso(),
  );
  return { report: { id, channelId } };
}

function executeScanOverdueTasks(db, job, payload) {
  const channelId = text(payload.channelId, 80) || job.channel_id;
  if (!channelId) throw new Error("scan_overdue_tasks requires channelId");
  const rows = db.prepare("SELECT * FROM tasks WHERE channel_id = ? LIMIT 300").all(channelId);
  const overdue = rows.filter((task) => (
    task.due_at
    && new Date(task.due_at).getTime() < Date.now()
    && !["complete", "completed", "cancelled"].includes(task.status)
  ));
  for (const task of overdue.slice(0, 30)) {
    writeActionLog(db, {
      channelId,
      npcId: job.npc_id,
      jobId: job.id,
      actionType: "overdue_task_detected",
      status: "logged",
      reason: `Tarefa vencida detectada: ${task.title}`,
      input: { taskId: task.id, dueAt: task.due_at, status: task.status },
    });
  }
  return {
    overdueCount: overdue.length,
    overdueTasks: overdue.slice(0, 30).map((task) => ({
      id: task.id,
      npcId: task.npc_id,
      title: task.title,
      status: task.status,
      dueAt: task.due_at,
    })),
  };
}

async function executeSendTelegramAlert(job, payload) {
  const message = text(payload.message || payload.summary || payload.title, 4000);
  if (!message) throw new Error("send_telegram_alert requires message");
  const manager = globalThis.telegramManager;
  if (manager && typeof manager.sendOperationalAlert === "function") {
    const channelId = text(payload.channelId, 80) || job.channel_id;
    const npcId = text(payload.npcId, 80) || job.npc_id;
    await manager.sendOperationalAlert({ channelId, npcId, message });
    if (typeof manager.sendClientAlert === "function") {
      await manager.sendClientAlert({ channelId, npcId, message }).catch(() => false);
    }
    return { alert: { delivery: "telegram", message } };
  }
  return { alert: { delivery: "logged", message, reason: "telegram_manager_unavailable" } };
}

async function executeJob(db, job) {
  const payload = readJson(job.payload);
  if (job.type === "create_task") return executeCreateTask(db, job, payload);
  if (job.type === "create_memory") return executeCreateMemory(db, job, payload);
  if (job.type === "update_task_status") return executeUpdateTaskStatus(db, job, payload);
  if (job.type === "assign_task") return executeAssignTask(db, job, payload);
  if (job.type === "create_client_note") return executeCreateClientNote(db, job, payload);
  if (job.type === "create_meeting_minute") return executeCreateMeetingMinute(db, job, payload);
  if (job.type === "create_report" || job.type === "daily_operations_report") return executeCreateReport(db, job, payload);
  if (job.type === "scan_overdue_tasks") return executeScanOverdueTasks(db, job, payload);
  if (job.type === "send_alert") return executeSendAlert(job, payload);
  if (job.type === "send_telegram_alert") return executeSendTelegramAlert(job, payload);
  if (job.type === "request_approval") return { approvalRequestId: job.approval_request_id, status: "needs_approval" };
  throw new Error(`unsupported_automation_type:${job.type}`);
}

async function processPendingNpcAutomations(limit = 5) {
  const db = getSqlite();
  const now = nowIso();
  const jobs = db.prepare(`
    SELECT * FROM automation_jobs
    WHERE status = 'pending' AND (run_after IS NULL OR run_after <= ?)
    ORDER BY created_at ASC
    LIMIT ?
  `).all(now, Math.max(1, Math.min(Number(limit) || 5, 20)));

  const results = [];
  for (const job of jobs) {
    const attempts = Number(job.attempts || 0) + 1;
    const startedAt = nowIso();
    db.prepare(`
      UPDATE automation_jobs
      SET status = 'running', attempts = ?, locked_at = ?, started_at = ?, updated_at = ?
      WHERE id = ?
    `).run(attempts, startedAt, startedAt, startedAt, job.id);

    try {
      const result = await executeJob(db, job);
      const completedAt = nowIso();
      db.prepare(`
        UPDATE automation_jobs
        SET status = 'completed', result = ?, error = NULL, processed_at = ?, updated_at = ?
        WHERE id = ?
      `).run(writeJson(result), completedAt, completedAt, job.id);
      writeActionLog(db, {
        channelId: job.channel_id,
        npcId: job.npc_id,
        jobId: job.id,
        approvalRequestId: job.approval_request_id,
        actionType: job.type,
        status: "completed",
        input: readJson(job.payload),
        output: result,
      });
      results.push({ id: job.id, status: "completed", result });
    } catch (error) {
      const failedAt = nowIso();
      const status = attempts >= Number(job.max_attempts || 3) ? "failed" : "pending";
      db.prepare(`
        UPDATE automation_jobs
        SET status = ?, error = ?, locked_at = NULL, updated_at = ?
        WHERE id = ?
      `).run(status, String(error).slice(0, 4000), failedAt, job.id);
      writeActionLog(db, {
        channelId: job.channel_id,
        npcId: job.npc_id,
        jobId: job.id,
        approvalRequestId: job.approval_request_id,
        actionType: job.type,
        status,
        input: readJson(job.payload),
        error,
      });
      results.push({ id: job.id, status, error: String(error) });
    }
  }

  return results;
}

function findOperatorNpc(db, channelId, eventType) {
  const rows = db.prepare("SELECT id, name, openclaw_config FROM npcs WHERE channel_id = ?").all(channelId);
  const preferred = eventType === "daily_operations_report" ? "relatorio" : "gerente";
  return rows.find((npc) => {
    const config = readJson(npc.openclaw_config);
    const haystack = `${npc.name || ""} ${config.agentId || config.agent_id || ""}`
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    return haystack.includes(preferred) || haystack.includes("lord") || haystack.includes("lurdinha");
  }) || rows[0] || null;
}

function hasRecentEventJob(db, eventType, channelId, sinceIso) {
  const row = db.prepare(`
    SELECT id FROM automation_jobs
    WHERE type = ? AND channel_id = ? AND created_at >= ?
    ORDER BY created_at DESC
    LIMIT 1
  `).get(eventType, channelId, sinceIso);
  return Boolean(row);
}

function enqueueOperationalEventJobs(eventType, options = {}) {
  const db = getSqlite();
  const allowed = new Set(["scan_overdue_tasks", "daily_operations_report"]);
  if (!allowed.has(eventType)) throw new Error(`unsupported_operational_event:${eventType}`);

  const now = nowIso();
  const dedupeSince = options.dedupeSince || (
    eventType === "daily_operations_report"
      ? new Date(new Date().setUTCHours(0, 0, 0, 0)).toISOString()
      : new Date(Date.now() - 15 * 60 * 1000).toISOString()
  );
  const channels = db.prepare(`
    SELECT id, name FROM channels
    WHERE channel_type IS NULL OR channel_type IN ('standard', 'client')
    ORDER BY created_at DESC
    LIMIT ?
  `).all(Math.max(1, Math.min(Number(options.limit) || 100, 200)));

  const jobs = [];
  for (const channel of channels) {
    if (hasRecentEventJob(db, eventType, channel.id, dedupeSince)) continue;
    const npc = findOperatorNpc(db, channel.id, eventType);
    if (!npc) continue;

    const id = randomUUID();
    const payload = eventType === "daily_operations_report"
      ? { channelId: channel.id, title: `Resumo diario operacional - ${channel.name}`, analysisMode: "daily" }
      : { channelId: channel.id, title: `Verificar tarefas atrasadas - ${channel.name}` };

    db.prepare(`
      INSERT INTO automation_jobs (
        id, type, status, channel_id, npc_id, created_by_user_id, approval_request_id,
        payload, result, error, attempts, max_attempts, run_after, locked_at,
        started_at, processed_at, created_at, updated_at
      ) VALUES (?, ?, 'pending', ?, ?, NULL, NULL, ?, NULL, NULL, 0, 3, NULL, NULL, NULL, NULL, ?, ?)
    `).run(id, eventType, channel.id, npc.id, writeJson(payload), now, now);

    writeActionLog(db, {
      channelId: channel.id,
      npcId: npc.id,
      jobId: id,
      actionType: eventType,
      status: "queued",
      reason: "Evento operacional automatico enfileirado.",
      input: payload,
    });
    jobs.push({ id, type: eventType, channelId: channel.id, npcId: npc.id });
  }

  return jobs;
}

module.exports = { enqueueOperationalEventJobs, processPendingNpcAutomations };
