import { describe, expect, it } from "vitest";
import { getAuthContextGateState } from "./auth-context-gate";

describe("getAuthContextGateState", () => {
  it("holds protected routes while a legacy session hydrates its tenant", () => {
    expect(getAuthContextGateState({
      shouldRedirect: false,
      hasTenant: false,
      isLoading: true,
      isFetching: true,
      isError: false,
    })).toBe("loading");
  });

  it("releases protected routes after tenant context is available", () => {
    expect(getAuthContextGateState({
      shouldRedirect: false,
      hasTenant: true,
      isLoading: false,
      isFetching: false,
      isError: false,
    })).toBe("ready");
  });

  it("offers a retry when /me fails (likely transient)", () => {
    expect(getAuthContextGateState({
      shouldRedirect: false,
      hasTenant: false,
      isLoading: false,
      isFetching: false,
      isError: true,
    })).toBe("retry");
  });

  it("logs out when /me succeeds but there is no tenant", () => {
    expect(getAuthContextGateState({
      shouldRedirect: false,
      hasTenant: false,
      isLoading: false,
      isFetching: false,
      isError: false,
    })).toBe("logout");
  });

  it("keeps expired sessions on the redirect path", () => {
    expect(getAuthContextGateState({
      shouldRedirect: true,
      hasTenant: false,
      isLoading: false,
      isFetching: false,
      isError: false,
    })).toBe("redirect");
  });
});
