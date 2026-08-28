import type { CalendarEvent } from "@/redux/services/calendar/calendar-types";
import { formatRange } from "./dates";

/**
 * What removing an event does, said before the press rather than after it.
 *
 * Shared by the Events screen and the calendar's day box, because the same
 * deletion reached from two places must not be described two ways - and the
 * three cases genuinely differ:
 *
 *   * an exam period has a timetable hanging off it and the server PROTECTs it
 *     while papers reference it, so this one may not happen at all;
 *   * a closure is holding days out of the teaching-day count, and removing it
 *     puts them back - a number elsewhere moves;
 *   * anything else just goes.
 */
export function eventDeleteBody(event: CalendarEvent | null): string {
  if (!event) return "";
  const when = formatRange(event.start_date, event.end_date);
  if (event.event_type === "EXAM_PERIOD") {
    return `${event.name} runs ${when}, and an exam timetable can hang off it. If papers are already scheduled inside it, this will be refused and nothing will change.`;
  }
  if (event.closes_school) {
    return `${event.name} runs ${when} and currently marks those days non-teaching. Removing it puts them back into the teaching-day count.`;
  }
  return `${event.name} runs ${when}. It comes off the calendar for everyone.`;
}
