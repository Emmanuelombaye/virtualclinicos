"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { TaskStatusSelect } from "@/components/views/TaskStatusSelect";
import { updateTaskStatus } from "@/lib/actions";
import { useToast } from "@/components/ui/Toast";
import type { Task, TaskStatus } from "@/lib/types";

const COLUMNS: { status: TaskStatus; color: string }[] = [
  { status: "To Do", color: "#94A3B8" },
  { status: "In Progress", color: "#F59E0B" },
  { status: "Blocked", color: "#EF4444" },
  { status: "In Review", color: "#2E5BFF" },
  { status: "Done", color: "#16A34A" },
];

export function TaskBoard({
  board,
  names,
}: {
  board: Record<TaskStatus, Task[]>;
  names: Record<number, string>;
}) {
  const router = useRouter();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overStatus, setOverStatus] = useState<TaskStatus | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const { push } = useToast();

  const allTasks = useMemo(
    () => COLUMNS.flatMap((c) => board[c.status]),
    [board],
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function dropOn(status: TaskStatus) {
    if (!draggingId) return;
    const task = allTasks.find((t) => t.id === draggingId);
    if (!task || task.status === status) {
      setDraggingId(null);
      setOverStatus(null);
      return;
    }
    startTransition(async () => {
      try {
        await updateTaskStatus({ taskId: draggingId, status });
        push(`Moved to ${status}`);
      } catch {
        push("Could not move task", "err");
      } finally {
        setDraggingId(null);
        setOverStatus(null);
      }
    });
  }

  function bulk(action: "status" | "delete", status?: TaskStatus) {
    const ids = [...selected];
    if (!ids.length) return;
    startTransition(async () => {
      try {
        const res = await fetch("/api/v1/tasks/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids, action, status }),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error ?? "Bulk failed");
        push(`Updated ${ids.length} task(s)`);
        setSelected(new Set());
        router.refresh();
      } catch (e) {
        push(e instanceof Error ? e.message : "Bulk failed", "err");
      }
    });
  }

  return (
    <div className="space-y-3">
      {selected.size > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-vco-border bg-white px-3 py-2 text-sm">
          <span className="font-semibold text-vco-ink">
            {selected.size} selected
          </span>
          <select
            className="h-8 rounded-lg border border-vco-border px-2 text-xs"
            defaultValue=""
            onChange={(e) => {
              const v = e.target.value as TaskStatus;
              if (v) bulk("status", v);
              e.target.value = "";
            }}
          >
            <option value="">Set status…</option>
            {COLUMNS.map((c) => (
              <option key={c.status} value={c.status}>
                {c.status}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="rounded-lg border border-[#FECDCA] bg-[#FEF3F2] px-2 py-1 text-xs font-semibold text-[#B42318]"
            onClick={() => bulk("delete")}
          >
            Archive
          </button>
          <button
            type="button"
            className="text-xs font-semibold text-slate-500"
            onClick={() => setSelected(new Set())}
          >
            Clear
          </button>
        </div>
      ) : null}

      <div
        className={`grid gap-3 md:grid-cols-2 xl:grid-cols-5 ${pending ? "opacity-80" : ""}`}
      >
        {COLUMNS.map((col) => {
          const tasks = board[col.status];
          const isOver = overStatus === col.status;
          return (
            <div
              key={col.status}
              onDragOver={(e) => {
                e.preventDefault();
                setOverStatus(col.status);
              }}
              onDragLeave={() => {
                if (overStatus === col.status) setOverStatus(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                dropOn(col.status);
              }}
              className={`rounded-xl p-1 ${isOver ? "bg-[#EFF4FF]" : ""}`}
            >
              <div className="mb-2 flex items-center gap-2 px-1">
                <span
                  className="size-2 rounded-full"
                  style={{ background: col.color }}
                />
                <span className="text-sm font-semibold text-vco-ink">
                  {col.status}
                </span>
                <span className="text-xs font-semibold text-vco-muted">
                  {tasks.length}
                </span>
              </div>
              <div className="min-h-[120px] space-y-2">
                {tasks.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-vco-border bg-white/60 px-3 py-6 text-center text-xs text-vco-muted">
                    Drop tasks here
                  </div>
                ) : null}
                {tasks.map((t) => (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={() => setDraggingId(t.id)}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setOverStatus(null);
                    }}
                    className={`cursor-grab rounded-xl border border-vco-border bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)] active:cursor-grabbing ${
                      draggingId === t.id ? "opacity-50" : ""
                    } ${selected.has(t.id) ? "ring-2 ring-[#2E5BFF]" : ""}`}
                  >
                    <label className="mb-1 flex items-center gap-2 text-[11px] text-slate-500">
                      <input
                        type="checkbox"
                        checked={selected.has(t.id)}
                        onChange={() => toggle(t.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      Select
                    </label>
                    <div className="text-[13px] font-semibold text-vco-ink">
                      {t.title}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Badge label={t.priority} />
                      <span
                        className={`text-[11px] font-medium ${
                          t.due.startsWith("Overdue") || t.due === "Today"
                            ? "text-[#B42318]"
                            : "text-slate-500"
                        }`}
                      >
                        {t.due}
                      </span>
                    </div>
                    <div className="mt-2 text-[11px] font-medium text-vco-muted">
                      {names[t.clientId]}
                    </div>
                    <div className="mt-2">
                      <TaskStatusSelect taskId={t.id} status={t.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
