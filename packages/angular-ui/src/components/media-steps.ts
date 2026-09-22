import { Component, OnChanges, signal } from "@angular/core";
import { RenderNode } from "@openuidev/angular-lang";
import { OpenUiComponent } from "./base";
import { itemProps } from "./field";
import { OpenUiMarkdownViewComponent, safeContentUrl } from "./markdown";

@Component({
  selector: "openui-image",
  standalone: true,
  template: `<div
    data-radix-aspect-ratio-wrapper
    style="position:relative;width:100%;padding-bottom:66.66666666666667%"
  >
    <div style="position:absolute;inset:0">
      <img
        class="openui-image openui-image-fill"
        [class.openui-image--error]="failed()"
        [src]="src"
        [alt]="props?.alt ?? ''"
        (load)="failed.set(false)"
        (error)="failed.set(true)"
      />
    </div>
  </div>`,
})
export class OpenUiImageComponent
  extends OpenUiComponent<{ alt: string; src?: string }>
  implements OnChanges
{
  readonly failed = signal(false);
  private previousSrc?: string;
  get src(): string | null {
    return safeContentUrl(this.props?.src);
  }
  ngOnChanges(): void {
    if (this.previousSrc !== this.props?.src) {
      this.failed.set(false);
      this.previousSrc = this.props?.src;
    }
  }
}

@Component({
  selector: "openui-steps",
  standalone: true,
  imports: [OpenUiMarkdownViewComponent, RenderNode],
  template: `<div class="openui-steps-container">
    <div class="openui-steps">
      @for (item of items; track $index; let i = $index) {
        <div class="openui-step-item">
          <div class="openui-step-connector">
            <div class="openui-step-number">
              <div class="openui-step-number-inner">{{ i + 1 }}</div>
            </div>
            <div class="openui-connector-line"></div>
          </div>
          <div class="openui-step-content">
            <span class="openui-step-title">{{ item.title }}</span>
            <div class="openui-step-details">
              @if (isText(item.details)) {
                <openui-markdown-view [text]="asText(item.details)" />
              } @else {
                <openui-render-node
                  [value]="item.details"
                  [library]="context.library"
                  [context]="context"
                  [formName]="formName"
                />
              }
            </div>
          </div>
        </div>
      }
    </div>
  </div>`,
})
export class OpenUiStepsComponent extends OpenUiComponent<{ items: unknown[] }> {
  get items() {
    return itemProps<{ title: string; details: unknown }>(this.props?.items);
  }
  isText(value: unknown): boolean {
    return typeof value === "string";
  }
  asText(value: unknown): string {
    return typeof value === "string" ? value : "";
  }
}
