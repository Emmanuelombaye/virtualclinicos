import { createHmac, randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import type { AuthUser } from "@/lib/auth/users";
import { writeAudit } from "@/lib/audit";
import { ensureJobHandlers, jobs } from "@/lib/infra/jobs";
import { z } from "zod";

export const WebhookInput = z.object({
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  enabled: z.boolean().optional(),
});

export async function listWebhooksService(user: AuthUser) {
  requirePermission(user, "webhooks.manage");
  return prisma.webhookEndpoint.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { createdAt: "desc" },
    include: {
      deliveries: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
}

export async function createWebhookService(
  user: AuthUser,
  input: z.infer<typeof WebhookInput>,
) {
  requirePermission(user, "webhooks.manage");
  const data = WebhookInput.parse(input);
  const secret = randomBytes(24).toString("hex");
  const endpoint = await prisma.webhookEndpoint.create({
    data: {
      organizationId: user.organizationId,
      url: data.url,
      secret,
      eventsJson: JSON.stringify(data.events),
      enabled: data.enabled ?? true,
    },
  });
  await writeAudit({
    user,
    action: "webhook.create",
    entityType: "WebhookEndpoint",
    entityId: endpoint.id,
    after: { url: endpoint.url },
  });
  return endpoint;
}

export async function deleteWebhookService(user: AuthUser, id: string) {
  requirePermission(user, "webhooks.manage");
  const ep = await prisma.webhookEndpoint.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!ep) throw new Error("Not found");
  await prisma.webhookEndpoint.delete({ where: { id } });
}

export async function dispatchWebhooks(
  organizationId: string,
  event: string,
  payload: Record<string, unknown>,
) {
  ensureJobHandlers();
  const endpoints = await prisma.webhookEndpoint.findMany({
    where: { organizationId, enabled: true },
  });
  for (const ep of endpoints) {
    let events: string[] = [];
    try {
      events = JSON.parse(ep.eventsJson) as string[];
    } catch {
      continue;
    }
    if (!events.includes(event) && !events.includes("*")) continue;

    const delivery = await prisma.webhookDelivery.create({
      data: {
        organizationId,
        endpointId: ep.id,
        event,
        payloadJson: JSON.stringify(payload),
        status: "pending",
      },
    });
    jobs.enqueue("webhook.deliver", { deliveryId: delivery.id });
  }
}

export async function deliverWebhookJob(payload: { deliveryId: string }) {
  const delivery = await prisma.webhookDelivery.findUnique({
    where: { id: payload.deliveryId },
    include: { endpoint: true },
  });
  if (!delivery || !delivery.endpoint) return;

  const body = JSON.stringify({
    event: delivery.event,
    data: JSON.parse(delivery.payloadJson),
    deliveryId: delivery.id,
  });
  const sig = createHmac("sha256", delivery.endpoint.secret)
    .update(body)
    .digest("hex");

  try {
    const res = await fetch(delivery.endpoint.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VCO-Signature": sig,
        "X-VCO-Event": delivery.event,
      },
      body,
      signal: AbortSignal.timeout(8000),
    });
    await prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        attempts: { increment: 1 },
        status: res.ok ? "delivered" : "failed",
        lastError: res.ok ? null : `HTTP ${res.status}`,
        deliveredAt: res.ok ? new Date() : null,
      },
    });
    if (!res.ok) console.warn("[webhook] delivery failed", delivery.id, res.status);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "fetch failed";
    console.warn("[webhook] delivery error", delivery.id, msg);
    await prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        attempts: { increment: 1 },
        status: "failed",
        lastError: msg,
      },
    });
  }
}
