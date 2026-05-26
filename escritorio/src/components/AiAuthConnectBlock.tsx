"use client";

import { useEffect, useState } from "react";

import { useT } from "@/lib/i18n";

type Provider = "anthropic-max" | "openai";

interface Connection {
  id: string;
  provider: Provider;
  displayName: string;
  lastValidatedAt: string | null;
  lastValidationStatus: string | null;
}

export default function AiAuthConnectBlock() {
  const t = useT();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  // Claude Max OAuth flow state
  const [anthropicStep, setAnthropicStep] = useState<"idle" | "awaiting-code">("idle");
  const [anthropicCode, setAnthropicCode] = useState("");
  const [anthropicSubmitting, setAnthropicSubmitting] = useState(false);
  const [anthropicError, setAnthropicError] = useState<string | null>(null);

  // OpenAI API key flow state
  const [openaiOpen, setOpenaiOpen] = useState(false);
  const [openaiKey, setOpenaiKey] = useState("");
  const [openaiSubmitting, setOpenaiSubmitting] = useState(false);
  const [openaiError, setOpenaiError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const res = await fetch("/api/ai-auth");
      const data = await res.json();
      setConnections(data.connections ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const connected = (p: Provider) => connections.find((c) => c.provider === p);

  const startAnthropicOAuth = async () => {
    setAnthropicError(null);
    try {
      const res = await fetch("/api/ai-auth/anthropic/start");
      const data = await res.json();
      if (!res.ok || !data.authorizeUrl) {
        setAnthropicError(data.errorCode || "failed_to_start");
        return;
      }
      window.open(data.authorizeUrl, "_blank", "noopener,noreferrer");
      setAnthropicStep("awaiting-code");
    } catch (err) {
      setAnthropicError((err as Error).message);
    }
  };

  const submitAnthropicCode = async () => {
    setAnthropicSubmitting(true);
    setAnthropicError(null);
    try {
      const res = await fetch("/api/ai-auth/anthropic/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: anthropicCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAnthropicError(data.detail || data.errorCode || "error");
        return;
      }
      setAnthropicCode("");
      setAnthropicStep("idle");
      await refresh();
    } catch (err) {
      setAnthropicError((err as Error).message);
    } finally {
      setAnthropicSubmitting(false);
    }
  };

  const submitOpenAi = async () => {
    setOpenaiSubmitting(true);
    setOpenaiError(null);
    try {
      const res = await fetch("/api/ai-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "openai", credential: openaiKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOpenaiError(data.detail || data.errorCode || "error");
        return;
      }
      setOpenaiKey("");
      setOpenaiOpen(false);
      await refresh();
    } catch (err) {
      setOpenaiError((err as Error).message);
    } finally {
      setOpenaiSubmitting(false);
    }
  };

  const disconnect = async (p: Provider) => {
    await fetch(`/api/ai-auth/${p}`, { method: "DELETE" });
    await refresh();
  };

  const anthropicConn = connected("anthropic-max");
  const openaiConn = connected("openai");

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-semibold text-gray-300">{t("aiAuth.sectionTitle")}</label>
        <p className="text-xs text-gray-500 mt-1">{t("aiAuth.sectionDescription")}</p>
      </div>

      {loading ? (
        <p className="text-xs text-gray-500">{t("common.loading")}</p>
      ) : (
        <>
          {/* Claude Max — OAuth PKCE */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Claude Max</p>
                {anthropicConn
                  ? <p className="text-xs text-green-400">✓ {t("aiAuth.connected")}: {anthropicConn.displayName}</p>
                  : <p className="text-xs text-gray-400">{t("aiAuth.anthropicOauthHint")}</p>}
              </div>
              {anthropicConn ? (
                <button
                  type="button"
                  onClick={() => disconnect("anthropic-max")}
                  className="px-3 py-1 text-xs rounded bg-red-700 hover:bg-red-600 text-white"
                >
                  {t("aiAuth.disconnect")}
                </button>
              ) : anthropicStep === "idle" ? (
                <button
                  type="button"
                  onClick={startAnthropicOAuth}
                  className="px-3 py-1 text-xs rounded bg-[#d97706] hover:bg-[#b45309] text-white"
                >
                  {t("aiAuth.signInWithClaudeMax")}
                </button>
              ) : null}
            </div>

            {!anthropicConn && anthropicStep === "awaiting-code" && (
              <div className="space-y-2 pt-2 border-t border-gray-700">
                <p className="text-xs text-gray-300">{t("aiAuth.oauthCodeInstructions")}</p>
                <input
                  type="text"
                  value={anthropicCode}
                  onChange={(e) => setAnthropicCode(e.target.value)}
                  placeholder={t("aiAuth.oauthCodePlaceholder")}
                  className="w-full px-2 py-1 bg-gray-900 border border-gray-600 rounded text-white text-xs focus:outline-none focus:border-indigo-500 font-mono"
                />
                {anthropicError && <p className="text-xs text-red-400">{anthropicError}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={anthropicSubmitting || !anthropicCode.trim()}
                    onClick={submitAnthropicCode}
                    className="px-3 py-1 text-xs rounded bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 text-white"
                  >
                    {anthropicSubmitting ? t("aiAuth.validating") : t("aiAuth.completeLogin")}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAnthropicStep("idle"); setAnthropicError(null); setAnthropicCode(""); }}
                    className="px-3 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-200"
                  >
                    {t("common.cancel")}
                  </button>
                </div>
              </div>
            )}

            {!anthropicConn && anthropicStep === "idle" && anthropicError && (
              <p className="text-xs text-red-400">{anthropicError}</p>
            )}
          </div>

          {/* OpenAI — API Key (OAuth ChatGPT não é oferecido publicamente) */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">OpenAI</p>
                {openaiConn
                  ? <p className="text-xs text-green-400">✓ {t("aiAuth.connected")}: {openaiConn.displayName}</p>
                  : <p className="text-xs text-gray-400">{t("aiAuth.openaiOauthUnavailable")}</p>}
              </div>
              {openaiConn ? (
                <button
                  type="button"
                  onClick={() => disconnect("openai")}
                  className="px-3 py-1 text-xs rounded bg-red-700 hover:bg-red-600 text-white"
                >
                  {t("aiAuth.disconnect")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { setOpenaiOpen(true); setOpenaiKey(""); setOpenaiError(null); }}
                  className="px-3 py-1 text-xs rounded bg-emerald-700 hover:bg-emerald-600 text-white"
                >
                  {t("aiAuth.connect")}
                </button>
              )}
            </div>
            {openaiOpen && !openaiConn && (
              <div className="space-y-2 pt-2 border-t border-gray-700">
                <input
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder={t("aiAuth.openaiPlaceholder")}
                  className="w-full px-2 py-1 bg-gray-900 border border-gray-600 rounded text-white text-xs focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-gray-500">{t("aiAuth.openaiHelp")}</p>
                {openaiError && <p className="text-xs text-red-400">{openaiError}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={openaiSubmitting || !openaiKey.trim()}
                    onClick={submitOpenAi}
                    className="px-3 py-1 text-xs rounded bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 text-white"
                  >
                    {openaiSubmitting ? t("aiAuth.validating") : t("aiAuth.save")}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setOpenaiOpen(false); setOpenaiError(null); }}
                    className="px-3 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-200"
                  >
                    {t("common.cancel")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
