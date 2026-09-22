import { defineComponent } from "@openuidev/angular-lang";
import { markReactive } from "@openuidev/lang-core";
import { z } from "zod/v4";
import { OpenUiDatePickerComponent } from "../components/date-picker";
import { OpenUiEditableTableComponent } from "../components/editable-table";
import { OpenUiSliderComponent } from "../components/slider";
import { rulesSchema } from "./schemas";
function reactive<T extends z.ZodType>(schema: T): T {
  markReactive(schema);
  return schema;
}
export const SliderSchema = z.object({
  name: z.string(),
  variant: z.enum(["continuous", "discrete"]),
  min: z.number(),
  max: z.number(),
  step: z.number().optional(),
  defaultValue: z.array(z.number()).optional(),
  label: z.string().optional(),
  rules: rulesSchema,
  value: reactive(z.array(z.number()).optional()),
});
export const DatePickerSchema = z.object({
  name: z.string(),
  mode: z.enum(["single", "range"]).optional(),
  rules: rulesSchema,
  value: reactive(z.unknown().optional()),
});
export const EditableTableSchema = z.object({
  name: z.string().default(""),
  columns: z
    .array(
      z.object({
        type: z.enum(["text", "number", "date-single", "select", "url"]),
        key: z.string().default("default"),
        header: z.string().default(""),
        width: z.number().optional(),
        options: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
      }),
    )
    .default([]),
  data: z
    .array(z.object({ id: z.string(), values: z.array(z.union([z.string(), z.number()])) }))
    .default([]),
});
export const Slider = defineComponent({
  name: "Slider",
  props: SliderSchema,
  description: "Numeric slider input; continuous and discrete variants with reactive values.",
  component: OpenUiSliderComponent,
});
export const DatePicker = defineComponent({
  name: "DatePicker",
  props: DatePickerSchema,
  description: "Calendar input with single date or date range selection.",
  component: OpenUiDatePickerComponent,
});
export const EditableTable = defineComponent({
  name: "EditableTable",
  props: EditableTableSchema,
  description:
    "Editable cells with positional values; save publishes the table field and Save Changes action.",
  component: OpenUiEditableTableComponent,
});
