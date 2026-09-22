import {
  AfterViewChecked,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
  signal,
} from "@angular/core";
import { OpenUiIconViewComponent } from "./inline-content";
import { safeContentUrl } from "./markdown";
import type { CardSource } from "./source-context";
/** Native source carousel using the upstream Sources + Carousel DOM and CSS contracts. */
@Component({
  selector: "openui-sources",
  standalone: true,
  imports: [OpenUiIconViewComponent],
  template: ` @if (sources.length) {
    <div class="openui-listed-sources">
      <div class="openui-listed-sources-header">
        <span class="openui-listed-sources-header__title">Sources</span>
        @if (previous() || next()) {
          <div class="openui-listed-sources-header__buttons">
            <button
              type="button"
              class="openui-icon-button openui-icon-button-secondary openui-icon-button-small openui-icon-button-square"
              aria-label="Previous sources"
              [disabled]="!previous()"
              (click)="move(-1)"
            >
              <span class="openui-icon-button-icon"
                ><openui-icon-view name="chevron-left" [size]="24"
              /></span>
            </button>
            <button
              type="button"
              class="openui-icon-button openui-icon-button-secondary openui-icon-button-small openui-icon-button-square"
              aria-label="Next sources"
              [disabled]="!next()"
              (click)="move(1)"
            >
              <span class="openui-icon-button-icon"
                ><openui-icon-view name="chevron-right" [size]="24"
              /></span>
            </button>
          </div>
        }
      </div>
      <div class="openui-carousel openui-carousel--sunk">
        <div
          #strip
          class="openui-carousel-content"
          [class.openui-carousel-content--mask-left]="previous()"
          [class.openui-carousel-content--mask-right]="next()"
          (scroll)="measure()"
        >
          @for (source of sources; track $index; let i = $index) {
            <div
              class="openui-carousel-item openui-listed-sources-item-container"
              [class.openui-listed-sources-item-container--has-url]="!!url(source.url)"
            >
              <a
                class="openui-listed-source-item"
                [class.openui-listed-source-item--has-url]="!!url(source.url)"
                [attr.href]="url(source.url)"
                target="_blank"
                rel="noopener noreferrer"
                [attr.aria-label]="i + 1 + '. ' + source.title"
                [attr.data-source-id]="i"
              >
                <div class="openui-listed-source-item__header">
                  <div class="openui-listed-source-item__logo">
                    <openui-icon-view name="globe" [size]="20" />
                  </div>
                  <span class="openui-listed-source-item__source-name">{{
                    source.sourceName
                  }}</span>
                </div>
                <div class="openui-listed-source-item__title">{{ source.title }}</div>
              </a>
            </div>
          }
        </div>
      </div>
    </div>
  }`,
  styles: [
    `
      :host {
        display: contents;
      }
      .openui-listed-source-item {
        color: inherit;
        text-decoration: none;
      }
    `,
  ],
})
export class OpenUiSourcesComponent implements AfterViewChecked, OnDestroy {
  @Input() sources: readonly CardSource[] = [];
  @ViewChild("strip") private strip?: ElementRef<HTMLElement>;
  readonly url = safeContentUrl;
  readonly previous = signal(false);
  readonly next = signal(false);
  private observed?: HTMLElement;
  private observer?: ResizeObserver;
  private mutation?: MutationObserver;
  ngAfterViewChecked() {
    const el = this.strip?.nativeElement;
    if (el === this.observed) return;
    this.observer?.disconnect();
    this.mutation?.disconnect();
    this.observed = el;
    if (!el) return;
    if (typeof ResizeObserver !== "undefined") {
      this.observer = new ResizeObserver(() => this.measure());
      this.observer.observe(el);
    }
    if (typeof MutationObserver !== "undefined") {
      this.mutation = new MutationObserver(() => this.measure());
      this.mutation.observe(el, { childList: true, subtree: true, characterData: true });
    }
  }
  measure() {
    const el = this.strip?.nativeElement;
    if (!el) return;
    this.previous.set(Math.abs(el.scrollLeft) > 0);
    this.next.set(Math.ceil(Math.abs(el.scrollLeft)) + el.clientWidth < el.scrollWidth);
  }
  move(direction: number) {
    const el = this.strip?.nativeElement;
    if (!el) return;
    const items = Array.from(el.children) as HTMLElement[];
    if (!items.length) return;
    const rect = el.getBoundingClientRect();
    let i = items.findIndex((item) => item.getBoundingClientRect().left >= rect.left - 1);
    if (i < 0) i = items.length - 1;
    const item = items[Math.max(0, Math.min(items.length - 1, i + direction))];
    if (item) el.scrollTo({ left: item.offsetLeft, behavior: "smooth" });
  }
  ngOnDestroy() {
    this.observer?.disconnect();
    this.mutation?.disconnect();
  }
}
