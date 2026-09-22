import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { compile } from "sass";

const root = new URL("../", import.meta.url);
const dist = new URL("../../dist/angular-ui/", root);
const styleFile = new URL("src/styles/index.scss", root);
const defaultsFile = new URL("src/styles/upstream/openui-defaults.scss", root);
const defaults = compile(fileURLToPath(defaultsFile), { style: "expanded" }).css;
const blocks = [...defaults.matchAll(/:root\s*\{([^}]+)\}/g)].map((match) => match[1]);
if (blocks.length !== 2) throw new Error("Expected upstream light and dark token blocks");
// Explicit host-selected themes, never a global :root or OS preference override.
const theme = `.openui-theme {${blocks[0]}}\n.openui-theme[data-openui-theme="dark"] {${blocks[1]}}\n`;
const styles = compile(fileURLToPath(styleFile), { style: "expanded", charset: false }).css;
await mkdir(new URL("styles/", dist), { recursive: true });
const codeThemes = await readFile(new URL("src/styles/code-themes.css", root), "utf8");
await writeFile(new URL("styles/index.css", dist), `${theme}\n${styles}\n${codeThemes}`);
for (const file of ["LICENSE", "CODE-THEME-LICENSE", "README.md", "PORTING.md"]) {
  await copyFile(new URL(file, root), new URL(file, dist));
}
const manifestUrl = new URL("package.json", dist);
const manifest = JSON.parse(await readFile(manifestUrl, "utf8"));
delete manifest.publishConfig;
delete manifest.scripts;
delete manifest.devDependencies;
manifest.exports["./styles/index.css"] = { default: "./styles/index.css" };
manifest.sideEffects = ["**/*.css"];
await writeFile(manifestUrl, JSON.stringify(manifest, null, 2) + "\n");
