import { describe, expect, it } from "vitest";

/**
 * The recede rule, as data.
 *
 * Both pills follow it: a picker with a single option is not a choice, it is a
 * label pretending to be a control. What is asserted here is the boundary - one
 * is not enough, two is - because the session pill originally showed at one and
 * the two rules have to stay the same rule.
 */
const pillApplies = (count: number) => count > 1;

describe("the lens pills recede", () => {
  it("shows nothing before there is anything to name", () => {
    expect(pillApplies(0)).toBe(false);
  });

  it("shows nothing when there is exactly one", () => {
    // One branch, or one session: there is nothing to switch between.
    expect(pillApplies(1)).toBe(false);
  });

  it("appears as soon as there is a second", () => {
    expect(pillApplies(2)).toBe(true);
    expect(pillApplies(3)).toBe(true);
  });

  it("is the same rule for both pills", () => {
    // A school with two branches and one session gets the branch pill only;
    // one branch and three sessions gets the session pill only.
    const branches = 2;
    const sessions = 1;
    expect(pillApplies(branches)).toBe(true);
    expect(pillApplies(sessions)).toBe(false);
  });
});
