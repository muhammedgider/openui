// Test-only reference. This bundle is never imported by angular-ui or its consumer.
import { Renderer } from "@openuidev/react-lang";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "../../react-ui/src/components/ThemeProvider";
import { openuiChatLibrary } from "../../react-ui/src/genui-lib/openuiChatLibrary";
import { openuiLibrary } from "../../react-ui/src/genui-lib/openuiLibrary";

const host = window as unknown as {
  ready: boolean;
  events: unknown[];
  errors: unknown[];
  configure: (source: string, streaming?: boolean) => void;
};
const params = new URLSearchParams(location.search);
const root = createRoot(document.querySelector("app-fixture")!);
host.events = [];
host.errors = [];
host.configure = (source, streaming = false) => {
  root.render(
    <ThemeProvider mode={params.get("theme") === "dark" ? "dark" : "light"} cssSelector=".surface">
      <Renderer
        library={params.get("library") === "chat" ? openuiChatLibrary : openuiLibrary}
        initialState={JSON.parse(params.get("state") ?? "{}")}
        response={source}
        isStreaming={streaming}
        onAction={(event) => host.events.push(event)}
        onError={(errors) => {
          host.errors = errors;
        }}
      />
    </ThemeProvider>,
  );
};
host.configure(params.get("source") ?? 'root = Text("text", "Ready")');
host.ready = true;
