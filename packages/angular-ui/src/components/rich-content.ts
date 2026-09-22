import { NgStyle } from "@angular/common";
import { Component, DoCheck, OnDestroy } from "@angular/core";
import { resolveStateField } from "@openuidev/angular-lang";
import { OpenUiComponent } from "./base";
import { OpenUiInlineMarkdownComponent, OpenUiMarkdownViewComponent } from "./markdown";

@Component({
  selector: "openui-text-content",
  standalone: true,
  imports: [NgStyle, OpenUiMarkdownViewComponent],
  template: `<div [ngStyle]="style">
    <div class="openui-text-content">
      <openui-markdown-view [text]="props?.text ?? ''" [extended]="true" />
    </div>
  </div>`,
})
export class OpenUiTextContentComponent extends OpenUiComponent<{ text: string; size?: string }> {
  get style(): Record<string, string> {
    const name = (
      { small: "sm", large: "lg", "small-heavy": "sm-heavy", "large-heavy": "lg-heavy" } as Record<
        string,
        string
      >
    )[this.props?.size ?? ""];
    return name
      ? {
          "--openui-text-body-default": `var(--openui-text-body-${name})`,
          "--openui-text-body-default-letter-spacing": `var(--openui-text-body-${name}-letter-spacing)`,
        }
      : {};
  }
}
@Component({
  selector: "openui-inline-header",
  standalone: true,
  imports: [OpenUiInlineMarkdownComponent],
  template: `@if (props?.heading || props?.description) {
    <div class="openui-inline-header">
      @if (props.heading) {
        <div class="openui-inline-header-heading">
          <openui-inline-markdown [text]="props!.heading" />
        </div>
      }
      @if (props.description) {
        <div class="openui-inline-header-description">
          <openui-inline-markdown [text]="props!.description!" />
        </div>
      }
    </div>
  }`,
})
export class OpenUiInlineHeaderComponent extends OpenUiComponent<{
  heading: string;
  description?: string;
}> {}
@Component({
  selector: "openui-text-callout",
  standalone: true,
  template: `<div
    [class]="'openui-text-callout openui-text-callout-' + (props?.variant ?? 'neutral')"
  >
    <div class="openui-text-callout-content">
      @if (props?.title) {
        <span class="openui-text-callout-content-title">{{ props!.title }}</span>
      }
      @if (props?.description) {
        <span class="openui-text-callout-content-description">{{ props!.description }}</span>
      }
    </div>
  </div>`,
})
export class OpenUiTextCalloutComponent extends OpenUiComponent<{
  variant?: string;
  title?: string;
  description?: string;
}> {}
@Component({
  selector: "openui-callout",
  standalone: true,
  imports: [OpenUiMarkdownViewComponent],
  template: `@if (visible) {
    <div
      [class]="'openui-callout openui-callout-' + variant"
      [class.openui-callout-autodismiss]="field.isReactive"
      [style.--callout-duration]="field.isReactive ? '3000ms' : null"
    >
      @if (props?.title) {
        <span class="openui-callout-title">{{ props!.title }}</span>
      }
      @if (props?.description) {
        <span class="openui-callout-description"
          ><openui-markdown-view [text]="props!.description"
        /></span>
      }
    </div>
  }`,
})
export class OpenUiCalloutComponent
  extends OpenUiComponent<{
    variant: string;
    title: string;
    description: string;
    visible?: unknown;
  }>
  implements DoCheck, OnDestroy
{
  private timer?: ReturnType<typeof setTimeout>;
  private binding?: unknown;
  get field() {
    return resolveStateField<unknown>(
      "visible",
      this.props?.visible,
      this.context.store,
      this.context.evaluationContext,
      (name) => this.context.getFieldValue(this.formName, name),
      (name, value) => this.context.setFieldValue(this.formName, undefined, name, value),
    );
  }
  get visible(): boolean {
    const field = this.field;
    return !field.isReactive || field.value === true || field.value === "true";
  }
  get variant(): string {
    return this.props?.variant === "error" ? "warning" : (this.props?.variant ?? "info");
  }
  ngDoCheck(): void {
    const field = this.field;
    // Keep the timer stable through unrelated streamed props and dispose stale bindings.
    const identity = field.isReactive ? field.name : undefined;
    if (this.binding !== identity || !this.visible) {
      if (this.timer) clearTimeout(this.timer);
      this.timer = undefined;
      this.binding = identity;
    }
    if (field.isReactive && this.visible && !this.timer)
      this.timer = setTimeout(() => {
        this.timer = undefined;
        field.setValue(false);
      }, 3000);
  }
  ngOnDestroy(): void {
    if (this.timer) clearTimeout(this.timer);
  }
}
