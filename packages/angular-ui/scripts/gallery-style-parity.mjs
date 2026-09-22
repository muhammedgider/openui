// Compare the RUNNING Angular gallery to a separately bundled, test-only React reference.
// No React files are served by the Angular example or imported by the production library.
import { chromium } from "@playwright/test";
import { build } from "esbuild";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { compile } from "sass";
import {
  baseSamples,
  chatSamples,
} from "../../../examples/app-frameworks/angular/src/app/gallery/gallery-data.ts";
const root = fileURLToPath(new URL("../", import.meta.url));
const repo = path.resolve(root, "../..");
const assets = path.join(repo, "examples/app-frameworks/angular/public");
const out = path.join(repo, "dist/angular-ui-gallery-parity");
await mkdir(out, { recursive: true });
const reactRequire = createRequire(path.join(repo, "packages/react-ui/package.json"));
await build({
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  splitting: true,
  outdir: out,
  nodePaths: [path.join(root, "node_modules"), path.join(repo, "packages/react-ui/node_modules")],
  logLevel: "warning",
  loader: { ".scss": "empty" },
  entryPoints: { react: path.join(root, "e2e/react-reference.tsx") },
  jsx: "automatic",
  alias: {
    react: reactRequire.resolve("react"),
    "react-dom/client": reactRequire.resolve("react-dom/client"),
    "react-dom": reactRequire.resolve("react-dom"),
    "react/jsx-runtime": reactRequire.resolve("react/jsx-runtime"),
  },
  define: { "process.env.NODE_ENV": '"production"' },
});
await writeFile(
  path.join(out, "react.css"),
  compile(path.join(repo, "packages/react-ui/src/components/index.scss"), {
    style: "compressed",
    silenceDeprecations: ["legacy-js-api", "import", "global-builtin", "color-functions"],
  }).css,
);
const preflight = await readFile(
  path.join(repo, "packages/react-ui/.storybook/preflight.css"),
  "utf8",
);
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname === "/reference") {
      const theme = url.searchParams.get("theme");
      res.setHeader("Content-Type", "text/html");
      res.end(
        `<!doctype html><html lang="en"><head><meta charset="utf-8"><link rel="stylesheet" href="/react.css"><link rel="stylesheet" href="/fonts/inter.css"><style>${preflight}\nbody{margin:0;font-family:'Inter',sans-serif}.surface{font:var(--openui-text-body-default);color:var(--openui-text-neutral-primary);background:var(--openui-background);min-height:32px;padding:8px 0 20px}app-fixture{display:contents}*,*::before,*::after{animation:none!important;transition:none!important}</style></head><body><div class="surface" id="surface"><app-fixture></app-fixture></div><script type="module" src="/react.js"></script></body></html>`,
      );
      return;
    }
    const folder =
      url.pathname.startsWith("/fonts/") || url.pathname === "/openui-preview.svg" ? assets : out;
    const filename = path.resolve(folder, "." + decodeURIComponent(url.pathname));
    if (!filename.startsWith(folder + path.sep)) {
      res.writeHead(403).end();
      return;
    }
    res.setHeader(
      "Content-Type",
      filename.endsWith(".js")
        ? "text/javascript"
        : filename.endsWith(".css")
          ? "text/css"
          : filename.endsWith(".svg")
            ? "image/svg+xml"
            : filename.endsWith(".woff2")
              ? "font/woff2"
              : "application/octet-stream",
    );
    res.end(await readFile(filename));
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const reference = `http://127.0.0.1:${server.address().port}`;
const gallery = process.env.GALLERY_URL ?? "http://127.0.0.1:4207";
const cases = [
  ...Object.entries(baseSamples).map(([name, sample]) => ({ mode: "base", name, sample })),
  ...Object.entries(chatSamples).map(([name, sample]) => ({ mode: "chat", name, sample })),
].filter((c) => !process.env.STYLE_CASES || process.env.STYLE_CASES.split(",").includes(c.name));
const properties = [
  "backgroundColor",
  "backgroundImage",
  "borderTopColor",
  "borderTopWidth",
  "borderTopStyle",
  "borderRadius",
  "boxShadow",
  "padding",
  "gap",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "lineHeight",
  "letterSpacing",
  "color",
  "boxSizing",
];
function inspect(root, properties) {
  const tokens = Object.fromEntries(
    [...getComputedStyle(root)]
      .filter((k) => k.startsWith("--openui-"))
      .sort()
      .map((k) => [
        k,
        getComputedStyle(root).getPropertyValue(k).trim().replace(/\s+/g, " ").replaceAll('"', "'"),
      ]),
  );
  const counts = {};
  const elements = {};
  for (const el of [root, ...root.querySelectorAll("[class]")]) {
    if (!(el instanceof HTMLElement) || !el.getClientRects().length) continue;
    const classes = [...el.classList]
      .filter((c) => c.startsWith("openui-") && !c.startsWith("openui-angular"))
      .sort();
    if (!classes.length) continue;
    const signature = classes.join(" ");
    const index = counts[signature] ?? 0;
    counts[signature] = index + 1;
    const style = getComputedStyle(el);
    // A zero-width border is invisible whether its declared style is solid or none.
    elements[`${signature}#${index}`] = Object.fromEntries(
      properties.map((p) => [
        p,
        p === "borderTopStyle" && style.borderTopWidth === "0px" ? "none" : style[p],
      ]),
    );
  }
  return {
    tokens,
    elements,
    interLoaded: [...document.fonts].some(
      (f) => f.family.replaceAll('"', "").replaceAll("'", "") === "Inter" && f.status === "loaded",
    ),
  };
}
const report = {
  scope:
    "68 gallery samples (62 base + 6 chat-specific), static initial state / modal open. Includes upstream Storybook preflight and self-hosted Inter. Not all interaction states or chart geometry are certified.",
  expected: cases.length * 4,
  completed: false,
  results: [],
  pageErrors: [],
};
let browser;
try {
  browser = await chromium.launch({
    channel: process.env.PLAYWRIGHT_CHANNEL ?? "chrome",
    headless: true,
  });
  const angularPage = await browser.newPage();
  const reactPage = await browser.newPage();
  for (const [framework, page] of [
    ["angular", angularPage],
    ["react", reactPage],
  ]) {
    page.on("pageerror", (e) => report.pageErrors.push({ framework, error: e.message }));
    page.setDefaultTimeout(12000);
  }
  for (const width of [390, 1000])
    for (const theme of ["light", "dark"])
      for (const { mode, name, sample } of cases) {
        const id = `${mode}-${name}-${theme}-${width}`;
        try {
          await Promise.all([
            angularPage.setViewportSize({ width, height: 1000 }),
            reactPage.setViewportSize({ width, height: 1000 }),
          ]);
          await angularPage.goto(`${gallery}/?catalog=${mode}&component=${name}&theme=${theme}`);
          await angularPage.locator(`[data-example="${name}"] .preview`).waitFor();
          await angularPage.addStyleTag({
            content: "*,*::before,*::after{animation:none!important;transition:none!important}",
          });
          await angularPage.evaluate(() => document.fonts.ready);
          if (sample.launchState)
            await angularPage.getByRole("button", { name: "Open modal", exact: true }).click();
          const target = sample.launchState
            ? ".openui-modal-content"
            : `[data-example="${name}"] .preview`;
          const aRoot = angularPage.locator(target);
          await aRoot.waitFor({ state: "visible" });
          const bounds = await aRoot.boundingBox();
          const params = new URLSearchParams({
            theme,
            library: mode,
            source: sample.source,
            state: JSON.stringify(sample.launchState ?? sample.initialState ?? {}),
          });
          await reactPage.goto(`${reference}/reference?${params}`);
          await reactPage.waitForFunction(() => window.ready === true);
          await reactPage
            .locator("#surface")
            .evaluate((el, width) => (el.style.width = `${width}px`), bounds.width);
          await reactPage.evaluate(() => document.fonts.ready);
          await Promise.all([
            angularPage.waitForLoadState("networkidle"),
            reactPage.waitForLoadState("networkidle"),
          ]);
          const rRoot = reactPage.locator(
            sample.launchState ? ".openui-modal-content" : "#surface",
          );
          await rRoot.waitFor({ state: "visible" });
          await reactPage.locator("#surface").evaluate((el) => {
            document.body.style.background =
              getComputedStyle(el).getPropertyValue("--openui-background");
          });
          // Match the host's fractional clipping origin; do not shift component
          // content or loosen the pixel threshold to hide genuine differences.
          if (!sample.launchState) {
            const origin = await aRoot.boundingBox();
            await rRoot.evaluate((el, origin) => {
              el.style.marginTop = `${origin.y % 1}px`;
              el.style.marginLeft = `${origin.x % 1}px`;
            }, origin);
          }
          const a = await aRoot.evaluate(inspect, properties),
            r = await rRoot.evaluate(inspect, properties);
          const tokenDiff = Object.keys(r.tokens)
            .filter((k) => a.tokens[k] !== r.tokens[k])
            .map((k) => ({ token: k, angular: a.tokens[k], react: r.tokens[k] }));
          const differences = [];
          let matched = 0;
          for (const [key, expected] of Object.entries(r.elements)) {
            if (!a.elements[key]) continue;
            matched++;
            for (const p of properties)
              if (a.elements[key][p] !== expected[p])
                differences.push({
                  element: key,
                  property: p,
                  angular: a.elements[key][p],
                  react: expected[p],
                });
          }
          const onlyAngular = Object.keys(a.elements).filter((k) => !r.elements[k]),
            onlyReact = Object.keys(r.elements).filter((k) => !a.elements[k]);
          const captureA = PNG.sync.read(
            await aRoot.screenshot({ path: path.join(out, `${id}-angular.png`) }),
          );
          const captureR = PNG.sync.read(
            await rRoot.screenshot({ path: path.join(out, `${id}-react.png`) }),
          );
          const w = Math.max(captureA.width, captureR.width),
            h = Math.max(captureA.height, captureR.height);
          const paddedA = new PNG({ width: w, height: h }),
            paddedR = new PNG({ width: w, height: h }),
            diff = new PNG({ width: w, height: h });
          PNG.bitblt(captureA, paddedA, 0, 0, captureA.width, captureA.height, 0, 0);
          PNG.bitblt(captureR, paddedR, 0, 0, captureR.width, captureR.height, 0, 0);
          const changed = pixelmatch(paddedA.data, paddedR.data, diff.data, w, h, {
            threshold: 0.1,
          });
          await writeFile(path.join(out, `${id}-diff.png`), PNG.sync.write(diff));
          const parserErrors = {
            angular: await angularPage.locator("[data-render-error]").allTextContents(),
            react: await reactPage.evaluate(() => window.errors),
          };
          const result = {
            id,
            tokenCount: Object.keys(r.tokens).length,
            tokenDiff,
            matched,
            differences,
            onlyAngular,
            onlyReact,
            fonts: { angular: a.interLoaded, react: r.interLoaded },
            sizes: {
              angular: [captureA.width, captureA.height],
              react: [captureR.width, captureR.height],
            },
            pixelDifference: changed / (w * h),
            parserErrors,
          };
          report.results.push(result);
          console.log(
            `${id}: ${differences.length} style / ${tokenDiff.length} token differences; pixels ${(result.pixelDifference * 100).toFixed(2)}%`,
          );
        } catch (error) {
          report.results.push({ id, error: String(error) });
          console.error(id, String(error));
        }
      }
  report.completed = report.results.length === report.expected;
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
  await writeFile(
    path.join(out, process.env.STYLE_REPORT ?? "report.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
}
const failed = report.results.filter(
  (r) =>
    r.error ||
    r.tokenDiff.length ||
    r.differences.length ||
    !r.fonts.angular ||
    r.pixelDifference > 0.005 ||
    r.parserErrors.angular.length ||
    r.parserErrors.react?.length,
);
console.log(
  JSON.stringify({
    completed: report.completed,
    total: report.results.length,
    failed: failed.length,
    pageErrors: report.pageErrors.length,
  }),
);
if (failed.length || report.pageErrors.length) process.exitCode = 1;
