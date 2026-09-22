import { Component } from "@angular/core";
import type { InputProps } from "../genui-lib/schemas";
import { OpenUiTextField } from "./field";

@Component({
  selector: "openui-input",
  standalone: true,
  template: `<input
    class="openui-input openui-input-medium"
    autocomplete="off"
    [id]="id"
    [class.openui-input-error]="!!error"
    [attr.aria-invalid]="error ? 'true' : null"
    [attr.aria-label]="ariaLabel"
    [attr.aria-labelledby]="labelId"
    [attr.aria-describedby]="describedBy"
    [attr.name]="field.name"
    [type]="props?.type ?? 'text'"
    [placeholder]="props?.placeholder ?? ''"
    [value]="textValue"
    [disabled]="context.isStreaming"
    (focus)="clearError()"
    (input)="updateValue($event)"
    (blur)="validateValue($event)"
  />`,
})
export class OpenUiInputComponent extends OpenUiTextField<InputProps> {}

@Component({
  selector: "openui-textarea",
  standalone: true,
  template: `<textarea
    class="openui-textarea"
    [id]="id"
    [class.openui-textarea-error]="!!error"
    [attr.aria-invalid]="error ? 'true' : null"
    [attr.aria-label]="ariaLabel"
    [attr.aria-labelledby]="labelId"
    [attr.aria-describedby]="describedBy"
    [attr.name]="field.name"
    [placeholder]="props?.placeholder ?? ''"
    [rows]="props?.rows || 3"
    [value]="textValue"
    [disabled]="context.isStreaming"
    (focus)="clearError()"
    (input)="updateValue($event)"
    (blur)="validateValue($event)"
  ></textarea>`,
})
export class OpenUiTextAreaComponent extends OpenUiTextField<
  Omit<InputProps, "type"> & { rows?: number }
> {}
