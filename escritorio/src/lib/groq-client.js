/**
 * Groq API Client — fallback LLM quando Claude/Codex esgotam tokens.
 *
 * Detecta erros típicos de quota/rate-limit e usa Groq (OpenAI-compatible)
 * com Llama-3.3-70b para continuar a operação.
 */

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

function extractQuotaOrRateLimitMessage(err) {
  if (!err) return null;
  const msg = typeof err === "string" ? err : (err.message || String(err));
  const lower = msg.toLowerCase();
  const isQuotaMessage = (
    lower.includes("rate_limit") ||
    lower.includes("rate limit") ||
    lower.includes("quota") ||
    lower.includes("insufficient_quota") ||
    lower.includes("usage limit") ||
    lower.includes("credit balance") ||
    lower.includes("429") ||
    lower.includes("402") ||
    lower.includes("overloaded") ||
    lower.includes("token limit") ||
    lower.includes("hit your limit") ||
    (lower.includes("limit") && lower.includes("resets"))
  );
  return isQuotaMessage ? msg : null;
}

function isGroqConfigured() {
  return !!process.env.GROQ_API_KEY;
}

function isGroqRequestTooLargeError(err) {
  if (!err) return false;
  const msg = typeof err === "string" ? err : (err.message || String(err));
  const lower = msg.toLowerCase();
  return (
    lower.includes("groq api 413")
    || lower.includes("request too large")
    || (lower.includes("tokens per minute") && lower.includes("requested"))
  );
}

/**
 * Detecta se um erro vindo de Claude/Codex indica esgotamento de tokens
 * ou rate-limit — momento de cair para o Groq.
 */
function isQuotaOrRateLimitError(err) {
  return !!extractQuotaOrRateLimitMessage(err);
}

/**
 * Faz chat completion via Groq com streaming.
 * Compatível com a assinatura de onDelta usada pelos gateways.
 *
 * @param {string} systemPrompt
 * @param {string} userMessage
 * @param {(chunk: string) => void} onDelta
 * @param {object} [opts]
 * @param {string} [opts.model]
 * @param {number} [opts.timeoutMs]
 * @returns {Promise<string>} full response text
 */
async function groqChatSend(systemPrompt, userMessage, onDelta, opts = {}) {
  if (!isGroqConfigured()) {
    throw new Error("GROQ_API_KEY not set");
  }

  const model = opts.model || process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  const timeoutMs = opts.timeoutMs || 120_000;

  const messages = [];
  if (systemPrompt && systemPrompt.trim()) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: userMessage });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    console.log(`[Groq] Fallback active — model: ${model}, msg: ${userMessage.slice(0, 60)}...`);
    const res = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 4096,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Groq API ${res.status}: ${body.slice(0, 200)}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const payload = trimmed.slice(6);
        if (payload === "[DONE]") continue;
        try {
          const event = JSON.parse(payload);
          const delta = event.choices?.[0]?.delta?.content;
          if (delta) {
            fullText += delta;
            onDelta(delta);
          }
        } catch {
          // ignore malformed chunks
        }
      }
    }

    console.log(`[Groq] Complete — len: ${fullText.length}`);
    return fullText;
  } finally {
    clearTimeout(timer);
  }
}


async function groqTranscribeAudio(audioBuffer, filename = "audio.ogg") {
  const formData = new FormData();
  formData.append("file", new Blob([audioBuffer]), filename);
  formData.append("model", "whisper-large-v3");
  formData.append("response_format", "json");

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + process.env.GROQ_API_KEY,
    },
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown Error");
    throw new Error("Groq STT Error: " + errorText);
  }
  const data = await res.json();
  return data.text;
}

module.exports = {
  extractQuotaOrRateLimitMessage,
  isGroqConfigured,
  isGroqRequestTooLargeError,
  isQuotaOrRateLimitError,
  groqChatSend,
  groqTranscribeAudio,
};
