import { existsSync } from "fs";
import path from "path";
import { apiJson, requestId } from "@/lib/api";
import { prisma } from "@/lib/db";
import { jobs, ensureJobHandlers } from "@/lib/infra/jobs";
import { getStorageProvider } from "@/lib/infra/storage";

export async function GET(req: Request) {
  const rid = requestId(req);
  ensureJobHandlers();

  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  let storageOk = false;
  try {
    getStorageProvider();
    const root =
      process.env.STORAGE_ROOT ?? path.join(process.cwd(), "storage");
    storageOk = existsSync(root);
  } catch {
    storageOk = false;
  }

  const emailDriver = process.env.EMAIL_DRIVER ?? "console";
  const ok = dbOk;
  return apiJson(
    {
      status: ok ? "ok" : "degraded",
      app: "VirtualClinicOS",
      version: "v1",
      db: dbOk ? "up" : "down",
      storage: storageOk ? "up" : "down",
      email: emailDriver,
      queueDepth: jobs.depth(),
      time: new Date().toISOString(),
    },
    { status: ok ? 200 : 503, requestId: rid },
  );
}
