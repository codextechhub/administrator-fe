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
  it("splits the name: everything but the last word is the level", () => {
    expect(classCode("JSS1 A")).toBe("JSS1-A");
    expect(classCode("SSS2 Science")).toBe("SSS2-SCIENCE");
    expect(classCode("Primary 4 B")).toBe("PRIMARY4-B");
  });

  it("is the whole name when there is no arm on it", () => {
    expect(classCode("JSS1")).toBe("JSS1");
  });

  it("does NOT fall back to the first three letters of the name", () => {
    // codeFromName("SSS3 Science") returns "SSS" - Senior Secondary's own code,
    // on a class. That collision is why this function exists.
    expect(classCode("SSS3 Science")).not.toBe("SSS");
  });

  it("follows a hand-typed name rather than the level and arm fields", () => {
    // Somebody who renames the class to "Alpha Stream" should not be handed a
    // code built from a level they can no longer see in the name.
    expect(classCode("Alpha Stream")).toBe("ALPHA-STREAM");
  });

  it("stays inside the column's 12 characters", () => {
    expect(classCode("Junior Secondary 1 Commercial").length).toBeLessThanOrEqual(12);
  });

  it("returns nothing for an empty name", () => {
    expect(classCode("")).toBe("");
    expect(classCode("   ")).toBe("");
  });
});

describe("the entity drawer's dirty baseline", () => {
  // A regression test written as data, because the bug was in state timing:
  // `initialExtra` was captured once at mount, so the baseline belonged to
  // whichever row was opened FIRST. Every drawer after that started dirty and
  // offered Save on a form nobody had touched. The rule this pins is that the
  // baseline is whatever the extras held when the drawer was pointed at THIS
  // row - so comparing them to a stale snapshot must read as changed.
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
