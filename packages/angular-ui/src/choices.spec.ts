import { TestBed } from "@angular/core/testing";
import { Renderer, type ActionEvent } from "@openuidev/angular-lang";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { choiceRows } from "./components/choice";
import { openuiLibrary } from "./genui-lib";

async function render(
  response: string,
  streaming = false,
  initialState: Record<string, unknown> = {},
) {
  const fixture = TestBed.createComponent(Renderer);
  let errors: unknown[] = [];
  fixture.componentInstance.error.subscribe((value) => {
    errors = value;
  });
  fixture.componentRef.setInput("library", openuiLibrary);
  fixture.componentRef.setInput("response", response);
  fixture.componentRef.setInput("isStreaming", streaming);
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

describe("Chips and option cards", () => {
  it("hydrates defaults and preserves a deliberate deselection across new props", async () => {
    const source =
      'root = Chips("interest", "single", [ChipItem("a", "Alpha"), ChipItem("b", "Beta")], null, "a")';
    const fixture = await render(source);
    const alpha = fixture.nativeElement.querySelector("button") as HTMLButtonElement;
    expect(alpha.getAttribute("aria-selected")).toBe("true");
    expect(fixture.componentInstance.context.getFieldValue(undefined, "interest")).toBe("a");
    alpha.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(alpha.getAttribute("aria-selected")).toBe("false");
    fixture.componentRef.setInput("response", source.replace('"Beta"', '"Beta updated"'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector("button")).toBe(alpha);
    expect(alpha.getAttribute("aria-selected")).toBe("false");
  });

  it("preserves saved multi-selection and blocks disabled items", async () => {
    const fixture = await render(
      'root = Chips("tags", "multiple", [ChipItem("a", "Alpha"), ChipItem("b", "Beta", null, true), ChipItem("c", "Gamma")], null, ["a"])',
      false,
      { tags: ["c"] },
    );
    const buttons = fixture.nativeElement.querySelectorAll(
      "button",
    ) as NodeListOf<HTMLButtonElement>;
    expect(buttons[0].getAttribute("aria-selected")).toBe("false");
    expect(buttons[2].getAttribute("aria-selected")).toBe("true");
    buttons[0].click();
    buttons[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.context.getFieldValue(undefined, "tags")).toEqual(["c", "a"]);
  });

  it("does not hydrate or accept choices during streaming and preserves focus afterward", async () => {
    const source =
      'root = OptionCards("plan", "single", [OptionCard("a", "Alpha"), OptionCard("b", "Beta")], null, "a")';
    const fixture = await render(source, true);
    const button = fixture.nativeElement.querySelector("button") as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(fixture.componentInstance.context.getFieldValue(undefined, "plan")).toBeUndefined();
    fixture.componentRef.setInput("isStreaming", false);
    fixture.detectChanges();
    await fixture.whenStable();
    button.focus();
    button.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector("button")).toBe(button);
    expect(document.activeElement).toBe(button);
    expect(button.getAttribute("aria-checked")).toBe("false");
  });

  it("validates required choice fields before submitting a form", async () => {
    const fixture = await render(
      'root = Form("profile", Buttons([Button("Submit")]), [FormControl("Plan", OptionCards("plan", "single", [OptionCard("a", "Alpha")], {required: true}))])',
    );
    const actions: ActionEvent[] = [];
    fixture.componentInstance.action.subscribe((event) => actions.push(event));
    const submit = fixture.nativeElement.querySelector(".openui-button-base") as HTMLButtonElement;
    submit.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(actions).toHaveLength(0);
    expect(fixture.nativeElement.querySelector('[aria-invalid="true"]')).not.toBeNull();
    (fixture.nativeElement.querySelector('[role="radio"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    submit.click();
    await fixture.whenStable();
    expect(actions).toHaveLength(1);
  });

  it("moves keyboard focus past disabled choices without changing selection", async () => {
    const fixture = await render(
      'root = Chips("tags", "multiple", [ChipItem("a", "Alpha"), ChipItem("b", "Beta", null, true), ChipItem("c", "Gamma")])',
    );
    const buttons = fixture.nativeElement.querySelectorAll(
      "button",
    ) as NodeListOf<HTMLButtonElement>;
    buttons[0].focus();
    buttons[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(document.activeElement).toBe(buttons[2]);
    buttons[2].dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    expect(document.activeElement).toBe(buttons[0]);
    expect(fixture.componentInstance.context.getFieldValue(undefined, "tags")).toBeUndefined();
  });

  it("filters incomplete items and balances responsive rows like upstream", async () => {
    expect(Array.from({ length: 9 }, (_, i) => choiceRows(i))).toEqual([
      [],
      [1],
      [2],
      [3],
      [2, 2],
      [3, 2],
      [3, 3],
      [3, 2, 2],
      [3, 2, 3],
    ]);
    const fixture = await render(
      'root = OptionCards("plan", "single", [OptionCard("", "Incomplete"), OptionCard("a", "**Alpha**", "Details", Icon("rocket"))])',
    );
    expect(fixture.nativeElement.querySelectorAll("button")).toHaveLength(1);
    expect(fixture.nativeElement.querySelector("strong").textContent).toBe("Alpha");
    await expect.poll(() => fixture.nativeElement.querySelector("svg")).not.toBeNull();
  });
});

describe("Image and steps", () => {
  it("renders numbered steps with Markdown details", async () => {
    const fixture = await render(
      'root = Steps([StepsItem("Install", "Run **install**"), StepsItem("Render", "Use `Renderer`")])',
    );
    expect(
      Array.from(fixture.nativeElement.querySelectorAll(".openui-step-number-inner"), (node) =>
        (node as HTMLElement).textContent?.trim(),
      ),
    ).toEqual(["1", "2"]);
    expect(fixture.nativeElement.querySelector("strong").textContent).toBe("install");
    expect(fixture.nativeElement.querySelector("code").textContent).toBe("Renderer");
  });

  it("handles image errors and recovers when the source changes", async () => {
    const fixture = await render('root = Image("Preview", "/first.png")');
    const image = fixture.nativeElement.querySelector("img") as HTMLImageElement;
    image.dispatchEvent(new Event("error"));
    fixture.detectChanges();
    expect(image.classList.contains("openui-image--error")).toBe(true);
    fixture.componentRef.setInput("response", 'root = Image("Preview", "/second.png")');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(image.classList.contains("openui-image--error")).toBe(false);
    expect(image.getAttribute("src")).toBe("/second.png");
    expect(image.alt).toBe("Preview");
  });
});
