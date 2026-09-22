export const advancedCases: [string, string][] = [
  ...["BarChart", "LineChart", "AreaChart", "HorizontalBarChart", "RadarChart"].map(
    (name) =>
      [
        `chart-${name}`,
        `root = ${name}(["Jan","Feb","Mar"],[Series("Revenue",[30,45,40]),Series("Cost",[20,25,30])])`,
      ] as [string, string],
  ),
  ...["PieChart", "RadialChart", "SingleStackedBarChart"].map(
    (name) =>
      [`chart-${name}`, `root = ${name}(["One","Two","Three"],[30,45,25])`] as [string, string],
  ),
  [
    "chart-ScatterChart",
    'root = ScatterChart([ScatterSeries("Measurements",[Point(2,3),Point(4,7),Point(6,5)])])',
  ],
  ["slider-continuous", 'root = Slider("Budget","continuous",0,100,10,[30,70],"Budget")'],
  ["slider-discrete", 'root = Slider("Budget","discrete",0,100,10,[30],"Budget")'],
  ["date-picker", 'root = DatePicker("Date","single")'],
  [
    "editable-table",
    'root = EditableTable("orders",[{type:"text",key:"name",header:"Name"},{type:"number",key:"count",header:"Count"}],[{id:"a",values:["Book",2]},{id:"b",values:["Pen",5]}])',
  ],
  [
    "chat-follow-ups",
    'root = Card([TextContent("Next steps"),FollowUpBlock([FollowUpItem("Explain more"),FollowUpItem("Show examples")])])',
  ],
  [
    "chat-sections",
    'root = Card([SectionBlock([SectionItem("a","Overview",[TextContent("First section")]),SectionItem("b","Details",[TextContent("Second section")])])])',
  ],
];
