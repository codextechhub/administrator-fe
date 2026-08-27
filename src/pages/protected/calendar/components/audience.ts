import type { EventAudience } from "@/redux/services/calendar/calendar-types";

// The audience as data rather than as a control. Split from the picker so that
// the table and the view drawer can read an event's audience without importing
// a form, and so the picker file exports components only.

export type AudiencePick = { type: "level" | "class"; id: number };

/** The rows a read gives back, as the picker's own shape. */
export function toPicks(rows?: EventAudience[]): AudiencePick[] {
  return (rows ?? []).map((r) => ({ type: r.type, id: r.id }));
}

/**
 * The audience as one line, for a table cell and the view drawer.
 *
 * Empty when the event covers everybody, rather than the word "Everybody": a
 * Scope column where most rows say nothing extra is a column where the narrowed
 * ones stand out, which is the whole point of showing it.
 */
export function audienceLine(rows?: EventAudience[]): string {
  if (!rows?.length) return "";
  const names = rows.map((r) => r.name);
  if (names.length <= 3) return names.join(", ");
  return `${names.slice(0, 2).join(", ")} and ${names.length - 2} more`;
}
