import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import type { AuthUser } from "@/lib/auth/users";

export async function getBillingService(user: AuthUser) {
  requirePermission(user, "billing.view");
  const [sub, userCount, apiUsage, fileBytes] = await Promise.all([
    prisma.subscription.findUnique({
      where: { organizationId: user.organizationId },
    }),
    prisma.user.count({ where: { organizationId: user.organizationId } }),
    prisma.apiUsageDaily.aggregate({
      where: { organizationId: user.organizationId },
      _sum: { count: true, errors: true },
    }),
    prisma.fileObject.aggregate({
      where: { organizationId: user.organizationId, deletedAt: null },
      _sum: { sizeBytes: true },
    }),
  ]);

  return {
    subscription: sub ?? {
      plan: "pro",
      status: "active",
      seats: 25,
    },
    usage: {
      seatsUsed: userCount,
      apiRequests: apiUsage._sum.count ?? 0,
      apiErrors: apiUsage._sum.errors ?? 0,
      storageBytes: fileBytes._sum.sizeBytes ?? 0,
    },
  };
}

export async function assertSeatAvailable(organizationId: string) {
  const [sub, count] = await Promise.all([
    prisma.subscription.findUnique({ where: { organizationId } }),
    prisma.user.count({ where: { organizationId } }),
  ]);
  const plan = sub?.plan ?? "pro";
  const seats = sub?.seats ?? 25;
  if (plan === "free" && count >= seats) {
    throw new Error("Invalid: seat limit reached for free plan");
  }
}
