import { describe, expect, it } from "vitest";

import { blankDraft, codeFromName } from "./entity-draft";

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
