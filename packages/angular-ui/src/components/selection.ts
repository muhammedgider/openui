import { Component, Directive } from "@angular/core";
import { FieldProps, OpenUiField, itemProps } from "./field";

interface ToggleItem {
  label?: string;
  description?: string;
  name: string;
  defaultChecked?: boolean;
}
interface ToggleProps extends FieldProps {
  items: unknown[];
  variant?: "clear" | "card" | "sunk";
}

@Directive()
abstract class ToggleGroup extends OpenUiField<ToggleProps> {
  get items() {
    return itemProps<ToggleItem>(this.props?.items).filter((item) => typeof item.name === "string");
  }
  get aggregate(): Record<string, boolean> {
    const stored = this.field.value;
    return Object.fromEntries(
      this.items.map((item) => [
        item.name,
        stored && typeof stored === "object" && item.name in stored
          ? Boolean((stored as Record<string, unknown>)[item.name])
          : (item.defaultChecked ?? false),
      ]),
    );
  }
  toggle(name: string): void {
    this.setValue({ ...this.aggregate, [name]: !this.aggregate[name] }, true);
  }
}

@Component({
  selector: "openui-checkbox-group",
  standalone: true,
  template: `@if (items.length) {
    <div
      class="openui-checkbox-group openui-checkbox-group-clear"
      role="group"
      [id]="id"
      [attr.aria-label]="ariaLabel"
      [attr.aria-labelledby]="labelId"
      [attr.aria-describedby]="describedBy"
      [attr.aria-invalid]="error ? true : null"
    >
      @for (item of items; track item.name; let i = $index) {
        <div class="openui-checkbox-item-container">
          <button
            type="button"
            class="openui-checkbox-item-root"
            role="checkbox"
            [id]="id + '-' + i"
            [attr.aria-checked]="aggregate[item.name]"
            [attr.aria-labelledby]="id + '-label-' + i"
            [attr.aria-describedby]="item.description ? id + '-description-' + i : null"
            [attr.data-state]="aggregate[item.name] ? 'checked' : 'unchecked'"
            [attr.data-disabled]="context.isStreaming ? '' : null"
            [disabled]="context.isStreaming"
            (click)="toggle(item.name)"
          >
            @if (aggregate[item.name]) {
              <span class="openui-checkbox-item-indicator"
                ><svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                  <path
                    d="M9 1L3.5 6.5L1 4"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  /></svg
              ></span>
            }
          </button>
          <div class="openui-checkbox-item-content">
            <label
              class="openui-checkbox-item-label"
              [id]="id + '-label-' + i"
              [attr.for]="id + '-' + i"
              >{{ item.label }}</label
            >
            @if (item.description) {
              <p class="openui-checkbox-item-description" [id]="id + '-description-' + i">
                {{ item.description }}
              </p>
            }
          </div>
        </div>
      }
    </div>
  }`,
})
export class OpenUiCheckBoxGroupComponent extends ToggleGroup {}

@Component({
  selector: "openui-switch-group",
  standalone: true,
  template: `@if (items.length) {
    <div
      [class]="'openui-switch-group openui-switch-group-' + (props?.variant ?? 'clear')"
      role="group"
      [id]="id"
      [attr.aria-label]="ariaLabel"
      [attr.aria-labelledby]="labelId"
    >
      @for (item of items; track item.name; let i = $index) {
        <div class="openui-switch-item-container">
          <button
            type="button"
            role="switch"
            class="openui-switch-item-root"
            [id]="id + '-' + i"
            [attr.aria-checked]="aggregate[item.name]"
            [attr.aria-label]="item.label ? null : item.name"
            [attr.aria-labelledby]="item.label ? id + '-label-' + i : null"
            [attr.aria-describedby]="item.description ? id + '-description-' + i : null"
            [attr.data-state]="aggregate[item.name] ? 'checked' : 'unchecked'"
            [disabled]="context.isStreaming"
            [attr.data-disabled]="context.isStreaming ? '' : null"
            (click)="toggle(item.name)"
          >
            <span
              class="openui-switch-item-thumb"
              [attr.data-state]="aggregate[item.name] ? 'checked' : 'unchecked'"
            ></span>
          </button>
          <div class="openui-switch-item-content">
            @if (item.label) {
              <label
                class="openui-switch-item-label"
                [id]="id + '-label-' + i"
                [attr.for]="id + '-' + i"
                >{{ item.label }}</label
              >
            }
            @if (item.description) {
              <p class="openui-switch-item-description" [id]="id + '-description-' + i">
                {{ item.description }}
              </p>
            }
          </div>
        </div>
      }
    </div>
  }`,
})
export class OpenUiSwitchGroupComponent extends ToggleGroup {}

