import { DOCUMENT, NgTemplateOutlet } from "@angular/common";
import {
  Component,
  DoCheck,
  Input,
  OnChanges,
  OnDestroy,
  PendingTasks,
  forwardRef,
  inject,
  signal,
} from "@angular/core";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { OpenUiComponent } from "./base";
import { CardSource, OPENUI_CARD_SOURCES } from "./source-context";

function withCitations(nodes: MarkdownNode[], sources: readonly CardSource[]): MarkdownNode[] {
  return nodes.flatMap((node) => {
    if (["code", "inlineCode", "link", "html", "image"].includes(node.type)) return [node];
    if (node.type === "text" && node.value) {
      return node.value
        .split(/(\[\d+\])/g)
        .filter(Boolean)
        .map((value) => {
          const match = /^\[(\d+)\]$/.exec(value);
          const source = match ? sources[Number(match[1]) - 1] : undefined;
          return source
            ? { type: "citation", value, url: source.url, title: source.title }
            : { type: "text", value };
        });
    }
    return [
      { ...node, ...(node.children ? { children: withCitations(node.children, sources) } : {}) },
    ];
  });
}

// Load language grammars only when a code block is rendered, not in every consumer's entry chunk.
let highlighter: Promise<typeof import("refractor/all")> | undefined;
function loadHighlighter() {
  return (highlighter ??= import("refractor/all").catch((error: unknown) => {
    highlighter = undefined;
    throw error;
  }));
}

interface MarkdownNode {
  type: string;
  value?: string;
  children?: MarkdownNode[];
  depth?: number;
  ordered?: boolean;
  start?: number;
  url?: string;
  alt?: string;
  title?: string;
  lang?: string;
  identifier?: string;
  checked?: boolean | null;
  spread?: boolean;
}
const plainParser = unified().use(remarkParse);
const extendedParser = unified()
  .use(remarkParse)
  .use(remarkGfm, { singleTilde: false })
  .use(remarkBreaks);
export function safeContentUrl(value: string | undefined): string | null {
  if (!value) return null;
  const normalized = value.replace(/[\u0000-\u0020\u007f]/g, "");
  if (/^[a-z][a-z0-9+.-]*:/i.test(normalized) && !/^(https?|mailto|ircs?|xmpp):/i.test(normalized))
    return null;
  return value;
}
export function parseMarkdown(text: string, extended = false): MarkdownNode[] {
  const parser = extended ? extendedParser : plainParser;
  const tree = parser.runSync(parser.parse(text)) as unknown as MarkdownNode;
  const definitions = new Map<string, MarkdownNode>();
  const walk = (node: MarkdownNode, fn: (n: MarkdownNode) => void) => {
    fn(node);
    node.children?.forEach((child) => walk(child, fn));
  };
  walk(tree, (node) => {
    if (node.type === "definition" && node.identifier) definitions.set(node.identifier, node);
  });
  walk(tree, (node) => {
    if (node.type === "list" && !node.spread) {
      for (const item of node.children ?? [])
        item.children = (item.children ?? []).flatMap((child) =>
          child.type === "paragraph" ? (child.children ?? []) : [child],
        );
    }
    if ((node.type === "linkReference" || node.type === "imageReference") && node.identifier) {
      const definition = definitions.get(node.identifier);
      if (definition) {
        node.type = node.type === "linkReference" ? "link" : "image";
        node.url = definition.url;
        node.title = definition.title;
      }
    }
  });
  return tree.children ?? [];
}
const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
interface HighlightNode {
  type: string;
  value?: string;
  children?: HighlightNode[];
  properties?: { className?: string[] };
}
function highlightHtml(node: HighlightNode): string {
  if (node.type === "text") return escapeHtml(node.value ?? "");
  const children = (node.children ?? []).map(highlightHtml).join("");
  if (node.type === "root") return children;
  const classes = (node.properties?.className ?? [])
    .filter((name) => /^[\w-]+$/.test(name))
    .join(" ");
  return `<span class="${classes}">${children}</span>`;
}

