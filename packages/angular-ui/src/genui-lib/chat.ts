// Chat catalog schemas synchronized from the same upstream revision.
import { createLibrary, defineComponent, type ComponentGroup } from "@openuidev/angular-lang";
import { z } from "zod/v4";
import {
  OpenUiChatCardComponent,
  OpenUiFollowUpBlockComponent,
  OpenUiSectionBlockComponent,
} from "../components/chat";
import { OpenUiDataRecordComponent } from "../components/content";
import { OpenUiAccordionComponent, OpenUiTabsComponent } from "../components/navigation";
import { OpenUiCarouselComponent } from "../components/overlays";
import {
  AreaChartCondensed,
  BarChartCondensed,
  BoldText,
  Button,
  Buttons,
  Callout,
  CardHeader,
  CheckBoxGroup,
  CheckBoxItem,
  ChipItem,
  Chips,
  CodeBlock,
  Col,
  CompositeCardBlock,
  CompositeCardItem,
  ContentChildUnion,
  ContextCardBlock,
  ContextCardItem,
  DatePicker,
  EditableTable,
  EntityList,
  Form,
  FormControl,
  HorizontalBarChart,
  Icon,
  IconButton,
  IconText,
  Image,
  ImageBlock,
  ImageGallery,
  ImageText,
  ImageTextLarge,
  InlineHeader,
  Input,
  Label,
  LineChartCondensed,
  ListBlock,
  ListItem,
  MarkDownRenderer,
  MetricIndicatorInline,
  MetricIndicatorWithStrikethrough,
  OptionCard,
  OptionCards,
  OverviewCardBlock,
  OverviewCardItem,
  PieChart,
  Point,
  RadarChart,
  RadialChart,
  RadioGroup,
  RadioItem,
  ScatterChart,
  ScatterSeries,
  Select,
  SelectItem,
  Separator,
  Series,
  SingleStackedBarChart,
  Slice,
  Slider,
  SnippetCardBlock,
  SnippetCardItem,
  Steps,
  StepsItem,
  SwitchGroup,
  SwitchItem,
  Table,
  Tag,
  TagBlock,
  Text,
  TextArea,
  TextCallout,
  TextContent,
  VisualCardBlock,
  VisualCardItem,
} from "./index";
export const CardSourceSchema = z.object({
  url: z.string().optional(),
  title: z.string(),
  sourceName: z.string(),
});
export const FollowUpItem = defineComponent({
  name: "FollowUpItem",
  props: z.object({ text: z.string() }),
  description: "Clickable follow-up suggestion",
  component: OpenUiDataRecordComponent,
});
export const FollowUpBlock = defineComponent({
  name: "FollowUpBlock",
  props: z.object({ items: z.array(FollowUpItem.ref) }),
  description: "Follow-up suggestions at the end of a response",
  component: OpenUiFollowUpBlockComponent,
});
const ChatNestedContentUnion = z.union([
  ...ContentChildUnion.options,
  ListBlock.ref,
  FollowUpBlock.ref,
]);
export const ChatAccordionItem = defineComponent({
  name: "AccordionItem",
  props: z.object({
    value: z.string(),
    trigger: z.string(),
    content: z.array(ChatNestedContentUnion),
  }),
  description: "value is unique id, trigger is section title",
  component: OpenUiDataRecordComponent,
});
export const ChatAccordion = defineComponent({
  name: "Accordion",
  props: z.object({ items: z.array(ChatAccordionItem.ref) }),
  description: "Collapsible sections",
  component: OpenUiAccordionComponent,
});
export const ChatTabItem = defineComponent({
  name: "TabItem",
  props: z.object({
    value: z.string(),
    trigger: z.string(),
    content: z.array(z.union([...ChatNestedContentUnion.options, ChatAccordion.ref])),
  }),
  description: "value is unique id, trigger is tab label, content is array of components",
  component: OpenUiDataRecordComponent,
});
export const ChatTabs = defineComponent({
  name: "Tabs",
  props: z.object({ items: z.array(ChatTabItem.ref) }),
  description: "Tabbed container",
  component: OpenUiTabsComponent,
});
export const ChatCarousel = defineComponent({
  name: "Carousel",
  props: z.object({
    children: z.array(z.array(ChatNestedContentUnion)),
    variant: z.enum(["card", "sunk"]).optional(),
  }),
  description: "Horizontal scrollable carousel",
  component: OpenUiCarouselComponent,
});
export const ChatSectionItem = defineComponent({
  name: "SectionItem",
  props: z.object({
    value: z.string(),
    trigger: z.string(),
    content: z.array(z.union([...ChatNestedContentUnion.options, ChatTabs.ref, ChatAccordion.ref])),
  }),
  description: "Section with a label and collapsible content — used inside SectionBlock",
  component: OpenUiDataRecordComponent,
});
export const ChatSectionBlock = defineComponent({
  name: "SectionBlock",
  props: z.object({
    sections: z.array(ChatSectionItem.ref),
    isFoldable: z.boolean().optional(),
  }),
  description:
    "Collapsible accordion sections. Auto-opens sections as they stream in. Use SectionItem for each section.",
  component: OpenUiSectionBlockComponent,
});
export const ChatCardChildUnion = z.union([
  ...ChatNestedContentUnion.options,
  ChatSectionBlock.ref,
  ChatTabs.ref,
  ChatCarousel.ref,
]);
export const ChatCard = defineComponent({
  name: "Card",
  props: z.object({
    children: z.array(ChatCardChildUnion),
    sources: z.array(CardSourceSchema).optional(),
  }),
  description:
    "Vertical container for all content in a chat response. Children stack top to bottom automatically. Optional sources ([{ title, sourceName, url }]) render as a Sources strip at the bottom and back inline [n] citations in TextContent.",
  component: OpenUiChatCardComponent,
});
export const openuiChatComponentGroups: ComponentGroup[] = [
  {
    name: "Content",
    components: [
      "CardHeader",
      "TextContent",
      "MarkDownRenderer",
      "Callout",
      "TextCallout",
      "Image",
      "ImageBlock",
      "ImageGallery",
      "CodeBlock",
      "Separator",
      "InlineHeader",
    ],
    notes: [
      "- InlineHeader is a compact heading + description pair for labelling a block inside the response (lighter than CardHeader).",
      "- Pass sources on Card ([{ title, sourceName, url }]) when the answer relies on references, and cite them inline in TextContent as [1], [2] (1-based index into sources). A Sources strip renders at the bottom of the card.",
    ],
  },
  {
    name: "Tables",
    components: ["Table", "Col", "EditableTable"],
    notes: [
      "- EditableTable lets the user edit cells inline. Give it a unique name, columns of { type, key, header } with type one of text | number | date-single | select | url (select also needs options: [{ value, label }]).",
      "- data is an array of { id, values } rows where values are ordered positionally to match columns. Edited data is submitted when the user clicks Save Changes.",
    ],
  },
  {
    name: "Charts (2D)",
    components: [
      "BarChart",
      "LineChart",
      "AreaChart",
      "RadarChart",
      "HorizontalBarChart",
      "Series",
    ],
  },
  {
    name: "Charts (1D)",
    components: ["PieChart", "RadialChart", "SingleStackedBarChart", "Slice"],
  },
  {
    name: "Charts (Scatter)",
    components: ["ScatterChart", "ScatterSeries", "Point"],
  },
  {
    name: "Forms",
    components: [
      "Form",
      "FormControl",
      "Label",
      "Input",
      "TextArea",
      "Select",
      "SelectItem",
      "DatePicker",
      "Slider",
      "CheckBoxGroup",
      "CheckBoxItem",
      "RadioGroup",
      "RadioItem",
      "SwitchGroup",
      "SwitchItem",
      "Chips",
      "ChipItem",
      "OptionCards",
      "OptionCard",
    ],
    notes: [
      "- Chips: compact single/multiple selection pills. Use ChipItem references for each option.",
      "- OptionCards: larger selectable cards with title, subtitle and an optional Icon or Image on top. Use OptionCard references for each option.",
      "- Define EACH FormControl as its own reference — do NOT inline all controls in one array.",
      "- NEVER nest Form inside Form.",
      "- Form requires explicit buttons. Always pass a Buttons(...) reference as the second Form argument: Form(name, buttons, fields).",
      "- rules is an optional object: { required: true, email: true, min: 8, maxLength: 100 }",
      "- The renderer shows error messages automatically — do NOT generate error text in the UI",
    ],
  },
  {
    name: "Buttons",
    components: ["Button", "Buttons", "Icon", "IconButton"],
    notes: [
      "- Icon renders a lucide icon by kebab-case name; it is also used as the icon of IconButton, IconText and OptionCard.",
    ],
  },
  {
    name: "Lists & Follow-ups",
    components: ["ListBlock", "ListItem", "FollowUpBlock", "FollowUpItem"],
    notes: [
      "- Use ListBlock with ListItem references for numbered lists.",
      "- Use FollowUpBlock with FollowUpItem references at the end of a response to suggest next actions.",
      "- A ListItem is clickable ONLY when given an action (5th argument); without one it is plain text.",
      "- Clicking a FollowUpItem, or a ListItem with a continue_conversation action, sends text to the LLM as a user message.",
      '- Example: list = ListBlock([item1, item2])  item1 = ListItem("Option A", "Details about A", null, null, { type: "continue_conversation", context: "Option A" })',
    ],
  },
  {
    name: "Sections",
    components: ["SectionBlock", "SectionItem"],
    notes: [
      "- SectionBlock renders collapsible accordion sections that auto-open as they stream.",
      "- Each section needs a unique `value` id, a `trigger` label, and a `content` array.",
      '- Example: sections = SectionBlock([s1, s2])  s1 = SectionItem("intro", "Introduction", [content1])',
      "- Set isFoldable=false to render sections as flat headers instead of accordion.",
    ],
  },
  {
    name: "Layout",
    components: ["Tabs", "TabItem", "Accordion", "AccordionItem", "Steps", "StepsItem", "Carousel"],
    notes: [
      "- Use Tabs to present alternative views — each TabItem has a value id, trigger label, and content array.",
      "- Carousel takes an array of slides, where each slide is an array of content: carousel = Carousel([[t1, img1], [t2, img2]])",
      "- IMPORTANT: Every slide in a Carousel must have the same structure — same component types in the same order.",
      "- For image carousels use: [[title, image, description, tags], ...] — every slide must follow this exact pattern.",
      "- Use real, publicly accessible image URLs (e.g. https://picsum.photos/seed/KEYWORD/800/500). Never hallucinate image URLs.",
    ],
  },
  {
    name: "Data Display",
    components: ["TagBlock", "Tag", "EntityList"],
    notes: [
      "- EntityList is a compact two-column list of { left, right } rows (e.g. name / value). size='default' also supports a header and footer row; size='small' does not.",
    ],
  },
  {
    name: "Cards",
    components: [
      "SnippetCardBlock",
      "SnippetCardItem",
      "OverviewCardBlock",
      "OverviewCardItem",
      "ContextCardBlock",
      "ContextCardItem",
      "CompositeCardBlock",
      "CompositeCardItem",
      "VisualCardBlock",
      "VisualCardItem",
      "Text",
      "BoldText",
      "IconText",
      "ImageText",
      "ImageTextLarge",
      "MetricIndicatorInline",
      "MetricIndicatorWithStrikethrough",
    ],
    notes: [
      "- Card blocks lay out 2+ items in a responsive grid (or carousel where supported). Every item in a block must have the same structure.",
      "- SnippetCardItem: small card with lhs (IconText | ImageText) and optional rhs (Text | BoldText) — good for key/value facts.",
      "- OverviewCardItem: small card with top (IconText | ImageText | Text) and optional bottom MetricIndicatorInline — good for KPIs.",
      "- ContextCardItem: medium card with a title (string or Tag), body text and optional background image — good for summaries.",
      "- CompositeCardItem: rich card with header, body array (Text, BoldText, MetricIndicatorInline, IconText, Image, charts, ListBlock, TagBlock, EntityList) and footer (price + Button) — good for products/offers.",
      "- VisualCardItem: image-first card with a BoldText body and optional Tag.",
      "- Text / BoldText / IconText / ImageText / ImageTextLarge / MetricIndicator* are the inline building blocks used INSIDE card items; do not place them directly in the root Card.",
    ],
  },
];
export const openuiChatLibrary = createLibrary({
  root: "Card",
  componentGroups: openuiChatComponentGroups,
  components: [
    // Root
    ChatCard,
    CardHeader,
    // Content
    TextContent,
    MarkDownRenderer,
    Callout,
    TextCallout,
    Image,
    ImageBlock,
    ImageGallery,
    CodeBlock,
    Separator,
    // Tables
    Table,
    Col,
    // Charts (2D)
    BarChartCondensed,
    LineChartCondensed,
    AreaChartCondensed,
    RadarChart,
    HorizontalBarChart,
    Series,
    // Charts (1D)
    PieChart,
    RadialChart,
    SingleStackedBarChart,
    Slice,
    // Charts (Scatter)
    ScatterChart,
    ScatterSeries,
    Point,
    // Forms
    Form,
    FormControl,
    Label,
    Input,
    TextArea,
    Select,
    SelectItem,
    DatePicker,
    Slider,
    CheckBoxGroup,
    CheckBoxItem,
    RadioGroup,
    RadioItem,
    SwitchGroup,
    SwitchItem,
    // Buttons
    Button,
    Buttons,
    // Lists & Follow-ups
    ListBlock,
    ListItem,
    FollowUpBlock,
    FollowUpItem,
    // Sections
    ChatSectionBlock,
    ChatSectionItem,
    // Layout (no Stack)
    ChatTabs,
    ChatTabItem,
    ChatAccordion,
    ChatAccordionItem,
    Steps,
    StepsItem,
    ChatCarousel,
    // Data Display
    TagBlock,
    Tag,
    EntityList,
    // Content
    InlineHeader,
    Icon,
    IconButton,
    // Tables (editable)
    EditableTable,
    // Selection inputs
    ChipItem,
    Chips,
    OptionCard,
    OptionCards,
    // Card building blocks
    Text,
    BoldText,
    IconText,
    ImageText,
    ImageTextLarge,
    MetricIndicatorInline,
    MetricIndicatorWithStrikethrough,
    // Card blocks
    SnippetCardItem,
    SnippetCardBlock,
    OverviewCardItem,
    OverviewCardBlock,
    ContextCardItem,
    ContextCardBlock,
    CompositeCardItem,
    CompositeCardBlock,
    VisualCardItem,
    VisualCardBlock,
  ],
});
