import { TestBed } from "@angular/core/testing";
import { Renderer } from "@openuidev/angular-lang";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildChart, chartDomain, type ChartKind } from "./components/charts";
import { openuiLibrary } from "./genui-lib";
const props = {
  labels: ["A", "B"],
  series: [
    { category: "Revenue", values: [-5, 12] },
    { category: "Cost", values: [3, -2] },
  ],
  values: [3, 7],
  datasets: [
    {
      name: "Points",
      points: [
        { x: -2, y: 4, z: 9 },
        { x: 5, y: -3 },
      ],
    },
  ],
};
describe("Native chart geometry", () => {
  it.each([
    "bar",
    "line",
    "area",
    "horizontal",
    "pie",
    "radial",
    "radar",
    "scatter",
    "stack",
  ] as ChartKind[])("%s produces finite geometry and a data view", (kind) => {
    const model = buildChart(kind, props, 390);
    expect(model.marks.length).toBeGreaterThan(0);
    expect(JSON.stringify(model)).not.toMatch(/NaN|Infinity/);
    expect(model.rows.length).toBeGreaterThan(0);
  });
  it("includes both signs in a stacked domain and does not mutate input", () => {
    const before = JSON.stringify(props);
    const model = buildChart("bar", { ...props, variant: "stacked" });
    expect(model.marks).toHaveLength(4);
    expect(chartDomain([-5, 12])).toEqual([-5, 15]);
    expect(JSON.stringify(props)).toBe(before);
  });
  it("keeps zero totals finite and removes hidden series without renumbering colors", () => {
    expect(buildChart("pie", { labels: ["A"], values: [0] }).marks).toEqual([]);
    const model = buildChart("bar", props, 390, new Set([0]));
    expect(model.marks.every((m) => m.series === 1)).toBe(true);
  });
  it("uses distinct natural and stepped interpolation", () => {
    const p = { labels: ["A", "B", "C"], series: [{ category: "One", values: [1, 8, 2] }] };
    expect(buildChart("line", { ...p, variant: "natural" }).marks[0]?.d).not.toBe(
      buildChart("line", { ...p, variant: "step" }).marks[0]?.d,
    );
  });
});
beforeEach(async () => {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({ imports: [Renderer] }).compileComponents();
});
afterEach(() => TestBed.resetTestingModule());
it.each([
  "BarChart",
  "LineChart",
  "AreaChart",
  "HorizontalBarChart",
  "RadarChart",
  "PieChart",
  "RadialChart",
  "SingleStackedBarChart",
  "ScatterChart",
])("renders %s through the public catalog", async (name) => {
  const args =
    name === "ScatterChart"
      ? '[{name:"A",points:[{x:1,y:2}]}]'
      : ["PieChart", "RadialChart", "SingleStackedBarChart"].includes(name)
        ? '["A","B"],[3,7]'
        : '["A","B"],[{category:"Revenue",values:[-5,12]}]';
  const fixture = TestBed.createComponent(Renderer);
  let errors: unknown[] = [];
  fixture.componentInstance.error.subscribe((e) => (errors = e));
  fixture.componentRef.setInput("library", openuiLibrary);
  fixture.componentRef.setInput("response", `root = ${name}(${args})`);
  fixture.detectChanges();
  await fixture.whenStable();
  expect(errors).toEqual([]);
  expect(fixture.nativeElement.querySelector('svg path[role="img"]')).not.toBeNull();
  const button = fixture.nativeElement.querySelector(
    ".openui-angular-chart-legend button",
  ) as HTMLButtonElement;
  button.click();
  fixture.detectChanges();
  expect(button.getAttribute("aria-pressed")).toBe("false");
});
