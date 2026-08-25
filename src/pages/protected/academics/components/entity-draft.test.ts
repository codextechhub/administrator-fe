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
  it("joins the level and the arm", () => {
    expect(classCode("JSS1", "A")).toBe("JSS1-A");
    expect(classCode("SSS2", "Science")).toBe("SSS2-SCIENCE");
  });

  it("is the level alone when there is no arm", () => {
    expect(classCode("Primary 4", "")).toBe("PRIMARY4");
  });

  it("does NOT fall back to the first three letters of the name", () => {
    // A class name starts with its level, so codeFromName("SSS3 Science")
    // returns "SSS" - Senior Secondary's own code, on a class. That collision
    // is the whole reason this function exists.
    expect(classCode("SSS3", "Science")).not.toBe("SSS");
  });

  it("stays inside the column's 12 characters", () => {
    expect(classCode("Junior Secondary 1", "Commercial").length).toBeLessThanOrEqual(12);
  });

  it("returns nothing when there is no level to build from", () => {
    expect(classCode("", "A")).toBe("");
  });
});
