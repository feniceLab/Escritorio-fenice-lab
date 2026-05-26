/**
 * 회의 브로커 (CommonJS)
 * Ported from claw-meet/broker/src/orchestrator.ts + meeting-session.ts
 *
 * OpenClaw WebSocket RPC gateway를 사용하여 다중 에이전트 회의를 오케스트레이션한다.
 * Listen → Raise Hand → Speak 모델:
 * 1. 모든 에이전트에게 병렬 poll (SPEAK/PASS)
 * 2. 손든 에이전트 중 하나를 선택하여 발언권 부여 (스트리밍)
 * 3. 전원 PASS가 연속하면 회의 자연 종료
 * 4. 사용자는 아무 시점에나 개입 가능
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { formatPollMessage, formatSpeakMessage, generateTranscript, parseHandRaise, sanitizeSpokenResponse, sanitizeStreamingSpokenResponse } = require("./meeting-formatter.js");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

class MeetingBroker {
  /**
   * @param {object} config
   * @param {string} config.topic
   * @param {Array<{agentId: string, displayName: string, role: string}>} config.participants
   * @param {import('./openclaw-gateway.js').OpenClawGateway} config.gateway
   * @param {string} config.sessionKeyPrefix
   * @param {string} config.meetingId
   * @param {object} [config.quota]
   * @param {object} callbacks
   * @param {() => void} [callbacks.onPollStart]
   * @param {(raises: Array, passes: Array) => void} [callbacks.onPollResult]
   * @param {(agent: object) => void} [callbacks.onTurnStart]
   * @param {(agentId: string, chunk: string) => void} [callbacks.onTurnChunk]
   * @param {(agentId: string, fullResponse: string) => void} [callbacks.onTurnEnd]
   * @param {(transcript: string) => void} [callbacks.onMeetingEnd]
   * @param {(error: Error, agentId: string) => void} [callbacks.onError]
   */
  constructor(config, callbacks) {
    this.config = config;
    this.callbacks = callbacks || {};
    this.gateway = config.gateway; // OpenClawGateway instance

    this.turns = [];
    this.turnCounts = new Map();
    this.consecutivePasses = 0;
    this.lastSpoke = new Map();
    this.running = false;
    this.userMessageQueue = [];

    // Mode state machine
    this.mode = config.settings?.initialMode || "auto"; // "auto" | "manual" | "directed"
    this.hybridMode = config.settings?.hybridMode || false;
    this.hybridAutoResumeMs = config.settings?.hybridAutoResumeMs || null;
    this.autoResumeTimer = null;

    // Command queue for thread-safe mode changes
    this.commandQueue = [];

    // Session key for abort support
    this._currentSessionKey = null;
    this._currentAgentId = null;

    // Resolve for manual mode waiting
    this._waitResolve = null;

    this.quota = {
      maxTurnsPerAgent: config.quota?.maxTurnsPerAgent ?? 20,
      maxTotalTurns: config.quota?.maxTotalTurns ?? 50,
      cooldownMs: config.quota?.cooldownMs ?? 1000,
      turnTimeoutMs: config.quota?.turnTimeoutMs ?? 180000,
      pollTimeoutMs: config.quota?.pollTimeoutMs ?? 60000,
      maxConsecutivePasses: config.quota?.maxConsecutivePasses ?? 2,
    };
  }

  async run() {
    this.running = true;
    this._startTime = Date.now();

    try {
    while (this.running && !this.isFinished()) {
      // 1. Drain command queue
      const { directNpcId } = this._drainCommands();

      // 2. Process queued user messages
      while (this.userMessageQueue.length > 0) {
        const { userName, content } = this.userMessageQueue.shift();
        this.addTurn("user", userName, content);
        this.consecutivePasses = 0;
      }

      // 3. Handle directed speak (from any mode)
      if (directNpcId) {
        const agent = this.config.participants.find(p => p.agentId === directNpcId);
        if (agent) {
          if (this.callbacks.onTurnStart) this.callbacks.onTurnStart(agent);
          const response = await this._speakWithAbort(agent);
          if (response) {
            this.addTurn(agent.agentId, agent.displayName, response);
            if (this.callbacks.onTurnEnd) this.callbacks.onTurnEnd(agent.agentId, response);
          }
        }
        if (this.mode !== "auto") {
          if (this.callbacks.onWaitingInput) this.callbacks.onWaitingInput(null);
          await this._waitForInput();
        } else {
          await sleep(this.quota.cooldownMs);
        }
        continue;
      }

      // 4. Mode-specific behavior
      if (this.mode === "auto") {
        if (this.callbacks.onPollStart) this.callbacks.onPollStart();
        const { raises, passes } = await this.pollAgents();
        if (this.callbacks.onPollResult) this.callbacks.onPollResult(raises, passes);

        if (raises.length === 0) {
          this.consecutivePasses++;
          if (this.consecutivePasses >= this.quota.maxConsecutivePasses) break;
          await sleep(this.quota.cooldownMs);
          continue;
        }
        this.consecutivePasses = 0;

        const speaker = this.selectSpeaker(raises);
        if (!speaker) continue;

        if (this.callbacks.onTurnStart) this.callbacks.onTurnStart(speaker.agent);
        const response = await this._speakWithAbort(speaker.agent);
        if (response) {
          this.addTurn(speaker.agent.agentId, speaker.agent.displayName, response);
          if (this.callbacks.onTurnEnd) this.callbacks.onTurnEnd(speaker.agent.agentId, response);
        }
        await sleep(this.quota.cooldownMs);

      } else if (this.mode === "manual") {
        if (this.callbacks.onPollStart) this.callbacks.onPollStart();
        const { raises, passes } = await this.pollAgents();
        if (this.callbacks.onPollResult) this.callbacks.onPollResult(raises, passes);

        if (raises.length === 0) {
          this.consecutivePasses++;
          if (this.consecutivePasses >= this.quota.maxConsecutivePasses) break;
        } else {
          this.consecutivePasses = 0;
          const speaker = this.selectSpeaker(raises);
          if (speaker) {
            if (this.callbacks.onTurnStart) this.callbacks.onTurnStart(speaker.agent);
            const response = await this._speakWithAbort(speaker.agent);
            if (response) {
              this.addTurn(speaker.agent.agentId, speaker.agent.displayName, response);
              if (this.callbacks.onTurnEnd) this.callbacks.onTurnEnd(speaker.agent.agentId, response);
            }
          }
        }

        if (this.callbacks.onWaitingInput) this.callbacks.onWaitingInput({ raises: [], passes: [] });
        await this._waitForInput();

        if (this.hybridMode && this.hybridAutoResumeMs && this.mode === "manual") {
          this.autoResumeTimer = setTimeout(() => {
            this.autoResumeTimer = null;
            this.setMode("auto");
          }, this.hybridAutoResumeMs);
        }

      } else {
        // directed mode: wait for directSpeak command
        if (this.callbacks.onWaitingInput) this.callbacks.onWaitingInput(null);
        await this._waitForInput();
      }
    }

    } catch (err) {
      console.error(`[MeetingBroker] run() crashed:`, err?.message || err);
    } finally {
      this.running = false;
      if (this.autoResumeTimer) {
        clearTimeout(this.autoResumeTimer);
        this.autoResumeTimer = null;
      }
      const transcript = generateTranscript(this.config.topic, this.turns, this.config.participants);
      const durationSeconds = Math.floor((Date.now() - this._startTime) / 1000);
      if (this.callbacks.onMeetingEnd) {
        try { await this.callbacks.onMeetingEnd(transcript, durationSeconds); } catch (e) { console.error("[MeetingBroker] onMeetingEnd error:", e); }
      }
    }
  }

  /**
   * Queue a user message to be processed in the next cycle
   * @param {string} userName
   * @param {string} content
   */
  addUserMessage(userName, content) {
    this.userMessageQueue.push({ userName, content });
    this.consecutivePasses = 0;
  }

  stop() {
    this.running = false;
    if (this.autoResumeTimer) {
      clearTimeout(this.autoResumeTimer);
      this.autoResumeTimer = null;
    }
    this.abortCurrentTurn();
    if (this._waitResolve) {
      this._waitResolve();
      this._waitResolve = null;
    }
  }

  isRunning() {
    return this.running;
  }

  setMode(mode) {
    if (!["auto", "manual", "directed"].includes(mode)) return;
    this.commandQueue.push({ type: "setMode", mode });
    this.abortCurrentTurn();
    if (this.autoResumeTimer) {
      clearTimeout(this.autoResumeTimer);
      this.autoResumeTimer = null;
    }
    if (this._waitResolve) {
      this._waitResolve();
      this._waitResolve = null;
    }
  }

  nextTurn() {
    if (this.mode !== "manual") return;
    this.commandQueue.push({ type: "nextTurn" });
    if (this._waitResolve) {
      this._waitResolve();
      this._waitResolve = null;
    }
  }

  directSpeak(npcId) {
    this.commandQueue.push({ type: "directSpeak", npcId });
    this.abortCurrentTurn();
    if (this.hybridMode && this.mode === "auto") {
      this.mode = "manual";
      if (this.callbacks.onModeChanged) this.callbacks.onModeChanged("manual", "system");
    }
    if (this._waitResolve) {
      this._waitResolve();
      this._waitResolve = null;
    }
  }

  abortCurrentTurn() {
    if (this._currentSessionKey && this._currentAgentId) {
      this.gateway.chatAbort(this._currentAgentId, this._currentSessionKey).catch(() => {});
    }
  }

  _waitForInput() {
    return new Promise((resolve) => { this._waitResolve = resolve; });
  }

  _drainCommands() {
    let directNpcId = null;
    let modeChanged = false;
    while (this.commandQueue.length > 0) {
      const cmd = this.commandQueue.shift();
      if (cmd.type === "setMode") {
        this.mode = cmd.mode;
        modeChanged = true;
      } else if (cmd.type === "directSpeak") {
        directNpcId = cmd.npcId;
        if (this.autoResumeTimer) {
          clearTimeout(this.autoResumeTimer);
          this.autoResumeTimer = null;
        }
      }
    }
    if (modeChanged && this.callbacks.onModeChanged) {
      this.callbacks.onModeChanged(this.mode, "user");
    }
    return { directNpcId };
  }

  /**
   * Poll all agents in parallel — collect SPEAK/PASS responses
   * @returns {Promise<{ raises: Array<{agent: object, reason: string}>, passes: string[] }>}
   */
  async pollAgents() {
    const agents = this.config.participants.filter(
      (p) => this.getRemainingTurns(p.agentId) > 0,
    );
    if (agents.length === 0) return { raises: [], passes: [] };

    const currentTurn = this.turns.length;
    const maxTurns = this.quota.maxTotalTurns;

    const recentTurns = this.turns.slice(-3);

    // Limit concurrency to avoid overwhelming Claude Code gateway (N parallel processes crash).
    const CONCURRENCY = 2;
    const POLL_TIMEOUT = this.quota.pollTimeoutMs;
    const results = [];
    console.log(`[MeetingBroker] pollAgents → ${agents.length} agents, concurrency=${CONCURRENCY}, timeout=${POLL_TIMEOUT}ms`);
    for (let i = 0; i < agents.length; i += CONCURRENCY) {
      const batch = agents.slice(i, i + CONCURRENCY);
      const batchStart = Date.now();
      const batchResults = await Promise.allSettled(
        batch.map(async (agent) => {
          const remaining = this.getRemainingTurns(agent.agentId);
          const pollMsg = formatPollMessage(
            this.config.topic,
            recentTurns,
            agent,
            currentTurn,
            maxTurns,
            remaining,
            agent.passPolicy,
          );
          const sessionKey = `${this.config.sessionKeyPrefix}-${agent.agentId}-poll-${this.config.meetingId}`;
          let pollTimer;
          const timeoutPromise = new Promise((_, reject) => {
            pollTimer = setTimeout(() => {
              this.gateway.chatAbort?.(agent.agentId, sessionKey);
              reject(new Error(`poll-timeout:${agent.agentId}`));
            }, POLL_TIMEOUT);
          });
          try {
            const resp = await Promise.race([
              this.gateway.chatSend(agent.agentId, sessionKey, pollMsg, () => {}),
              timeoutPromise,
            ]);
            clearTimeout(pollTimer);
            return { agent, text: resp };
          } catch (err) {
            clearTimeout(pollTimer);
            console.warn(`[MeetingBroker] poll failed for ${agent.agentId}: ${err?.message || err}`);
            throw err;
          }
        }),
      );
      console.log(`[MeetingBroker] batch ${i / CONCURRENCY + 1} done in ${Date.now() - batchStart}ms`);
      results.push(...batchResults);
    }

    const raises = [];
    const passes = [];

    for (const result of results) {
      if (result.status === "rejected") {
        // Skip failed agents — don't crash the meeting
        continue;
      }
      const { agent, text } = result.value;
      const parsed = parseHandRaise(text);

      if (parsed.wantsToSpeak) {
        raises.push({ agent, reason: parsed.reason });
      } else {
        passes.push(agent.agentId);
      }
    }

    return { raises, passes };
  }

  /**
   * Select speaker from raises — pick the agent who spoke longest ago (fairness)
   * @param {Array<{agent: object, reason: string}>} raises
   * @returns {{ agent: object, reason: string } | null}
   */
  selectSpeaker(raises) {
    if (raises.length === 0) return null;
    if (raises.length === 1) return raises[0];

    let selected = raises[0];
    let oldestTime = Infinity;

    for (const r of raises) {
      const lastTime = this.lastSpoke.get(r.agent.agentId) || 0;
      if (lastTime < oldestTime) {
        oldestTime = lastTime;
        selected = r;
      }
    }

    return selected;
  }

  /**
   * Grant floor to agent — stream response via OpenClaw gateway
   * @param {{ agentId: string, displayName: string, role: string }} agent
   * @returns {Promise<string|null>}
   */
  async grantFloor(agent) {
    const sessionKey = `${this.config.sessionKeyPrefix}-${agent.agentId}-meeting-${this.config.meetingId}`;
    const currentTurn = this.turns.length;
    const maxTurns = this.quota.maxTotalTurns;
    const remaining = this.getRemainingTurns(agent.agentId);

    const recentTurns = this.turns.slice(-10);
    const message = formatSpeakMessage(
      this.config.topic,
      this.config.participants,
      recentTurns,
      agent,
      currentTurn,
      maxTurns,
      remaining,
    );

    try {
      const response = await this.gateway.chatSend(
        agent.agentId,
        sessionKey,
        message,
        (chunk) => {
          if (this.callbacks.onTurnChunk) {
            this.callbacks.onTurnChunk(agent.agentId, chunk);
          }
        },
      );
      const sanitizedResponse = sanitizeSpokenResponse(response || "");
      return sanitizedResponse || null;
    } catch (err) {
      if (this.callbacks.onError) {
        this.callbacks.onError(err, agent.agentId);
      }
      return null;
    }
  }

  /**
   * Speak with abort support — wraps streaming via gateway chatSend/chatAbort
   * @param {{ agentId: string, displayName: string, role: string }} agent
   * @returns {Promise<string|null>}
   */
  async _speakWithAbort(agent) {
    const sessionKey = `${this.config.sessionKeyPrefix}-${agent.agentId}-meeting-${this.config.meetingId}`;
    this._currentSessionKey = sessionKey;
    this._currentAgentId = agent.agentId;
    const currentTurn = this.turns.length;
    const maxTurns = this.quota.maxTotalTurns;
    const remaining = this.getRemainingTurns(agent.agentId);

    const recentTurns = this.turns.slice(-10);
    const message = formatSpeakMessage(
      this.config.topic,
      this.config.participants,
      recentTurns,
      agent,
      currentTurn,
      maxTurns,
      remaining,
    );

    let rawText = "";
    let emittedText = "";
    let turnTimer;
    const turnTimeoutPromise = new Promise((_, reject) => {
      turnTimer = setTimeout(() => {
        this.gateway.chatAbort?.(agent.agentId, sessionKey);
        reject(new Error(`turn-timeout:${agent.agentId}`));
      }, this.quota.turnTimeoutMs);
    });
    console.log(`[MeetingBroker] _speakWithAbort start → ${agent.agentId} (${agent.displayName})`);
    const started = Date.now();
    try {
      const response = await Promise.race([
        this.gateway.chatSend(
          agent.agentId,
          sessionKey,
          message,
          (chunk) => {
            rawText += chunk;
            const sanitizedText = sanitizeStreamingSpokenResponse(rawText);
            const delta = sanitizedText.slice(emittedText.length);
            emittedText = sanitizedText;
            if (delta && this.callbacks.onTurnChunk) {
              this.callbacks.onTurnChunk(agent.agentId, delta);
            }
          },
        ),
        turnTimeoutPromise,
      ]);
      clearTimeout(turnTimer);
      this._currentSessionKey = null;
      this._currentAgentId = null;
      console.log(`[MeetingBroker] _speakWithAbort done → ${agent.agentId} in ${Date.now() - started}ms, len=${(response || rawText).length}`);
      const sanitizedResponse = sanitizeSpokenResponse(response || rawText);
      return sanitizedResponse || null;
    } catch (err) {
      clearTimeout(turnTimer);
      this._currentSessionKey = null;
      this._currentAgentId = null;
      console.warn(`[MeetingBroker] _speakWithAbort failed → ${agent.agentId}: ${err?.message || err}`);
      if (this.callbacks.onError) this.callbacks.onError(err, agent.agentId);
      // Return a fallback so the meeting doesn't silently stall on repeated failures.
      return sanitizeSpokenResponse(rawText) || null;
    }
  }

  /**
   * Record a turn
   * @param {string} speakerId
   * @param {string} displayName
   * @param {string} content
   */
  addTurn(speakerId, displayName, content) {
    const turn = {
      seq: this.turns.length + 1,
      speakerId,
      displayName,
      content,
      timestamp: Date.now(),
    };
    this.turns.push(turn);
    const count = (this.turnCounts.get(speakerId) || 0) + 1;
    this.turnCounts.set(speakerId, count);
    this.lastSpoke.set(speakerId, Date.now());
  }

  /**
   * Check if the meeting has reached its end conditions
   * @returns {boolean}
   */
  isFinished() {
    return (
      this.turns.length >= this.quota.maxTotalTurns ||
      this.consecutivePasses >= this.quota.maxConsecutivePasses
    );
  }

  /**
   * Get remaining turns for an agent
   * @param {string} agentId
   * @returns {number}
   */
  getRemainingTurns(agentId) {
    return Math.max(0, this.quota.maxTurnsPerAgent - (this.turnCounts.get(agentId) || 0));
  }
}

module.exports = { MeetingBroker };
