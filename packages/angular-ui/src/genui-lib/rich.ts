import { defineComponent } from "@openuidev/angular-lang";
import { markReactive } from "@openuidev/lang-core";
import { z } from "zod/v4";
import {
  OpenUiIconButtonComponent,
  OpenUiIconComponent,
  OpenUiIconTextComponent,
  OpenUiImageTextComponent,
  OpenUiImageTextLargeComponent,
  OpenUiMetricInlineComponent,
  OpenUiMetricStrikethroughComponent,
  OpenUiTagComponent,
} from "../components/inline-content";
import { OpenUiCodeBlockComponent, OpenUiMarkdownComponent } from "../components/markdown";
import {
  OpenUiCalloutComponent,
  OpenUiInlineHeaderComponent,
  OpenUiTextCalloutComponent,
  OpenUiTextContentComponent,
} from "../components/rich-content";
import { actionPropSchema } from "./schemas";

export const MarkDownRendererSchema = z.object({
  textMarkdown: z.string(),
  variant: z.enum(["clear", "card", "sunk"]).optional(),
});
export const MarkDownRenderer = defineComponent({
  name: "MarkDownRenderer",
  props: MarkDownRendererSchema,
  description: "Markdown content block",
  component: OpenUiMarkdownComponent,
});
export const CodeBlockSchema = z.object({ language: z.string(), codeString: z.string() });
export const CodeBlock = defineComponent({
  name: "CodeBlock",
  props: CodeBlockSchema,
  description: "Syntax highlighted code with copy control",
  component: OpenUiCodeBlockComponent,
});
export const TextContentSchema = z.object({
  text: z.string(),
  size: z.enum(["small", "default", "large", "small-heavy", "large-heavy"]).optional(),
});
export const TextContent = defineComponent({
  name: "TextContent",
  props: TextContentSchema,
  description: "Markdown text block with optional body size",
  component: OpenUiTextContentComponent,
});
export const InlineHeaderSchema = z.object({
  heading: z.string(),
  description: z.string().optional(),
});
export const InlineHeader = defineComponent({
  name: "InlineHeader",
  props: InlineHeaderSchema,
  description: "Inline heading and optional description",
  component: OpenUiInlineHeaderComponent,
});
export const TextCalloutSchema = z.object({
  variant: z.enum(["neutral", "info", "warning", "success", "danger"]).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
});
export const TextCallout = defineComponent({
  name: "TextCallout",
  props: TextCalloutSchema,
  description: "Contextual text callout",
  component: OpenUiTextCalloutComponent,
});
const visible = z.boolean().optional();
markReactive(visible);
export const CalloutSchema = z.object({
  variant: z.enum(["info", "warning", "error", "success", "neutral"]),
  title: z.string(),
  description: z.string(),
  visible,
});
export const Callout = defineComponent({
  name: "Callout",
  props: CalloutSchema,
  description: "Banner; reactive visibility auto-dismisses after three seconds",
  component: OpenUiCalloutComponent,
});
export const IconSchema = z.object({ name: z.string(), category: z.string().optional() });
export const Icon = defineComponent({
  name: "Icon",
  props: IconSchema,
  description: "Lucide icon by kebab-case name with a topical category fallback",
  component: OpenUiIconComponent,
});
export const TagSchema = z.object({
  text: z.string(),
  icon: z.optional(Icon.ref),
  size: z.enum(["sm", "md", "lg"]).optional(),
  variant: z.enum(["neutral", "info", "success", "warning", "danger"]).optional(),
});
export const Tag = defineComponent({
  name: "Tag",
  props: TagSchema,
  description: "Text badge with optional icon",
  component: OpenUiTagComponent,
});
export const IconButtonSchema = z.object({
  name: z.string(),
  icon: Icon.ref,
  action: actionPropSchema.optional(),
  variant: z.enum(["primary", "secondary", "tertiary"]).optional(),
  size: z.enum(["extra-small", "small", "medium", "large"]).optional(),
  shape: z.enum(["square", "circle"]).optional(),
});
export const IconButton = defineComponent({
  name: "IconButton",
  props: IconButtonSchema,
  description: "Accessible named icon action",
  component: OpenUiIconButtonComponent,
});
export const IconTextSchema = z.object({
  icon: Icon.ref,
  iconVariant: z
    .enum(["neutral", "info", "success", "warning", "danger", "inverted", "filled", "soft"])
    .default("neutral"),
  iconSize: z.enum(["xs", "s", "m", "l", "xl", "sm", "md", "lg"]).default("m"),
  title: z.string(),
  subtitle: z.string().optional(),
  bold: z.boolean().default(false),
  layout: z.enum(["horizontal", "vertical"]).default("horizontal"),
});
export const IconText = defineComponent({
  name: "IconText",
  props: IconTextSchema,
  description: "Icon badge and text",
  component: OpenUiIconTextComponent,
});
export const ImageTextSchema = z.object({
  src: z.string(),
  alt: z.string().optional(),
  title: z.string(),
  subtitle: z.string().optional(),
  bold: z.boolean().default(false),
  layout: z.enum(["horizontal", "vertical"]).default("horizontal"),
  imageSize: z.number().optional(),
});
export const ImageText = defineComponent({
  name: "ImageText",
  props: ImageTextSchema,
  description: "Square image and text",
  component: OpenUiImageTextComponent,
});
export const ImageTextLargeSchema = z.object({
  src: z.string(),
  alt: z.string().optional(),
  title: z.string(),
  subtitle: z.string().optional(),
  bold: z.boolean().default(false),
});
export const ImageTextLarge = defineComponent({
  name: "ImageTextLarge",
  props: ImageTextLargeSchema,
  description: "Banner image and text",
  component: OpenUiImageTextLargeComponent,
});
export const MetricIndicatorTrendSchema = z.object({
  direction: z.enum(["up", "down"]),
  value: z.number(),
});
export const MetricIndicatorInlineSchema = z.object({
  value: z.string(),
  subtext: z.string().optional(),
  trend: MetricIndicatorTrendSchema.optional(),
});
export const MetricIndicatorWithStrikethroughSchema = z.object({
  value: z.string(),
  subtext: z.string().optional(),
  previousValue: z.string().optional(),
  trend: MetricIndicatorTrendSchema.optional(),
});
export const MetricIndicatorInline = defineComponent({
  name: "MetricIndicatorInline",
  props: MetricIndicatorInlineSchema,
  description: "Inline metric with trend",
  component: OpenUiMetricInlineComponent,
});
export const MetricIndicatorWithStrikethrough = defineComponent({
  name: "MetricIndicatorWithStrikethrough",
  props: MetricIndicatorWithStrikethroughSchema,
  description: "Metric with previous value",
  component: OpenUiMetricStrikethroughComponent,
});
