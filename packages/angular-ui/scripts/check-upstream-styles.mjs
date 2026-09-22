import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
const root = new URL("../", import.meta.url);
const provenance = JSON.parse(await readFile(new URL("style-provenance.json", root), "utf8"));
for (const [file, sha] of Object.entries(provenance.files)) {
  for (const directory of ["src/styles/upstream/", "../react-ui/src/"]) {
    const actual = createHash("sha256")
      .update(await readFile(new URL(directory + file, root)))
      .digest("hex");
    assert.equal(
      actual,
      sha,
      `Style snapshot drift: ${directory}${file}. Review upstream and run pnpm styles:sync deliberately.`,
    );
  }
}
console.info(`Verified ${Object.keys(provenance.files).length} upstream style snapshots.`);
