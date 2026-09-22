import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import ts from "typescript";

const root = new URL("../", import.meta.url);
async function members(relativePath, variable) {
  const text = await readFile(new URL(relativePath, root), "utf8");
  const source = ts.createSourceFile(
    relativePath,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  let result;
  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      node.name.getText(source) === variable &&
      node.initializer &&
      ts.isCallExpression(node.initializer)
    ) {
      const config = node.initializer.arguments[0];
      assert.ok(
        config && ts.isObjectLiteralExpression(config),
        `${variable} must use an object literal`,
      );
      const components = config.properties.find(
        (property) =>
          ts.isPropertyAssignment(property) && property.name.getText(source) === "components",
      );
      assert.ok(
        components && ts.isArrayLiteralExpression(components.initializer),
        `${variable}.components must be an explicit array`,
      );
      result = components.initializer.elements.map((element) => element.getText(source));
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.ok(result, `Missing ${variable}`);
  assert.equal(new Set(result).size, result.length, `Duplicate ${variable} entries`);
  return result;
}
const react = await members("../react-ui/src/genui-lib/openuiLibrary.tsx", "openuiLibrary");
const angular = await members("src/genui-lib/index.ts", "openuiLibrary");
assert.ok(
  angular.every((name) => react.includes(name)),
  "Angular catalog contains an unexpected upstream symbol",
);
const dataEntries = new Set([
  "Series",
  "Slice",
  "Point",
  "ScatterSeries",
  "Col",
  "SelectItem",
  "CheckBoxItem",
  "RadioItem",
  "SwitchItem",
  "TabItem",
  "AccordionItem",
  "ChipItem",
  "OptionCard",
  "StepsItem",
  "ListItem",
  "SnippetCardItem",
  "OverviewCardItem",
  "ContextCardItem",
  "VisualCardItem",
  "CompositeCardItem",
]);
const chartEntries = [
  "BarChartCondensed",
  "LineChartCondensed",
  "AreaChartCondensed",
  "HorizontalBarChart",
  "PieChart",
  "RadialChart",
  "RadarChart",
  "ScatterChart",
  "SingleStackedBarChart",
];
const partialEntries = new Set([
  ...chartEntries,
  "EditableTable",
  "DatePicker",
  "Slider",
  "CompositeCardBlock",
  "CompositeCardItem",
  "Modal",
  "Carousel",
]);
const chat = await members("src/genui-lib/chat.ts", "openuiChatLibrary");
const upstreamChat = await members(
  "../react-ui/src/genui-lib/openuiChatLibrary.tsx",
  "openuiChatLibrary",
);
assert.deepEqual([...chat].sort(), [...upstreamChat].sort(), "Chat registry differs from upstream");
const status = {
  scope: "openuiLibrary exported component symbols, not the complete react-ui primitive API",
  upstreamEntries: react.length,
  angularEntries: angular.length,
  angularVisualRenderers: angular.filter((name) => !dataEntries.has(name)).length,
  angularDataRecords: angular.filter((name) => dataEntries.has(name)).length,
  visualParityVerified: false,
  chatLibraryExported: true,
  angularChatEntries: chat.length,
  upstreamChatEntries: upstreamChat.length,
  chatVisualParityVerified: false,
  chatLimitations:
    "Sources strip/citation hover behavior, nonfoldable SectionV2 appearance, and comprehensive nested-container/streaming parity are not certified.",
  entries: react.map((symbol) => ({
    symbol,
    implementation: !angular.includes(symbol)
      ? "missing"
      : partialEntries.has(symbol)
        ? "partial"
        : "implemented-unverified",
    ...(partialEntries.has(symbol)
      ? {
          limitation: chartEntries.includes(symbol)
            ? "Native SVG data rendering exists, but upstream layout, palettes, tooltip/sidebar, loading, export and edge-case behavior are not equivalent."
            : symbol === "EditableTable"
              ? "Basic edit/reset/save works; date/select editor presentation, scroll controls and complete keyboard parity remain incomplete."
              : symbol === "DatePicker"
                ? "Single/range calendar works; range selection details, dropdown styling, collision/focus parity and RTL remain incomplete."
                : symbol === "Slider"
                  ? "Reactive, keyboard/pointer, shared Angular select and debounced value handling exist; large-step-list handling and exhaustive validation/drag parity remain incomplete."
                  : "Content unions now include charts/EditableTable where applicable; the referenced renderers remain partial.",
        }
      : {}),
  })),
};
const serialized = JSON.stringify(status, null, 2) + "\n";
const output = new URL("catalog-status.json", root);
if (process.argv.includes("--check")) {
  assert.equal(
    await readFile(output, "utf8"),
    serialized,
    "Catalog inventory is stale; run pnpm catalog:write",
  );
  console.info("Catalog inventory matches the source registries.");
} else {
  await writeFile(output, serialized);
  console.info(
    `Recorded ${angular.length}/${react.length} catalog entries (${status.angularVisualRenderers} visual renderers, ${status.angularDataRecords} data records). No full parity claim.`,
  );
}
