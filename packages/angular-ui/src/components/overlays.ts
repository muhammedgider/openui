import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnChanges,
  OnDestroy,
  ViewChild,
  inject,
  signal,
} from "@angular/core";
import { RenderNode, resolveStateField } from "@openuidev/angular-lang";
import { OpenUiComponent } from "./base";
import { OpenUiDialogDirective } from "./dialog";
import { OpenUiIds } from "./field";
import { OpenUiIconViewComponent } from "./inline-content";
import { safeContentUrl } from "./markdown";

@Component({
  selector: "openui-modal",
  standalone: true,
  imports: [RenderNode, OpenUiDialogDirective, OpenUiIconViewComponent],
  template: ` <dialog
    class="openui-native-dialog"
    [openuiDialog]="isOpen"
    (dismissed)="close()"
    [attr.aria-labelledby]="titleId"
  >
    <div class="openui-modal-root">
      <div class="openui-modal-overlay" (click)="close()"></div>
      <div [class]="'openui-modal-content openui-modal-' + (props?.size ?? 'md')" tabindex="-1">
        <div class="openui-modal-header">
          <h2 [id]="titleId" class="openui-modal-title">{{ props?.title }}</h2>
          <button type="button" class="openui-modal-close" aria-label="Close" (click)="close()">
            <openui-icon-view name="x" [size]="18" />
          </button>
        </div>
        <div class="openui-modal-body">
          @if (isOpen) {
            <openui-render-node
              [value]="props?.children"
              [library]="context.library"
              [context]="context"
              [formName]="formName"
            />
          }
        </div>
      </div>
    </div>
  </dialog>`,
})
export class OpenUiModalComponent extends OpenUiComponent<{
  title: string;
  open?: unknown;
  children: unknown[];
  size?: string;
}> {
  readonly titleId = inject(OpenUiIds).next();
  get field() {
    return resolveStateField<unknown>(
      "open",
      this.props?.open,
      this.context.store,
      this.context.evaluationContext,
      (name) => this.context.getFieldValue(this.formName, name),
      (name, value) => this.context.setFieldValue(this.formName, undefined, name, value),
    );
  }
  get isOpen() {
    return this.field.value === true || this.field.value === "true";
  }
  close() {
    this.field.setValue(false);
  }
}

@Component({
  selector: "openui-carousel",
  standalone: true,
  imports: [RenderNode, OpenUiIconViewComponent],
  template: ` <div
    [class]="'openui-carousel openui-carousel--' + (props?.variant ?? 'card')"
    role="region"
    aria-roledescription="carousel"
    aria-label="Content"
  >
    <div
      #scroll
      class="openui-carousel-content"
      [class.openui-carousel-content--mask-left]="previous()"
      [class.openui-carousel-content--mask-right]="next()"
      tabindex="0"
      (scroll)="measure()"
      (keydown)="key($event)"
    >
      @for (item of props?.children ?? []; track $index; let i = $index) {
        <div
          class="openui-carousel-item"
          role="group"
          aria-roledescription="slide"
          [attr.aria-label]="'Slide ' + (i + 1)"
        >
          <openui-render-node
            [value]="item"
            [library]="context.library"
            [context]="context"
            [formName]="formName"
          />
        </div>
      }
    </div>
    @if (previous()) {
      <div class="openui-carousel-button openui-carousel-button-left">
        <button
          type="button"
          class="openui-icon-button openui-icon-button-secondary openui-icon-button-small openui-icon-button-square"
          aria-label="Previous slide"
          (click)="move(-1)"
        >
          <span class="openui-icon-button-icon"
            ><openui-icon-view name="chevron-left" [size]="24"
          /></span>
        </button>
      </div>
    }
    @if (next()) {
      <div class="openui-carousel-button openui-carousel-button-right">
        <button
          type="button"
          class="openui-icon-button openui-icon-button-secondary openui-icon-button-small openui-icon-button-square"
          aria-label="Next slide"
          (click)="move(1)"
        >
          <span class="openui-icon-button-icon"
            ><openui-icon-view name="chevron-right" [size]="24"
          /></span>
        </button>
      </div>
    }
  </div>`,
})
export class OpenUiCarouselComponent
  extends OpenUiComponent<{ children: unknown[][]; variant?: "card" | "sunk" }>
  implements AfterViewChecked, OnDestroy
{
  @ViewChild("scroll") private scroll?: ElementRef<HTMLElement>;
  readonly previous = signal(false);
  readonly next = signal(false);
  private observed?: HTMLElement;
  private observer?: ResizeObserver;
  private mutation?: MutationObserver;
  ngAfterViewChecked() {
    const el = this.scroll?.nativeElement;
    if (!el || el === this.observed) return;
    this.observed = el;
    this.observer?.disconnect();
    this.mutation?.disconnect();
    if (typeof ResizeObserver !== "undefined") {
      this.observer = new ResizeObserver(() => this.measure());
      this.observer.observe(el);
    }
    if (typeof MutationObserver !== "undefined") {
      this.mutation = new MutationObserver(() => this.measure());
      this.mutation.observe(el, { childList: true, subtree: true });
    }
  }
  measure() {
    const el = this.scroll?.nativeElement;
    if (!el) return;
    this.previous.set(Math.abs(el.scrollLeft) > 0);
    this.next.set(Math.ceil(Math.abs(el.scrollLeft)) + el.clientWidth < el.scrollWidth);
  }
  move(direction: number) {
    const el = this.scroll?.nativeElement;
    if (!el) return;
    const items = Array.from(el.children) as HTMLElement[];
    if (!items.length) return;
    const rect = el.getBoundingClientRect();
    let i = items.findIndex((item) => item.getBoundingClientRect().left >= rect.left - 1);
    if (i < 0) i = items.length - 1;
    const item = items[Math.max(0, Math.min(items.length - 1, i + direction))];
    if (item) el.scrollTo({ left: item.offsetLeft, behavior: "smooth" });
  }
  key(event: KeyboardEvent) {
    if (event.target !== event.currentTarget) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      this.move(event.key === "ArrowLeft" ? -1 : 1);
    }
  }
  ngOnDestroy() {
    this.observer?.disconnect();
    this.mutation?.disconnect();
  }
}

