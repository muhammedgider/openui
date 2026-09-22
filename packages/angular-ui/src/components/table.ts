import { AfterViewChecked, Component, ElementRef, OnDestroy, ViewChild } from "@angular/core";
import { RenderNode } from "@openuidev/angular-lang";
import { OpenUiComponent } from "./base";
import { itemProps } from "./field";

const ICON_BUTTON =
  "openui-icon-button openui-icon-button-secondary openui-icon-button-small openui-icon-button-square";
@Component({
  selector: "openui-table",
  standalone: true,
  imports: [RenderNode],
  template: `@if (context.isQueryLoading && rowCount === 0) {
      <div class="openui-skeleton-table" aria-busy="true" aria-label="Loading table">
        <div
          class="openui-skeleton-table-row"
          [style.grid-template-columns]="'repeat(' + skeletonColumns.length + ',1fr)'"
        >
          @for (col of skeletonColumns; track col) {
            <div class="openui-skeleton-table-cell openui-skeleton-table-cell-short">
              <div class="openui-skeleton-bar" style="height:14px;width:100%"></div>
            </div>
          }
        </div>
        @for (row of [0, 1, 2, 3, 4]; track row) {
          <div
            class="openui-skeleton-table-row"
            [style.grid-template-columns]="'repeat(' + skeletonColumns.length + ',1fr)'"
          >
            @for (col of skeletonColumns; track col) {
              <div class="openui-skeleton-table-cell">
                <div
                  class="openui-skeleton-bar"
                  style="height:14px"
                  [style.width.%]="50 + ((row * 7 + col * 13) % 40)"
                ></div>
              </div>
            }
          </div>
        }
      </div>
    } @else if (columns.length) {
      <div>
        <div class="openui-scrollable-table-wrapper" tabindex="0">
          <div
            #leftControl
            class="openui-scrollable-table-control openui-scrollable-table-control-left"
            hidden
          >
            <button
              #leftButton
              type="button"
              [class]="iconButton"
              aria-label="Scroll left"
              (click)="scrollColumn(-1)"
            >
              <span class="openui-icon-button-icon"
                ><svg
                  width="16"
                  height="16"
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
            #rightControl
            class="openui-scrollable-table-control openui-scrollable-table-control-right"
            hidden
          >
            <button
              #rightButton
              type="button"
              [class]="iconButton"
              aria-label="Scroll right"
              (click)="scrollColumn(1)"
            >
              <span class="openui-icon-button-icon"
                ><svg
                  width="16"
                  height="16"
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
          <div
            #container
            class="openui-table-container openui-scrollable-table-scroll-container"
            (scroll)="measure()"
          >
            <table #table class="openui-table" style="width:100%">
              <thead class="openui-table-header">
                <tr class="openui-table-row">
                  @for (col of columns; track $index) {
                    <th class="openui-table-head" scope="col">
                      <div class="openui-table-head-content">
                        <div class="openui-table-head-label">{{ col.label }}</div>
                      </div>
                    </th>
                  }
                </tr>
              </thead>
              <tbody class="openui-table-body">
                @for (row of visibleRows; track row) {
                  <tr class="openui-table-row">
                    @for (col of columns; track $index) {
                      <td class="openui-table-cell">
                        <openui-render-node
                          [value]="col.data[row]"
                          [library]="context.library"
                          [context]="context"
                          [formName]="formName"
                        />
                      </td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
        @if (totalPages > 1) {
          <div
            style="display:flex;align-items:center;justify-content:flex-end;gap:8px;padding-top:8px"
          >
            <button
              type="button"
              [class]="iconButton"
              aria-label="Previous page"
              [disabled]="safePage === 0"
              (click)="page = safePage - 1"
            >
              <span class="openui-icon-button-icon"
                ><svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <path d="m15 18-6-6 6-6" /></svg
              ></span>
            </button>
            <span style="font-size:13px;color:#6b7280" aria-live="polite"
              >{{ safePage + 1 }} / {{ totalPages }}</span
            >
            <button
              type="button"
              [class]="iconButton"
              aria-label="Next page"
              [disabled]="safePage >= totalPages - 1"
              (click)="page = safePage + 1"
            >
              <span class="openui-icon-button-icon"
                ><svg
                  width="16"
                  height="16"
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
        }
      </div>
    }`,
})
export class OpenUiTableComponent
  extends OpenUiComponent<{ columns: unknown[] }>
  implements AfterViewChecked, OnDestroy
{
  @ViewChild("container") private container?: ElementRef<HTMLElement>;
  @ViewChild("table") private table?: ElementRef<HTMLElement>;
  @ViewChild("leftControl") private leftControl?: ElementRef<HTMLElement>;
  @ViewChild("rightControl") private rightControl?: ElementRef<HTMLElement>;
  @ViewChild("leftButton") private leftButton?: ElementRef<HTMLButtonElement>;
  @ViewChild("rightButton") private rightButton?: ElementRef<HTMLButtonElement>;
  readonly iconButton = ICON_BUTTON;
  page = 0;
  private observed?: HTMLElement;
  private observer?: ResizeObserver;
  get columns() {
    return itemProps<{ label?: string; data?: unknown }>(this.props?.columns).map((col) => ({
      label: col.label ?? "",
      data: Array.isArray(col.data) ? col.data : col.data == null ? [] : [col.data],
    }));
  }
  get rowCount(): number {
    return Math.max(0, ...this.columns.map((col) => col.data.length));
  }
  get totalPages(): number {
    return Math.ceil(this.rowCount / 10);
  }
  get safePage(): number {
    return Math.max(0, Math.min(this.page, this.totalPages - 1));
  }
  get visibleRows(): number[] {
    return Array.from(
      { length: Math.min(10, this.rowCount - this.safePage * 10) },
      (_, i) => this.safePage * 10 + i,
    );
  }
  get skeletonColumns(): number[] {
    return Array.from(
      { length: Math.max(3, this.columns.length || this.props?.columns?.length || 0) },
      (_, i) => i,
    );
  }
  ngAfterViewChecked(): void {
    const container = this.container?.nativeElement;
    if (container !== this.observed) {
      this.observer?.disconnect();
      this.observed = container;
      if (container && typeof ResizeObserver !== "undefined") {
        this.observer = new ResizeObserver(() => this.measure());
        this.observer.observe(container);
      }
    }
    this.measure();
  }
  measure(): void {
    const container = this.container?.nativeElement;
    if (!container) return;
    const scrollable = container.scrollWidth > container.clientWidth;
    if (this.table) this.table.nativeElement.style.width = scrollable ? "max-content" : "100%";
    const disabled = [
      container.scrollLeft <= 0,
      container.scrollLeft >= container.scrollWidth - container.clientWidth - 1,
    ];
    [this.leftControl, this.rightControl].forEach((ref, i) => {
      if (!ref) return;
      ref.nativeElement.hidden = !scrollable;
      ref.nativeElement.classList.toggle("openui-scrollable-table-control-disabled", disabled[i]);
    });
    if (this.leftButton) this.leftButton.nativeElement.disabled = disabled[0] ?? true;
    if (this.rightButton) this.rightButton.nativeElement.disabled = disabled[1] ?? true;
  }
  scrollColumn(direction: number): void {
    const container = this.container?.nativeElement;
    if (!container) return;
    const start = container.getBoundingClientRect().left;
    const positions = [
      ...new Set(
        Array.from(container.querySelectorAll<HTMLElement>("th"), (th) =>
          Math.max(0, Math.round(th.getBoundingClientRect().left - start + container.scrollLeft)),
        ),
      ),
    ].sort((a, b) => a - b);
    const max = container.scrollWidth - container.clientWidth;
    const target =
      direction > 0
        ? (positions.find((x) => x > container.scrollLeft + 1) ?? max)
        : (positions.filter((x) => x < container.scrollLeft - 1).at(-1) ?? 0);
    container.scrollTo?.({ left: Math.max(0, Math.min(target, max)), behavior: "smooth" });
  }
  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