@Component({
  selector: "openui-code-view",
  standalone: true,
  template: `<div
    class="openui-code-block-wrapper"
    [attr.data-code-theme]="standalone ? 'dark' : null"
  >
    <button
      type="button"
      class="openui-icon-button openui-icon-button-secondary openui-icon-button-small openui-icon-button-square openui-code-block-copy-button"
      [class.openui-code-block-copy-button-copied]="copied()"
      [attr.aria-label]="copied() ? 'Copied to clipboard' : 'Copy code'"
      (click)="copy()"
    >
      <span class="openui-icon-button-icon"
        ><svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          @if (copied()) {
            <path d="m18 6-7 7-3-3m14-4-7 7-3-3" />
          } @else {
            <rect width="14" height="14" x="8" y="8" rx="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          }</svg
      ></span>
    </button>
    <div class="openui-code-block-syntax-highlighter" [attr.data-language]="language">
      <code [class]="'language-' + language" [innerHTML]="html()"></code>
    </div>
    @if (copyError()) {
      <span class="openui-hint openui-hint-error" role="status">Copy unavailable</span>
    }
  </div>`,
  styles: [":host { display: contents; }"],
})
export class OpenUiCodeViewComponent implements OnChanges, OnDestroy {
  @Input() standalone = false;
  @Input() language = "text";
  @Input() code = "";
  readonly copied = signal(false);
  readonly copyError = signal(false);
  private readonly document = inject(DOCUMENT);
  private timer?: ReturnType<typeof setTimeout>;
  private destroyed = false;
  readonly html = signal("");
  private readonly pending = inject(PendingTasks);
  private generation = 0;
  ngOnChanges(): void {
    const generation = ++this.generation;
    this.copied.set(false);
    this.html.set(escapeHtml(this.code));
    const done = this.pending.add();
    void loadHighlighter()
      .then(({ refractor }) => {
        if (generation !== this.generation || this.destroyed) return;
        this.html.set(
          refractor.registered(this.language)
            ? highlightHtml(refractor.highlight(this.code, this.language) as HighlightNode)
            : escapeHtml(this.code),
        );
      })
      .catch(() => {
        /* Escaped source remains readable when grammar loading fails. */
      })
      .finally(done);
  }
  async copy(): Promise<void> {
    this.copyError.set(false);
    try {
      const clipboard = this.document.defaultView?.navigator.clipboard;
      if (!clipboard) throw new Error("Clipboard unavailable");
      await clipboard.writeText(this.code);
      if (this.destroyed) return;
      this.copied.set(true);
      if (this.timer) clearTimeout(this.timer);
      this.timer = setTimeout(() => this.copied.set(false), 1000);
    } catch {
      if (!this.destroyed) this.copyError.set(true);
    }
  }
  ngOnDestroy(): void {
    this.destroyed = true;
    if (this.timer) clearTimeout(this.timer);
  }
}

