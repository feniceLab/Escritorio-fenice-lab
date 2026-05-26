// src/lib/task-prompt.js
// Instrucoes de protocolo de tarefas inseridas de forma idempotente na identidade do NPC.

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { taskPromptMessages } = require("./i18n/task-prompt-messages.js");

function normalizeTaskPromptLocale(locale) {
  const base = typeof locale === "string" ? locale.toLowerCase().slice(0, 2) : "";
  if (base === "en") return base;
  return "pt";
}

function translateTaskPrompt(locale, key, params) {
  const normalizedLocale = normalizeTaskPromptLocale(locale);
  let text = taskPromptMessages[normalizedLocale]?.[key]
    ?? taskPromptMessages.en[key]
    ?? key;

  if (params) {
    for (const [paramKey, value] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(value));
    }
  }

  return text;
}

function buildTaskCorePrompt(locale) {
  const confirmation = translateTaskPrompt(locale, "taskPrompt.confirmRegistration");
  const confirmInstruction = translateTaskPrompt(locale, "taskPrompt.coreConfirmInstruction", {
    confirmation,
  });

  return `
## Task Management Protocol

You have task management capabilities. Follow this protocol when interacting with players.

## Office Central Protocol

The Fenix-OS Office Central is the mandatory source of operational truth for clients, tasks, memories, notifications, approvals, automation jobs, library items and agent activity.

Before answering any request involving clients, reports, tasks, research, status, publications, calendars, memories, files, automations, approvals or "what do we know about X", use the Office Central context instead of answering from generic memory.

### Mandatory context call
Use WebFetch before doing the work:

POST {DESKRPG_API_BASE}/api/office/context
Content-Type: application/json

{
  "channelId": "{DESKRPG_CHANNEL_ID}",
  "npcId": "{DESKRPG_NPC_ID}",
  "contextKind": "agent-task",
  "query": "short description of the user request"
}

If you know the client ID, send "clientId" too. If you only know the current room, channelId is enough. Use the returned summary, openTasks, overdueTasks, memories, library, pendingApprovals, notifications and recentActions as your working context.

### Save operational results
- Important facts learned about a client must be saved as memory.
- Pending work must become a task or notification.
- Sensitive actions must become approval requests or notifications, not silent promises.
- Do not say the data is unavailable until you have checked the Office Central context.

### Detecting Tasks
- If the player gives a work instruction (research, analysis, report, creation, summarization, posting, validation, correction, retry, etc.), this is a task.
- Direct work instructions are already approved by the player. Do not ask whether to register them as a task.
- If the player provides a missing detail during an active workflow (URL, handle, account, ID, correction, access update, error notification), record it and continue the workflow.
- If the message is casual conversation, a simple question, or small talk, do NOT create a task.
- ${confirmInstruction}

### Task ID Format
- Generate IDs as: {your_name_lowercase}-{YYYYMMDD}-{4_random_hex}
- Example: peter-20260324-a7f3
- Use different random suffix for each new task.

### Responding with Task Metadata
When creating, updating, or completing a task, append a task metadata block at the END of your natural response:

${'```'}json:task
{
  "action": "create",
  "id": "peter-20260324-a7f3",
  "title": "Concise task title (under 50 chars)",
  "status": "in_progress",
  "summary": "1-2 sentence description of current state"
}
${'```'}

### Actions
- **create**: Player gave a direct work instruction. Set status to "in_progress".
- **update**: You have progress to report. Keep status "in_progress". Update summary.
- **complete**: You have finished the task and are delivering final results. Set status to "complete".
- **cancel**: Player requested cancellation. Set status to "cancelled".

### Rules
- Maximum ONE task block per response.
- Always write your natural conversational response BEFORE the task block.
- Never ask a task-registration confirmation question for a direct instruction.
- Keep title concise (under 50 chars). Put details in summary.
- When completing a task, deliver the full result in your message text, not in the task block.
- If a player says "cancelar", "cancele", or "cancel" for an active task, use action "cancel".
`.trim();
}

const TASK_CORE_PROMPT = buildTaskCorePrompt("pt");

/**
 * Prefixa o protocolo de tarefas na identidade de forma idempotente.
 * @param {string} userIdentity
 * @param {string | null | undefined} locale
 * @returns {string}
 */
function injectTaskPrompt(userIdentity, locale) {
  if (userIdentity && userIdentity.includes("Task Management Protocol")) {
    if (userIdentity.includes("Office Central Protocol")) return userIdentity;
    return userIdentity.replace(
      "### Detecting Tasks",
      `${buildOfficeCentralProtocol(locale)}\n\n### Detecting Tasks`,
    );
  }
  return buildTaskCorePrompt(locale) + "\n\n" + (userIdentity || "");
}

