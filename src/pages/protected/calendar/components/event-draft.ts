import type {
  CalendarEvent,
  EventType,
} from "@/redux/services/calendar/calendar-types";
import type { AudiencePick } from "./audience";
import { toPicks } from "./audience";

// The event form's own shape, and the two ways of filling it in. Split from the
// drawer so the screens can build a draft without importing a form.

export interface EventDraft {
  name: string;
  event_type: EventType;
  start_date: string;
  end_date: string;
  closes_school: boolean;
  description: string;
  /** Null is school-wide. -1 means "one branch" chosen with none named yet. */
  branch: number | null;
  audience: AudiencePick[];
}

/**
 * A blank event.
 *
 * Seeded with the branch currently in the lens, because a reader who has
 * narrowed to Lekki and pressed Add is adding a Lekki event. `null` when the
 * lens is on all branches, which is school-wide and the common case.
 */
export function blankEvent(branch: number | null): EventDraft {
  return {
    name: "",
    event_type: "HOLIDAY",
    start_date: "",
    end_date: "",
    closes_school: false,
    description: "",
    branch,
    audience: [],
  };
}

export function draftFrom(event: CalendarEvent): EventDraft {
  return {
    name: event.name,
    event_type: event.event_type,
    start_date: event.start_date,
    end_date: event.end_date,
    closes_school: event.closes_school,
    description: event.description ?? "",
    branch: event.branch ?? null,
    audience: toPicks(event.audience),
  };
}
