import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { TaskBoard } from "@/components/views/TaskBoard";
import { getSessionUser } from "@/lib/auth/session";
import { clientName, listClientOptions, tasksByStatus } from "@/lib/queries";
import type { TaskStatus } from "@/lib/types";

const STATUSES: TaskStatus[] = [
  "To Do",
  "In Progress",
  "Blocked",
  "In Review",
  "Done",
];

export default async function TasksPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [board, clientOptions] = await Promise.all([
    tasksByStatus(user),
    listClientOptions(user),
  ]);

  const clientIds = [
    ...new Set(STATUSES.flatMap((s) => board[s].map((t) => t.clientId))),
  ];
  const namesEntries = await Promise.all(
    clientIds.map(async (id) => [id, await clientName(id, user)] as const),
  );
  const names = Object.fromEntries(namesEntries);

  const total = STATUSES.reduce((s, st) => s + board[st].length, 0);

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle="Work across the delivery team — drag cards between columns"
        showNewTask
        clientOptions={clientOptions}
      />

      {total === 0 ? (
        <EmptyState
          title="No tasks yet"
          body="Create a task to start tracking delivery work across clients."
          action={
            <a
              href="/clients"
              className="inline-flex h-9 items-center rounded-lg border border-vco-border bg-white px-3 text-sm font-semibold text-slate-700"
            >
              Browse clients
            </a>
          }
        />
      ) : (
        <TaskBoard board={board} names={names} />
      )}
    </div>
  );
}
