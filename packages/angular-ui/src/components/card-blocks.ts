import { NgStyle, NgTemplateOutlet } from "@angular/common";
import {
  AfterViewChecked,
  Component,
  Directive,
  ElementRef,
  OnDestroy,
  ViewChild,
} from "@angular/core";
import { RenderNode, type ActionConfig, type ActionPlan } from "@openuidev/angular-lang";
import { withItemContext } from "../genui-lib/card-action";
import { OpenUiComponent } from "./base";
import { choiceRows } from "./choice";
import { itemProps } from "./field";
import { OpenUiIconViewComponent } from "./inline-content";
import { OpenUiInlineMarkdownComponent, safeContentUrl } from "./markdown";
import { OpenUiTooltipDirective } from "./tooltip";

export interface CardItem {
  id?: string;
  lhs?: unknown;
  rhs?: unknown;
  top?: unknown;
  bottom?: unknown;
  title?: unknown;
  body?: unknown;
  header?: unknown;
  footer?: { price?: unknown; button?: unknown };
  tag?: unknown;
  bgColor?: string;
  bgImageSrc?: string;
  bgImageAlt?: string;
}
interface CardBlockProps {
  items: unknown[];
  layout?: "grid" | "carousel";
  responsive?: boolean;
  gap?: number | string;
  action?: ActionPlan | ActionConfig;
}
type ContentNodeProps = Record<string, unknown> & {
  title?: unknown;
  value?: unknown;
  subtitle?: unknown;
  subtext?: unknown;
  text?: unknown;
  alt?: unknown;
  label?: unknown;
};
export function nodeProps(node: unknown): ContentNodeProps {
  return node &&
    typeof node === "object" &&
    "props" in node &&
    node.props &&
    typeof node.props === "object"
    ? (node.props as Record<string, unknown>)
    : {};
}
export function overrideNode(node: unknown, props: Record<string, unknown>): unknown {
  return node && typeof node === "object" && "props" in node
    ? { ...node, props: { ...nodeProps(node), ...props } }
    : node;
}
const imports = [
  NgStyle,
  NgTemplateOutlet,
  RenderNode,
  OpenUiIconViewComponent,
  OpenUiInlineMarkdownComponent,
  OpenUiTooltipDirective,
];
const template = `
<ng-template #node let-value><openui-render-node [value]="value" [library]="context.library" [context]="context" [formName]="formName" /></ng-template>
<ng-template #chevron><openui-icon-view name="chevron-right" [size]="kind === 'value-card' || kind === 'overview-card' ? 14 : 16" /></ng-template>
<ng-template #card let-entry>
  @let item = entry.item;
  <div [class]="base + (layout === 'carousel' ? '__carousel-item' : '__item')">
    @switch (kind) {
      @case ('value-card') {
        <div class="openui-value-card" [class.openui-value-card--static]="!clickable" [class.openui-value-card--clickable]="clickable" [attr.role]="clickable ? 'button' : null" [attr.tabindex]="clickable ? 0 : null" (click)="activate(entry.index, $event)" (keydown)="key(entry.index, $event)">
          <div class="openui-value-card__lhs" [openuiTooltip]="item.lhs"><ng-container [ngTemplateOutlet]="node" [ngTemplateOutletContext]="{$implicit:item.lhs}" /></div>
          <div class="openui-value-card__rhs">@if (item.rhs) { <div class="openui-value-card__rhs-content" [openuiTooltip]="item.rhs"><ng-container [ngTemplateOutlet]="node" [ngTemplateOutletContext]="{$implicit:small(item.rhs)}" /></div> } @else if (clickable) { <div class="openui-value-card__chevron" aria-hidden="true"><ng-container [ngTemplateOutlet]="chevron" /></div> }</div>
        </div>
      }
      @case ('overview-card') {
        <div class="openui-overview-card" [class.openui-overview-card--clickable]="clickable" [attr.role]="clickable ? 'button' : null" [attr.tabindex]="clickable ? 0 : null" (click)="activate(entry.index,$event)" (keydown)="key(entry.index,$event)"><div class="openui-overview-card__vertical"><div class="openui-overview-card__top-row">@if(item.top) { <div class="openui-overview-card__slot openui-overview-card__slot--top"><ng-container [ngTemplateOutlet]="node" [ngTemplateOutletContext]="{$implicit:item.top}" /></div> } @if(clickable) { <div class="openui-overview-card__chevron" aria-hidden="true"><ng-container [ngTemplateOutlet]="chevron" /></div> }</div>@if(item.bottom) { <div class="openui-overview-card__slot openui-overview-card__slot--bottom"><ng-container [ngTemplateOutlet]="node" [ngTemplateOutletContext]="{$implicit:item.bottom}" /></div> }</div></div>
      }
      @case ('context-card') {
        <div [class]="'openui-context-card openui-context-card--' + (clickable?'clickable':'static') + (background(item.bgImageSrc) ? ' openui-context-card--variant-image' : item.bgColor ? ' openui-context-card--variant-' + item.bgColor : '')" [style.background-image]="background(item.bgImageSrc)" [attr.aria-label]="item.bgImageAlt ?? null" [attr.role]="clickable?'button':null" [attr.tabindex]="clickable?0:null" (click)="activate(entry.index,$event)" (keydown)="key(entry.index,$event)"><div class="openui-context-card__vertical"><div class="openui-context-card__slot openui-context-card__slot--top">@if(isText(item.title)) { <span class="openui-context-card__title-text">{{text(item.title)}}</span> } @else if(item.title) { <div class="openui-context-card__tag-wrapper"><div class="openui-context-card__tag"><ng-container [ngTemplateOutlet]="node" [ngTemplateOutletContext]="{$implicit:contextTitle(item.title)}" /></div></div> } @if(clickable) { <div class="openui-context-card__chevron" aria-hidden="true"><ng-container [ngTemplateOutlet]="chevron" /></div> }</div>@if(item.body) { <div class="openui-context-card__slot openui-context-card__slot--bottom"><div class="openui-context-card__body-text"><openui-inline-markdown [text]="text(item.body)" /></div></div> }</div></div>
      }
      @case ('visual-first-card') {
        <div [class]="'openui-visual-first-card openui-visual-first-card--' + (clickable?'clickable':'static')" [style.--openui-visual-card-image]="background(item.bgImageSrc)" [attr.aria-label]="item.bgImageAlt ?? null" [attr.role]="clickable?'button':null" [attr.tabindex]="clickable?0:null" (click)="activate(entry.index,$event)" (keydown)="key(entry.index,$event)"><div class="openui-visual-first-card__top"><div class="openui-visual-first-card__tag"><ng-container [ngTemplateOutlet]="node" [ngTemplateOutletContext]="{$implicit:contextTitle(item.tag)}" /></div>@if(clickable){ <div class="openui-visual-first-card__action" aria-hidden="true"><ng-container [ngTemplateOutlet]="chevron" /></div> }</div>@if(item.body) { <div class="openui-visual-first-card__bottom"><ng-container [ngTemplateOutlet]="node" [ngTemplateOutletContext]="{$implicit:item.body}" /></div> }</div>
      }
      @case ('composite-card') {
        <div class="openui-composite-card__wrapper"><div [class]="'openui-composite-card openui-composite-card--'+(clickable?'clickable':'static')" [attr.role]="clickable?'button':null" [attr.tabindex]="clickable?0:null" (click)="activate(entry.index,$event)" (keydown)="key(entry.index,$event)">
          @if(item.header){<div class="openui-composite-card__header"><ng-container [ngTemplateOutlet]="node" [ngTemplateOutletContext]="{$implicit:item.header}" /></div>}
          @if(body(item).length){<div class="openui-composite-card__body">@for(child of body(item);track $index){<ng-container [ngTemplateOutlet]="node" [ngTemplateOutletContext]="{$implicit:compositeNode(child)}" />}</div>}
          @if(item.footer?.price || item.footer?.button){<div class="openui-composite-card__footer"><div class="openui-composite-card__footer-content"><ng-container [ngTemplateOutlet]="node" [ngTemplateOutletContext]="{$implicit:item.footer?.price}" /><ng-container [ngTemplateOutlet]="node" [ngTemplateOutletContext]="{$implicit:compositeNode(item.footer?.button)}" /></div></div>}
        </div></div>
      }
    }
  </div>
</ng-template>
<div [class]="base+' '+base+'--'+kind+' '+base+'--'+layout" [attr.data-card-type]="cardType" [attr.data-layout]="layout" [attr.data-count]="items.length" [ngStyle]="gapStyle">
  @if(layout==='carousel'){
    <div #scroll [class]="base+'__carousel'+(responsive?' '+base+'__carousel--responsive':'')" tabindex="0" aria-label="Cards" (scroll)="measure()"><div [class]="base+'__carousel-track'">@for(item of items;track item.id ?? $index;let i=$index){<ng-container [ngTemplateOutlet]="card" [ngTemplateOutletContext]="{$implicit:{item,index:i}}" />}</div></div>
  } @else {
    <div [class]="base+'__grid'+(responsive?' '+base+'__grid--responsive':'')+(responsive && items.length%2===1?' '+base+'__grid--odd-count':'')">@for(row of rows;track $index){<div [class]="base+'__row '+base+'__row--'+row.length">@for(entry of row;track entry.item.id ?? entry.index){<ng-container [ngTemplateOutlet]="card" [ngTemplateOutletContext]="{$implicit:entry}" />}</div>}</div>
  }
</div>`;

