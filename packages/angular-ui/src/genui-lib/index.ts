import { createLibrary, defineComponent } from "@openuidev/angular-lang";
import { markReactive } from "@openuidev/lang-core";
import { z } from "zod/v4";
import { OpenUiButtonComponent } from "../components/button";
import {
  OpenUiCompositeCardsComponent,
  OpenUiContextCardsComponent,
  OpenUiOverviewCardsComponent,
  OpenUiSnippetCardsComponent,
  OpenUiVisualCardsComponent,
} from "../components/card-blocks";
import {
  OpenUiCardHeaderComponent,
  OpenUiDataRecordComponent,
  OpenUiSeparatorComponent,
  OpenUiTagBlockComponent,
} from "../components/content";
import { OpenUiFormComponent, OpenUiFormControlComponent } from "../components/form";
import { OpenUiInputComponent, OpenUiTextAreaComponent } from "../components/input";
import {
  OpenUiButtonsComponent,
  OpenUiCardComponent,
  OpenUiStackComponent,
} from "../components/layout";
import { OpenUiEntityListComponent, OpenUiListBlockComponent } from "../components/lists";
import { OpenUiAccordionComponent, OpenUiTabsComponent } from "../components/navigation";
import {
  OpenUiCarouselComponent,
  OpenUiImageBlockComponent,
  OpenUiImageGalleryComponent,
  OpenUiModalComponent,
} from "../components/overlays";
import { OpenUiSelectComponent } from "../components/select";
import {
  OpenUiCheckBoxGroupComponent,
  OpenUiRadioGroupComponent,
  OpenUiSwitchGroupComponent,
} from "../components/selection";
import { OpenUiTableComponent } from "../components/table";
import {
  OpenUiBoldTextComponent,
  OpenUiLabelComponent,
  OpenUiTextComponent,
} from "../components/text";
import { DatePicker, EditableTable, Slider } from "./advanced-inputs";
import {
  AreaChartCondensed,
  BarChartCondensed,
  HorizontalBarChart,
  LineChartCondensed,
  PieChart,
  Point,
  RadarChart,
  RadialChart,
  ScatterChart,
  ScatterSeries,
  Series,
  SingleStackedBarChart,
  Slice,
} from "./charts";
import { ChipItem, Chips, Image, OptionCard, OptionCards, Steps, StepsItem } from "./choices";
import {
  Callout,
  CodeBlock,
  Icon,
  IconButton,
  IconText,
  ImageText,
  ImageTextLarge,
  InlineHeader,
  MarkDownRenderer,
  MetricIndicatorInline,
  MetricIndicatorWithStrikethrough,
  Tag,
  TextCallout,
  TextContent,
} from "./rich";
import {
  actionPropSchema,
  BoldTextSchema,
  ButtonSchema,
  FlexPropsSchema,
  InputSchema,
  LabelSchema,
  rulesSchema,
  StackSchema,
  TextSchema,
} from "./schemas";
export * from "./advanced-inputs";
export * from "./charts";
export * from "./choices";
export * from "./rich";
export * from "./schemas";

export const Text = defineComponent({
  name: "Text",
  props: TextSchema,
  description:
    "Plain text with optional subtext. Number variant uses tabular numbers; metric subtext colors leading +/- values.",
  component: OpenUiTextComponent,
});
export const BoldText = defineComponent({
  name: "BoldText",
  props: BoldTextSchema,
  description: "Emphasized plain text or number with optional subtext.",
  component: OpenUiBoldTextComponent,
});
export const Label = defineComponent({
  name: "Label",
  props: LabelSchema,
  description: "Text label. Inputs also use their name as an accessible label.",
  component: OpenUiLabelComponent,
});
export const Input = defineComponent({
  name: "Input",
  props: InputSchema,
  description:
    "Editable input. Use a unique name, optional validation rules, and a reactive value binding. Disabled while streaming.",
  component: OpenUiInputComponent,
});
export const Button = defineComponent({
  name: "Button",
  props: ButtonSchema,
  description: "Clickable button. Disabled while streaming.",
  component: OpenUiButtonComponent,
});
export const ButtonsSchema = z.object({
  buttons: z.array(Button.ref),
  direction: z.enum(["row", "column"]).optional(),
});
export const Buttons = defineComponent({
  name: "Buttons",
  props: ButtonsSchema,
  description: "Group of buttons in a row (default) or column.",
  component: OpenUiButtonsComponent,
});
export const Stack = defineComponent({
  name: "Stack",
  props: StackSchema,
  description:
    "Flex layout. Children first; optional direction, gap, align, justify, wrap. Default column with medium gap.",
  component: OpenUiStackComponent,
});
function reactive<T extends z.ZodType>(schema: T): T {
  markReactive(schema);
  return schema;
}

