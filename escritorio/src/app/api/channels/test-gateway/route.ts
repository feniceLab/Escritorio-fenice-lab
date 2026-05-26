import { NextRequest, NextResponse } from "next/server";
import {
  buildGatewayErrorPayload,
  getGatewayErrorStatus,
  testGatewayConnection,
} from "@/lib/openclaw-gateway.js";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { testClaudeCodeConnection, detectClaudeCodeCli } = require("@/lib/claude-code-gateway.js") as {
  testClaudeCodeConnection: (workspacePath?: string) => Promise<{ version: string; response: string; ok: boolean }>;
  detectClaudeCodeCli: () => string | null;
};
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { testCodexConnection, detectCodexCli, getCodexLoginStatus } = require("@/lib/codex-gateway.js") as {
  testCodexConnection: (workspacePath?: string) => Promise<{ version: string; response: string; ok: boolean }>;
  detectCodexCli: () => string | null;
  getCodexLoginStatus: () => { ok: boolean; message: string };
};

function getUserId(req: NextRequest): string | null {
  return req.headers.get("x-user-id");
}

// POST /api/channels/test-gateway — validate gateway config with a real gateway round-trip
export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ errorCode: "unauthorized", error: "unauthorized" }, { status: 401 });

  let gatewayUrl: string | undefined;
  try {
    const body = await req.json();
    const { url, token, provider, workspacePath } = body;
    gatewayUrl = url;

    // ── Claude Code provider ──
    if (provider === "claude-code") {
      try {
        const version = detectClaudeCodeCli();
        if (!version) {
          return NextResponse.json({
            ok: false,
            agents: [],
            errorCode: "claude_code_not_found",
            error: "Claude Code CLI not found. Install with: npm install -g @anthropic-ai/claude-code",
          });
        }

        const result = await testClaudeCodeConnection(workspacePath || undefined);
        return NextResponse.json({
          ok: true,
          agents: [{ id: "claude-code", name: "Claude Code", status: "ready" }],
          messageCode: "gateway_connection_succeeded",
          message: `Claude Code v${result.version} connected successfully.`,
          version: result.version,
        });
      } catch (err) {
        console.error("Claude Code test failed:", err);
        return NextResponse.json({
          ok: false,
          agents: [],
          errorCode: "claude_code_error",
          error: err instanceof Error ? err.message : "Claude Code connection failed",
        }, { status: 502 });
      }
    }

    if (provider === "codex") {
      try {
        const version = detectCodexCli();
        if (!version) {
          return NextResponse.json({
            ok: false,
            agents: [],
            errorCode: "codex_not_found",
            error: "Codex CLI not found. Install Codex and ensure `codex` is in PATH.",
          });
        }

        const login = getCodexLoginStatus();
        if (!login.ok) {
          return NextResponse.json({
            ok: false,
            agents: [],
            errorCode: "codex_login_required",
            error: "Codex CLI is not logged in. Run `codex login` first.",
          }, { status: 401 });
        }

        const result = await testCodexConnection(workspacePath || undefined);
        return NextResponse.json({
          ok: true,
          agents: [],
          messageCode: "gateway_connection_succeeded",
          message: `Codex v${result.version} connected successfully.`,
          version: result.version,
        });
      } catch (err) {
        console.error("Codex test failed:", err);
        return NextResponse.json({
          ok: false,
          agents: [],
          errorCode: "codex_error",
          error: err instanceof Error ? err.message : "Codex connection failed",
        }, { status: 502 });
      }
    }

    // ── OpenClaw provider (default) ──
    if (!url) {
      return NextResponse.json({
        ok: false,
        agents: [],
        errorCode: "gateway_url_required",
        error: "Gateway URL is required",
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json({
        ok: false,
        agents: [],
        errorCode: "invalid_gateway_url",
        error: "Invalid gateway URL format",
      });
    }

    const result = await testGatewayConnection(url, token);

    return NextResponse.json({
      ok: true,
      agents: Array.isArray(result.agents) ? result.agents : [],
      messageCode: "gateway_connection_succeeded",
      message: "Gateway connection succeeded.",
    });
  } catch (err) {
    const status = getGatewayErrorStatus(err, 502);
    const payload = buildGatewayErrorPayload(err, {
      ok: false,
      fallbackErrorCode: "failed_to_reach_test_endpoint",
      fallbackError: "Unknown error",
    });

    const isPairingError = status === 409
      || (err && typeof err === "object" && "pairingRequired" in err && (err as { pairingRequired: boolean }).pairingRequired);

    if (isPairingError) {
      console.info("[gateway] Pairing required for gateway — url:", gatewayUrl);
      console.info("[gateway]   errorCode:", (payload as { errorCode?: string }).errorCode);
      console.info("[gateway]   details:", JSON.stringify((payload as { details?: unknown }).details ?? null));
    } else {
      console.error("Gateway validation failed:", err);
    }

    return NextResponse.json(
      { agents: [], ...payload },
      { status },
    );
  }
}
