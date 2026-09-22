import { Component } from "@angular/core";
import { OpenUiComponent } from "./base";

@Component({
  selector: "openui-card-header",
  standalone: true,
  template: `<div class="openui-header">
    <div class="openui-header-top">
      <div class="openui-header-top-left">{{ props?.title }}</div>
      <div class="openui-header-top-right"></div>
    </div>
    @if (props?.subtitle) {
      <div class="openui-header-bottom">{{ props.subtitle }}</div>
    }
  </div>`,
})
export class OpenUiCardHeaderComponent extends OpenUiComponent<{
  title?: string;
  subtitle?: string;
}> {}

@Component({
  selector: "openui-separator",
  standalone: true,
  template: `<div
    class="openui-separator"
    [attr.data-orientation]="props?.orientation ?? 'horizontal'"
    [attr.role]="props?.decorative === false ? 'separator' : 'none'"
    [attr.aria-orientation]="
      props?.decorative === false && props.orientation === 'vertical' ? 'vertical' : null
    "
  ></div>`,
})
export class OpenUiSeparatorComponent extends OpenUiComponent<{
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
}> {}

@Component({
  selector: "openui-tag-block",
  standalone: true,
  template: `<div class="openui-tag-block">
    @for (tag of tags; track $index) {
      <div [class]="'openui-tag openui-tag-neutral openui-tag-' + (props?.size ?? 'md')">
        <span class="openui-tag-text">{{ tag }}</span>
      </div>
    }
  </div>`,
})
export class OpenUiTagBlockComponent extends OpenUiComponent<{
  tags: string[];
  size?: "sm" | "md" | "lg";
}> {
  get tags(): string[] {
    return Array.isArray(this.props?.tags) ? this.props.tags : [];
  }
}

@Component({ selector: "openui-data", standalone: true, template: "" })
export class OpenUiDataRecordComponent extends OpenUiComponent<unknown> {}
