import { markReactive, tagSchemaId } from "@openuidev/lang-core";
import { z } from "zod/v4";

// Keep positional property order aligned with react-ui's OpenUI Lang contract.
export const FlexPropsSchema = z.object({
  direction: z.enum(["row", "column"]).optional(),
  gap: z.enum(["none", "xs", "s", "m", "l", "xl", "2xl"]).optional(),
  align: z.enum(["start", "center", "end", "stretch", "baseline"]).optional(),
  justify: z.enum(["start", "center", "end", "between", "around", "evenly"]).optional(),
  wrap: z.boolean().optional(),
});
export const StackSchema = z.object({ children: z.array(z.unknown()) }).merge(FlexPropsSchema);

export const TextSchema = z.object({
  variant: z.enum(["text", "number"]).default("text"),
  value: z.string(),
  subtext: z.string().optional(),
  subtextVariant: z.enum(["text", "number", "metric"]).default("text"),
  size: z.enum(["xs", "sm", "md", "lg"]).default("sm"),
});
// Separate object: cloning a tagged schema can collapse its JSON schema into a $ref.
export const BoldTextSchema = z.object({
  variant: z.enum(["text", "number"]).default("text"),
  value: z.string(),
  subtext: z.string().optional(),
  subtextVariant: z.enum(["text", "number", "metric"]).default("text"),
  size: z.enum(["xs", "sm", "md", "lg"]).default("sm"),
});
export const LabelSchema = z.object({ text: z.string() });

export const actionPropSchema = z.union([
  z.object({ type: z.literal("open_url"), url: z.string() }),
  z.object({ type: z.literal("continue_conversation"), context: z.string().optional() }),
  z.object({ type: z.string(), params: z.record(z.string(), z.unknown()).optional() }),
]);
tagSchemaId(actionPropSchema, "ActionExpression");
export const ButtonSchema = z.object({
  label: z.string(),
  action: actionPropSchema.optional(),
  variant: z.enum(["primary", "secondary", "tertiary"]).optional(),
  type: z.enum(["normal", "destructive"]).optional(),
  size: z.enum(["extra-small", "small", "medium", "large"]).optional(),
});
export const rulesSchema = z
  .object({
    required: z.boolean().optional(),
    email: z.boolean().optional(),
    url: z.boolean().optional(),
    numeric: z.boolean().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional(),
  })
  .optional();
const inputValueSchema = z.string().optional();
markReactive(inputValueSchema);
export const InputSchema = z.object({
  name: z.string(),
  placeholder: z.string().optional(),
  type: z.enum(["text", "email", "password", "number", "url"]).optional(),
  rules: rulesSchema,
  value: inputValueSchema,
});

export type FlexProps = z.infer<typeof FlexPropsSchema>;
export type StackProps = z.infer<typeof StackSchema>;
export type CardProps = FlexProps & { children: unknown[]; variant?: "card" | "sunk" | "clear" };
export type TextProps = z.infer<typeof TextSchema>;
export type ButtonProps = Omit<z.infer<typeof ButtonSchema>, "action"> & {
  action?:
    import("@openuidev/angular-lang").ActionPlan | import("@openuidev/angular-lang").ActionConfig;
};
export type InputProps = Omit<z.infer<typeof InputSchema>, "value"> & { value?: unknown };