@Component({
  selector: "openui-image-block",
  standalone: true,
  template: `@if (url) {
    <div
      #wrapper
      class="openui-image-block-wrapper"
      [class.openui-image-block-wrapper--mobile]="mobile()"
      [class.openui-image-block-wrapper--error]="error()"
      [style.--bg-image]="background"
    >
      <img
        class="openui-image-block-image"
        [class.openui-image-block-image--mobile]="mobile()"
        [class.openui-image-block-image--error]="error()"
        [src]="url"
        [alt]="props?.alt ?? ''"
        (load)="loaded(false)"
        (error)="loaded(true)"
      />
      @if (loading()) {
        <div class="openui-image-block-loader" role="status" aria-label="Loading image"></div>
      }
    </div>
  }`,
})
export class OpenUiImageBlockComponent
  extends OpenUiComponent<{ src: string; alt?: string }>
  implements OnChanges, AfterViewChecked, OnDestroy
{
  @ViewChild("wrapper") private wrapper?: ElementRef<HTMLElement>;
  readonly mobile = signal(true);
  readonly error = signal(false);
  readonly loading = signal(true);
  private source?: string;
  private observed?: HTMLElement;
  private observer?: ResizeObserver;
  get url() {
    return safeContentUrl(this.props?.src);
  }
  get background() {
    return this.url && !this.error() ? `url(${JSON.stringify(this.url)})` : null;
  }
  ngOnChanges() {
    if (this.source !== this.props?.src) {
      this.source = this.props?.src;
      this.error.set(false);
      this.loading.set(true);
    }
  }
  loaded(error: boolean) {
    this.loading.set(false);
    this.error.set(error);
  }
  ngAfterViewChecked() {
    const el = this.wrapper?.nativeElement;
    if (el === this.observed) return;
    this.observer?.disconnect();
    this.observed = el;
    if (el && typeof ResizeObserver !== "undefined") {
      this.observer = new ResizeObserver(() => this.mobile.set(el.clientWidth < 480));
      this.observer.observe(el);
    }
  }
  ngOnDestroy() {
    this.observer?.disconnect();
  }
}

