import type { ClashWarning, ExamSlot } from "@/redux/services/calendar/calendar-types";

/**
 * Narrowing an exam schedule.
 *
 * A school's exam period is one or two weeks of papers across every class it
 * runs, which is a hundred rows for a school of any size. The questions people
 * actually arrive with are narrow ones - "what is JSS1 A sitting", "who is in
 * the Main Hall on Thursday", "which of these still clash" - and a flat list
 * answers none of them without scrolling.
 *
 * **The options come from the papers, never from a catalogue.** Offering every
 * class in the school is offering filters that return nothing: a school of
 * forty classes may have entered papers for six of them so far. What is on the
 * list is what is in the schedule.
 *
 * **Filters compose, and each one is a set.** Picking two classes means either;
 * picking a class and a room means both. That is what a reader means by ticking
 * two boxes in one group and one box in two.
 */

export interface PaperFilters {
  classes: number[];
  subjects: number[];
  rooms: (number | "none")[];
  invigilators: (number | "none")[];
  sittings: string[];
  dates: string[];
  /** Only the papers named in a warning. */
  clashesOnly: boolean;
}

export const NO_FILTERS: PaperFilters = {
  classes: [],
  subjects: [],
  rooms: [],
  invigilators: [],
  sittings: [],
  dates: [],
  clashesOnly: false,
};

export function isFiltered(filters: PaperFilters): boolean {
  return (
    filters.classes.length > 0 ||
    filters.subjects.length > 0 ||
    filters.rooms.length > 0 ||
    filters.invigilators.length > 0 ||
    filters.sittings.length > 0 ||
    filters.dates.length > 0 ||
    filters.clashesOnly
  );
}

/** How many groups are narrowing, for the badge on the filter control. */
export function activeFilterCount(filters: PaperFilters): number {
  return (
    Number(filters.classes.length > 0) +
    Number(filters.subjects.length > 0) +
    Number(filters.rooms.length > 0) +
    Number(filters.invigilators.length > 0) +
    Number(filters.sittings.length > 0) +
    Number(filters.dates.length > 0) +
    Number(filters.clashesOnly)
  );
}

/**
 * The ids of every paper named in a warning.
 *
 * The server sends `slot_ids` with each one precisely so a screen can point at
 * the rows; this is that, flattened.
 */
export function clashingIds(warnings: ClashWarning[] | undefined): Set<number> {
  const out = new Set<number>();
  for (const warning of warnings ?? []) {
    for (const id of warning.slot_ids ?? []) out.add(id);
  }
  return out;
}

export function filterPapers(
  slots: ExamSlot[],
  filters: PaperFilters,
  clashing: Set<number>,
): ExamSlot[] {
  return slots.filter((slot) => {
    if (filters.classes.length && !filters.classes.includes(slot.school_class)) {
      return false;
    }
    if (filters.subjects.length && !filters.subjects.includes(slot.subject)) {
      return false;
    }
    if (filters.rooms.length && !filters.rooms.includes(slot.room ?? "none")) {
      return false;
    }
    if (
      filters.invigilators.length &&
      !filters.invigilators.includes(slot.invigilator?.id ?? "none")
    ) {
      return false;
    }
    if (filters.sittings.length && !filters.sittings.includes(slot.sitting)) {
      return false;
    }
    if (filters.dates.length && !filters.dates.includes(slot.exam_date)) {
      return false;
    }
    if (filters.clashesOnly && !clashing.has(slot.id)) return false;
    return true;
  });
}

export interface FilterOption {
  value: number | string;
  label: string;
  count: number;
}

function tally(
  slots: ExamSlot[],
  key: (slot: ExamSlot) => { value: number | string; label: string } | null,
): FilterOption[] {
  const seen = new Map<number | string, FilterOption>();
  for (const slot of slots) {
    const entry = key(slot);
    if (!entry) continue;
    const found = seen.get(entry.value);
    if (found) found.count += 1;
    else seen.set(entry.value, { ...entry, count: 1 });
  }
  return [...seen.values()].sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Everything worth filtering by, taken from the papers themselves.
 *
 * "Not set" is offered for a room and an invigilator because it is a real and
 * useful question - a school chasing the gaps before publishing wants exactly
 * the papers with nobody watching them - and because it is the one value a
 * catalogue could never supply.
 */
export function filterOptions(slots: ExamSlot[]) {
  return {
    classes: tally(slots, (s) => ({ value: s.school_class, label: s.class_name })),
    subjects: tally(slots, (s) => ({ value: s.subject, label: s.subject_name })),
    rooms: tally(slots, (s) => ({
      value: s.room ?? "none",
      label: s.room_name ?? "Not set",
    })),
    invigilators: tally(slots, (s) => ({
      value: s.invigilator?.id ?? "none",
      label: s.invigilator?.name ?? "Not set",
    })),
    sittings: tally(slots, (s) => ({ value: s.sitting, label: s.sitting_label })),
  };
}

/**
 * The schedule as a school would post it: a row per day, a column per sitting.
 *
 * Days down and sittings across rather than the other way round, because an
 * exam period is one or two WEEKS and only ever two or three sittings. Days
 * across would need a dozen columns and horizontal scrolling to read a
 * timetable that fits comfortably down a page.
 *
 * Only days that hold papers, and only sittings that are used. An empty
 * Saturday column on every row is furniture.
 */
export function board(slots: ExamSlot[]) {
  const sittings: { value: string; label: string }[] = [];
  const byDay = new Map<string, Map<string, ExamSlot[]>>();

  for (const slot of slots) {
    if (!sittings.some((s) => s.value === slot.sitting)) {
      sittings.push({ value: slot.sitting, label: slot.sitting_label });
    }
    let day = byDay.get(slot.exam_date);
    if (!day) {
      day = new Map();
      byDay.set(slot.exam_date, day);
    }
    const cell = day.get(slot.sitting);
    if (cell) cell.push(slot);
    else day.set(slot.sitting, [slot]);
  }

  // Sittings rank by time of day, never by name: "AFTERNOON" sorts before
  // "MORNING" lexically, which would invert every day holding both. The server
  // says the same thing in SITTING_RANK, for the same reason.
  const RANK: Record<string, number> = { MORNING: 0, AFTERNOON: 1, EVENING: 2 };
  sittings.sort((a, b) => (RANK[a.value] ?? 9) - (RANK[b.value] ?? 9));

  const days = [...byDay.keys()].sort();
  return {
    sittings,
    days: days.map((date) => ({
      date,
      cells: sittings.map((sitting) => ({
        sitting: sitting.value,
        papers: (byDay.get(date)?.get(sitting.value) ?? []).sort((a, b) =>
          a.class_name.localeCompare(b.class_name),
        ),
      })),
    })),
  };
}
