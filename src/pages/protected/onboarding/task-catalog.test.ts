import { describe, expect, it } from "vitest";
import { taskMeta } from "./task-catalog";

describe("taskMeta", () => {
  it("marks academic structure as the step nobody can verify", () => {
    const meta = taskMeta("ACADEMIC_STRUCTURE");
    expect(meta.attested).toBe(true);
  });

  it("does not claim the platform-verified steps are self-attested", () => {
    for (const key of [
      "FIRST_ADMIN",
      "ROLE_BASELINE",
      "SCHOOL_METADATA",
      "SET_OF_BOOKS",
      "INITIAL_DATA",
      "STAFF_INVITATIONS",
    ]) {
      expect(taskMeta(key).attested).toBeUndefined();
    }
  });

  it("still returns a usable card for a catalog key this build has never seen", () => {
    // The catalog is a server constant: a step added there ships before this
    // file knows about it, and the school must still get a readable card.
    const meta = taskMeta("SOME_FUTURE_STEP");
    expect(meta.description.length).toBeGreaterThan(0);
    expect(meta.icon).toBeTruthy();
  });
});
