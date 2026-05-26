"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { Check, ClipboardList, Play, RefreshCw, ShieldCheck, X } from "lucide-react";

type Job = {
  id: string;
  type: string;
  status: string;
  channelId?: string | null;
  npcId?: string | null;
  error?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type Approval = {
  id: string;
  actionType: string;
  title: string;
  summary?: string | null;
  status: string;
  createdAt?: string;
};

type ActionLog = {
  id: string;
  actionType: string;
  status: string;
  reason?: string | null;
  error?: string | null;
  createdAt?: string;
};

type RuntimeInfo = {
  autoApprovedActions?: string[];
  approvalRequiredActions?: string[];
  rolePermissions?: Record<string, string[]>;
};

export default function NpcOperationsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [runtime, setRuntime] = useState<RuntimeInfo>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const pendingApprovals = useMemo(
    () => approvals.filter((approval) => approval.status === "pending"),
    [approvals],
  );

  async function loadState() {
    setError("");
    try {
      const [jobsResponse, approvalsResponse, logsResponse] = await Promise.all([
        fetch("/api/internal/npc-automation?limit=80"),
        fetch("/api/internal/npc-automation/approvals?status=pending&limit=80"),
        fetch("/api/internal/npc-automation/logs?limit=120"),
      ]);

      const [jobsData, approvalsData, logsData] = await Promise.all([
        jobsResponse.json().catch(() => ({})),
        approvalsResponse.json().catch(() => ({})),
        logsResponse.json().catch(() => ({})),
      ]);

      if (!jobsResponse.ok) throw new Error(jobsData.error || "Falha ao carregar automacoes");
      if (!approvalsResponse.ok) throw new Error(approvalsData.error || "Falha ao carregar aprovacoes");
      if (!logsResponse.ok) throw new Error(logsData.error || "Falha ao carregar logs");

      setJobs(Array.isArray(jobsData.jobs) ? jobsData.jobs : []);
      setRuntime(jobsData.runtime || {});
      setApprovals(Array.isArray(approvalsData.approvals) ? approvalsData.approvals : []);
      setLogs(Array.isArray(logsData.logs) ? logsData.logs : []);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setLoading(false);
    }
  }

  async function runAction(action: string, callback: () => Promise<Response>) {
    setBusy(action);
    setError("");
    try {
      const response = await callback();
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Operacao falhou");
      await loadState();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setBusy("");
    }
  }

  useEffect(() => {
    void loadState();
  }, []);

  return (
    <div className="theme-web min-h-screen bg-bg px-8 py-8 text-text">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Operacoes dos NPCs</h1>
            <p className="mt-1 text-text-muted">Fila, aprovacoes e auditoria das acoes internas do Fenix Lab.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/channels" className="rounded-lg bg-surface-raised px-4 py-2 text-sm font-medium hover:bg-surface-raised/80">
              Canais
            </Link>
            <button
              type="button"
              onClick={() => void loadState()}
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

        <section className="mb-6 grid gap-4 md:grid-cols-4">
          <Metric title="Jobs" value={jobs.length} />
          <Metric title="Pendentes" value={jobs.filter((job) => job.status === "pending").length} />
          <Metric title="Aprovacoes" value={pendingApprovals.length} />
          <Metric title="Logs" value={logs.length} />
        </section>

        <section className="mb-8 rounded-xl border border-border bg-surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Controles operacionais</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <CommandButton
              busy={busy === "process"}
              icon={<Play className="h-4 w-4" />}
              label="Processar fila"
              onClick={() => runAction("process", () => fetch("/api/internal/npc-automation/process", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ limit: 10 }),
              }))}
            />
            <CommandButton
              busy={busy === "overdue"}
              icon={<ClipboardList className="h-4 w-4" />}
              label="Varrer tarefas atrasadas"
              onClick={() => runAction("overdue", () => fetch("/api/internal/npc-automation/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ eventType: "scan_overdue_tasks", processNow: true }),
              }))}
            />
            <CommandButton
              busy={busy === "daily"}
              icon={<ShieldCheck className="h-4 w-4" />}
              label="Gerar resumo diario"
              onClick={() => runAction("daily", () => fetch("/api/internal/npc-automation/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ eventType: "daily_operations_report", processNow: true }),
              }))}
            />
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <main className="space-y-6">
            <Panel title="Fila de automacoes">
              {loading ? <Empty text="Carregando..." /> : jobs.length === 0 ? <Empty text="Nenhum job registrado ainda." /> : (
                <div className="overflow-hidden rounded-lg border border-border">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-bg text-xs uppercase text-text-muted">
                      <tr>
                        <th className="px-3 py-2">Tipo</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Criado</th>
                        <th className="px-3 py-2">Erro</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {jobs.map((job) => (
                        <tr key={job.id}>
                          <td className="px-3 py-2 font-mono text-xs">{job.type}</td>
                          <td className="px-3 py-2"><StatusPill status={job.status} /></td>
                          <td className="px-3 py-2 text-text-muted">{formatDate(job.createdAt)}</td>
                          <td className="max-w-[280px] truncate px-3 py-2 text-danger">{job.error || ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>

            <Panel title="Auditoria">
              {logs.length === 0 ? <Empty text="Nenhum log registrado ainda." /> : (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div key={log.id} className="rounded-lg border border-border bg-bg px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="font-mono text-xs">{log.actionType}</div>
                        <StatusPill status={log.status} />
                      </div>
                      {(log.reason || log.error) && (
                        <p className={`mt-2 text-sm ${log.error ? "text-danger" : "text-text-muted"}`}>
                          {log.error || log.reason}
                        </p>
                      )}
                      <div className="mt-2 text-xs text-text-muted">{formatDate(log.createdAt)}</div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </main>

          <aside className="space-y-6">
            <Panel title="Aprovacoes pendentes">
              {pendingApprovals.length === 0 ? <Empty text="Nada aguardando aprovacao." /> : (
                <div className="space-y-3">
                  {pendingApprovals.map((approval) => (
                    <div key={approval.id} className="rounded-lg border border-border bg-bg p-4">
                      <div className="text-xs font-semibold uppercase text-text-muted">{approval.actionType}</div>
                      <h3 className="mt-1 font-semibold">{approval.title}</h3>
                      {approval.summary && <p className="mt-2 text-sm text-text-muted">{approval.summary}</p>}
                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => runAction(`approve-${approval.id}`, () => fetch(`/api/internal/npc-automation/approvals/${approval.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ decision: "approve" }),
                          }))}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                        >
                          <Check className="h-4 w-4" />
                          Aprovar
                        </button>
                        <button
                          type="button"
                          onClick={() => runAction(`reject-${approval.id}`, () => fetch(`/api/internal/npc-automation/approvals/${approval.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ decision: "reject" }),
                          }))}
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-surface-raised"
                        >
                          <X className="h-4 w-4" />
                          Rejeitar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Permissoes ativas">
              <div className="space-y-3">
                {Object.entries(runtime.rolePermissions || {}).map(([role, actions]) => (
                  <div key={role} className="rounded-lg border border-border bg-bg p-3">
                    <div className="font-semibold capitalize">{role}</div>
                    <p className="mt-1 text-xs leading-5 text-text-muted">{actions.join(", ")}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="text-sm text-text-muted">{title}</div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-lg border border-border bg-bg px-4 py-6 text-center text-sm text-text-muted">{text}</div>;
}

function StatusPill({ status }: { status: string }) {
  const tone = status === "completed" || status === "approved"
    ? "border-success/40 text-success"
    : status === "failed" || status === "rejected"
      ? "border-danger/40 text-danger"
      : "border-warning/40 text-warning";
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${tone}`}>{status}</span>;
}

function CommandButton({ busy, icon, label, onClick }: { busy: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
    >
      {icon}
      {busy ? "Processando..." : label}
    </button>
  );
}

function formatDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR");
}
