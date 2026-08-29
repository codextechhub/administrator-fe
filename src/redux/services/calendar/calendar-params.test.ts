import { describe, expect, it } from "vitest";

import {
  branchParam,
  eventParams,
  examParams,
  periodParams,
  roomParams,
  sessionParam,
  teacherParams,
} from "./calendar-params";

// The failure these pin is not a wrong list, it is a PLAUSIBLE one. A dropped
// session param returns last year's bell schedule, which looks like a bell
// schedule; a dropped branch param returns Ikeja's rooms to a Lekki admin,
// which looks like rooms. Nothing on screen says otherwise, so nothing but a
// test catches it.
describe("the branch lens", () => {
  it("sends a branch id", () => {
    expect(branchParam(7)).toEqual({ branch: 7 });
  });

  it('sends nothing for "all" or for undefined', () => {
    // Not the same as sending `branch=all`: the server reads that as a literal
    // branch reference and answers 404. Absent IS "every branch I can see".
    expect(branchParam("all")).toEqual({});
    expect(branchParam(undefined)).toEqual({});
  });
});

describe("the session lens", () => {
  it("sends a session id", () => {
    expect(sessionParam(3)).toEqual({ session: 3 });
  });

  it("sends nothing when no year is named, so the server picks the active one", () => {
    expect(sessionParam()).toEqual({});
    expect(sessionParam(undefined)).toEqual({});
  });
});

describe("event list params", () => {
  it("carries both lenses without being asked twice", () => {
    expect(eventParams({ branch: 2, session: 9 })).toEqual({ branch: 2, session: 9 });
  });

  it("drops every facet set to all", () => {
    expect(
      eventParams({ branch: "all", type: "all", term: "all", scope: "all" }),
    ).toEqual({});
  });

  it("keeps scope=school, which is not a branch id", () => {
    // The shared-row filter. The server reads it as `branch IS NULL`, so it
    // must survive the same pass that drops "all".
    expect(eventParams({ scope: "school" })).toEqual({ scope: "school" });
  });

  it("trims a search and drops an empty one", () => {
    expect(eventParams({ search: "  sports  " })).toEqual({ search: "sports" });
    expect(eventParams({ search: "   " })).toEqual({});
  });

  it("sends the date window the month grid asks with", () => {
    expect(eventParams({ from: "2025-11-01", to: "2025-11-30" })).toEqual({
      from: "2025-11-01",
      to: "2025-11-30",
    });
  });

  it("omits page 1", () => {
    expect(eventParams({ page: 1 })).toEqual({});
    expect(eventParams({ page: 2 })).toEqual({ page: 2 });
  });
});

describe("room list params", () => {
  it("sends nothing for status when the filter is All statuses", () => {
    expect(roomParams({})).toEqual({});
  });

  it("sends the status when one is chosen", () => {
    expect(roomParams({ active: "false" })).toEqual({ active: "false" });
  });

  it("does not send a session, because a room outlives the year", () => {
    // Rooms are the one thing in this module with no session column. Sending
    // one would be a filter the server ignores and a reader would trust.
    expect(Object.keys(roomParams({ branch: 4, search: "lab" }))).toEqual([
      "branch",
      "search",
    ]);
  });
});

describe("bell schedule params", () => {
  it('drops day="all", which is the whole table', () => {
    expect(periodParams({ day: "all" })).toEqual({});
  });

  it("sends a weekday as its ISO number", () => {
    // Asking for Friday does not filter the column: it returns the periods in
    // force on Friday, which is the everyday schedule unless Friday has its own.
    expect(periodParams({ day: 5 })).toEqual({ day: 5 });
  });

  it("carries the session, because a bell schedule belongs to one year", () => {
    expect(periodParams({ session: 3, day: 1 })).toEqual({ session: 3, day: 1 });
  });
});

describe("teacherParams", () => {
  it("sends the branch, because the LIST is a per-branch question", () => {
    expect(teacherParams({ branch: 4, session: 9 })).toEqual({
      branch: 4,
      session: 9,
    });
  });

  it("drops the branch when the lens is on every branch", () => {
    expect(teacherParams({ branch: "all", session: 9 })).toEqual({ session: 9 });
  });

  it("trims a search and omits an empty one", () => {
    expect(teacherParams({ search: "  eze " })).toEqual({ search: "eze" });
    expect(teacherParams({ search: "   " })).toEqual({});
  });
});

describe("examParams", () => {
  it("sends the branch even though an exam has no branch column", () => {
    // The server reads the scope from the exam period on the calendar. The
    // client sends the lens the same way it does everywhere else.
    expect(examParams({ branch: 2, session: 7 })).toEqual({
      branch: 2,
      session: 7,
    });
  });

  it("drops the branch when the lens is on every branch", () => {
    expect(examParams({ branch: "all" })).toEqual({});
  });
});
