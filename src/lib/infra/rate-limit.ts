type Bucket = { tokens: number; updatedAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimitConsume(
  key: string,
  limitPerMinute: number,
): { allowed: boolean; remaining: number; limit: number } {
  const now = Date.now();
  const refillPerMs = limitPerMinute / 60_000;
  let b = buckets.get(key);
  if (!b) {
    b = { tokens: limitPerMinute, updatedAt: now };
    buckets.set(key, b);
  } else {
    const elapsed = now - b.updatedAt;
    b.tokens = Math.min(limitPerMinute, b.tokens + elapsed * refillPerMs);
    b.updatedAt = now;
  }
  if (b.tokens < 1) {
    return { allowed: false, remaining: 0, limit: limitPerMinute };
  }
  b.tokens -= 1;
  return {
    allowed: true,
    remaining: Math.floor(b.tokens),
    limit: limitPerMinute,
  };
}
