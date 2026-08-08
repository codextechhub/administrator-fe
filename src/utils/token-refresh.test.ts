import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Cookies from "js-cookie";

// The module keeps singleton state (in-flight promise, invalidation flag), so
// each test imports a fresh copy.
const freshModule = async () => {
  vi.resetModules();
  return await import("./token-refresh");
};

const okResponse = (data: { access?: string; refresh?: string }) =>
  new Response(JSON.stringify({ data }), { status: 200 });

const clearCookies = () => {
  Cookies.remove("token");
  Cookies.remove("refresh_token");
};

beforeEach(clearCookies);
afterEach(() => {
  clearCookies();
  vi.restoreAllMocks();
});

describe("refreshTokenSingleFlight", () => {
  it("returns no_token when there is no refresh cookie", async () => {
    const mod = await freshModule();
    expect(await mod.refreshTokenSingleFlight()).toEqual({ ok: false, reason: "no_token" });
  });

  it("rotates tokens and persists them to cookies", async () => {
    Cookies.set("refresh_token", "old-refresh");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse({ access: "new-access", refresh: "new-refresh" })));

    const mod = await freshModule();
    const outcome = await mod.refreshTokenSingleFlight();

    expect(outcome).toEqual({ ok: true, access: "new-access", refresh: "new-refresh" });
    expect(Cookies.get("token")).toBe("new-access");
    expect(Cookies.get("refresh_token")).toBe("new-refresh");
  });

  it("shares one request among concurrent callers (single-flight)", async () => {
    Cookies.set("refresh_token", "old-refresh");
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ access: "a" }));
    vi.stubGlobal("fetch", fetchMock);

    const mod = await freshModule();
    const [a, b, c] = await Promise.all([
      mod.refreshTokenSingleFlight(),
      mod.refreshTokenSingleFlight(),
      mod.refreshTokenSingleFlight(),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(a).toEqual(b);
    expect(b).toEqual(c);
  });

  it("maps 401 to token_invalid (force re-auth)", async () => {
    Cookies.set("refresh_token", "dead");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 401 })));

    const mod = await freshModule();
    expect(await mod.refreshTokenSingleFlight()).toEqual({ ok: false, reason: "token_invalid" });
  });

  it("maps 5xx to server_error (transient - stay signed in)", async () => {
    Cookies.set("refresh_token", "r");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("oops", { status: 503 })));

    const mod = await freshModule();
    expect(await mod.refreshTokenSingleFlight()).toEqual({ ok: false, reason: "server_error" });
  });

  it("maps network failure to network_error", async () => {
    Cookies.set("refresh_token", "r");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));

    const mod = await freshModule();
    expect(await mod.refreshTokenSingleFlight()).toEqual({ ok: false, reason: "network_error" });
  });

  it("refuses to run after the session is invalidated", async () => {
    Cookies.set("refresh_token", "r");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const mod = await freshModule();
    mod.markSessionInvalidated();

    expect(await mod.refreshTokenSingleFlight()).toEqual({ ok: false, reason: "no_token" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("discards an in-flight result when the session is torn down mid-request", async () => {
    Cookies.set("refresh_token", "r");
    let resolveFetch!: (r: Response) => void;
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise<Response>((res) => (resolveFetch = res))));

    const mod = await freshModule();
    const pending = mod.refreshTokenSingleFlight();

    // Logout happens while the refresh is still on the wire.
    mod.markSessionInvalidated();
    Cookies.remove("token");
    Cookies.remove("refresh_token");

    resolveFetch(okResponse({ access: "zombie-access", refresh: "zombie-refresh" }));
    const outcome = await pending;

    expect(outcome.ok).toBe(false);
    // The cleared cookies must NOT be resurrected.
    expect(Cookies.get("token")).toBeUndefined();
    expect(Cookies.get("refresh_token")).toBeUndefined();
  });

  it("resetSessionInvalidation re-enables refresh for a new login", async () => {
    Cookies.set("refresh_token", "r");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse({ access: "a2" })));

    const mod = await freshModule();
    mod.markSessionInvalidated();
    mod.resetSessionInvalidation();

    expect((await mod.refreshTokenSingleFlight()).ok).toBe(true);
  });
});

describe("setAuthCookies", () => {
  it("writes both cookies, refresh only when provided", async () => {
    const mod = await freshModule();
    mod.setAuthCookies("acc-1", "ref-1");
    expect(Cookies.get("token")).toBe("acc-1");
    expect(Cookies.get("refresh_token")).toBe("ref-1");

    mod.setAuthCookies("acc-2");
    expect(Cookies.get("token")).toBe("acc-2");
    expect(Cookies.get("refresh_token")).toBe("ref-1");
  });
});
