import { Component, forwardRef, inject } from "@angular/core";
import {
  OPENUI_FORM_VALIDATION,
  RenderNode,
  createFormValidation,
  injectFormValidation,
} from "@openuidev/angular-lang";
import { OpenUiComponent } from "./base";
import { FieldDescription, OPENUI_FIELD_DESCRIPTION, OpenUiIds } from "./field";

@Component({
  selector: "openui-form",
  standalone: true,
  imports: [RenderNode],
  providers: [{ provide: OPENUI_FORM_VALIDATION, useFactory: createFormValidation }],
  template: `<div
    role="form"
    [attr.aria-label]="props?.name"
    style="display:flex;flex-direction:column;gap:16px"
  >
    <openui-render-node
      [value]="props?.fields"
      [library]="context.library"
      [context]="context"
      [formName]="props?.name ?? undefined"
    />
    <openui-render-node
      [value]="props?.buttons"
      [library]="context.library"
      [context]="context"
      [formName]="props?.name ?? undefined"
    />
  </div>`,
})
export class OpenUiFormComponent extends OpenUiComponent<{
  name: string;
  fields: unknown[];
  buttons: unknown;
}> {}

@Component({
  selector: "openui-form-control",
  standalone: true,
  imports: [RenderNode],
  providers: [
    {
      provide: OPENUI_FIELD_DESCRIPTION,
      useExisting: forwardRef(() => OpenUiFormControlComponent),
    },
  ],
  template: `<div class="openui-form-control">
    <label class="openui-label text-sm font-medium" [id]="labelId" [attr.for]="isGroup ? null : id"
      >{{ props?.label }}
      @if (required) {
        <span class="openui-label-required-asterisk">*</span>
      }
    </label>
    <openui-render-node
      [value]="props?.input"
      [library]="context.library"
      [context]="context"
      [formName]="formName"
    />
    @if (error) {
      <div class="openui-hint openui-hint-error" [id]="hintId" role="alert">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4m0 4h.01" />
        </svg>
        {{ error }}
      </div>
    } @else if (props?.hint) {
      <div class="openui-hint" [id]="hintId">{{ props.hint }}</div>
    }
  </div>`,
})
export class OpenUiFormControlComponent
  extends OpenUiComponent<{ label: string; input: unknown; hint?: string }>
  implements FieldDescription
{
  private readonly validation = injectFormValidation();
  readonly id = inject(OpenUiIds).next();
  readonly labelId = `${this.id}-label`;
  readonly hintId = `${this.id}-hint`;
  get isGroup(): boolean {
    const input = this.props?.input;
    return (
      !!input &&
      typeof input === "object" &&
      "typeName" in input &&
      ["CheckBoxGroup", "RadioGroup", "SwitchGroup"].includes(String(input.typeName))
    );
  }
  private get inputProps(): Record<string, unknown> {
    const input = this.props?.input;
    return input && typeof input === "object" && "props" in input
      ? ((input.props ?? {}) as Record<string, unknown>)
      : {};
  }
  private get name(): string | undefined {
    const raw = this.inputProps["name"];
    if (typeof raw === "string") return raw;
    if (raw && typeof raw === "object" && "name" in raw && typeof raw.name === "string")
      return raw.name;
    return undefined;
  }
  get required(): boolean {
    const rules = this.inputProps["rules"];
    return !!rules && typeof rules === "object" && "required" in rules && rules.required === true;
  }
  get error(): string | undefined {
    return this.name ? this.validation?.getFieldError(this.name) : undefined;
  }
  describedBy(): string | null {
    return this.error || this.props?.hint ? this.hintId : null;
  }
}
