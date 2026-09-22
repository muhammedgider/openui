import { TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { Renderer, type ActionEvent } from "@openuidev/angular-lang";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { OpenUiCalendarComponent, calendarDate } from "./components/date-picker";
import { OpenUiEditableTableComponent } from "./components/editable-table";
import { openuiLibrary } from "./genui-lib";
async function render(
  source: string,
  streaming = false,
  initialState: Record<string, unknown> = {},
) {
  const f = TestBed.createComponent(Renderer);
  const errors: unknown[] = [];
  f.componentInstance.error.subscribe((e) => errors.push(...e));
  f.componentRef.setInput("library", openuiLibrary);
  f.componentRef.setInput("response", source);
  f.componentRef.setInput("isStreaming", streaming);
  f.componentRef.setInput("initialState", initialState);
  f.detectChanges();
  await f.whenStable();
  expect(errors).toEqual([]);
  return f;
}
beforeEach(async () => {
  await TestBed.configureTestingModule({
    imports: [Renderer, OpenUiCalendarComponent],
  }).compileComponents();
});
afterEach(() => TestBed.resetTestingModule());
describe("Advanced inputs", () => {
  it("commits a keyboard slider change after debounce and suppresses discrete controls while streaming", async () => {
    const f = await render('root = Slider("budget", "discrete", 0, 100, 10, [20])');
    const thumb = f.nativeElement.querySelector("[role=slider]") as HTMLElement;
    thumb.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    f.detectChanges();
    expect(thumb.getAttribute("aria-valuenow")).toBe("30");
    await new Promise((r) => setTimeout(r, 230));
    expect(f.componentInstance.context.getFieldValue(undefined, "budget")).toEqual([30]);
    f.componentRef.setInput("isStreaming", true);
    f.detectChanges();
    expect(f.nativeElement.querySelector("select")).toBeNull();
    expect(f.nativeElement.querySelector(".openui-slider-dots-dot")).toBeNull();
  });
  it("keeps range thumbs separated and ignores input during streaming", async () => {
    const f = await render('root = Slider("range", "continuous", 0, 100, 10, [20,30])');
    const thumb = f.nativeElement.querySelector("[role=slider]") as HTMLElement;
    thumb.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    f.detectChanges();
    expect(thumb.getAttribute("aria-valuenow")).toBe("20");
    f.componentRef.setInput("isStreaming", true);
    f.detectChanges();
    thumb.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    f.detectChanges();
    expect(thumb.getAttribute("aria-valuenow")).toBe("20");
  });
  it("rejects invalid calendar dates and retains leap days", () => {
    expect(calendarDate("2024-02-29")?.getDate()).toBe(29);
    expect(calendarDate("2023-02-29")).toBeUndefined();
    expect(calendarDate("not a date")).toBeUndefined();
  });
  it("calendar emits local Date values and sorts a reversed range", () => {
    const f = TestBed.createComponent(OpenUiCalendarComponent);
    f.componentRef.setInput("mode", "range");
    f.componentRef.setInput("value", { from: new Date(2024, 1, 20) });
    f.detectChanges();
    let emitted: unknown;
    f.componentInstance.valueChange.subscribe((v) => (emitted = v));
    f.componentInstance.choose(new Date(2024, 1, 10));
    expect(emitted).toEqual({ from: new Date(2024, 1, 10), to: new Date(2024, 1, 20) });
    expect(f.nativeElement.querySelectorAll("[data-date]")).toHaveLength(29);
  });
  it("date picker displays a reactive value and locks its trigger during streaming", async () => {
    const f = await render('root = DatePicker("when","single",{},$date)', false, {
      $date: "2024-02-29",
    });
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain("Feb 29, 2024");
    f.componentRef.setInput("isStreaming", true);
    f.detectChanges();
    expect((f.nativeElement.querySelector("button") as HTMLButtonElement).disabled).toBe(true);
  });
  const source =
    'root = EditableTable("orders", [{type:"text",key:"product",header:"Product"},{type:"number",key:"quantity",header:"Quantity"}], [{id:"a",values:["Book",2]}])';
  it("tracks changed cells, resets, and saves positional data with the table-scoped action", async () => {
    const f = await render(source);
    const cmp = f.debugElement.query(By.directive(OpenUiEditableTableComponent))
      .componentInstance as OpenUiEditableTableComponent;
    const actions: ActionEvent[] = [];
    f.componentInstance.action.subscribe((e) => actions.push(e));
    cmp.start(0, 1);
    cmp.buffer.set("7");
    cmp.finish(true, false);
    f.detectChanges();
    expect(cmp.changedCount).toBe(1);
    cmp.reset();
    expect(cmp.rows()[0]?.values[1]).toBe(2);
    cmp.start(0, 1);
    cmp.buffer.set("9");
    cmp.finish(true, false);
    cmp.save();
    expect(f.componentInstance.context.getFieldValue("orders", "orders")).toEqual([
      { id: "a", values: ["Book", 9] },
    ]);
    expect(actions).toHaveLength(1);
    expect(cmp.changedCount).toBe(0);
  });
  it("Escape cancels without a following blur committing the edit buffer", async () => {
    const f = await render(source);
    const cmp = f.debugElement.query(By.directive(OpenUiEditableTableComponent))
      .componentInstance as OpenUiEditableTableComponent;
    cmp.start(0, 0);
    cmp.buffer.set("Changed");
    cmp.key(0, 0, new KeyboardEvent("keydown", { key: "Escape" }));
    cmp.finish(true);
    expect(cmp.rows()[0]?.values[0]).toBe("Book");
    expect(cmp.changedCount).toBe(0);
  });
  it("does not allow edits or Save Changes while streaming", async () => {
    const f = await render(source, true);
    const cmp = f.debugElement.query(By.directive(OpenUiEditableTableComponent))
      .componentInstance as OpenUiEditableTableComponent;
    const actions: ActionEvent[] = [];
    f.componentInstance.action.subscribe((e) => actions.push(e));
    cmp.start(0, 0);
    cmp.save();
    expect(cmp.editing()).toBeNull();
    expect(actions).toHaveLength(0);
  });
});
