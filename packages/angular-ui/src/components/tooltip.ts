import { DOCUMENT } from "@angular/common";
import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  inject,
} from "@angular/core";
import { OpenUiIds } from "./field";

/** Truncation-only card tooltip. Text is assigned through textContent, never interpreted as HTML. */
@Directive({ selector: "[openuiTooltip]", standalone: true })
export class OpenUiTooltipDirective implements OnChanges, OnDestroy {
  @Input() openuiTooltip: unknown;
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly document = inject(DOCUMENT);
  private readonly id = inject(OpenUiIds).next();
  private timer?: ReturnType<typeof setTimeout>;
  private popup?: HTMLElement;
  private previousDescription: string | null = null;
  private previousTabIndex: string | null = null;
  private observer?: ResizeObserver;
  private readonly reposition = () => this.hide();
  ngOnChanges() {
    this.hide();
    if (!this.observer && typeof ResizeObserver !== "undefined") {
      this.observer = new ResizeObserver(() => this.measure());
      this.observer.observe(this.host.nativeElement);
    }
  }
  private truncated(selector: string) {
    const el = this.host.nativeElement.querySelector(selector) as HTMLElement | null;
    return !!el && (el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight);
  }
  private content() {
    const node = this.openuiTooltip as { props?: Record<string, unknown> } | undefined;
    const p = node?.props ?? {};
    const heading = p["title"] ?? p["value"];
    const content = p["subtitle"] ?? p["subtext"];
    return {
      heading:
        this.truncated(".openui-text-block__primary") && typeof heading === "string"
          ? heading
          : undefined,
      content:
        this.truncated(".openui-text-block__secondary") && typeof content === "string"
          ? content
          : undefined,
    };
  }
  private measure() {
    const text = this.content();
    const el = this.host.nativeElement;
    if (text.heading || text.content) {
      if (!el.hasAttribute("tabindex")) {
        this.previousTabIndex = el.getAttribute("tabindex");
        el.tabIndex = 0;
      }
    } else {
      this.hide();
      if (el.getAttribute("tabindex") === "0" && this.previousTabIndex === null)
        el.removeAttribute("tabindex");
    }
  }
  @HostListener("pointerenter") enter() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.show(), 100);
  }
  @HostListener("pointerleave") leave() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.hide(), 100);
  }
  @HostListener("focusin") focus() {
    this.show();
  }
  @HostListener("focusout") blur() {
    this.hide();
  }
  @HostListener("keydown", ["$event"]) key(event: KeyboardEvent) {
    if (event.key === "Escape" && this.popup) {
      event.stopPropagation();
      this.hide();
    }
  }
  private show() {
    clearTimeout(this.timer);
    if (this.popup) return;
    const text = this.content();
    if (!text.heading && !text.content) return;
    const el = this.document.createElement("div");
    el.id = this.id;
    el.className = "openui-tooltip-content openui-angular-tooltip";
    el.setAttribute("role", "tooltip");
    el.setAttribute("popover", "manual");
    const body = this.document.createElement("div");
    body.className = "openui-tooltip-body";
    for (const [value, className] of [
      [text.heading, "openui-tooltip-heading"],
      [text.content, "openui-tooltip-text-content"],
    ]) {
      if (!value) continue;
      const span = this.document.createElement("span");
      span.className = className!;
      span.textContent = value;
      body.appendChild(span);
    }
    el.appendChild(body);
    this.host.nativeElement.appendChild(el);
    this.popup = el;
    this.previousDescription = this.host.nativeElement.getAttribute("aria-describedby");
    this.host.nativeElement.setAttribute(
      "aria-describedby",
      [this.previousDescription, this.id].filter(Boolean).join(" "),
    );
    if (typeof el.showPopover === "function") el.showPopover();
    else el.style.display = "block";
    const rect = this.host.nativeElement.getBoundingClientRect();
    const view = this.document.defaultView;
    const left = Math.max(
      8,
      Math.min(rect.left, (view?.innerWidth ?? rect.right) - el.offsetWidth - 8),
    );
    const bottom = rect.bottom + 5;
    const top =
      bottom + el.offsetHeight > (view?.innerHeight ?? Infinity)
        ? Math.max(8, rect.top - el.offsetHeight - 5)
        : bottom;
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    el.addEventListener("pointerenter", () => clearTimeout(this.timer));
    el.addEventListener("pointerleave", () => this.hide());
    el.addEventListener("click", (event) => event.stopPropagation());
    view?.addEventListener("resize", this.reposition);
    view?.addEventListener("scroll", this.reposition, true);
  }
  private hide() {
    clearTimeout(this.timer);
    if (!this.popup) return;
    this.popup.remove();
    this.popup = undefined;
    const host = this.host.nativeElement;
    if (this.previousDescription === null) host.removeAttribute("aria-describedby");
    else host.setAttribute("aria-describedby", this.previousDescription);
    this.document.defaultView?.removeEventListener("resize", this.reposition);
    this.document.defaultView?.removeEventListener("scroll", this.reposition, true);
  }
  ngOnDestroy() {
    this.hide();
    this.observer?.disconnect();
  }
}
