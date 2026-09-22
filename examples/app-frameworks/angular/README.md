# OpenUI Angular Playground

An Angular 22 application that demonstrates how to render structured OpenUI Lang output with `@openuidev/angular-lang`.

This example is intentionally optimized for repository development and smoke testing. It focuses on rendering, state, query, mutation, and error-recovery behavior in Angular rather than on a hosted chat backend.

## How it works

1. **The app defines an OpenUI component library** with Angular standalone components.
2. **A small scenario switcher** swaps between static, nested, form, query, mutation, crash, and recovery responses.
3. **`@openuidev/angular-lang` Renderer** parses the OpenUI Lang text and renders Angular components in real time.
4. **Mock tools** simulate `Query()` and `Mutation()` behavior so you can smoke-test the runtime without external services.

## Setup

### Prerequisites

- Node.js 24.15.0+ (24.x), or another version supported by Angular 22
- pnpm 10.33.0
- A full checkout of this repository; this pre-release example is not standalone

### Install dependencies

Before installing the example, build its local package from the repository root:

```bash
pnpm run examples:prepare
```

This installs workspace dependencies without running every package's prepare
script, then builds `lang-core`, `angular-lang` and `angular-ui` in dependency order.

The **Angular UI port** section has five deterministic scenarios: layout/typography,
forms/validation, selection controls, tabs/accordion and tables/pagination. Toggle
light/dark themes, replay the stream, edit fields and inspect emitted actions/state.
The registry contains 28 entries (21 visual renderers and seven data records); it is
not a complete or visually verified React UI port. Select requires the browser's
native Popover API. The original runtime scenarios remain below this section.

Then install this application's separate dependencies:

```bash
cd examples/app-frameworks/angular
pnpm install --ignore-workspace --frozen-lockfile
```

The root `pnpm examples:install` command performs the preparation automatically
before installing all examples, including in CI.

### Run

```bash
pnpm dev
```

Open [http://localhost:4200](http://localhost:4200).

## Local package resolution

During development, `@openuidev/angular-lang` and `@openuidev/angular-ui` are declared
`file:../../../dist/angular-lang` and `file:../../../dist/angular-ui` dependencies. pnpm installs the built package into
the example's dependency graph; there are no aliases to workspace source files.
Angular peers resolve from this application rather than loading a second Angular
runtime from the workspace.

Once the distribution exists, the example can install and build without any
workspace `node_modules` or package sources. To test it separately, copy this
example, `dist/angular-lang` and `dist/angular-ui` while preserving their relative paths. After
changing library code, rebuild the distribution and reinstall the example's
local dependency before rebuilding the app.

After the package is published, replace the file dependency with its published
version. The public import path is already the same:

```ts
import { Renderer, createLibrary, defineComponent } from "@openuidev/angular-lang";
```

## Project structure

```text
angular.json                         # Angular CLI application config
src/
├── app/
│   ├── app.ts                       # Scenario switcher + renderer host
│   ├── app.config.ts                # Application config
│   └── openui/
│       ├── library.ts               # OpenUI component definitions
│       ├── scenarios.ts             # Smoke-test scenarios and initial state fixtures
│       └── components/
│           ├── demo-input.component.ts
│           ├── greeting.component.ts
│           ├── maybe-crash.component.ts
│           ├── query-loader.component.ts
│           ├── save-button.component.ts
│           ├── stack.component.ts
│           └── state-value.component.ts
└── styles.css                       # Example layout and UI styles
```

## Component gallery

Run `pnpm gallery` for the separate gallery entrypoint on loopback port 4207. It leaves the renderer smoke-test entrypoint unchanged. The gallery covers the base (82) and chat (84) registries with search, per-component views, source editing, light/dark mode, width controls and a local action/state log. Parent-consumed data records are demonstrated through their parent components.

The gallery uses OpenUI's default theme tokens, the upstream Storybook browser reset and self-hosted Inter. Font assets and their OFL license/provenance live under `public/fonts`; normal and italic Latin/Latin Extended subsets support international text without runtime requests to a font CDN. `public/gallery-host.css` is loaded only by the gallery entrypoint.

From the repository root, `pnpm --filter @openuidev/angular-ui gallery:check` compares the running gallery to an isolated React reference (not included in the Angular application). Partial components remain labelled; matching tokens alone does not prove matching rendering or behavior. After rebuilding and reinstalling the local library dependency, restart the gallery server: Angular's dev server can retain the previous dependency bundle despite application HMR.

## What to test

Use the scenario buttons in the UI to verify:

- static rendering
- nested rendering through `RenderNode`
- initial form-state hydration
- state updates from Angular components
- query loading and custom loader rendering
- mutation execution through `run` action steps
- structured parser, tool, and render errors
- render recovery with last-good-render preservation

## Verify

```bash
pnpm verify
```
