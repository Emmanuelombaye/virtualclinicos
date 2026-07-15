type PresenceEntry = {
  userId: string;
  name: string;
  entityType: string;
  entityId: string;
  organizationId: string;
  at: number;
};

const TTL_MS = 15_000;
const store = new Map<string, PresenceEntry>();

function key(orgId: string, entityType: string, entityId: string, userId: string) {
  return `${orgId}:${entityType}:${entityId}:${userId}`;
}

export function heartbeatPresence(input: {
  organizationId: string;
  userId: string;
  name: string;
  entityType: string;
  entityId: string;
}) {
  const k = key(input.organizationId, input.entityType, input.entityId, input.userId);
  store.set(k, { ...input, at: Date.now() });
}

export function listPresence(input: {
  organizationId: string;
  entityType: string;
  entityId: string;
  excludeUserId?: string;
}) {
  const now = Date.now();
  const prefix = `${input.organizationId}:${input.entityType}:${input.entityId}:`;
  const out: PresenceEntry[] = [];
  for (const [k, v] of store) {
    if (!k.startsWith(prefix)) continue;
    if (now - v.at > TTL_MS) {
      store.delete(k);
      continue;
    }
    if (input.excludeUserId && v.userId === input.excludeUserId) continue;
    out.push(v);
  }
  return out;
}
