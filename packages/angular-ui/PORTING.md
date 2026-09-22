# Angular UI port status

This private port is **not production-ready and not a visually/behaviorally equivalent replacement for react-ui**. Catalog coverage and completed porting are different measures.

## Scope

The base registry now contains **82/82 entries: 62 visual renderers and 20 parent-consumed data records**. The separately exported `openuiChatLibrary` contains **84/84 chat registrations**, including a locked `Card(children, sources?)`, FollowUpBlock/Item, SectionBlock/Item and chat-specific Tabs/Accordion/Carousel unions. The consuming application's chat shell is outside this package.

`catalog-status.json` deliberately retains **16 partial base entries**: all nine chart renderers, EditableTable, DatePicker, Slider, CompositeCardBlock/Item, Modal and Carousel. The last four now accept the applicable charts/tables, but their referenced renderers remain partial. Nothing is marked visually certified. Registry checks compare both the base and chat inventories with the same checkout's upstream registries.

## This increment

- Native Angular SVG renderers for BarChart, LineChart, AreaChart, HorizontalBarChart, RadarChart, PieChart, RadialChart, SingleStackedBarChart and ScatterChart. Geometry uses React-free `d3-shape`; Series, Slice, Point and ScatterSeries are data records. Grouped/stacked bars, negative Cartesian values, line interpolation, pie/donut/semi-circular geometry, responsive width, legend toggles and keyboard-readable marks are present. These are functional implementations, **not equivalent ports of the upstream chart presentation and interaction system**.
- Slider: continuous/discrete values, multiple thumbs, keyboard and pointer input, shared Angular Select behavior, streaming suppression and 200 ms debounced field commits. DatePicker: single/range calendar, local Date values, month/year navigation, native Popover, keyboard navigation and Escape focus restoration.
- EditableTable: typed cell editing, positional row values, change counting, reset, table-scoped field save and `Save Changes` action. Escape cancellation cannot commit through a subsequent blur. Streaming locks edits and save.
- Chat: follow-up actions, streaming-aware foldable sections, nonfoldable sections, nested container schemas, source strip and scoped `[n]` citations. Unsafe URLs remain inert and inline code is not rewritten as citations. Upstream chat prompt examples/rules are synchronized as data, without React imports.

The earlier forms, rich content, selection, media, overlay, list and card implementations remain in place. No React, React DOM, Radix React or Recharts production dependency was added. Only test fixtures import React references.

## Gallery language

All shipped interface copy, accessibility labels, examples and documentation use English. The gallery document language and category sorting locale are `en`. Example monetary values use USD and English number formatting.

The measurements below predate the English copy update. They document style fixes, not a freshly verified screenshot baseline for the current English examples. Regenerate the visual report before using it as a release gate.

## Gallery style verification — 2026-09-21 (before the English copy update)

The running gallery was compared against the same checkout's React implementation, with the same sources, viewport sizes, upstream Storybook reset and self-hosted Inter. This exposed gaps that the earlier isolated fixtures did not cover:

- Inter was named but not loaded. The gallery now ships normal/italic Latin and Latin Extended variable-font assets with their OFL license; it makes no runtime font-CDN requests.
- Gallery canvas/chrome colors now derive from the OpenUI theme rather than a separate palette. Component previews use `--openui-background`.
- Citation and favicon styles were missing from the import/provenance allowlist. Citations now have the upstream inline container/globe treatment; source cards use the upstream carousel/card markup and spacing instead of custom source-card styles. Citation links remain direct links, not the upstream pinnable hover UI.
- TextContent now carries its specific Markdown class, with the same stylesheet override order as React. Closed section content is hidden so it cannot create a phantom 18px flex gap. Tabs now have the upstream content-inner layout wrapper.

**272 gallery comparisons were scanned (62 base + 6 chat-specific examples × two themes × two widths).** After the last SectionBlock/Tabs fixes, all 12 affected comparisons were rerun. The consolidated result is **228 passing, 44 failing** the unchanged **0.5% pixel threshold**, with no page errors. The 44 remaining failures are all nine chart examples, EditableTable and the chart-containing chat Tabs example, at each theme/width. They remain release blockers, not accepted visual matches.

All **213 default theme tokens** matched in both modes. Across **2,808 matching DOM-element instances**, the 16 checked computed-style properties (background, border, radius, shadow, spacing and typography) matched. This is not a claim about unmatched markup, SVG geometry or every interaction state. Token comparison normalizes whitespace/quote serialization; invisible zero-width borders are normalized. Screenshot clipping origins are aligned to avoid a spurious one-pixel crop row; component content and the mismatch threshold are not shifted or relaxed.

