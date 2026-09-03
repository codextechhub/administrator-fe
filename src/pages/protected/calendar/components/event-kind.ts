import type { EventType } from "@/redux/services/calendar/calendar-types";

/**
 * How each kind of calendar entry looks, in one place.
 *
 * The server already sends `type_label` for every row, and that is what a list
 * SHOWS. What it cannot send is a colour, so this maps the six codes onto the
 * badge variants the rest of the app uses.
 *
 * The order here is the order the type picker offers, and it is not
 * alphabetical: it runs from the entries a school dates first and most often
 * (a public holiday, a mid-term break) to the ones it dates last.
 */

type BadgeVariant = "blue" | "amber" | "red" | "teal" | "green" | "inactive";

export const EVENT_KINDS: {
  value: EventType;
  label: string;
  variant: BadgeVariant;
}[] = [
  { value: "HOLIDAY", label: "Public holiday", variant: "red" },
  { value: "MIDTERM_BREAK", label: "Mid-term break", variant: "amber" },
  { value: "EXAM_PERIOD", label: "Exam period", variant: "blue" },
  { value: "SCHOOL_EVENT", label: "School event", variant: "teal" },
  { value: "PTA", label: "PTA", variant: "green" },
  { value: "SPORTS", label: "Sports day", variant: "inactive" },
];

const BY_VALUE = new Map(EVENT_KINDS.map((k) => [k.value, k]));

/**
 * The badge colour for a type.
 *
 * Falls back rather than throwing on a code this build has not heard of: the
 * server owns the list, and a school seeing a grey chip beside a correct label
 * is better than a screen that will not render.
 */
export function eventVariant(type: EventType | string): BadgeVariant {
  return BY_VALUE.get(type as EventType)?.variant ?? "inactive";
}

/** The label, for the few places that have a code and no row to read. */
export function eventLabel(type: EventType | string): string {
  return BY_VALUE.get(type as EventType)?.label ?? String(type);
}
