import { DOCUMENT } from "@angular/common";
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  ViewChild,
  inject,
  signal,
} from "@angular/core";
import { FieldProps, OpenUiField } from "./field";
export interface DateRangeValue {
  from?: Date;
  to?: Date;
}
export function calendarDate(value: unknown): Date | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime()))
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  if (typeof value === "string") {
    const match = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/.exec(value);
    if (match) {
      const y = Number(match[1]),
        m = Number(match[2]) - 1,
        d = Number(match[3]),
        date = new Date(y, m, d);
      if (date.getFullYear() === y && date.getMonth() === m && date.getDate() === d) return date;
    }
  }
  return undefined;
}
const same = (a: Date | undefined, b: Date | undefined) =>
  !!a && !!b && a.getTime() === b.getTime();
export function calendarRange(value: unknown): DateRangeValue {
  if (!value || typeof value !== "object") return {};
  const v = value as Record<string, unknown>;
  return { from: calendarDate(v["from"]), to: calendarDate(v["to"]) };
}
export function formatCalendarDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
@Component({
  selector: "openui-calendar",
  standalone: true,
  template: ` <div class="openui-calendar-container">
    <div class="openui-calendar-root">
      <div class="openui-calendar-month-caption">
        <div class="openui-calendar-dropdowns-fullscreen">
          <select aria-label="Month" [value]="month().getMonth()" (change)="selectMonth($event)">
            @for (m of months; track $index) {
              <option [value]="$index">{{ m }}</option>
            }</select
          ><select aria-label="Year" [value]="month().getFullYear()" (change)="selectYear($event)">
            @for (y of years; track y) {
              <option [value]="y">{{ y }}</option>
            }
          </select>
        </div>
        <nav class="openui-calendar-nav-fullscreen" aria-label="Calendar navigation">
          <button
            type="button"
            class="openui-calendar-button-previous"
            aria-label="Previous month"
            [disabled]="month().getFullYear() === 1900 && month().getMonth() === 0"
            (click)="shift(-1)"
          >
            ‹</button
          ><button
            type="button"
            class="openui-calendar-button-next"
            aria-label="Next month"
            [disabled]="month().getFullYear() === 2100 && month().getMonth() === 11"
            (click)="shift(1)"
          >
            ›
          </button>
        </nav>
      </div>
      <table
        class="openui-calendar-month-grid"
        role="grid"
        [attr.aria-label]="months[month().getMonth()] + ' ' + month().getFullYear()"
      >
        <thead>
          <tr class="openui-calendar-weekdays">
            @for (day of weekdays; track day) {
              <th class="openui-calendar-weekday" scope="col">{{ day }}</th>
            }
          </tr>
        </thead>
        <tbody>
          @for (week of weeks; track $index) {
            <tr>
              @for (day of week; track $index) {
                <td [class]="dayClass(day)" [attr.aria-selected]="day ? selected(day) : null">
                  @if (day) {
                    <button
                      type="button"
                      [class]="'openui-calendar-' + mode + '-day-button'"
                      [attr.data-date]="day.getDate()"
                      [attr.aria-label]="format(day)"
                      [attr.aria-current]="sameDay(day, today) ? 'date' : null"
                      [tabIndex]="sameDay(day, focused()) ? 0 : -1"
                      (click)="choose(day)"
                      (keydown)="key(day, $event)"
                    >
                      {{ day.getDate() }}
                    </button>
                  }
                </td>
              }
            </tr>
          }
        </tbody>
      </table>
    </div>
  </div>`,
  styles: [
    `
      :host {
        display: block;
      }
      select {
        font: inherit;
        color: inherit;
        background: var(--openui-foreground);
        border: 0;
        max-width: 130px;
      }
      nav {
        display: flex;
        gap: 6px;
      }
      button {
        cursor: pointer;
      }
      button:focus-visible {
        outline: 2px solid var(--openui-interactive-accent-default, #2681d7);
      }
      table {
        border-collapse: collapse;
      }
      td,
      th {
        text-align: center;
      }
    `,
  ],
})
export class OpenUiCalendarComponent implements OnChanges {
  @Input() mode: "single" | "range" = "single";
  @Input() value: unknown;
  @Output() valueChange = new EventEmitter<Date | DateRangeValue | undefined>();
  readonly today = calendarDate(new Date())!;
  readonly month = signal(new Date(this.today.getFullYear(), this.today.getMonth(), 1));
  readonly focused = signal(this.today);
  readonly months = Array.from({ length: 12 }, (_, i) =>
    new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date(2000, i, 1)),
  );
  readonly years = Array.from({ length: 201 }, (_, i) => 1900 + i);
  readonly weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  readonly format = formatCalendarDate;
  readonly sameDay = same;
  private initialized = false;
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  ngOnChanges() {
    if (!this.initialized) {
      this.initialized = true;
      const initial =
        this.mode === "single" ? calendarDate(this.value) : calendarRange(this.value).from;
      if (initial) this.navigate(initial);
    }
  }
  get weeks() {
    const m = this.month(),
      offset = m.getDay(),
      count = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
    return Array.from({ length: Math.ceil((offset + count) / 7) }, (_, week) =>
      Array.from({ length: 7 }, (_, day) => {
        const n = week * 7 + day - offset + 1;
        return n > 0 && n <= count ? new Date(m.getFullYear(), m.getMonth(), n) : undefined;
      }),
    );
  }
  selected(day: Date) {
    if (this.mode === "single") return same(day, calendarDate(this.value));
    const { from, to } = calendarRange(this.value);
    return !!from && (same(day, from) || (!!to && day >= from && day <= to));
  }
  dayClass(day?: Date) {
    const classes = ["openui-calendar-" + this.mode + "-day"];
    if (!day) return classes.join(" ");
    if (same(day, this.today)) classes.push("openui-calendar-today");
    if (this.mode === "single" && this.selected(day))
      classes.push("openui-calendar-single-day-selected");
    if (this.mode === "range") {
      const { from, to } = calendarRange(this.value);
      if (same(day, from)) classes.push("openui-calendar-range-start");
      if (same(day, to)) classes.push("openui-calendar-range-end");
      if (from && to && day > from && day < to) classes.push("openui-calendar-range-middle");
    }
    return classes.join(" ");
  }
  choose(day: Date) {
    this.focused.set(day);
    if (this.mode === "single") {
      this.valueChange.emit(same(calendarDate(this.value), day) ? undefined : new Date(day));
      return;
    }
    const { from, to } = calendarRange(this.value);
    if (!from || to) this.valueChange.emit({ from: new Date(day), to: undefined });
    else
      this.valueChange.emit(
        day < from ? { from: new Date(day), to: from } : { from, to: new Date(day) },
      );
  }
  private navigate(day: Date) {
    if (day.getFullYear() < 1900 || day.getFullYear() > 2100) return;
    this.month.set(new Date(day.getFullYear(), day.getMonth(), 1));
    this.focused.set(day);
  }
  shift(delta: number) {
    const m = this.month();
    this.navigate(new Date(m.getFullYear(), m.getMonth() + delta, 1));
  }
  selectMonth(event: Event) {
    this.navigate(
      new Date(this.month().getFullYear(), Number((event.target as HTMLSelectElement).value), 1),
    );
  }
  selectYear(event: Event) {
    this.navigate(
      new Date(Number((event.target as HTMLSelectElement).value), this.month().getMonth(), 1),
    );
  }
  focusDay() {
    queueMicrotask(() =>
      this.host.nativeElement
        .querySelector<HTMLButtonElement>(`[data-date="${this.focused().getDate()}"]`)
        ?.focus(),
    );
  }
  key(day: Date, event: KeyboardEvent) {
    const next = new Date(day);
    switch (event.key) {
      case "ArrowLeft":
        next.setDate(day.getDate() - 1);
        break;
      case "ArrowRight":
        next.setDate(day.getDate() + 1);
        break;
      case "ArrowUp":
        next.setDate(day.getDate() - 7);
        break;
      case "ArrowDown":
        next.setDate(day.getDate() + 7);
        break;
      case "Home":
        next.setDate(day.getDate() - day.getDay());
        break;
      case "End":
        next.setDate(day.getDate() + 6 - day.getDay());
        break;
      case "PageUp":
      case "PageDown": {
        const delta = event.key === "PageUp" ? -1 : 1;
        const target = new Date(
          day.getFullYear(),
          day.getMonth() + delta * (event.shiftKey ? 12 : 1),
          1,
        );
        target.setDate(
          Math.min(
            day.getDate(),
            new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate(),
          ),
        );
        next.setTime(target.getTime());
        break;
      }
      default:
        return;
    }
    event.preventDefault();
    this.navigate(next);
    this.focusDay();
  }
}
@Component({
  selector: "openui-date-picker",
  standalone: true,
  imports: [OpenUiCalendarComponent],
  template: ` <div class="openui-date-picker-renderer-floating-container">
    <button
      #trigger
      type="button"
      class="openui-date-picker-renderer-floating-input-container"
      [class.openui-date-picker-renderer-floating-input-container-open]="opened()"
      [class.openui-date-picker-renderer-floating-input-container-not-open]="!opened()"
      [class.openui-date-picker-renderer-floating-input-container-has-no-selected-date]="
        !field.value
      "
      [id]="id"
      aria-haspopup="dialog"
      [attr.aria-expanded]="opened()"
      [attr.aria-controls]="id + '-calendar'"
      [attr.aria-labelledby]="labelId"
      [attr.aria-label]="ariaLabel"
      [attr.aria-describedby]="describedBy"
      [disabled]="context.isStreaming"
      (click)="toggle()"
    >
      <span class="openui-date-picker-renderer-floating-input-container-text">{{ display }}</span
      ><svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
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
      role="dialog"
      [id]="id + '-calendar'"
      [attr.aria-label]="props?.name || 'Choose date'"
      class="openui-date-picker-renderer-floating-content openui-angular-calendar-popover"
      (toggle)="toggled($event)"
      (keydown.escape)="close(true)"
    >
      @if (opened()) {
        <div class="openui-date-picker-renderer-floating-menu">
          <div [class]="'openui-date-picker-renderer-' + mode + '-mode'">
            <openui-calendar [mode]="mode" [value]="field.value" (valueChange)="choose($event)" />
          </div>
        </div>
      }
    </div>
  </div>`,
  styles: [
    `
      .openui-angular-calendar-popover {
        position: fixed;
        margin: 0;
        padding: 0;
        border: 0;
        max-width: calc(100vw - 16px);
        max-height: calc(100vh - 16px);
        overflow: auto;
      }
      .openui-date-picker-renderer-floating-input-container {
        text-align: left;
      }
    `,
  ],
})
export class OpenUiDatePickerComponent extends OpenUiField<
  FieldProps & { mode?: "single" | "range" }
