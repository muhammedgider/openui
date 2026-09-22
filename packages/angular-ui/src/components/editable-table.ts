import { Component, DoCheck, ElementRef, ViewChild, signal } from "@angular/core";
import { OpenUiComponent } from "./base";
import { OpenUiCalendarComponent, calendarDate, formatCalendarDate } from "./date-picker";
import { safeContentUrl } from "./markdown";
export interface EditableColumn {
  type: "text" | "number" | "date-single" | "select" | "url";
  key: string;
  header: string;
  width?: number;
  options?: { value: string; label: string }[];
}
export interface EditableRow {
  id: string;
  values: (string | number)[];
}
export interface EditableTableProps {
  name: string;
  columns: EditableColumn[];
  data: EditableRow[];
}
const clone = (rows: EditableRow[]) => rows.map((row) => ({ id: row.id, values: [...row.values] }));
@Component({
  selector: "openui-editable-table",
  standalone: true,
  imports: [OpenUiCalendarComponent],
  template: `
    <div class="openui-editable-table-wrapper" #host>
      <div class="openui-editable-table-scroll-container">
        <table
          class="openui-editable-table-table"
          role="grid"
          [attr.aria-label]="props?.name || 'Editable table'"
        >
          <thead>
            <tr>
              @for (col of columns; track $index) {
                <th [style.width.px]="col.width ?? 150" scope="col">
                  <div class="openui-editable-table-header-container">
                    {{ col.header }}
                    <div class="openui-editable-table-header-icon" aria-hidden="true">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path [attr.d]="icon(col.type)" />
                      </svg>
                    </div>
                  </div>
                </th>
              }
            </tr>
          </thead>
          <tbody>
            @for (row of rows(); track $index; let r = $index) {
              <tr>
                @for (col of columns; track $index; let c = $index) {
                  <td [style.width.px]="col.width ?? 150">
                    <div
                      class="openui-editable-table-cell-base"
                      [attr.data-cell]="r + '-' + c"
                      [tabIndex]="
                        (selected()[0] === r && selected()[1] === c) ||
                        (selected()[0] < 0 && r === 0 && c === 0)
                          ? 0
                          : -1
                      "
                      [attr.aria-selected]="selected()[0] === r && selected()[1] === c"
                      [attr.aria-label]="col.header + ': ' + (row.values[c] ?? '')"
                      (click)="select(r, c, $event)"
                      (dblclick)="start(r, c)"
                      (keydown)="key(r, c, $event)"
                      (focusout)="blur($event)"
                    >
                      @if (selected()[0] === r && selected()[1] === c) {
                        <div
                          class="openui-editable-table-cell-outline"
                          [class.openui-editable-table-cell-outline--editing]="editing() !== null"
                        ></div>
                      }
                      @if (editing()?.[0] === r && editing()?.[1] === c) {
                        @switch (col.type) {
                          @case ("select") {
                            <select
                              class="openui-editable-table-cell-input"
                              [value]="buffer()"
                              [attr.aria-label]="col.header"
                              (change)="setBuffer($event); finish(true)"
                            >
                              @for (option of col.options ?? []; track option.value) {
                                <option [value]="option.value">{{ option.label }}</option>
                              }
                            </select>
                          }
                          @case ("date-single") {
                            <openui-calendar
                              [value]="buffer()"
                              (valueChange)="dateChange($event)"
                            />
                          }
                          @default {
                            <input
                              class="openui-editable-table-cell-input"
                              [type]="
                                col.type === 'number'
                                  ? 'number'
                                  : col.type === 'url'
                                    ? 'url'
                                    : 'text'
                              "
                              [attr.aria-label]="col.header"
                              [value]="buffer()"
                              (input)="setBuffer($event)"
                            />
                          }
                        }
                      } @else {
                        @if (col.type === "url" && url(row.values[c])) {
                          <a
                            class="openui-editable-table-display-url"
                            [href]="url(row.values[c])"
                            target="_blank"
                            rel="noopener noreferrer"
                            (click)="$event.stopPropagation()"
                            >{{ row.values[c] }}</a
                          >
                        } @else {
                          <span
                            [class]="
                              col.type === 'number'
                                ? 'openui-editable-table-display-number'
                                : 'openui-editable-table-display-text'
                            "
                            >{{ display(col, row.values[c]) }}</span
                          >
                        }
                      }
                    </div>
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
    @if (changedCount) {
      <div class="openui-editable-table-changes-container">
        <div class="openui-editable-table-changes-count" role="status">
          {{ changedCount }} changes made
        </div>
        <div class="openui-editable-table-changes-buttons">
          <button
            type="button"
            class="openui-button openui-button-secondary openui-button-small"
            [disabled]="context.isStreaming"
            (click)="reset()"
          >
            Reset</button
          ><button
            type="button"
            class="openui-button openui-button-primary openui-button-small"
            [disabled]="context.isStreaming"
            (click)="save()"
          >
            Save Changes
          </button>
        </div>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: contents;
      }
      .openui-editable-table-cell-base {
        position: relative;
        min-width: 100px;
      }
      .openui-editable-table-cell-base[aria-selected="true"] {
        outline: 2px solid var(--openui-interactive-accent-default, #2681d7);
        outline-offset: -2px;
      }
      openui-calendar {
        background: var(--openui-foreground);
        position: relative;
        z-index: 1;
      }
    `,
  ],
})
export class OpenUiEditableTableComponent
  extends OpenUiComponent<EditableTableProps>
  implements DoCheck
{
  @ViewChild("host") private host?: ElementRef<HTMLElement>;
  readonly rows = signal<EditableRow[]>([]);
  readonly selected = signal<[number, number]>([-1, -1]);
  readonly editing = signal<[number, number] | null>(null);
  readonly buffer = signal("");
  private baseline?: EditableRow[];
  private source: unknown;
  private columnSignature = "";
  private name: string | undefined;
  get columns() {
    return this.props?.columns ?? [];
  }
  ngDoCheck() {
    const name = this.props?.name ?? "";
    const source = this.context.getFieldValue(name, name) ?? this.props?.data ?? [];
    const signature = JSON.stringify(this.columns.map((c) => c.key));
    if (name !== this.name || signature !== this.columnSignature) {
      this.baseline = undefined;
      this.name = name;
      this.columnSignature = signature;
      this.source = undefined;
    }
    if (this.source !== source) {
      this.source = source;
      this.rows.set(clone(Array.isArray(source) ? source : []));
      this.editing.set(null);
      this.selected.set([-1, -1]);
    }
    if (!this.context.isStreaming && !this.baseline) this.baseline = clone(this.rows());
    if (this.context.isStreaming) this.editing.set(null);
  }
  get changedCount() {
    if (!this.baseline) return 0;
    const current = new Map(this.rows().map((row) => [row.id, row.values]));
    return this.baseline.reduce((sum, row) => {
      const now = current.get(row.id);
      return (
        sum +
        (now ? this.columns.reduce((n, _, i) => n + (row.values[i] !== now[i] ? 1 : 0), 0) : 0)
      );
    }, 0);
  }
  icon(type: EditableColumn["type"]) {
    return type === "date-single"
      ? "M8 2v4m8-4v4M3 10h18M5 4h14v17H5Z"
      : type === "select"
        ? "M8 6h13M8 12h13M8 18h13M3 6h1M3 12h1M3 18h1"
        : type === "url"
          ? "M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2"
          : "M4 4h16M12 4v16M8 20h8";
  }
  url(value: unknown) {
    return safeContentUrl(typeof value === "string" ? value : "");
  }
  display(col: EditableColumn, value: string | number | undefined) {
    if (col.type === "select")
      return col.options?.find((o) => o.value === value)?.label ?? value ?? "";
    if (col.type === "date-single") {
      const date = calendarDate(value);
      return date ? formatCalendarDate(date) : (value ?? "");
    }
    return value ?? "";
  }
  select(r: number, c: number, event: MouseEvent) {
    if (
      (event.target as Element).closest("input,select,openui-calendar,a") ||
      this.context.isStreaming
    )
      return;
    event.stopPropagation();
    if (this.selected()[0] === r && this.selected()[1] === c) this.start(r, c);
    else {
      this.finish(true, false);
      this.selected.set([r, c]);
      this.focusCell();
    }
  }
  start(r: number, c: number, initial?: string) {
    if (this.context.isStreaming) return;
    this.finish(true, false);
    this.selected.set([r, c]);
    this.editing.set([r, c]);
    this.buffer.set(initial ?? String(this.rows()[r]?.values[c] ?? ""));
    queueMicrotask(() => {
      const editor = this.host?.nativeElement.querySelector<HTMLInputElement | HTMLSelectElement>(
        "input,select",
      );
      editor?.focus();
      if (editor?.tagName === "INPUT") (editor as HTMLInputElement).select();
    });
  }
  setBuffer(event: Event) {
    this.buffer.set((event.target as HTMLInputElement).value);
  }
  dateChange(value: unknown) {
    const date = calendarDate(value);
    this.buffer.set(
      date
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
        : "",
    );
    this.finish(true);
  }
  finish(save: boolean, focus = true) {
    const pos = this.editing();
    if (!pos) return;
    this.editing.set(null);
    if (save && !this.context.isStreaming) {
      const [r, c] = pos;
      const rows = clone(this.rows());
      const row = rows[r];
      if (row) {
        const raw = this.buffer();
        row.values[c] =
          this.columns[c]?.type === "number"
            ? raw.trim() === ""
              ? ""
              : Number.isFinite(Number(raw))
                ? Number(raw)
                : raw
            : raw;
        this.rows.set(rows);
      }
    }
    if (focus) this.focusCell();
  }
  private focusCell() {
    queueMicrotask(() =>
      this.host?.nativeElement
        .querySelector<HTMLElement>(`[data-cell="${this.selected()[0]}-${this.selected()[1]}"]`)
        ?.focus(),
    );
  }
  blur(event: FocusEvent) {
    if (
      event.relatedTarget &&
      (event.currentTarget as HTMLElement).contains(event.relatedTarget as Node)
    )
      return;
    this.finish(true, false);
  }
  key(r: number, c: number, event: KeyboardEvent) {
    if (this.context.isStreaming) return;
    const editing = this.editing();
    if (editing) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        this.finish(false);
      } else if (
        event.key === "Enter" &&
        !(event.target as HTMLElement).closest("openui-calendar")
      ) {
        event.preventDefault();
        this.finish(true);
      } else if (event.key === "Tab") {
        this.finish(true, false);
      }
      return;
    }
    let nr = r,
      nc = c;
    switch (event.key) {
      case "Enter":
      case "F2":
        event.preventDefault();
        this.start(r, c);
        return;
      case "ArrowUp":
        nr--;
        break;
      case "ArrowDown":
        nr++;
        break;
      case "ArrowLeft":
        nc--;
        break;
      case "ArrowRight":
        nc++;
        break;
      case "Tab":
        if (event.shiftKey) {
          nc--;
          if (nc < 0) {
            nc = this.columns.length - 1;
            nr--;
          }
        } else {
          nc++;
          if (nc >= this.columns.length) {
            nc = 0;
            nr++;
          }
        }
        if (nr < 0 || nr >= this.rows().length) return;
        break;
      default:
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault();
          this.start(r, c, event.key);
        }
        return;
    }
    event.preventDefault();
    this.selected.set([
      Math.max(0, Math.min(this.rows().length - 1, nr)),
      Math.max(0, Math.min(this.columns.length - 1, nc)),
    ]);
    this.focusCell();
  }
  reset() {
    if (this.context.isStreaming) return;
    this.editing.set(null);
    if (this.baseline) this.rows.set(clone(this.baseline));
  }
  save() {
    if (this.context.isStreaming) return;
    this.finish(true, false);
    const rows = clone(this.rows());
    const name = this.props?.name ?? "";
    this.context.setFieldValue(name, "EditableTable", name, rows);
    this.context.triggerAction("Save Changes", name);
    this.baseline = clone(rows);
    this.source = rows;
  }
}