The report is `dist/angular-ui-gallery-parity/report.json`. `full-pass-before-section-fix.json` preserves the full scan and `targeted-final.json` contains the 12 final reruns; the consolidated report records that strategy explicitly. The unmodified core test suite plus added source/section markup assertions passed **88 tests**. The package build passed; 79 upstream SCSS/token snapshots are byte-identical to the recorded checkout. TypeScript and lint checks passed during this increment. A consumer production build passed with **1.18 MB raw / 218.68 kB estimated transfer** and no React in 190 production packages / 2,611 bundle inputs; the existing bundle/CommonJS advisories remain, and the gallery stylesheet has a 4 kB advisory (4.89 kB actual), below its unchanged 8 kB error budget.

Run `pnpm --filter @openuidev/angular-ui gallery:check` with the gallery running on port 4207. `GALLERY_URL` overrides that address and `STYLE_CASES` selects diagnostic cases. The gallery's dev server was restarted with explicit approval to load rebuilt local dependencies; unrelated services were left running.

## Verification — 2026-09-20 (historical fixture run)

Package CI passed: formatting, ESLint, TypeScript, **88 unit/regression tests**, **75 byte-preserved SCSS snapshots**, both catalog inventories, Angular partial compilation and archive checks. The table pagination test still emits the pre-existing NG0956 collection-recreation advisory.

The final browser run completed **43 paired fixtures × two widths × two themes = 172 comparisons: 135 passed and 37 failed** the unchanged 0.5% threshold. All 36 chart comparisons and one EditableTable comparison failed; this is a failing visual-parity suite, not a release pass. The prior 112 comparisons still passed. Continuous/discrete slider, closed DatePicker, chat follow-up and foldable-section fixtures passed at both widths/themes. There were **no page errors and 54 successful interaction executions**, including real-Chrome calendar open/select, Angular Escape focus restoration and slider keyboard steps. These are repeated executions across frameworks/themes/widths, not 54 different interaction types. The completion-aware report and PNG diffs are in `dist/angular-ui-parity/`; the first expanded report is retained as `report-first-expansion.json`.

The Angular consumer build passed with the original budgets unchanged: approximately **1.17 MB raw / 218 kB transfer**. It remains above the 800 kB advisory budget and below the 1.2 MB error limit, with little budget headroom. The `unified` → CommonJS `extend` advisory remains. The consumer audit checked **190 unique production packages and 2,609 bundle inputs**, with no React dependency or bundled React module. These measurements were rerun after the control-markup refinements.

```sh
pnpm --filter @openuidev/angular-ui ci
pnpm --filter @openuidev/angular-ui browser:check
pnpm --dir examples/app-frameworks/angular install --ignore-workspace --ignore-scripts
pnpm --dir examples/app-frameworks/angular exec ng build --stats-json
pnpm --filter @openuidev/angular-ui react-free:check
```

The browser harness uses installed Chrome by default; `PLAYWRIGHT_CHANNEL=chromium` selects Playwright Chromium. `PARITY_CASE` accepts one fixture or comma-separated fixture names. Filtered runs are diagnostic, not full-suite results. Reports include `completed` and `expectedComparisons`; the 0.5% pixel threshold is unchanged. The harness creates and closes only its own loopback server/browser. Existing development servers are not restarted.

## Release blockers

The charts still differ in layout, palettes, axis/tick treatment, tooltips/sidebar, loading states, export metadata and edge-case behavior. EditableTable still differs in date/select editor presentation, column-scroll controls and full keyboard behavior. Date range details, calendar dropdown styling/collision handling, very large slider option ranges and exhaustive validation/drag behavior remain incomplete. Chat source-strip/citation hover behavior and all section/container variants are not certified.

Full schema/prompt equivalence, the low-level primitive API, complete variant/interaction coverage, Firefox/WebKit, RTL, assistive technology, math rendering and upstream API review remain release work. Passing a static fixture does not clear these requirements.

## Architecture and provenance

`angular-ui` depends on `angular-lang`, never the reverse. The renderer package owns parsing/state/actions; this package owns views/schemas/styles. `scripts/sync-chart-schemas.mjs`, `sync-chat-schemas.mjs` and `sync-prompt-data.mjs` extract schema/prompt data from the same source checkout; run Prettier after regeneration. No React implementation is copied into production rendering code.

`styles:sync` copies an explicit SCSS allowlist and records SHA-256 provenance; Angular-specific adaptations stay outside those snapshots. MIT and the Prism theme license ship in the archive. The package remains private at `0.0.0` and builds to `dist/angular-ui`.

All work stays on `feat/angular-ui-port`, separate from renderer PR #1167. No Dvina integration, unrelated-service restart, commit, push or upstream PR modification is part of this work. Do not describe this state as a completed production port.
