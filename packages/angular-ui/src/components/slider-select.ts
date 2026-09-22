import { Component, EventEmitter, Input, Output, inject } from "@angular/core";
import { OpenUiIds } from "./field";
import { OPENUI_SELECT_TEMPLATE, OpenUiSelectComponent } from "./select";
/** Reuses the Angular select's positioning, keyboard and focus behavior without writing a separate field. */
@Component({ selector: "openui-slider-select", standalone: true, template: OPENUI_SELECT_TEMPLATE })
export class OpenUiSliderSelectComponent extends OpenUiSelectComponent {
  override readonly id = inject(OpenUiIds).next();
  @Input() choices: number[] = [];
  @Input() selected = 0;
  @Output() selectedChange = new EventEmitter<number>();
  override get items() {
    return this.choices.map((value) => ({ value: String(value), label: String(value) }));
  }
  override get value() {
    return String(this.selected);
  }
  override choose(value: string) {
    if (this.context.isStreaming) return;
    this.selectedChange.emit(Number(value));
    this.close(true);
  }
}
