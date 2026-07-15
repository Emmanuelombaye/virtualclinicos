import { randomBytes } from "crypto";
import { resolveAuthWithRateLimit } from "@/lib/auth/api-key";
import { apiJson, mapServiceError, requestId } from "@/lib/api";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { z } from "zod";

export async function POST(req: Request) {
  const rid = requestId(req);
  try {
    const { user } = await resolveAuthWithRateLimit(req);
    const body = z
      .object({
        enabled: z.boolean(),
        code: z.string().optional(),
      })
      .parse(await req.json());

    if (body.enabled && body.code && body.code !== "000000") {
      throw new Error("Invalid: MFA code (use 000000 in dev)");
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        mfaEnabled: body.enabled,
        mfaSecret: body.enabled
          ? randomBytes(20).toString("hex")
          : null,
      },
    });

    await writeAudit({
      user,
      action: body.enabled ? "mfa.enable" : "mfa.disable",
      entityType: "User",
      entityId: user.id,
    });

    return apiJson(
      {
        data: {
          mfaEnabled: updated.mfaEnabled,
          note: "Dev stub: verification accepts 000000",
        },
      },
      { requestId: rid },
    );
  } catch (err) {
    return mapServiceError(err, rid);
  }
}
