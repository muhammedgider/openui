import { readFile, writeFile } from "node:fs/promises";
import ts from "typescript";
const root = new URL("../", import.meta.url);
const source = ts.createSourceFile(
  "chat.tsx",
  await readFile(new URL("../react-ui/src/genui-lib/openuiChatLibrary.tsx", root), "utf8"),
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
const declarations = [];
const visit = (n) => {
  if (ts.isVariableDeclaration(n)) declarations.push(n);
  ts.forEachChild(n, visit);
};
visit(source);
const get = (name) => declarations.find((n) => n.name.getText(source) === name);
const library = get("openuiChatLibrary");
const config = library.initializer.arguments[0];
const components = config.properties
  .find((p) => p.name.getText(source) === "components")
  .initializer.elements.map((e) => e.getText(source));
const imports = components.filter((n) => !n.startsWith("Chat") && !n.startsWith("FollowUp"));
let out = `// Chat catalog schemas synchronized from the same upstream revision.\nimport {createLibrary,defineComponent,type ComponentGroup} from '@openuidev/angular-lang';\nimport {z} from 'zod/v4';\nimport {${imports.join(",")},ContentChildUnion} from './index';\nimport {OpenUiDataRecordComponent} from '../components/content';\nimport {OpenUiTabsComponent,OpenUiAccordionComponent} from '../components/navigation';\nimport {OpenUiCarouselComponent} from '../components/overlays';\nimport {OpenUiChatCardComponent,OpenUiFollowUpBlockComponent,OpenUiSectionBlockComponent} from '../components/chat';\nexport const CardSourceSchema=z.object({url:z.string().optional(),title:z.string(),sourceName:z.string()});\nexport const FollowUpItem=defineComponent({name:'FollowUpItem',props:z.object({text:z.string()}),description:'Clickable follow-up suggestion',component:OpenUiDataRecordComponent});\nexport const FollowUpBlock=defineComponent({name:'FollowUpBlock',props:z.object({items:z.array(FollowUpItem.ref)}),description:'Follow-up suggestions at the end of a response',component:OpenUiFollowUpBlockComponent});\nconst ChatNestedContentUnion=z.union([...ContentChildUnion.options,ListBlock.ref,FollowUpBlock.ref]);\n`;
const views = {
  ChatAccordionItem: "OpenUiDataRecordComponent",
  ChatAccordion: "OpenUiAccordionComponent",
  ChatTabItem: "OpenUiDataRecordComponent",
  ChatTabs: "OpenUiTabsComponent",
  ChatCarousel: "OpenUiCarouselComponent",
  ChatSectionItem: "OpenUiDataRecordComponent",
  ChatSectionBlock: "OpenUiSectionBlockComponent",
  ChatCard: "OpenUiChatCardComponent",
};
for (const name of [
  "ChatAccordionItem",
  "ChatAccordion",
  "ChatTabItem",
  "ChatTabs",
  "ChatCarousel",
  "ChatSectionItem",
  "ChatSectionBlock",
  "ChatCardChildUnion",
  "ChatCard",
]) {
  const node = get(name);
  if (name === "ChatCardChildUnion") {
    out += `export const ${name}=${node.initializer.getText(source)};\n`;
    continue;
  }
  const props = node.initializer.arguments[0].properties
    .filter((p) => p.name.getText(source) !== "component")
    .map((p) => p.getText(source));
  out += `export const ${name}=defineComponent({${props.join(",")},component:${views[name]}});\n`;
}
out += `export const openuiChatComponentGroups:ComponentGroup[]=${get("openuiChatComponentGroups").initializer.getText(source)};\nexport const openuiChatLibrary=${library.initializer.getText(source)};\n`;
await writeFile(new URL("src/genui-lib/chat.ts", root), out);
