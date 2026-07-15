import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export function requestId(req: Request) {
  return req.headers.get("x-request-id") ?? randomUUID();
}

export function apiJson(
  body: unknown,
  init?: {
    status?: number;
    requestId?: string;
    rateLimit?: { remaining: number; limit: number };
  },
) {
  const rid = init?.requestId ?? randomUUID();
  const headers: Record<string, string> = {
    "x-request-id": rid,
  };
  if (init?.rateLimit) {
    headers["X-RateLimit-Limit"] = String(init.rateLimit.limit);
    headers["X-RateLimit-Remaining"] = String(init.rateLimit.remaining);
  }
  return NextResponse.json(body, {
    status: init?.status ?? 200,
    headers,
  });
}

export function apiError(
  message: string,
  status: number,
  requestIdValue?: string,
) {
  const rid = requestIdValue ?? randomUUID();
  return apiJson({ error: message, requestId: rid }, { status, requestId: rid });
}

export function mapServiceError(err: unknown, rid: string) {
  const msg = err instanceof Error ? err.message : "Server error";
  if (msg === "Unauthorized") return apiError(msg, 401, rid);
  if (msg === "Forbidden") return apiError(msg, 403, rid);
  if (msg === "Not found") return apiError(msg, 404, rid);
  if (msg === "Rate limit exceeded") return apiError(msg, 429, rid);
  if (
    msg === "Version conflict" ||
    (err instanceof Error && err.name === "VersionConflictError")
  ) {
    return apiError("Version conflict — refresh and retry", 409, rid);
  }
  if (msg.includes("Invalid") || msg.includes("parse") || msg.includes("Zod")) {
    return apiError("Validation error", 400, rid);
  }
  console.error(`[${rid}]`, err);
  return apiError("Server error", 500, rid);
}
