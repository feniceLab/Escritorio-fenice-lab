/**
 * Validadores de credenciais para provedores de IA (MVP "cola token/key").
 *
 * - anthropic-max: espera um token de sessão oriundo do Claude Code CLI
 *   (~/.claude/auth.json). Validamos chamando /v1/models com header
 *   "x-api-key" (compatível com ambas API Keys e Session tokens).
 * - openai: espera uma API Key. Validamos via GET /v1/models.
 */

export type AiAuthProvider = "anthropic-max" | "openai";

export interface ValidationResult {
  ok: boolean;
  label?: string;
  error?: string;
}

const ANTHROPIC_API = "https://api.anthropic.com/v1/models";
const OPENAI_API = "https://api.openai.com/v1/models";

export async function validateAnthropicCredential(token: string): Promise<ValidationResult> {
  const trimmed = token.trim();
  if (!trimmed) return { ok: false, error: "empty_token" };
  try {
    const res = await fetch(ANTHROPIC_API, {
      headers: {
        "x-api-key": trimmed,
        "anthropic-version": "2023-06-01",
      },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `anthropic_${res.status}: ${body.slice(0, 200)}` };
    }
    const data = await res.json().catch(() => ({})) as { data?: Array<{ id?: string }> };
    const firstModel = data?.data?.[0]?.id;
    return { ok: true, label: firstModel ? `Max · ${firstModel}` : "Claude Max" };
  } catch (err) {
    return { ok: false, error: `network_${(err as Error).message}` };
  }
}

export async function validateOpenAiCredential(apiKey: string): Promise<ValidationResult> {
  const trimmed = apiKey.trim();
  if (!trimmed) return { ok: false, error: "empty_key" };
  if (!trimmed.startsWith("sk-")) return { ok: false, error: "invalid_format" };
  try {
    const res = await fetch(OPENAI_API, {
      headers: { authorization: `Bearer ${trimmed}` },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `openai_${res.status}: ${body.slice(0, 200)}` };
    }
    const data = await res.json().catch(() => ({})) as { data?: Array<{ id?: string }> };
    const sample = data?.data?.find((m) => m.id?.startsWith("gpt-4"))?.id || data?.data?.[0]?.id;
    return { ok: true, label: sample ? `OpenAI · ${sample}` : "OpenAI" };
  } catch (err) {
    return { ok: false, error: `network_${(err as Error).message}` };
  }
}

export function providerBaseUrl(provider: AiAuthProvider): string {
  if (provider === "anthropic-max") return "https://api.anthropic.com";
  return "https://api.openai.com/v1";
}

export function providerDisplayName(provider: AiAuthProvider): string {
  if (provider === "anthropic-max") return "Claude Max";
  return "OpenAI";
}
