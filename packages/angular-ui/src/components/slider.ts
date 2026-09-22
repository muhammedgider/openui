import { Component, ElementRef, ViewChild, signal } from "@angular/core";
import { FieldProps, OpenUiField } from "./field";
import { OpenUiSliderSelectComponent } from "./slider-select";
export interface SliderProps extends FieldProps {
  variant: "continuous" | "discrete";
  min: number;
  max: number;
  step?: number;
  defaultValue?: number[];
  label?: string;
}
@Component({
  selector: "openui-slider",
  standalone: true,
  imports: [OpenUiSliderSelectComponent],
  template: ` <div class="openui-slider-block">
    <div
      class="openui-slider-block__header"
      [class.openui-slider-block__header--with-error]="rangeError"
    >
      <span class="openui-slider-block__label" [id]="id + '-label'">{{
        props?.label || props?.name
      }}</span>
      @if (!context.isStreaming) {
        <div
          class="openui-slider-block__controls"
          [class.is-single]="values().length === 1"
          [class.is-range]="values().length > 1"
        >
          <div
            [class]="
              props?.variant === 'discrete'
                ? 'openui-slider-block__validated-select-container'
                : 'openui-slider-block__validated-input-container'
            "
          >
            @for (v of values(); track $index; let i = $index) {
              @if (i) {
                <div class="openui-slider-block__separator"></div>
              }
              @if (props?.variant === "discrete") {
                <openui-slider-select
                  [props]="{ name: label(i), items: [] }"
                  [choices]="options(i)"
                  [selected]="v"
                  (selectedChange)="selectValue(i, $event)"
                />
              } @else {
                <div class="openui-slider-block__validated-input">
                  <input
                    type="text"
                    inputmode="decimal"
                    class="openui-input openui-input-medium openui-slider-block__input"
                    [value]="v"
                    [attr.aria-label]="label(i)"
                    [attr.aria-invalid]="rangeError ? true : null"
                    (input)="input(i, $event, false)"
                  />
                </div>
              }
            }
          </div>
        </div>
      }
    </div>
    @if (rangeError && !context.isStreaming) {
      <div class="openui-slider-block__error-message" role="alert">{{ rangeError }}</div>
    }
    <div class="openui-slider-block__content">
      <div class="openui-slider-wrapper">
        <div class="openui-slider-container-wrapper">
          <div class="openui-slider-container">
            <div
              #track
              class="openui-slider-root"
              [class.openui-slider--disabled]="context.isStreaming"
              style="touch-action:none"
              (pointerdown)="down($event)"
              (pointermove)="move($event)"
              (pointerup)="up($event)"
              (pointercancel)="up($event)"
            >
              <div class="openui-slider-track">
                <div
                  class="openui-slider-range"
                  [style.left.%]="values().length > 1 ? percent(values()[0] ?? min) : 0"
                  [style.right.%]="100 - percent(values()[values().length - 1] ?? min)"
                ></div>
                @if (props?.variant === "discrete" && !context.isStreaming) {
                  @for (dot of dots; track dot) {
                    <div
                      class="openui-slider-dots-dot"
                      [class.openui-slider-dots-dot--active]="
                        dot <= (values()[values().length - 1] ?? min) &&
                        (values().length === 1 || dot >= (values()[0] ?? min))
                      "
                      [style.left.%]="percent(dot)"
                    ></div>
                  }
                }
              </div>
              @for (v of values(); track $index; let i = $index) {
                <button
                  type="button"
                  class="openui-slider-thumb"
                  role="slider"
                  [id]="i === 0 ? id : id + '-' + i"
                  [disabled]="context.isStreaming"
                  [attr.aria-label]="label(i)"
                  [attr.aria-valuemin]="i ? values()[i - 1]! + step : min"
                  [attr.aria-valuemax]="i < values().length - 1 ? values()[i + 1]! - step : max"
                  [attr.aria-valuenow]="v"
                  [attr.aria-describedby]="describedBy"
                  [style.left.%]="percent(v)"
                  style="position:absolute;transform:translateX(-50%);padding:0;border:0;background:transparent"
                  (keydown)="key(i, $event)"
                >
                  <span class="openui-slider-thumb-handle"
                    ><span class="openui-slider-thumb-handle-inner"
                      ><span class="openui-slider-thumb-handle-inner-dot"></span
                    ></span>
                    @if (!context.isStreaming) {
                      <span class="openui-slider-thumb-value">{{ compact(v) }}</span>
                    }
                  </span>
                </button>
              }
            </div>
          </div>
          <div class="openui-slider-labels">
            <span>{{ compact(min) }}</span
            ><span>{{ compact(max) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>`,
})
export class OpenUiSliderComponent extends OpenUiField<SliderProps> {
  @ViewChild("track") private track?: ElementRef<HTMLElement>;
  readonly values = signal<number[]>([0]);
  private previous: unknown;
  private previousName = "";
  private previousMin = NaN;
  private timer?: ReturnType<typeof setTimeout>;
  private pending?: number[];
  private active = -1;
  get min() {
    return Number.isFinite(this.props?.min) ? this.props!.min : 0;
  }
  get max() {
    return Math.max(this.min, Number.isFinite(this.props?.max) ? this.props!.max : 100);
  }
  get step() {
    const step = this.props?.step;
    return step && Number.isFinite(step) && step > 0
      ? this.props?.variant === "discrete"
        ? step
        : Math.max(1, step)
      : 1;
  }
  override ngDoCheck() {
    super.ngDoCheck();
    const source = this.field.value ?? this.props?.defaultValue;
    const name = this.field.name;
    if (source !== this.previous || name !== this.previousName || this.min !== this.previousMin) {
      this.cancel();
      this.previous = source;
      this.previousName = name;
      this.previousMin = this.min;
      const values = Array.isArray(source)
        ? source.filter((v): v is number => typeof v === "number" && Number.isFinite(v))
        : [];
      this.values.set(values.length ? [...values] : [this.min]);
    }
    if (this.context.isStreaming) {
      this.cancel();
      this.active = -1;
    }
  }
  override ngOnDestroy() {
    this.flush();
    super.ngOnDestroy();
  }
  label(i: number) {
    return `${this.props?.label || this.props?.name || "Value"}${this.values().length > 1 ? ` ${i === 0 ? "minimum" : i === 1 ? "maximum" : i + 1}` : ""}`;
  }
  compact(v: number) {
    return v >= 1000
      ? new Intl.NumberFormat("en-US", { notation: "compact" }).format(v).toLowerCase()
      : String(v);
  }
  percent(v: number) {
    return this.max === this.min
      ? 0
      : Math.max(0, Math.min(100, ((v - this.min) / (this.max - this.min)) * 100));
  }
  get rangeError() {
    const values = this.values();
    if (values.some((v) => v < this.min || v > this.max))
      return `Value must be between ${this.min} and ${this.max}`;
    if (values.some((v, i) => i > 0 && v < values[i - 1]!)) return "Min must be less than max";
    return "";
  }
  get dots() {
    const count = Math.floor((this.max - this.min) / this.step) + 1;
    return this.context.isStreaming || count > 10000
      ? []
      : Array.from({ length: Math.max(0, count) }, (_, i) =>
          Number((this.min + i * this.step).toFixed(10)),
        );
  }
  options(i: number) {
    return this.dots.filter(
      (v) =>
        (i === 0 || v > this.values()[i - 1]!) &&
        (i === this.values().length - 1 || v < this.values()[i + 1]!),
    );
  }
  selectValue(i: number, value: number) {
    const values = [...this.values()];
    values[i] = value;
    this.change(values.sort((a, b) => a - b));
  }
  input(i: number, event: Event, sorted: boolean) {
    const n = Number((event.target as HTMLInputElement).value);
    if (!Number.isFinite(n)) return;
    const values = [...this.values()];
    values[i] = n;
    this.change(sorted ? values.sort((a, b) => a - b) : values);
  }
  private change(values: number[]) {
    if (this.context.isStreaming) return;
    this.values.set(values);
    this.pending = [...values];
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), 200);
  }
  private cancel() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    this.pending = undefined;
  }
  private flush() {
    const values = this.pending;
    this.cancel();
    if (!values || this.context.isStreaming) return;
    this.setValue(values);
    this.previous = values;
    this.validateCurrent(values[0]);
  }
  private setThumb(i: number, value: number) {
    const values = [...this.values()];
    const n = Math.min(
      this.max,
      Math.max(
        this.min,
        Number((this.min + Math.round((value - this.min) / this.step) * this.step).toFixed(10)),
      ),
    );
    if (
      (i > 0 && n < values[i - 1]! + this.step) ||
      (i < values.length - 1 && n > values[i + 1]! - this.step)
    )
      return;
    values[i] = n;
    this.change(values);
  }
  private pointerValue(event: PointerEvent) {
    const rect = this.track!.nativeElement.getBoundingClientRect();
    let ratio = rect.width ? (event.clientX - rect.left) / rect.width : 0;
    const win = this.track!.nativeElement.ownerDocument.defaultView;
    if (win?.getComputedStyle(this.track!.nativeElement).direction === "rtl") ratio = 1 - ratio;
    return this.min + ratio * (this.max - this.min);
  }
  down(event: PointerEvent) {
    if (this.context.isStreaming || event.button !== 0 || !this.track) return;
    event.preventDefault();
    const value = this.pointerValue(event);
    this.active = this.values().reduce(
      (best, v, i) => (Math.abs(v - value) < Math.abs(this.values()[best]! - value) ? i : best),
      0,
    );
    this.track.nativeElement.setPointerCapture(event.pointerId);
    this.track.nativeElement
      .querySelectorAll<HTMLButtonElement>("[role=slider]")
      [this.active]?.focus();
    this.setThumb(this.active, value);
  }
  move(event: PointerEvent) {
    if (this.active >= 0 && !this.context.isStreaming)
      this.setThumb(this.active, this.pointerValue(event));
  }
  up(event: PointerEvent) {
    if (this.track?.nativeElement.hasPointerCapture(event.pointerId))
      this.track.nativeElement.releasePointerCapture(event.pointerId);
    this.active = -1;
  }
  key(i: number, event: KeyboardEvent) {
    if (this.context.isStreaming) return;
    let v = this.values()[i] ?? this.min;
    const rtl =
      this.track?.nativeElement.ownerDocument.defaultView?.getComputedStyle(
        this.track.nativeElement,
      ).direction === "rtl";
    switch (event.key) {
      case "Home":
        v = this.min;
        break;
      case "End":
        v = this.max;
        break;
      case "ArrowUp":
        v += this.step;
        break;
      case "ArrowDown":
        v -= this.step;
        break;
      case "ArrowRight":
        v += this.step * (rtl ? -1 : 1);
        break;
      case "ArrowLeft":
        v += this.step * (rtl ? 1 : -1);
        break;
      case "PageUp":
        v += 10 * this.step;
        break;
      case "PageDown":
        v -= 10 * this.step;
        break;
      default:
        return;
    }
    event.preventDefault();
    this.setThumb(i, v);
  }
}
