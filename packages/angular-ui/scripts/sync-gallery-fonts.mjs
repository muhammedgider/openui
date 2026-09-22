// Example-only, self-hosted Inter. The library must not make font network requests.
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
const target = new URL("../../../examples/app-frameworks/angular/public/fonts/", import.meta.url);
const source =
  "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap";
const headers = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
};
async function get(url) {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return response;
}
const stylesheet = await (await get(source)).text();
const blocks = [...stylesheet.matchAll(/\/\* (latin(?:-ext)?) \*\/\s*(@font-face\s*\{[^}]+\})/g)];
if (blocks.length !== 4)
  throw new Error("Expected normal and italic Latin + Latin Extended Inter subsets");
await mkdir(target, { recursive: true });
const faces = [],
  files = {};
for (const [, subset, block] of blocks) {
  const style = block.match(/font-style:\s*(\w+)/)[1];
  const url = block.match(/url\(([^)]+)\)/)[1];
  if (!url.endsWith(".woff2")) throw new Error("Expected WOFF2");
  const name = `inter-${subset}-${style}.woff2`;
  const bytes = Buffer.from(await (await get(url)).arrayBuffer());
  if (bytes.subarray(0, 4).toString() !== "wOF2") throw new Error("Invalid WOFF2");
  await writeFile(new URL(name, target), bytes);
  files[name] = {
    url,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    bytes: bytes.length,
  };
  faces.push(block.replace(url, `./${name}`));
}
const licenseUrl = "https://raw.githubusercontent.com/google/fonts/main/ofl/inter/OFL.txt";
const license = await (await get(licenseUrl)).text();
if (!license.includes("SIL OPEN FONT LICENSE")) throw new Error("Missing OFL license");
await writeFile(new URL("OFL.txt", target), license);
await writeFile(
  new URL("inter.css", target),
  "/* Self-hosted Inter; see OFL.txt and provenance.json. */\n" + faces.join("\n") + "\n",
);
await writeFile(
  new URL("provenance.json", target),
  JSON.stringify({ source, licenseUrl, files }, null, 2) + "\n",
);
console.log(
  `Saved ${blocks.length} self-hosted Inter subsets (${Object.values(files).reduce((n, f) => n + f.bytes, 0)} bytes) and OFL license.`,
);
