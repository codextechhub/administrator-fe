import { describe, expect, it } from "vitest";

import { formatDate, titleCaseCode } from "./format";

describe("formatDate", () => {
  it("writes a date the way a person reads one", () => {
    expect(formatDate("2012-11-07")).toBe("7 Nov 2012");
  });

  it("does not shift the day west of Greenwich", () => {
    // The reason this is parsed by hand. `new Date("2012-01-01")` is UTC
    // midnight, and any renderer that then prints it in a negative-offset zone
    // shows 31 Dec 2011 - a birthday a day early, and a wrong date on a record
    // a school may have to produce.
    expect(formatDate("2012-01-01")).toBe("1 Jan 2012");
    expect(formatDate("2012-12-31")).toBe("31 Dec 2012");
  });

  it("reads a full timestamp as its date", () => {
    expect(formatDate("2026-08-30T15:08:45.042689Z")).toBe("30 Aug 2026");
  });

  it("says nothing rather than inventing a date", () => {
    expect(formatDate(null)).toBe("-");
    expect(formatDate("")).toBe("-");
  });

  it("hands back anything it cannot parse instead of showing NaN", () => {
    expect(formatDate("not a date")).toBe("not a date");
    expect(formatDate("2012-13-07")).toBe("2012-13-07");
  });
});

describe("titleCaseCode", () => {
  it("turns an enum code into a word", () => {
    expect(titleCaseCode("FEMALE")).toBe("Female");
    expect(titleCaseCode("LEGAL_GUARDIAN")).toBe("Legal Guardian");
  });

  it("is empty for an absent code, so a caller can fall back", () => {
    expect(titleCaseCode("")).toBe("");
    expect(titleCaseCode(null)).toBe("");
  });
});
