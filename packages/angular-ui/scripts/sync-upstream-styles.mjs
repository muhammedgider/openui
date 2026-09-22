import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// Explicit allowlist: never bring React implementation code into the Angular package.
const components = [
  "Card/card",
  "Button/button",
  "Buttons/buttons",
  "Input/input",
  "Label/label",
  "TextBlock/textBlock",
  "TextArea/textArea",
  "FormControl/formControl",
  "FormControl/Hint/hint",
  "Select/select",
  "CheckBoxGroup/checkBoxGroup",
  "CheckBoxItem/checkBoxItem",
  "RadioGroup/radioGroup",
  "RadioItem/radioItem",
  "SwitchGroup/switchGroup",
  "SwitchItem/switchItem",
  "Tabs/tabs",
  "Accordion/accordion",
  "Table/table",
  "IconButton/iconButton",
  "CardHeader/cardHeader",
  "TagBlock/tagBlock",
  "Tag/tag",
  "Separator/separator",
  "Skeleton/skeleton",
  "Chips/chips",
  "OptionCards/optionCards",
  "Steps/steps",
  "Image/image",
  "TextContentWrapper/textContentWrapper",
  "InlineMarkdownRenderer/inlineMarkdownRenderer",
  "MarkDownRenderer/markDownRenderer",
  "Callout/callout",
  "ImageTextLarge/imageTextLarge",
  "CodeBlock/codeBlock",
  "ImageText/imageText",
  "InlineHeader/inlineHeader",
  "MetricIndicator/metricIndicator",
  "IconTag/iconTag",
  "TextCallout/textCallout",
  "IconText/iconText",
  "EntityList/entityList",
  "ListItem/listItem",
  "ListBlock/listBlock",
  "SnippetCardBlock/snippetCardBlock",
  "OverviewCardBlock/overviewCardBlock",
  "ContextCardBlock/contextCardBlock",
  "VisualCardBlock/visualCardBlock",
  "CompositeCardBlock/compositeCardBlock",
  "_shared/cards/smallCardBlock",
  "_shared/cards/mediumCardBlock",
  "_shared/chatUtils",
  "TooltipWrapper/tooltipWrapper",
  "Modal/modal",
  "Carousel/carousel",
  "ImageBlock/imageBlock",
  "ImageGallery/imageGallery",
  "Sources/sources",
  "Citation/citation",
  "SourceFaviconImage/sourceFaviconImage",
  "FollowUpBlock/followUpBlock",
  "FollowUpItem/followUpItem",
  "SectionBlock/sectionBlock",
  "SectionBlock/foldableSection",
  "SectionBlock/sectionV2",
  "Slider/slider",
  "Calendar/calendar",
  "Calendar/components/calendarHelperComponents",
  "Calendar/utils/calendarBaseStyle",
  "DatePicker/datePicker",
  "DatePicker/helpers/components/helperComponents",
  "DatePicker/helpers/components/datePickerRenderer",
  "DatePicker/helpers/components/floatingDatePickerRenderer",
  "DatePicker/helpers/utils/datePickerBaseStyle",
  "EditableTable/editableTable",
  "EditableTable/base/editableTableBase",
  "EditableTable/base/components/editableCellBase",
];
const root = new URL("../", import.meta.url);
const upstream = new URL("../react-ui/src/", root);
const target = new URL("src/styles/upstream/", root);
const files = [
  "cssUtils.scss",
  "openui-defaults.scss",
  ...components.map((name) => `components/${name}.scss`),
];
const hashes = {};
for (const file of files) {
  const source = new URL(file, upstream);
  const destination = new URL(file, target);
  await mkdir(new URL("./", destination), { recursive: true });
  await copyFile(source, destination);
  hashes[file] = createHash("sha256")
    .update(await readFile(source))
    .digest("hex");
}
await writeFile(
  new URL("style-provenance.json", root),
  JSON.stringify(
    {
      source: "packages/react-ui/src",
      revision: execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: fileURLToPath(root),
        encoding: "utf8",
      }).trim(),
      files: hashes,
    },
    null,
    2,
  ) + "\n",
);
console.info(
  `Copied ${files.length} upstream SCSS files, preserving bytes and recording SHA-256 hashes.`,
);
