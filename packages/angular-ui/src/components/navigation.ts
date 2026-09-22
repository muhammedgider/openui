import {
  AfterViewChecked,
  Component,
  DoCheck,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
} from "@angular/core";
import { RenderNode } from "@openuidev/angular-lang";
import { OpenUiComponent } from "./base";
import { OpenUiIds, itemProps } from "./field";

interface NavigationItem {
  value: string;
  trigger: string;
  content: unknown[];
}

@Component({
  selector: "openui-accordion",
  standalone: true,
  imports: [RenderNode],
  template: `@if (items.length) {
    <div
      class="openui-accordion openui-accordion-clear"
      data-orientation="vertical"
      (keydown)="keydown($event)"
    >
      @for (item of items; track item.value; let i = $index) {
        <div
          class="openui-accordion-item"
          [attr.data-state]="active === item.value ? 'open' : 'closed'"
        >
          <h3 class="openui-accordion-header">
            <button
              type="button"
              class="openui-accordion-trigger"
              [id]="id + '-trigger-' + i"
              [attr.aria-controls]="id + '-panel-' + i"
              [attr.aria-expanded]="active === item.value"
              [attr.data-state]="active === item.value ? 'open' : 'closed'"
              (click)="select(item.value)"
            >
              <div class="openui-accordion-trigger-content">{{ item.trigger }}</div>
              <svg
                class="openui-accordion-trigger-icon"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          </h3>
          <div
            class="openui-accordion-content"
            role="region"
            [id]="id + '-panel-' + i"
            [attr.aria-labelledby]="id + '-trigger-' + i"
            [hidden]="active !== item.value"
            [attr.data-state]="active === item.value ? 'open' : 'closed'"
          >
            @if (active === item.value) {
              <div class="openui-accordion-content-wrapper">
                <openui-render-node
                  [value]="item.content"
                  [library]="context.library"
                  [context]="context"
                  [formName]="formName"
                />
              </div>
            }
          </div>
        </div>
      }
    </div>
  }`,
})
export class OpenUiAccordionComponent
  extends OpenUiComponent<{ items: unknown[] }>
  implements DoCheck
{
  readonly id = inject(OpenUiIds).next();
  active = "";
  private interacted = false;
  private previousCount = 0;
  get items() {
    return itemProps<NavigationItem>(this.props?.items).filter((item) => item.value != null);
  }
  ngDoCheck(): void {
    const items = this.items;
    if (!this.interacted && items.length > this.previousCount)
      this.active = items.at(-1)?.value ?? "";
    this.previousCount = items.length;
  }
  select(value: string): void {
    this.interacted = true;
    this.active = value === this.active ? "" : value;
  }
  keydown(event: KeyboardEvent): void {
    if (!["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    const buttons = Array.from(
      (event.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>(
        ":scope > .openui-accordion-item > .openui-accordion-header > .openui-accordion-trigger",
      ),
    );
    const current = buttons.indexOf(event.target as HTMLButtonElement);
    if (current < 0) return;
    event.preventDefault();
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? buttons.length - 1
          : (current + (event.key === "ArrowUp" ? -1 : 1) + buttons.length) % buttons.length;
    buttons[next]?.focus();
  }
}

@Component({
  selector: "openui-tabs",
  standalone: true,
  imports: [RenderNode],
  template: `@if (items.length) {
    <div class="openui-tabs openui-tabs-clear" data-orientation="horizontal">
      <div class="openui-tabs-list-container">
        <div #leftControl class="openui-tabs-scroll-button-container-left" hidden>
          <button
            type="button"
            class="openui-icon-button openui-icon-button-secondary openui-icon-button-small openui-icon-button-square openui-tabs-scroll-button openui-tabs-scroll-left"
            aria-label="Scroll tabs left"
            (click)="scroll(-120)"
          >
            <span class="openui-icon-button-icon"
              ><svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path d="m15 18-6-6 6-6" /></svg
            ></span>
          </button>
        </div>
        <div
          #list
          class="openui-tabs-list openui-tabs-list--title"
          role="tablist"
          aria-orientation="horizontal"
          (scroll)="measure()"
          (keydown)="keydown($event)"
        >
          @for (item of items; track item.value; let i = $index) {
            <button
              type="button"
              role="tab"
              class="openui-tabs-trigger"
              [id]="id + '-tab-' + i"
              [attr.aria-controls]="id + '-panel-' + i"
              [attr.aria-selected]="active === item.value"
              [attr.data-state]="active === item.value ? 'active' : 'inactive'"
              [attr.tabindex]="active === item.value ? 0 : -1"
              (click)="select(item.value, $event)"
              (focus)="select(item.value)"
            >
              <span class="openui-tabs-trigger-content"
                ><span class="openui-tabs-trigger-text">{{ item.trigger }}</span></span
              >
            </button>
          }
        </div>
        <div #indicator class="openui-tabs-indicator"></div>
        <div #rightControl class="openui-tabs-scroll-button-container-right" hidden>
          <button
            type="button"
            class="openui-icon-button openui-icon-button-secondary openui-icon-button-small openui-icon-button-square openui-tabs-scroll-button openui-tabs-scroll-right"
            aria-label="Scroll tabs right"
            (click)="scroll(120)"
          >
            <span class="openui-icon-button-icon"
              ><svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path d="m9 18 6-6-6-6" /></svg
            ></span>
          </button>
        </div>
      </div>
      @for (item of items; track item.value; let i = $index) {
        <div
          class="openui-tabs-content"
          role="tabpanel"
          tabindex="0"
          [id]="id + '-panel-' + i"
          [attr.aria-labelledby]="id + '-tab-' + i"
          [attr.data-state]="active === item.value ? 'active' : 'inactive'"
          [hidden]="active !== item.value"
        >
          @if (active === item.value) {
            <div class="openui-tabs-content-inner">
              <openui-render-node
                [value]="item.content"
                [library]="context.library"
                [context]="context"
                [formName]="formName"
              />
            </div>
          }
        </div>
      }
    </div>
  }`,
})
export class OpenUiTabsComponent
  extends OpenUiComponent<{ items: unknown[] }>
  implements DoCheck, AfterViewChecked, OnDestroy
{
  @ViewChild("list") private list?: ElementRef<HTMLElement>;
  @ViewChild("indicator") private indicator?: ElementRef<HTMLElement>;
  readonly id = inject(OpenUiIds).next();
  active = "";
  @ViewChild("leftControl") private leftControl?: ElementRef<HTMLElement>;
  @ViewChild("rightControl") private rightControl?: ElementRef<HTMLElement>;
  private interacted = false;
  private previousSizes: Record<string, number> = {};
  private observed?: HTMLElement;
  private observer?: ResizeObserver;
  get items() {
    return itemProps<NavigationItem>(this.props?.items).filter((item) => item.value != null);
  }
  ngDoCheck(): void {
    const items = this.items;
    if (!this.active && items[0]) this.active = items[0].value;
    if (this.interacted) return;
    const sizes: Record<string, number> = {};
    for (const item of items) {
      const size = JSON.stringify(item.content ?? []).length;
      sizes[item.value] = size;
      if (size > (this.previousSizes[item.value] ?? 0)) this.active = item.value;
    }
    this.previousSizes = sizes;
  }
  select(value: string, event?: Event): void {
    this.interacted = true;
    this.active = value;
    const target = event?.currentTarget as HTMLElement | undefined;
    const list = this.list?.nativeElement;
    if (target && list)
      list.scrollTo?.({
        left: target.offsetLeft - list.clientWidth / 2 + target.offsetWidth / 2,
        behavior: "smooth",
      });
    this.measure();
  }
  scroll(amount: number): void {
    this.list?.nativeElement.scrollBy?.({ left: amount, behavior: "smooth" });
  }
  ngAfterViewChecked(): void {
    const list = this.list?.nativeElement;
    if (list !== this.observed) {
      this.observer?.disconnect();
      this.observed = list;
      if (list && typeof ResizeObserver !== "undefined") {
        this.observer = new ResizeObserver(() => this.measure());
        this.observer.observe(list);
      }
    }
    // Geometry styles do not trigger a second Angular pass.
    this.measure();
  }
  measure(): void {
    const list = this.list?.nativeElement;
    const indicator = this.indicator?.nativeElement;
    if (!list) return;
    if (this.leftControl) this.leftControl.nativeElement.hidden = list.scrollLeft <= 0;
    if (this.rightControl)
      this.rightControl.nativeElement.hidden =
        list.scrollLeft >= list.scrollWidth - list.clientWidth - 1;
    const active = list.querySelector<HTMLElement>('[data-state="active"]');
    if (indicator && active) {
      indicator.style.width = `${active.offsetWidth}px`;
      indicator.style.transform = `translateX(${active.offsetLeft - list.scrollLeft}px)`;
      indicator.style.opacity = "1";
      indicator.style.transition =
        "transform .25s cubic-bezier(.4,0,.2,1), width .25s cubic-bezier(.4,0,.2,1)";
    }
  }
  keydown(event: KeyboardEvent): void {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const buttons = Array.from(
      this.list?.nativeElement.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [],
    );
    const current = buttons.indexOf(event.target as HTMLButtonElement);
    if (current < 0) return;
    event.preventDefault();
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? buttons.length - 1
          : (current + (event.key === "ArrowLeft" ? -1 : 1) + buttons.length) % buttons.length;
    const item = this.items[next];
    if (item) this.select(item.value);
    buttons[next]?.focus();
  }
  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
