import { prisma } from "@/lib/db";
import type { AuthUser } from "@/lib/auth/users";

export type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  kind: "launch" | "task" | "gate";
  clientId: number;
  clientName: string;
};

export async function getCalendarEventsService(user: AuthUser): Promise<CalendarEvent[]> {
  const clients = await prisma.client.findMany({
    where: {
      organizationId: user.organizationId,
      deletedAt: null,
      ...(user.role === "ae" && user.aeId ? { aeId: user.aeId } : {}),
    },
    include: {
      tasks: { where: { deletedAt: null, status: { not: "Done" } } },
      gates: { where: { status: { not: "Complete" } } },
    },
  });

  const today = new Date();
  const events: CalendarEvent[] = [];

  for (const c of clients) {
    const launch = new Date(today);
    launch.setDate(launch.getDate() + c.daysToLaunch);
    events.push({
      id: `launch-${c.id}`,
      title: `${c.name} launch`,
      date: launch.toISOString().slice(0, 10),
      kind: "launch",
      clientId: c.id,
      clientName: c.name,
    });

    for (const t of c.tasks) {
      const m = t.due.match(/\d{4}-\d{2}-\d{2}/);
      if (!m) continue;
      events.push({
        id: `task-${t.id}`,
        title: t.title,
        date: m[0]!,
        kind: "task",
        clientId: c.id,
        clientName: c.name,
      });
    }

    for (const g of c.gates) {
      if (g.status !== "In Progress") continue;
      const approx = new Date(today);
      approx.setDate(approx.getDate() + Math.max(1, g.phase * 3));
      events.push({
        id: `gate-${g.id}`,
        title: `Gate: ${g.name}`,
        date: approx.toISOString().slice(0, 10),
        kind: "gate",
        clientId: c.id,
        clientName: c.name,
      });
    }
  }

  return events.sort((a, b) => a.date.localeCompare(b.date));
}
