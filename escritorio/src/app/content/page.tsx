"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, FileText, RefreshCw, Users } from "lucide-react";

type OfficeClient = {
  id: string;
  name: string;
  status: string;
  summary?: string | null;
  updatedAt?: string;
};

type ContentStats = {
  clientId: string;
  total: number;
  draft: number;
  inReview: number;
  scheduled: number;
  published: number;
};

export default function ContentManagementPage() {
  const [clients, setClients] = useState<OfficeClient[]>([]);
  const [stats, setStats] = useState<Record<string, ContentStats>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadClients() {
    setError("");
    try {
      const response = await fetch("/api/office/clients", { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Falha ao carregar clientes");
      const list: OfficeClient[] = Array.isArray(data.clients) ? data.clients : [];
      setClients(list);
      await loadStats(list);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setLoading(false);
    }
  }

  async function loadStats(list: OfficeClient[]) {
    const entries = await Promise.all(
      list.map(async (client) => {
        try {
          const r = await fetch(`/api/clients/${client.id}/content?limit=200`, {
            cache: "no-store",
          });
          if (!r.ok) return [client.id, null] as const;
          const data = await r.json().catch(() => ({}));
          const pieces: Array<{ status: string }> = Array.isArray(data.pieces) ? data.pieces : [];
          const s: ContentStats = {
            clientId: client.id,
            total: pieces.length,
            draft: pieces.filter((p) => p.status === "draft").length,
            inReview: pieces.filter((p) => p.status === "in_review").length,
            scheduled: pieces.filter((p) => p.status === "scheduled").length,
            published: pieces.filter((p) => p.status === "published").length,
          };
          return [client.id, s] as const;
        } catch {
          return [client.id, null] as const;
        }
      }),
    );
    const next: Record<string, ContentStats> = {};
    for (const [id, s] of entries) {
      if (s) next[id] = s;
    }
    setStats(next);
  }

  useEffect(() => {
    void loadClients();
  }, []);

  const totals = useMemo(() => {
    return Object.values(stats).reduce(
      (acc, s) => ({
        total: acc.total + s.total,
        draft: acc.draft + s.draft,
        inReview: acc.inReview + s.inReview,
        scheduled: acc.scheduled + s.scheduled,
        published: acc.published + s.published,
      }),
      { total: 0, draft: 0, inReview: 0, scheduled: 0, published: 0 },
    );
  }, [stats]);

  return (
    <div className="theme-web min-h-screen bg-bg px-8 py-8 text-text">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Gestão de Conteúdo</h1>
            <p className="mt-1 text-text-muted">
              Peças de conteúdo organizadas por cliente — rascunhos, revisões, agendamentos e publicações.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/channels"
              className="rounded-lg bg-surface-raised px-4 py-2 text-sm font-medium hover:bg-surface-raised/80"
            >
              Canais
            </Link>
            <button
              type="button"
              onClick={() => void loadClients()}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-surface-raised"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-lg border border-danger/40 bg-surface px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        <section className="mb-6 grid gap-4 md:grid-cols-5">
          <Metric title="Total" value={totals.total} icon={<FileText className="h-4 w-4" />} />
          <Metric title="Rascunhos" value={totals.draft} />
          <Metric title="Em revisão" value={totals.inReview} />
          <Metric title="Agendadas" value={totals.scheduled} icon={<Calendar className="h-4 w-4" />} />
          <Metric title="Publicadas" value={totals.published} />
        </section>

        <section className="rounded-xl border border-border bg-surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Clientes</h2>
          </div>
          {loading ? (
            <div className="py-6 text-center text-text-muted">Carregando...</div>
          ) : clients.length === 0 ? (
            <div className="py-6 text-center text-text-muted">Nenhum cliente cadastrado ainda.</div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-bg text-xs uppercase text-text-muted">
                  <tr>
                    <th className="px-3 py-2">Cliente</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 text-right">Total</th>
                    <th className="px-3 py-2 text-right">Rascunhos</th>
                    <th className="px-3 py-2 text-right">Revisão</th>
                    <th className="px-3 py-2 text-right">Agendadas</th>
                    <th className="px-3 py-2 text-right">Publicadas</th>
                    <th className="px-3 py-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {clients.map((client) => {
                    const s = stats[client.id];
                    return (
                      <tr key={client.id} className="hover:bg-bg/40">
                        <td className="px-3 py-2">
                          <div className="font-medium">{client.name}</div>
                          {client.summary && (
                            <div className="line-clamp-1 text-xs text-text-muted">{client.summary}</div>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <span className="rounded bg-surface-raised px-2 py-0.5 text-xs">
                            {client.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">{s?.total ?? "-"}</td>
                        <td className="px-3 py-2 text-right">{s?.draft ?? "-"}</td>
                        <td className="px-3 py-2 text-right">{s?.inReview ?? "-"}</td>
                        <td className="px-3 py-2 text-right">{s?.scheduled ?? "-"}</td>
                        <td className="px-3 py-2 text-right">{s?.published ?? "-"}</td>
                        <td className="px-3 py-2 text-right">
                          <Link
                            href={`/content/${client.id}`}
                            className="inline-flex items-center rounded-lg bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90"
                          >
                            Gerenciar
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Metric({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2 text-xs uppercase text-text-muted">
        {icon}
        {title}
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}
