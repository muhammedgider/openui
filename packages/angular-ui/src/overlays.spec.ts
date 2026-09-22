import { TestBed } from "@angular/core/testing";
import { Renderer } from "@openuidev/angular-lang";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openuiLibrary } from "./genui-lib";

async function render(source: string, initialState: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(Renderer);
  let errors: unknown[] = [];
  fixture.componentInstance.error.subscribe((value) => (errors = value));
  fixture.componentRef.setInput("library", openuiLibrary);
  fixture.componentRef.setInput("response", source);
  fixture.componentRef.setInput("initialState", initialState);
  fixture.detectChanges();
  await fixture.whenStable();
  expect(errors).toEqual([]);
  return fixture;
}
beforeEach(async () => {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({ imports: [Renderer] }).compileComponents();
});
afterEach(() => TestBed.resetTestingModule());
const gallery =
  'root = ImageGallery([{src:"/one.png",alt:"One"},{src:"/two.png",alt:"Two"},{src:"/three.png",alt:"Three"}])';
describe("Images, carousel and modal", () => {
  it("resets loading/error when image source changes", async () => {
    const fixture = await render('root = ImageBlock("/one.png", "Preview")');
    const image = fixture.nativeElement.querySelector("img") as HTMLImageElement;
    expect(fixture.nativeElement.querySelector('[role="status"]')).not.toBeNull();
    image.dispatchEvent(new Event("error"));
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector(".openui-image-block-wrapper--error"),
    ).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull();
    fixture.componentRef.setInput("response", 'root = ImageBlock("/two.png", "Preview")');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector("img")).toBe(image);
    expect(fixture.nativeElement.querySelector(".openui-image-block-wrapper--error")).toBeNull();
    image.dispatchEvent(new Event("load"));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull();
  });
  it("opens gallery by keyboard, switches thumbnail, clamps selection after data shrink", async () => {
    const fixture = await render(gallery);
    const thumbnail = fixture.nativeElement.querySelectorAll(
      ".openui-gallery__image",
    )[2] as HTMLElement;
    thumbnail.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector("dialog").hasAttribute("open")).toBe(true);
    expect(fixture.nativeElement.querySelector(".openui-gallery__modal-main img").alt).toBe(
      "Three",
    );
    fixture.componentRef.setInput("response", 'root = ImageGallery([{src:"/one.png",alt:"One"}])');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector(".openui-gallery__modal-main img").alt).toBe("One");
  });
  it("restores existing scroll styles after close and component destruction", async () => {
    const before = document.body.style.overflow;
    document.body.style.overflow = "scroll";
    const fixture = await render(gallery);
    (fixture.nativeElement.querySelector(".openui-gallery__image") as HTMLElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.body.style.overflow).toBe("hidden");
    (
      fixture.nativeElement.querySelector('[aria-label="Close gallery"]') as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.body.style.overflow).toBe("scroll");
    (fixture.nativeElement.querySelector(".openui-gallery__image") as HTMLElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.destroy();
    expect(document.body.style.overflow).toBe("scroll");
    document.body.style.overflow = before;
  });
  it("closes reactive modal through cancel and preserves its state binding", async () => {
    const fixture = await render('root = Modal("Preview", $visible, [TextContent("Hello")])', {
      $visible: true,
    });
    const dialog = fixture.nativeElement.querySelector("dialog") as HTMLDialogElement;
    expect(dialog.hasAttribute("open")).toBe(true);
    dialog.dispatchEvent(new Event("cancel", { cancelable: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(dialog.hasAttribute("open")).toBe(false);
  });
  it("renders carousel slides with the provided content and variant", async () => {
    const fixture = await render(
      'root = Carousel([[TextContent("First")],[TextContent("Second")]], "sunk")',
    );
    expect(fixture.nativeElement.querySelectorAll(".openui-carousel-item")).toHaveLength(2);
    expect(fixture.nativeElement.querySelector(".openui-carousel--sunk")).not.toBeNull();
  });
});
