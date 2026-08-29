import { routesPath } from "@/routes/routesPath";
import type { AlertCode, CalendarAlert } from "@/redux/services/calendar/calendar-types";
import type { OnboardingState } from "@/redux/services/onboarding/onboarding-types";

const R = routesPath.PROTECTED;

// ─────────────────────────────────────────────────────────────────────────────
// What the school has to do something about.
//
// The console's overview opens with a worklist rather than with numbers, and
// this is the school's version of it. The difference is where the items come
// from: the console has a task table and an approvals queue, and a school has
// neither. What a school has is a set of conditions the server already
// detects and already writes sentences about, scattered across three screens
// nobody visits until something has gone wrong.
//
// **Nothing here is computed from raw data.** Every sentence is the server's
// own, rendered verbatim, for the reason the calendar module records: the
// server knows which class has no timetable and which term overlaps which, and
// a second implementation on the client is a second answer that will disagree
// with the first one the day a rule changes.
//
// **Ordered by what it costs to be wrong, not by where it came from.** A school
// that cannot go live is stuck; a timetable with a clash means two classes
// expecting the same teacher on Monday; a class with no timetable at all means
// nobody knows where to be. An event dated outside every term is untidy. They
// are not the same size and the list must not present them as though they were.
// ─────────────────────────────────────────────────────────────────────────────

export type AttentionTone = "blocking" | "warning" | "info";

export interface AttentionItem {
  id: string;
  tone: AttentionTone;
  /** Rendered as written. Never assembled from parts here. */
  detail: string;
  /** Where to go and do something about it. */
  to: string;
  action: string;
}

/**
 * Rank per alert code, lower first.
 *
 * Written as a table rather than as an ordering function so that the judgement
 * is one readable list. A code this build has not heard of sorts last rather
 * than crashing: the server owns the list, and a school seeing a new warning at
 * the bottom is better than a screen that will not render.
 */
const ALERT_RANK: Record<AlertCode, number> = {
  SESSION_HAS_NO_TERMS: 1,
  TERM_DATES_OVERLAP: 2,
  TERM_OUTSIDE_SESSION: 3,
  TIMETABLE_HAS_CLASHES: 4,
  CLASS_HAS_NO_TIMETABLE: 5,
  EVENT_OUTSIDE_ANY_TERM: 6,
};

const ALERT_TONE: Record<AlertCode, AttentionTone> = {
  SESSION_HAS_NO_TERMS: "blocking",
  TERM_DATES_OVERLAP: "warning",
  TERM_OUTSIDE_SESSION: "warning",
  TIMETABLE_HAS_CLASHES: "warning",
  CLASS_HAS_NO_TIMETABLE: "warning",
  EVENT_OUTSIDE_ANY_TERM: "info",
};

const ALERT_TARGET: Record<AlertCode, { to: string; action: string }> = {
  SESSION_HAS_NO_TERMS: { to: R.ACADEMIC_STRUCTURE.SESSIONS, action: "Add terms" },
  TERM_DATES_OVERLAP: { to: R.ACADEMIC_STRUCTURE.SESSIONS, action: "Fix the dates" },
  TERM_OUTSIDE_SESSION: { to: R.ACADEMIC_STRUCTURE.SESSIONS, action: "Fix the dates" },
  TIMETABLE_HAS_CLASHES: { to: R.TIMETABLES.CLASSES, action: "Open the grid" },
  CLASS_HAS_NO_TIMETABLE: { to: R.TIMETABLES.CLASSES, action: "Build it" },
  EVENT_OUTSIDE_ANY_TERM: { to: R.ACADEMIC_CALENDAR.EVENTS, action: "Review it" },
};

export function buildAttention({
  alerts,
  onboarding,
  branchesWithoutSession,
}: {
  alerts?: CalendarAlert[];
  onboarding?: OnboardingState | null;
  branchesWithoutSession?: { id: number; name: string }[];
}): AttentionItem[] {
  const out: AttentionItem[] = [];

  // Going live comes first and is never merely a warning. A school that is
  // still PENDING is a school whose parents cannot be invited yet, and the
  // count is the server's own - `blocking_tasks` is what the gate reads.
  const blocking = onboarding?.blocking_tasks?.length ?? 0;
  if (onboarding && onboarding.go_live_blocked && blocking > 0) {
    out.push({
      id: "go-live",
      tone: "blocking",
      detail:
        blocking === 1
          ? "One required setup step is still outstanding, so this school cannot go live yet."
          : `${blocking} required setup steps are still outstanding, so this school cannot go live yet.`,
      to: R.ONBOARDING.INDEX,
      action: "Finish setup",
    });
  }

  // A branch in no live year at all. The academics module reports this rather
  // than defaulting it, because there is no correct year to guess for a branch
  // opened mid-session, and a guess would put a term on a branch that never ran
  // it.
  for (const branch of branchesWithoutSession ?? []) {
    out.push({
      id: `branch-${branch.id}`,
      tone: "blocking",
      detail: `${branch.name} is not in any academic year, so nothing can be scheduled for it.`,
      to: R.ACADEMIC_STRUCTURE.SESSIONS,
      action: "Give it a year",
    });
  }

  const sorted = [...(alerts ?? [])].sort(
    (a, b) => (ALERT_RANK[a.code] ?? 99) - (ALERT_RANK[b.code] ?? 99),
  );
  for (const alert of sorted) {
    const target = ALERT_TARGET[alert.code];
    out.push({
      id: `${alert.code}-${alert.ids.join("-") || "all"}`,
      tone: ALERT_TONE[alert.code] ?? "info",
      detail: alert.detail,
      to: target?.to ?? R.ACADEMIC_CALENDAR.INDEX,
      action: target?.action ?? "Take a look",
    });
  }

  return out;
}
