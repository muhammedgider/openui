/** Same source is rendered by both frameworks; no framework-specific expected markup. */
export const cardCases: [string, string][] = [
  [
    "snippet-cards",
    'root = SnippetCardBlock([SnippetCardItem("a", IconText(Icon("rocket"), "neutral", "m", "Launch", "This month"), BoldText("number", "42", "+12%", "metric")), SnippetCardItem("b", IconText(Icon("users"), "neutral", "m", "Team", "Active members"))], "grid", true, {type: "inspect", params: {source: "cards"}})',
  ],
  [
    "overview-cards",
    'root = OverviewCardBlock([OverviewCardItem("a", Text("text", "Revenue", "This month"), MetricIndicatorInline("$120", "total", {direction: "up", value: 12})), OverviewCardItem("b", Text("text", "Members"), MetricIndicatorInline("42", "active")), OverviewCardItem("c", Text("text", "Conversion"), MetricIndicatorInline("8%"))], "grid", true, {type: "inspect"})',
  ],
  [
    "context-cards",
    'root = ContextCardBlock([ContextCardItem("a", "Next step", "**Connect** your workspace", "gray"), ContextCardItem("b", Tag("Ready", Icon("check"), "lg", "success"), "Review your data"), ContextCardItem("c", "Preview", "Image background", null, "/fixture-image.svg", "Blue background")], "grid", true, {type: "inspect"})',
  ],
  [
    "visual-cards",
    'root = VisualCardBlock([VisualCardItem(BoldText("text", "Mountain", "A weekend trip"), "a", "/fixture-image.svg", Tag("New"), "Blue background"), VisualCardItem(BoldText("text", "Coast", "A longer stay"), "b", "/fixture-image.svg")], "grid", true, {type: "inspect"})',
  ],
  [
    "composite-cards",
    'root = CompositeCardBlock([CompositeCardItem("a", Text("text", "Basic", "Individual"), [Text("text", "Included features"), ListBlock([ListItem("Reports"), ListItem("Exports")]), EntityList([{left: "Members", right: "1", rightVariant: "number"}]), TagBlock(["Monthly"])], {price: BoldText("number", "$9"), button: Button("Choose basic", {type:"purchase"})}), CompositeCardItem("b", Text("text", "Pro"), [Text("text", "For teams"), MetricIndicatorInline("42", "features")], {price: BoldText("number", "$19"), button: Button("Choose pro", {type:"purchase"})})], "grid", true, {type:"inspect"})',
  ],
  [
    "card-carousel",
    'root = OverviewCardBlock([OverviewCardItem("a", Text("text", "First")), OverviewCardItem("b", Text("text", "Second")), OverviewCardItem("c", Text("text", "Third")), OverviewCardItem("d", Text("text", "Fourth")), OverviewCardItem("e", Text("text", "Fifth"))], "carousel", true)',
  ],
  [
    "lists",
    'root = Stack([EntityList([{left:"**Revenue**",right:"$120",rightVariant:"number"},{left:"Status",right:"Ready"}], "default", {left:"Metric",right:"Value"}, {left:"Total",right:"$120",rightVariant:"number"}), ListBlock([ListItem("First", "Description", null, "Open", {type:"inspect"}), ListItem("Second")]), ListBlock([ListItem("Image", "Description", {src:"/fixture-image.svg",alt:"Preview"})], "image", "small")])',
  ],
];
