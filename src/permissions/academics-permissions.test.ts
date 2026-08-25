import { describe, expect, it } from "vitest";

import { P, resolvePermissionKey } from "./index";

// Eight academics keys went missing from the registry without anything failing,
// which is how a fully entitled school admin would have been shown no Academic
// Structure at all: usePermissions returns false for a code it cannot resolve.
// These assertions are the tripwire. console-fe pins its modules the same way
// (src/permissions/procurement-permissions.test.ts).
describe("Academic Structure permission registry", () => {
  it("resolves the structure keys the department, program and level screens gate on", () => {
    expect(resolvePermissionKey(P.BROWSE_STRUCTURE)).toBe("academics.structure.view");
    expect(resolvePermissionKey(P.CREATE_STRUCTURE)).toBe("academics.structure.create");
    expect(resolvePermissionKey(P.MODIFY_STRUCTURE)).toBe("academics.structure.update");
    expect(resolvePermissionKey(P.MANAGE_STRUCTURE)).toBe("academics.structure.manage");
  });

  it("resolves the subject keys", () => {
    expect(resolvePermissionKey(P.BROWSE_SUBJECTS)).toBe("academics.subject.view");
    expect(resolvePermissionKey(P.CREATE_SUBJECT)).toBe("academics.subject.create");
    expect(resolvePermissionKey(P.MODIFY_SUBJECT)).toBe("academics.subject.update");
    expect(resolvePermissionKey(P.MANAGE_SUBJECTS)).toBe("academics.subject.manage");
  });

  it("resolves the session and class keys the same screens read", () => {
    expect(resolvePermissionKey(P.BROWSE_SESSIONS)).toBe("academics.session.view");
    expect(resolvePermissionKey(P.MANAGE_SESSIONS)).toBe("academics.session.manage");
    expect(resolvePermissionKey(P.BROWSE_CLASSES)).toBe("academics.classes.view");
    expect(resolvePermissionKey(P.MANAGE_CLASSES)).toBe("academics.classes.manage");
  });

  it("keeps structure and subject on their own resources", () => {
    // A single "academics.structure.*" doing duty for subjects too would hand a
    // branch admin subject-delete along with department-delete. The backend
    // seeds them apart (subject.create/update reach branch_admin; structure's
    // do not), so the registry must keep them apart.
    expect(resolvePermissionKey(P.MANAGE_STRUCTURE)).not.toBe(
      resolvePermissionKey(P.MANAGE_SUBJECTS),
    );
  });
});

describe("Permission registry integrity", () => {
  it("resolves every P constant to a dotted backend key", () => {
    const unresolved = Object.entries(P).filter(
      ([, code]) => !resolvePermissionKey(code).includes("."),
    );
    expect(unresolved).toEqual([]);
  });

  it("maps each code to exactly one key, and each key to exactly one code", () => {
    const codes = Object.values(P);
    expect(new Set(codes).size).toBe(codes.length);
    const keys = codes.map(resolvePermissionKey);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
