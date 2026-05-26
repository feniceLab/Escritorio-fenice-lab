// src/lib/task-parser.js
// Parser para extrair metadados de tarefas das respostas dos NPCs.
// Dois modos: bloco (padrão) e estruturado. Retorna o mesmo formato de saída.

/* eslint-disable @typescript-eslint/no-require-imports */
const { extractTaskBlocks } = require("./task-block-utils.js");

/**
 * Parser A: extração de blocos de código json:task
 * @param {string} responseText
 * @returns {{ message: string, tasks: object[] }}
 */
function parseBlockMode(responseText) {
  const { sanitizedText, taskPayloads } = extractTaskBlocks(responseText);
  return { message: sanitizedText, tasks: taskPayloads };
}

/**
 * Parser B: parsing de JSON estruturado
 * @param {string} responseText
 * @returns {{ message: string, tasks: object[] }}
 */
function parseStructuredMode(responseText) {
  const parsed = JSON.parse(responseText);
  return {
    message: parsed.message || "",
    tasks: parsed.task ? [parsed.task] : [],
  };
}

/**
 * Parser unificado. Alterna modos conforme configuração. Faz fallback para bloco se o estruturado falhar.
 * @param {string} responseText
 * @param {"block" | "structured"} mode
 * @returns {{ message: string, tasks: object[] }}
 */
function parseNpcResponse(responseText, mode = "block") {
  if (!responseText || typeof responseText !== "string") {
    return { message: responseText || "", tasks: [] };
  }

  if (mode === "structured") {
    try {
      return parseStructuredMode(responseText);
    } catch (e) {
      console.warn("[TaskParser] Structured parse failed, falling back to block mode:", e.message);
      return parseBlockMode(responseText);
    }
  }

  return parseBlockMode(responseText);
}

/**
 * Validação de ação de tarefa
 * @param {unknown} taskAction
 * @returns {boolean}
 */
function isValidTaskAction(taskAction) {
  if (!taskAction || typeof taskAction !== "object") return false;
  const validActions = ["create", "update", "complete", "cancel"];
  const validStatuses = ["pending", "in_progress", "complete", "cancelled"];
  return (
    validActions.includes(taskAction.action) &&
    typeof taskAction.id === "string" &&
    taskAction.id.length > 0 &&
    typeof taskAction.title === "string" &&
    (!taskAction.status || validStatuses.includes(taskAction.status))
  );
}

module.exports = { parseNpcResponse, isValidTaskAction };