@Directive()
export abstract class OpenUiCardBlock
  extends OpenUiComponent<CardBlockProps>
  implements AfterViewChecked, OnDestroy
{
  abstract kind: string;
  @ViewChild("scroll") private scroll?: ElementRef<HTMLElement>;
  private observed?: HTMLElement;
  private observer?: ResizeObserver;
  get items() {
    return itemProps<CardItem>(this.props?.items);
  }
  get size() {
    return this.kind === "composite-card" || this.kind === "visual-first-card" ? "medium" : "small";
  }
  get base() {
    return `openui-${this.size}-card-block`;
  }
  get cardType() {
    return (
      {
        "value-card": "SnippetCard",
        "overview-card": "OverviewCard",
        "context-card": "ContextCard",
        "composite-card": "CompositeCard",
        "visual-first-card": "VisualCard",
      } as Record<string, string>
    )[this.kind];
  }
  get layout() {
    return this.kind === "value-card" ? "grid" : (this.props?.layout ?? "grid");
  }
  get responsive() {
    return this.props?.responsive !== false;
  }
  get clickable() {
    return !!this.props?.action && !this.context.isStreaming;
  }
  get gapStyle() {
    return this.props?.gap
      ? {
          [`--openui-${this.size}-card-gap`]:
            typeof this.props.gap === "number" ? `${this.props.gap}px` : this.props.gap,
        }
      : {};
  }
  get rows() {
    const items = this.items;
    const counts =
      this.kind === "value-card" || this.kind === "composite-card"
        ? Array.from({ length: Math.ceil(items.length / 2) }, (_, i) =>
            Math.min(2, items.length - i * 2),
          )
        : choiceRows(items.length);
    let offset = 0;
    return counts.map((count) => {
      const row = items
        .slice(offset, offset + count)
        .map((item, i) => ({ item, index: offset + i }));
      offset += count;
      return row;
    });
  }
  body(item: CardItem): unknown[] {
    return Array.isArray(item.body) ? item.body : [];
  }
  isText(value: unknown) {
    return typeof value === "string";
  }
  text(value: unknown) {
    return typeof value === "string" ? value : "";
  }
  tooltip(value: unknown) {
    const p = nodeProps(value);
    return [p.title ?? p.value, p.subtitle ?? p.subtext]
      .filter((v) => typeof v === "string")
      .join("\n");
  }
  small(value: unknown) {
    return overrideNode(value, { size: "xs" });
  }
  contextTitle(value: unknown) {
    return overrideNode(value, { size: "sm" });
  }
  background(src?: string) {
    const url = safeContentUrl(src);
    return url ? `url(${JSON.stringify(url)})` : null;
  }
  compositeNode(value: unknown) {
    if (!value || typeof value !== "object" || !("typeName" in value)) return value;
    const name = String(value.typeName);
    const props: Record<string, unknown> =
      name === "Text" || name === "BoldText"
        ? { size: "xs" }
        : name === "ListBlock"
          ? { size: "small" }
          : name === "EntityList"
            ? { size: "small", header: undefined, footer: undefined }
            : name === "TagBlock"
              ? { size: "sm" }
              : name === "Button"
                ? { size: "small" }
                : ["AreaChart", "BarChart", "LineChart"].includes(name)
                  ? { height: 180 }
                  : {};
    return overrideNode(value, props);
  }
  key(index: number, event: KeyboardEvent) {
    if (event.target !== event.currentTarget || !["Enter", " "].includes(event.key)) return;
    event.preventDefault();
    this.activate(index, event);
  }
  activate(index: number, event: Event) {
    if (!this.clickable) return;
    // Nested actions (e.g. a product's purchase button) must not also activate its outer card.
    const target = event.target as HTMLElement;
    if (
      target !== event.currentTarget &&
      target.closest('button,a,input,select,textarea,[role="button"]') !== event.currentTarget &&
      target.closest('button,a,input,select,textarea,[role="button"]')
    )
      return;
    const item = this.items[index];
    if (!item) return;
    const left = nodeProps(item.lhs),
      right = nodeProps(item.rhs),
      top = nodeProps(item.top),
      bottom = nodeProps(item.bottom),
      header = nodeProps(item.header),
      price = nodeProps(item.footer?.price);
    let extra: Record<string, unknown>;
    let label: unknown;
    if (this.kind === "value-card") {
      label = left.title;
      extra = { itemTitle: left.title, itemSubtitle: left.subtitle, itemValue: right.value };
    } else if (this.kind === "overview-card") {
      label = top.title ?? top.value;
      extra = {
        itemTitle: top.title ?? top.value,
        itemSubtitle: top.subtitle ?? top.subtext,
        itemMetricValue: bottom.value,
      };
    } else if (this.kind === "context-card") {
      label = typeof item.title === "string" ? item.title : nodeProps(item.title).text;
      extra = {
        itemTitle: label ?? "",
        itemBody: item.body,
        itemBgColor: item.bgColor,
        itemBgImageSrc: item.bgImageSrc,
        itemBgImageAlt: item.bgImageAlt,
      };
    } else if (this.kind === "visual-first-card") {
      label = nodeProps(item.body).value || nodeProps(item.tag).text;
      extra = {
        itemBody: nodeProps(item.body).value,
        itemBodySubtext: nodeProps(item.body).subtext,
        itemTag: nodeProps(item.tag).text,
        itemBgImageSrc: item.bgImageSrc,
        itemBgImageAlt: item.bgImageAlt,
      };
    } else {
      label = header.title ?? header.value ?? header.alt;
      extra = {
        itemHeaderTitle: header.title ?? header.value,
        itemHeaderSubtitle: header.subtitle ?? header.subtext,
        itemHeaderAlt: header.alt,
        itemBodyCount: this.body(item).length,
        itemFooterPrice: price.value,
        itemFooterButtonLabel: nodeProps(item.footer?.button).label,
      };
    }
    void this.context.triggerAction(
      String(label ?? item.id ?? `${this.cardType} ${index + 1}`),
      this.formName,
      withItemContext(this.props?.action, { itemIndex: index, itemId: item.id, ...extra }),
    );
  }
  ngAfterViewChecked() {
    const el = this.scroll?.nativeElement;
    if (el !== this.observed) {
      this.observer?.disconnect();
      this.observed = el;
      if (el && typeof ResizeObserver !== "undefined") {
        this.observer = new ResizeObserver(() => this.measure());
        this.observer.observe(el);
      }
    }
    this.measure();
  }
  measure() {
    const el = this.scroll?.nativeElement;
    if (!el) return;
    const left = Math.abs(el.scrollLeft);
    el.classList.toggle(`${this.base}__carousel--mask-left`, left > 0);
    el.classList.toggle(
      `${this.base}__carousel--mask-right`,
      Math.ceil(left) + el.clientWidth < el.scrollWidth,
    );
  }
  ngOnDestroy() {
    this.observer?.disconnect();
  }
}
@Component({ selector: "openui-snippet-cards", standalone: true, imports, template })
export class OpenUiSnippetCardsComponent extends OpenUiCardBlock {
  kind = "value-card";
}
@Component({ selector: "openui-overview-cards", standalone: true, imports, template })
export class OpenUiOverviewCardsComponent extends OpenUiCardBlock {
  kind = "overview-card";
}
@Component({ selector: "openui-context-cards", standalone: true, imports, template })
export class OpenUiContextCardsComponent extends OpenUiCardBlock {
  kind = "context-card";
}
@Component({ selector: "openui-composite-cards", standalone: true, imports, template })
export class OpenUiCompositeCardsComponent extends OpenUiCardBlock {
  kind = "composite-card";
}
@Component({ selector: "openui-visual-cards", standalone: true, imports, template })
export class OpenUiVisualCardsComponent extends OpenUiCardBlock {
  kind = "visual-first-card";
}
