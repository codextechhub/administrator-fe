// Registry shape, not registry vocabulary.
//
// These tests do NOT assert that a particular action exists or is worded a
// particular way: rewording "View students" must not turn a test red. They
// assert the four things that make an entry safe to ship, each of which is a
// real failure mode rather than a style rule:
//   - a duplicated or renamed id silently resets a user's learned ranking,
//     because the id is the popularity storage key;
//   - a `to` that no route serves is a palette row that lands on nothing;
//   - a gate naming a code the permission registry does not resolve denies
//     everybody (see the `holds` helper in gate.ts), so the action vanishes;
//   - two identical labels are two indistinguishable rows.

import { describe, expect, it } from "vitest";
import { P, resolvePermissionKey, type PermissionCode } from "@/permissions";
import { routesPath } from "@/routes/routesPath";
import { academicRoutes } from "@/routes/protected/academic-routes";
import { administratorRoutes } from "@/routes/protected/administrator-routes";
import { branchesRoutes } from "@/routes/protected/branches-routes";
import { classesRoutes } from "@/routes/protected/classes-routes";
import { onboardingRoutes, onboardingWelcomeRoute } from "@/routes/protected/onboarding-routes";
import { overviewRoutes } from "@/routes/protected/overview-routes";
import { studentsRoutes } from "@/routes/protected/students-routes";
import { teachersRoutes } from "@/routes/protected/teachers-routes";
import { ACTIONS, LIVE_ONLY_ACTION_IDS, PENDING_ONLY_ACTION_IDS } from "./registry";
import type { ActionDef } from "./types";

// The paths the router genuinely mounts. Taken from the route modules rather
// than from routesPath, because routesPath also names paths nothing serves:
// /school-fees and /settings are in it, and the sidebar points both at "#".
// Every one of these modules is import-cheap (lazy() page imports plus
// type-only handles), so pulling them in costs no page bundle.
//
// The protected route barrel is deliberately NOT imported: it pulls in
// DashboardLayout eagerly, and with it the whole shell.
const SERVED_PATHS = new Set(
  [
    onboardingWelcomeRoute,
    ...onboardingRoutes,
    ...overviewRoutes,
    ...branchesRoutes,
    ...studentsRoutes,
    ...teachersRoutes,
    ...administratorRoutes,
    ...academicRoutes,
    ...classesRoutes,
  ]
    .map((route) => route.path)
    .filter((path): path is string => typeof path === "string"),
);

// Every literal path routesPath declares, so an action's `to` can be traced
// back to the path table as well as to the router. Path *builders* (functions)
// and their `:param` templates are skipped: no palette action can navigate to
// one without an id it has no way to know.
function literalPaths(node: unknown, out: Set<string> = new Set()): Set<string> {
  if (typeof node === "string") {
    if (!node.includes(":")) out.add(node);
    return out;
  }
  if (node && typeof node === "object") {
    for (const value of Object.values(node)) literalPaths(value, out);
  }
  return out;
}
const DECLARED_PATHS = literalPaths(routesPath);

const PERMISSION_CODES = new Set<string>(Object.values(P));

// "/onboarding/roles?tab=invitations" is served by "/onboarding/roles"; the
// query string picks the tab.
const pathOf = (to: string): string => to.split("?")[0];

function gateCodes(action: ActionDef): PermissionCode[] {
  const gate = action.gate;
  if (gate === null) return [];
  if ("perm" in gate) return [gate.perm];
  if ("any" in gate) return gate.any;
  if ("all" in gate) return gate.all;
  return [];
}

const navActions = ACTIONS.filter(
  (action): action is ActionDef & { run: { to: string } } => "to" in action.run,
);

describe("action registry shape", () => {
  it("is a non-empty list", () => {
    expect(ACTIONS.length).toBeGreaterThan(0);
  });

  it("gives every action a unique id", () => {
    const ids = ACTIONS.map((action) => action.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("writes every id in kebab-case", () => {
    for (const action of ACTIONS) {
      expect(action.id, action.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("gives every action a distinct label", () => {
    const labels = ACTIONS.map((action) => action.label.toLowerCase());
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("never repeats an alias inside one action, or repeats its own label", () => {
    for (const action of ACTIONS) {
      const aliases = action.aliases.map((alias) => alias.toLowerCase());
      expect(new Set(aliases).size, action.id).toBe(aliases.length);
      expect(aliases, action.id).not.toContain(action.label.toLowerCase());
    }
  });

  it("leaves no label or alias blank", () => {
    for (const action of ACTIONS) {
      expect(action.label.trim(), action.id).not.toBe("");
      for (const alias of action.aliases) {
        expect(alias.trim(), action.id).not.toBe("");
      }
    }
  });
});

describe("action registry destinations", () => {
  it("navigates only to paths the router actually mounts", () => {
    for (const action of navActions) {
      expect(SERVED_PATHS.has(pathOf(action.run.to)), action.id).toBe(true);
    }
  });

  it("navigates only to paths routesPath declares", () => {
    for (const action of navActions) {
      expect(DECLARED_PATHS.has(action.run.to), action.id).toBe(true);
    }
  });

  it("never points at a placeholder or a parameterised path", () => {
    for (const action of navActions) {
      expect(action.run.to, action.id).toMatch(/^\//);
      expect(action.run.to, action.id).not.toContain(":");
      expect(action.run.to, action.id).not.toBe("#");
    }
  });

  it("runs only the commands the header can carry out", () => {
    for (const action of ACTIONS) {
      if ("to" in action.run) continue;
      expect(["proxy", "logout", "help"], action.id).toContain(action.run.command);
    }
  });
});

describe("action registry gates", () => {
  it("names only codes the permission registry knows", () => {
    for (const action of ACTIONS) {
      for (const code of gateCodes(action)) {
        expect(PERMISSION_CODES.has(code), `${action.id} -> ${code}`).toBe(true);
      }
    }
  });

  it("names only codes that resolve to a backend key", () => {
    // gate.ts denies an unresolvable code, so this failing would mean an action
    // silently hidden from every user rather than a loud error.
    for (const action of ACTIONS) {
      for (const code of gateCodes(action)) {
        expect(resolvePermissionKey(code), `${action.id} -> ${code}`).not.toBe("");
      }
    }
  });

  it("never leaves a permission list empty", () => {
    for (const action of ACTIONS) {
      const gate = action.gate;
      if (gate === null) continue;
      if ("any" in gate) expect(gate.any.length, action.id).toBeGreaterThan(0);
      if ("all" in gate) expect(gate.all.length, action.id).toBeGreaterThan(0);
      if ("module" in gate) expect(gate.module.length, action.id).toBeGreaterThan(0);
    }
  });
});

describe("readiness lists", () => {
  const ids = new Set(ACTIONS.map((action) => action.id));

  it("names only actions that exist", () => {
    for (const id of [...LIVE_ONLY_ACTION_IDS, ...PENDING_ONLY_ACTION_IDS]) {
      expect(ids.has(id), id).toBe(true);
    }
  });

  it("never puts one action in both", () => {
    const live = new Set(LIVE_ONLY_ACTION_IDS);
    for (const id of PENDING_ONLY_ACTION_IDS) {
      expect(live.has(id), id).toBe(false);
    }
  });
});
