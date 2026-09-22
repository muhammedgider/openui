import { JsonPipe } from "@angular/common";
import { Component, OnDestroy, signal } from "@angular/core";
import { Renderer, type ActionEvent, type OpenUIError } from "@openuidev/angular-lang";
import { openuiLibrary } from "@openuidev/angular-ui";

import { uiScenarios } from "./ui-scenarios";

@Component({
  selector: "openui-ui-playground",
  standalone: true,
  imports: [Renderer, JsonPipe],
  template: `<section class="playground">
    <header>
      <h2>Angular UI port</h2>
      <div class="controls">
        <button type="button" (click)="theme.set(theme() === 'light' ? 'dark' : 'light')">
          {{ theme() === "light" ? "Dark theme" : "Light theme" }}
        </button>
        <button type="button" [disabled]="streaming()" (click)="stream()">Replay stream</button>
      </div>
    </header>
    <p>
      {{ catalogSize }} catalog entries. In-progress port; full React visual parity is not yet
      verified.
    </p>
    <nav class="controls" aria-label="UI scenarios">
      @for (scenario of scenarios; track scenario.id) {
        <button
          type="button"
          [attr.aria-pressed]="selected().id === scenario.id"
          (click)="selectScenario(scenario.id)"
        >
          {{ scenario.label }}
        </button>
      }
    </nav>
    <div class="openui-theme preview" [attr.data-openui-theme]="theme()">
      @for (scenarioId of [selected().id]; track scenarioId) {
        <openui-renderer
          [library]="library"
          [response]="response()"
          [isStreaming]="streaming()"
          (action)="action.set($event)"
          (stateUpdate)="state.set($event)"
          (error)="errors.set($event)"
        />
      }
    </div>
    <details>
      <summary>OpenUI source</summary>
      <pre>{{ response() }}</pre>
    </details>
    <details>
      <summary>Action and state</summary>
      <pre>{{ action() | json }}</pre>
      <pre>{{ state() | json }}</pre>
    </details>
    @if (errors().length) {
      <pre role="alert">{{ errors() | json }}</pre>
    }
  </section>`,
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }
      .playground {
        display: grid;
        gap: 1rem;
        padding: 1.25rem;
      }
      header,
      .controls {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
      }
      h2,
      p {
        margin: 0;
      }
      .controls button {
        padding: 0.5rem 0.75rem;
        cursor: pointer;
      }
      .preview {
        padding: 1.25rem;
        background: var(--openui-background);
        border-radius: 1rem;
      }
      pre {
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }
    `,
  ],
})
export class UiPlaygroundComponent implements OnDestroy {
  readonly library = openuiLibrary;
  readonly theme = signal<"light" | "dark">("light");
  readonly scenarios = uiScenarios;
  readonly catalogSize = Object.keys(openuiLibrary.components).length;
  readonly selected = signal<(typeof uiScenarios)[number]>(uiScenarios[0]);
  readonly response = signal<string>(uiScenarios[0].source);
  readonly streaming = signal(false);
  readonly action = signal<ActionEvent | null>(null);
  readonly state = signal<Record<string, unknown>>({});
  readonly errors = signal<OpenUIError[]>([]);
  private timer: ReturnType<typeof setInterval> | undefined;
  selectScenario(id: string): void {
    const scenario = uiScenarios.find((item) => item.id === id);
    if (!scenario) return;
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    this.streaming.set(false);
    this.selected.set(scenario);
    this.response.set(scenario.source);
    this.action.set(null);
    this.state.set({});
    this.errors.set([]);
  }
  stream(): void {
    const source = this.selected().source;
    if (this.timer) clearInterval(this.timer);
    this.action.set(null);
    this.streaming.set(true);
    this.response.set("");
    let length = 0;
    this.timer = setInterval(() => {
      length += 24;
      this.response.set(source.slice(0, length));
      if (length >= source.length) {
        clearInterval(this.timer);
        this.timer = undefined;
        this.streaming.set(false);
      }
    }, 40);
  }
  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }
}
