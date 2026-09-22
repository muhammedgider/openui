import { Directive, Input } from "@angular/core";
import { injectFormName, injectOpenUiContext } from "@openuidev/angular-lang";

/** Inputs required by angular-lang's dynamic component renderer. */
@Directive()
export abstract class OpenUiComponent<T> {
  @Input() props: T | null = null;
  @Input() renderNode: ((value: unknown) => unknown) | null = null;
  @Input() statementId: string | undefined;
  readonly context = injectOpenUiContext();
  readonly formName = injectFormName();
}
