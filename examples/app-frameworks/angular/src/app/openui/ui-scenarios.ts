/** Deterministic OpenUI Lang fixtures, shared by the playground and browser comparisons. */
export const uiScenarios = [
  {
    id: "cards",
    label: "Card families & lists",
    source: `root = Stack([SnippetCardBlock([SnippetCardItem("a", IconText(Icon("users"), "neutral", "m", "Members"), BoldText("number", "42")), SnippetCardItem("b", IconText(Icon("rocket"), "neutral", "m", "Launch"), Text("text", "Ready"))]), OverviewCardBlock([OverviewCardItem("a", Text("text", "Revenue"), MetricIndicatorInline("$120", "this month")), OverviewCardItem("b", Text("text", "Conversion"), MetricIndicatorInline("8%"))]), ContextCardBlock([ContextCardItem("a", "Next step", "**Connect** your workspace", "gray"), ContextCardItem("b", Tag("Ready"), "Review your results")]), EntityList([{left:"Status",right:"Ready"},{left:"Members",right:"42",rightVariant:"number"}]), ListBlock([ListItem("Review", "Open the details", null, "View", {type:"inspect"}), ListItem("Export", "Download later")])])`,
  },
  {
    id: "composite",
    label: "Composite & visual cards",
    source: `root = Stack([CompositeCardBlock([CompositeCardItem("a", Text("text", "Basic"), [ListBlock([ListItem("Reports"), ListItem("Exports")])], {price:BoldText("number", "$9"),button:Button("Choose basic", {type:"purchase"})}), CompositeCardItem("b", Text("text", "Pro"), [Text("text", "For teams")], {price:BoldText("number", "$19"),button:Button("Choose pro", {type:"purchase"})})]), VisualCardBlock([VisualCardItem(BoldText("text", "Mountains"), "a", "/openui-preview.svg", Tag("New")), VisualCardItem(BoldText("text", "Weekend"), "b", "/openui-preview.svg")])])`,
  },
  {
    id: "media",
    label: "Gallery, modal & carousel",
    source: `root = Stack([Buttons([Button("Open dialog", @Set($showModal, true))]), Modal("Preview", $showModal, [TextContent("Close with Escape, the backdrop or the close button.")]), ImageGallery([{src:"/openui-preview.svg",alt:"Mountains"},{src:"/openui-preview.svg",alt:"Weekend"},{src:"/openui-preview.svg",alt:"Journey"}]), Carousel([[TextContent("First slide")],[TextContent("Second slide")],[TextContent("Third slide")]], "sunk")])`,
  },
  {
    id: "choices",
    label: "Chips & option cards",
    source: `root = Card([CardHeader("Choose a plan"), Form("choices", Buttons([Button("Continue")]), [FormControl("Plan", OptionCards("plan", "single", [OptionCard("basic", "**Basic**", "Individual", Icon("user")), OptionCard("pro", "Pro", "Team", Icon("users")), OptionCard("enterprise", "Enterprise", "Coming soon", null, true)], {required: true})), FormControl("Interests", Chips("interests", "multiple", [ChipItem("analytics", "Analytics", Icon("chart-no-axes-combined")), ChipItem("exports", "Exports"), ChipItem("alerts", "Alerts")], null, ["analytics"]))])])`,
  },
  {
    id: "rich",
    label: "Markdown, code & steps",
    source: `root = Card([InlineHeader("**Quick start**", "Markdown and syntax highlighting"), TextCallout("info", "Angular native", "No React runtime is required"), Steps([StepsItem("Install", "Install the Angular packages."), StepsItem("Render", "Pass source to **Renderer**.")]), CodeBlock("typescript", "const framework = 'angular';"), MetricIndicatorInline("66", "catalog entries", {direction: "up", value: 17})])`,
  },
  {
    id: "basics",
    label: "Layout & typography",
    source: `root = Stack([Card([CardHeader("OpenUI for Angular", "Native Angular components, original OpenUI styles"), Stack([BoldText("number", "42", "+12%", "metric", "lg"), Text("text", "Active users", "Last 30 days")], "row", "l", "center"), Separator(), TagBlock(["Angular", "OpenUI", "No React"], "sm"), Buttons([Button("Primary"), Button("Secondary", null, "secondary"), Button("Remove", null, "tertiary", "destructive")])])`,
  },
  {
    id: "form",
    label: "Form & validation",
    source: `root = Card([CardHeader("Contact details", "Required fields are validated before a primary action"), Form("contact", Buttons([Button("Submit"), Button("Cancel", null, "secondary")]), [FormControl("Email", Input("email", "you@example.com", "email", {required: true, email: true}), "Use a work email address"), FormControl("Country", Select("country", [SelectItem("tr", "Turkey"), SelectItem("uk", "United Kingdom"), SelectItem("de", "Germany")], "Select a country", {required: true}), "Arrow keys and typing navigate the list"), FormControl("Notes", TextArea("notes", "How can we help?", 4, {minLength: 3}), "At least three characters")])])`,
  },
  {
    id: "selection",
    label: "Selection controls",
    source: `root = Card([CardHeader("Preferences"), Form("preferences", Buttons([Button("Save preferences")]), [FormControl("Features", CheckBoxGroup("features", [CheckBoxItem("Analytics", "Usage reports", "analytics", true), CheckBoxItem("Exports", "Download your reports", "exports", false)])), FormControl("Plan", RadioGroup("plan", [RadioItem("Basic", "For individuals", "basic"), RadioItem("Pro", "For teams", "pro")], "basic"))]), Separator(), SwitchGroup("notifications", [SwitchItem("Email updates", "Receive product updates", "email", true), SwitchItem("Weekly summary", "A weekly digest", "digest", false)], "sunk")])`,
  },
  {
    id: "navigation",
    label: "Tabs & accordion",
    source: `root = Card([CardHeader("Project guide"), Tabs([TabItem("overview", "Overview", [Text("text", "Project overview"), TagBlock(["In progress", "Angular"])]), TabItem("details", "Details", [Accordion([AccordionItem("setup", "Setup", [Text("text", "Install the package and import the stylesheet.")]), AccordionItem("usage", "Usage", [Text("text", "Pass OpenUI Lang to the Angular renderer.")])])])])`,
  },
  {
    id: "table",
    label: "Table & pagination",
    source: `root = Card([CardHeader("Monthly activity", "Eleven rows exercise pagination; resize to check horizontal scrolling"), Table([Col("Month", ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November"]), Col("Active users", [120, 160, 180, 170, 210, 240, 290, 310, 330, 360, 400]), Col("Status", [TagBlock(["Complete"]), TagBlock(["Complete"]), TagBlock(["Complete"])])])`,
  },
] as const;