function buildOfficeCentralProtocol(locale) {
  const isPt = normalizeTaskPromptLocale(locale) === "pt";
  if (!isPt) {
    return `## Office Central Protocol

The Fenix-OS Office Central is the mandatory source of operational truth for clients, tasks, memories, notifications, approvals, automation jobs, library items and agent activity.

Before answering any request involving clients, reports, tasks, research, status, publications, calendars, memories, files, automations, approvals or "what do we know about X", use the Office Central context instead of answering from generic memory.

Use WebFetch:

POST {DESKRPG_API_BASE}/api/office/context
Content-Type: application/json

{"channelId":"{DESKRPG_CHANNEL_ID}","npcId":"{DESKRPG_NPC_ID}","contextKind":"agent-task","query":"short description of the user request"}

Use the returned summary, openTasks, overdueTasks, memories, library, pendingApprovals, notifications and recentActions as your working context. Do not say the data is unavailable until you have checked Office Central.`;
  }

  return `## Protocolo da Central do Escritório

A Central do Escritório do Fenix-OS é a fonte obrigatória da verdade operacional sobre clientes, tarefas, memórias, notificações, aprovações, automações, biblioteca e atividade dos agentes.

Antes de responder qualquer pedido sobre clientes, relatórios, tarefas, pesquisa, status, publicações, calendário, memórias, arquivos, automações, aprovações ou "o que sabemos sobre X", use o contexto da Central em vez de responder de forma genérica.

Use WebFetch:

POST {DESKRPG_API_BASE}/api/office/context
Content-Type: application/json

{"channelId":"{DESKRPG_CHANNEL_ID}","npcId":"{DESKRPG_NPC_ID}","contextKind":"agent-task","query":"resumo curto do pedido do usuário"}

Use summary, openTasks, overdueTasks, memories, library, pendingApprovals, notifications e recentActions como contexto de trabalho. Não diga que não há dados antes de consultar a Central.`;
}

/**
 * Lembrete curto para reforcar o protocolo quando a conversa estiver longa.
 * O texto e anexado antes da mensagem do usuario com a tag [SYSTEM].
 */
function buildTaskReminder(locale) {
  const confirmation = translateTaskPrompt(locale, "taskPrompt.confirmRegistration");
  const header = translateTaskPrompt(locale, "taskPrompt.reminderHeader");
  const confirmStep = translateTaskPrompt(locale, "taskPrompt.reminderConfirmStep", {
    confirmation,
  });
  const createStep = translateTaskPrompt(locale, "taskPrompt.reminderCreateStep");
  const requiredFields = translateTaskPrompt(locale, "taskPrompt.reminderRequiredFields");
  const allowedFields = translateTaskPrompt(locale, "taskPrompt.reminderAllowedFields");
  const ignoreCasual = translateTaskPrompt(locale, "taskPrompt.reminderIgnoreCasual");

  const officeReminder = normalizeTaskPromptLocale(locale) === "pt"
    ? `[SYSTEM REMINDER - CENTRAL DO ESCRITORIO OBRIGATORIA]
Antes de responder pedidos sobre clientes, dados, tarefas, relatórios, publicações, status, memórias, arquivos, automações ou aprovações, consulte a Central:
POST {DESKRPG_API_BASE}/api/office/context com channelId={DESKRPG_CHANNEL_ID}, npcId={DESKRPG_NPC_ID}, contextKind="agent-task" e query="<pedido>".
Use o retorno como fonte principal. Se houver pendência, gere tarefa/memória/notificação; não deixe só no chat.`
    : `[SYSTEM REMINDER - MANDATORY OFFICE CENTRAL]
Before answering requests about clients, data, tasks, reports, publications, status, memories, files, automations or approvals, consult Office Central:
POST {DESKRPG_API_BASE}/api/office/context with channelId={DESKRPG_CHANNEL_ID}, npcId={DESKRPG_NPC_ID}, contextKind="agent-task" and query="<request>".
Use the response as the primary source. If there is follow-up work, create a task/memory/notification; do not leave it only in chat.`;

  return `${officeReminder}

[SYSTEM REMINDER - MANDATORY TASK PROTOCOL]
${header}
${confirmStep}
${createStep}
${'```'}json:task
{"action":"create","id":"{name}-{YYYYMMDD}-{4hex}","title":"Titulo","status":"in_progress","summary":"Resumo"}
${'```'}
${requiredFields}
${allowedFields}
${ignoreCasual}`;
}

const TASK_REMINDER = buildTaskReminder("pt");

/**
 * Prefixa o lembrete de protocolo na mensagem do usuario.
 * @param {string} userMessage - mensagem original do usuario
 * @param {string | null | undefined} locale
 * @returns {string}
 */
function withTaskReminder(userMessage, locale) {
  return buildTaskReminder(locale) + "\n\n" + userMessage;
}

module.exports = {
  TASK_CORE_PROMPT,
  injectTaskPrompt,
  TASK_REMINDER,
  withTaskReminder,
  buildTaskCorePrompt,
  buildTaskReminder,
  buildOfficeCentralProtocol,
  normalizeTaskPromptLocale,
};
