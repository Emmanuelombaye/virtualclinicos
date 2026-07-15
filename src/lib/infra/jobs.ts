type JobHandler = (payload: unknown) => Promise<void> | void;

type QueuedJob = {
  id: string;
  name: string;
  payload: unknown;
  runAt: number;
};

export interface JobProvider {
  enqueue(name: string, payload: unknown, delayMs?: number): string;
  register(name: string, handler: JobHandler): void;
  depth(): number;
}

class InProcessJobProvider implements JobProvider {
  private handlers = new Map<string, JobHandler>();
  private queue: QueuedJob[] = [];
  private processing = false;
  private seq = 0;

  register(name: string, handler: JobHandler) {
    this.handlers.set(name, handler);
  }

  enqueue(name: string, payload: unknown, delayMs = 0): string {
    const id = `job_${++this.seq}_${Date.now()}`;
    this.queue.push({
      id,
      name,
      payload,
      runAt: Date.now() + delayMs,
    });
    this.schedule();
    return id;
  }

  depth() {
    return this.queue.length;
  }

  private schedule() {
    if (this.processing) return;
    this.processing = true;
    setTimeout(() => void this.tick(), 0);
  }

  private async tick() {
    try {
      const now = Date.now();
      const ready = this.queue.filter((j) => j.runAt <= now);
      this.queue = this.queue.filter((j) => j.runAt > now);
      for (const job of ready) {
        const handler = this.handlers.get(job.name);
        if (!handler) {
          console.warn(`[jobs] no handler for ${job.name}`);
          continue;
        }
        try {
          await handler(job.payload);
        } catch (err) {
          console.error(`[jobs] ${job.name} failed`, err);
        }
      }
    } finally {
      this.processing = false;
      if (this.queue.length) this.schedule();
    }
  }
}

export const jobs: JobProvider = new InProcessJobProvider();

if (process.env.REDIS_URL) {
  console.info(
    "[jobs] REDIS_URL present — in-process provider active; swap JobProvider for BullMQ without changing callers",
  );
}

/** Register default job types (idempotent). */
export function ensureJobHandlers() {
  if ((globalThis as { __vcoJobs?: boolean }).__vcoJobs) return;
  (globalThis as { __vcoJobs?: boolean }).__vcoJobs = true;

  jobs.register("email.send", async (payload) => {
    console.log("[jobs:email.send]", payload);
  });
  jobs.register("webhook.deliver", async (payload) => {
    const { deliverWebhookJob } = await import("@/lib/services/webhooks");
    await deliverWebhookJob(payload as { deliveryId: string });
  });
  jobs.register("report.export", async (payload) => {
    console.log("[jobs:report.export]", payload);
  });
  jobs.register("recurring.tick", async () => {
    const { expandDueRecurringTasks } = await import(
      "@/lib/services/recurring"
    );
    await expandDueRecurringTasks();
  });
  jobs.register("digest.tick", async (payload) => {
    const { runTaskDigestTick } = await import("@/lib/services/digests");
    const orgId =
      payload && typeof payload === "object" && "organizationId" in payload
        ? String((payload as { organizationId: string }).organizationId)
        : undefined;
    await runTaskDigestTick(orgId);
  });
}
