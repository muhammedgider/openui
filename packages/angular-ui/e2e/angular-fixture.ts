import "@angular/compiler";
import { Component, signal } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { Renderer } from "../../../dist/angular-lang/fesm2022/openuidev-angular-lang.mjs";
import {
  openuiChatLibrary,
  openuiLibrary,
} from "../../../dist/angular-ui/fesm2022/openuidev-angular-ui.mjs";

const host = window as unknown as {
  ready: boolean;
  events: unknown[];
  errors: unknown[];
  configure: (source: string, streaming?: boolean) => void;
};
const params = new URLSearchParams(location.search);
class Fixture {
  library = params.get("library") === "chat" ? openuiChatLibrary : openuiLibrary;
  initialState = JSON.parse(params.get("state") ?? "{}");
  response = signal(params.get("source") ?? 'root = Text("text", "Ready")');
  streaming = signal(false);
  onAction(event: unknown) {
    host.events.push(event);
  }
  onError(errors: unknown[]) {
    host.errors = errors;
  }
  constructor() {
    host.events = [];
    host.errors = [];
    host.configure = (source, streaming = false) => {
      this.response.set(source);
      this.streaming.set(streaming);
    };
  }
}
Component({
  selector: "app-fixture",
  standalone: true,
  imports: [Renderer],
  template:
    '<openui-renderer [library]="library" [initialState]="initialState" [response]="response()" [isStreaming]="streaming()" (action)="onAction($event)" (error)="onError($event)" />',
})(Fixture);
bootstrapApplication(Fixture).then(() => {
  host.ready = true;
});
