import { Component } from "@angular/core";
import { ACTION_STEPS, injectFormValidation } from "@openuidev/angular-lang";
import type { ButtonProps } from "../genui-lib/schemas";
import { OpenUiComponent } from "./base";

@Component({
  selector: "openui-button",
  standalone: true,
  template: `<button
    type="button"
    [class]="classes"
    [disabled]="context.isStreaming"
    (click)="activate()"
  >
    {{ props?.label }}
  </button>`,
})
export class OpenUiButtonComponent extends OpenUiComponent<ButtonProps> {
  private readonly validation = injectFormValidation();
  get classes(): string {
    const variant = this.props?.variant ?? "primary";
    const prefix = this.props?.type === "destructive" ? "destructive-" : "";
    return `openui-button-base openui-button-base-${prefix}${variant} openui-button-base-${this.props?.size ?? "medium"}`;
  }
  activate(): void {
    if (!this.props || this.context.isStreaming) return;
    const action = this.props.action;
    if (this.validation && (this.props.variant ?? "primary") === "primary") {
      const needsValidation =
        action && "steps" in action
          ? action.steps.some(
              (step) =>
                step.type === ACTION_STEPS.ToAssistant ||
                (step.type === ACTION_STEPS.Run && step.refType === "mutation"),
            )
          : true;
      if (needsValidation && !this.validation.validateForm()) return;
    }
    void this.context.triggerAction(this.props.label, this.formName, action);
  }
}