export const TextAreaSchema = z.object({
  name: z.string(),
  placeholder: z.string().optional(),
  rows: z.number().optional(),
  rules: rulesSchema,
  value: reactive(z.string().optional()),
});
export const TextArea = defineComponent({
  name: "TextArea",
  props: TextAreaSchema,
  description: "Multi-line text input",
  component: OpenUiTextAreaComponent,
});
export const SelectItemSchema = z.object({ value: z.string(), label: z.string() });
export const SelectItem = defineComponent({
  name: "SelectItem",
  props: SelectItemSchema,
  description: "Option for Select",
  component: OpenUiDataRecordComponent,
});
export const SelectSchema = z.object({
  name: z.string(),
  items: z.array(SelectItem.ref),
  placeholder: z.string().optional(),
  rules: rulesSchema,
  value: reactive(z.string().optional()),
  size: z.enum(["small", "medium", "large"]).optional(),
});
export const Select = defineComponent({
  name: "Select",
  props: SelectSchema,
  description: "Single selection input",
  component: OpenUiSelectComponent,
});
export const CheckBoxItemSchema = z.object({
  label: z.string(),
  description: z.string(),
  name: z.string(),
  defaultChecked: z.boolean().optional(),
});
export const CheckBoxItem = defineComponent({
  name: "CheckBoxItem",
  props: CheckBoxItemSchema,
  description: "Checkbox option",
  component: OpenUiDataRecordComponent,
});
export const CheckBoxGroupSchema = z.object({
  name: z.string(),
  items: z.array(CheckBoxItem.ref),
  rules: rulesSchema,
  value: reactive(z.record(z.string(), z.boolean()).optional()),
});
export const CheckBoxGroup = defineComponent({
  name: "CheckBoxGroup",
  props: CheckBoxGroupSchema,
  description: "Checkbox group storing a name-to-boolean map",
  component: OpenUiCheckBoxGroupComponent,
});
export const RadioItemSchema = z.object({
  label: z.string(),
  description: z.string(),
  value: z.string(),
});
export const RadioItem = defineComponent({
  name: "RadioItem",
  props: RadioItemSchema,
  description: "Radio option",
  component: OpenUiDataRecordComponent,
});
export const RadioGroupSchema = z.object({
  name: z.string(),
  items: z.array(RadioItem.ref),
  defaultValue: z.string().optional(),
  rules: rulesSchema,
  value: reactive(z.string().optional()),
});
export const RadioGroup = defineComponent({
  name: "RadioGroup",
  props: RadioGroupSchema,
  description: "Single-choice radio group",
  component: OpenUiRadioGroupComponent,
});
export const SwitchItemSchema = z.object({
  label: z.string().optional(),
  description: z.string().optional(),
  name: z.string(),
  defaultChecked: z.boolean().optional(),
});
export const SwitchItem = defineComponent({
  name: "SwitchItem",
  props: SwitchItemSchema,
  description: "Individual switch toggle",
  component: OpenUiDataRecordComponent,
});
export const SwitchGroupSchema = z.object({
  name: z.string(),
  items: z.array(SwitchItem.ref),
  variant: z.enum(["clear", "card", "sunk"]).optional(),
  value: reactive(z.record(z.string(), z.boolean()).optional()),
});
export const SwitchGroup = defineComponent({
  name: "SwitchGroup",
  props: SwitchGroupSchema,
  description: "Group of switch toggles",
  component: OpenUiSwitchGroupComponent,
});
export const FormControlSchema = z.object({
  label: z.string(),
  input: z.union([
    DatePicker.ref,
    Slider.ref,
    Input.ref,
    TextArea.ref,
    Select.ref,
    CheckBoxGroup.ref,
    RadioGroup.ref,
    Chips.ref,
    OptionCards.ref,
  ]),
  hint: z.string().optional(),
});
export const FormControl = defineComponent({
  name: "FormControl",
  props: FormControlSchema,
  description: "Field with label, input component, and optional hint text",
  component: OpenUiFormControlComponent,
});
export const FormSchema = z.object({
  name: z.string(),
  buttons: Buttons.ref,
  fields: z.array(FormControl.ref).default([]),
});
export const Form = defineComponent({
  name: "Form",
  props: FormSchema,
  description: "Form container with fields and explicit action buttons",
  component: OpenUiFormComponent,
});
export const TabItemSchema = z.object({
  value: z.string(),
  trigger: z.string(),
  content: z.array(z.unknown()),
});
export const TabItem = defineComponent({
  name: "TabItem",
  props: TabItemSchema,
  description: "value is unique id, trigger is tab label, content is array of components",
  component: OpenUiDataRecordComponent,
});
export const TabsSchema = z.object({ items: z.array(TabItem.ref) });
export const Tabs = defineComponent({
  name: "Tabs",
  props: TabsSchema,
  description: "Tabbed container",
  component: OpenUiTabsComponent,
});
export const AccordionItemSchema = z.object({
  value: z.string(),
  trigger: z.string(),
  content: z.array(z.unknown()),
});
export const AccordionItem = defineComponent({
  name: "AccordionItem",
  props: AccordionItemSchema,
  description: "value is unique id, trigger is section title",
  component: OpenUiDataRecordComponent,
});
export const AccordionSchema = z.object({ items: z.array(AccordionItem.ref) });
export const Accordion = defineComponent({
  name: "Accordion",
  props: AccordionSchema,
  description: "Collapsible sections",
  component: OpenUiAccordionComponent,
});
export const CardHeaderSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
});
export const CardHeader = defineComponent({
  name: "CardHeader",
  props: CardHeaderSchema,
  description: "Header with optional title and subtitle",
  component: OpenUiCardHeaderComponent,
});
export const SeparatorSchema = z.object({
  orientation: z.enum(["horizontal", "vertical"]).optional(),
  decorative: z.boolean().optional(),
});
export const Separator = defineComponent({
  name: "Separator",
  props: SeparatorSchema,
  description: "Horizontal or vertical separator",
  component: OpenUiSeparatorComponent,
});
export const ColSchema = z.object({
  label: z.string(),
  data: z.any(),
  type: z.enum(["string", "number", "action"]).optional(),
});
export const Col = defineComponent({
  name: "Col",
  props: ColSchema,
  description: "Column definition — holds label + data array",
  component: OpenUiDataRecordComponent,
});
export const TableSchema = z.object({ columns: z.array(Col.ref) });
export const Table = defineComponent({
  name: "Table",
  props: TableSchema,
  description: "Column-oriented data table with automatic pagination",
  component: OpenUiTableComponent,
});
export const TagBlockSchema = z.object({
  tags: z.array(z.string()),
  size: z.enum(["sm", "md", "lg"]).optional(),
});
export const TagBlock = defineComponent({
  name: "TagBlock",
  props: TagBlockSchema,
  description: "tags is an array of strings; optional size sm | md | lg",
  component: OpenUiTagBlockComponent,
});

