const images = Array.from({ length: 6 }, (_, i) => ({
  src: "/fixture-image.svg",
  alt: `Photo ${i + 1}`,
}));
export const overlayCases: [string, string][] = [
  ["image-block", 'root = ImageBlock("/fixture-image.svg", "Preview")'],
  ...[1, 2, 3, 4, 6].map(
    (count) =>
      [`gallery-${count}`, `root = ImageGallery(${JSON.stringify(images.slice(0, count))})`] as [
        string,
        string,
      ],
  ),
  ["gallery-modal", `root = ImageGallery(${JSON.stringify(images)})`],
  [
    "modal",
    'root = Modal("Preview", $modalOpen, [TextContent("Dialog content"), Buttons([Button("Continue")])], "md")',
  ],
  [
    "carousel",
    'root = Carousel([[TextContent("First slide")], [TextContent("Second slide")], [TextContent("Third slide")]], "sunk")',
  ],
];
