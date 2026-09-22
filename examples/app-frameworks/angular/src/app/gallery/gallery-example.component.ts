import { JsonPipe } from "@angular/common";
import { Component, EventEmitter, Input, OnChanges, Output, signal } from "@angular/core";
import { Renderer } from "@openuidev/angular-lang";
import { openuiChatLibrary, openuiLibrary } from "@openuidev/angular-ui";
import type { GallerySample } from "./gallery-data";
@Component({
  selector: "gallery-example",
  standalone: true,
  imports: [Renderer, JsonPipe],
  template: `<article class="example" [attr.data-example]="name">
    <header>
      <div>
        <h2>{{ name }}</h2>
        <span class="family">{{ sample.group }}</span>
      </div>
      <div class="tools">
        @if (sample.parent) {
          <span class="badge">Data record</span>
        }
        @if (sample.partial) {
          <span class="badge warning">Partial implementation</span>
        }
        <button type="button" (click)="reset()" title="Reset this example">Reset</button>
      </div>
    </header>
    @if (sample.note) {
      <p class="note">{{ sample.note }}</p>
    }
    @if (sample.launchState) {
      <button class="launch" type="button" (click)="open()">Open modal</button>
    }
    <div class="preview" [style.max-width.px]="previewWidth || null">
      @for (instance of [revision()]; track instance) {
        <openui-renderer
          [library]="library"
          [response]="source()"
          [initialState]="initialState()"
          [isStreaming]="streaming"
          (action)="record('action', $event)"
          (stateUpdate)="record('state', $event)"
          (error)="onError($event)"
        />
      }
    </div>
    @if (errors().length) {
      <pre class="error" role="alert" data-render-error>{{ errors() | json }}</pre>
    }
    <details>
      <summary>Edit source</summary>
      <textarea
        spellcheck="false"
        [attr.aria-label]="name + ' OpenUI source'"
        [value]="draft()"
        (input)="draft.set($any($event.target).value)"
      ></textarea>
      <div class="editor-tools">
        <button type="button" (click)="apply()">Apply</button
        ><span>OpenUI Lang · changes apply to this example only</span>
      </div>
    </details>
    @if (lastEvent() !== null) {
      <details class="event">
        <summary>Latest event / state</summary>
        <pre>{{ lastEvent() | json }}</pre>
      </details>
    }
  </article>`,
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }
      .example {
        border-top: 1px solid var(--g-border);
        padding: 20px 0;
        min-width: 0;
      }
      header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 18px;
      }
      h2 {
        font-size: 15px;
        font-weight: 650;
        margin: 0 0 4px;
        overflow-wrap: anywhere;
      }
      .family,
      .note,
      .editor-tools span {
        color: var(--g-muted);
        font-size: 12px;
      }
      .tools {
        display: flex;
        align-items: center;
        gap: 7px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }
      .badge {
        font-size: 10px;
        padding: 3px 6px;
        border-radius: 4px;
        background: var(--g-soft);
        color: var(--g-muted);
      }
      .warning {
        color: var(--g-warning);
        background: var(--g-warning-bg);
      }
      button {
        font: inherit;
        font-size: 12px;
        background: var(--g-bg);
        color: var(--g-text);
        border: 1px solid var(--g-border);
        border-radius: 6px;
        padding: 5px 9px;
        cursor: pointer;
      }
      button:hover {
        background: var(--g-soft);
      }
      button:focus-visible,
      summary:focus-visible,
      textarea:focus-visible {
        outline: 2px solid var(--g-accent);
        outline-offset: 2px;
      }
      .preview {
        min-width: 0;
        min-height: 32px;
        margin: 0 auto;
        padding: 8px 0 20px;
        color: var(--openui-text-neutral-primary);
        background: var(--openui-background);
        font: var(--openui-text-body-default);
        overflow-wrap: break-word;
      }
      .launch {
        margin-bottom: 14px;
      }
      .note {
        margin: 0 0 14px;
        line-height: 1.6;
      }
      details {
        border-top: 1px dashed var(--g-border);
        padding-top: 10px;
        font-size: 12px;
        color: var(--g-muted);
      }
      summary {
        cursor: pointer;
        width: fit-content;
      }
      textarea {
        box-sizing: border-box;
        width: 100%;
        height: 175px;
        resize: vertical;
        margin-top: 12px;
        border: 1px solid var(--g-border);
        border-radius: 6px;
        background: var(--g-soft);
        color: var(--g-text);
        padding: 12px;
        font:
          12px/1.65 ui-monospace,
          monospace;
        tab-size: 2;
      }
      .editor-tools {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 8px 0;
      }
      pre {
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        font:
          12px/1.6 ui-monospace,
          monospace;
      }
      .error {
        color: var(--g-warning);
        padding: 12px;
        background: var(--g-warning-bg);
      }
      .event {
        margin-top: 10px;
      }
    `,
  ],
})
export class GalleryExampleComponent implements OnChanges {
  @Input({ required: true }) name = "";
  @Input({ required: true }) sample!: GallerySample;
  @Input() mode: "base" | "chat" = "base";
  @Input() streaming = false;
  @Input() previewWidth = 0;
  @Output() activity = new EventEmitter<{ name: string; kind: string; value: unknown }>();
  readonly revision = signal(0);
  readonly source = signal("");
  readonly draft = signal("");
  readonly initialState = signal<Record<string, unknown>>({});
  readonly errors = signal<unknown[]>([]);
  readonly lastEvent = signal<unknown>(null);
  private previousSample?: GallerySample;
  get library() {
    return this.mode === "chat" ? openuiChatLibrary : openuiLibrary;
  }
  ngOnChanges() {
    if (this.sample !== this.previousSample) {
      this.previousSample = this.sample;
      this.reset();
    }
  }
  reset() {
    this.source.set(this.sample.source);
    this.draft.set(this.sample.source);
    this.initialState.set({ ...this.sample.initialState });
    this.errors.set([]);
    this.lastEvent.set(null);
    this.revision.update((n) => n + 1);
  }
  open() {
    this.initialState.set({ ...this.sample.initialState, ...this.sample.launchState });
    this.revision.update((n) => n + 1);
  }
  apply() {
    this.errors.set([]);
    this.source.set(this.draft());
    this.revision.update((n) => n + 1);
  }
  record(kind: string, value: unknown) {
    this.lastEvent.set(value);
    this.activity.emit({ name: this.name, kind, value });
  }
  onError(errors: unknown[]) {
    this.errors.set(errors);
  }
}
