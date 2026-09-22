import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  Renderer2,
  inject,
} from "@angular/core";
import { RenderNode, type ActionConfig, type ActionPlan } from "@openuidev/angular-lang";
import type { IconNode } from "lucide";
import { OpenUiComponent } from "./base";
import { getFallbackIconName } from "./icon-fallbacks";
import { OpenUiInlineMarkdownComponent, safeContentUrl } from "./markdown";

const normalize = (value: string) => value.replace(/[^a-z0-9]/gi, "").toLowerCase();
let iconNodes: Promise<Map<string, IconNode>> | undefined;
function loadIcons() {
  return (iconNodes ??= import("lucide")
    .then(
      ({ icons }) => new Map(Object.entries(icons).map(([name, node]) => [normalize(name), node])),
    )
    .catch((error: unknown) => {
      iconNodes = undefined;
      throw error;
    }));
}
@Component({
  selector: "openui-icon-view",
  standalone: true,
  template: "",
  styles: [":host { display: contents; }"],
})
export class OpenUiIconViewComponent implements OnChanges, OnDestroy {
  @Input() name = "";
  @Input() category?: string;
  @Input() size = 14;
  private generation = 0;
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  ngOnChanges(): void {
    const generation = ++this.generation;
    if (!this.name) {
      this.host.nativeElement.replaceChildren();
      return;
    }
    void loadIcons()
      .then((icons) => {
        if (generation !== this.generation) return;
        const nodes =
          icons.get(normalize(this.name)) ??
          icons.get(normalize(getFallbackIconName(this.category)));
        if (!nodes) return;
        const svg = this.renderer.createElement("svg", "svg") as SVGElement;
        const attrs = {
          width: this.size,
          height: this.size,
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          "stroke-width": 2,
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          "aria-hidden": "true",
          class: "lucide",
        };
        for (const [key, value] of Object.entries(attrs))
          this.renderer.setAttribute(svg, key, String(value));
        for (const [tag, attributes] of nodes) {
          const element = this.renderer.createElement(tag, "svg");
          for (const [key, value] of Object.entries(attributes))
            if (key !== "key") this.renderer.setAttribute(element, key, String(value));
          this.renderer.appendChild(svg, element);
        }
        this.host.nativeElement.replaceChildren(svg);
      })
      .catch(() => {
        if (generation === this.generation) this.host.nativeElement.replaceChildren();
      });
  }
  ngOnDestroy(): void {
    this.generation++;
  }
}
@Component({
  selector: "openui-icon",
  standalone: true,
  imports: [OpenUiIconViewComponent],
  template: `<openui-icon-view
    [name]="props?.name ?? ''"
    [category]="props?.category ?? undefined"
  />`,
})
export class OpenUiIconComponent extends OpenUiComponent<{ name: string; category?: string }> {}
@Component({
  selector: "openui-tag",
  standalone: true,
  imports: [RenderNode],
  template: `<div
    [class]="
      'openui-tag openui-tag-' +
      (props?.size ?? 'md') +
      ' openui-tag-' +
      (props?.variant ?? 'neutral')
    "
  >
    @if (props?.icon) {
      <span class="openui-tag-icon"
        ><openui-render-node
          [value]="props!.icon"
          [library]="context.library"
          [context]="context"
          [formName]="formName"
      /></span>
    }
    <span class="openui-tag-text">{{ props?.text }}</span>
  </div>`,
})
export class OpenUiTagComponent extends OpenUiComponent<{
  text: string;
  icon?: unknown;
  size?: string;
  variant?: string;
}> {}
@Component({
  selector: "openui-icon-button",
  standalone: true,
  imports: [RenderNode],
  template: `<button
    type="button"
    [class]="
      'openui-icon-button openui-icon-button-' +
      (props?.variant ?? 'primary') +
      ' openui-icon-button-' +
      (props?.size ?? 'medium') +
      ' openui-icon-button-' +
      (props?.shape ?? 'square')
    "
    [disabled]="context.isStreaming"
    [attr.aria-label]="props?.name"
    (click)="activate()"
  >
    <span class="openui-icon-button-icon"
      ><openui-render-node
        [value]="props?.icon"
        [library]="context.library"
        [context]="context"
        [formName]="formName"
    /></span>
  </button>`,
})
export class OpenUiIconButtonComponent extends OpenUiComponent<{
  name: string;
  icon: unknown;
  action?: ActionPlan | ActionConfig;
  variant?: string;
  size?: string;
  shape?: string;
}> {
  activate(): void {
    if (this.props && !this.context.isStreaming)
      void this.context.triggerAction(this.props.name, this.formName, this.props.action);
  }
}
@Component({
  selector: "openui-card-text-view",
  standalone: true,
  imports: [OpenUiInlineMarkdownComponent],
  styles: [":host { display: contents; }"],
  template: `<div
    [class]="
      'openui-text-block openui-text-block--' +
      variant +
      ' openui-text-block--size-' +
      size +
      ' openui-text-block--align-left openui-text-block--type-text'
    "
  >
    <openui-inline-markdown [text]="title" className="openui-text-block__primary" />
    @if (subtitle) {
      <openui-inline-markdown [text]="subtitle" className="openui-text-block__secondary" />
    }
  </div>`,
})
export class OpenUiCardTextViewComponent {
  @Input() title = "";
  @Input() subtitle = "";
  @Input() size = "sm";
  @Input() variant = "text-subtext";
}
interface ImageTextProps {
  src: string;
  alt?: string;
  title: string;
  subtitle?: string;
  bold?: boolean;
  layout?: string;
  imageSize?: number;
}
@Component({
  selector: "openui-image-text",
  standalone: true,
  imports: [OpenUiCardTextViewComponent],
  template: `<div
    [class]="'openui-image-text openui-image-text--' + (props?.layout ?? 'horizontal')"
  >
    <div
      class="openui-image-text__image-container"
      [style.width.px]="imageSize"
      [style.height.px]="imageSize"
    >
      @if (url(props?.src); as src) {
        <img
          class="openui-image-text__image"
          [src]="src"
          [alt]="props?.alt ?? props?.title ?? ''"
        />
      }
    </div>
    <div class="openui-image-text__content">
      <openui-card-text-view
        [title]="props?.title ?? ''"
        [subtitle]="props?.subtitle ?? ''"
        [size]="props?.layout === 'vertical' ? 'sm' : 'xs'"
        [variant]="props?.bold ? 'highlight-text-number-subtext' : 'text-subtext'"
      />
    </div>
  </div>`,
})
export class OpenUiImageTextComponent extends OpenUiComponent<ImageTextProps> {
  readonly url = safeContentUrl;
  get imageSize(): number | null {
    return this.props?.imageSize ?? (this.props?.layout === "vertical" ? null : 40);
  }
}
@Component({
  selector: "openui-image-text-large",
  standalone: true,
  imports: [OpenUiCardTextViewComponent],
  template: `<div class="openui-image-text-large">
    <div class="openui-image-text-large__image-wrap">
      @if (url(props?.src); as src) {
        <img
          class="openui-image-text-large__image"
          [src]="src"
          [alt]="props?.alt ?? props?.title ?? ''"
        />
      }
    </div>
    <div class="openui-image-text-large__content">
      <openui-card-text-view
        [title]="props?.title ?? ''"
        [subtitle]="props?.subtitle ?? ''"
        variant="highlight-text"
      />
    </div>
  </div>`,
})
export class OpenUiImageTextLargeComponent extends OpenUiComponent<ImageTextProps> {
  readonly url = safeContentUrl;
}
@Component({
  selector: "openui-icon-text",
  standalone: true,
  imports: [OpenUiIconViewComponent, OpenUiCardTextViewComponent],
  template: `<div [class]="'openui-icon-text openui-icon-text--' + (props?.layout ?? 'horizontal')">
    @if (icon.name) {
      <div [class]="'openui-icon-tag openui-icon-tag--l openui-icon-tag--' + variant">
        <openui-icon-view [name]="icon.name" [category]="icon.category" />
      </div>
    }
    <div class="openui-icon-text__content">
      <openui-card-text-view
        [title]="props?.title ?? ''"
        [subtitle]="props?.subtitle ?? ''"
        [size]="props?.layout === 'vertical' ? 'sm' : 'xs'"
        [variant]="props?.bold ? 'highlight-text-number-subtext' : 'text-subtext'"
      />
    </div>
  </div>`,
})
export class OpenUiIconTextComponent extends OpenUiComponent<{
  icon: { props?: { name?: string; category?: string } };
  iconVariant?: string;
  iconSize?: string;
  title: string;
  subtitle?: string;
  bold?: boolean;
  layout?: string;
}> {
  get icon() {
    return this.props?.icon?.props ?? {};
  }
  get variant() {
    const v = this.props?.iconVariant;
    return !v || v === "filled" || v === "soft" ? "neutral" : v;
  }
}
interface MetricProps {
  value: string;
  subtext?: string;
  previousValue?: string;
  trend?: { direction: "up" | "down"; value: number };
}
@Component({
  selector: "openui-metric-view",
  standalone: true,
  styles: [":host { display: contents; }"],
  template: `<div
    [class]="'openui-metric-indicator openui-metric-indicator--variant-' + variant"
    [class.openui-metric-indicator--has-subtext]="!!props?.subtext"
  >
    <div class="openui-metric-indicator__row">
      <div class="openui-metric-indicator__main-value">{{ props?.value }}</div>
      @if (variant !== "inline" && props?.previousValue) {
        <div class="openui-metric-indicator__previous-value">{{ props!.previousValue }}</div>
      }
      @if (props?.trend; as trend) {
        <div
          [class]="
            'openui-metric-indicator__trend openui-metric-indicator__trend--' +
            (trend.direction === 'up' ? 'success' : 'danger')
          "
        >
          {{ trend.direction === "up" ? "+" : "-" }}{{ trend.value }}%
        </div>
      }
      @if (variant === "inline" && props?.subtext) {
        <div class="openui-metric-indicator__subtext">{{ props!.subtext }}</div>
      }
    </div>
    @if (variant !== "inline" && props?.subtext) {
      <div class="openui-metric-indicator__subtext">{{ props!.subtext }}</div>
    }
  </div>`,
})
export class OpenUiMetricViewComponent {
  @Input() props: MetricProps | null = null;
  @Input() variant = "inline";
}
@Component({
  selector: "openui-metric-inline",
  standalone: true,
  imports: [OpenUiMetricViewComponent],
  template: `<openui-metric-view [props]="props" />`,
})
export class OpenUiMetricInlineComponent extends OpenUiComponent<MetricProps> {}
@Component({
  selector: "openui-metric-strikethrough",
  standalone: true,
  imports: [OpenUiMetricViewComponent],
  template: `<openui-metric-view [props]="props" variant="with-strikethrough" />`,
})
export class OpenUiMetricStrikethroughComponent extends OpenUiComponent<MetricProps> {}
