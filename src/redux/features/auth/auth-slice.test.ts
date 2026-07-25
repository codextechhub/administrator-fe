import { describe, expect, it } from "vitest";
import type { ActiveImpersonation, Auth, User } from "./auth-types";
import {
  authSliceReducer,
  selectActorPermissions,
  setAuthContext,
  setImpersonation,
  updatePermissions,
  updateTenant,
} from "./auth-slice";

// `/me` re-runs on mount, on token refresh and on window focus, almost always
// returning the identical context. The reducers no-op in that case so Immer
// hands back the very same state object — anything else re-renders the whole
// protected tree and rewrites redux-persist for nothing. These tests pin that
// identity guarantee (toBe, not toEqual) because it is the entire point.
const stateWith = (partial: Partial<Auth>): Auth => ({
  access: "acc",
  refresh: "ref",
  session_id: 1,
  user: null,
  permissions: [],
  school: null,
  tenant: null,
  ...partial,
});

describe("updatePermissions", () => {
  it("returns the SAME state reference for an identical permissions array", () => {
    const state = stateWith({ permissions: ["student.view", "student.create"] });
    const next = authSliceReducer(state, updatePermissions(["student.view", "student.create"]));

    expect(next).toBe(state);
  });

  it("treats a REORDERED permissions array as a change (comparison is order-sensitive by design)", () => {
    // Order-sensitivity is deliberate: an index-wise compare is O(n) with no
    // sorting/allocation on the hot path, and the backend returns a stable
    // order — so a reordering is rare and a needless re-render is the safe
    // side to err on (never a missed permission update).
    const state = stateWith({ permissions: ["student.view", "student.create"] });
    const next = authSliceReducer(state, updatePermissions(["student.create", "student.view"]));

    expect(next).not.toBe(state);
    expect(next.permissions).toEqual(["student.create", "student.view"]);
  });

  it("applies a genuine change (added / removed permission)", () => {
    const state = stateWith({ permissions: ["student.view"] });

    const added = authSliceReducer(state, updatePermissions(["student.view", "student.create"]));
    expect(added).not.toBe(state);
    expect(added.permissions).toEqual(["student.view", "student.create"]);

    const removed = authSliceReducer(state, updatePermissions([]));
    expect(removed).not.toBe(state);
    expect(removed.permissions).toEqual([]);
  });

  it("assigns when the persisted session has no permissions key (legacy state)", () => {
    // samePermissions() requires a truthy existing array, so undefined always
    // takes the assignment branch — even for an empty incoming list.
    const state = stateWith({ permissions: undefined });
    const next = authSliceReducer(state, updatePermissions([]));

    expect(next).not.toBe(state);
    expect(next.permissions).toEqual([]);
  });
});

describe("updateTenant", () => {
  it("returns the SAME state reference for an equal tenant (same slug + name)", () => {
    const state = stateWith({ tenant: { slug: "greenfield", name: "Greenfield Academy" } });
    const next = authSliceReducer(
      state,
      updateTenant({ slug: "greenfield", name: "Greenfield Academy" }),
    );

    expect(next).toBe(state);
  });

  it("returns the SAME state reference when both are null", () => {
    const state = stateWith({ tenant: null });
    expect(authSliceReducer(state, updateTenant(null))).toBe(state);
  });

  it("applies a changed slug or a changed name", () => {
    const state = stateWith({ tenant: { slug: "greenfield", name: "Greenfield Academy" } });

    const slugChanged = authSliceReducer(
      state,
      updateTenant({ slug: "other-school", name: "Greenfield Academy" }),
    );
    expect(slugChanged).not.toBe(state);
    expect(slugChanged.tenant?.slug).toBe("other-school");

    const nameChanged = authSliceReducer(
      state,
      updateTenant({ slug: "greenfield", name: "Greenfield Academy (Renamed)" }),
    );
    expect(nameChanged).not.toBe(state);
    expect(nameChanged.tenant?.name).toBe("Greenfield Academy (Renamed)");
  });

  it("applies a transition to/from null", () => {
    const withTenant = stateWith({ tenant: { slug: "greenfield", name: "Greenfield Academy" } });
    const cleared = authSliceReducer(withTenant, updateTenant(null));
    expect(cleared).not.toBe(withTenant);
    expect(cleared.tenant).toBeNull();

    const withoutTenant = stateWith({ tenant: null });
    const set = authSliceReducer(
      withoutTenant,
      updateTenant({ slug: "greenfield", name: "Greenfield Academy" }),
    );
    expect(set).not.toBe(withoutTenant);
    expect(set.tenant).toEqual({ slug: "greenfield", name: "Greenfield Academy" });
  });
});

