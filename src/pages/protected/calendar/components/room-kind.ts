import {
  Dumbbell,
  FlaskConical,
  Library,
  Presentation,
  Shapes,
  Theater,
  type LucideIcon,
} from "lucide-react";

import type { RoomType } from "@/redux/services/calendar/calendar-types";

/**
 * What each kind of room is called, and what it looks like.
 *
 * One list, read by the card, the drawer and the filter. There were three of
 * these - two spelling out the same six labels and a card that spelled out
 * none - which is how a seventh room type would have been added in two places
 * and missed in the third.
 *
 * **The icon carries the type on a card; it never carries it alone anywhere
 * else.** A flask is only obvious once you already know the scheme, so every
 * use pairs it with the label or with an accessible name. The table keeps its
 * words, and the card's icon is titled.
 *
 * Chosen to be distinguishable at 16px from each other rather than to be the
 * most literal drawing of each thing: a dumbbell for sports rather than a
 * volleyball, because it does not imply one game; shapes for Other, because it
 * deliberately implies nothing.
 */

export const ROOM_KINDS: {
  value: RoomType;
  label: string;
  icon: LucideIcon;
}[] = [
  { value: "CLASSROOM", label: "Classroom", icon: Presentation },
  { value: "LABORATORY", label: "Laboratory", icon: FlaskConical },
  { value: "HALL", label: "Hall", icon: Theater },
  { value: "LIBRARY", label: "Library", icon: Library },
  { value: "SPORTS", label: "Sports", icon: Dumbbell },
  { value: "OTHER", label: "Other", icon: Shapes },
];

const BY_VALUE = new Map(ROOM_KINDS.map((k) => [k.value, k]));

/**
 * The icon for a room type.
 *
 * Falls back rather than throwing on a type this build has not heard of: the
 * server owns the list, and a school seeing the generic mark beside a correct
 * label is better than a screen that will not render.
 */
export function roomIcon(type: RoomType | string): LucideIcon {
  return BY_VALUE.get(type as RoomType)?.icon ?? Shapes;
}

/** The label, for the few places holding a code and no row to read. */
export function roomLabel(type: RoomType | string): string {
  return BY_VALUE.get(type as RoomType)?.label ?? String(type);
}
