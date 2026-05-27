"use client";

import { useEffect, useMemo, useState } from "react";
import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Edit3,
  Filter,
  Plus,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react";
import PieceFormModal, { type ContentPiece } from "@/components/content/PieceFormModal";

type Client = {
  id: string;
  name: string;
  status: string;
  summary?: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  in_review: "Em revisão",
  approved: "Aprovado",
  scheduled: "Agendado",
  published: "Publicado",
  rejected: "Rejeitado",
  archived: "Arquivado",
};

const STATUS_ORDER = [
  "draft",
  "in_review",
  "approved",
  "scheduled",
  "published",
  "rejected",
  "archived",
];

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  both: "Ambos",
};

export default function ClientContentPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = use(params);
  const [client, setClient] = useState<Client | null>(null);
  const [pieces, setPieces] = useState<ContentPiece[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [platformFilter, setPlatformFilter] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ContentPiece | null>(null);

  async function loadClient() {
    try {
      const r = await fetch(`/api/office/clients`, { cache: "no-store" });
      const data = await r.json().catch(() => ({}));
      const list: Client[] = Array.isArray(data.clients) ? data.clients : [];
      const found = list.find((c) => c.id === clientId) ?? null;
      setClient(found);
    } catch {
      // ignore
    }
  }

  async function loadPieces() {
    setError("");
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (platformFilter) params.set("platform", platformFilter);
      const r = await fetch(
        `/api/clients/${clientId}/content?${params.toString()}`,
        { cache: "no-store" },
      );
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Falha ao carregar peças");
      setPieces(Array.isArray(data.pieces) ? data.pieces : []);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadClient();
  }, [clientId]);

  useEffect(() => {
    void loadPieces();
  }, [clientId, statusFilter, platformFilter]);

  const grouped = useMemo(() => {
    const map: Record<string, ContentPiece[]> = {};
    for (const status of STATUS_ORDER) map[status] = [];
    for (const p of pieces) {
      const key = STATUS_ORDER.includes(p.status) ? p.status : "draft";
      map[key].push(p);
    }
    return map;
  }, [pieces]);

  async function transition(piece: ContentPiece, to: string, note?: string) {
    setBusy(`transition-${piece.id}`);
    setError("");
    try {
      const r = await fetch(
        `/api/clients/${clientId}/content/${piece.id}/transition`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to, note }),
        },
      );
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Transição falhou");
      await loadPieces();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setBusy("");
    }
  }

  async function deletePiece(piece: ContentPiece) {
    if (!confirm(`Excluir a peça "${piece.title}"?`)) return;
    setBusy(`delete-${piece.id}`);
    setError("");
    try {
      const r = await fetch(`/api/clients/${clientId}/content/${piece.id}`, {
        method: "DELETE",
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Falha ao excluir");
      await loadPieces();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setBusy("");
    }
  }

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(piece: ContentPiece) {
    setEditing(piece);
    setModalOpen(true);
  }

  async function handleSaved() {
    setModalOpen(false);
    setEditing(null);
    await loadPieces();
  }

  return (
    <div className="theme-web min-h-screen bg-bg px-8 py-8 text-text">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/content"
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm hover:bg-surface-raised"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{client?.name ?? "Cliente"}</h1>
              <p className="text-sm text-text-muted">Gestão de peças de conteúdo</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void loadPieces()}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-surface-raised"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Nova peça
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-lg border border-danger/40 bg-surface px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        <section className="mb-6 rounded-xl border border-border bg-surface p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex items-center gap-2 text-text-muted">
              <Filter className="h-4 w-4" />
              <span className="text-xs uppercase">Filtros</span>
            </div>
            <div>
              <label className="block text-xs text-text-muted">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="mt-1 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm"
              >
                <option value="">Todos</option>
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-muted">Plataforma</label>
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="mt-1 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm"
              >
                <option value="">Todas</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="both">Ambos</option>
              </select>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="py-6 text-center text-text-muted">Carregando...</div>
        ) : pieces.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface py-12 text-center text-text-muted">
            Nenhuma peça encontrada com os filtros atuais.
          </div>
        ) : (
          <div className="space-y-6">
            {STATUS_ORDER.filter((s) => grouped[s].length > 0).map((status) => (
              <section key={status} className="rounded-xl border border-border bg-surface p-5">
                <header className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    {STATUS_LABELS[status]}{" "}
                    <span className="ml-2 text-sm text-text-muted">
                      ({grouped[status].length})
                    </span>
                  </h2>
                </header>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {grouped[status].map((piece) => (
                    <PieceCard
                      key={piece.id}
                      piece={piece}
                      busy={busy}
                      onEdit={() => openEdit(piece)}
                      onTransition={(to, note) => void transition(piece, to, note)}
                      onDelete={() => void deletePiece(piece)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <PieceFormModal
          clientId={clientId}
          piece={editing}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

function PieceCard({
  piece,
  busy,
  onEdit,
  onTransition,
  onDelete,
}: {
  piece: ContentPiece;
  busy: string;
  onEdit: () => void;
  onTransition: (to: string, note?: string) => void;
  onDelete: () => void;
}) {
  const isBusy = busy === `transition-${piece.id}` || busy === `delete-${piece.id}`;

  const nextActions = nextActionsFor(piece.status);

  return (
    <div className="rounded-lg border border-border bg-bg p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="font-medium leading-snug">{piece.title}</h3>
        <span className="shrink-0 rounded bg-surface-raised px-2 py-0.5 text-[10px] uppercase">
          {PLATFORM_LABELS[piece.platform] ?? piece.platform}
        </span>
      </div>
      {piece.caption && (
        <p className="mb-3 line-clamp-2 text-sm text-text-muted">{piece.caption}</p>
      )}
      {piece.mediaUrls && piece.mediaUrls.length > 0 && (
        <div className="mb-3 flex gap-1 overflow-hidden">
          {piece.mediaUrls.slice(0, 3).map((url, i) => (
            <div
              key={i}
              className="h-12 w-12 shrink-0 overflow-hidden rounded border border-border bg-surface"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
          {piece.mediaUrls.length > 3 && (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded border border-border bg-surface text-xs text-text-muted">
              +{piece.mediaUrls.length - 3}
            </div>
          )}
        </div>
      )}
      {piece.scheduledAt && (
        <div className="mb-3 flex items-center gap-1 text-xs text-text-muted">
          <Calendar className="h-3 w-3" />
          {new Date(piece.scheduledAt).toLocaleString("pt-BR")}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onEdit}
          disabled={isBusy}
          className="inline-flex items-center gap-1 rounded border border-border bg-surface px-2 py-1 text-xs hover:bg-surface-raised disabled:opacity-50"
        >
          <Edit3 className="h-3 w-3" />
          Editar
        </button>
        {nextActions.map((action) => (
          <button
            key={action.to}
            type="button"
            onClick={() => {
              if (action.needsNote) {
                const note = prompt(`Observação para ${action.label}:`) ?? "";
                onTransition(action.to, note);
              } else {
                onTransition(action.to);
              }
            }}
            disabled={isBusy}
            className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs ${action.className} disabled:opacity-50`}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
        {piece.status !== "published" && (
          <button
            type="button"
            onClick={onDelete}
            disabled={isBusy}
            className="ml-auto inline-flex items-center gap-1 rounded border border-danger/40 bg-surface px-2 py-1 text-xs text-danger hover:bg-danger/10 disabled:opacity-50"
          >
            <Trash2 className="h-3 w-3" />
            Excluir
          </button>
        )}
      </div>
    </div>
  );
}

function nextActionsFor(status: string): Array<{
  to: string;
  label: string;
  icon: React.ReactNode;
  className: string;
  needsNote?: boolean;
}> {
  switch (status) {
    case "draft":
      return [
        {
          to: "in_review",
          label: "Enviar para revisão",
          icon: <CheckCircle2 className="h-3 w-3" />,
          className: "bg-primary text-primary-foreground hover:opacity-90",
        },
      ];
    case "in_review":
      return [
        {
          to: "approved",
          label: "Aprovar",
          icon: <CheckCircle2 className="h-3 w-3" />,
          className: "bg-primary text-primary-foreground hover:opacity-90",
        },
        {
          to: "rejected",
          label: "Rejeitar",
          icon: <XCircle className="h-3 w-3" />,
          className: "border border-border bg-surface hover:bg-surface-raised",
          needsNote: true,
        },
      ];
    case "approved":
      return [
        {
          to: "scheduled",
          label: "Agendar",
          icon: <Calendar className="h-3 w-3" />,
          className: "bg-primary text-primary-foreground hover:opacity-90",
        },
      ];
    case "scheduled":
      return [
        {
          to: "published",
          label: "Marcar publicado",
          icon: <CheckCircle2 className="h-3 w-3" />,
          className: "bg-primary text-primary-foreground hover:opacity-90",
        },
      ];
    case "published":
      return [
        {
          to: "archived",
          label: "Arquivar",
          icon: <XCircle className="h-3 w-3" />,
          className: "border border-border bg-surface hover:bg-surface-raised",
        },
      ];
    case "rejected":
      return [
        {
          to: "draft",
          label: "Reabrir",
          icon: <Edit3 className="h-3 w-3" />,
          className: "border border-border bg-surface hover:bg-surface-raised",
        },
      ];
    case "archived":
      return [
        {
          to: "draft",
          label: "Reabrir",
          icon: <Edit3 className="h-3 w-3" />,
          className: "border border-border bg-surface hover:bg-surface-raised",
        },
      ];
    default:
      return [];
  }
}
