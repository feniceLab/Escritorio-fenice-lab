"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Eye, EyeOff, Loader2, Save, XCircle } from "lucide-react";

type MetaConfig = {
  id?: string;
  accessToken?: string;
  fbPageId?: string | null;
  igUserId?: string | null;
  notifChatIds?: string[];
  updatedAt?: string;
};

type Props = {
  clientId: string;
  userId: string;
};

type TokenStatus = "idle" | "validating" | "valid" | "invalid" | "unconfigured";

export default function MetaConfigForm({ clientId, userId }: Props) {
  const [config, setConfig] = useState<MetaConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [accessToken, setAccessToken] = useState("");
  const [fbPageId, setFbPageId] = useState("");
  const [igUserId, setIgUserId] = useState("");
  const [chatIdsRaw, setChatIdsRaw] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>("idle");

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/meta-config`, {
        headers: { "x-user-id": userId },
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Erro ao carregar config");
      if (data.config) {
        setConfig(data.config);
        setFbPageId(data.config.fbPageId ?? "");
        setIgUserId(data.config.igUserId ?? "");
        setChatIdsRaw((data.config.notifChatIds ?? []).join(", "));
        setTokenStatus("idle");
      } else {
        setTokenStatus("unconfigured");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [clientId, userId]);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  async function validateToken() {
    if (!accessToken.trim()) {
      setError("Cole um token antes de validar");
      return;
    }
    setTokenStatus("validating");
    setError("");
    try {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/me?access_token=${encodeURIComponent(accessToken.trim())}`,
        { cache: "no-store" },
      );
      const data = await res.json().catch(() => ({}));
      setTokenStatus(res.ok && data.id ? "valid" : "invalid");
    } catch {
      setTokenStatus("invalid");
    }
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const body: Record<string, unknown> = {
        fbPageId: fbPageId.trim() || null,
        igUserId: igUserId.trim() || null,
        notifChatIds: chatIdsRaw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      if (accessToken.trim()) body.accessToken = accessToken.trim();

      const res = await fetch(`/api/admin/clients/${clientId}/meta-config`, {
        method: config ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Erro ao salvar");
      setSuccess("Configuração salva com sucesso");
      setAccessToken("");
      await loadConfig();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  function tokenStatusBadge() {
    if (tokenStatus === "unconfigured")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-surface-raised px-2 py-0.5 text-xs text-text-muted">
          Não configurado
        </span>
      );
    if (tokenStatus === "validating")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-surface-raised px-2 py-0.5 text-xs text-text-muted">
          <Loader2 className="h-3 w-3 animate-spin" /> Validando...
        </span>
      );
    if (tokenStatus === "valid")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-success/20 px-2 py-0.5 text-xs text-success">
          <CheckCircle2 className="h-3 w-3" /> Token válido
        </span>
      );
    if (tokenStatus === "invalid")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-danger/20 px-2 py-0.5 text-xs text-danger">
          <XCircle className="h-3 w-3" /> Token inválido
        </span>
      );
    if (config) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-surface-raised px-2 py-0.5 text-xs text-text-muted">
          Configurado
        </span>
      );
    }
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando configuração...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h3 className="text-base font-semibold">Status do Token</h3>
        {tokenStatusBadge()}
      </div>

      {config?.updatedAt && (
        <p className="text-xs text-text-muted">
          Última atualização: {new Date(config.updatedAt).toLocaleString("pt-BR")}
        </p>
      )}

      {error && (
        <div className="rounded-lg border border-danger/40 bg-surface px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-success/40 bg-surface px-4 py-3 text-sm text-success">
          {success}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">
            Access Token
            {config && (
              <span className="ml-2 text-xs font-normal text-text-muted">
                (deixe em branco para manter o atual)
              </span>
            )}
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showToken ? "text" : "password"}
                value={accessToken}
                onChange={(e) => {
                  setAccessToken(e.target.value);
                  setTokenStatus("idle");
                }}
                placeholder="Cole o token Meta aqui"
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <button
              type="button"
              onClick={() => void validateToken()}
              disabled={tokenStatus === "validating" || !accessToken.trim()}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm hover:bg-surface-raised disabled:opacity-50"
            >
              {tokenStatus === "validating" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3 w-3" />
              )}
              Validar Token
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">
            Facebook Page ID
          </label>
          <input
            type="text"
            value={fbPageId}
            onChange={(e) => setFbPageId(e.target.value)}
            placeholder="ex: 123456789"
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">
            Instagram User ID
          </label>
          <input
            type="text"
            value={igUserId}
            onChange={(e) => setIgUserId(e.target.value)}
            placeholder="ex: 987654321"
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">
            Chat IDs do Telegram (separados por vírgula)
          </label>
          <input
            type="text"
            value={chatIdsRaw}
            onChange={(e) => setChatIdsRaw(e.target.value)}
            placeholder="ex: -1001234567890, -1009876543210"
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <p className="mt-1 text-xs text-text-muted">
            IDs dos chats que receberão notificações de publicação
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Salvar
        </button>
      </div>
    </div>
  );
}
