import {
  AfterViewChecked,
  Component,
  Directive,
  ElementRef,
  OnDestroy,
  ViewChild,
  signal,
} from "@angular/core";
import { arc, area, curveLinear, curveNatural, curveStep, line, pie } from "d3-shape";
import { OpenUiComponent } from "./base";

export interface ChartProps {
  labels?: unknown[];
  series?: unknown[];
  values?: number[];
  datasets?: unknown[];
  variant?: string;
  appearance?: string;
  height?: number;
  xLabel?: string;
  yLabel?: string;
}
export type ChartKind =
  "bar" | "line" | "area" | "horizontal" | "pie" | "radial" | "radar" | "scatter" | "stack";
interface Mark {
  d: string;
  label: string;
  series: number;
  fill: boolean;
  opacity?: number;
}
interface Tick {
  x: number;
  y: number;
  text: string;
  anchor: string;
}
export interface ChartModel {
  marks: Mark[];
  grid: string[];
  ticks: Tick[];
  legend: string[];
  rows: string[][];
  height: number;
  width: number;
}
const unwrap = (node: unknown): Record<string, unknown> => {
  if (!node || typeof node !== "object") return {};
  const p = node as Record<string, unknown>;
  return p["type"] === "element" ? unwrap(p["props"]) : p;
};
const array = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const finite = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;
const text = (value: unknown): string => (typeof value === "string" ? value : "");
const rectangle = (x: number, y: number, w: number, h: number) => `M${x},${y}h${w}v${h}h${-w}Z`;
export function chartDomain(values: number[]): [number, number] {
  let lo = 0,
    hi = 0;
  for (const v of values) {
    lo = Math.min(lo, v);
    hi = Math.max(hi, v);
  }
  if (lo === hi) return [0, 1];
  const raw = (hi - lo) / 4;
  const power = 10 ** Math.floor(Math.log10(raw));
  const step = ([1, 2, 5, 10].find((n) => n * power >= raw) ?? 10) * power;
  return [Math.floor(lo / step) * step, Math.ceil(hi / step) * step];
}
/** Geometry is framework-independent and testable; no React/Recharts runtime. */
export function buildChart(
  kind: ChartKind,
  props: ChartProps,
  width = 640,
  hidden: ReadonlySet<number> = new Set(),
): ChartModel {
  const height = kind === "stack" ? 64 : Math.max(120, Math.min(2000, finite(props.height) || 296));
  width = Math.max(160, width);
  const model: ChartModel = { marks: [], grid: [], ticks: [], legend: [], rows: [], height, width };
  const labels = array(props.labels).map((v) =>
    typeof v === "string" ? v : text(unwrap(v)["category"]),
  );
  const series = array(props.series).map((v) => {
    const p = unwrap(v);
    return { name: text(p["category"]), values: array(p["values"]).map(finite) };
  });
  const add = (d: string | null, label: string, index: number, fill = true, opacity = 1) => {
    if (d && !/NaN|Infinity/.test(d) && !hidden.has(index))
      model.marks.push({ d, label, series: index, fill, opacity });
  };
  const left = kind === "horizontal" ? Math.min(130, width * 0.3) : 52,
    right = width - 18,
    top = 12,
    bottom = height - 42,
    span = right - left;
  if (["pie", "radial", "stack"].includes(kind)) {
    const values = labels.map((_, i) =>
      Math.max(0, finite(props.values?.[i] ?? unwrap(props.labels?.[i])["value"])),
    );
    model.legend = labels;
    model.rows = labels.map((label, i) => [label, String(values[i] ?? 0)]);
    const visible = values.map((v, i) => (hidden.has(i) ? 0 : v));
    const total = visible.reduce((a, b) => a + b, 0);
    if (!total) return model;
    if (kind === "stack") {
      let start = 0;
      visible.forEach((v, i) => {
        const w = (v / total) * (width - 4);
        add(rectangle(2 + start, 16, w, 24), `${labels[i]}: ${v}`, i);
        start += w;
      });
      return model;
    }
    const radius = Math.min(width / 2 - 20, height / 2 - 20);
    const makeArc = (inner: number, outer: number, start: number, end: number) =>
      arc()({
        innerRadius: inner,
        outerRadius: outer,
        startAngle: start,
        endAngle: end,
        padAngle: 0,
      }) ?? "";
    if (kind === "pie") {
      const semi = props.appearance === "semiCircular";
      const parts = pie<number>()
        .sort(null)
        .value((v) => v)
        .startAngle(semi ? -Math.PI / 2 : 0)
        .endAngle(semi ? Math.PI / 2 : Math.PI * 2)(visible);
      parts.forEach((p, i) =>
        add(
          makeArc(props.variant === "donut" ? radius * 0.6 : 0, radius, p.startAngle, p.endAngle),
          `${labels[i]}: ${values[i]}`,
          i,
        ),
      );
    } else {
      const max = Math.max(...visible);
      const band = radius / (values.length + 1);
      visible.forEach((v, i) =>
        add(
          makeArc((i + 1) * band, (i + 1) * band + band * 0.7, 0, (v / max) * Math.PI * 2),
          `${labels[i]}: ${v}`,
          i,
        ),
      );
    }
    // Arc paths use local coordinates; SVG path geometry is translated as one group by the view.
    return model;
  }
  if (kind === "scatter") {
    const datasets = array(props.datasets).map((v) => {
      const p = unwrap(v);
      return { name: text(p["name"]), points: array(p["points"]).map(unwrap) };
    });
    model.legend = datasets.map((d) => d.name);
    const points = datasets.flatMap((ds, i) => (hidden.has(i) ? [] : ds.points));
    const xd = chartDomain(points.map((p) => finite(p["x"]))),
      yd = chartDomain(points.map((p) => finite(p["y"])));
    const x = (v: number) => left + ((v - xd[0]) / (xd[1] - xd[0])) * span,
      y = (v: number) => bottom - ((v - yd[0]) / (yd[1] - yd[0])) * (bottom - top);
    for (let i = 0; i <= 4; i++) {
      const v = yd[0] + (i * (yd[1] - yd[0])) / 4;
      model.grid.push(`M${left},${y(v)}H${right}`);
      model.ticks.push(
        { x: left - 8, y: y(v) + 4, text: String(v), anchor: "end" },
        {
          x: x(xd[0] + (i * (xd[1] - xd[0])) / 4),
          y: bottom + 20,
          text: String(xd[0] + (i * (xd[1] - xd[0])) / 4),
          anchor: "middle",
        },
      );
    }
    datasets.forEach((ds, i) =>
      ds.points.forEach((p) => {
        const xv = finite(p["x"]),
          yv = finite(p["y"]),
          r =
            p["z"] === undefined
              ? 4
              : Math.max(2, Math.min(20, Math.sqrt(Math.max(0, finite(p["z"])))));
        model.rows.push([ds.name, String(xv), String(yv), String(p["z"] ?? "")]);
        add(
          `M${x(xv) - r},${y(yv)}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0`,
          `${ds.name}: ${xv}, ${yv}`,
          i,
        );
      }),
    );
    return model;
  }
  model.legend = series.map((s) => s.name);
  model.rows = labels.map((label, i) => [label, ...series.map((s) => String(s.values[i] ?? 0))]);
  if (!labels.length || !series.length) return model;
  const active = series.map((s, i) => ({ ...s, index: i })).filter((s) => !hidden.has(s.index));
  if (kind === "radar") {
    const radius = Math.min(width / 2 - 50, height / 2 - 40),
      max = Math.max(1, ...active.flatMap((s) => s.values.map(Math.abs)));
    const point = (i: number, r: number): [number, number] => [
      width / 2 + Math.sin((i / labels.length) * Math.PI * 2) * r,
      height / 2 - Math.cos((i / labels.length) * Math.PI * 2) * r,
    ];
    const polygon = (points: [number, number][]) =>
      points.length ? "M" + points.map((p) => p.join(",")).join("L") + "Z" : "";
    for (let level = 1; level <= 4; level++)
      model.grid.push(polygon(labels.map((_, i) => point(i, (radius * level) / 4))));
    labels.forEach((label, i) => {
      const [x, y] = point(i, radius + 18);
      model.ticks.push({ x, y, text: label, anchor: "middle" });
    });
    active.forEach((s) =>
      add(
        polygon(labels.map((_, i) => point(i, (Math.max(0, s.values[i] ?? 0) / max) * radius))),
        s.name,
        s.index,
        true,
        0.3,
      ),
    );
    return model;
  }
  const stacked = props.variant === "stacked";
  const totals = labels.flatMap((_, i) => [
    active.reduce((v, s) => v + Math.max(0, s.values[i] ?? 0), 0),
    active.reduce((v, s) => v + Math.min(0, s.values[i] ?? 0), 0),
  ]);
  const domain = chartDomain(stacked ? totals : active.flatMap((s) => s.values));
  const scale = (v: number) => (v - domain[0]) / (domain[1] - domain[0]);
  const y = (v: number) => bottom - scale(v) * (bottom - top);
  for (let i = 0; i <= 4; i++) {
    const v = domain[0] + (i * (domain[1] - domain[0])) / 4;
    if (kind === "horizontal") {
      const x = left + scale(v) * span;
      model.grid.push(`M${x},${top}V${bottom}`);
      model.ticks.push({ x, y: bottom + 20, text: String(v), anchor: "middle" });
    } else {
      model.grid.push(`M${left},${y(v)}H${right}`);
      model.ticks.push({ x: left - 8, y: y(v) + 4, text: String(v), anchor: "end" });
    }
  }
  const x = (i: number) => left + (span * (i + 0.5)) / labels.length;
  labels.forEach((label, i) =>
    model.ticks.push(
      kind === "horizontal"
        ? {
            x: left - 8,
            y: top + ((bottom - top) * (i + 0.5)) / labels.length + 4,
            text: label,
            anchor: "end",
          }
        : { x: x(i), y: bottom + 20, text: label, anchor: "middle" },
    ),
  );
  if (kind === "line" || kind === "area") {
    const curve =
      props.variant === "natural"
        ? curveNatural
        : props.variant === "step"
          ? curveStep
          : curveLinear;
    active.forEach((s) => {
      const points = labels.map((_, i) => [x(i), y(s.values[i] ?? 0)] as [number, number]);
      const d =
        kind === "area"
          ? area<[number, number]>()
              .x((p) => p[0])
              .y0(y(0))
              .y1((p) => p[1])
              .curve(curve)(points)
          : line<[number, number]>().curve(curve)(points);
      add(d, s.name, s.index, kind === "area", kind === "area" ? 0.3 : 1);
      points.forEach((p, i) =>
        add(
          `M${p[0] - 3},${p[1]}a3,3 0 1,0 6,0a3,3 0 1,0 -6,0`,
          `${labels[i]} — ${s.name}: ${s.values[i] ?? 0}`,
          s.index,
        ),
      );
    });
    return model;
  }
  labels.forEach((label, i) => {
    let positive = 0,
      negative = 0;
    active.forEach((s, j) => {
      const v = s.values[i] ?? 0;
      const start = stacked ? (v >= 0 ? positive : negative) : 0;
      if (v >= 0) positive += v;
      else negative += v;
      if (kind === "horizontal") {
        const band = (bottom - top) / labels.length;
        const thickness = Math.min(12, (band * 0.6) / (stacked ? 1 : Math.max(1, active.length)));
        const yy =
          top +
          band * (i + 0.5) +
          (stacked ? 0 : (j - (active.length - 1) / 2) * (thickness + 4)) -
          thickness / 2;
        const a = left + scale(start) * span,
          b = left + scale(start + v) * span;
        add(
          rectangle(Math.min(a, b), yy, Math.abs(b - a), thickness),
          `${label} — ${s.name}: ${v}`,
          s.index,
        );
      } else {
        const thickness = Math.min(
          12,
          ((span / labels.length) * 0.6) / (stacked ? 1 : Math.max(1, active.length)),
        );
        const xx =
          x(i) + (stacked ? 0 : (j - (active.length - 1) / 2) * (thickness + 10)) - thickness / 2;
        add(
          rectangle(
            xx,
            Math.min(y(start), y(start + v)),
            thickness,
            Math.abs(y(start) - y(start + v)),
          ),
          `${label} — ${s.name}: ${v}`,
          s.index,
        );
      }
    });
  });
  return model;
}
const template = `<div class="openui-angular-chart" #container>
<svg [attr.viewBox]="'0 0 '+model.width+' '+model.height" [style.height.px]="model.height" role="group" [attr.aria-label]="kind+' chart'">
@for(d of model.grid;track $index){<path [attr.d]="d" fill="none" stroke="var(--openui-border-default, #ddd)" stroke-dasharray="3 3" />}
@for(t of model.ticks;track $index){<text [attr.x]="t.x" [attr.y]="t.y" [attr.text-anchor]="t.anchor" fill="currentColor" font-size="12">{{t.text}}</text>}
<g [attr.transform]="polarTransform">
@for(mark of model.marks;track $index){<path [attr.d]="mark.d" [attr.fill]="mark.fill?color(mark.series):'none'" [attr.stroke]="color(mark.series)" [attr.fill-opacity]="mark.opacity" stroke-width="2" tabindex="0" role="img" [attr.aria-label]="mark.label" (focus)="tooltip.set(mark.label)" (blur)="tooltip.set('')" (mouseenter)="tooltip.set(mark.label)" (mouseleave)="tooltip.set('')"><title>{{mark.label}}</title></path>}
</g></svg>
@if(props && (props.xLabel||props.yLabel)){<div class="openui-angular-chart-axis-labels"><span>{{props.yLabel}}</span><span>{{props.xLabel}}</span></div>}
<div class="openui-angular-chart-legend">@for(label of model.legend;track $index;let i=$index){<button type="button" [attr.aria-pressed]="!hidden().has(i)" (click)="toggle(i)"><span [style.background]="color(i)"></span>{{label}}</button>}</div>
<div class="openui-angular-chart-tooltip" role="status">{{tooltip()}}</div>
<details><summary>Chart data</summary><table><tbody>@for(row of model.rows;track $index){<tr>@for(cell of row;track $index){<td>{{cell}}</td>}</tr>}</tbody></table></details>
</div>`;
const styles = [
  `:host{display:contents}.openui-angular-chart{width:100%;min-width:0;color:var(--openui-text-neutral-secondary)}svg{display:block;width:100%;overflow:visible}.openui-angular-chart-legend{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}.openui-angular-chart-legend button{border:0;background:none;color:inherit;display:flex;gap:6px;align-items:center;cursor:pointer;font:inherit}.openui-angular-chart-legend button[aria-pressed=false]{opacity:.4}.openui-angular-chart-legend span{width:10px;height:10px;border-radius:2px}.openui-angular-chart-tooltip{min-height:20px;text-align:center;font-size:12px}.openui-angular-chart-axis-labels{display:flex;justify-content:space-between;font-size:12px}details{font-size:12px}td{padding:4px 8px}path:focus-visible{outline:2px solid currentColor}`,
];
@Directive()
export abstract class OpenUiChart
  extends OpenUiComponent<ChartProps>
  implements AfterViewChecked, OnDestroy
{
  abstract kind: ChartKind;
  get polarTransform() {
    return this.kind === "pie" || this.kind === "radial"
      ? `translate(${this.model.width / 2},${this.model.height / 2})`
      : null;
  }
  @ViewChild("container") private container?: ElementRef<HTMLElement>;
  private observed?: HTMLElement;
  private observer?: ResizeObserver;
  readonly width = signal(640);
  readonly hidden = signal<ReadonlySet<number>>(new Set());
  readonly tooltip = signal("");
  private cached?: ChartModel;
  private lastProps: ChartProps | null | undefined;
  private lastWidth = 0;
  private lastHidden?: ReadonlySet<number>;
  get model() {
    if (
      !this.cached ||
      this.lastProps !== this.props ||
      this.lastWidth !== this.width() ||
      this.lastHidden !== this.hidden()
    ) {
      this.lastProps = this.props;
      this.lastWidth = this.width();
      this.lastHidden = this.hidden();
      this.cached = buildChart(this.kind, this.props ?? {}, this.lastWidth, this.lastHidden);
    }
    return this.cached;
  }
  color(i: number) {
    const palette = [
      "#0D47A1",
      "#1565C0",
      "#1976D2",
      "#1E88E5",
      "#2196F3",
      "#42A5F5",
      "#64B5F6",
      "#90CAF9",
      "#BBDEFB",
      "#E3F2FD",
      "#EFF8FF",
    ];
    const n = this.model.legend.length;
    const index =
      n === 1
        ? 5
        : n === 2
          ? i === 0
            ? 4
            : 6
          : (((5 + i - Math.floor((n - 1) / 2)) % 11) + 11) % 11;
    return palette[index];
  }
  toggle(index: number) {
    const set = new Set(this.hidden());
    if (set.has(index)) set.delete(index);
    else set.add(index);
    this.hidden.set(set);
    this.tooltip.set("");
  }
  ngAfterViewChecked() {
    const el = this.container?.nativeElement;
    if (el === this.observed) return;
    this.observer?.disconnect();
    this.observed = el;
    if (el && typeof ResizeObserver !== "undefined") {
      this.observer = new ResizeObserver(() => {
        if (el.clientWidth) this.width.set(el.clientWidth);
      });
      this.observer.observe(el);
    }
  }
  ngOnDestroy() {
    this.observer?.disconnect();
  }
}
@Component({ selector: "openui-bar-chart", standalone: true, template, styles })
export class OpenUiBarChartComponent extends OpenUiChart {
  kind = "bar" as const;
}
@Component({ selector: "openui-line-chart", standalone: true, template, styles })
export class OpenUiLineChartComponent extends OpenUiChart {
  kind = "line" as const;
}
@Component({ selector: "openui-area-chart", standalone: true, template, styles })
export class OpenUiAreaChartComponent extends OpenUiChart {
  kind = "area" as const;
}
@Component({ selector: "openui-horizontal-chart", standalone: true, template, styles })
export class OpenUiHorizontalChartComponent extends OpenUiChart {
  kind = "horizontal" as const;
}
@Component({ selector: "openui-pie-chart", standalone: true, template, styles })
export class OpenUiPieChartComponent extends OpenUiChart {
  kind = "pie" as const;
}
@Component({ selector: "openui-radial-chart", standalone: true, template, styles })
export class OpenUiRadialChartComponent extends OpenUiChart {
  kind = "radial" as const;
}
@Component({ selector: "openui-radar-chart", standalone: true, template, styles })
export class OpenUiRadarChartComponent extends OpenUiChart {
  kind = "radar" as const;
}
@Component({ selector: "openui-scatter-chart", standalone: true, template, styles })
export class OpenUiScatterChartComponent extends OpenUiChart {
  kind = "scatter" as const;
}
@Component({ selector: "openui-stacked-chart", standalone: true, template, styles })
export class OpenUiStackedChartComponent extends OpenUiChart {
  kind = "stack" as const;
}
