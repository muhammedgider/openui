import { readFile, writeFile } from "node:fs/promises";
import ts from "typescript";
const root = new URL("../", import.meta.url);
const text = await readFile(
  new URL("../react-ui/src/genui-lib/prompt-options/index.ts", root),
  "utf8",
);
const source = ts.createSourceFile("prompt.ts", text, ts.ScriptTarget.Latest, true);
const names = new Set([
  "openuiChatExamples",
  "openuiChatAdditionalRules",
  "openuiChatPromptOptions",
]);
const statements = source.statements.filter(
  (n) =>
    ts.isVariableStatement(n) &&
    n.declarationList.declarations.some((d) => names.has(d.name.getText(source))),
);
if (statements.length !== 3) throw new Error("Unexpected upstream prompt data layout");
await writeFile(
  new URL("src/genui-lib/chat-prompt-options.ts", root),
  `import type {PromptOptions} from '@openuidev/angular-lang';\n${statements.map((s) => s.getText(source)).join("\n")}\n`,
);
