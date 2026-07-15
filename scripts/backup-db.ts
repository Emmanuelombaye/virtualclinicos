import { copyFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

/**
 * Dev-grade SQLite backup: copy prisma/dev.db → storage/backups/dev-YYYYMMDD-HHMMSS.db
 * Restore: copy the backup back over prisma/dev.db (stop the app first).
 */
function main() {
  const root = process.cwd();
  const src =
    process.env.DATABASE_URL?.replace(/^file:/, "") ??
    path.join(root, "prisma", "dev.db");
  const absSrc = path.isAbsolute(src) ? src : path.join(root, src);
  if (!existsSync(absSrc)) {
    console.error("No database file at", absSrc);
    process.exit(1);
  }
  const dir = path.join(root, "storage", "backups");
  mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dest = path.join(dir, `dev-${stamp}.db`);
  copyFileSync(absSrc, dest);
  console.log("Backup written:", dest);
}

main();
