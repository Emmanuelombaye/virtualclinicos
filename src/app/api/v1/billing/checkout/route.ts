import { resolveAuthWithRateLimit } from "@/lib/auth/api-key";
import { apiJson, mapServiceError, requestId } from "@/lib/api";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { z } from "zod";

/**
 * Stripe checkout stub.
 * With STRIPE_SECRET_KEY: returns a fake checkout URL shaped for integration.
 * Without: returns plan upgrade instructions (no charge).
 */
export async function POST(req: Request) {
  const rid = requestId(req);
  try {
    const { user } = await resolveAuthWithRateLimit(req);
    requirePermission(user, "billing.view");
    const body = z
      .object({
        plan: z.enum(["free", "pro", "enterprise"]).default("pro"),
      })
      .parse(await req.json().catch(() => ({})));

    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
      await prisma.subscription.upsert({
        where: { organizationId: user.organizationId },
        create: {
          organizationId: user.organizationId,
          plan: body.plan,
          status: "active",
          seats: body.plan === "free" ? 5 : body.plan === "pro" ? 25 : 100,
        },
        update: {
          plan: body.plan,
          status: "active",
          seats: body.plan === "free" ? 5 : body.plan === "pro" ? 25 : 100,
        },
      });
      await writeAudit({
        user,
        action: "billing.plan_stub",
        entityType: "Subscription",
        entityId: user.organizationId,
        after: { plan: body.plan },
      });
      return apiJson(
        {
          data: {
            mode: "stub",
            message:
              "No STRIPE_SECRET_KEY — plan updated locally. Set Stripe env for live checkout.",
            plan: body.plan,
          },
        },
        { requestId: rid },
      );
    }

    // Live mode would call Stripe Checkout Sessions here.
    return apiJson(
      {
        data: {
          mode: "stripe_ready",
          checkoutUrl: `https://checkout.stripe.com/c/pay/stub_${body.plan}`,
          note: "Replace stub URL with stripe.checkout.sessions.create result",
        },
      },
      { requestId: rid },
    );
  } catch (err) {
    return mapServiceError(err, rid);
  }
}
