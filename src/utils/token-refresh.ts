import Cookies from "js-cookie";

const baseUrl = import.meta.env.VITE_BACKEND_URL;

// Tokens must be JS-readable in this architecture, but the transport
// attributes are free hardening: never sent cross-site, never over plain
// http in production. `secure` follows the page protocol so local dev
// (http://localhost) keeps working.
const COOKIE_ATTRS: Cookies.CookieAttributes = {
  sameSite: "strict",
  secure: window.location.protocol === "https:",
};

// Single writer for the auth cookie pair - every login/refresh path goes
// through here so the attributes can never drift between call sites.
export const setAuthCookies = (access: string, refresh?: string): void => {
  Cookies.set("token", access, COOKIE_ATTRS);
  if (refresh) Cookies.set("refresh_token", refresh, COOKIE_ATTRS);
};

export type RefreshOutcome =
  | { ok: true; access: string; refresh?: string }
  | { ok: false; reason: "no_token" | "token_invalid" | "network_error" | "server_error" };

let inFlight: Promise<RefreshOutcome> | null = null;

// Once a session is torn down (logout / idle timeout / forced re-auth) a refresh
// that was already in flight must not resurrect the auth cookies. Logout paths
// flip this on; a fresh login flips it back for the same JS context (flows that
// don't hard-reload, e.g. account activation).
let sessionInvalidated = false;

export const markSessionInvalidated = (): void => {
  sessionInvalidated = true;
  inFlight = null;
};

export const resetSessionInvalidation = (): void => {
  sessionInvalidated = false;
};

const doRefresh = async (refreshToken: string): Promise<RefreshOutcome> => {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/user/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });
  } catch {
    return { ok: false, reason: "network_error" };
  }

  // Only 401 means the refresh token is definitively bad - force re-auth.
  if (response.status === 401) return { ok: false, reason: "token_invalid" };
  // 5xx (and anything else non-ok) is transient: caller should keep the user signed in.
  if (!response.ok) return { ok: false, reason: "server_error" };

  let data: { data?: { access?: string; refresh?: string } };
  try {
    data = await response.json();
  } catch {
    return { ok: false, reason: "server_error" };
  }

  const access = data?.data?.access;
  if (!access) return { ok: false, reason: "server_error" };
  const refresh = data?.data?.refresh;

  // The session was torn down while this refresh was in flight - discard the
  // result rather than writing cookies for a session the user has left.
  if (sessionInvalidated) return { ok: false, reason: "token_invalid" };

  // Cookie is the source of truth across all refresh callers - persist
  // immediately so the next reader sees the rotated values.
  setAuthCookies(access, refresh);

  return { ok: true, access, refresh };
};

/**
 * Shared single-flight refresh. All concurrent callers in the tab - RTK Query
 * 401 retries, the proactive route-change hook, and the idle "Continue" button
 * - wait on the same in-flight request, so the backend only sees one rotation
 * per window of concurrent activity.
 *
 * Reads the refresh token from the cookie, which is updated immediately on
 * every successful rotation. The Redux auth slice's `refresh` field is no
 * longer consulted by this module to avoid the stale-state bug.
 */
export const refreshTokenSingleFlight = (): Promise<RefreshOutcome> => {
  if (sessionInvalidated) return Promise.resolve({ ok: false, reason: "no_token" });
  if (inFlight) return inFlight;

  const refreshToken = Cookies.get("refresh_token");
  if (!refreshToken || refreshToken === "undefined") {
    return Promise.resolve({ ok: false, reason: "no_token" });
  }

  inFlight = doRefresh(refreshToken).finally(() => {
    inFlight = null;
  });
  return inFlight;
};