@Component({
  selector: "openui-markdown-nodes",
  standalone: true,
  imports: [
    NgTemplateOutlet,
    OpenUiCodeViewComponent,
    forwardRef(() => OpenUiMarkdownNodesComponent),
  ],
  styles: [":host { display: contents; }"],
  template: `<ng-template #child let-items
      ><openui-markdown-nodes [nodes]="items ?? []" [inline]="inline"
    /></ng-template>
    @for (node of nodes; track $index) {
      @if (inline && ["paragraph", "heading", "list", "listItem"].includes(node.type)) {
        <ng-container
          [ngTemplateOutlet]="child"
          [ngTemplateOutletContext]="{ $implicit: node.children }"
        />
      } @else {
        @switch (node.type) {
          @case ("citation") {
            <ng-template #citationIcon
              ><svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" /></svg
            ></ng-template>
            <span class="openui-citation-container">
              @if (url(node.url); as href) {
                <a
                  class="openui-citation"
                  [href]="href"
                  [title]="node.title ?? ''"
                  [attr.aria-label]="(node.value ?? '') + ' ' + (node.title ?? '')"
                  target="_blank"
                  rel="noopener noreferrer"
                  ><ng-container [ngTemplateOutlet]="citationIcon"
                /></a>
              } @else {
                <span
                  class="openui-citation"
                  [title]="node.title ?? ''"
                  [attr.aria-label]="(node.value ?? '') + ' ' + (node.title ?? '')"
                  ><ng-container [ngTemplateOutlet]="citationIcon"
                /></span>
              }
            </span>
          }
          @case ("text") {
            <ng-container>{{ node.value }}</ng-container>
          }
          @case ("html") {
            <ng-container>{{ node.value }}</ng-container>
          }
          @case ("paragraph") {
            <p>
              <ng-container
                [ngTemplateOutlet]="child"
                [ngTemplateOutletContext]="{ $implicit: node.children }"
              />
            </p>
          }
          @case ("strong") {
            <strong
              ><ng-container
                [ngTemplateOutlet]="child"
                [ngTemplateOutletContext]="{ $implicit: node.children }"
            /></strong>
          }
          @case ("emphasis") {
            <em
              ><ng-container
                [ngTemplateOutlet]="child"
                [ngTemplateOutletContext]="{ $implicit: node.children }"
            /></em>
          }
          @case ("delete") {
            <del
              ><ng-container
                [ngTemplateOutlet]="child"
                [ngTemplateOutletContext]="{ $implicit: node.children }"
            /></del>
          }
          @case ("inlineCode") {
            <code class="openui-markdown-renderer-code">{{ node.value }}</code>
          }
          @case ("code") {
            <pre><openui-code-view [language]="node.lang || 'text'" [code]="node.value?.trim() ?? ''" /></pre>
          }
          @case ("break") {
            <br />
          }
          @case ("thematicBreak") {
            <hr />
          }
          @case ("blockquote") {
            <blockquote>
              <ng-container
                [ngTemplateOutlet]="child"
                [ngTemplateOutletContext]="{ $implicit: node.children }"
              />
            </blockquote>
          }
          @case ("link") {
            <a
              [attr.href]="url(node.url)"
              [title]="node.title ?? ''"
              target="_blank"
              rel="noopener noreferrer"
              class="openui-markdown-renderer-link"
              ><ng-container
                [ngTemplateOutlet]="child"
                [ngTemplateOutletContext]="{ $implicit: node.children }"
            /></a>
          }
          @case ("image") {
            @if (url(node.url); as src) {
              <img [src]="src" [alt]="node.alt ?? ''" [title]="node.title ?? ''" />
            }
          }
          @case ("list") {
            @if (node.ordered) {
              <ol [attr.start]="node.start || 1">
                <ng-container
                  [ngTemplateOutlet]="child"
                  [ngTemplateOutletContext]="{ $implicit: node.children }"
                />
              </ol>
            } @else {
              <ul>
                <ng-container
                  [ngTemplateOutlet]="child"
                  [ngTemplateOutletContext]="{ $implicit: node.children }"
                />
              </ul>
            }
          }
          @case ("listItem") {
            <li>
              @if (node.checked != null) {
                <input type="checkbox" disabled [checked]="node.checked" />
              }
              <ng-container
                [ngTemplateOutlet]="child"
                [ngTemplateOutletContext]="{ $implicit: node.children }"
              />
            </li>
          }
          @case ("heading") {
            @switch (node.depth) {
              @case (1) {
                <h1>
                  <ng-container
                    [ngTemplateOutlet]="child"
                    [ngTemplateOutletContext]="{ $implicit: node.children }"
                  />
                </h1>
              }
              @case (2) {
                <h2>
                  <ng-container
                    [ngTemplateOutlet]="child"
                    [ngTemplateOutletContext]="{ $implicit: node.children }"
                  />
                </h2>
              }
              @case (3) {
                <h3>
                  <ng-container
                    [ngTemplateOutlet]="child"
                    [ngTemplateOutletContext]="{ $implicit: node.children }"
                  />
                </h3>
              }
              @case (4) {
                <h4>
                  <ng-container
                    [ngTemplateOutlet]="child"
                    [ngTemplateOutletContext]="{ $implicit: node.children }"
                  />
                </h4>
              }
              @case (5) {
                <h5>
                  <ng-container
                    [ngTemplateOutlet]="child"
                    [ngTemplateOutletContext]="{ $implicit: node.children }"
                  />
                </h5>
              }
              @default {
                <h6>
                  <ng-container
                    [ngTemplateOutlet]="child"
                    [ngTemplateOutletContext]="{ $implicit: node.children }"
                  />
                </h6>
              }
            }
          }
          @case ("table") {
            <div class="openui-table-container">
              <table class="openui-table">
                <thead class="openui-table-header">
                  <tr class="openui-table-row">
                    @for (cell of node.children?.[0]?.children ?? []; track $index) {
                      <th class="openui-table-head">
                        <div class="openui-table-head-content">
                          <div class="openui-table-head-label">
                            <ng-container
                              [ngTemplateOutlet]="child"
                              [ngTemplateOutletContext]="{ $implicit: cell.children }"
                            />
                          </div>
                        </div>
                      </th>
                    }
                  </tr>
                </thead>
                <tbody class="openui-table-body">
                  @for (row of node.children?.slice(1) ?? []; track $index) {
                    <tr class="openui-table-row">
                      @for (cell of row.children ?? []; track $index) {
                        <td class="openui-table-cell">
                          <ng-container
                            [ngTemplateOutlet]="child"
                            [ngTemplateOutletContext]="{ $implicit: cell.children }"
                          />
                        </td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        }
      }
    }`,
})
export class OpenUiMarkdownNodesComponent {
  @Input() nodes: MarkdownNode[] = [];
  @Input() inline = false;
  readonly url = safeContentUrl;
}

