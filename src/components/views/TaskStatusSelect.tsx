"use client";

import { useTransition } from "react";
import { updateTaskStatus } from "@/lib/actions";
import { useToast } from "@/components/ui/Toast";
import type { TaskStatus } from "@/lib/types";

const OPTIONS: TaskStatus[] = [
  "To Do",
  "In Progress",
  "Blocked",
  "In Review",
  "Done",
];

export function TaskStatusSelect({
  taskId,
  status,
}: {
  taskId: string;
  status: TaskStatus;
}) {
  const [pending, startTransition] = useTransition();
  const { push } = useToast();

  return (
    <select
      value={status}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as TaskStatus;
        startTransition(async () => {
          try {
            await updateTaskStatus({ taskId, status: next });
            push("Task updated");
          } catch {
            push("Could not update task", "err");
          }
        });
      }}
      className="h-7 w-full rounded-md border border-vco-border bg-slate-50 px-2 text-[11px] font-semibold text-slate-700 outline-none focus:border-[#2E5BFF] disabled:opacity-60"
    >
      {OPTIONS.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}
