const fs = require("fs");
const path = require("path");

function walk(d, acc = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name === "route.ts") acc.push(p);
  }
  return acc;
}

const files = walk("src/app/api/v1");
let n = 0;
for (const f of files) {
  let c = fs.readFileSync(f, "utf8");
  const o = c;
  c = c.replace(
    'import { requireUser } from "@/lib/auth/session";',
    'import { resolveAuthWithRateLimit } from "@/lib/auth/api-key";',
  );
  c = c.replace(
    /const user = await requireUser\(\);/g,
    "const { user } = await resolveAuthWithRateLimit(req);",
  );
  if (c !== o) {
    fs.writeFileSync(f, c);
    n++;
    console.log("ok", f);
  }
}
console.log("updated", n);
