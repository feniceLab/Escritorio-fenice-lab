// Remove blocos de controle json:task do texto da resposta e extrai payloads de tarefa válidos.

const COMPLETE_TASK_BLOCK_REGEX = /```json:task\s*\n([\s\S]*?)\n```/g;
const INCOMPLETE_TASK_BLOCK_REGEX = /```json:task[\s\S]*$/;

/**
 * @param {string} responseText
 * @returns {{ sanitizedText: string, taskPayloads: object[] }}
 */
function extractTaskBlocks(responseText) {
  if (!responseText || typeof responseText !== "string") {
    return { sanitizedText: responseText || "", taskPayloads: [] };
  }

  const taskPayloads = [];
  let sanitizedText = responseText;

  for (const match of responseText.matchAll(COMPLETE_TASK_BLOCK_REGEX)) {
    const rawJson = match[1];
    try {
      taskPayloads.push(JSON.parse(rawJson));
    } catch (error) {
      console.warn(
        "[TaskBlockUtils] Failed to parse task block JSON:",
        error instanceof Error ? error.message : String(error),
      );
    }
    sanitizedText = sanitizedText.replace(match[0], "");
  }

  return {
    sanitizedText: collapseTaskWhitespace(sanitizedText),
    taskPayloads,
  };
}

/**
 * Oculta blocos de controle json:task, considerando estados intermediários de streaming.
 * @param {string} responseText
 * @param {{ stripIncompleteTail?: boolean }} [options]
 */
function sanitizeNpcResponseText(responseText, options = {}) {
  const { stripIncompleteTail = false } = options;
  const { sanitizedText } = extractTaskBlocks(responseText);
  if (!stripIncompleteTail) return sanitizedText;
  return collapseTaskWhitespace(sanitizedText.replace(INCOMPLETE_TASK_BLOCK_REGEX, ""));
}

/**
 * @param {string} value
 */
function collapseTaskWhitespace(value) {
  return value
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

module.exports = {
  extractTaskBlocks,
  sanitizeNpcResponseText,
};
