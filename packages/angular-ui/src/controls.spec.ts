import { TestBed } from "@angular/core/testing";
import { Renderer, type ActionEvent } from "@openuidev/angular-lang";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openuiLibrary } from "./genui-lib";

async function render(
  source: string,
  streaming = false,
  initialState: Record<string, unknown> = {},
) {
  const fixture = TestBed.createComponent(Renderer);
  let errors: unknown[] = [];
  fixture.componentInstance.error.subscribe((value) => {
    errors = value;
  });
  fixture.componentRef.setInput("library", openuiLibrary);
  fixture.componentRef.setInput("response", source);
  fixture.componentRef.setInput("isStreaming", streaming);
  fixture.componentRef.setInput("initialState", initialState);
  fixture.detectChanges();
  await fixture.whenStable();
  expect(errors).toEqual([]);
  return fixture;
}

beforeEach(async () => {
  await TestBed.configureTestingModule({ imports: [Renderer] }).compileComponents();
});
afterEach(() => TestBed.resetTestingModule());

describe("Form and selection port", () => {
  it("validates before a primary action and links labels/hints to the native input", async () => {
    const f = await render(
      'root = Form("contact", Buttons([Button("Submit")]), [FormControl("Email", Input("email", "Email", "email", {required: true, email: true}), "Use a work email")])',
    );
    const events: ActionEvent[] = [];
    f.componentInstance.action.subscribe((event) => events.push(event));
    const input = f.nativeElement.querySelector("input") as HTMLInputElement;
    const label = f.nativeElement.querySelector("label") as HTMLLabelElement;
    expect(label.htmlFor).toBe(input.id);
    expect(input.getAttribute("aria-describedby")).toBe(
      f.nativeElement.querySelector(".openui-hint").id,
    );
    f.nativeElement.querySelector("button").click();
    f.detectChanges();
    expect(events).toHaveLength(0);
    expect(f.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    input.value = "ada@example.com";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    f.detectChanges();
    expect(f.nativeElement.querySelector('[role="alert"]')).toBeNull();
    f.nativeElement.querySelector("button").click();
    await f.whenStable();
    expect(events).toHaveLength(1);
    expect(f.componentInstance.context.getFieldValue("contact", "email")).toBe("ada@example.com");
  });

  it("isolates forms with the same field name and gives labels distinct IDs", async () => {
    const f = await render(
      'root = Stack([Form("one", Buttons([Button("One")]), [FormControl("Name", Input("name"))]), Form("two", Buttons([Button("Two")]), [FormControl("Name", Input("name"))])])',
    );
    const inputs = f.nativeElement.querySelectorAll("input") as NodeListOf<HTMLInputElement>;
    expect(inputs[0]!.id).not.toBe(inputs[1]!.id);
    inputs[0]!.value = "First";
    inputs[0]!.dispatchEvent(new Event("input", { bubbles: true }));
    f.detectChanges();
    expect(inputs[1]!.value).toBe("");
    expect(f.componentInstance.context.getFieldValue("one", "name")).toBe("First");
    expect(f.componentInstance.context.getFieldValue("two", "name")).toBeUndefined();
  });

  it("keeps reactive textarea identity and focus, including a streaming-to-ready transition", async () => {
    const f = await render('root = TextArea("notes", "Notes", 5, {minLength: 3}, $notes)', true, {
      $notes: "",
    });
    const textarea = f.nativeElement.querySelector("textarea") as HTMLTextAreaElement;
    expect(textarea.rows).toBe(5);
    expect(textarea.disabled).toBe(true);
    f.componentRef.setInput("isStreaming", false);
    f.detectChanges();
    await f.whenStable();
    textarea.focus();
    textarea.value = "Hello";
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector("textarea")).toBe(textarea);
    expect(document.activeElement).toBe(textarea);
    expect(textarea.value).toBe("Hello");
  });

  it("merges checkbox defaults with stored state rather than losing sibling selections", async () => {
    const f = await render(
      'root = CheckBoxGroup("features", [CheckBoxItem("A", "First", "a", true), CheckBoxItem("B", "Second", "b", false)], null, $features)',
      false,
      { $features: { a: false } },
    );
    const controls = f.nativeElement.querySelectorAll(
      '[role="checkbox"]',
    ) as NodeListOf<HTMLButtonElement>;
    expect(controls[0]!.getAttribute("aria-checked")).toBe("false");
    controls[1]!.click();
    f.detectChanges();
    expect(controls[1]!.getAttribute("aria-checked")).toBe("true");
    expect(controls[0]!.getAttribute("aria-checked")).toBe("false");
    f.componentRef.setInput("isStreaming", true);
    f.detectChanges();
    expect(controls[1]!.disabled).toBe(true);
    controls[1]!.click();
    f.detectChanges();
    expect(controls[1]!.getAttribute("aria-checked")).toBe("true");
  });

  it("supports radio arrow-key selection with a single tab stop", async () => {
    const f = await render(
      'root = RadioGroup("plan", [RadioItem("Basic", "Basic plan", "basic"), RadioItem("Pro", "Pro plan", "pro")], "basic")',
    );
    const controls = f.nativeElement.querySelectorAll(
      '[role="radio"]',
    ) as NodeListOf<HTMLButtonElement>;
    expect(controls[0]!.getAttribute("aria-checked")).toBe("true");
    controls[0]!.focus();
    controls[0]!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    f.detectChanges();
    expect(controls[1]!.getAttribute("aria-checked")).toBe("true");
    expect(controls[0]!.tabIndex).toBe(-1);
    expect(controls[1]!.tabIndex).toBe(0);
    expect(document.activeElement).toBe(controls[1]);
  });

  it("renders switch variants and default values, with no writes while streaming", async () => {
    const f = await render(
      'root = SwitchGroup("notifications", [SwitchItem("Email", "Updates", "email", true)], "sunk")',
      true,
    );
    const control = f.nativeElement.querySelector('[role="switch"]') as HTMLButtonElement;
    expect(control.disabled).toBe(true);
    expect(control.getAttribute("aria-checked")).toBe("true");
    expect(f.nativeElement.querySelector(".openui-switch-group-sunk")).not.toBeNull();
    f.componentRef.setInput("isStreaming", false);
    f.detectChanges();
    control.click();
    f.detectChanges();
    expect(control.getAttribute("aria-checked")).toBe("false");
  });

  it("unregisters removed required fields instead of blocking a later submission", async () => {
    const f = await render(
      'root = Form("example", Buttons([Button("Submit")]), [FormControl("Required", Input("required", "", "text", {required: true}))])',
    );
    const events: ActionEvent[] = [];
    f.componentInstance.action.subscribe((event) => events.push(event));
    f.componentRef.setInput("response", 'root = Form("example", Buttons([Button("Submit")]), [])');
    f.detectChanges();
    await f.whenStable();
    f.nativeElement.querySelector("button").click();
    await f.whenStable();
    expect(events).toHaveLength(1);
  });

  it("preserves positional Select arguments and selection state", async () => {
    const f = await render(
      'root = Select("country", [SelectItem("tr", "Turkey"), SelectItem("uk", "United Kingdom")], "Country", {required: true}, $country, "small")',
      false,
      { $country: "tr" },
    );
    const trigger = f.nativeElement.querySelector('[role="combobox"]') as HTMLButtonElement;
    expect(trigger.textContent).toContain("Turkey");
    expect(trigger.className).toContain("openui-select-trigger-sm");
    expect(
      f.nativeElement.querySelector('[role="option"][aria-selected="true"]').textContent,
    ).toContain("Turkey");
  });
});