export const EntityListRowSchema = z.object({
  left: z.string(),
  right: z.string(),
  rightVariant: z.enum(["text", "number"]).default("text"),
});
export const EntityListSchema = z
  .object({
    rows: z.array(EntityListRowSchema).default([]),
    size: z.enum(["small", "default"]).default("default"),
    header: EntityListRowSchema.optional(),
    footer: EntityListRowSchema.optional(),
  })
  .refine(({ size, header, footer }) => size === "default" || (!header && !footer), {
    message: 'EntityList size="small" does not support header or footer.',
    path: ["size"],
  });
export const EntityList = defineComponent({
  name: "EntityList",
  props: EntityListSchema,
  description: "Two-column key/value list with optional header and footer.",
  component: OpenUiEntityListComponent,
});
export const ListItemSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  image: z.object({ src: z.string(), alt: z.string() }).optional(),
  actionLabel: z.string().optional(),
  action: actionPropSchema.optional(),
});
export const ListItem = defineComponent({
  name: "ListItem",
  props: ListItemSchema,
  description: "List item with optional subtitle, image and action.",
  component: OpenUiDataRecordComponent,
});
export const ListBlockSchema = z.object({
  items: z.array(ListItem.ref),
  variant: z.enum(["number", "image"]).optional(),
  size: z.enum(["default", "small"]).optional(),
});
export const ListBlock = defineComponent({
  name: "ListBlock",
  props: ListBlockSchema,
  description: "Numbered or image list; small size supports compact cards.",
  component: OpenUiListBlockComponent,
});
export const SnippetCardItemSchema = z.object({
  id: z.string().optional(),
  lhs: z.union([IconText.ref, ImageText.ref]),
  rhs: z.union([Text.ref, BoldText.ref]).optional(),
});
export const SnippetCardItem = defineComponent({
  name: "SnippetCardItem",
  props: SnippetCardItemSchema,
  description: "Label/value row in a snippet card block.",
  component: OpenUiDataRecordComponent,
});
export const SnippetCardBlockSchema = z.object({
  items: z.array(SnippetCardItem.ref).min(2),
  layout: z.enum(["grid"]).default("grid"),
  responsive: z.boolean().default(true),
  action: actionPropSchema.optional(),
  gap: z.union([z.number(), z.string()]).optional(),
});
export const SnippetCardBlock = defineComponent({
  name: "SnippetCardBlock",
  props: SnippetCardBlockSchema,
  description: "Two-per-row responsive grid of label/value cards with optional shared action.",
  component: OpenUiSnippetCardsComponent,
});
export const OverviewCardItemSchema = z.object({
  id: z.string().optional(),
  top: z.union([IconText.ref, ImageText.ref, Text.ref]),
  bottom: z.optional(MetricIndicatorInline.ref),
});
export const OverviewCardItem = defineComponent({
  name: "OverviewCardItem",
  props: OverviewCardItemSchema,
  description: "Heading and optional inline metric in an overview card.",
  component: OpenUiDataRecordComponent,
});
export const OverviewCardBlockSchema = z.object({
  items: z.array(OverviewCardItem.ref).min(2),
  layout: z.enum(["grid", "carousel"]).default("grid"),
  responsive: z.boolean().default(true),
  action: actionPropSchema.optional(),
  gap: z.union([z.number(), z.string()]).optional(),
});
export const OverviewCardBlock = defineComponent({
  name: "OverviewCardBlock",
  props: OverviewCardBlockSchema,
  description: "Responsive grid or carousel of overview cards.",
  component: OpenUiOverviewCardsComponent,
});
export const ContextCardItemSchema = z.object({
  id: z.string().optional(),
  title: z.union([z.string(), Tag.ref]),
  body: z.string().optional(),
  bgColor: z.enum(["gray"]).optional(),
  bgImageSrc: z.string().optional(),
  bgImageAlt: z.string().optional(),
});
export const ContextCardItem = defineComponent({
  name: "ContextCardItem",
  props: ContextCardItemSchema,
  description: "Tinted or image card with text/tag title and optional Markdown body.",
  component: OpenUiDataRecordComponent,
});
export const ContextCardBlockSchema = z.object({
  items: z.array(ContextCardItem.ref).min(2),
  layout: z.enum(["grid", "carousel"]).default("grid"),
  responsive: z.boolean().default(true),
  action: actionPropSchema.optional(),
  gap: z.union([z.number(), z.string()]).optional(),
});
export const ContextCardBlock = defineComponent({
  name: "ContextCardBlock",
  props: ContextCardBlockSchema,
  description: "Responsive grid or carousel of context cards.",
  component: OpenUiContextCardsComponent,
});
export const VisualCardItemSchema = z.object({
  body: BoldText.ref,
  id: z.string().optional(),
  bgImageSrc: z.string().optional(),
  tag: z.optional(Tag.ref),
  bgImageAlt: z.string().optional(),
});
export const VisualCardItem = defineComponent({
  name: "VisualCardItem",
  props: VisualCardItemSchema,
  description: "Photo-first card with bold body, optional tag and background image.",
  component: OpenUiDataRecordComponent,
});
export const VisualCardBlockSchema = z.object({
  items: z.array(VisualCardItem.ref).min(2),
  layout: z.enum(["grid", "carousel"]).default("grid"),
  responsive: z.boolean().default(true),
  action: actionPropSchema.optional(),
  gap: z.union([z.number(), z.string()]).optional(),
});
export const VisualCardBlock = defineComponent({
  name: "VisualCardBlock",
  props: VisualCardBlockSchema,
  description: "Responsive grid or carousel of photo-first cards.",
  component: OpenUiVisualCardsComponent,
});
export const CompositeCardBodyItemSchema = z.union([
  BarChartCondensed.ref,
  LineChartCondensed.ref,
  AreaChartCondensed.ref,
  Text.ref,
  BoldText.ref,
  MetricIndicatorInline.ref,
  IconText.ref,
  Image.ref,
  ListBlock.ref,
  TagBlock.ref,
  EntityList.ref,
]);
export const CompositeCardFooterSchema = z.object({
  price: z.union([BoldText.ref, MetricIndicatorWithStrikethrough.ref]).optional(),
  button: z.optional(Button.ref),
});
export const CompositeCardItemSchema = z.object({
  id: z.string().optional(),
  header: z
    .union([IconText.ref, ImageText.ref, ImageTextLarge.ref, Text.ref, Image.ref])
    .optional(),
  body: z.array(CompositeCardBodyItemSchema).default([]),
  footer: CompositeCardFooterSchema.optional(),
});
export const CompositeCardItem = defineComponent({
  name: "CompositeCardItem",
  props: CompositeCardItemSchema,
  description:
    "Card with header, stacked content and optional price/button footer. Chart renderers are partial.",
  component: OpenUiDataRecordComponent,
});
export const CompositeCardBlockSchema = z.object({
  items: z.array(CompositeCardItem.ref).min(2),
  layout: z.enum(["grid", "carousel"]).default("grid"),
  responsive: z.boolean().default(true),
  action: actionPropSchema.optional(),
  gap: z.union([z.number(), z.string()]).optional(),
});
export const CompositeCardBlock = defineComponent({
  name: "CompositeCardBlock",
  props: CompositeCardBlockSchema,
  description: "Two-per-row rich card grid or carousel; chart rendering parity remains incomplete.",
  component: OpenUiCompositeCardsComponent,
});

