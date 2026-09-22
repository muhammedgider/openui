// Schemas synchronized from the same-revision upstream catalog; rendering is Angular-only.
import { defineComponent } from "@openuidev/angular-lang";
import { z } from "zod/v4";
import {
  OpenUiAreaChartComponent,
  OpenUiBarChartComponent,
  OpenUiHorizontalChartComponent,
  OpenUiLineChartComponent,
  OpenUiPieChartComponent,
  OpenUiRadarChartComponent,
  OpenUiRadialChartComponent,
  OpenUiScatterChartComponent,
  OpenUiStackedChartComponent,
} from "../components/charts";
import { OpenUiDataRecordComponent } from "../components/content";
export const SeriesSchema = z.object({
  category: z.string(),
  values: z.array(z.number()),
});
export const Series = defineComponent({
  name: "Series",
  props: SeriesSchema,
  description: "Chart data record.",
  component: OpenUiDataRecordComponent,
});
export const SliceSchema = z.object({
  category: z.string(),
  value: z.number(),
});
export const Slice = defineComponent({
  name: "Slice",
  props: SliceSchema,
  description: "Chart data record.",
  component: OpenUiDataRecordComponent,
});
export const PointSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number().optional(),
});
export const Point = defineComponent({
  name: "Point",
  props: PointSchema,
  description: "Chart data record.",
  component: OpenUiDataRecordComponent,
});
export const ScatterSeriesSchema = z.object({
  name: z.string(),
  points: z.array(PointSchema),
});
export const ScatterSeries = defineComponent({
  name: "ScatterSeries",
  props: ScatterSeriesSchema,
  description: "Chart data record.",
  component: OpenUiDataRecordComponent,
});
export const BarChartCondensedSchema = z.object({
  labels: z.array(z.string()),
  series: z.array(SeriesSchema),
  variant: z.enum(["grouped", "stacked"]).optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
  height: z.number().optional(),
});
export const BarChartCondensed = defineComponent({
  name: "BarChart",
  props: BarChartCondensedSchema,
  description: "Native SVG chart. Visual parity with the React reference is not certified.",
  component: OpenUiBarChartComponent,
});
export const LineChartCondensedSchema = z.object({
  labels: z.array(z.string()),
  series: z.array(SeriesSchema),
  variant: z.enum(["linear", "natural", "step"]).optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
  height: z.number().optional(),
});
export const LineChartCondensed = defineComponent({
  name: "LineChart",
  props: LineChartCondensedSchema,
  description: "Native SVG chart. Visual parity with the React reference is not certified.",
  component: OpenUiLineChartComponent,
});
export const AreaChartCondensedSchema = z.object({
  labels: z.array(z.string()),
  series: z.array(SeriesSchema),
  variant: z.enum(["linear", "natural", "step"]).optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
  height: z.number().optional(),
});
export const AreaChartCondensed = defineComponent({
  name: "AreaChart",
  props: AreaChartCondensedSchema,
  description: "Native SVG chart. Visual parity with the React reference is not certified.",
  component: OpenUiAreaChartComponent,
});
export const HorizontalBarChartSchema = z.object({
  labels: z.array(z.string()),
  series: z.array(SeriesSchema),
  variant: z.enum(["grouped", "stacked"]).optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
});
export const HorizontalBarChart = defineComponent({
  name: "HorizontalBarChart",
  props: HorizontalBarChartSchema,
  description: "Native SVG chart. Visual parity with the React reference is not certified.",
  component: OpenUiHorizontalChartComponent,
});
export const PieChartSchema = z.object({
  labels: z.array(z.string()),
  values: z.array(z.number()),
  variant: z.enum(["pie", "donut"]).optional(),
  appearance: z.enum(["circular", "semiCircular"]).optional(),
});
export const PieChart = defineComponent({
  name: "PieChart",
  props: PieChartSchema,
  description: "Native SVG chart. Visual parity with the React reference is not certified.",
  component: OpenUiPieChartComponent,
});
export const RadialChartSchema = z.object({
  labels: z.array(z.string()),
  values: z.array(z.number()),
});
export const RadialChart = defineComponent({
  name: "RadialChart",
  props: RadialChartSchema,
  description: "Native SVG chart. Visual parity with the React reference is not certified.",
  component: OpenUiRadialChartComponent,
});
export const RadarChartSchema = z.object({
  labels: z.array(z.string()),
  series: z.array(SeriesSchema),
});
export const RadarChart = defineComponent({
  name: "RadarChart",
  props: RadarChartSchema,
  description: "Native SVG chart. Visual parity with the React reference is not certified.",
  component: OpenUiRadarChartComponent,
});
export const ScatterChartSchema = z.object({
  datasets: z.array(ScatterSeriesSchema),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
});
export const ScatterChart = defineComponent({
  name: "ScatterChart",
  props: ScatterChartSchema,
  description: "Native SVG chart. Visual parity with the React reference is not certified.",
  component: OpenUiScatterChartComponent,
});
export const SingleStackedBarChartSchema = z.object({
  labels: z.array(z.string()),
  values: z.array(z.number()),
});
export const SingleStackedBarChart = defineComponent({
  name: "SingleStackedBarChart",
  props: SingleStackedBarChartSchema,
  description: "Native SVG chart. Visual parity with the React reference is not certified.",
  component: OpenUiStackedChartComponent,
});
