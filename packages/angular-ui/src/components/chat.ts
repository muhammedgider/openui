import { Component, DoCheck, forwardRef, inject, signal } from "@angular/core";
import { RenderNode } from "@openuidev/angular-lang";
import { OpenUiComponent } from "./base";
import { OpenUiIds, itemProps } from "./field";
import { CardSource, OPENUI_CARD_SOURCES } from "./source-context";
import { OpenUiSourcesComponent } from "./sources";
const EMPTY_SOURCES: readonly CardSource[] = [];
@Component({
  selector: "openui-follow-up-block",
  standalone: true,
  template: `<div class="openui-follow-up-block">
    <div class="openui-follow-up-block__header">Related Queries</div>
    @for (item of items; track $index) {
      <button
        type="button"
        class="openui-follow-up-item"
        [disabled]="context.isStreaming"
        (click)="choose(item.text)"
      >
        <span class="openui-follow-up-item-text">{{ item.text }}</span>
      </button>
    }
  </div>`,
})
export class OpenUiFollowUpBlockComponent extends OpenUiComponent<{ items: unknown[] }> {
  get items() {
    return itemProps<{ text: string }>(this.props?.items);
  }
  choose(text: string) {
    if (!this.context.isStreaming) this.context.triggerAction(text);
  }
}
interface SectionItem {
  value: string;
  trigger: string;
  content: unknown[];
}
@Component({
  selector: "openui-section-block",
  standalone: true,
  imports: [RenderNode],
  template: `@if (props?.isFoldable === false) {
      @for (item of items; track item.value) {
        <div class="openui-section-v2">
          <div class="openui-section-v2-wrapper">
            <div class="openui-separator" data-orientation="horizontal" role="none"></div>
            <div class="openui-section-v2-header">
              <div class="openui-section-v2-header-trigger">{{ item.trigger }}</div>
            </div>
            <div class="openui-section-v2-content">
              <openui-render-node
                [library]="context.library"
                [context]="context"
                [formName]="formName"
                [value]="item.content"
              />
            </div>
          </div>
        </div>
      }
    } @else {
      <div class="openui-foldable-section-root">
        @for (item of items; track item.value; let i = $index) {
          <section
            class="openui-foldable-section-item"
            [attr.data-state]="isOpen(item.value) ? 'open' : 'closed'"
          >
            <h3 class="openui-foldable-section-header">
              <button
                type="button"
                class="openui-foldable-section-trigger"
                [id]="id + '-trigger-' + i"
                [attr.aria-expanded]="isOpen(item.value)"
                [attr.aria-controls]="id + '-content-' + i"
                [attr.data-state]="isOpen(item.value) ? 'open' : 'closed'"
                (click)="toggle(item.value)"
                (keydown)="key($event)"
              >
                <div class="openui-foldable-section-trigger-content-wrapper">
                  <div
                    class="openui-separator openui-foldable-section-trigger-content-separator"
                    data-orientation="horizontal"
                    role="none"
                  ></div>
                  <div class="openui-foldable-section-trigger-content-icon-button-wrapper">
                    <span
                      class="openui-icon-button openui-icon-button-secondary openui-icon-button-3-extra-small openui-icon-button-square openui-foldable-section-trigger-content-icon-button"
                      aria-hidden="true"
                      ><span class="openui-icon-button-icon"
                        ><svg
                          class="openui-foldable-section-trigger-content-icon-button-icon"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path d="m9 18 6-6-6-6" /></svg></span></span
                    ><span class="openui-foldable-section-trigger-content-text">{{
                      item.trigger
                    }}</span>
                  </div>
                </div>
              </button>
            </h3>
            @if (isOpen(item.value)) {
              <div
                class="openui-foldable-section-content"
                role="region"
                [id]="id + '-content-' + i"
                [attr.aria-labelledby]="id + '-trigger-' + i"
              >
                <openui-render-node
                  [library]="context.library"
                  [context]="context"
                  [formName]="formName"
                  [value]="item.content"
                />
              </div>
            } @else {
              <div
                class="openui-foldable-section-content"
                data-state="closed"
                hidden
                aria-hidden="true"
                [id]="id + '-content-' + i"
              ></div>
            }
          </section>
        }
      </div>
    }`,
})
export class OpenUiSectionBlockComponent
  extends OpenUiComponent<{ sections: unknown[]; isFoldable?: boolean }>
  implements DoCheck
{
  readonly id = inject(OpenUiIds).next();
  readonly opened = signal<ReadonlySet<string>>(new Set());
  private touched = false;
  private count = 0;
  private streaming = false;
  get items() {
    return itemProps<SectionItem>(this.props?.sections);
  }
  isOpen(value: string) {
    return this.props?.isFoldable === false || this.opened().has(value);
  }
  ngDoCheck() {
    const items = this.items;
    const current = this.context.isStreaming;
    if (!this.touched && items.length) {
      if (this.streaming && !current) this.opened.set(new Set([items[0]!.value]));
      else if (current && items.length > this.count)
        this.opened.set(new Set([...this.opened(), items[items.length - 1]!.value]));
      else if (!this.opened().size) this.opened.set(new Set([items[0]!.value]));
    }
    this.count = items.length;
    this.streaming = current;
  }
  toggle(value: string) {
    if (this.props?.isFoldable === false) return;
    this.touched = true;
    const next = new Set(this.opened());
    if (next.has(value)) next.delete(value);
    else next.add(value);
    this.opened.set(next);
  }
  key(event: KeyboardEvent) {
    const button = event.currentTarget as HTMLElement;
    const root = button.closest(".openui-foldable-section-root");
    const buttons = Array.from(
      root?.querySelectorAll<HTMLButtonElement>(".openui-foldable-section-trigger") ?? [],
    );
    const index = buttons.indexOf(button as HTMLButtonElement);
    let next: number;
    switch (event.key) {
      case "ArrowDown":
        next = (index + 1) % buttons.length;
        break;
      case "ArrowUp":
        next = (index + buttons.length - 1) % buttons.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = buttons.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    buttons[next]?.focus();
  }
}
@Component({
  selector: "openui-chat-card",
  standalone: true,
  imports: [RenderNode, OpenUiSourcesComponent],
  providers: [
    {
      provide: OPENUI_CARD_SOURCES,
      useFactory: (card: OpenUiChatCardComponent) => () => card.props?.sources ?? EMPTY_SOURCES,
      deps: [forwardRef(() => OpenUiChatCardComponent)],
    },
  ],
  template: `<div
    class="openui-card openui-card-full openui-card-card"
    style="display:flex;flex-direction:column;gap:var(--openui-space-m);width:100%"
  >
    <openui-render-node
      [library]="context.library"
      [context]="context"
      [formName]="formName"
      [value]="props?.children"
    />
    <openui-sources [sources]="props?.sources ?? []" />
  </div>`,
})
export class OpenUiChatCardComponent extends OpenUiComponent<{
  children: unknown[];
  sources?: CardSource[];
}> {}
