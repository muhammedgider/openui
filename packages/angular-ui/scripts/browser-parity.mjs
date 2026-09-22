import { chromium, expect } from "@playwright/test";
import { build } from "esbuild";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { compile } from "sass";

const root = fileURLToPath(new URL("../", import.meta.url));
const repo = path.resolve(root, "../..");
const out = path.join(repo, "dist/angular-ui-parity");
await mkdir(out, { recursive: true });
const reactRequire = createRequire(path.join(repo, "packages/react-ui/package.json"));
const paths = [path.join(root, "node_modules"), path.join(repo, "packages/react-ui/node_modules")];
const common = {
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  splitting: true,
  outdir: out,
  nodePaths: paths,
  logLevel: "warning",
  loader: { ".scss": "empty" },
};
await build({
  ...common,
  entryPoints: { angular: path.join(root, "e2e/angular-fixture.ts") },
  alias: {
    "@openuidev/angular-lang": path.join(
      repo,
      "dist/angular-lang/fesm2022/openuidev-angular-lang.mjs",
    ),
  },
  tsconfigRaw: { compilerOptions: { experimentalDecorators: true } },
});
await build({
  ...common,
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
  compile(path.join(repo, "packages/react-ui/src/components/index.scss"), { style: "compressed" })
    .css,
);
await writeFile(
  path.join(out, "angular.css"),
  await readFile(path.join(repo, "dist/angular-ui/styles/index.css")),
);
const { cardCases } = await import("../e2e/card-cases.ts");
const { overlayCases } = await import("../e2e/overlay-cases.ts");
const { advancedCases } = await import("../e2e/advanced-cases.ts");
const cases = [
  ...advancedCases,
  ...cardCases,
  ...overlayCases,
  [
    "choices",
    'root = Card([Chips("tags", "multiple", [ChipItem("a", "Alpha", Icon("rocket")), ChipItem("b", "Beta"), ChipItem("c", "Disabled", null, true)], null, ["a"]), OptionCards("plan", "single", [OptionCard("a", "**Basic**", "Individual", Icon("user")), OptionCard("b", "Pro", "Team", Icon("users")), OptionCard("c", "Enterprise", "Business", null, true)], null, "b")])',
  ],
  [
    "steps",
    'root = Steps([StepsItem("Install", "Run **install**"), StepsItem("Render", "Use `Renderer`")])',
  ],
  ["code", 'root = CodeBlock("javascript", "const value = 42;")'],
  ["image", 'root = Image("Preview", "/fixture-image.svg")'],
  [
    "markdown-code",
    `root = MarkDownRenderer(${JSON.stringify("Example:\n\n```javascript\nconst value = 42;\n```\n\n> A short quote")})`,
  ],
  [
    "typography",
    'root = Card([CardHeader("Account", "Profile details"), Text("text", "Plain text"), BoldText("number", "42", "+12%", "metric", "lg"), Text("text", "Hello **bold** and *italic*"), TagBlock(["Angular", "OpenUI"]), Buttons([Button("Continue"), Button("Cancel", null, "secondary")])])',
  ],
  [
    "form",
    'root = Form("profile", Buttons([Button("Submit")]), [FormControl("Email", Input("email", "Email address", "email", {required: true, email: true}), "Required"), FormControl("Notes", TextArea("notes", "Details", 3)), FormControl("Country", Select("country", [SelectItem("tr", "Turkey"), SelectItem("uk", "United Kingdom")], "Country"))])',
  ],
  [
    "selection",
    'root = Stack([CheckBoxGroup("features", [CheckBoxItem("Analytics", "Usage reports", "analytics", true), CheckBoxItem("Exports", "CSV exports", "exports")]), RadioGroup("plan", [RadioItem("Basic", "Individual", "basic"), RadioItem("Pro", "Team", "pro")], "basic"), SwitchGroup("notifications", [SwitchItem("Email", "Updates", "email", true)], "sunk")])',
  ],
  [
    "navigation",
    'root = Card([Tabs([TabItem("a", "First", [Text("text", "One")]), TabItem("b", "Second", [Text("text", "Two")])]), Accordion([AccordionItem("a", "Setup", [Text("text", "Install")]), AccordionItem("b", "Usage", [Text("text", "Render")])])])',
  ],
  ["table", 'root = Table([Col("Name", ["Ada", "Grace"]), Col("Value", [42, 27])])'],
  [
    "rich",
    'root = Card([InlineHeader("**Overview**", "Account summary"), TextCallout("info", "Note", "Details"), Tag("Ready", Icon("circle-check"), "md", "success"), IconText(Icon("rocket"), "neutral", "m", "Launch", "Soon"), MetricIndicatorInline("42", "active", {direction: "up", value: 12}), MetricIndicatorWithStrikethrough("$9", "per month", "$12")])',
  ],
  [
    "markdown",
    `root = MarkDownRenderer(${JSON.stringify("## Heading\n\nHello **bold** and [OpenUI](https://openui.com).\n\n- One\n- Two")})`,
  ],
].filter(([name]) => !process.env.PARITY_CASE || process.env.PARITY_CASE.split(",").includes(name));
if (!cases.length) throw new Error("No matching parity fixtures");
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname === "/fixture-image.svg") {
      res.setHeader("Content-Type", "image/svg+xml");
      res.end(
        '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"><rect width="120" height="80" fill="#4a78a5"/></svg>',
      );
      return;
    }
    if (url.pathname === "/angular" || url.pathname === "/react") {
      const framework = url.pathname.slice(1);
      const theme = url.searchParams.get("theme") === "dark" ? "dark" : "light";
      res.setHeader("Content-Type", "text/html");
      res.end(
        `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/${framework}.css"><style>body{margin:0;padding:20px;background:${theme === "dark" ? "#171717" : "#ffffff"};}#surface{font:var(--openui-text-body-default);color:var(--openui-text-neutral-primary);min-height:16px}app-fixture{display:contents}*,*::before,*::after{animation:none!important;transition:none!important}</style></head><body><div id="surface" class="surface openui-theme" data-openui-theme="${theme}"><app-fixture></app-fixture></div><script type="module" src="/${framework}.js"></script></body></html>`,
      );
      return;
    }
    const filename = path.resolve(out, "." + decodeURIComponent(url.pathname));
    if (!filename.startsWith(out + path.sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    res.setHeader(
      "Content-Type",
      filename.endsWith(".js")
        ? "text/javascript"
        : filename.endsWith(".css")
          ? "text/css"
          : "application/octet-stream",
    );
    res.end(await readFile(filename));
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
const report = {
  scope: "Paired static fixtures and selected interactions, not complete catalog certification",
  expectedComparisons: cases.length * 4,
  completed: false,
  comparisons: [],
  interactions: [],
  pageErrors: [],
};
try {
  browser = await chromium.launch({
    channel: process.env.PLAYWRIGHT_CHANNEL ?? "chrome",
    headless: true,
  });
  for (const width of [390, 1000])
    for (const theme of ["light", "dark"])
      for (const [name, source] of cases) {
        const captures = [];
        for (const framework of ["react", "angular"]) {
          const page = await browser.newPage({
            viewport: { width, height: 1000 },
            deviceScaleFactor: 1,
          });
          page.on("pageerror", (error) =>
            report.pageErrors.push({ name, framework, error: error.message }),
          );
          await page.goto(
            `${base}/${framework}?theme=${theme}&library=${name.startsWith("chat-") ? "chat" : "base"}&source=${encodeURIComponent(source)}&state=${encodeURIComponent(JSON.stringify(name === "modal" ? { $modalOpen: true } : {}))}`,
          );
          await page.waitForFunction(() => window.ready === true);
          if (name === "modal") {
            try {
              await expect(page.getByRole("dialog")).toBeVisible();
            } catch (error) {
              await writeFile(
                path.join(out, `${name}-${framework}-failure.html`),
                await page.content(),
              );
              console.error(framework, await page.evaluate(() => window.errors));
              throw error;
            }
          } else await page.waitForSelector('#surface [class*="openui-"]');
          await page.evaluate(() => document.fonts.ready);
          await page.waitForLoadState("networkidle");
          if (name === "markdown") {
            await expect(page.locator("h2")).toHaveText("Heading");
            await expect(page.locator("li")).toHaveCount(2);
          }
          const errors = await page.evaluate(() => window.errors);
          if (errors?.length) report.pageErrors.push({ name, framework, errors });
          if (name === "markdown-code" && width === 390 && theme === "light") {
            await writeFile(
              path.join(out, `${name}-${framework}-dom.json`),
              JSON.stringify(
                await page.locator("#surface").evaluate((surface) => ({
                  html: surface.innerHTML,
                  quoteNodes: Array.from(surface.querySelectorAll("blockquote, blockquote *")).map(
                    (n) => {
                      const b = getComputedStyle(n, "::before"),
                        a = getComputedStyle(n, "::after"),
                        s = getComputedStyle(n);
                      return {
                        tag: n.tagName,
                        before: b.content,
                        after: a.content,
                        margin: s.margin,
                        padding: s.padding,
                        font: s.font,
                        display: s.display,
                        rect: n.getBoundingClientRect().toJSON(),
                      };
                    },
                  ),
                  textRects: Array.from(surface.querySelectorAll("blockquote p")).map((p) => {
                    const before = getComputedStyle(p, "::before");
                    const after = getComputedStyle(p, "::after");
                    const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
                    const texts = [];
                    while (walker.nextNode()) {
                      const r = document.createRange();
                      r.selectNode(walker.currentNode);
                      const b = r.getBoundingClientRect();
                      texts.push({
                        text: walker.currentNode.textContent,
                        x: b.x,
                        y: b.y,
                        width: b.width,
                      });
                    }
                    return {
                      texts,
                      before: {
                        content: before.content,
                        font: before.font,
                        margin: before.margin,
                        verticalAlign: before.verticalAlign,
                      },
                      after: { content: after.content, font: after.font, margin: after.margin },
                    };
                  }),
                  nodes: Array.from(
                    surface.querySelectorAll(
                      "p,blockquote,code,.openui-code-block-wrapper,.openui-code-block-syntax-highlighter",
                    ),
                  ).map((node) => {
                    const s = getComputedStyle(node);
                    const r = node.getBoundingClientRect();
                    return {
                      tag: node.tagName,
                      class: node.className,
                      text: node.textContent,
                      top: r.top,
                      height: r.height,
                      display: s.display,
                      margin: s.margin,
                      padding: s.padding,
                      font: s.font,
                    };
                  }),
                })),
                null,
                2,
              ),
            );
          }
          if (name === "gallery-modal") {
            await page.locator(".openui-gallery__image").nth(1).click();
            await expect(page.getByRole("dialog")).toBeVisible();
            await page.waitForLoadState("networkidle");
          }
          const capture =
            name === "modal" || name === "gallery-modal" ? page : page.locator("#surface");
          const png = PNG.sync.read(
            await capture.screenshot({
              path: path.join(out, `${name}-${theme}-${width}-${framework}.png`),
            }),
          );
          if (name === "modal") {
            await expect(page.getByRole("dialog")).toBeVisible();
            await page.keyboard.press("Escape");
            await expect(page.getByRole("dialog")).not.toBeVisible();
            report.interactions.push({
              framework,
              scenario: "modal Escape dismissal",
              passed: true,
            });
          }
          if (name === "gallery-modal") {
            await page.locator(".openui-gallery__modal-thumbnail").nth(2).click();
            await expect(page.locator(".openui-gallery__modal-main img")).toHaveAttribute(
              "alt",
              "Photo 3",
            );
            await page.getByRole("button", { name: "Close gallery", exact: true }).click();
            await expect(page.getByRole("dialog")).not.toBeVisible();
            if (framework === "angular")
              await expect(page.locator(".openui-gallery__image").nth(1)).toBeFocused();
            report.interactions.push({
              framework,
              scenario: "gallery selection, close and Angular focus restoration",
              passed: true,
            });
          }
          if (name === "carousel" && width === 390) {
            await page.locator(".openui-carousel-button-right button").click();
            await expect
              .poll(() => page.locator(".openui-carousel-content").evaluate((el) => el.scrollLeft))
              .toBeGreaterThan(0);
            await expect(page.locator(".openui-carousel-button-left button")).toBeVisible();
            report.interactions.push({ framework, scenario: "carousel next slide", passed: true });
          }
          captures.push(png);
          if (name === "context-cards" && width === 1000 && theme === "light") {
            const card = page.locator(".openui-context-card").first();
            await card.focus();
            await page.keyboard.press("Enter");
            await expect.poll(() => page.evaluate(() => window.events.length)).toBe(1);
            const event = await page.evaluate(() => window.events[0]);
            if (!JSON.stringify(event).includes("itemBgColor"))
              throw new Error("Card action lost item context");
            await page.evaluate((source) => window.configure(source, true), source);
            await expect(card).not.toHaveAttribute("role", "button");
            await card.click();
            await expect.poll(() => page.evaluate(() => window.events.length)).toBe(1);
            report.interactions.push({
              framework,
              scenario: "card keyboard activation, item context and streaming lock",
              passed: true,
            });
          }
          if (name === "form" && width === 1000 && theme === "light") {
            await page.getByRole("button", { name: "Submit", exact: true }).click();
            await expect.poll(() => page.evaluate(() => window.events.length)).toBe(0);
            await page.locator('input[name="email"]').fill("ada@example.com");
            await page.getByRole("combobox").click();
            await page.getByRole("option", { name: "Turkey", exact: true }).click();
            await page.getByRole("button", { name: "Submit", exact: true }).click();
            await expect.poll(() => page.evaluate(() => window.events.length)).toBe(1);
            report.interactions.push({
              framework,
              scenario: "form validation, selection and submit",
              passed: true,
            });
          }
          if (name === "choices" && width === 1000 && theme === "light") {
            const alpha = page.getByRole("option", { name: "Alpha", exact: true });
            await alpha.click();
            await expect(alpha).toHaveAttribute("aria-selected", "false");
            await page.getByRole("radio", { name: "Basic Individual" }).click();
            await expect(page.getByRole("radio", { name: "Pro Team" })).toHaveAttribute(
              "aria-checked",
              "false",
            );
            await page.evaluate((source) => window.configure(source, true), source);
            await expect(alpha).toBeDisabled();
            await page.evaluate((source) => window.configure(source, false), source);
            await expect(alpha).toBeEnabled();
            report.interactions.push({
              framework,
              scenario: "choice toggles and streaming lock",
              passed: true,
            });
          }
          if (name === "form" && width === 1000 && theme === "light") {
            const input = page.locator('input[name="email"]');
            await input.focus();
            await page.evaluate(() => {
              window.focusedInput = document.activeElement;
            });
            await page.evaluate(
              (source) => window.configure(source.replace('"Details"', '"Updated details"')),
              source,
            );
            await expect
              .poll(() => page.evaluate(() => window.focusedInput === document.activeElement))
              .toBe(true);
            await expect(input).toHaveValue("ada@example.com");
            report.interactions.push({
              framework,
              scenario: "input identity and value across source updates",
              passed: true,
            });
          }
          if (name === "code" && width === 1000 && theme === "light") {
            await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
            await page.locator(".openui-code-block-wrapper").hover();
            await page.getByRole("button", { name: "Copy code" }).click();
            await expect
              .poll(() => page.evaluate(() => navigator.clipboard.readText()))
              .toBe("const value = 42;");
            report.interactions.push({ framework, scenario: "code clipboard", passed: true });
          }
          if (name === "date-picker") {
            const trigger = page.locator(".openui-date-picker-renderer-floating-input-container");
            await trigger.click();
            await expect(page.locator(".openui-calendar-root")).toBeVisible();
            await page
              .locator(".openui-calendar-single-day-button")
              .filter({ hasText: /^\s*15\s*$/ })
              .first()
              .click();
            await expect(trigger).not.toContainText("Select a date");
            if (framework === "angular") {
              await page.keyboard.press("Escape");
              await expect(page.locator(".openui-calendar-root")).not.toBeVisible();
              await expect(trigger).toBeFocused();
            }
            report.interactions.push({
              framework,
              scenario: "calendar open/select and Angular Escape focus restoration",
              passed: true,
            });
          }
          if (name === "slider-continuous" || name === "slider-discrete") {
            const thumb = page.getByRole("slider").first();
            await thumb.focus();
            await page.keyboard.press("ArrowRight");
            await expect(thumb).toHaveAttribute("aria-valuenow", "40");
            report.interactions.push({ framework, scenario: "slider keyboard step", passed: true });
          }
          const finalErrors = await page.evaluate(() => window.errors);
          if (finalErrors?.length) report.pageErrors.push({ name, framework, errors: finalErrors });
          await page.close();
        }
        const [reference, actual] = captures;
        const height = Math.max(reference.height, actual.height);
        const a = new PNG({ width: reference.width, height });
        const b = new PNG({ width: reference.width, height });
        PNG.bitblt(reference, a, 0, 0, reference.width, reference.height, 0, 0);
        PNG.bitblt(actual, b, 0, 0, actual.width, actual.height, 0, 0);
        const diff = new PNG({ width: reference.width, height });
        const pixels = pixelmatch(a.data, b.data, diff.data, reference.width, height, {
          threshold: 0.1,
        });
        await writeFile(path.join(out, `${name}-${theme}-${width}-diff.png`), PNG.sync.write(diff));
        report.comparisons.push({
          name,
          theme,
          width,
          referenceHeight: reference.height,
          angularHeight: actual.height,
          differingPixels: pixels,
          differingRatio: pixels / (reference.width * height),
        });
      }
  report.completed = report.comparisons.length === report.expectedComparisons;
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
  await writeFile(path.join(out, "report.json"), JSON.stringify(report, null, 2) + "\n");
}
console.info(JSON.stringify(report, null, 2));
if (
  !report.completed ||
  report.pageErrors.length ||
  report.comparisons.some((item) => item.differingRatio > 0.005)
)
  process.exitCode = 1;
