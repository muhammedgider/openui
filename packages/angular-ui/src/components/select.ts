import { DOCUMENT } from "@angular/common";
import { Component, ElementRef, ViewChild, inject, signal } from "@angular/core";
import { FieldProps, OpenUiField, itemProps } from "./field";

interface SelectItem {
  value: string;
  label: string;
}
export const OPENUI_SELECT_TEMPLATE = `<button
      #trigger
      type="button"
      role="combobox"
      aria-haspopup="listbox"
      [id]="id"
      [class]="'openui-select-trigger openui-select-trigger-' + size"
      [attr.aria-expanded]="opened()"
      [attr.aria-controls]="id + '-listbox'"
      [attr.aria-label]="ariaLabel"
      [attr.aria-labelledby]="labelId"
      [attr.aria-describedby]="describedBy"
      [attr.aria-invalid]="error ? true : null"
      [attr.data-placeholder]="value ? null : ''"
      [attr.data-state]="opened() ? 'open' : 'closed'"
      [disabled]="context.isStreaming"
      (click)="show()"
      (keydown)="triggerKey($event)"
    >
      <span>{{ selectedLabel }}</span>
      <svg
        class="openui-select-trigger-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
    <div
      #popup
      popover="auto"
      [id]="id + '-listbox'"
      role="listbox"
      [attr.aria-label]="props?.name"
      [class]="
        'openui-select-content openui-select-content-' + size + ' openui-angular-select-popover'
      "
      (toggle)="toggled($event)"
      (keydown)="listKey($event)"
    >
      <div class="openui-select-viewport" data-position="popper">
        @for (item of items; track item.value; let i = $index) {
          <div
            role="option"
            tabindex="-1"
            class="openui-select-item openui-select-item--with-tick"
            [attr.aria-selected]="value === item.value"
            [attr.data-state]="value === item.value ? 'checked' : 'unchecked'"
            (click)="choose(item.value)"
            (pointermove)="focusOption(i)"
          >
            <span class="openui-select-item-text">{{ item.label || item.value }}</span>
            @if (value === item.value) {
              <span class="openui-select-item-check-wrapper"
                ><svg
                  class="openui-select-item-check-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <path d="m20 6-11 11-5-5" /></svg
              ></span>
            }
          </div>
        }
      </div>
    </div>`;
@Component({ selector: "openui-select", standalone: true, template: OPENUI_SELECT_TEMPLATE })
export class OpenUiSelectComponent extends OpenUiField<
  FieldProps & { items: unknown[]; placeholder?: string; size?: "small" | "medium" | "large" }
> {
  @ViewChild("trigger", { static: true }) private trigger!: ElementRef<HTMLButtonElement>;
  @ViewChild("popup", { static: true }) private popup!: ElementRef<HTMLElement>;
  private readonly document = inject(DOCUMENT);
  readonly opened = signal(false);
  private search = "";
  private lastKey = 0;
  get items() {
    return itemProps<SelectItem>(this.props?.items).filter((item) => !!item.value);
  }
  get value(): string {
    return String(this.field.value ?? "");
  }
  get size(): string {
    return { small: "sm", medium: "md", large: "lg" }[this.props?.size ?? "medium"];
  }
  get selectedLabel(): string {
    return (
      this.items.find((item) => item.value === this.value)?.label ||
      this.value ||
      this.props?.placeholder ||
      "Select..."
    );
  }
  private options(): HTMLElement[] {
    return Array.from(this.popup.nativeElement.querySelectorAll<HTMLElement>('[role="option"]'));
  }
  private position = (): void => {
    const win = this.document.defaultView;
    if (!win) return;
    const rect = this.trigger.nativeElement.getBoundingClientRect();
    const el = this.popup.nativeElement;
    el.style.minWidth = `${rect.width}px`;
    el.style.maxWidth = `${Math.max(0, win.innerWidth - 16)}px`;
    const below = win.innerHeight - rect.bottom - 10;
    const above = rect.top - 10;
    const useAbove = below < Math.min(200, el.scrollHeight) && above > below;
    el.style.maxHeight = `${Math.min(372, Math.max(0, useAbove ? above : below))}px`;
    el.style.left = `${Math.max(8, Math.min(rect.left, win.innerWidth - el.offsetWidth - 8))}px`;
    el.style.top = `${useAbove ? Math.max(8, rect.top - el.offsetHeight - 2) : rect.bottom + 2}px`;
  };
  show(): void {
    if (this.context.isStreaming || this.opened()) return;
    this.popup.nativeElement.showPopover();
    this.opened.set(true);
    this.position();
    this.document.addEventListener("scroll", this.position, true);
    this.document.defaultView?.addEventListener("resize", this.position);
    this.focusOption(
      Math.max(
        0,
        this.items.findIndex((item) => item.value === this.value),
      ),
    );
  }
  private detachListeners(): void {
    this.document.removeEventListener("scroll", this.position, true);
    this.document.defaultView?.removeEventListener("resize", this.position);
  }
  close(restoreFocus = false): void {
    if (this.opened()) this.popup.nativeElement.hidePopover();
    this.opened.set(false);
    this.detachListeners();
    if (restoreFocus) this.trigger.nativeElement.focus();
  }
  toggled(event: Event): void {
    const isOpen = (event as Event & { newState: string }).newState === "open";
    this.opened.set(isOpen);
    if (!isOpen) this.detachListeners();
  }
  choose(value: string): void {
    if (this.context.isStreaming) return;
    this.setValue(value, true);
    this.close(true);
  }
  focusOption(index: number): void {
    this.options()[index]?.focus({ preventScroll: true });
  }
  triggerKey(event: KeyboardEvent): void {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      this.show();
    }
  }
  listKey(event: KeyboardEvent): void {
    const options = this.options();
    if (!options.length) return;
    const current = options.indexOf(this.document.activeElement as HTMLElement);
    if (event.key === "Escape") {
      event.preventDefault();
      this.close(true);
      return;
    }
    if (event.key === "Tab") {
      this.close(true);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const item = this.items[current];
      if (item) this.choose(item.value);
      return;
    }
    let next = -1;
    if (event.key === "ArrowDown") next = Math.min(options.length - 1, current + 1);
    if (event.key === "ArrowUp") next = Math.max(0, current - 1);
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = options.length - 1;
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      this.search = (Date.now() - this.lastKey < 700 ? this.search : "") + event.key.toLowerCase();
      this.lastKey = Date.now();
      next = this.items.findIndex((item) =>
        (item.label || item.value).toLowerCase().startsWith(this.search),
      );
    }
    if (next >= 0) {
      event.preventDefault();
      this.focusOption(next);
      options[next]?.scrollIntoView({ block: "nearest" });
    }
  }
  override ngDoCheck(): void {
    super.ngDoCheck();
    if (this.context.isStreaming && this.opened()) this.close();
  }
  override ngOnDestroy(): void {
    this.detachListeners();
    super.ngOnDestroy();
  }
}
