import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// Audit an installed consumer, not the OpenUI monorepo (which intentionally contains React packages).
const consumer = fileURLToPath(
  new URL("../../../examples/app-frameworks/angular/", import.meta.url),
);
const tree = JSON.parse(
  execFileSync("pnpm", ["list", "--prod", "--depth", "Infinity", "--json"], {
    cwd: consumer,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  }),
);
const names = new Set();
function visit(node) {
  if (!node || typeof node !== "object") return;
  for (const [name, dependency] of Object.entries(node.dependencies ?? {})) {
    names.add(name);
    visit(dependency);
  }
}
for (const node of tree) visit(node);
const forbidden = [...names].filter(
  (name) =>
    /^(react(?:-dom)?|recharts|zustand)$/.test(name) ||
    name.startsWith("@radix-ui/react-") ||
    name.startsWith("@openuidev/react-"),
);
assert.deepEqual(forbidden, [], `React dependencies found: ${forbidden.join(", ")}`);
console.info(
  `Consumer dependency graph: ${names.size} unique production packages; no React dependencies.`,
);

// Angular's --stats-json output is an esbuild metafile. Inspect actual bundled input modules.
const stats = JSON.parse(
  await readFile(new URL("dist/openui-angular/stats.json", `file://${consumer}/`), "utf8"),
);
const bundled = Object.keys(stats.inputs);
const reactInputs = bundled.filter((name) =>
  /(?:node_modules[\\/](?:\.pnpm[\\/])?)(?:react(?:-dom)?(?:@|[\\/])|recharts(?:@|[\\/])|zustand(?:@|[\\/])|@openuidev[+\\/]react-)/.test(
    name,
  ),
);
assert.deepEqual(reactInputs, [], `React modules in application bundle: ${reactInputs.join(", ")}`);
assert.ok(
  bundled.some((name) => name.includes("openuidev-angular-ui")),
  "Application must include Angular UI",
);
console.info(
  `Application bundle: ${bundled.length} input modules; Angular UI included, React absent.`,
);
