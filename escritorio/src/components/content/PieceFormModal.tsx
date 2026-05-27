"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";

export type ContentPiece = {
  id: string;
  clientId: string;
  title: string;
  caption: string | null;
  mediaUrls: string[];
  platform: string;
  status: string;
  scheduledAt: string | null;
  publishedAt?: string | null;
  npcId?: string | null;
  revisionNote?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type Props = {
  clientId: string;
  piece: ContentPiece | null;
  onClose: () => void;
  onSaved: () => void;
};

const PLATFORMS = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "both", label: "Ambos" },
];

export default function PieceFormModal({
  clientId,
  piece,
  onClose,
  onSaved,
}: Props) {
  const [title, setTitle] = useState(piece?.title ?? "");
  const [caption, setCaption] = useState(piece?.caption ?? "");
  const [platform, setPlatform] = useState(piece?.platform ?? "both");
  const [mediaUrls, setMediaUrls] = useState<string[]>(piece?.mediaUrls ?? []);
  const [scheduledAt, setScheduledAt] = useState(
    piece?.scheduledAt ? toLocalDatetimeInput(piece.scheduledAt) : "",
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setError("");
    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("file", file);
        const r = await fetch(`/api/clients/${clientId}/media/upload`, {
          method: "POST",
          body: form,
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          throw new Error(data.error || `Upload falhou para ${file.name}`);
        }
        newUrls.push(data.url);
      }
      setMediaUrls((prev) => [...prev, ...newUrls]);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeMedia(index: number) {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Título é obrigatório");
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: trimmedTitle,
        caption: caption.trim() || null,
        platform,
        mediaUrls,
      };
      if (scheduledAt) {
        const d = new Date(scheduledAt);
        if (!Number.isNaN(d.getTime())) {
          payload.scheduledAt = d.toISOString();
        }
      } else {
        payload.scheduledAt = null;
      }

      const url = piece
        ? `/api/clients/${clientId}/content/${piece.id}`
        : `/api/clients/${clientId}/content`;
      const method = piece ? "PATCH" : "POST";

      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        throw new Error(data.error || "Falha ao salvar");
      }
      onSaved();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-surface shadow-2xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface px-6 py-4">
          <h2 className="text-lg font-semibold">
            {piece ? "Editar peça" : "Nova peça de conteúdo"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-text-muted hover:bg-bg hover:text-text"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          {error && (
            <div className="rounded-lg border border-danger/40 bg-bg px-3 py-2 text-sm text-danger">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="piece-title" className="mb-1 block text-sm font-medium">
              Título <span className="text-danger">*</span>
            </label>
            <input
              id="piece-title"
              type="text"
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
              placeholder="Ex: Post de quarta - Promoção de inverno"
            />
          </div>

          <div>
            <label htmlFor="piece-caption" className="mb-1 block text-sm font-medium">
              Legenda
            </label>
            <textarea
              id="piece-caption"
              rows={5}
              value={caption ?? ""}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
              placeholder="Texto do post / caption"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="piece-platform" className="mb-1 block text-sm font-medium">
                Plataforma
              </label>
              <select
                id="piece-platform"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
              >
                {PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="piece-scheduled" className="mb-1 block text-sm font-medium">
                Agendar para
              </label>
              <input
                id="piece-scheduled"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Mídias</label>
            <div className="mb-3 flex flex-wrap gap-2">
              {mediaUrls.map((url, i) => (
                <div
                  key={`${url}-${i}`}
                  className="relative h-20 w-20 overflow-hidden rounded border border-border bg-bg"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeMedia(i)}
                    className="absolute right-0 top-0 rounded-bl bg-danger/80 p-0.5 text-white hover:bg-danger"
                    aria-label="Remover mídia"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {mediaUrls.length === 0 && (
                <p className="text-xs text-text-muted">Nenhuma mídia adicionada.</p>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/mp4,video/webm,video/quicktime"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
              id="piece-file-input"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2 text-sm hover:bg-surface-raised disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploading ? "Enviando..." : "Adicionar mídia"}
            </button>
            <p className="mt-1 text-xs text-text-muted">
              Imagens (JPG/PNG/WebP/GIF) ou vídeos (MP4/WebM/MOV). Máx. 25 MB cada.
            </p>
          </div>

          <footer className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-border bg-bg px-4 py-2 text-sm hover:bg-surface-raised disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {piece ? "Salvar alterações" : "Criar peça"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

function toLocalDatetimeInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