@Component({
  selector: "openui-markdown-view",
  standalone: true,
  imports: [OpenUiMarkdownNodesComponent],
  styles: [":host { display: contents; }"],
  template: `<div
    [class.openui-text-content-markdown]="extended"
    [class]="
      'openui-markdown-renderer' +
      (variant === 'card'
        ? ' openui-markdown-renderer-card'
        : variant === 'sunk'
          ? ' openui-markdown-renderer-card-sunk'
          : '')
    "
  >
    <openui-markdown-nodes [nodes]="nodes" [inline]="inline" />
  </div>`,
})
export class OpenUiMarkdownViewComponent implements OnChanges, DoCheck {
  private readonly sources = inject(OPENUI_CARD_SOURCES, { optional: true });
  private previousSources: readonly CardSource[] | undefined;
  ngDoCheck() {
    const sources = this.sources?.();
    if (sources !== this.previousSources) {
      this.previousSources = sources;
      this.ngOnChanges();
    }
  }
  @Input() text = "";
  @Input() variant: "clear" | "card" | "sunk" = "clear";
  @Input() inline = false;
  @Input() extended = false;
  nodes: MarkdownNode[] = [];
  ngOnChanges(): void {
    const nodes = parseMarkdown(String(this.text ?? ""), this.extended || this.inline);
    const sources = this.sources?.();
    this.nodes = sources?.length ? withCitations(nodes, sources) : nodes;
  }
}
@Component({
  selector: "openui-inline-markdown",
  standalone: true,
  imports: [OpenUiMarkdownViewComponent],
  styles: [":host { display: contents; }"],
  template: `@if (text) {
    <span [class]="'openui-inline-markdown-renderer ' + className"
      ><openui-markdown-view [text]="text" [inline]="true"
    /></span>
  }`,
})
export class OpenUiInlineMarkdownComponent {
  @Input() text = "";
  @Input() className = "";
}

@Component({
  selector: "openui-markdown",
  standalone: true,
  imports: [OpenUiMarkdownViewComponent],
  template: `<openui-markdown-view
    [text]="props?.textMarkdown ?? ''"
    [variant]="props?.variant ?? 'clear'"
  />`,
})
export class OpenUiMarkdownComponent extends OpenUiComponent<{
  textMarkdown: string;
  variant?: "clear" | "card" | "sunk";
}> {}
@Component({
  selector: "openui-code-block",
  standalone: true,
  imports: [OpenUiCodeViewComponent],
  template: `<openui-code-view
    [standalone]="true"
    [language]="props?.language ?? 'text'"
    [code]="props?.codeString ?? ''"
  />`,
})
export class OpenUiCodeBlockComponent extends OpenUiComponent<{
  language: string;
  codeString: string;
}> {}
