const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2:1b";

class OllamaGateway {
  constructor(workspacePath, options = {}) {
    this._workspacePath = workspacePath;
    this._options = options;
    this._activeAborts = new Map();
  }

  async connect() {
    // Check if Ollama is running
    try {
      const resp = await fetch(`${OLLAMA_HOST}/api/tags`);
      if (!resp.ok) throw new Error("Ollama not responding");
      return true;
    } catch (err) {
      console.error("[OllamaGateway] Connection failed:", err.message);
      return false;
    }
  }

  disconnect() {
    for (const controller of this._activeAborts.values()) {
      controller.abort();
    }
    this._activeAborts.clear();
  }

  getDefaultAgentId() {
    return OLLAMA_MODEL;
  }

  async chatSend(agentId, sessionKey, prompt, onDelta) {
    const controller = new AbortController();
    this._activeAborts.set(sessionKey, controller);

    try {
      const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: agentId || OLLAMA_MODEL,
          prompt: prompt,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            if (data.response) {
              fullText += data.response;
              onDelta(data.response);
            }
          } catch (e) {
            // ignore partial json
          }
        }
      }

      return fullText;
    } finally {
      this._activeAborts.delete(sessionKey);
    }
  }
}

module.exports = { OllamaGateway };
