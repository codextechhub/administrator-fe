import type { EventType } from "@/redux/services/calendar/calendar-types";

/** The four things this screen filters on, including the toolbar's search. */
export interface EventFacets {
  search: string;
  type: EventType | "all";
  term: number | "all";
  /** A branch id, "school" for shared rows only, or "all". */
  scope: number | "school" | "all";
}

export const BLANK_FACETS: EventFacets = {
  search: "",
  type: "all",
  term: "all",
  scope: "all",
};
