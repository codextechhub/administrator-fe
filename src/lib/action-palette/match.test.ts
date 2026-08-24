import { describe, expect, it } from "vitest";
import { scoreAction, TIER } from "./match";
import { TEST_ACTIONS, testAction } from "./test-actions";

// Best-matching action id for a query across the fixture registry (no gating).
function topMatch(query: string): string | null {
  const scored = TEST_ACTIONS.map((action) => ({ action, m: scoreAction(action, query) }))
    .filter((x) => x.m)
    .sort((a, b) => b.m!.tier - a.m!.tier || b.m!.score - a.m!.score || a.action.label.localeCompare(b.action.label));
  return scored[0]?.action.id ?? null;
}

function matchesInclude(query: string, id: string): boolean {
  return TEST_ACTIONS.some((a) => a.id === id && scoreAction(a, query));
}

describe("scoreAction - tiers", () => {
  it("exact label is the top tier", () => {
    expect(scoreAction(testAction("view-home"), "view home")?.tier).toBe(TIER.EXACT);
  });
  it("prefix beats initials beats substring", () => {
    expect(scoreAction(testAction("view-home"), "view h")?.tier).toBe(TIER.PREFIX);
    expect(scoreAction(testAction("view-home"), "v h")?.tier).toBe(TIER.INITIALS);
  });
  it("returns null for no match", () => {
    expect(scoreAction(testAction("view-home"), "zzzzz")).toBeNull();
  });
  it("empty query never matches", () => {
    expect(scoreAction(testAction("view-home"), "   ")).toBeNull();
  });
  it("substring ignores spaces: 'feeinv' finds View fee invoices", () => {
    expect(scoreAction(testAction("view-fee-invoices"), "feeinv")?.tier).toBe(TIER.SUBSTRING);
  });
});

describe("scoreAction - token / initials matching", () => {
  it("'vi ho' matches View home", () => {
    expect(matchesInclude("vi ho", "view-home")).toBe(true);
  });
  it("'vi m-p' and 'vi m p' both match View my profile", () => {
    expect(matchesInclude("vi m-p", "view-my-profile")).toBe(true);
    expect(matchesInclude("vi m p", "view-my-profile")).toBe(true);
  });
  it("'en st' matches Enroll student", () => {
    expect(matchesInclude("en st", "enroll-student")).toBe(true);
  });
  it("tokens may skip words: 'v inv' matches View fee invoices", () => {
    expect(matchesInclude("v inv", "view-fee-invoices")).toBe(true);
  });
  it("single letter 'v' matches view actions via initials", () => {
    expect(matchesInclude("v", "view-home")).toBe(true);
    expect(matchesInclude("v", "view-students")).toBe(true);
  });
});

describe("scoreAction - verb synonyms", () => {
  it("'open home' matches View home", () => {
    expect(matchesInclude("open home", "view-home")).toBe(true);
  });
  it("'add student' / 'register student' match Enroll student via its alias", () => {
    expect(matchesInclude("add student", "enroll-student")).toBe(true);
    expect(matchesInclude("register student", "enroll-student")).toBe(true);
  });
  it("'post payment' matches Record fee payment", () => {
    expect(matchesInclude("post payment", "record-fee-payment")).toBe(true);
  });
  it("a one-word label gets no verb expansion", () => {
    // "Logout" is a single word, so there is no trailing phrase to re-verb.
    expect(matchesInclude("create logout", "logout")).toBe(false);
  });
});

describe("scoreAction - ranking", () => {
  it("a full label ranks its own action first", () => {
    expect(topMatch("view students")).toBe("view-students");
  });
  it("an alias hit wins over a mere substring hit elsewhere", () => {
    // "calendar" is an exact alias of the academic calendar, and only a
    // substring of its own label - the alias tier decides it.
    expect(topMatch("calendar")).toBe("view-academic-calendar");
  });
  it("a label match outranks an alias match at the same tier", () => {
    const label = scoreAction(testAction("view-home"), "view home")!;
    const alias = scoreAction(testAction("view-fee-invoices"), "invoices")!;
    expect(label.tier).toBe(alias.tier);
    expect(label.score).toBeGreaterThan(alias.score);
  });
});
