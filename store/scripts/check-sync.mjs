// Fails fast (before next build / next dev) when the shell mirror or its generated inputs
// are missing. Produce them with `npm run sync` (tools/preview/sync-store.mjs).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const store = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const need = ["public/app/index.html", "public/app/gate.js", "public/app/data/states.json", "public/app/quarantine-index.json", "src/generated/free-paths.json", "src/generated/catalog.json"];
const missing = need.filter((p) => !fs.existsSync(path.join(store, p)));
if (missing.length) {
  console.error("store: missing " + missing.join(", ") + "\n  run: npm run sync   (node ../tools/preview/sync-store.mjs)");
  process.exit(1);
}
if (!fs.readFileSync(path.join(store, "public/app/index.html"), "utf8").includes('<script src="gate.js"></script>')) {
  console.error("store: public/app/index.html is not the patched store copy — run npm run sync");
  process.exit(1);
}
console.log("store: shell mirror present (" + need.length + " inputs ok)");
