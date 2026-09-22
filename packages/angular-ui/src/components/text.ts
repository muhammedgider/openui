import { Component, Input } from "@angular/core";
import type { TextProps } from "../genui-lib/schemas";
import { OpenUiComponent } from "./base";
import { OpenUiInlineMarkdownComponent } from "./markdown";

@Component({
  selector: "openui-text-block",
  standalone: true,
  imports: [OpenUiInlineMarkdownComponent],
  template: `<div [class]="classes">
    <openui-inline-markdown [text]="props?.value ?? ''" className="openui-text-block__primary" />
    @if (props?.subtext) {
      <openui-inline-markdown [text]="props.subtext" [className]="secondaryClass" />
    }
  </div>`,
})
export class OpenUiTextBlockComponent {
  @Input() props: TextProps | null = null;
  @Input() bold = false;
  get classes(): string {
    const variant = this.bold
      ? this.props?.subtext
        ? "highlight-text-number-subtext"
        : this.props?.variant === "number"
          ? "highlight-number"
          : "highlight-text"
      : this.props?.subtext
        ? "text-subtext"
        : "text";
    return `openui-text-block openui-text-block--${variant} openui-text-block--size-${this.props?.size ?? "sm"} openui-text-block--align-left openui-text-block--type-${this.props?.variant ?? "text"}`;
  }
  get secondaryClass(): string {
    const tone =
      this.props?.subtextVariant === "metric"
        ? this.props.subtext?.startsWith("+")
          ? "positive"
          : this.props.subtext?.startsWith("-")
            ? "negative"
            : null
        : null;
    return `openui-text-block__secondary${tone ? ` openui-text-block__secondary--${tone}` : ""}`;
  }
}

@Component({
  selector: "openui-text",
  standalone: true,
  imports: [OpenUiTextBlockComponent],
  template: `<openui-text-block [props]="props" />`,
  styles: [":host { display: contents; }"],
})
export class OpenUiTextComponent extends OpenUiComponent<TextProps> {}

@Component({
  selector: "openui-bold-text",
  standalone: true,
  imports: [OpenUiTextBlockComponent],
  template: `<openui-text-block [props]="props" [bold]="true" />`,
  styles: [":host { display: contents; }"],
})
export class OpenUiBoldTextComponent extends OpenUiComponent<TextProps> {}

@Component({
  selector: "openui-label",
  standalone: true,
  template: `<label class="openui-label">{{ props?.text }}</label>`,
})
export class OpenUiLabelComponent extends OpenUiComponent<{ text: string }> {}
