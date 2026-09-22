import { copyFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(path.resolve(root, "../react-ui/package.json"));
const themes = {
  light: require("react-syntax-highlighter/dist/cjs/styles/prism/one-light.js").default,
  dark: require("react-syntax-highlighter/dist/cjs/styles/prism/vsc-dark-plus.js").default,
};
const unitless = new Set([
  "lineHeight",
  "fontWeight",
  "opacity",
  "tabSize",
  "MozTabSize",
  "WebkitTabSize",
  "zIndex",
]);
function css(theme, prefix) {
  return Object.entries(theme)
    .filter(([selector]) => !selector.startsWith(":not(pre)"))
    .map(([selector, styles]) => {
      if (selector === 'code[class*="language-"]')
        selector = "> .openui-code-block-syntax-highlighter > code";
      else if (selector === 'pre[class*="language-"]')
        selector = "> .openui-code-block-syntax-highlighter";
      else if (/^[\w-]+$/.test(selector)) selector = `.token.${selector}`;
      const declarations = Object.entries(styles)
        .map(
          ([key, value]) =>
            `${key.replace(/[A-Z]/g, (letter) => "-" + letter.toLowerCase())}:${typeof value === "number" && value !== 0 && !unitless.has(key) ? value + "px" : value}`,
        )
        .join(";");
      return `${prefix} ${selector}{${declarations}}`;
    })
    .join("\n");
}
const output =
  "/* Prism theme snapshot from react-syntax-highlighter (MIT; see CODE-THEME-LICENSE). */\n" +
  css(
    themes.light,
    '.openui-theme:not([data-openui-theme="dark"]) .openui-code-block-wrapper:not([data-code-theme="dark"])',
  ) +
  "\n" +
  css(themes.dark, '.openui-theme[data-openui-theme="dark"] .openui-code-block-wrapper') +
  "\n" +
  css(themes.dark, '.openui-theme .openui-code-block-wrapper[data-code-theme="dark"]') +
  "\n";
await writeFile(path.join(root, "src/styles/code-themes.css"), output);
await copyFile(
  path.join(path.dirname(require.resolve("react-syntax-highlighter/package.json")), "LICENSE"),
  path.join(root, "CODE-THEME-LICENSE"),
);
console.info("Wrote local Prism theme CSS and its MIT attribution; no React runtime dependency.");