export const ImageBlockSchema = z.object({ src: z.string(), alt: z.string().optional() });
export const ImageBlock = defineComponent({
  name: "ImageBlock",
  props: ImageBlockSchema,
  description: "Responsive image block with loading and error states.",
  component: OpenUiImageBlockComponent,
});
export const ImageGallerySchema = z.object({
  images: z.array(
    z.object({ src: z.string(), alt: z.string().optional(), details: z.string().optional() }),
  ),
});
export const ImageGallery = defineComponent({
  name: "ImageGallery",
  props: ImageGallerySchema,
  description: "Image grid with modal preview and selectable thumbnails.",
  component: OpenUiImageGalleryComponent,
});
export const ContentChildUnion = z.union([
  EditableTable.ref,
  BarChartCondensed.ref,
  LineChartCondensed.ref,
  AreaChartCondensed.ref,
  HorizontalBarChart.ref,
  PieChart.ref,
  RadialChart.ref,
  RadarChart.ref,
  ScatterChart.ref,
  SingleStackedBarChart.ref,
  TextContent.ref,
  MarkDownRenderer.ref,
  CardHeader.ref,
  Callout.ref,
  TextCallout.ref,
  CodeBlock.ref,
  Image.ref,
  ImageBlock.ref,
  ImageGallery.ref,
  Separator.ref,
  Table.ref,
  TagBlock.ref,
  Form.ref,
  Buttons.ref,
  IconButton.ref,
  Steps.ref,
  InlineHeader.ref,
  EntityList.ref,
  SnippetCardBlock.ref,
  OverviewCardBlock.ref,
  ContextCardBlock.ref,
  CompositeCardBlock.ref,
  VisualCardBlock.ref,
]);
export const CarouselSchema = z.object({
  children: z.array(z.array(ContentChildUnion)),
  variant: z.enum(["card", "sunk"]).optional(),
});
export const Carousel = defineComponent({
  name: "Carousel",
  props: CarouselSchema,
  description: "Horizontal scrollable content carousel.",
  component: OpenUiCarouselComponent,
});
export const ModalSchema = z.object({
  title: z.string(),
  open: reactive(z.boolean().optional()),
  children: z.array(ContentChildUnion),
  size: z.enum(["sm", "md", "lg"]).optional(),
});
export const Modal = defineComponent({
  name: "Modal",
  props: ModalSchema,
  description:
    "Dialog controlled by a reactive boolean. Close button, Escape and backdrop set open to false.",
  component: OpenUiModalComponent,
});

