import { Component, Directive } from "@angular/core";
import { RenderNode } from "@openuidev/angular-lang";
import { FieldProps, OpenUiField, itemProps } from "./field";
import { OpenUiInlineMarkdownComponent } from "./markdown";

interface ChoiceItem {
  value: string;
  label?: string;
  title?: string;
  subtitle?: string;
  icon?: unknown;
  topContent?: unknown;
  disabled?: boolean;
}
interface ChoiceProps extends FieldProps {
  type?: "single" | "multiple";
  items: unknown[];
  defaultValue?: string | string[];
}

/** Same balanced row distribution as upstream's smallCardBlockUtils, without React hooks. */
export function choiceRows(count: number): number[] {
  if (count <= 0) return [];
  if (count === 1) return [1];
  if (count % 3 === 0) return Array<number>(count / 3).fill(3);
  if (count % 3 === 2) {
    const rows = Array<number>(Math.floor(count / 3)).fill(3);
    rows.splice(Math.ceil(rows.length / 2), 0, 2);
    return rows;
  }
  return [...Array<number>(Math.floor((count - 4) / 3)).fill(3), 2, 2];
}

@Directive()
abstract class ChoiceField extends OpenUiField<ChoiceProps> {
  protected abstract defaultType: "single" | "multiple";
  protected abstract componentType: string;
  private touchedField?: string;
  get type() {
    return this.props?.type ?? this.defaultType;
  }
  get items() {
    return itemProps<ChoiceItem>(this.props?.items).filter(
      (item) => typeof item.value === "string" && item.value.length > 0,
    );
  }
  private normalize(value: unknown): string[] {
    if (typeof value === "string") return value ? [value] : [];
    if (Array.isArray(value)) {
      if (this.type === "single") return typeof value[0] === "string" && value[0] ? [value[0]] : [];
      return value.filter((item): item is string => typeof item === "string");
    }
    return [];
  }
  get selected(): string[] {
    const stored = this.field.value;
    // An explicit deselection must not resurrect the default during a subsequent render.
    return this.normalize(
      stored ?? (this.touchedField === this.field.name ? undefined : this.props?.defaultValue),
    );
  }
  override get validationValue() {
    return this.type === "single"
      ? this.selected[0]
      : this.selected.length
        ? this.selected
        : undefined;
  }
  override ngDoCheck(): void {
    super.ngDoCheck();
    if (this.context.isStreaming || !this.props?.name || this.touchedField === this.field.name)
      return;
    if (this.field.value == null && this.props.defaultValue !== undefined) {
      const defaults = this.normalize(this.props.defaultValue);
      const value = this.type === "single" ? defaults[0] : defaults;
      if (value !== undefined)
        this.context.setFieldValue(this.formName, this.componentType, this.field.name, value);
    }
  }
  toggle(item: ChoiceItem): void {
    if (this.context.isStreaming || item.disabled) return;
    const current = this.selected;
    const next =
      this.type === "single"
        ? current[0] === item.value
          ? []
          : [item.value]
        : current.includes(item.value)
          ? current.filter((value) => value !== item.value)
          : [...current, item.value];
    this.touchedField = this.field.name;
    const value = this.type === "single" ? next[0] : next;
    this.context.setFieldValue(this.formName, this.componentType, this.field.name, value, true);
    this.validateCurrent(this.type === "single" ? next[0] : next.length ? next : undefined);
  }
  navigate(event: KeyboardEvent): void {
    const keys = ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"];
    if (!keys.includes(event.key)) return;
    const group = event.currentTarget as HTMLElement;
    const buttons = Array.from(group.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
    if (!buttons.length) return;
    const current = buttons.indexOf(event.target as HTMLButtonElement);
    if (current < 0) return;
    event.preventDefault();
    const rtl = group.ownerDocument.defaultView?.getComputedStyle(group).direction === "rtl";
    const backwards = event.key === "ArrowUp" || event.key === (rtl ? "ArrowRight" : "ArrowLeft");
    const index =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? buttons.length - 1
          : (current + (backwards ? -1 : 1) + buttons.length) % buttons.length;
    buttons[index]?.focus();
  }
}

@Component({
  selector: "openui-chips",
  standalone: true,
  imports: [RenderNode],
  template: `<div
    class="openui-chips"
    role="listbox"
    [id]="id"
    [attr.aria-label]="ariaLabel"
    [attr.aria-labelledby]="labelId"
    [attr.aria-describedby]="describedBy"
    [attr.aria-invalid]="error ? true : null"
    [attr.aria-multiselectable]="type === 'multiple'"
    (keydown)="navigate($event)"
  >
    @for (item of items; track item.value) {
      <button
        type="button"
        role="option"
        class="openui-chip-item"
        [class.openui-chip-item--selected]="selected.includes(item.value)"
        [class.openui-chip-item--disabled]="context.isStreaming || item.disabled"
        [attr.aria-selected]="selected.includes(item.value)"
        [disabled]="context.isStreaming || item.disabled === true"
        (click)="toggle(item)"
      >
        @if (item.icon) {
          <span class="openui-chip-item__icon"
            ><openui-render-node
              [value]="item.icon"
              [library]="context.library"
              [context]="context"
              [formName]="formName"
          /></span>
        }
        <span class="openui-chip-item__text">{{ item.label }}</span>
      </button>
    }
  </div>`,
})
export class OpenUiChipsComponent extends ChoiceField {
  protected defaultType = "multiple" as const;
  protected componentType = "Chips";
}

@Component({
  selector: "openui-option-cards",
  standalone: true,
  imports: [RenderNode, OpenUiInlineMarkdownComponent],
  template: `<div
    class="openui-option-cards"
    [id]="id"
    [attr.role]="type === 'single' ? 'radiogroup' : 'group'"
    [attr.aria-label]="ariaLabel"
    [attr.aria-labelledby]="labelId"
    [attr.aria-describedby]="describedBy"
    [attr.aria-invalid]="error ? true : null"
    (keydown)="navigate($event)"
  >
    <div
      class="openui-option-cards__grid openui-option-cards__grid--responsive"
      [class.openui-option-cards__grid--odd-count]="items.length % 2 === 1"
    >
      @for (row of rows; track $index) {
        <div [class]="'openui-option-cards__row openui-option-cards__row--' + row.length">
          @for (item of row; track item.value) {
            <div class="openui-option-cards__item">
              <button
                type="button"
                [attr.role]="type === 'single' ? 'radio' : 'checkbox'"
                [attr.aria-checked]="selected.includes(item.value)"
                [disabled]="context.isStreaming || item.disabled === true"
                class="openui-option-card"
                [class.openui-option-card--selected]="selected.includes(item.value)"
                [class.openui-option-card--disabled]="context.isStreaming || item.disabled"
                (click)="toggle(item)"
              >
                <div class="openui-option-card__content">
                  @if (item.topContent != null) {
                    <div
                      [class]="
                        'openui-option-card__top openui-option-card__top--' +
                        topVariant(item.topContent)
                      "
                    >
                      <openui-render-node
                        [value]="item.topContent"
                        [library]="context.library"
                        [context]="context"
                        [formName]="formName"
                      />
                    </div>
                  }
                  <div class="openui-option-card__text">
                    <div class="openui-option-card__title">
                      <openui-inline-markdown [text]="item.title ?? ''" />
                    </div>
                    @if (item.subtitle) {
                      <div class="openui-option-card__subtitle">
                        <openui-inline-markdown [text]="item.subtitle" />
                      </div>
                    }
                  </div>
                </div>
              </button>
            </div>
          }
        </div>
      }
    </div>
  </div>`,
})
export class OpenUiOptionCardsComponent extends ChoiceField {
  protected defaultType = "single" as const;
  protected componentType = "OptionCards";
  get rows(): ChoiceItem[][] {
    const items = this.items;
    let offset = 0;
    return choiceRows(items.length).map((count) => {
      const row = items.slice(offset, offset + count);
      offset += count;
      return row;
    });
  }
  topVariant(value: unknown): "image" | "icon" {
    const node = value as { type?: unknown; props?: { src?: unknown } } | null;
    return node?.type === "element" && typeof node.props?.src === "string" ? "image" : "icon";
  }
}
