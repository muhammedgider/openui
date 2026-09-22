import { NgStyle } from "@angular/common";
import { Component } from "@angular/core";
import { RenderNode } from "@openuidev/angular-lang";
import type { CardProps, FlexProps, StackProps } from "../genui-lib/schemas";
import { OpenUiComponent } from "./base";

const gapMap: Record<string, string> = {
  none: "0",
  xs: "var(--openui-space-xs)",
  s: "var(--openui-space-s)",
  m: "var(--openui-space-m)",
  l: "var(--openui-space-l)",
  xl: "var(--openui-space-xl)",
  "2xl": "var(--openui-space-2xl)",
};
const alignMap: Record<string, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
  baseline: "baseline",
};
const justifyMap: Record<string, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  between: "space-between",
  around: "space-around",
  evenly: "space-evenly",
};
function flexStyle(props: FlexProps | null, card = false): Record<string, string | undefined> {
  const justify = !card && props?.wrap && props.justify === "between" ? "start" : props?.justify;
  return {
    display: "flex",
    "flex-direction": props?.direction ?? "column",
    gap: gapMap[props?.gap ?? "m"],
    "align-items": alignMap[props?.align ?? "stretch"],
    "justify-content": justifyMap[justify ?? "start"],
    "flex-wrap": props?.wrap ? "wrap" : "nowrap",
    ...(card ? { flex: "1", "min-width": "0" } : {}),
  };
}

@Component({
  selector: "openui-stack",
  standalone: true,
  imports: [NgStyle, RenderNode],
  template: `<div [ngStyle]="style">
    <openui-render-node
      [value]="props?.children"
      [library]="context.library"
      [context]="context"
      [formName]="formName"
    />
  </div>`,
})
export class OpenUiStackComponent extends OpenUiComponent<StackProps> {
  get style() {
    return flexStyle(this.props);
  }
}

@Component({
  selector: "openui-card",
  standalone: true,
  imports: [NgStyle, RenderNode],
  template: `<div
    [class]="'openui-card openui-card-full openui-card-' + (props?.variant ?? 'card')"
    [ngStyle]="style"
  >
    <openui-render-node
      [value]="props?.children"
      [library]="context.library"
      [context]="context"
      [formName]="formName"
    />
  </div>`,
})
export class OpenUiCardComponent extends OpenUiComponent<CardProps> {
  get style() {
    return flexStyle(this.props, true);
  }
}

@Component({
  selector: "openui-buttons",
  standalone: true,
  imports: [RenderNode],
  template: `<div
    [class]="
      'openui-buttons openui-buttons-' + (props?.direction === 'column' ? 'vertical' : 'horizontal')
    "
  >
    <openui-render-node
      [value]="props?.buttons"
      [library]="context.library"
      [context]="context"
      [formName]="formName"
    />
  </div>`,
})
export class OpenUiButtonsComponent extends OpenUiComponent<{
  buttons: unknown[];
  direction?: "row" | "column";
}> {}
