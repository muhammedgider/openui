import { readFile, writeFile } from "node:fs/promises";
import ts from "typescript";
const root = new URL("../", import.meta.url);
const entries = [
  ["Series", null],
  ["Slice", null],
  ["Point", null],
  ["ScatterSeries", null],
  ["BarChartCondensed", "OpenUiBarChartComponent"],
  ["LineChartCondensed", "OpenUiLineChartComponent"],
  ["AreaChartCondensed", "OpenUiAreaChartComponent"],
  ["HorizontalBarChart", "OpenUiHorizontalChartComponent"],
  ["PieChart", "OpenUiPieChartComponent"],
  ["RadialChart", "OpenUiRadialChartComponent"],
  ["RadarChart", "OpenUiRadarChartComponent"],
  ["ScatterChart", "OpenUiScatterChartComponent"],
  ["SingleStackedBarChart", "OpenUiStackedChartComponent"],
];
let output = `// Schemas synchronized from the same-revision upstream catalog; rendering is Angular-only.\nimport {defineComponent} from '@openuidev/angular-lang';\nimport {z} from 'zod/v4';\nimport {OpenUiDataRecordComponent} from '../components/content';\nimport {${entries
  .filter((e) => e[1])
  .map((e) => e[1])
  .join(",")}} from '../components/charts';\n`;
for (const [symbol, view] of entries) {
  const text = await readFile(
    new URL(`../react-ui/src/genui-lib/Charts/${symbol}.ts`, root),
    "utf8",
  );
  const source = ts.createSourceFile(symbol, text, ts.ScriptTarget.Latest, true);
  const declarations = [];
  const visit = (n) => {
    if (ts.isVariableDeclaration(n)) declarations.push(n);
    ts.forEachChild(n, visit);
  };
  visit(source);
  const schema = declarations.find((n) => n.name.getText(source) === symbol + "Schema");
  if (!schema?.initializer) throw new Error("Missing schema " + symbol);
  const def = declarations.find((n) => n.name.getText(source) === symbol);
  const config = def.initializer.arguments[0];
  const name = config.properties
    .find((p) => p.name?.getText(source) === "name")
    .initializer.getText(source);
  output += `export const ${symbol}Schema=${schema.initializer.getText(source)};\nexport const ${symbol}=defineComponent({name:${name},props:${symbol}Schema,description:${JSON.stringify(view ? "Native SVG chart. Visual parity with the React reference is not certified." : "Chart data record.")},component:${view ?? "OpenUiDataRecordComponent"}});\n`;
}
await writeFile(new URL("src/genui-lib/charts.ts", root), output);
