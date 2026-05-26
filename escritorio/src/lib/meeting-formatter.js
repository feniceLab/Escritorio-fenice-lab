/**
 * Formatador de mensagens de reuniao (CommonJS)
 * Portado de claw-meet/broker/src/message-formatter.ts
 */

/**
 * Mensagem de polling enxuta para avisar o agente sobre as ultimas falas.
 * @param {string} topic
 * @param {Array<{displayName: string, content: string}>} recentTurns
 * @param {{displayName: string}} agent
 * @param {number} currentTurn
 * @param {number} maxTurns
 * @param {number} remainingTurns
 * @param {string|null} [passPolicy]
 * @returns {string}
 */
function formatPollMessage(topic, recentTurns, agent, currentTurn, maxTurns, remainingTurns, passPolicy) {
  const recentSummary = recentTurns
    .map((t) => `[${t.displayName}] ${t.content.slice(0, 150)}${t.content.length > 150 ? "..." : ""}`)
    .join("\n");

  let message = `📋 [Alerta de reunião: ${topic}]
Turno atual: ${currentTurn}/${maxTurns} | Falas restantes: ${remainingTurns}

Conversas recentes:
${recentSummary}

---`;

  if (passPolicy) {
    message += `\n[Diretriz de fala] ${passPolicy}\n`;
  }

  message += `
Se quiser falar → SPEAK: (motivo em uma linha)
Se quiser passar → PASS

Responda a primeira linha apenas com SPEAK: ou PASS.`;

  return message;
}

/**
 * Mensagem de fala com contexto completo
 * @param {string} topic
 * @param {Array<{displayName: string, role: string}>} participants
 * @param {Array<{displayName: string, content: string}>} turns
 * @param {{displayName: string}} agent
 * @param {number} currentTurn
 * @param {number} maxTurns
 * @param {number} remainingTurns
 * @returns {string}
 */
function formatSpeakMessage(topic, participants, turns, agent, currentTurn, maxTurns, remainingTurns) {
  const participantList = participants
    .map((p) => `${p.displayName}(${p.role})`)
    .join(", ");

  const historyText = turns
    .map((t) => `[${t.displayName}] ${t.content}`)
    .join("\n\n");

  return `📋 [Reunião: ${topic}]
Participantes: ${participantList}
Turno atual: ${currentTurn}/${maxTurns} | Falas restantes: ${remainingTurns}

---
${historyText}

---
${agent.displayName}, compartilhe sua opinião.
⚠️ Regras: responda em português, em tom natural de colega para colega, com 3 a 5 frases. Não use lista com bullets, numeração, negrito ou cabeçalhos.`;
}

/**
 * Gera a ata da reuniao em Markdown
 * @param {string} topic
 * @param {Array<{seq: number, displayName: string, content: string, timestamp: number}>} turns
 * @param {Array<{displayName: string, role: string}>} participants
 * @returns {string}
 */
function generateTranscript(topic, turns, participants) {
  const date = new Date().toISOString().split("T")[0];
  const lines = [
    `# Ata da reunião: ${topic}`,
    "",
    `- **Data**: ${date}`,
    `- **Participantes**: ${participants.map((p) => `${p.displayName}(${p.role})`).join(", ")}`,
    `- **Total de turnos**: ${turns.length}`,
    "",
    "---",
    "",
    "## Registro da conversa",
    "",
  ];

  for (const turn of turns) {
    const time = new Date(turn.timestamp).toLocaleTimeString("pt-BR");
    lines.push(`### [${turn.seq}] ${turn.displayName} (${time})`);
    lines.push("");
    lines.push(turn.content);
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Interpreta a intencao SPEAK/PASS na resposta do agente
 * @param {string} response
 * @returns {{ wantsToSpeak: boolean, reason: string }}
 */
function parseHandRaise(response) {
  if (!response || typeof response !== "string") {
    return { wantsToSpeak: false, reason: "" };
  }

  const firstLine = response.split("\n")[0].trim();

  if (/^SPEAK/i.test(firstLine)) {
    const reason = firstLine.replace(/^SPEAK:?\s*/i, "").trim();
    return { wantsToSpeak: true, reason: reason || "(quer falar)" };
  }

  return { wantsToSpeak: false, reason: "" };
}

/**
 * Remove prefixos de controle remanescentes da resposta falada
 * @param {string} response
 * @returns {string}
 */
function sanitizeSpokenResponse(response) {
  if (typeof response !== "string") return "";
  return response.replace(/^\s*SPEAK\s*:?\s*/i, "");
}

/**
 * Durante o streaming, segura fragmentos parciais do prefixo SPEAK.
 * @param {string} response
 * @returns {string}
 */
function sanitizeStreamingSpokenResponse(response) {
  if (typeof response !== "string") return "";

  const trimmedStart = response.replace(/^\s+/, "");
  if (/^S(?:P(?:E(?:A(?:K(?::?)?)?)?)?)?$/i.test(trimmedStart)) {
    return "";
  }

  return sanitizeSpokenResponse(response);
}

module.exports = {
  formatPollMessage,
  formatSpeakMessage,
  generateTranscript,
  parseHandRaise,
  sanitizeSpokenResponse,
  sanitizeStreamingSpokenResponse,
};
