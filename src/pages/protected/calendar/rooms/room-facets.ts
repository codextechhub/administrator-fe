import type { RoomType } from "@/redux/services/calendar/calendar-types";

/** What this screen filters on. The branch comes from the lens, not from here. */
export interface RoomFacets {
  search: string;
  type: RoomType | "all";
  /** Omitted means every status, which is what "All statuses" sends. */
  active: "true" | "false" | "all";
}

export const BLANK_ROOM_FACETS: RoomFacets = {
  search: "",
  type: "all",
  active: "all",
};
