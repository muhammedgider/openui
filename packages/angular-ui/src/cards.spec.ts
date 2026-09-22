import { TestBed } from "@angular/core/testing";
import { ACTION_STEPS, Renderer, type ActionEvent, type ActionPlan } from "@openuidev/angular-lang";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cardCases } from "../e2e/card-cases";
import { EntityListSchema, openuiLibrary } from "./genui-lib";
import { withItemContext } from "./genui-lib/card-action";

async function render(source: string, streaming = false) {
  const fixture = TestBed.createComponent(Renderer);
  let errors: unknown[] = [];
  fixture.componentInstance.error.subscribe((value) => (errors = value));
  fixture.componentRef.setInput("library", openuiLibrary);
  fixture.componentRef.setInput("response", source);
  fixture.componentRef.setInput("isStreaming", streaming);
  fixture.detectChanges();
  await fixture.whenStable();
  expect(errors).toEqual([]);
  return fixture;
}
const source = (name: string) => cardCases.find(([key]) => key === name)![1];
beforeEach(async () => {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({ imports: [Renderer] }).compileComponents();
});
afterEach(() => TestBed.resetTestingModule());
describe("Card and list renderers", () => {
  it.each(cardCases)("renders %s without parser or template errors", async (_name, source) => {
    const fixture = await render(source);
    expect(fixture.nativeElement.textContent.trim().length).toBeGreaterThan(0);
    expect(fixture.nativeElement.querySelector('[class*="openui-"]')).not.toBeNull();
  });
  it("activates a card once with Enter/Space, preserves its node across source updates", async () => {
    const fixture = await render(source("snippet-cards"));
    const actions: ActionEvent[] = [];
    fixture.componentInstance.action.subscribe((event) => actions.push(event));
    const card = fixture.nativeElement.querySelector(".openui-value-card") as HTMLElement;
    card.focus();
    card.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await fixture.whenStable();
    expect(actions).toHaveLength(1);
    expect(JSON.stringify(actions[0])).toContain("itemIndex");
    fixture.componentRef.setInput(
      "response",
      source("snippet-cards").replace("This month", "Next month"),
    );
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector(".openui-value-card")).toBe(card);
    expect(document.activeElement).toBe(card);
    card.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    await fixture.whenStable();
    expect(actions).toHaveLength(2);
  });
  it("prevents nested links and footer actions from also activating the card", async () => {
    const fixture = await render(source("composite-cards"));
    const actions: ActionEvent[] = [];
    fixture.componentInstance.action.subscribe((event) => actions.push(event));
    (fixture.nativeElement.querySelector("button") as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(actions).toHaveLength(1);
    expect(JSON.stringify(actions[0])).toContain("purchase");
    expect(JSON.stringify(actions[0])).not.toContain("inspect");
  });
  it("locks card and list actions during streaming and reenables in place", async () => {
    const fixture = await render(source("context-cards"), true);
    const actions: ActionEvent[] = [];
    fixture.componentInstance.action.subscribe((event) => actions.push(event));
    const card = fixture.nativeElement.querySelector(".openui-context-card") as HTMLElement;
    expect(card.hasAttribute("tabindex")).toBe(false);
    card.click();
    await fixture.whenStable();
    expect(actions).toHaveLength(0);
    fixture.componentRef.setInput("isStreaming", false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector(".openui-context-card")).toBe(card);
    card.click();
    await fixture.whenStable();
    expect(actions).toHaveLength(1);
  });
  it("uses small variants inside composite cards and hides entity headers/footers", async () => {
    const fixture = await render(source("composite-cards"));
    expect(fixture.nativeElement.querySelector(".openui-list-block--small")).not.toBeNull();
    expect(fixture.nativeElement.querySelector(".openui-entity-list--small")).not.toBeNull();
    expect(fixture.nativeElement.querySelector(".openui-button-base-small")).not.toBeNull();
    expect(
      EntityListSchema.safeParse({ rows: [], size: "small", header: { left: "A", right: "B" } })
        .success,
    ).toBe(false);
  });
  it("only shows truncated tooltip text and dismisses it with Escape", async () => {
    const fixture = await render(source("snippet-cards"));
    const trigger = fixture.nativeElement.querySelector(".openui-value-card__lhs") as HTMLElement;
    trigger.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    expect(fixture.nativeElement.querySelector('[role="tooltip"]')).toBeNull();
    const heading = trigger.querySelector(".openui-text-block__primary") as HTMLElement;
    Object.defineProperties(heading, { scrollWidth: { value: 300 }, clientWidth: { value: 100 } });
    trigger.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="tooltip"]').textContent).toBe("Launch");
    expect(trigger.hasAttribute("aria-describedby")).toBe(true);
    trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(fixture.nativeElement.querySelector('[role="tooltip"]')).toBeNull();
    expect(trigger.hasAttribute("aria-describedby")).toBe(false);
  });
  it("escapes Markdown HTML and rejects executable background URLs", async () => {
    const fixture = await render(
      'root = ContextCardBlock([ContextCardItem("a", "Unsafe", "<script>bad()</script>", null, "javascript:alert(1)"), ContextCardItem("b", "Plain")])',
    );
    expect(fixture.nativeElement.querySelector("script")).toBeNull();
    expect(
      (fixture.nativeElement.querySelector(".openui-context-card") as HTMLElement).style
        .backgroundImage,
    ).toBe("");
  });
});
describe("Card action context", () => {
  it("merges legacy context, preserves URL and drops undefined keys", () => {
    expect(
      withItemContext(
        { type: "open_url", url: "https://example.com", params: { itemIndex: 8 } },
        { itemIndex: 2, itemId: undefined },
      ),
    ).toEqual({ type: "open_url", params: { url: "https://example.com", itemIndex: 2 } });
  });
  it("appends selection context only to assistant steps without mutating the shared plan", () => {
    const action = { steps: [{ type: ACTION_STEPS.ToAssistant, context: "Choose" }] } as ActionPlan;
    const result = withItemContext(action, { itemIndex: 1 }) as ActionPlan;
    expect(result.steps[0]).toEqual({
      type: ACTION_STEPS.ToAssistant,
      context: 'Choose\nSelected item: {"itemIndex":1}',
    });
    expect(action.steps[0]).toEqual({ type: ACTION_STEPS.ToAssistant, context: "Choose" });
    expect(withItemContext(action, {})).toBe(action);
  });
});