> {
  @ViewChild("trigger", { static: true }) private trigger!: ElementRef<HTMLButtonElement>;
  @ViewChild("popup", { static: true }) private popup!: ElementRef<HTMLElement>;
  @ViewChild(OpenUiCalendarComponent) private calendar?: OpenUiCalendarComponent;
  readonly opened = signal(false);
  private document = inject(DOCUMENT);
  get mode() {
    return this.props?.mode ?? "single";
  }
  get display() {
    if (this.mode === "single") {
      const date = calendarDate(this.field.value);
      return date ? formatCalendarDate(date) : "Select a date";
    }
    const { from, to } = calendarRange(this.field.value);
    return from
      ? to && !same(from, to)
        ? `${formatCalendarDate(from)} - ${formatCalendarDate(to)}`
        : formatCalendarDate(from)
      : "Select a range";
  }
  toggle() {
    if (this.context.isStreaming) return;
    if (this.opened()) {
      this.close(true);
      return;
    }
    this.popup.nativeElement.showPopover();
    this.opened.set(true);
    this.position();
    this.document.addEventListener("scroll", this.position, true);
    this.document.defaultView?.addEventListener("resize", this.position);
    queueMicrotask(() => {
      this.position();
      this.calendar?.focusDay();
    });
  }
  private position = () => {
    const win = this.document.defaultView;
    if (!win) return;
    const el = this.popup.nativeElement,
      r = this.trigger.nativeElement.getBoundingClientRect();
    el.style.left = `${Math.max(8, Math.min(r.left, win.innerWidth - el.offsetWidth - 8))}px`;
    el.style.top = `${r.bottom + el.offsetHeight + 5 > win.innerHeight && r.top > el.offsetHeight ? Math.max(8, r.top - el.offsetHeight - 5) : r.bottom + 5}px`;
  };
  private detach() {
    this.document.removeEventListener("scroll", this.position, true);
    this.document.defaultView?.removeEventListener("resize", this.position);
  }
  close(restore = false) {
    if (this.opened()) this.popup.nativeElement.hidePopover();
    this.opened.set(false);
    this.detach();
    if (restore) this.trigger.nativeElement.focus();
  }
  toggled(event: Event) {
    if ((event as Event & { newState: string }).newState === "closed") {
      this.opened.set(false);
      this.detach();
    }
  }
  choose(value: unknown) {
    this.setValue(value, true);
  }
  override ngDoCheck() {
    super.ngDoCheck();
    if (this.context.isStreaming && this.opened()) this.close();
  }
  override ngOnDestroy() {
    this.detach();
    super.ngOnDestroy();
  }
}
