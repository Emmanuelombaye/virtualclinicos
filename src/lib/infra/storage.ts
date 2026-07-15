import { createReadStream, existsSync, mkdirSync } from "fs";
import { open, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import type { Readable } from "stream";

export type PutObjectInput = {
  organizationId: string;
  filename: string;
  mimeType: string;
  body: Buffer;
};

export type StoredObject = {
  storageKey: string;
  sizeBytes: number;
};

export interface StorageProvider {
  put(input: PutObjectInput): Promise<StoredObject>;
  getStream(storageKey: string): Promise<Readable>;
  delete(storageKey: string): Promise<void>;
  /** Local adapter returns an internal path marker; cloud would return signed URL later */
  signedUrl(storageKey: string): Promise<string>;
}

function storageRoot() {
  return (
    process.env.STORAGE_ROOT ??
    path.join(process.cwd(), "storage")
  );
}

export class LocalStorageProvider implements StorageProvider {
  private root: string;

  constructor(root = storageRoot()) {
    this.root = root;
    if (!existsSync(this.root)) {
      mkdirSync(this.root, { recursive: true });
    }
  }

  private abs(storageKey: string) {
    const full = path.join(this.root, storageKey);
    if (!full.startsWith(this.root)) {
      throw new Error("Invalid storage key");
    }
    return full;
  }

  async put(input: PutObjectInput): Promise<StoredObject> {
    const safeName = input.filename.replace(/[^a-zA-Z0-9._-]+/g, "_");
    const storageKey = path
      .join(input.organizationId, `${randomUUID()}-${safeName}`)
      .replace(/\\/g, "/");
    const abs = this.abs(storageKey);
    mkdirSync(path.dirname(abs), { recursive: true });
    await writeFile(abs, input.body);
    return { storageKey, sizeBytes: input.body.byteLength };
  }

  async getStream(storageKey: string): Promise<Readable> {
    const abs = this.abs(storageKey);
    await open(abs, "r").then((fh) => fh.close());
    return createReadStream(abs);
  }

  async delete(storageKey: string): Promise<void> {
    const abs = this.abs(storageKey);
    if (existsSync(abs)) await unlink(abs);
  }

  async signedUrl(storageKey: string): Promise<string> {
    return `/api/v1/files/download?key=${encodeURIComponent(storageKey)}`;
  }
}

let singleton: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (singleton) return singleton;
  const driver = process.env.STORAGE_DRIVER ?? "local";
  if (driver === "local") {
    singleton = new LocalStorageProvider();
  } else {
    singleton = new LocalStorageProvider();
  }
  return singleton;
}