interface GalleryImage {
  src: string;
  alt?: string;
  details?: string;
}
@Component({
  selector: "openui-image-gallery",
  standalone: true,
  imports: [OpenUiDialogDirective, OpenUiIconViewComponent],
  template: ` @if (images.length) {
      <div [class]="'openui-gallery openui-gallery--' + layout">
        <div class="openui-gallery__grid">
          @for (image of images.slice(0, 5); track $index; let i = $index) {
            <div
              class="openui-gallery__image"
              [class.openui-gallery__image--main]="i === 0"
              role="button"
              tabindex="0"
              [attr.aria-label]="image.alt || 'Gallery image ' + (i + 1)"
              (click)="open(i)"
              (keydown)="activate(i, $event)"
            >
              <img [attr.src]="url(image.src)" [alt]="image.alt || 'Gallery image ' + (i + 1)" />
            </div>
          }
          @if (images.length > 5) {
            <div class="openui-gallery__show-all-button">
              <button
                type="button"
                class="openui-button-base openui-button-base-primary openui-button-base-small"
                (click)="open(selectedIndex)"
              >
                Show All
              </button>
            </div>
          }
        </div>
      </div>
    }
    <dialog
      class="openui-native-dialog"
      [openuiDialog]="opened() && images.length > 0"
      (dismissed)="opened.set(false)"
      [attr.aria-labelledby]="headingId"
    >
      <div class="openui-gallery__modal" (click)="backdrop($event)">
        <div class="openui-gallery__modal-content">
          <div class="openui-gallery__modal-header">
            <span [id]="headingId" class="openui-gallery__modal-heading">All Photos</span
            ><button
              type="button"
              class="openui-icon-button openui-icon-button-small openui-icon-button-secondary openui-icon-button-square"
              aria-label="Close gallery"
              (click)="opened.set(false)"
            >
              <span class="openui-icon-button-icon"><openui-icon-view name="x" [size]="24" /></span>
            </button>
          </div>
          @if (opened()) {
            <div class="openui-gallery__modal-main">
              <img
                [attr.src]="url(selected?.src)"
                [alt]="selected?.alt || 'Gallery image ' + (selectedIndex + 1)"
              />
            </div>
            <div class="openui-gallery__modal-carousel-container">
              @if (left()) {
                <div
                  class="openui-gallery__modal-carousel-button-container openui-gallery__modal-carousel-button-container-left"
                >
                  <button
                    type="button"
                    class="openui-icon-button openui-icon-button-extra-small openui-icon-button-secondary openui-icon-button-square openui-gallery__carousel-button openui-gallery__carousel-button--left"
                    aria-label="Scroll images left"
                    (click)="scroll(-1)"
                  >
                    <span class="openui-icon-button-icon"
                      ><openui-icon-view name="chevron-left" [size]="24"
                    /></span>
                  </button>
                </div>
              }
              <div #thumbnails class="openui-gallery__modal-carousel" (scroll)="measure()">
                @for (image of images; track $index; let i = $index) {
                  <div
                    class="openui-gallery__modal-thumbnail"
                    [class.openui-gallery__modal-thumbnail--active]="i === selectedIndex"
                    role="button"
                    tabindex="0"
                    [attr.aria-label]="image.alt || 'Gallery image ' + (i + 1)"
                    [attr.aria-pressed]="i === selectedIndex"
                    (click)="index.set(i)"
                    (keydown)="activate(i, $event)"
                  >
                    <img [attr.src]="url(image.src)" alt="" aria-hidden="true" />
                  </div>
                }
              </div>
              @if (right()) {
                <div
                  class="openui-gallery__modal-carousel-button-container openui-gallery__modal-carousel-button-container-right"
                >
                  <button
                    type="button"
                    class="openui-icon-button openui-icon-button-extra-small openui-icon-button-secondary openui-icon-button-square openui-gallery__carousel-button openui-gallery__carousel-button--right"
                    aria-label="Scroll images right"
                    (click)="scroll(1)"
                  >
                    <span class="openui-icon-button-icon"
                      ><openui-icon-view name="chevron-right" [size]="24"
                    /></span>
                  </button>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </dialog>`,
})
export class OpenUiImageGalleryComponent
  extends OpenUiComponent<{ images: GalleryImage[] }>
  implements AfterViewChecked, OnDestroy
{
  readonly headingId = inject(OpenUiIds).next();
  readonly url = safeContentUrl;
  readonly opened = signal(false);
  readonly index = signal(0);
  readonly left = signal(false);
  readonly right = signal(false);
  @ViewChild("thumbnails") private thumbnails?: ElementRef<HTMLElement>;
  private observed?: HTMLElement;
  private observer?: ResizeObserver;
  get images() {
    return Array.isArray(this.props?.images) ? this.props.images : [];
  }
  get layout() {
    return ["single", "double", "triple", "quad"][this.images.length - 1] ?? "default";
  }
  get selectedIndex() {
    return Math.max(0, Math.min(this.index(), this.images.length - 1));
  }
  get selected() {
    return this.images[this.selectedIndex];
  }
  open(index: number) {
    this.index.set(index);
    this.opened.set(true);
  }
  activate(index: number, event: KeyboardEvent) {
    if (event.target === event.currentTarget && ["Enter", " "].includes(event.key)) {
      event.preventDefault();
      this.open(index);
    }
  }
  backdrop(event: MouseEvent) {
    if (event.target === event.currentTarget) this.opened.set(false);
  }
  measure() {
    const el = this.thumbnails?.nativeElement;
    if (!el) return;
    this.left.set(el.scrollLeft > 0);
    this.right.set(Math.ceil(el.scrollLeft) + el.clientWidth < el.scrollWidth);
  }
  scroll(direction: number) {
    const el = this.thumbnails?.nativeElement;
    el?.scrollBy({ left: direction * el.clientWidth * 0.28, behavior: "smooth" });
  }
  ngAfterViewChecked() {
    const el = this.thumbnails?.nativeElement;
    if (el === this.observed) return;
    this.observer?.disconnect();
    this.observed = el;
    if (el && typeof ResizeObserver !== "undefined") {
      this.observer = new ResizeObserver(() => this.measure());
      this.observer.observe(el);
    }
  }
  ngOnDestroy() {
    this.observer?.disconnect();
  }
}