// ── Proxy ("view as another user") ──────────────────────────────────────────

const aUser = (partial: Partial<User> = {}): User =>
  ({
    id: 7,
    uid: "u-7",
    email: "ada@greenfield.test",
    first_name: "Ada",
    last_name: "Obi",
    full_name: "Ada Obi",
    phone: "",
    gender: "",
    user_type: "SCHOOL_ADMIN",
    role: "school_admin",
    status: "ACTIVE",
    school_id: 1,
    school_name: "Greenfield",
    branch_id: null,
    branch_name: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...partial,
  }) as User;

describe("setAuthContext", () => {
  it("returns the SAME state reference when /me returns an unchanged context", () => {
    // The hot path: /me re-runs on every focus and its payload is a brand-new
    // object each time. Nothing may re-render.
    const user = aUser();
    const state = stateWith({
      user,
      school: null,
      tenant: { slug: "greenfield", name: "Greenfield Academy" },
      permissions: ["school.dashboard.view"],
    });
    const next = authSliceReducer(
      state,
      setAuthContext({
        user: aUser(),
        school: null,
        tenant: { slug: "greenfield", name: "Greenfield Academy" },
        permissions: ["school.dashboard.view"],
      }),
    );

    expect(next).toBe(state);
  });

  it("swaps the whole identity when /me comes back as a different user", () => {
    const state = stateWith({
      user: aUser(),
      tenant: { slug: "greenfield", name: "Greenfield Academy" },
      permissions: ["school.dashboard.view", "school.impersonation.start"],
    });
    const next = authSliceReducer(
      state,
      setAuthContext({
        user: aUser({ id: 12, full_name: "Ben Musa", email: "ben@greenfield.test", role: "teacher" }),
        school: null,
        tenant: { slug: "greenfield", name: "Greenfield Academy" },
        permissions: ["academics.classes.view"],
      }),
    );

    expect(next).not.toBe(state);
    expect(next.user?.full_name).toBe("Ben Musa");
    expect(next.permissions).toEqual(["academics.classes.view"]);
    // Same tenant object: school proxying is intra-tenant, so it must not churn.
    expect(next.tenant).toBe(state.tenant);
  });

  it("detects an edit to the same user via updated_at", () => {
    const state = stateWith({ user: aUser() });
    const next = authSliceReducer(
      state,
      setAuthContext({
        user: aUser({ updated_at: "2026-02-02T00:00:00Z" }),
        school: null,
        tenant: null,
        permissions: [],
      }),
    );

    expect(next).not.toBe(state);
    expect(next.user?.updated_at).toBe("2026-02-02T00:00:00Z");
  });
});

describe("selectActorPermissions", () => {
  const impersonation: ActiveImpersonation = {
    id: 42,
    tenantSlug: "greenfield",
    target: {
      id: 12,
      email: "ben@greenfield.test",
      full_name: "Ben Musa",
      user_type: "TEACHER",
      role: "teacher",
      tenant_slug: "greenfield",
      tenant_name: "Greenfield Academy",
      school_name: "Greenfield",
    },
    actor: {
      user: aUser(),
      school: null,
      tenant: { slug: "greenfield", name: "Greenfield Academy" },
      permissions: ["school.impersonation.start", "school.impersonation.end"],
    },
  };

  it("reads the live permissions when no proxy is active", () => {
    const state = stateWith({ permissions: ["school.dashboard.view"] });
    expect(selectActorPermissions({ auth: state } as never)).toEqual([
      "school.dashboard.view",
    ]);
  });

  // The exit affordance is gated on this: while proxying, `permissions` holds
  // the TARGET's keys, so reading them would hide the way out from the admin.
  it("reads the retained ACTOR snapshot while a proxy session is active", () => {
    const state = stateWith({
      permissions: ["academics.classes.view"],
      impersonation,
    });
    expect(selectActorPermissions({ auth: state } as never)).toEqual([
      "school.impersonation.start",
      "school.impersonation.end",
    ]);
  });

  it("falls back to the live permissions once the proxy is cleared", () => {
    const proxying = stateWith({
      permissions: ["academics.classes.view"],
      impersonation,
    });
    const exited = authSliceReducer(proxying, setImpersonation(null));

    expect(exited.impersonation).toBeNull();
    expect(selectActorPermissions({ auth: exited } as never)).toEqual([
      "academics.classes.view",
    ]);
  });
});
