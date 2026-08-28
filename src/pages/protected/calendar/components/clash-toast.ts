import { toast } from "sonner";

import type {
  CalendarEvent,
  WithWarnings,
} from "@/redux/services/calendar/calendar-types";

/**
 * The warnings a write came back with, each offering a way back to the event.
 *
 * A warning says the write SUCCEEDED and something about it is worth knowing -
 * it overlaps another entry, or it falls outside every term. Announcing that
 * and then leaving the reader to find the row again on another screen makes the
 * commonest response to it, "that was a mistake, let me fix it", the slowest.
 * So the toast carries the way back.
 *
 * `onEdit` is omitted for a reader who may not edit, and the toast is then
 * exactly what it was: a statement with nothing to press.
 */
export function warnAboutClashes(
  event: WithWarnings<CalendarEvent> | undefined,
  onEdit?: (event: CalendarEvent) => void,
) {
  for (const warning of event?.warnings ?? []) {
    toast.warning(warning.detail, {
      // Long enough to read a sentence and decide, rather than the default
      // few seconds - the whole point is that it can be acted on.
      duration: 10000,
      action:
        onEdit && event
          ? { label: "Edit", onClick: () => onEdit(event) }
          : undefined,
    });
  }
}
