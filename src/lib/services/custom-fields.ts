import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import type { AuthUser } from "@/lib/auth/users";
import { writeAudit } from "@/lib/audit";
import { z } from "zod";

export const FieldDefInput = z.object({
  entityType: z.enum(["Client", "Task", "Risk"]),
  key: z.string().trim().min(1).max(40).regex(/^[a-z][a-z0-9_]*$/),
  label: z.string().trim().min(1).max(80),
  fieldType: z.enum(["text", "number", "select", "boolean"]).default("text"),
  optionsJson: z.string().optional(),
  required: z.boolean().optional(),
});

export const FieldValueInput = z.object({
  fieldDefId: z.string().min(1),
  entityType: z.enum(["Client", "Task", "Risk"]),
  entityId: z.string().min(1),
  valueText: z.string().nullable(),
});

export async function listFieldDefsService(user: AuthUser, entityType?: string) {
  return prisma.customFieldDef.findMany({
    where: {
      organizationId: user.organizationId,
      ...(entityType ? { entityType } : {}),
    },
    orderBy: { label: "asc" },
  });
}

export async function createFieldDefService(
  user: AuthUser,
  input: z.infer<typeof FieldDefInput>,
) {
  requirePermission(user, "custom_fields.manage");
  const data = FieldDefInput.parse(input);
  const def = await prisma.customFieldDef.create({
    data: {
      organizationId: user.organizationId,
      entityType: data.entityType,
      key: data.key,
      label: data.label,
      fieldType: data.fieldType,
      optionsJson: data.optionsJson ?? null,
      required: data.required ?? false,
    },
  });
  await writeAudit({
    user,
    action: "custom_field.create",
    entityType: "CustomFieldDef",
    entityId: def.id,
    after: { key: def.key, label: def.label },
  });
  return def;
}

export async function setFieldValueService(
  user: AuthUser,
  input: z.infer<typeof FieldValueInput>,
) {
  requirePermission(user, "clients.manage");
  const data = FieldValueInput.parse(input);
  const def = await prisma.customFieldDef.findFirst({
    where: { id: data.fieldDefId, organizationId: user.organizationId },
  });
  if (!def) throw new Error("Not found");

  return prisma.customFieldValue.upsert({
    where: {
      fieldDefId_entityType_entityId: {
        fieldDefId: data.fieldDefId,
        entityType: data.entityType,
        entityId: data.entityId,
      },
    },
    create: {
      organizationId: user.organizationId,
      fieldDefId: data.fieldDefId,
      entityType: data.entityType,
      entityId: data.entityId,
      valueText: data.valueText,
    },
    update: { valueText: data.valueText },
  });
}

export async function getFieldValuesService(
  user: AuthUser,
  entityType: string,
  entityId: string,
) {
  return prisma.customFieldValue.findMany({
    where: {
      organizationId: user.organizationId,
      entityType,
      entityId,
    },
    include: { fieldDef: true },
  });
}
