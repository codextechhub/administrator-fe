import type { Room, RoomType } from "@/redux/services/calendar/calendar-types";

// The room form's shape, and the two ways of filling it in. Split from the
// drawer so a screen can build a draft without importing a form.

export interface RoomDraft {
  name: string;
  code: string;
  room_type: RoomType;
  /** -1 means "not picked yet" at a multi-branch school. Never null: a room is
   *  a physical place, so it is always at exactly one branch. */
  branch: number;
  /** Kept as a string, so an empty box stays empty rather than becoming 0. */
  capacity: string;
  is_active: boolean;
}

export function blankRoom(branch: number | "all"): RoomDraft {
  return {
    name: "",
    code: "",
    room_type: "CLASSROOM",
    // A reader who has narrowed the lens to Lekki and pressed Add is adding a
    // Lekki room. On "all branches" there is nothing to guess from.
    branch: typeof branch === "number" ? branch : -1,
    capacity: "",
    is_active: true,
  };
}

export function roomDraftFrom(room: Room): RoomDraft {
  return {
    name: room.name,
    code: room.code ?? "",
    room_type: room.room_type,
    branch: room.branch ?? -1,
    capacity: room.capacity == null ? "" : String(room.capacity),
    is_active: room.is_active,
  };
}
