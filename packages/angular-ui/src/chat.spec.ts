import { TestBed } from "@angular/core/testing";
import { Renderer, type ActionEvent } from "@openuidev/angular-lang";
import { afterEach, beforeEach, expect, it } from "vitest";
import { openuiLibrary } from "./genui-lib";
import { openuiChatLibrary } from "./genui-lib/chat";
import { openuiChatPromptOptions } from "./genui-lib/chat-prompt-options";
async function render(source: string, streaming = false) {
  const f = TestBed.createComponent(Renderer);
  const errors: unknown[] = [];
  f.componentInstance.error.subscribe((e) => errors.push(...e));
  f.componentRef.setInput("library", openuiChatLibrary);
  f.componentRef.setInput("response", source);
  f.componentRef.setInput("isStreaming", streaming);
  f.detectChanges();
  await f.whenStable();
  expect(errors).toEqual([]);
  return f;
}
beforeEach(async () => {
  await TestBed.configureTestingModule({ imports: [Renderer] }).compileComponents();
});
afterEach(() => TestBed.resetTestingModule());
it("exports a distinct locked Card schema and does not leak chat symbols into the base catalog", () => {
  expect(openuiChatLibrary.components["Card"]).not.toBe(openuiLibrary.components["Card"]);
  expect(openuiChatLibrary.components["Stack"]).toBeUndefined();
  expect(openuiLibrary.components["FollowUpBlock"]).toBeUndefined();
  expect(openuiChatLibrary.prompt(openuiChatPromptOptions)).toContain("FollowUpBlock");
});
it("renders sources and scoped citations while leaving code and missing source numbers literal", async () => {
  const f = await render(
    'root = Card([TextContent("Supported [1]. Missing [9]. Code `x[1]`." )],[{title:"Reference",sourceName:"Example",url:"https://example.com/ref"}])',
  );
  const links = f.nativeElement.querySelectorAll(
    "a.openui-citation",
  ) as NodeListOf<HTMLAnchorElement>;
  expect(links).toHaveLength(1);
  expect(links[0]?.getAttribute("href")).toBe("https://example.com/ref");
  expect(f.nativeElement.textContent).toContain("Missing [9]");
  expect(f.nativeElement.querySelector("code")?.textContent).toBe("x[1]");
  expect(f.nativeElement.querySelector(".openui-listed-sources")).not.toBeNull();
  expect(
    f.nativeElement.querySelector(".openui-markdown-renderer.openui-text-content-markdown"),
  ).not.toBeNull();
  expect(links[0]?.parentElement?.classList.contains("openui-citation-container")).toBe(true);
  expect(links[0]?.querySelector("svg")?.getAttribute("width")).toBe("12");
  expect(links[0]?.getAttribute("aria-label")).toContain("Reference");
  expect(
    f.nativeElement.querySelector(".openui-carousel-item.openui-listed-sources-item-container"),
  ).not.toBeNull();
  expect(
    f.nativeElement.querySelector(".openui-listed-source-item__source-name")?.textContent,
  ).toBe("Example");
  expect(f.nativeElement.querySelector(".openui-listed-source-item__title")?.textContent).toBe(
    "Reference",
  );
});
it("keeps unsafe source URLs inert", async () => {
  const f = await render(
    'root = Card([TextContent("Source [1]")],[{title:"Unsafe",sourceName:"Test",url:"javascript:alert(1)"}])',
  );
  expect(f.nativeElement.querySelector('a[href^="javascript:"]')).toBeNull();
  expect(f.nativeElement.querySelector("span.openui-citation")).not.toBeNull();
});
it("emits follow-up actions and suppresses them during streaming", async () => {
  const f = await render('root = Card([FollowUpBlock([FollowUpItem("Explain the trend")])])');
  const actions: ActionEvent[] = [];
  f.componentInstance.action.subscribe((e) => actions.push(e));
  const button = f.nativeElement.querySelector(".openui-follow-up-item") as HTMLButtonElement;
  button.click();
  expect(actions).toHaveLength(1);
  f.componentRef.setInput("isStreaming", true);
  f.detectChanges();
  button.click();
  expect(actions).toHaveLength(1);
});
it("renders rich content in chat tabs and section items", async () => {
  const f = await render(
    'root = Card([Tabs([TabItem("a","First",[FollowUpBlock([FollowUpItem("More")])])]),SectionBlock([SectionItem("one","Details",[TextContent("Section body")])])])',
  );
  expect(f.nativeElement.textContent).toContain("More");
  expect(f.nativeElement.textContent).toContain("Section body");
  const trigger = f.nativeElement.querySelector(
    ".openui-foldable-section-trigger",
  ) as HTMLButtonElement;
  trigger.click();
  f.detectChanges();
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  expect(f.nativeElement.textContent).not.toContain("Section body");
  expect(
    f.nativeElement
      .querySelector('.openui-foldable-section-content[data-state="closed"]')
      ?.hasAttribute("hidden"),
  ).toBe(true);
  expect(f.nativeElement.querySelector(".openui-tabs-content-inner")).not.toBeNull();
});
