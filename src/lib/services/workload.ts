import { prisma } from "@/lib/db";
import type { AuthUser } from "@/lib/auth/users";

export type WorkloadStatus = "Available" | "Overloaded" | "Free" | "On Leave";

export async function getWorkloadService(user: AuthUser) {
  const aes = await prisma.accountExecutive.findMany({
    where: { organizationId: user.organizationId },
    include: {
      availability: true,
      clients: {
        where: { deletedAt: null },
        select: { id: true },
      },
    },
  });

  const now = new Date();
  const rows = await Promise.all(
    aes.map(async (ae) => {
      const openTasks = await prisma.task.count({
        where: {
          organizationId: user.organizationId,
          status: { not: "Done" },
          deletedAt: null,
          client: { aeId: ae.id, deletedAt: null },
        },
      });
      const avail = ae.availability[0];
      const onLeave =
        avail?.vacationStart &&
        avail?.vacationEnd &&
        now >= avail.vacationStart &&
        now <= avail.vacationEnd;
      const capacity = avail?.capacityOverride ?? ae.capacityLoad;
      let status: WorkloadStatus = "Available";
      if (onLeave) status = "On Leave";
      else if (capacity >= 85 || openTasks >= 12) status = "Overloaded";
      else if (capacity < 40 && openTasks < 3) status = "Free";

      return {
        aeId: ae.id,
        name: ae.name,
        capacityLoad: capacity,
        openTasks,
        clientCount: ae.clients.length,
        status,
        vacationStart: avail?.vacationStart ?? null,
        vacationEnd: avail?.vacationEnd ?? null,
      };
    }),
  );

  return rows;
}
