import { describe, expect, it } from "vitest";

import { markLabel } from "./school-mark-label";

// The rule is a judgement about a real range of school names, so it is argued
// here in cases rather than asserted once. Nigerian school names run long -
// "Government Comprehensive Secondary School" is a whole category - and the
// back of the mark is 150px wide.
describe("markLabel", () => {
  it("writes the name when the name fits", () => {
    expect(markLabel("Holy Cross College", "holy-cross")).toBe(
      "Holy Cross College",
    );
    expect(markLabel("Brightfield Schools", "brightfield")).toBe(
      "Brightfield Schools",
    );
  });

  it("replaces a long name with the slug rather than cutting it", () => {
    // 46 characters. Truncated it would read "Government Comprehensive Secondar…",
    // which is a phrase cut mid-word and is not the school's name. The slug is
    // what sits in their address bar every day.
    expect(
      markLabel("Government Comprehensive Secondary School Ikeja", "gcss-ikeja"),
    ).toBe("gcss-ikeja");
  });

  it("keeps the long name when there is no slug to fall back to", () => {
    // Clamped to two lines by CSS. A cut name still beats an empty box.
    const long = "Government Comprehensive Secondary School Ikeja";
    expect(markLabel(long, "")).toBe(long);
    expect(markLabel(long, null)).toBe(long);
  });

  it("falls back to the slug when the name is missing", () => {
    expect(markLabel("", "holy-cross")).toBe("holy-cross");
    expect(markLabel(null, "holy-cross")).toBe("holy-cross");
    expect(markLabel(undefined, "holy-cross")).toBe("holy-cross");
  });

  it("ignores surrounding whitespace rather than counting it", () => {
    expect(markLabel("  Holy Cross College  ", "holy-cross")).toBe(
      "Holy Cross College",
    );
    expect(markLabel("   ", "holy-cross")).toBe("holy-cross");
  });

  it("has nothing to say when the school has neither", () => {
    expect(markLabel(null, null)).toBe("");
  });
});
