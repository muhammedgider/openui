import { DOCUMENT } from "@angular/common";
import {
  AfterViewChecked,
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Injectable,
  Input,
  OnDestroy,
  Output,
  inject,
} from "@angular/core";

@Injectable({ providedIn: "root" })
class DialogScrollLock {
  private readonly document = inject(DOCUMENT);
  private count = 0;
  private previous = "";
  acquire() {
    if (this.count++ === 0) {
      this.previous = this.document.body.style.overflow;
      this.document.body.style.overflow = "hidden";
    }
  }
  release() {
    if (this.count > 0 && --this.count === 0) this.document.body.style.overflow = this.previous;
  }
}
/** Native top layer provides focus containment and inert siblings, without a framework wrapper. */
@Directive({ selector: "dialog[openuiDialog]", standalone: true, exportAs: "openuiDialog" })
export class OpenUiDialogDirective implements AfterViewChecked, OnDestroy {
  @Input() openuiDialog = false;
  @Output() dismissed = new EventEmitter<void>();
  private readonly element = inject(ElementRef<HTMLDialogElement>);
  private readonly document = inject(DOCUMENT);
  private readonly lock = inject(DialogScrollLock);
  private shown = false;
  private scheduled = false;
  private destroyed = false;
  private previousFocus?: HTMLElement;
  ngAfterViewChecked() {
    if (this.openuiDialog === this.shown) return;
    const el = this.element.nativeElement;
    // Dynamic renderers can check a view before inserting it into the document.
    if (!el.isConnected) {
      if (!this.scheduled) {
        this.scheduled = true;
        queueMicrotask(() => {
          this.scheduled = false;
          if (!this.destroyed && el.isConnected) this.ngAfterViewChecked();
        });
      }
      return;
    }
    if (this.openuiDialog) {
      this.previousFocus = this.document.activeElement as HTMLElement;
      if (typeof el.showModal === "function") el.showModal();
      else el.setAttribute("open", "");
      this.shown = true;
      this.lock.acquire();
    } else this.close();
  }
  @HostListener("cancel", ["$event"]) cancel(event: Event) {
    event.preventDefault();
    this.dismissed.emit();
  }
  private close() {
    if (!this.shown) return;
    this.shown = false;
    const el = this.element.nativeElement;
    if (typeof el.close === "function") el.close();
    else el.removeAttribute("open");
    this.lock.release();
    if (this.previousFocus?.isConnected) this.previousFocus.focus();
  }
  ngOnDestroy() {
    this.destroyed = true;
    this.close();
  }
}
