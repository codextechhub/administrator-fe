import { describe, expect, it } from "vitest";

import {
  activeFilterCount,
  board,
  clashingIds,
  filterOptions,
  filterPapers,
  isFiltered,
  NO_FILTERS,
} from "./paper-filters";
import type { ExamSlot } from "@/redux/services/calendar/calendar-types";

const paper = (over: Partial<ExamSlot> & { id: number }): ExamSlot => ({
  school_class: 1,
  class_name: "JSS1 A",
  subject: 10,
  subject_name: "Mathematics",
  exam_date: "2026-11-09",
  sitting: "MORNING",
  sitting_label: "Morning",
  start_time: null,
  end_time: null,
  room: 5,
  room_name: "Block A Room 1",
  invigilator: { id: 20, name: "Ngozi Eze" },
  ...over,
} as ExamSlot);

const SLOTS = [
  paper({ id: 1 }),
  paper({ id: 2, school_class: 2, class_name: "JSS1 B" }),
  paper({
    id: 3,
    school_class: 3,
    class_name: "JSS2 A",
    subject: 11,
    subject_name: "Physics",
    exam_date: "2026-11-10",
    sitting: "AFTERNOON",
    sitting_label: "Afternoon",
    room: null,
    room_name: null,
    invigilator: null,
  }),
];

describe("filterPapers", () => {
  const none = new Set<number>();

  it("returns everything when nothing is chosen", () => {
    expect(filterPapers(SLOTS, NO_FILTERS, none)).toHaveLength(3);
    expect(isFiltered(NO_FILTERS)).toBe(false);
  });

  it("treats two choices in one group as either", () => {
    const out = filterPapers(
      SLOTS,
      { ...NO_FILTERS, classes: [1, 3] },
      none,
    );
    expect(out.map((s) => s.id)).toEqual([1, 3]);
  });

  it("treats choices in two groups as both", () => {
    // Class JSS1 A (paper 1) and subject Physics (paper 3) share nothing.
    expect(
      filterPapers(SLOTS, { ...NO_FILTERS, classes: [1], subjects: [11] }, none),
    ).toEqual([]);
  });

  it("can find the papers with no room or nobody watching them", () => {
    // The question a school asks while chasing gaps before publishing, and the
    // one value a catalogue of rooms could never offer.
    expect(
      filterPapers(SLOTS, { ...NO_FILTERS, rooms: ["none"] }, none).map((s) => s.id),
    ).toEqual([3]);
    expect(
      filterPapers(SLOTS, { ...NO_FILTERS, invigilators: ["none"] }, none)
        .map((s) => s.id),
    ).toEqual([3]);
  });

  it("narrows to the papers a warning actually names", () => {
    const clashing = clashingIds([
      { code: "ROOM", detail: "…", slot_ids: [1, 2] },
    ]);
    expect(
      filterPapers(SLOTS, { ...NO_FILTERS, clashesOnly: true }, clashing)
        .map((s) => s.id),
    ).toEqual([1, 2]);
  });

  it("counts the groups that are narrowing, not the boxes ticked", () => {
    expect(activeFilterCount(NO_FILTERS)).toBe(0);
    expect(activeFilterCount({ ...NO_FILTERS, classes: [1, 2, 3] })).toBe(1);
    expect(
      activeFilterCount({ ...NO_FILTERS, classes: [1], clashesOnly: true }),
    ).toBe(2);
  });
});

describe("filterOptions", () => {
  it("offers only what is in the schedule", () => {
    const options = filterOptions(SLOTS);
    expect(options.classes.map((o) => o.label)).toEqual([
      "JSS1 A",
      "JSS1 B",
      "JSS2 A",
    ]);
    expect(options.subjects.map((o) => o.label)).toEqual([
      "Mathematics",
      "Physics",
    ]);
  });

  it("counts how many papers each option would keep", () => {
    const options = filterOptions(SLOTS);
    expect(options.subjects.find((o) => o.label === "Mathematics")?.count).toBe(2);
    expect(options.subjects.find((o) => o.label === "Physics")?.count).toBe(1);
  });

  it("names the empty room and the empty invigilator rather than dropping them", () => {
    const options = filterOptions(SLOTS);
    expect(options.rooms.find((o) => o.value === "none")?.label).toBe("Not set");
    expect(options.invigilators.find((o) => o.value === "none")?.label).toBe(
      "Not set",
    );
  });
});

describe("board", () => {
  it("lays the schedule out a day per row", () => {
    const laid = board(SLOTS);
    expect(laid.days.map((d) => d.date)).toEqual(["2026-11-09", "2026-11-10"]);
  });

  it("orders sittings by time of day, never by name", () => {
    // "AFTERNOON" sorts before "MORNING" lexically, which would invert every
    // day holding both.
    expect(board(SLOTS).sittings.map((s) => s.value)).toEqual([
      "MORNING",
      "AFTERNOON",
    ]);
  });

  it("gives every day the same columns, so the grid lines up", () => {
    const laid = board(SLOTS);
    for (const day of laid.days) {
      expect(day.cells.map((c) => c.sitting)).toEqual(["MORNING", "AFTERNOON"]);
    }
  });

  it("puts each paper in its own day and sitting", () => {
    const laid = board(SLOTS);
    const first = laid.days[0].cells;
    expect(first[0].papers.map((p) => p.id)).toEqual([1, 2]);
    expect(first[1].papers).toEqual([]);
    expect(laid.days[1].cells[1].papers.map((p) => p.id)).toEqual([3]);
  });

  it("offers no columns and no rows for an empty schedule", () => {
    expect(board([])).toEqual({ sittings: [], days: [] });
  });

  it("sorts the papers in a cell by class, so a reader can scan down them", () => {
    const laid = board([
      paper({ id: 9, class_name: "JSS3 A", school_class: 9 }),
      paper({ id: 8, class_name: "JSS1 A", school_class: 8 }),
    ]);
    expect(laid.days[0].cells[0].papers.map((p) => p.class_name)).toEqual([
      "JSS1 A",
      "JSS3 A",
    ]);
  });
});
