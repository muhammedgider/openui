# @openuidev/angular-ui

Initial, React-free Angular port of OpenUI's generative UI components. Uses `@openuidev/angular-lang`; it does not embed React or depend on `react-ui`.

This is a private development package, not an upstream release. The base registry contains **82/82 catalog entries**: 62 visual renderers and 20 parent-consumed data records. The separate `openuiChatLibrary` contains **84/84 upstream chat registrations**. Registry coverage is not completion: 16 base entries remain explicitly partial, including all nine charts, DatePicker, Slider, EditableTable and their four containing schemas. The native chart implementation does not yet reproduce upstream chart appearance or all interactions. See `PORTING.md` and `catalog-status.json`. This is **not a production-ready or visually equivalent replacement** for React UI.

## Build locally

From the repository root (Node 24.15.0 is supported):

```sh
pnpm install --ignore-scripts
pnpm --filter @openuidev/lang-core build
pnpm --filter @openuidev/angular-lang build
pnpm --filter @openuidev/angular-ui build
pnpm --filter @openuidev/angular-ui test
pnpm --filter @openuidev/angular-ui pack:check
```

The build resolves Angular Lang from its built distribution, not from a cross-package source alias. Distribution output is `dist/angular-ui`; normal `pnpm pack` from this workspace package uses that same path. The published manifest contains no workspace or catalog protocols.

## Use in Angular

Import `Renderer` from `@openuidev/angular-lang` and `openuiLibrary` from this package. Add `@openuidev/angular-ui/styles/index.css` to the application's global styles.

```html
<div class="openui-theme" data-openui-theme="light">
  <openui-renderer
    [library]="openuiLibrary"
    [response]="response"
    [isStreaming]="isStreaming"
    (action)="handleAction($event)"
  />
</div>
```

Change `data-openui-theme` to `dark` for OpenUI's dark tokens. Themes are scoped to the wrapper and never replace the host application's root variables or follow OS settings implicitly.

The default typography names **Inter**, but the package deliberately does not fetch fonts. Supply Inter in the host application; otherwise the browser silently uses a fallback. The Angular gallery self-hosts the normal/italic variable font with Latin and Latin Extended subsets and the OFL license. Its canvas uses `--openui-background` and its browser reset matches upstream Storybook; arbitrary host backgrounds and resets can change compositing and layout even when component tokens match.

Generate base instructions with `openuiLibrary.prompt(openuiPromptOptions)`. For chat, use `openuiChatLibrary.prompt(openuiChatPromptOptions)` with the chat library on the Renderer. Chat has its own locked `Card(children, sources?)` schema, FollowUpBlock/Item, SectionBlock/Item and wider container unions. Upstream chat examples/rules are synchronized as data only. Registered partial components appear in these prompts; do not treat prompt generation as a parity certification.

Example OpenUI Lang:

```text
root = Card([title, name, actions], "sunk")
title = BoldText("text", "Profile")
name = Input("Name", "Your name")
actions = Buttons([Button("Continue")])
```

Reactive Input `value` bindings use the shared `lang-core` resolver; fields and buttons are disabled while streaming. Actions are emitted to the host. This package does not execute arbitrary URLs or backend tools on its own.

## Boundaries

Text/BoldText support inline Markdown; TextContent supports GFM. Chat sources support scoped `[n]` links; code remains literal and unsafe source URLs stay inert. Raw HTML remains escaped, and code grammars load only when needed. Charts use native Angular SVG with `d3-shape` geometry, not Recharts or React wrappers. EditableTable implements positional edits/reset/save; DatePicker implements a single/range calendar; Slider implements keyboard/pointer changes and a 200 ms debounce. Their visual and behavior gaps are recorded as partial, not silently certified. Composite, Modal and Carousel unions now include the applicable chart/table entries. The low-level primitive API is not mirrored. Select/date popovers use the native Popover API; modal/gallery use native dialogs. The comparison suite retains its 0.5% failure threshold, including new fixtures that do not match.

## Contribution checks

The existing monorepo package CI discovers `pnpm ci` from this package. It runs formatting, lint, typecheck, unit tests, style provenance, catalog inventory and packaging checks. These commands are available for local verification too; adding tests does not mean they have passed.

`pnpm browser:check` builds the Angular package and runs the test-only React/Angular comparison harness with an installed Chrome browser. Use `PLAYWRIGHT_CHANNEL=chromium` for Playwright-managed Chromium. See `PORTING.md` for consumer build and React-free audit commands, measured results and outstanding warnings.

`pnpm gallery:check` compares the **running** Angular gallery (default `http://127.0.0.1:4207`, configurable with `GALLERY_URL`) to a separate test-only React reference. It uses the exact gallery sources, the actual installed Angular package, self-hosted Inter and the upstream Storybook reset. It records theme-token differences, 16 computed-style properties on matching DOM elements, unmatched elements, parser errors and pixel diffs. The 68 examples × two themes × two widths produce 272 comparisons. `STYLE_CASES` filters diagnostics; filtered runs are not full coverage. Reports and PNGs are written to `dist/angular-ui-gallery-parity`. Neither this check nor the existing fixture harness certifies every interaction state.

Use `pnpm styles:sync` only when deliberately updating the selected upstream SCSS snapshots. Run `pnpm catalog:write` after implementing or removing catalog entries. Neither inventory membership nor matching stylesheet hashes establishes visual equivalence.

## License

MIT. Copied OpenUI styles retain the repository license in this package and its distribution. The Prism theme snapshot includes `CODE-THEME-LICENSE` in the package archive.
