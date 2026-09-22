import {
  APP_ID,
  Directive,
  DoCheck,
  Injectable,
  InjectionToken,
  OnDestroy,
  inject,
  signal,
} from "@angular/core";
import {
  injectFormValidation,
  parseStructuredRules,
  resolveStateField,
  validate,
} from "@openuidev/angular-lang";
import { OpenUiComponent } from "./base";

@Injectable({ providedIn: "root" })
export class OpenUiIds {
  private readonly prefix = inject(APP_ID);
  private sequence = 0;
  next(): string {
    return `${this.prefix}-openui-${this.sequence++}`;
  }
}

export interface FieldDescription {
  id: string;
  labelId: string;
  describedBy: () => string | null;
}
export const OPENUI_FIELD_DESCRIPTION = new InjectionToken<FieldDescription>(
  "OPENUI_FIELD_DESCRIPTION",
);
export interface FieldProps {
  name: string;
  value?: unknown;
  rules?: Record<string, boolean | number | string | undefined>;
}

/** Shared validation/state plumbing; getters retain the live streaming context. */
@Directive()
export abstract class OpenUiField<T extends FieldProps>
  extends OpenUiComponent<T>
  implements DoCheck, OnDestroy
{
  protected readonly validation = injectFormValidation();
  readonly description = inject(OPENUI_FIELD_DESCRIPTION, { optional: true });
  readonly id = this.description?.id ?? inject(OpenUiIds).next();
  private readonly localError = signal<string | undefined>(undefined);
  private registeredName: string | undefined;

  get field() {
    return resolveStateField<unknown>(
      this.props?.name ?? "",
      this.props?.value,
      this.context.store,
      this.context.evaluationContext,
      (name) => this.context.getFieldValue(this.formName, name),
      (name, value) => this.context.setFieldValue(this.formName, undefined, name, value),
    );
  }
  get error() {
    return this.validation?.getFieldError(this.field.name) ?? this.localError();
  }
  get describedBy() {
    return this.description?.describedBy() ?? null;
  }
  get labelId() {
    return this.description?.labelId ?? null;
  }
  get ariaLabel() {
    return this.description ? null : (this.props?.name ?? null);
  }
  get validationValue(): unknown {
    return this.field.value;
  }

  ngDoCheck(): void {
    const name = this.field.name;
    if (this.registeredName && (this.context.isStreaming || this.registeredName !== name)) {
      this.validation?.unregisterField(this.registeredName);
      this.registeredName = undefined;
    }
    if (!name || this.context.isStreaming || !this.validation) return;
    const rules = parseStructuredRules(this.props?.rules);
    if (rules.length) {
      this.validation.registerField(name, rules, () => this.validationValue);
      this.registeredName = name;
    } else if (this.registeredName) {
      this.validation.unregisterField(this.registeredName);
      this.registeredName = undefined;
    }
  }
  ngOnDestroy(): void {
    if (this.registeredName) this.validation?.unregisterField(this.registeredName);
  }
  clearError(): void {
    this.localError.set(undefined);
    this.validation?.clearFieldError(this.field.name);
  }
  validateCurrent(value: unknown = this.validationValue): void {
    if (this.context.isStreaming) return;
    const rules = parseStructuredRules(this.props?.rules);
    if (this.validation) this.validation.validateField(this.field.name, value, rules);
    else this.localError.set(validate(value, rules));
  }
  setValue(value: unknown, validateOnChange = false): void {
    if (this.context.isStreaming) return;
    this.field.setValue(value);
    if (validateOnChange) this.validateCurrent(value);
    else this.clearError();
  }
}

@Directive()
export abstract class OpenUiTextField<T extends FieldProps> extends OpenUiField<T> {
  get textValue(): string {
    return String(this.field.value ?? "");
  }
  updateValue(event: Event): void {
    this.setValue((event.target as HTMLInputElement).value);
  }
  validateValue(event: Event): void {
    this.validateCurrent((event.target as HTMLInputElement).value);
  }
}

export function itemProps<T>(items: unknown): T[] {
  if (!Array.isArray(items)) return [];
  return items.flatMap((item: unknown) => {
    if (
      item &&
      typeof item === "object" &&
      "props" in item &&
      item.props &&
      typeof item.props === "object"
    )
      return [item.props as T];
    return [];
  });
}