export const CardSchema = z
  .object({
    children: z.array(
      z.union([
        BarChartCondensed.ref,
        LineChartCondensed.ref,
        AreaChartCondensed.ref,
        HorizontalBarChart.ref,
        PieChart.ref,
        RadialChart.ref,
        RadarChart.ref,
        ScatterChart.ref,
        SingleStackedBarChart.ref,
        DatePicker.ref,
        Slider.ref,
        EditableTable.ref,
        Text.ref,
        BoldText.ref,
        Label.ref,
        Input.ref,
        Button.ref,
        Buttons.ref,
        Stack.ref,
        TextArea.ref,
        Select.ref,
        CheckBoxGroup.ref,
        RadioGroup.ref,
        SwitchGroup.ref,
        Form.ref,
        Tabs.ref,
        Accordion.ref,
        CardHeader.ref,
        Separator.ref,
        Table.ref,
        EntityList.ref,
        ListBlock.ref,
        SnippetCardBlock.ref,
        OverviewCardBlock.ref,
        ContextCardBlock.ref,
        VisualCardBlock.ref,
        CompositeCardBlock.ref,
        Image.ref,
        ImageBlock.ref,
        ImageGallery.ref,
        Carousel.ref,
        Modal.ref,
        Chips.ref,
        OptionCards.ref,
        Steps.ref,
        TagBlock.ref,
        MarkDownRenderer.ref,
        CodeBlock.ref,
        TextContent.ref,
        InlineHeader.ref,
        TextCallout.ref,
        Callout.ref,
        Icon.ref,
        Tag.ref,
        IconButton.ref,
        IconText.ref,
        ImageText.ref,
        ImageTextLarge.ref,
        MetricIndicatorInline.ref,
        MetricIndicatorWithStrikethrough.ref,
      ]),
    ),
    variant: z.enum(["card", "sunk", "clear"]).optional(),
  })
  .merge(FlexPropsSchema);
