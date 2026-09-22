import { InjectionToken } from "@angular/core";
export interface CardSource {
  url?: string;
  title: string;
  sourceName: string;
}
/** Scoped to a chat card; a getter preserves sources arriving during streaming. */
export const OPENUI_CARD_SOURCES = new InjectionToken<() => readonly CardSource[]>(
  "OPENUI_CARD_SOURCES",
);
