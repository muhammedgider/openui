export interface GallerySample {
  source: string;
  group: string;
  note?: string;
  parent?: string;
  partial?: boolean;
  initialState?: Record<string, unknown>;
  launchState?: Record<string, unknown>;
}
const sample = (group: string, expression: string, note?: string): GallerySample => ({
  group,
  source: `root = ${expression}`,
  note,
});
const image = "/openui-preview.svg";
const series = '[Series("Revenue", [24,42,35,58]), Series("Expenses", [18,25,22,31])]';
const labels = '["January","February","March","April"]';
export const baseSamples: Record<string, GallerySample> = {
  Stack: sample(
    "Layout",
    'Stack([Text("text","First item"),Text("text","Second item"),Button("Continue")],"row","m","center","between",true)',
  ),
  Card: sample(
    "Layout",
    'Card([CardHeader("Workspace","Your data in one place"),TextContent("This card is rendered with native Angular components."),Buttons([Button("View details"),Button("Cancel",null,"secondary")])],"sunk")',
  ),
  CardHeader: sample("Typography", 'CardHeader("Monthly report","September workspace summary")'),
  Text: sample(
    "Typography",
    'Text("text","Body text with **bold emphasis**","Supporting description")',
  ),
  BoldText: sample("Typography", 'BoldText("number","$124,500","+12.4%","metric","lg")'),
  Label: sample("Typography", 'Label("Email address")'),
  TextContent: sample(
    "Typography",
    'TextContent("### Your workspace\\n\\n**Bold**, *italic*, and `inline code`.\\n\\n- Review reports\\n- Share with your team")',
  ),
  MarkDownRenderer: sample(
    "Typography",
    'MarkDownRenderer("## Markdown preview\\n\\n[Example link](https://example.com).\\n\\n> Supporting information\\n\\n1. Prepare\\n2. Review\\n\\n```typescript\\nconst ready = true;\\n``` ")',
  ),
  CodeBlock: sample(
    "Typography",
    'CodeBlock("typescript",' +
      JSON.stringify(
        'const greet = (name: string) => `Hello ${name}`;\nconsole.log(greet("OpenUI"));',
      ) +
      ")",
  ),
  InlineHeader: sample("Typography", 'InlineHeader("**Overview**","Your team at a glance")'),
  TextCallout: sample(
    "Typography",
    'TextCallout("info","Before you continue","Review your changes before saving.")',
  ),
  Callout: sample(
    "Typography",
    'Callout("success","Changes saved","Your workspace is up to date.")',
  ),
  Separator: sample("Layout", "Separator()"),
  Button: sample("Forms", 'Button("Run action",{type:"demo-action",params:{origin:"gallery"}})'),
  Buttons: sample(
    "Forms",
    'Buttons([Button("Save"),Button("Cancel",null,"secondary"),Button("More options",null,"tertiary")])',
  ),
  Input: sample("Forms", 'Input("email","you@example.com","email",{required:true,email:true})'),
  TextArea: sample("Forms", 'TextArea("notes","Add your notes…",4)'),
  FormControl: sample(
    "Forms",
    'FormControl("Email",Input("email","you@example.com","email",{required:true,email:true}),"Use your work email address.")',
  ),
  Form: sample(
    "Forms",
    'Form("contact",Buttons([Button("Submit")]),[FormControl("Name",Input("name","Your name","text",{required:true})),FormControl("Email",Input("email","you@example.com","email",{required:true,email:true}))])',
  ),
  Select: sample(
    "Selection",
    'Select("country",[SelectItem("us","United States"),SelectItem("de","Germany"),SelectItem("gb","United Kingdom")],"Select a country")',
  ),
  CheckBoxGroup: sample(
    "Selection",
    'CheckBoxGroup("features",[CheckBoxItem("Analytics","Usage reports","analytics",true),CheckBoxItem("Exports","CSV downloads","exports")])',
  ),
  RadioGroup: sample(
    "Selection",
    'RadioGroup("plan",[RadioItem("Starter","For individuals","basic"),RadioItem("Pro","For teams","pro")],"basic")',
  ),
  SwitchGroup: sample(
    "Selection",
    'SwitchGroup("notifications",[SwitchItem("Email","Weekly digest","email",true),SwitchItem("Notifications","Real-time updates","push")],"sunk")',
  ),
  Chips: sample(
    "Selection",
    'Chips("tags","multiple",[ChipItem("design","Design",Icon("palette")),ChipItem("code","Code",Icon("code")),ChipItem("data","Data",Icon("chart-bar"))],null,["code"])',
  ),
  OptionCards: sample(
    "Selection",
    'OptionCards("plan","single",[OptionCard("basic","**Starter**","For individuals",Icon("user")),OptionCard("pro","**Pro**","For teams",Icon("users"))],null,"basic")',
  ),
  DatePicker: {
    ...sample("Forms", 'DatePicker("date","range")', "Open the calendar to select a date range."),
    partial: true,
  },
  Slider: {
    ...sample("Forms", 'Slider("budget","continuous",0,100,5,[25,75],"Budget range")'),
    partial: true,
  },
  Tabs: sample(
    "Navigation",
    'Tabs([TabItem("overview","Overview",[TextContent("Content for the first tab")]),TabItem("details","Details",[TextContent("Content for the second tab")])])',
  ),
  Accordion: sample(
    "Navigation",
    'Accordion([AccordionItem("setup","Getting started",[TextContent("Choose a component and explore its behavior.")]),AccordionItem("details","Details",[TextContent("You can edit the source below.")])])',
  ),
  Steps: sample(
    "Navigation",
    'Steps([StepsItem("Prepare","**Connect** your data."),StepsItem("Review","Check the results."),StepsItem("Share","Send the report to your team.")])',
  ),
  Table: sample(
    "Tables",
    'Table([Col("Product",["Notebook","Pen","Folder"]),Col("Quantity",[12,48,8]),Col("Status",["Ready","Ready","Pending"])])',
  ),
  EditableTable: {
    ...sample(
      "Tables",
      'EditableTable("inventory",[{type:"text",key:"name",header:"Product"},{type:"number",key:"quantity",header:"Quantity"},{type:"select",key:"status",header:"Status",options:[{value:"ready",label:"Ready"},{value:"waiting",label:"Pending"}]},{type:"date-single",key:"date",header:"Date"},{type:"url",key:"link",header:"Link"}],[{id:"a",values:["Notebook",12,"ready","2026-09-15","https://example.com"]},{id:"b",values:["Pen",48,"waiting","2026-09-20","https://example.org"]}])',
      "Select a cell, then click again or press Enter to edit. Saving updates local demo state only.",
    ),
    partial: true,
  },
  EntityList: sample(
    "Lists",
    'EntityList([{left:"**Revenue**",right:"$124,500",rightVariant:"number"},{left:"Active users",right:"1,240",rightVariant:"number"},{left:"Status",right:"Ready"}],"default",{left:"Metric",right:"Value"})',
  ),
  ListBlock: sample(
    "Lists",
    'ListBlock([ListItem("Review reports","Last week at a glance",null,"Open",{type:"inspect"}),ListItem("Share with your team","Not shared yet")])',
  ),
  Icon: sample("Icons and metrics", 'Icon("rocket")'),
  IconButton: sample(
    "Icons and metrics",
    'IconButton("Open settings",Icon("settings"),{type:"settings"},"secondary","medium","circle")',
  ),
  Tag: sample("Icons and metrics", 'Tag("Ready",Icon("circle-check"),"lg","success")'),
  TagBlock: sample("Icons and metrics", 'TagBlock(["Angular","OpenUI","Preview"])'),
  IconText: sample(
    "Icons and metrics",
    'IconText(Icon("users"),"info","l","Team workspace","12 members",true)',
  ),
  ImageText: sample(
    "Media",
    `ImageText("${image}","Sample illustration","Weekly report","Updated today",true)`,
  ),
  ImageTextLarge: sample(
    "Media",
    `ImageTextLarge("${image}","Sample illustration","Start your next project","A featured image with supporting text",true)`,
  ),
  MetricIndicatorInline: sample(
    "Icons and metrics",
    'MetricIndicatorInline("$124,500","this month",{direction:"up",value:12})',
  ),
  MetricIndicatorWithStrikethrough: sample(
    "Icons and metrics",
    'MetricIndicatorWithStrikethrough("$149","per month","$199",{direction:"down",value:25})',
  ),
  Image: sample("Media", `Image("Sample illustration","${image}")`),
  ImageBlock: sample("Media", `ImageBlock("${image}","Local sample illustration")`),
  ImageGallery: sample(
    "Media",
    `ImageGallery([{src:"${image}",alt:"First image",details:"Local SVG asset"},{src:"${image}",alt:"Second image"},{src:"${image}",alt:"Third image"}])`,
    "Select an image to open the gallery.",
  ),
  Modal: {
    ...sample(
      "Navigation",
      'Modal("Example dialog",$galleryModalOpen,[TextContent("Press Escape, use the close button, or select the backdrop to dismiss."),Buttons([Button("Run action")])],"md")',
    ),
    initialState: { $galleryModalOpen: false },
    launchState: { $galleryModalOpen: true },
    partial: true,
  },
  Carousel: {
    ...sample(
      "Navigation",
      'Carousel([[TextContent("### First slide\\nContent for the first card")],[TextContent("### Second slide\\nScroll to explore")],[TextContent("### Third slide\\nThe final card")]],"sunk")',
    ),
    partial: true,
  },
  SnippetCardBlock: sample(
    "Card collections",
    'SnippetCardBlock([SnippetCardItem("a",IconText(Icon("rocket"),"neutral","m","Releases","This month"),BoldText("number","42","+12%","metric")),SnippetCardItem("b",IconText(Icon("users"),"neutral","m","Team","Active members"))],"grid",true,{type:"inspect"})',
  ),
  OverviewCardBlock: sample(
    "Card collections",
    'OverviewCardBlock([OverviewCardItem("a",Text("text","Revenue","This month"),MetricIndicatorInline("$124,500","total",{direction:"up",value:12})),OverviewCardItem("b",Text("text","Members"),MetricIndicatorInline("42","active")),OverviewCardItem("c",Text("text","Conversion"),MetricIndicatorInline("8%"))],"grid",true,{type:"inspect"})',
  ),
  ContextCardBlock: sample(
    "Card collections",
    'ContextCardBlock([ContextCardItem("a","Next step","**Connect** your workspace.","gray"),ContextCardItem("b",Tag("Ready",Icon("check"),"lg","success"),"Explore your data.")],"grid",true,{type:"inspect"})',
  ),
  VisualCardBlock: sample(
    "Card collections",
    `VisualCardBlock([VisualCardItem(BoldText("text","First destination","A weekend itinerary"),"a","${image}",Tag("New"),"Illustration"),VisualCardItem(BoldText("text","Second destination","Time to recharge"),"b","${image}")],"grid",true,{type:"inspect"})`,
  ),
  CompositeCardBlock: {
    ...sample(
      "Card collections",
      'CompositeCardBlock([CompositeCardItem("basic",Text("text","Starter","For individuals"),[Text("text","Included features"),ListBlock([ListItem("Reports"),ListItem("Exports")]),TagBlock(["Monthly"])],{price:BoldText("number","$99"),button:Button("Choose Starter",{type:"choose"})}),CompositeCardItem("pro",Text("text","Pro","For teams"),[Text("text","All features"),MetricIndicatorInline("42","features")],{price:BoldText("number","$199"),button:Button("Choose Pro",{type:"choose"})})],"grid",true,{type:"inspect"})',
    ),
    partial: true,
  },
};
for (const name of ["BarChart", "LineChart", "AreaChart", "HorizontalBarChart", "RadarChart"])
  baseSamples[name] = { ...sample("Charts", `${name}(${labels},${series})`), partial: true };
