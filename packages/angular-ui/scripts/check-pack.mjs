import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const temp = await mkdtemp(path.join(tmpdir(), "openui-angular-ui-pack-"));
try {
  execFileSync("pnpm", ["pack", "--pack-destination", temp], { cwd: root, stdio: "pipe" });
  const archive = (await readdir(temp)).find((file) => file.endsWith(".tgz"));
  assert.ok(archive, "pnpm pack must produce an archive");
  const file = path.join(temp, archive);
  const entries = execFileSync("tar", ["-tzf", file], { encoding: "utf8" });
  for (const required of [
    "fesm2022/openuidev-angular-ui.mjs",
    "types/openuidev-angular-ui.d.ts",
    "styles/index.css",
    "LICENSE",
    "CODE-THEME-LICENSE",
    "README.md",
  ]) {
    assert.ok(entries.includes(`package/${required}`), `Missing ${required}`);
  }
  const manifest = JSON.parse(
    execFileSync("tar", ["-xOzf", file, "package/package.json"], { encoding: "utf8" }),
  );
  assert.equal(manifest.exports["./styles/index.css"].default, "./styles/index.css");
  assert.equal(manifest.publishConfig, undefined);
  assert.equal(manifest.devDependencies, undefined);
  for (const [name, version] of Object.entries({
    ...manifest.dependencies,
    ...manifest.peerDependencies,
  })) {
    assert.ok(!/react|zustand|recharts/i.test(name), `Unexpected React dependency: ${name}`);
    assert.ok(
      !/^(workspace|catalog|file|link):/.test(version),
      `Unresolved package protocol: ${name}`,
    );
  }
  const runtime = execFileSync(
    "tar",
    ["-xOzf", file, "package/fesm2022/openuidev-angular-ui.mjs"],
    { encoding: "utf8" },
  );
  assert.ok(!/(?:from\s*|import\s*\()["'][^"']*(?:react|recharts|zustand)/.test(runtime));
  console.info(
    "Angular UI archive: runtime, declarations, CSS, license and React-free imports verified.",
  );
} finally {
  await rm(temp, { recursive: true, force: true });
}