interface RadioItem {
  label: string;
  description: string;
  value: string;
}
@Component({
  selector: "openui-radio-group",
  standalone: true,
  template: `@if (items.length) {
    <div
      class="openui-radio-group openui-radio-group-clear"
      role="radiogroup"
      [id]="id"
      [attr.aria-label]="ariaLabel"
      [attr.aria-labelledby]="labelId"
      [attr.aria-describedby]="describedBy"
      [attr.aria-invalid]="error ? true : null"
      [attr.aria-disabled]="context.isStreaming"
      (keydown)="keydown($event)"
    >
      @for (item of items; track item.value; let i = $index) {
        <div class="openui-radio-item-container">
          <button
            type="button"
            role="radio"
            class="openui-radio-item-root"
            [id]="id + '-' + i"
            [attr.data-state]="value === item.value ? 'checked' : 'unchecked'"
            [attr.aria-checked]="value === item.value"
            [attr.aria-labelledby]="id + '-label-' + i"
            [attr.aria-describedby]="item.description ? id + '-description-' + i : null"
            [attr.tabindex]="value === item.value || (!hasSelection && i === 0) ? 0 : -1"
            [disabled]="context.isStreaming"
            [attr.data-disabled]="context.isStreaming ? '' : null"
            (click)="setValue(item.value, true)"
          >
            <svg
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 16 16"
              class="openui-radio-item-svg"
              aria-hidden="true"
            >
              <path
                fill="currentColor"
                d="M1 8a7 7 0 1 1 14 0A7 7 0 0 1 1 8Z"
                class="openui-radio-item-svg-path"
              />
              <path
                stroke="currentColor"
                d="M1.5 8a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0Z"
                class="openui-radio-item-svg-border"
              />
              <path
                fill="currentColor"
                d="M4 8a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z"
                class="openui-radio-item-svg-inner"
              />
            </svg>
          </button>
          <div class="openui-radio-item-content">
            <label
              class="openui-radio-item-label"
              [id]="id + '-label-' + i"
              [attr.for]="id + '-' + i"
              >{{ item.label }}</label
            >
            @if (item.description) {
              <p class="openui-radio-item-description" [id]="id + '-description-' + i">
                {{ item.description }}
              </p>
            }
          </div>
        </div>
      }
    </div>
  }`,
})
export class OpenUiRadioGroupComponent extends OpenUiField<
  FieldProps & { items: unknown[]; defaultValue?: string }
> {
  get items() {
    return itemProps<RadioItem>(this.props?.items).filter((item) => typeof item.value === "string");
  }
  get value(): string {
    return String(this.field.value ?? this.props?.defaultValue ?? "");
  }
  get hasSelection(): boolean {
    return this.items.some((item) => item.value === this.value);
  }
  keydown(event: KeyboardEvent): void {
    if (
      this.context.isStreaming ||
      !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
    )
      return;
    const buttons = Array.from(
      (event.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>('[role="radio"]'),
    );
    const current = buttons.indexOf(event.target as HTMLButtonElement);
    if (current < 0 || !buttons.length) return;
    event.preventDefault();
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? buttons.length - 1
          : (current +
              (event.key === "ArrowUp" || event.key === "ArrowLeft" ? -1 : 1) +
              buttons.length) %
            buttons.length;
    const item = this.items[next];
    if (item) this.setValue(item.value, true);
    buttons[next]?.focus();
  }
}
