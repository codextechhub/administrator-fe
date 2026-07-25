import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Cookies from "js-cookie";

const freshImports = async () => {
  vi.resetModules();
  const endSessionMod = await import("./end-session");
  const tokenMod = await import("./token-refresh");
  return { ...endSessionMod, ...tokenMod };
};

beforeEach(() => {
  Cookies.set("token", "acc");
  Cookies.set("refresh_token", "ref");
  localStorage.setItem("_last_activity", String(Date.now()));
  localStorage.setItem("persist:root", '{"auth":"{}"}');
  sessionStorage.setItem("anything", "1");
});

afterEach(() => {
  Cookies.remove("token");
  Cookies.remove("refresh_token");
  localStorage.clear();
  sessionStorage.clear();
  vi.restoreAllMocks();
});

describe("endSession", () => {
  it("clears cookies, storages and activity", async () => {
    const { endSession } = await freshImports();
    endSession();

    expect(Cookies.get("token")).toBeUndefined();
    expect(Cookies.get("refresh_token")).toBeUndefined();
    expect(sessionStorage.getItem("anything")).toBeNull();
    expect(localStorage.getItem("_last_activity")).toBeNull();
  });

  it("synchronously removes the persisted Redux state (persist:root)", async () => {
    const { endSession } = await freshImports();
    // The debounced redux-persist write of resetAuth loses the race against the
    // hard-navigate, so endSession must drop persist:root itself.
    endSession();

    expect(localStorage.getItem("persist:root")).toBeNull();
  });

  it("writes the banner after clearing sessionStorage so it survives", async () => {
    const { endSession } = await freshImports();
    endSession("Session over. Log in again.");

    expect(sessionStorage.getItem("_auth_banner")).toBe("Session over. Log in again.");
  });

  it("blocks any subsequent token refresh in this JS context", async () => {
    const { endSession, refreshTokenSingleFlight } = await freshImports();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    endSession();
    // Even with a refresh cookie present, refresh must refuse to run.
    Cookies.set("refresh_token", "stale");
    expect(await refreshTokenSingleFlight()).toEqual({ ok: false, reason: "no_token" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
