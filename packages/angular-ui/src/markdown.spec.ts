import { TestBed } from "@angular/core/testing";
import { Renderer } from "@openuidev/angular-lang";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OpenUiCodeViewComponent, safeContentUrl } from "./components/markdown";
import { openuiLibrary } from "./genui-lib";

beforeEach(async () => {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [Renderer, OpenUiCodeViewComponent],
  }).compileComponents();
});
afterEach(() => {
  TestBed.resetTestingModule();
  vi.restoreAllMocks();
});

async function render(source: string) {
  const fixture = TestBed.createComponent(Renderer);
  fixture.componentRef.setInput("library", openuiLibrary);
  fixture.componentRef.setInput("response", source);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}

describe("Markdown and code", () => {
  it("parses real multiline Markdown, nested emphasis and reference links", async () => {
    const text =
      "## Heading\n\nHello **bold** and *italic*.\n\n- First\n- Second\n\n[OpenUI][docs]\n\n[docs]: https://openui.com";
    const fixture = await render(`root = MarkDownRenderer(${JSON.stringify(text)})`);
    expect(fixture.nativeElement.querySelector("h2").textContent).toBe("Heading");
    expect(fixture.nativeElement.querySelectorAll("li")).toHaveLength(2);
    expect(fixture.nativeElement.querySelector("strong").textContent).toBe("bold");
    expect(fixture.nativeElement.querySelector("a").getAttribute("href")).toBe(
      "https://openui.com",
    );
  });

  it("supports GFM tables, tasks, strikethrough and soft line breaks in TextContent", async () => {
    const text = "~~Old~~\nNew\n\n- [x] Done\n\n| Name | Value |\n| --- | --- |\n| Alpha | 42 |";
    const fixture = await render(`root = TextContent(${JSON.stringify(text)})`);
    expect(fixture.nativeElement.querySelector("del").textContent).toBe("Old");
    expect(fixture.nativeElement.querySelector("br")).not.toBeNull();
    expect(fixture.nativeElement.querySelector('input[type="checkbox"]').checked).toBe(true);
    expect(fixture.nativeElement.querySelectorAll("td")).toHaveLength(2);
  });

  it("keeps raw markup as text and rejects unsafe content URL schemes", async () => {
    const fixture = await render(
      `root = MarkDownRenderer(${JSON.stringify("<script>unsafe</script>\n\n[link](javascript:unsafe)")})`,
    );
    expect(fixture.nativeElement.querySelector("script")).toBeNull();
    expect(fixture.nativeElement.textContent).toContain("<script>");
    expect(fixture.nativeElement.querySelector("a").getAttribute("href")).toBeNull();
    for (const url of [
      "javascript:unsafe",
      "java\nscript:unsafe",
      "data:text/html,markup",
      "vbscript:unsafe",
    ])
      expect(safeContentUrl(url)).toBeNull();
    for (const url of ["https://example.com", "/image.png", "#section", "mailto:team@example.com"])
      expect(safeContentUrl(url)).toBe(url);
  });

  it("preserves literal code and highlights known languages without creating markup", async () => {
    const code = 'const html = "<img src=x>";\n';
    const fixture = await render(`root = CodeBlock("javascript", ${JSON.stringify(code)})`);
    expect(fixture.nativeElement.querySelector("code").textContent).toBe(code);
    expect(fixture.nativeElement.querySelector("img")).toBeNull();
    expect(fixture.nativeElement.querySelector(".token.keyword")).not.toBeNull();
    expect(fixture.nativeElement.querySelector("[data-code-theme=dark]")).not.toBeNull();
  });

  it("falls back to escaped code for an unknown language", async () => {
    const code = "<tag>\n  value\n</tag>";
    const fixture = await render(`root = CodeBlock("unknown-language", ${JSON.stringify(code)})`);
    expect(fixture.nativeElement.querySelector("code").textContent).toBe(code);
    expect(fixture.nativeElement.querySelector("tag")).toBeNull();
  });

  it("reports clipboard failure instead of claiming a successful copy", async () => {
    const fixture = TestBed.createComponent(OpenUiCodeViewComponent);
    const writeText = vi.fn().mockRejectedValue(new Error("Denied"));
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    try {
      fixture.componentRef.setInput("code", "content");
      fixture.detectChanges();
      await fixture.componentInstance.copy();
      fixture.detectChanges();
      expect(fixture.componentInstance.copied()).toBe(false);
      expect(fixture.componentInstance.copyError()).toBe(true);
      expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain(
        "Copy unavailable",
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
