"use client";

import { useEffect, useState } from "react";
import TaskCard from "./TaskCard";
import type { Task } from "./TaskCard";
import type { Socket } from "socket.io-client";
import { useT } from "@/lib/i18n";
import { Plus } from "lucide-react";

interface TaskPanelProps {
  npcId: string;
  npcName: string;
  socket: Socket | null;
  channelId?: string | null;
  assignerCharacterId?: string | null;
  onDeleteTask?: (taskId: string) => void;
  onRequestReportTask?: (taskId: string) => void;
  onResumeTask?: (taskId: string) => void;
  onCompleteTask?: (taskId: string) => void;
}

export default function TaskPanel({
  npcId,
  npcName,
  socket,
  channelId,
  assignerCharacterId,
  onDeleteTask,
  onRequestReportTask,
  onResumeTask,
  onCompleteTask,
}: TaskPanelProps) {
  const t = useT();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadedNpcId, setLoadedNpcId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formSummary, setFormSummary] = useState("");
  const [formRecurrence, setFormRecurrence] = useState("once");
  const [formScheduledTime, setFormScheduledTime] = useState("");
  const [formRequiresApproval, setFormRequiresApproval] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canCreate = Boolean(channelId && assignerCharacterId);
  const loading = Boolean(socket && npcId) && loadedNpcId !== npcId;

  useEffect(() => {
    if (!socket || !npcId) return;

    const handleTaskList = ({ tasks: taskList, npcId: responseNpcId }: { tasks: Task[]; npcId: string | null }) => {
      if (responseNpcId !== npcId) return;
      setTasks(taskList);
      setLoadedNpcId(npcId);
    };

    socket.on("task:list-response", handleTaskList);
    socket.emit("task:list", { channelId: null, npcId });
    return () => { socket.off("task:list-response", handleTaskList); };
  }, [socket, npcId]);

  useEffect(() => {
    if (!socket) return;

    const handleTaskUpdated = ({ task }: { task: Task; action: string }) => {
      const taskNpcId = task.npcId;
      if (taskNpcId !== npcId) return;

      setLoadedNpcId(npcId);
      setTasks((prev) => {
        const idx = prev.findIndex((t) => t.id === task.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = task;
          return updated;
        }
        return [task, ...prev];
      });
    };

    const handleTaskDeleted = ({ taskId }: { taskId: string }) => {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    };

    socket.on("task:updated", handleTaskUpdated);
    socket.on("task:deleted", handleTaskDeleted);
    return () => { socket.off("task:updated", handleTaskUpdated); socket.off("task:deleted", handleTaskDeleted); };
  }, [socket, npcId]);

  const handleDelete = (taskId: string) => {
    if (onDeleteTask) {
      onDeleteTask(taskId);
      return;
    }
    if (!socket) return;
    socket.emit("task:delete", { taskId });
  };

  const handleRequestReport = (taskId: string) => {
    if (onRequestReportTask) {
      onRequestReportTask(taskId);
      return;
    }
    if (!socket) return;
    socket.emit("task:request-report", { taskId });
  };

  const handleResume = (taskId: string) => {
    if (onResumeTask) {
      onResumeTask(taskId);
      return;
    }
    if (!socket) return;
    socket.emit("task:resume", { taskId });
  };

  const handleComplete = (taskId: string) => {
    if (onCompleteTask) {
      onCompleteTask(taskId);
      return;
    }
    if (!socket) return;
    socket.emit("task:complete", { taskId });
  };

  const handleApprove = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (!res.ok) throw new Error("approve failed");
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch (err) {
      console.error("[TaskPanel] approve", err);
    }
  };

  const handleCreate = async () => {
    if (!canCreate || !formTitle.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          channelId,
          npcId,
          assignerId: assignerCharacterId,
          title: formTitle.trim(),
          summary: formSummary.trim() || null,
          recurrence: formRecurrence,
          scheduledTime: formScheduledTime || null,
          requiresApproval: formRequiresApproval,
        }),
      });
      if (!res.ok) throw new Error("create failed");
      const task = await res.json();
      setTasks((prev) => [task, ...prev]);
      setFormTitle("");
      setFormSummary("");
      setFormRecurrence("once");
      setFormScheduledTime("");
      setFormRequiresApproval(false);
      setShowForm(false);
    } catch (err) {
      console.error("[TaskPanel] create", err);
    } finally {
      setSubmitting(false);
    }
  };

  const activeTasks = tasks.filter((t) => t.status === "in_progress" || t.status === "pending");
  const stalledTasks = tasks.filter((t) => t.status === "stalled");
  const doneTasks = tasks.filter((t) => t.status === "complete" || t.status === "cancelled");
  const pendingApproval = tasks.filter((t) => t.requiresApproval && !t.approvedAt && t.status !== "cancelled");

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {canCreate && (
        <div className="border-b border-border p-2">
          {!showForm ? (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-1 rounded bg-primary/15 px-2 py-1.5 text-[11px] font-bold text-primary hover:bg-primary/25"
            >
              <Plus className="w-3 h-3" /> Nova tarefa
            </button>
          ) : (
            <div className="space-y-1.5">
              <input
                type="text"
                placeholder="Título"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full rounded bg-surface border border-border px-2 py-1 text-caption text-text"
              />
              <textarea
                placeholder="Descrição (opcional)"
                value={formSummary}
                onChange={(e) => setFormSummary(e.target.value)}
                rows={2}
                className="w-full rounded bg-surface border border-border px-2 py-1 text-caption text-text resize-none"
              />
              <div className="flex gap-1.5">
                <select
                  value={formRecurrence}
                  onChange={(e) => setFormRecurrence(e.target.value)}
                  className="flex-1 rounded bg-surface border border-border px-1 py-1 text-[11px] text-text"
                >
                  <option value="once">Uma vez</option>
                  <option value="daily">Diária</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                </select>
                <input
                  type="time"
                  value={formScheduledTime}
                  onChange={(e) => setFormScheduledTime(e.target.value)}
                  className="rounded bg-surface border border-border px-1 py-1 text-[11px] text-text"
                />
              </div>
              <label className="flex items-center gap-1.5 text-[11px] text-text-muted">
                <input
                  type="checkbox"
                  checked={formRequiresApproval}
                  onChange={(e) => setFormRequiresApproval(e.target.checked)}
                />
                Requer aprovação ao concluir
              </label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={submitting || !formTitle.trim()}
                  className="flex-1 rounded bg-success/20 px-2 py-1 text-[11px] font-bold text-success hover:bg-success/30 disabled:opacity-50"
                >
                  {submitting ? "..." : "Criar"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded bg-surface border border-border px-2 py-1 text-[11px] text-text-muted hover:text-text"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-text-muted text-body">{t("common.loading")}</div>
      ) : tasks.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-text-muted text-body">
          {t("task.noTasks", { name: npcName })}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {pendingApproval.length > 0 && (
            <>
              <div className="text-micro text-warning font-bold px-1">Aguardando aprovação ({pendingApproval.length})</div>
              {pendingApproval.map((task) => (
                <TaskCard key={`ap-${task.id}`} task={task} onDelete={handleDelete} onRequestReport={handleRequestReport} onResume={handleResume} onComplete={handleComplete} onApprove={handleApprove} />
              ))}
            </>
          )}
          {activeTasks.length > 0 && (
            <>
              <div className="text-micro text-text-dim font-bold px-1">{t("task.active")} ({activeTasks.length})</div>
              {activeTasks.map((task) => (
                <TaskCard key={task.id} task={task} onDelete={handleDelete} onRequestReport={handleRequestReport} onResume={handleResume} onComplete={handleComplete} onApprove={handleApprove} />
              ))}
            </>
          )}
          {stalledTasks.length > 0 && (
            <>
              <div className="text-micro text-text-dim font-bold px-1 mt-2">{t("task.stalled")} ({stalledTasks.length})</div>
              {stalledTasks.map((task) => (
                <TaskCard key={task.id} task={task} onDelete={handleDelete} onRequestReport={handleRequestReport} onResume={handleResume} onComplete={handleComplete} onApprove={handleApprove} />
              ))}
            </>
          )}
          {doneTasks.length > 0 && (
            <>
              <div className="text-micro text-text-dim font-bold px-1 mt-2">{t("task.done")} ({doneTasks.length})</div>
              {doneTasks.map((task) => (
                <TaskCard key={task.id} task={task} onDelete={handleDelete} onRequestReport={handleRequestReport} onResume={handleResume} onComplete={handleComplete} onApprove={handleApprove} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
