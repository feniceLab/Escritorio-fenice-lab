/**
 * Claude Code Gateway Adapter
 *
 * Implements the same public interface as OpenClawGateway but spawns
 * the Claude Code CLI (`claude`) as a subprocess instead of connecting
 * to an OpenClaw WebSocket server.
 *
 * Requirements:
 *   - Claude Code CLI installed globally (`claude` in PATH)
 *   - Claude Code Max plan (no ANTHROPIC_API_KEY needed)
 */

const { spawn, execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const {
  buildAgentPrompt,
  createAgent,
  deleteAgent,
  listAgents,
  readAgentFile,
  resolveWorkspacePath,
  writeAgentFile,
} = require("./local-cli-agent-store.js");
const { isQuotaOrRateLimitError } = require("./groq-client.js");

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CLAUDE_CLI = "claude";
const DEFAULT_MAX_TURNS = 25;
const DEFAULT_TIMEOUT_MS = 180_000; // 3 minutes
const DEFAULT_MODEL = process.env.DESKRPG_CLAUDE_MODEL || "";
const ALLOWED_TOOLS = [
  "Read",
  "Write",
  "Edit",
  "MultiEdit",
  "Bash",
  "Glob",
  "Grep",
  "LS",
  "TodoRead",
  "TodoWrite",
  "WebFetch",
  "WebSearch",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Detects whether the Claude Code CLI is available and returns its version.
 * Returns null if not found.
 */
function detectClaudeCodeCli() {
  try {
    const output = execSync(`${CLAUDE_CLI} --version 2>/dev/null`, {
      encoding: "utf8",
      timeout: 10_000,
    }).trim();
    // Output format: "2.1.94 (Claude Code)"
    const match = output.match(/^([\d.]+)/);
    return match ? match[1] : output;
  } catch {
    return null;
  }
}

/**
 * Parses a stream-json line from Claude Code CLI.
 * Each line is a JSON object. We're interested in:
 *   - type: "assistant" with message content blocks
 *   - type: "result" for the final result
 */
function parseStreamJsonLine(line) {
  if (!line || !line.trim()) return null;
  try {
    return JSON.parse(line.trim());
  } catch {
    return null;
  }
}

/**
 * Extracts text delta from a stream-json event.
 */
function extractTextFromEvent(event) {
  if (!event) return null;

  // Stream-json format: each event has a type
  // "assistant" events contain the streamed text chunks
  if (event.type === "assistant" && event.message) {
    const content = event.message.content;
    if (Array.isArray(content)) {
      return content
        .filter((block) => block.type === "text")
        .map((block) => block.text || "")
        .join("");
    }
  }

  // Content block delta events
  if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
    return event.delta.text || "";
  }

  return null;
}

/**
 * Extracts the final result text from a "result" event.
 */
function extractResultText(event) {
  if (!event || event.type !== "result") return null;

  // Result event contains the full response
  if (event.result) {
    const content = event.result.content || event.result;
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
      return content
        .filter((block) => block.type === "text")
        .map((block) => block.text || "")
        .join("");
    }
  }

  // Fallback: check message field
  if (event.message?.content) {
    if (typeof event.message.content === "string") return event.message.content;
    if (Array.isArray(event.message.content)) {
      return event.message.content
        .filter((block) => block.type === "text")
        .map((block) => block.text || "")
        .join("");
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// ClaudeCodeGateway class
// ---------------------------------------------------------------------------

class ClaudeCodeGateway {
  /**
   * @param {string} [workspacePath] - Directory where Claude Code will operate
   * @param {object} [options]
   * @param {string[]} [options.allowedTools] - Tools to pre-approve
   * @param {number} [options.maxTurns] - Max agentic turns
   * @param {number} [options.timeoutMs] - Subprocess timeout
   * @param {string[]} [options.mcpServers] - MCP server configs (future Fase 2)
   */
  constructor(workspacePath, options = {}) {
    this._workspacePath = resolveWorkspacePath(workspacePath || process.cwd());
    this._allowedTools = options.allowedTools || ALLOWED_TOOLS;
    this._maxTurns = options.maxTurns || DEFAULT_MAX_TURNS;
    this._timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
    this._model = options.model || DEFAULT_MODEL;
    this._mcpServers = options.mcpServers || [];
    this._connected = false;
    this._cliVersion = null;
    this._activeProcesses = new Map(); // sessionKey → child_process
  }

  // ── MCP config helpers ─────────────────────────────────────────────

  /**
   * Writes a temporary MCP config JSON file for a session's NPC servers.
   * Returns the path to the temp file, or null on failure.
   */
  _writeMcpConfig(sessionKey, mcpServers) {
    try {
      const config = { mcpServers: {} };
      for (const server of mcpServers) {
        config.mcpServers[server.name] = {
          command: server.command || "npx",
          args: server.args || [],
          ...(server.env ? { env: server.env } : {}),
        };
      }
      const tmpDir = path.join(os.tmpdir(), "deskrpg-mcp");
      fs.mkdirSync(tmpDir, { recursive: true });
      const filePath = path.join(tmpDir, `${sessionKey.replace(/[^a-zA-Z0-9-]/g, "_")}.json`);
      fs.writeFileSync(filePath, JSON.stringify(config, null, 2), "utf8");
      return filePath;
    } catch (err) {
      console.error("[ClaudeCodeGW] Failed to write MCP config:", err.message);
      return null;
    }
  }

  /**
   * Removes a temporary MCP config file.
   */
  _cleanupMcpConfig(sessionKey) {
    try {
      const tmpDir = path.join(os.tmpdir(), "deskrpg-mcp");
      const filePath = path.join(tmpDir, `${sessionKey.replace(/[^a-zA-Z0-9-]/g, "_")}.json`);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {
      // best effort cleanup
    }
  }

  // ── Public API (same interface as OpenClawGateway) ──────────────────

  /**
   * "Connect" to Claude Code by verifying the CLI is available.
   */
  async connect() {
    const version = detectClaudeCodeCli();
    if (!version) {
      throw new Error(
        "Claude Code CLI not found. Install with: npm install -g @anthropic-ai/claude-code",
      );
    }
    this._cliVersion = version;
    this._connected = true;
    console.log(`[ClaudeCodeGW] Connected — CLI v${version}, workspace: ${this._workspacePath}`);
  }

  /**
   * Disconnect and kill all active subprocesses.
   */
  disconnect() {
    this._connected = false;
    for (const [key, proc] of this._activeProcesses) {
      try {
        proc.kill("SIGTERM");
      } catch {
        // ignore
      }
      this._activeProcesses.delete(key);
    }
    console.log("[ClaudeCodeGW] Disconnected");
  }

  /**
   * Returns true if the CLI was detected and connect() succeeded.
   */
  isConnected() {
    return this._connected;
  }

  /**
   * List available "agents" — for Claude Code, each NPC is its own agent.
   * Returns a static list; the real agent identity comes from the NPC config.
   */
  async agentsList() {
    return listAgents(this._workspacePath).map((agent) => ({
      id: agent.id,
      name: agent.name,
      status: "ready",
      workspace: agent.workspace || this._workspacePath,
    }));
  }

  async agentsCreate(name, workspace) {
    const agent = createAgent(this._workspacePath, name, workspace);
    return {
      id: agent.id,
      name: agent.name,
      status: "ready",
      workspace: agent.workspace || this._workspacePath,
    };
  }

  async agentsDelete(agentId, deleteFiles = false) {
    return deleteAgent(this._workspacePath, agentId, deleteFiles);
  }

  async agentsFileGet(agentId, name) {
    return readAgentFile(this._workspacePath, agentId, name);
  }

  async agentsFileSet(agentId, name, content) {
    return writeAgentFile(this._workspacePath, agentId, name, content);
  }

  /**
   * Send a chat message and stream the response.
   *
   * This is the core method. It spawns `claude -p "message"` as a subprocess
   * and streams the output back via the onDelta callback.
   *
   * @param {string} agentId - Ignored for Claude Code (single agent)
   * @param {string} sessionKey - Used to maintain conversation context
   * @param {string} message - The user's message
   * @param {(delta: string) => void} onDelta - Called for each text chunk
   * @param {Array} [attachments] - File attachments (future)
   * @param {string} [systemPrompt] - Optional system prompt (NPC persona)
   * @param {object} [powers] - Per-NPC powers config (allowedTools, envVars, mcpServers, maxTurns, timeoutMs)
   * @returns {Promise<string>} Full response text
   */
  chatSend(agentId, sessionKey, message, onDelta, _attachments, systemPrompt, powers) {
    return new Promise((resolve, reject) => {
      if (!this._connected) {
        return reject(
          new Error("Claude Code Gateway not connected"),
        );
      }

      // Kill any existing process for this session
      const existingProc = this._activeProcesses.get(sessionKey);
      if (existingProc) {
        try {
          existingProc.kill("SIGTERM");
        } catch {
          // ignore
        }
        this._activeProcesses.delete(sessionKey);
      }

      // Resolve per-NPC overrides from powers config
      const maxTurns = powers?.maxTurns || this._maxTurns;
      const timeoutMs = powers?.timeoutMs || this._timeoutMs;
      const allowedTools = powers?.allowedTools || this._allowedTools;
      const model = powers?.model || this._model;
      const agentPrompt = agentId ? buildAgentPrompt(this._workspacePath, agentId) : "";
      const effectiveSystemPrompt = [agentPrompt, systemPrompt].filter(Boolean).join("\n\n");

      // Build command arguments
      const args = [
        "--print",           // Non-interactive mode
        "--output-format", "stream-json",
        "--max-turns", String(maxTurns),
        "--verbose",
      ];

      // Add NPC persona as system prompt
      if (model) {
        args.push("--model", model);
      }

      if (effectiveSystemPrompt) {
        args.push("--system-prompt", effectiveSystemPrompt);
      }

      // Add allowed tools (per-NPC or global defaults)
      for (const tool of allowedTools) {
        args.push("--allowedTools", tool);
      }

      // Add per-NPC MCP servers config
      let mcpConfigPath = null;
      if (powers?.mcpServers?.length) {
        mcpConfigPath = this._writeMcpConfig(sessionKey, powers.mcpServers);
        if (mcpConfigPath) {
          args.push("--mcp-config", mcpConfigPath);
        }
      }

      // Build per-NPC environment variables
      const npcEnv = {
        ...process.env,
        // Ensure we don't try to nest Claude Code sessions
        CLAUDE_CODE_ENTRYPOINT: undefined,
        CLAUDECODE: undefined,
      };
      if (powers?.envVars) {
        for (const [key, value] of Object.entries(powers.envVars)) {
          if (typeof value === "string") {
            npcEnv[key] = value;
          }
        }
      }

      console.log(
        `[ClaudeCodeGW] chatSend → session: ${sessionKey}, msg: ${message.slice(0, 80)}...`,
        powers ? `powers: tools=${allowedTools.length}, env=${Object.keys(powers.envVars || {}).length}, mcp=${(powers.mcpServers || []).length}` : "",
      );

      // Spawn the claude process
      const proc = spawn(CLAUDE_CLI, args, {
        cwd: this._workspacePath,
        env: npcEnv,
        stdio: ["pipe", "pipe", "pipe"],
      });

      this._activeProcesses.set(sessionKey, proc);

      let fullText = "";
      let stderrOutput = "";
      let lastEventText = "";

      const appendDeltaIfAllowed = (delta, nextSnapshot) => {
        if (!delta) return;
        fullText += delta;
        if (isQuotaOrRateLimitError(nextSnapshot || fullText)) {
          return;
        }
        onDelta(delta);
      };

      // Write the message to stdin and close it
      proc.stdin.write(message);
      proc.stdin.end();

      // Process stdout line by line (stream-json format)
      let buffer = "";
      proc.stdout.on("data", (chunk) => {
        buffer += chunk.toString("utf8");
        const lines = buffer.split("\n");
        // Keep the last partial line in the buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          const event = parseStreamJsonLine(line);
          if (!event) continue;

          // Check for assistant text streaming
          const text = extractTextFromEvent(event);
          if (text && text !== lastEventText) {
            // Calculate delta (new text that wasn't sent before)
            const delta = text.startsWith(lastEventText)
              ? text.slice(lastEventText.length)
              : text;
            appendDeltaIfAllowed(delta, text);
            lastEventText = text;
          }

          // Check for final result
          const resultText = extractResultText(event);
          if (resultText) {
            // If we haven't streamed this text yet, send it
            if (resultText.length > fullText.length) {
              const remaining = resultText.slice(fullText.length);
              appendDeltaIfAllowed(remaining, resultText);
            }
          }
        }
      });

      proc.stderr.on("data", (chunk) => {
        stderrOutput += chunk.toString("utf8");
      });

      // Timeout
      const timer = setTimeout(() => {
        try {
          proc.kill("SIGTERM");
        } catch {
          // ignore
        }
        this._activeProcesses.delete(sessionKey);
        reject(new Error("Claude Code timeout"));
      }, this._timeoutMs);

      proc.on("close", (code) => {
        clearTimeout(timer);
        this._activeProcesses.delete(sessionKey);
        if (mcpConfigPath) this._cleanupMcpConfig(sessionKey);

        // Process any remaining buffer
        if (buffer.trim()) {
          const event = parseStreamJsonLine(buffer);
          if (event) {
            const resultText = extractResultText(event);
            if (resultText && resultText.length > fullText.length) {
              const remaining = resultText.slice(fullText.length);
              appendDeltaIfAllowed(remaining, resultText);
            }
          }
        }

        // Claude Code can sometimes return quota/plan-limit text as a normal
        // assistant response instead of surfacing a non-zero exit code.
        if (fullText && isQuotaOrRateLimitError(fullText)) {
          reject(new Error(fullText.trim()));
          return;
        }

        if (code !== 0 && !fullText) {
          const errorMsg = stderrOutput.trim() || `Claude Code exited with code ${code}`;
          console.error(`[ClaudeCodeGW] Process error: ${errorMsg}`);
          reject(new Error(errorMsg));
        } else {
          console.log(
            `[ClaudeCodeGW] chatSend complete — session: ${sessionKey}, len: ${fullText.length}`,
          );
          resolve(fullText);
        }
      });

      proc.on("error", (err) => {
        clearTimeout(timer);
        this._activeProcesses.delete(sessionKey);
        console.error("[ClaudeCodeGW] Spawn error:", err.message);
        reject(err);
      });
    });
  }

  /**
   * Abort an ongoing chat session.
   */
  chatAbort(agentId, sessionKey) {
    const proc = this._activeProcesses.get(sessionKey);
    if (proc) {
      try {
        proc.kill("SIGTERM");
      } catch {
        // ignore
      }
      this._activeProcesses.delete(sessionKey);
    }
  }

  /**
   * Get the CLI version.
   */
  getVersion() {
    return this._cliVersion;
  }

  /**
   * Get the workspace path.
   */
  getWorkspacePath() {
    return this._workspacePath;
  }
}

// ---------------------------------------------------------------------------
// Test helper
// ---------------------------------------------------------------------------

/**
 * Tests whether Claude Code CLI is available and can respond.
 * Returns { version, ok } or throws.
 */
async function testClaudeCodeConnection(workspacePath) {
  const version = detectClaudeCodeCli();
  if (!version) {
    throw new Error(
      "Claude Code CLI not found. Install with: npm install -g @anthropic-ai/claude-code",
    );
  }

  // Quick test: ask Claude to respond with a simple message
  const gateway = new ClaudeCodeGateway(workspacePath || process.cwd(), {
    maxTurns: 1,
    timeoutMs: 30_000,
    allowedTools: [],
  });
  await gateway.connect();

  try {
    const response = await gateway.chatSend(
      "claude-code",
      "test-connection",
      'Respond with exactly: {"status":"connected"}',
      () => {},
    );
    return { version, response, ok: true };
  } finally {
    gateway.disconnect();
  }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  ClaudeCodeGateway,
  detectClaudeCodeCli,
  testClaudeCodeConnection,
};
