import { DOCUMENT, JsonPipe } from "@angular/common";
import { Component, computed, inject, signal } from "@angular/core";
import { openuiChatLibrary, openuiLibrary } from "@openuidev/angular-ui";
import { gallerySample, helperParents } from "./gallery-data";
import { GalleryExampleComponent } from "./gallery-example.component";
@Component({
  selector: "app-root",
  standalone: true,
  imports: [GalleryExampleComponent, JsonPipe],
  template: `<div
    class="gallery-shell openui-theme"
    [attr.data-theme]="theme()"
    [attr.data-openui-theme]="theme()"
  >
    <header class="topbar">
      <div class="identity">
        <strong>OpenUI <span>Angular</span></strong
        ><span class="subtitle">Component gallery</span>
      </div>
      <div class="top-controls">
        <button type="button" (click)="setTheme(theme() === 'light' ? 'dark' : 'light')">
          {{ theme() === "light" ? "Dark theme" : "Light theme" }}</button
        ><a href="/" title="Return to the gallery">Gallery</a>
      </div>
    </header>
    <div class="workspace">
      <aside class="sidebar">
        <div class="catalog-tabs">
          <button type="button" [attr.aria-pressed]="mode() === 'base'" (click)="setMode('base')">
            Base {{ baseCount }}</button
          ><button type="button" [attr.aria-pressed]="mode() === 'chat'" (click)="setMode('chat')">
            Chat {{ chatCount }}
          </button>
        </div>
        <label class="search-label" for="component-search">Search components</label
        ><input
          id="component-search"
          type="search"
          placeholder="Search by name or category…"
          [value]="search()"
          (input)="search.set($any($event.target).value)"
        />
        <button
          class="overview"
          type="button"
          [attr.aria-current]="!selected() ? 'page' : null"
          (click)="select(null)"
        >
          All components <span>{{ entries().length }}</span>
        </button>
        <nav aria-label="Components">
          @for (group of groups(); track group) {
            <section class="nav-group">
              <h2>{{ group }}</h2>
              @for (entry of matching(); track entry.name) {
                @if (entry.sample?.group === group) {
                  <button
                    type="button"
                    [attr.data-component]="entry.name"
                    [attr.aria-current]="selected() === entry.name ? 'page' : null"
                    (click)="select(entry.name)"
                  >
                    <span>{{ entry.name }}</span>
                    @if (entry.sample?.partial) {
                      <i aria-label="Partial implementation"></i>
                    }
                  </button>
                }
              }
            </section>
          }
        </nav>
      </aside>
      <main class="main">
        <div class="heading">
          <div>
            <h1>{{ selected() || "Explore components" }}</h1>
            <p>
              {{ visualCount() }} visual components and {{ entries().length - visualCount() }} data
              records. Native Angular rendering.
            </p>
          </div>
          <span class="version">OpenUI default theme</span>
        </div>
        <div class="notice">
          This port is in development. Some chart and editor features do not yet match the reference
          implementation. Actions update local demo state only.
        </div>
        <div class="toolbar">
          <label
            >Preview
            <select
              aria-label="Preview width"
              [value]="width()"
              (change)="width.set(+$any($event.target).value)"
            >
              <option value="0">Fluid</option>
              <option value="390">390 px</option>
              <option value="768">768 px</option>
            </select></label
          >
          <label
            ><input
              type="checkbox"
              [checked]="streaming()"
              (change)="streaming.set($any($event.target).checked)"
            />Streaming mode</label
          >
          <label
            ><input
              type="checkbox"
              [checked]="helpers()"
              (change)="helpers.set($any($event.target).checked)"
            />Include data records</label
          >
          <button type="button" (click)="logs.set([])">Clear activity</button>
        </div>
        @if (missing().length) {
          <p class="notice" role="alert">Missing examples: {{ missing().join(", ") }}</p>
        }
        <div
          class="examples openui-theme"
          [attr.data-openui-theme]="theme()"
          [class.focused]="!!selected()"
          [attr.data-example-count]="visible().length"
        >
          @for (entry of visible(); track mode() + ":" + entry.name) {
            @if (entry.sample; as sample) {
              <gallery-example
                [name]="entry.name"
                [sample]="sample"
                [mode]="mode()"
                [streaming]="streaming()"
                [previewWidth]="width()"
                (activity)="record($event)"
              />
            }
          }
        </div>
        @if (!visible().length) {
          <p class="empty">No matching components. Try a different search.</p>
        }
        <details class="activity">
          <summary>
            Activity log <span>{{ logs().length }}</span>
          </summary>
          <p>
            The latest 20 action and state events. Save and submit actions do not call a backend.
          </p>
          <pre>{{ logs() | json }}</pre>
        </details>
      </main>
    </div>
  </div>`,
  styleUrl: "./gallery.css",
})
export class GalleryComponent {
  private readonly document = inject(DOCUMENT);
  readonly baseCount = Object.keys(openuiLibrary.components).length;
  readonly chatCount = Object.keys(openuiChatLibrary.components).length;
  readonly mode = signal<"base" | "chat">("base");
  readonly search = signal("");
  readonly selected = signal<string | null>(null);
  readonly theme = signal<"light" | "dark">("light");
  readonly width = signal(0);
  readonly streaming = signal(false);
  readonly helpers = signal(false);
  readonly logs = signal<unknown[]>([]);
  readonly entries = computed(() =>
    Object.keys((this.mode() === "chat" ? openuiChatLibrary : openuiLibrary).components)
      .sort()
      .map((name) => ({ name, sample: gallerySample(name, this.mode()) })),
  );
  readonly missing = computed(() =>
    this.entries()
      .filter((e) => !e.sample)
      .map((e) => e.name),
  );
  readonly visualCount = computed(
    () => this.entries().filter((e) => !helperParents[e.name]).length,
  );
  readonly matching = computed(() => {
    const term = this.search().trim().toLowerCase();
    return this.entries().filter(
      (e) =>
        !term ||
        `${e.name} ${e.sample?.group ?? ""} ${e.sample?.parent ?? ""}`.toLowerCase().includes(term),
    );
  });
  readonly groups = computed(() =>
    [...new Set(this.matching().map((e) => e.sample?.group ?? "Missing"))].sort((a, b) =>
      a === "Data records" ? 1 : b === "Data records" ? -1 : a.localeCompare(b, "en"),
    ),
  );
  readonly visible = computed(() =>
    this.selected()
      ? this.entries().filter((e) => e.name === this.selected())
      : this.matching().filter((e) => this.helpers() || !helperParents[e.name]),
  );
  constructor() {
    this.document.title = "OpenUI Angular — Component gallery";
    this.document.documentElement.lang = "en";
    this.document.documentElement.classList.add("gallery-page");
    this.document.body.classList.add("gallery-page");
    const params = new URLSearchParams(this.document.location.search);
    if (params.get("catalog") === "chat") this.mode.set("chat");
    const name = params.get("component");
    if (name && this.entries().some((e) => e.name === name)) this.selected.set(name);
    this.setTheme(params.get("theme") === "dark" ? "dark" : "light");
  }
  setTheme(value: "light" | "dark") {
    this.theme.set(value);
    this.document.documentElement.style.colorScheme = value;
    this.document.body.dataset["galleryTheme"] = value;
  }
  setMode(mode: "base" | "chat") {
    this.mode.set(mode);
    this.selected.set(null);
    this.search.set("");
    this.logs.set([]);
    this.updateUrl();
  }
  select(name: string | null) {
    this.selected.set(name);
    this.updateUrl();
    this.document.defaultView?.scrollTo({ top: 0, behavior: "instant" });
  }
  private updateUrl() {
    const url = new URL(this.document.location.href);
    url.searchParams.set("catalog", this.mode());
    if (this.selected()) url.searchParams.set("component", this.selected()!);
    else url.searchParams.delete("component");
    this.document.defaultView?.history.replaceState(null, "", url);
  }
  record(event: unknown) {
    this.logs.update((logs) => [event, ...logs].slice(0, 20));
  }
}
