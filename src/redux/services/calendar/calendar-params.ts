// ─────────────────────────────────────────────────────────────────────────────
// Every query param this module sends, built in one place.
//
// Separate from calendar-api.ts so the rules can be asserted without pulling the
// whole store and api graph into a test, and because they are the rules a screen
// must not be trusted to remember. Two of them are load-bearing:
//
//   1. **The lens is applied here, never at a call site.** Every row in this
//      module belongs to one branch scope and one school year. A screen that
//      forgets either shows another branch's rooms, or last year's bell
//      schedule, with nothing on screen to say so.
//
//   2. **"all" is dropped, not sent.** The server's default IS every branch the
//      caller may see, and `branch=all` would be read as a literal branch
//      reference and answer 404.
// ─────────────────────────────────────────────────────────────────────────────
import type { EventListArgs, PeriodListArgs, RoomListArgs } from "./calendar-types";

export type Params = Record<string, string | number>;

/** The branch lens. Undefined and "all" both mean "every branch I can see". */
export function branchParam(branch: number | "all" | undefined): Params {
  if (branch === undefined || branch === "all") return {};
  return { branch };
}

/** The session lens. Omitted means the school's active year, which is right. */
export function sessionParam(session?: number): Params {
  return session ? { session } : {};
}

export function eventParams(args: EventListArgs = {}): Params {
  const { branch, session, search, type, term, scope, from, to, page } = args;
  return {
    ...branchParam(branch),
    ...sessionParam(session),
    ...(search?.trim() ? { search: search.trim() } : {}),
    ...(type && type !== "all" ? { type } : {}),
    // A term is a date range on the server, not a column: an event "in First
    // Term" is one whose dates fall inside it. Storing the term on the row
    // would give a school two truths the day a term's dates were corrected.
    ...(term && term !== "all" ? { term } : {}),
    // "school" is not a branch id. It is the shared-row filter, and the server
    // reads it as `branch IS NULL`.
    ...(scope && scope !== "all" ? { scope } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
    ...(page && page > 1 ? { page } : {}),
  };
}

export function roomParams(args: RoomListArgs = {}): Params {
  const { branch, search, type, active, page } = args;
  return {
    ...branchParam(branch),
    ...(search?.trim() ? { search: search.trim() } : {}),
    ...(type ? { type } : {}),
    // Omitted is every status, which is what the design's default filter shows.
    // Sending nothing is how "All statuses" is expressed.
    ...(active ? { active } : {}),
    ...(page && page > 1 ? { page } : {}),
  };
}

/**
 * The teacher picker.
 *
 * **The list takes the branch lens; a teacher's grid never does.** They are
 * different questions. "Who are my teachers" is answerable per branch and a
 * branch admin wants it answered that way. "What is Mr Eze's week" is not: he
 * teaches at Lekki on Monday to Wednesday and at Ikeja on Thursday and Friday,
 * and a week filtered to Lekki shows three lessons and two free days, which is
 * how Lekki books a Thursday that Ikeja already has. There is deliberately no
 * `teacherGridParams`.
 */
export function teacherParams(
  args: { search?: string; session?: number; branch?: number | "all" } = {},
): Params {
  return {
    ...branchParam(args.branch),
    ...sessionParam(args.session),
    ...(args.search?.trim() ? { search: args.search.trim() } : {}),
  };
}

/**
 * The exam timetables.
 *
 * An exam carries no branch of its own: it hangs off an exam period on the
 * calendar, and the server reads the scope from there. So the lens is sent the
 * same way as everywhere else and the server does the indirection.
 */
export function examParams(
  args: { session?: number; branch?: number | "all" } = {},
): Params {
  return {
    ...branchParam(args.branch),
    ...sessionParam(args.session),
  };
}

export function periodParams(args: PeriodListArgs = {}): Params {
  const { branch, session, day, is_active } = args;
  return {
    ...branchParam(branch),
    ...sessionParam(session),
    // Not a filter on the column. Asking for a day returns the periods in
    // FORCE that day, and a day with rows of its own runs only those.
    ...(day && day !== "all" ? { day } : {}),
    ...(is_active ? { is_active } : {}),
  };
}
