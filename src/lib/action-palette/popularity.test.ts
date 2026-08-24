import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadFrecencyScores, loadPopularity, recordPick } from "./popularity";

const DAY = 24 * 60 * 60 * 1000;
const T0 = Date.UTC(2026, 0, 1);

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("adaptive picks", () => {
  it("cold start scores everything zero", () => {
    const model = loadPopularity("u1", T0);
    expect(model.scoreFor("view-students", "stu")).toBe(0);
  });

  it("the exact query the user picked under gets the strongest boost", () => {
    recordPick("u1", "view-students", "stu", T0);
    const model = loadPopularity("u1", T0);
    expect(model.scoreFor("view-students", "stu")).toBeGreaterThan(
      model.scoreFor("view-students", "stud"),
    );
  });

  it("a prefix-overlapping query gets a weaker boost, an unrelated one gets none", () => {
    recordPick("u1", "view-students", "stu", T0);
    const model = loadPopularity("u1", T0);
    // "stud" overlaps "stu", so it inherits part of the pick.
    expect(model.scoreFor("view-students", "stud")).toBeGreaterThan(
      model.scoreFor("view-students", "fees"),
    );
    // An action that was never picked gains nothing from someone else's pick.
    expect(model.scoreFor("view-fee-invoices", "stu")).toBe(0);
  });

  it("queries are normalised for case and spacing", () => {
    recordPick("u1", "view-students", "  View   Students ", T0);
    const model = loadPopularity("u1", T0);
    expect(model.scoreFor("view-students", "view students")).toBeGreaterThan(0);
  });

  it("picks are per user", () => {
    recordPick("u1", "view-students", "stu", T0);
    expect(loadPopularity("u2", T0).scoreFor("view-students", "stu")).toBe(0);
  });

  it("an empty query records frecency but no adaptive bucket", () => {
    recordPick("u1", "view-students", "   ", T0);
    expect(loadFrecencyScores("u1", T0)["view-students"]).toBe(1);
    expect(localStorage.getItem("action-palette:v1:u1:adaptive")).toBeNull();
  });
});

describe("frecency decay", () => {
  it("counts up and decays by half over the half-life", () => {
    recordPick("u1", "view-students", "stu", T0);
    recordPick("u1", "view-students", "stu", T0);
    expect(loadFrecencyScores("u1", T0)["view-students"]).toBe(2);
    expect(loadFrecencyScores("u1", T0 + 14 * DAY)["view-students"]).toBeCloseTo(1, 6);
    expect(loadFrecencyScores("u1", T0 + 28 * DAY)["view-students"]).toBeCloseTo(0.5, 6);
  });

  it("a recent action outranks a stale but more-used one", () => {
    recordPick("u1", "stale", "", T0);
    recordPick("u1", "stale", "", T0);
    recordPick("u1", "stale", "", T0);
    recordPick("u1", "fresh", "", T0 + 60 * DAY);
    const scores = loadFrecencyScores("u1", T0 + 60 * DAY);
    expect(scores["fresh"]).toBeGreaterThan(scores["stale"]);
  });

  it("frecency lifts an action even for a query it was never picked under", () => {
    recordPick("u1", "view-students", "stu", T0);
    expect(loadPopularity("u1", T0).scoreFor("view-students", "roster")).toBeGreaterThan(0);
  });
});

describe("storage fail-safe", () => {
  it("a throwing setItem degrades to no memory instead of throwing", () => {
    const setItem = vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() => recordPick("u1", "view-students", "stu", T0)).not.toThrow();
    expect(setItem).toHaveBeenCalled();
    setItem.mockRestore();
    expect(loadPopularity("u1", T0).scoreFor("view-students", "stu")).toBe(0);
  });

  it("a throwing getItem degrades to no memory instead of throwing", () => {
    recordPick("u1", "view-students", "stu", T0);
    const getItem = vi.spyOn(localStorage, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    expect(loadPopularity("u1", T0).scoreFor("view-students", "stu")).toBe(0);
    expect(loadFrecencyScores("u1", T0)).toEqual({});
    expect(getItem).toHaveBeenCalled();
    getItem.mockRestore();
    // Without the fault, the same data reads back fine.
    expect(loadPopularity("u1", T0).scoreFor("view-students", "stu")).toBeGreaterThan(0);
  });

  it("corrupt stored JSON degrades to no memory", () => {
    localStorage.setItem("action-palette:v1:u1:frecency", "{not json");
    expect(loadFrecencyScores("u1", T0)).toEqual({});
  });
});

describe("adaptive store cap", () => {
  it("keeps the store bounded, retaining the most-used queries", () => {
    // One well-used query, then 205 one-off ones: eviction is by weight, so the
    // well-used bucket survives and the store stays capped.
    for (let i = 0; i < 5; i++) recordPick("u1", "a", "favourite", T0);
    for (let i = 0; i < 205; i++) recordPick("u1", "a", `q${i}`, T0);

    const raw = JSON.parse(localStorage.getItem("action-palette:v1:u1:adaptive")!) as Record<
      string,
      Record<string, number>
    >;
    expect(Object.keys(raw).length).toBeLessThanOrEqual(200);
    expect(raw["favourite"]).toEqual({ a: 5 });
  });
});

describe("anonymous users", () => {
  it("an undefined user id gets its own bucket that still learns", () => {
    recordPick(undefined, "view-home", "home", T0);
    expect(loadPopularity(undefined, T0).scoreFor("view-home", "home")).toBeGreaterThan(0);
    expect(loadPopularity("u1", T0).scoreFor("view-home", "home")).toBe(0);
  });
});

describe("capAdaptive eviction", () => {
  beforeEach(() => localStorage.clear());

  it("lets a brand new query into a full store", () => {
    // The bug this guards: a new bucket enters with weight 1, every other
    // bucket is at least 1, the sort is stable so ties hold insertion order,
    // and a newly added key sorts last. It was evicted by the write that
    // created it, so a full store stopped learning for good.
    const user = "amaka";
    for (let i = 0; i < 200; i += 1) {
      recordPick(user, `action-${i}`, `query ${i}`);
    }
    recordPick(user, "the-new-one", "brand new query");

    const raw = JSON.parse(
      localStorage.getItem("action-palette:v1:amaka:adaptive") ?? "{}",
    );
    expect(raw["brand new query"]).toEqual({ "the-new-one": 1 });
  });

  it("still keeps the store bounded", () => {
    const user = "amaka";
    for (let i = 0; i < 260; i += 1) {
      recordPick(user, `action-${i}`, `query ${i}`);
    }
    const raw = localStorage.getItem("action-palette:v1:amaka:adaptive");
    expect(Object.keys(JSON.parse(raw ?? "{}"))).toHaveLength(200);
  });
});