describe("Navigation and tables", () => {
  it("auto-opens the newest accordion section but stops following after user interaction", async () => {
    const source =
      'root = Accordion([AccordionItem("a", "First", [Text("text", "One")]), AccordionItem("b", "Second", [Text("text", "Two")])])';
    const f = await render(source, true);
    const buttons = f.nativeElement.querySelectorAll(
      ".openui-accordion-trigger",
    ) as NodeListOf<HTMLButtonElement>;
    expect(buttons[1]!.getAttribute("aria-expanded")).toBe("true");
    buttons[0]!.click();
    f.detectChanges();
    f.componentRef.setInput(
      "response",
      source.replace("])])", ']), AccordionItem("c", "Third", [Text("text", "Three")])])'),
    );
    f.detectChanges();
    await f.whenStable();
    expect(
      f.nativeElement.querySelector(".openui-accordion-trigger").getAttribute("aria-expanded"),
    ).toBe("true");
  });

  it("follows tab content growth until the user picks a tab and supports keyboard navigation", async () => {
    const source =
      'root = Tabs([TabItem("a", "First", [Text("text", "One")]), TabItem("b", "Second", [Text("text", "Two")])])';
    const f = await render(source, true);
    const tabs = f.nativeElement.querySelectorAll('[role="tab"]') as NodeListOf<HTMLButtonElement>;
    expect(tabs[1]!.getAttribute("aria-selected")).toBe("true");
    tabs[0]!.click();
    f.detectChanges();
    f.componentRef.setInput("response", source.replace('"Two"', '"Two longer"'));
    f.detectChanges();
    await f.whenStable();
    expect(tabs[0]!.getAttribute("aria-selected")).toBe("true");
    tabs[0]!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    f.detectChanges();
    expect(tabs[1]!.getAttribute("aria-selected")).toBe("true");
    expect(f.nativeElement.querySelector('[role="tabpanel"]:not([hidden])').textContent).toContain(
      "Two longer",
    );
  });

  it("paginates ragged columns, renders nested cells, and clamps the page on data shrink", async () => {
    const values = JSON.stringify(Array.from({ length: 22 }, (_, i) => i));
    const f = await render(
      `root = Table([Col("Index", ${values}), Col("Status", [TagBlock(["Ready"])])])`,
    );
    expect(f.nativeElement.querySelectorAll("tbody tr")).toHaveLength(10);
    expect(f.nativeElement.querySelector("tbody .openui-tag")).not.toBeNull();
    const next = f.nativeElement.querySelector('[aria-label="Next page"]') as HTMLButtonElement;
    next.click();
    f.detectChanges();
    next.click();
    f.detectChanges();
    expect(f.nativeElement.querySelectorAll("tbody tr")).toHaveLength(2);
    expect(next.disabled).toBe(true);
    f.componentRef.setInput("response", 'root = Table([Col("Index", [99])])');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelectorAll("tbody tr")).toHaveLength(1);
    expect(f.nativeElement.querySelector("tbody td").textContent).toBe("99");
    expect(f.nativeElement.querySelector('[aria-label="Next page"]')).toBeNull();
  });

  it("renders content wrappers and separator accessibility without injecting markup", async () => {
    const f = await render(
      'root = Card([CardHeader("Title", "Subtitle"), Separator("vertical", false), TagBlock(["<script>bad</script>", "Angular"], "sm")])',
    );
    expect(f.nativeElement.querySelector(".openui-header-bottom").textContent).toBe("Subtitle");
    expect(
      f.nativeElement.querySelector('[role="separator"]').getAttribute("aria-orientation"),
    ).toBe("vertical");
    expect(f.nativeElement.querySelector(".openui-tag-sm")).not.toBeNull();
    expect(f.nativeElement.querySelector("script")).toBeNull();
  });
});
