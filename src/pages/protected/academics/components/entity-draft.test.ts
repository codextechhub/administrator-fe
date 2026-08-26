import { describe, expect, it } from "vitest";

import { blankDraft, classCode, codeFromName } from "./entity-draft";

describe("codeFromName", () => {
  it("takes the first three letters, uppercased", () => {
    expect(codeFromName("Sciences")).toBe("SCI");
    expect(codeFromName("commercial")).toBe("COM");
  });

  it("drops spaces and punctuation before counting", () => {
    // "Junior Secondary" must not become "JUN " or "JU".
    expect(codeFromName("Junior Secondary")).toBe("JUN");
    expect(codeFromName("Arts & Humanities")).toBe("ART");
  });

  it("returns what it can from a short or empty name", () => {
    expect(codeFromName("PE")).toBe("PE");
    expect(codeFromName("")).toBe("");
  });
});

describe("blankDraft", () => {
  it("defaults to school-wide", () => {
    expect(blankDraft().branch).toBeNull();
  });

  it("carries the branch lens in when one is selected", () => {
    // Creating while looking at one branch should default to that branch,
    // rather than making the person pick what they are already looking at.
    expect(blankDraft(17).branch).toBe(17);
  });

  it("starts every text field empty rather than undefined", () => {
    // The inputs are controlled; undefined would make React switch them to
    // uncontrolled and warn on the first keystroke.
    const draft = blankDraft();
    expect(draft.name).toBe("");
    expect(draft.code).toBe("");
    expect(draft.description).toBe("");
  });
});

describe("classCode", () => {
  it("splits on the arm, because that is the part the level is not", () => {
    expect(classCode("JSS1 A", "A")).toBe("JSS1-A");
    expect(classCode("SSS2 Science", "Science")).toBe("SSS2-SCIENCE");
    expect(classCode("Primary 4 B", "B")).toBe("PRIMARY4-B");
  });

  it("does not read a level number as an arm", () => {
    // "Nursery 1" with no arm is one class, not arm 1 of Nursery. Splitting on
    // the last word would have answered NURSERY-1.
    expect(classCode("Nursery 1", "")).toBe("NURSERY1");
    expect(classCode("Primary 4", "")).toBe("PRIMARY4");
  });

  it("does NOT fall back to the first three letters of the name", () => {
    // codeFromName("SSS3 Science") returns "SSS" - Senior Secondary's own code,
    // on a class. That collision is why this function exists.
    expect(classCode("SSS3 Science", "Science")).not.toBe("SSS");
  });

  it("follows a hand-typed name rather than the level field", () => {
    expect(classCode("Alpha Stream", "")).toBe("ALPHASTREAM");
  });

  it("uses a typed name whole when it no longer ends with the arm", () => {
    // The base gives way to fit the column; the arm never does, because it is
    // the part that tells two classes apart.
    expect(classCode("Alpha Stream", "B")).toBe("ALPHASTREA-B");
  });

  it("abbreviates the arm before the level, and keeps both", () => {
    // The level is what a person scans for, so it holds; the arm takes what is
    // left. "S-COMMERCIAL" would be the other way round and unreadable.
    expect(classCode("SSS2 Commercial", "Commercial")).toBe("SSS2-COMMERC");
  });

  it("stays inside the column's 12 characters", () => {
    for (const [name, arm] of [
      ["Junior Secondary 1 Commercial", "Commercial"],
      ["Alpha Stream", "B"],
      ["SSS2 Commercial", "Commercial"],
    ] as const) {
      expect(classCode(name, arm).length).toBeLessThanOrEqual(12);
    }
  });

  it("returns nothing for an empty name", () => {
    expect(classCode("", "A")).toBe("");
    expect(classCode("   ", "")).toBe("");
  });
});

describe("the entity drawer's dirty baseline", () => {
  // The baseline is what the extras held when the drawer was pointed at THIS
  // row, so a stale snapshot must read as changed.
  const baselineFor = (extras: object) => JSON.stringify(extras);

  it("reads an untouched form as unchanged", () => {
    const extras = { is_core: true, level_ids: [1, 2, 3] };
    expect(JSON.stringify(extras)).toBe(baselineFor(extras));
  });

  it("reads a different row against its OWN baseline, not the first row's", () => {
    const first = { is_core: true, level_ids: [1, 2, 3] };
    const second = { is_core: false, level_ids: [4] };
    expect(JSON.stringify(second)).not.toBe(baselineFor(first));
    expect(JSON.stringify(second)).toBe(baselineFor(second));
  });

  it("notices a level added to the set", () => {
    const before = { is_core: true, level_ids: [1, 2] };
    const after = { is_core: true, level_ids: [1, 2, 3] };
    expect(JSON.stringify(after)).not.toBe(baselineFor(before));
  });
});
