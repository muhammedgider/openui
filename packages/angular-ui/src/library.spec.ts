import { TestBed } from "@angular/core/testing";
import { Renderer, type ActionEvent } from "@openuidev/angular-lang";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openuiLibrary, openuiPromptOptions } from "./genui-lib";

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
  fixture.componentRef.setInput("isStreaming", streaming);
  fixture.componentRef.setInput("initialState", initialState);
  fixture.componentRef.setInput("response", response);
  fixture.detectChanges();
  await fixture.whenStable();
  expect(errors).toEqual([]);
  return fixture;
}

describe("Angular OpenUI component library", () => {
  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({ imports: [Renderer] }).compileComponents();
  });
  afterEach(() => TestBed.resetTestingModule());

  it("generates a prompt limited to the implemented catalog", () => {
    expect(Object.keys(openuiLibrary.components).sort()).toEqual(
      [
        "BarChart",
        "LineChart",
        "AreaChart",
        "HorizontalBarChart",
        "PieChart",
        "RadialChart",
        "RadarChart",
        "ScatterChart",
        "SingleStackedBarChart",
        "Series",
        "Slice",
        "Point",
        "ScatterSeries",
        "Slider",
        "DatePicker",
        "EditableTable",
        "Stack",
        "Card",
        "CardHeader",
        "Text",
        "BoldText",
        "Label",
        "Input",
        "TextArea",
        "Button",
        "Buttons",
        "Form",
        "FormControl",
        "Select",
        "SelectItem",
        "CheckBoxGroup",
        "CheckBoxItem",
        "RadioGroup",
        "RadioItem",
        "SwitchGroup",
        "SwitchItem",
        "Tabs",
        "TabItem",
        "Accordion",
        "AccordionItem",
        "Separator",
        "Table",
        "Col",
        "EntityList",
        "ListItem",
        "ListBlock",
        "SnippetCardBlock",
        "SnippetCardItem",
        "OverviewCardBlock",
        "OverviewCardItem",
        "ContextCardBlock",
        "ContextCardItem",
        "VisualCardBlock",
        "VisualCardItem",
        "CompositeCardBlock",
        "CompositeCardItem",
        "Image",
        "ImageBlock",
        "ImageGallery",
        "Carousel",
        "Modal",
        "Chips",
        "ChipItem",
        "OptionCards",
        "OptionCard",
        "Steps",
        "StepsItem",
        "TagBlock",
        "MarkDownRenderer",
        "CodeBlock",
        "TextContent",
        "InlineHeader",
        "TextCallout",
        "Callout",
        "Icon",
        "Tag",
        "IconButton",
        "IconText",
        "ImageText",
        "ImageTextLarge",
        "MetricIndicatorInline",
        "MetricIndicatorWithStrikethrough",
      ].sort(),
    );
    const prompt = openuiLibrary.prompt(openuiPromptOptions);
    expect(prompt).toContain("Input");
    expect(prompt).toContain("Card");
  });

  it("renders nested layouts, card variants and upstream typography classes", async () => {
    const fixture = await render(
      'root = Card([Stack([BoldText("number", "42", "+12%", "metric", "lg"), Text("text", "Active users")], "row", "s", "center", "between", true)], "sunk")',
    );
    expect(fixture.nativeElement.querySelector(".openui-card-sunk")).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector(".openui-text-block__secondary--positive").textContent,
    ).toBe("+12%");
    expect(fixture.nativeElement.textContent).toContain("Active users");
    const stack = fixture.nativeElement.querySelector(
      ".openui-card openui-render-node > openui-dynamic-host > div",
    ) as HTMLElement;
    expect(stack.style.justifyContent).toBe("flex-start");
  });

  it("renders text as text, never executable markup", async () => {
    const fixture = await render('root = Card([Text("text", "<img src=x onerror=alert(1)>")])');
    expect(fixture.nativeElement.querySelector("img")).toBeNull();
    expect(fixture.nativeElement.textContent).toContain("<img");
  });

  it("preserves input identity and focus while editing reactive values", async () => {
    const fixture = await render(
      'root = Card([Input("Name", "Your name", "text", null, $name), Text("text", $name)])',
      false,
      { $name: "" },
    );
    const input = fixture.nativeElement.querySelector("input") as HTMLInputElement;
    expect(input).not.toBeNull();
    input.focus();
    for (const value of ["A", "An", "Angular"]) {
      input.value = value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector("input")).toBe(input);
      expect(document.activeElement).toBe(input);
      expect(fixture.nativeElement.querySelector(".openui-text-block__primary").textContent).toBe(
        value,
      );
    }
  });

  it("hydrates legacy field state and emits updates", async () => {
    const fixture = await render('root = Card([Input("Name", "Your name")])', false, {
      Name: "Ada",
    });
    const updates: Record<string, unknown>[] = [];
    fixture.componentInstance.stateUpdate.subscribe((state) => updates.push(state));
    const input = fixture.nativeElement.querySelector("input") as HTMLInputElement;
    expect(input.value).toBe("Ada");
    input.value = "Grace";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.context.getFieldValue(undefined, "Name")).toBe("Grace");
    expect(updates.length).toBeGreaterThan(0);
  });

  it("disables interactions during streaming and enables them without replacing the input", async () => {
    const source =
      'root = Card([Input("Name"), Buttons([Button("Continue", null, "secondary", "destructive", "small")])])';
    const fixture = await render(source, true);
    const input = fixture.nativeElement.querySelector("input") as HTMLInputElement;
    const button = fixture.nativeElement.querySelector("button") as HTMLButtonElement;
    const actions: ActionEvent[] = [];
    fixture.componentInstance.action.subscribe((action) => actions.push(action));
    expect(input.disabled).toBe(true);
    expect(button.disabled).toBe(true);
    button.click();
    expect(actions).toHaveLength(0);
    fixture.componentRef.setInput("isStreaming", false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector("input")).toBe(input);
    expect(input.disabled).toBe(false);
    expect(button.disabled).toBe(false);
    expect(button.className).toContain("openui-button-base-destructive-secondary");
    button.click();
    await fixture.whenStable();
    expect(actions).toHaveLength(1);
  });

  it("marks invalid input on blur and clears the error while editing", async () => {
    const fixture = await render(
      'root = Card([Input("Email", "Email address", "email", {required: true, email: true})])',
    );
    const input = fixture.nativeElement.querySelector("input") as HTMLInputElement;
    input.dispatchEvent(new Event("blur"));
    fixture.detectChanges();
    expect(input.getAttribute("aria-invalid")).toBe("true");
    input.value = "ada@example.com";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    fixture.detectChanges();
    expect(input.getAttribute("aria-invalid")).toBeNull();
  });

  it("resolves forward references as streamed source arrives", async () => {
    const fixture = await render("root = Card([title])", true);
    fixture.componentRef.setInput(
      "response",
      'root = Card([title])\ntitle = BoldText("text", "Ready")',
    );
    fixture.componentRef.setInput("isStreaming", false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain("Ready");
  });
});
