import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { captureReturnTo, consumeReturnTo } from "./return-to";

const setLocation = (pathname: string, search = "", hash = "") => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { pathname, search, hash },
  });
};

beforeEach(() => sessionStorage.clear());
afterEach(() => sessionStorage.clear());

describe("captureReturnTo / consumeReturnTo", () => {
  it("round-trips a safe deep link with query and hash", () => {
    setLocation("/academic/session", "?tab=terms", "#row-3");
    captureReturnTo();
    expect(consumeReturnTo()).toBe("/academic/session?tab=terms#row-3");
  });

  it("consume clears the value (single use)", () => {
    setLocation("/students");
    captureReturnTo();
    expect(consumeReturnTo()).toBe("/students");
    expect(consumeReturnTo()).toBeNull();
  });

  // This app's auth pages all live under /accounts (routesPath.AUTH), plus the
  // legacy /login redirect — unlike console-fe there is no `/:email/login`
  // route, so a nested path merely ending in /login is a normal protected page.
  it("does not capture auth routes", () => {
    for (const p of [
      "/accounts",
      "/accounts/forgot-password",
      "/accounts/reset-password/abc",
      "/accounts/activate/xyz",
      "/login",
    ]) {
      sessionStorage.clear();
      setLocation(p);
      captureReturnTo();
      expect(consumeReturnTo()).toBeNull();
    }
  });

  it("does not treat a path that merely starts with the prefix string as auth", () => {
    setLocation("/accounts-payable");
    captureReturnTo();
    expect(consumeReturnTo()).toBe("/accounts-payable");
  });

  it("rejects open-redirect attempts injected into storage", () => {
    for (const evil of ["//evil.com", "/\\evil.com", "https://evil.com", "javascript:alert(1)"]) {
      sessionStorage.setItem("_auth_return_to", evil);
      expect(consumeReturnTo()).toBeNull();
    }
  });
});
