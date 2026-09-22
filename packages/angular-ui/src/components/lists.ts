import { Component } from "@angular/core";
import type { ActionConfig, ActionPlan } from "@openuidev/angular-lang";
import { OpenUiComponent } from "./base";
import { itemProps } from "./field";
import { OpenUiIconViewComponent } from "./inline-content";
import { OpenUiInlineMarkdownComponent, safeContentUrl } from "./markdown";

interface EntityRow {
  left: string;
  right: string;
  rightVariant?: "text" | "number";
}
@Component({
  selector: "openui-entity-list",
  standalone: true,
  imports: [OpenUiInlineMarkdownComponent],
  template: ` <div [class]="'openui-entity-list openui-entity-list--' + (props?.size ?? 'default')">
    @for (entry of rows; track $index) {
      <div [class]="'openui-entity-list__row openui-entity-list__row--' + entry.type">
        <span [class]="'openui-entity-list__cell-left openui-entity-list__cell-left--' + entry.type"
          ><openui-inline-markdown [text]="entry.row.left" /></span
        ><span
          [class]="
            'openui-entity-list__cell-right openui-entity-list__cell-right--' +
            (entry.row.rightVariant ?? 'text') +
            ' openui-entity-list__cell-right--' +
            entry.type
          "
          ><openui-inline-markdown [text]="entry.row.right"
        /></span>
      </div>
    }
  </div>`,
})
export class OpenUiEntityListComponent extends OpenUiComponent<{
  rows: EntityRow[];
  size?: string;
  header?: EntityRow;
  footer?: EntityRow;
}> {
  get rows() {
    return [
      ...(this.props?.size !== "small" && this.props?.header
        ? [{ row: this.props.header, type: "header" }]
        : []),
      ...(this.props?.rows ?? []).map((row) => ({ row, type: "body" })),
      ...(this.props?.size !== "small" && this.props?.footer
        ? [{ row: this.props.footer, type: "footer" }]
        : []),
    ];
  }
}
interface ListEntry {
  title: string;
  subtitle?: string;
  image?: { src: string; alt: string };
  actionLabel?: string;
  action?: ActionConfig | ActionPlan;
}
@Component({
  selector: "openui-list-block",
  standalone: true,
  imports: [OpenUiIconViewComponent],
  template: ` <div
    class="openui-list-block"
    [class.openui-list-block--small]="props?.size === 'small'"
  >
    @for (item of items; track $index; let i = $index) {
      <div
        class="openui-list-item-wrapper"
        [class.openui-list-item-wrapper--small]="props?.size === 'small'"
        [class.openui-list-item-wrapper-with-action]="clickable(item)"
      >
        <div
          class="openui-list-item"
          [class.openui-list-item-clickable]="clickable(item)"
          [attr.role]="clickable(item) ? 'button' : null"
          [attr.tabindex]="clickable(item) ? 0 : null"
          (click)="activate(item)"
          (keydown)="key(item, $event)"
        >
          <div
            class="openui-list-item-indicator"
            [class.openui-list-item-indicator-no-subtitle]="!hasSubtitle"
            [class.openui-list-item-indicator-clickable]="clickable(item)"
          >
            @if (props?.variant !== "image") {
              <div class="openui-list-item-indicator-number">{{ i + 1 }}</div>
            } @else if (item.image) {
              <div class="openui-list-item-indicator-image">
                <img
                  [attr.src]="url(item.image.src)"
                  [alt]="item.image.alt"
                  width="40"
                  height="40"
                />
              </div>
            }
          </div>
          <div class="openui-list-item-content-wrapper">
            <div class="openui-list-item-content">
              @if (item.title) {
                <div class="openui-list-item-title">{{ item.title }}</div>
              }
              @if (item.subtitle) {
                <div class="openui-list-item-subtitle">{{ item.subtitle }}</div>
              }
            </div>
            @if (clickable(item)) {
              <div class="openui-list-item-action">
                @if (item.actionLabel) {
                  <div class="openui-list-item-action-label">{{ item.actionLabel }}</div>
                }
                <div class="openui-list-item-action-icon">
                  <openui-icon-view name="chevron-right" [size]="16" />
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    }
  </div>`,
})
export class OpenUiListBlockComponent extends OpenUiComponent<{
  items: unknown[];
  variant?: "number" | "image";
  size?: "small" | "default";
}> {
  readonly url = safeContentUrl;
  get items() {
    return itemProps<ListEntry>(this.props?.items);
  }
  get hasSubtitle() {
    return this.items.some((item) => !!item.subtitle);
  }
  clickable(item: ListEntry) {
    return !!item.action && !this.context.isStreaming;
  }
  activate(item: ListEntry) {
    if (this.clickable(item)) void this.context.triggerAction(item.title, undefined, item.action);
  }
  key(item: ListEntry, event: KeyboardEvent) {
    if (event.target === event.currentTarget && ["Enter", " "].includes(event.key)) {
      event.preventDefault();
      this.activate(item);
    }
  }
}