for (const name of ["PieChart", "RadialChart", "SingleStackedBarChart"])
  baseSamples[name] = {
    ...sample("Charts", `${name}(["Web","Mobile","Other"],[55,30,15])`),
    partial: true,
  };
baseSamples["ScatterChart"] = {
  ...sample(
    "Charts",
    'ScatterChart([ScatterSeries("Measurements",[Point(2,3,8),Point(4,7,12),Point(6,5,6),Point(8,9,16)])])',
  ),
  partial: true,
};
export const helperParents: Record<string, string> = {
  Col: "Table",
  SelectItem: "Select",
  CheckBoxItem: "CheckBoxGroup",
  RadioItem: "RadioGroup",
  SwitchItem: "SwitchGroup",
  TabItem: "Tabs",
  AccordionItem: "Accordion",
  ChipItem: "Chips",
  OptionCard: "OptionCards",
  StepsItem: "Steps",
  ListItem: "ListBlock",
  SnippetCardItem: "SnippetCardBlock",
  OverviewCardItem: "OverviewCardBlock",
  ContextCardItem: "ContextCardBlock",
  VisualCardItem: "VisualCardBlock",
  CompositeCardItem: "CompositeCardBlock",
  Series: "BarChart",
  Slice: "PieChart",
  ScatterSeries: "ScatterChart",
  Point: "ScatterChart",
  FollowUpItem: "FollowUpBlock",
  SectionItem: "SectionBlock",
};
export const chatSamples: Record<string, GallerySample> = {
  Card: sample(
    "Chat",
    'Card([TextContent("### Answer with sources\\n\\nThe first source supports this information [1]. See the second source for more context [2]."),FollowUpBlock([FollowUpItem("Explain in more detail"),FollowUpItem("Show an example")])],[{title:"First example source",sourceName:"Example",url:"https://example.com"},{title:"Second example source",sourceName:"Example.org",url:"https://example.org"}])',
    "Chat Card includes a source strip and inline citations.",
  ),
  FollowUpBlock: sample(
    "Chat",
    'FollowUpBlock([FollowUpItem("Explain in more detail"),FollowUpItem("Compare the data"),FollowUpItem("What are the next steps?")])',
  ),
  SectionBlock: sample(
    "Chat",
    'SectionBlock([SectionItem("overview","Overview",[TextContent("The first section is expanded by default.")]),SectionItem("details","Details",[TextContent("Sections can be expanded and collapsed independently."),FollowUpBlock([FollowUpItem("Continue")])])])',
  ),
  Tabs: {
    ...sample(
      "Chat",
      'Tabs([TabItem("summary","Summary",[TextContent("Content in a chat tab"),FollowUpBlock([FollowUpItem("Expand the summary")])]),TabItem("chart","Chart",[BarChart(["A","B"],[Series("Value",[10,20])])])])',
      "The BarChart in this example does not yet have full visual parity.",
    ),
    partial: true,
  },
  Accordion: sample(
    "Chat",
    'Accordion([AccordionItem("a","Questions",[FollowUpBlock([FollowUpItem("How does it work?")])]),AccordionItem("b","Data",[Table([Col("Name",["Example"]),Col("Value",[42])])])])',
  ),
  Carousel: sample(
    "Chat",
    'Carousel([[TextContent("First chat slide"),FollowUpBlock([FollowUpItem("Show details")])],[TextContent("Second chat slide")]],"sunk")',
  ),
};
export function gallerySample(name: string, mode: "base" | "chat"): GallerySample | undefined {
  const own = (mode === "chat" ? chatSamples[name] : undefined) ?? baseSamples[name];
  if (own) return own;
  const parent = helperParents[name];
  if (!parent) return undefined;
  const demo = (mode === "chat" ? chatSamples[parent] : undefined) ?? baseSamples[parent];
  return demo
    ? {
        ...demo,
        parent,
        group: "Data records",
        note:
          name === "Slice"
            ? "Slice is a legacy data record. This preview renders equivalent data using the current PieChart labels and values API."
            : `${name} has no standalone view. This example shows it within ${parent}.`,
      }
    : undefined;
}
