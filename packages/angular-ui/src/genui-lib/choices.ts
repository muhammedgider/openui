import { defineComponent } from "@openuidev/angular-lang";
import { z } from "zod/v4";
import { OpenUiChipsComponent, OpenUiOptionCardsComponent } from "../components/choice";
import { OpenUiDataRecordComponent } from "../components/content";
import { OpenUiImageComponent, OpenUiStepsComponent } from "../components/media-steps";
import { Icon } from "./rich";
import { rulesSchema } from "./schemas";

export const ImageSchema = z.object({ alt: z.string(), src: z.string().optional() });
export const Image = defineComponent({
  name: "Image",
  props: ImageSchema,
  description: "Image with alt text and optional URL",
  component: OpenUiImageComponent,
});
export const ChipItemSchema = z.object({
  value: z.string(),
  label: z.string(),
  icon: z.optional(Icon.ref),
  disabled: z.boolean().optional(),
});
export const ChipItem = defineComponent({
  name: "ChipItem",
  props: ChipItemSchema,
  description: "A selectable chip with value, label and optional icon",
  component: OpenUiDataRecordComponent,
});
export const ChipsSchema = z.object({
  name: z.string(),
  type: z.enum(["single", "multiple"]).default("multiple"),
  items: z.array(ChipItem.ref).default([]),
  rules: rulesSchema,
  defaultValue: z.union([z.string(), z.array(z.string())]).optional(),
});
export const Chips = defineComponent({
  name: "Chips",
  props: ChipsSchema,
  description: "Compact selectable chips; stores one or many values under name",
  component: OpenUiChipsComponent,
});
export const OptionCardSchema = z.object({
  value: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  topContent: z.union([Icon.ref, Image.ref]).optional(),
  disabled: z.boolean().optional(),
});
export const OptionCard = defineComponent({
  name: "OptionCard",
  props: OptionCardSchema,
  description: "Selectable card with title, optional subtitle, icon or image",
  component: OpenUiDataRecordComponent,
});
export const OptionCardsSchema = z.object({
  name: z.string(),
  type: z.enum(["single", "multiple"]).default("single"),
  items: z.array(OptionCard.ref).default([]),
  rules: rulesSchema,
  defaultValue: z.union([z.string(), z.array(z.string())]).optional(),
});
export const OptionCards = defineComponent({
  name: "OptionCards",
  props: OptionCardsSchema,
  description: "Responsive grid of selectable cards; stores one or many values under name",
  component: OpenUiOptionCardsComponent,
});
export const StepsItemSchema = z.object({ title: z.string(), details: z.string() });
export const StepsItem = defineComponent({
  name: "StepsItem",
  props: StepsItemSchema,
  description: "Title and details for one step",
  component: OpenUiDataRecordComponent,
});
export const StepsSchema = z.object({ items: z.array(StepsItem.ref) });
export const Steps = defineComponent({
  name: "Steps",
  props: StepsSchema,
  description: "Step-by-step guide",
  component: OpenUiStepsComponent,
});
