import { Readable } from "stream";
import { resolveAuthWithRateLimit } from "@/lib/auth/api-key";
import { apiError, mapServiceError, requestId } from "@/lib/api";
import { getFileForDownload } from "@/lib/services/files";
import { getStorageProvider } from "@/lib/infra/storage";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const rid = requestId(req);
  try {
    const { user } = await resolveAuthWithRateLimit(req);
    const { id } = await ctx.params;
    const file = await getFileForDownload(user, id);
    const stream = await getStorageProvider().getStream(file.storageKey);
    const webStream = Readable.toWeb(stream) as unknown as ReadableStream;

    return new Response(webStream, {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `attachment; filename="${file.name.replace(/"/g, "")}"`,
        "x-request-id": rid,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "error";
    if (msg === "Not found") return apiError(msg, 404, rid);
    return mapServiceError(err, rid);
  }
}