export const Card = defineComponent({
  name: "Card",
  props: CardSchema,
  description:
    "Full-width OpenUI container. Variants: card (default), sunk, clear. Supports Stack flex parameters.",
  component: OpenUiCardComponent,
});

export const openuiLibrary = createLibrary({
  components: [
    DatePicker,
    Slider,
    EditableTable,
    BarChartCondensed,
    LineChartCondensed,
    AreaChartCondensed,
    HorizontalBarChart,
    PieChart,
    RadialChart,
    RadarChart,
    ScatterChart,
    SingleStackedBarChart,
    Series,
    Slice,
    Point,
    ScatterSeries,
    Stack,
    Card,
    CardHeader,
    Text,
    BoldText,
    Label,
    Input,
    TextArea,
    Button,
    Buttons,
    Form,
    FormControl,
    Select,
    SelectItem,
    CheckBoxGroup,
    CheckBoxItem,
    RadioGroup,
    RadioItem,
    SwitchGroup,
    SwitchItem,
    Tabs,
    TabItem,
    Accordion,
    AccordionItem,
    Separator,
    Table,
    EntityList,
    ListBlock,
    ListItem,
    SnippetCardBlock,
    SnippetCardItem,
    OverviewCardBlock,
    OverviewCardItem,
    ContextCardBlock,
    ContextCardItem,
    VisualCardBlock,
    VisualCardItem,
    CompositeCardBlock,
    CompositeCardItem,
    Col,
    Image,
    ImageBlock,
    ImageGallery,
    Carousel,
    Modal,
    Chips,
    ChipItem,
    OptionCards,
    OptionCard,
    Steps,
    StepsItem,
    TagBlock,
    MarkDownRenderer,
    CodeBlock,
    TextContent,
    InlineHeader,
    TextCallout,
    Callout,
    Icon,
    Tag,
    IconButton,
    IconText,
    ImageText,
    ImageTextLarge,
    MetricIndicatorInline,
    MetricIndicatorWithStrikethrough,
  ],
  root: "Stack",
});
export const openuiPromptOptions = {
  additionalRules: [
    "Use only the registered components. Charts, EditableTable, DatePicker and Slider are not yet ported. Composite card, Modal and Carousel content must use the available schema union.",
    "Text and BoldText support inline Markdown. Raw HTML is escaped. Math and source citations are not yet supported.",
    "Use unique, human-readable Input names. Keep nested layouts responsive with Stack wrap.",
  ],
  examples: [
    'root = Card([BoldText("text", "Profile"), Input("Name", "Your name"), Button("Continue")], "sunk")',
  ],
};
