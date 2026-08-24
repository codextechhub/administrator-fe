import { describe, expect, it } from "vitest";
import { P, resolvePermissionKey } from "@/permissions";
import { filterActionsForPermissions, passesActionGate } from "./gate";
import { TEST_ACTIONS, testAction } from "./test-actions";
import type { ActionDef } from "./types";

const key = (code: (typeof P)[keyof typeof P]) => resolvePermissionKey(code);
const ids = (actions: ActionDef[]) => actions.map((a) => a.id).sort();

describe("passesActionGate", () => {
  it("a null gate is always visible", () => {
    expect(passesActionGate(null, [])).toBe(true);
  });

  it("perm needs that exact capability", () => {
    expect(passesActionGate({ perm: P.BROWSE_STUDENTS }, [key(P.BROWSE_STUDENTS)])).toBe(true);
    expect(passesActionGate({ perm: P.BROWSE_STUDENTS }, [key(P.BROWSE_TEACHERS)])).toBe(false);
    expect(passesActionGate({ perm: P.BROWSE_STUDENTS }, [])).toBe(false);
  });

  it("any needs at least one", () => {
    const gate = { any: [P.BROWSE_STUDENTS, P.BROWSE_TEACHERS] };
    expect(passesActionGate(gate, [key(P.BROWSE_TEACHERS)])).toBe(true);
    expect(passesActionGate(gate, [key(P.VIEW_FEES)])).toBe(false);
  });

  it("all needs every one", () => {
    const gate = { all: [P.BROWSE_STUDENTS, P.ENROLL_STUDENT] };
    expect(passesActionGate(gate, [key(P.BROWSE_STUDENTS), key(P.ENROLL_STUDENT)])).toBe(true);
    expect(passesActionGate(gate, [key(P.BROWSE_STUDENTS)])).toBe(false);
  });

  it("module passes on any raw key under the prefix", () => {
    const gate = { module: ["academics."] };
    expect(passesActionGate(gate, ["academics.calendar.view"])).toBe(true);
    expect(passesActionGate(gate, ["academics.anything.at.all"])).toBe(true);
    expect(passesActionGate(gate, ["school.students.view"])).toBe(false);
  });

  it("an empty permission key never satisfies a gate", () => {
    // resolvePermissionKey returns "" for a code the registry does not know.
    // A stray "" in the held list must not open a gated action.
    const unknown = "999999" as (typeof P)[keyof typeof P];
    expect(resolvePermissionKey(unknown)).toBe("");
    expect(passesActionGate({ perm: unknown }, ["", key(P.BROWSE_STUDENTS)])).toBe(false);
  });
});

describe("filterActionsForPermissions", () => {
  it("keeps ungated actions for a user with no permissions at all", () => {
    expect(ids(filterActionsForPermissions(TEST_ACTIONS, []))).toEqual([
      "logout",
      "proxy-user",
      "view-home",
      "view-my-profile",
    ]);
  });

  it("adds the actions a permission unlocks and nothing more", () => {
    const held = [key(P.BROWSE_STUDENTS)];
    const kept = filterActionsForPermissions(TEST_ACTIONS, held);
    expect(kept).toContain(testAction("view-students"));
    expect(kept).not.toContain(testAction("enroll-student"));
    expect(kept).not.toContain(testAction("view-fee-invoices"));
  });

  it("does not mutate or reorder the source registry", () => {
    const before = TEST_ACTIONS.map((a) => a.id);
    filterActionsForPermissions(TEST_ACTIONS, [key(P.VIEW_FEES)]);
    expect(TEST_ACTIONS.map((a) => a.id)).toEqual(before);
  });
});
