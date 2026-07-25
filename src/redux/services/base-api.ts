import {
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";
import {
  resetAuth,
  setAuthContext,
  setImpersonation,
  setToken,
  updatePermissions,
  updateTenant,
} from "../features/auth/auth-slice";
import type { ActiveImpersonation, TenantInfo } from "../features/auth/auth-types";
import { getTenantSlug } from "@/utils/tenant-context";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { routesPath } from "@/routes/routesPath";
import { refreshTokenSingleFlight } from "@/utils/token-refresh";
import { endSession } from "@/utils/end-session";
import { captureReturnTo } from "@/utils/return-to";
import {
  AUTH_ENDPOINTS,
  TENANT_EXEMPT_ENDPOINTS,
  blockedDuringIdentitySwap,
  sendsImpersonationHeader,
} from "./api-endpoints";
import { isIdentitySwapInProgress, runWithIdentitySwap } from "@/utils/identity-swap";

const getAccessToken = () => {
  const token = Cookies.get("token");
  return token && token !== "undefined" ? token : "";
};

const baseUrl = import.meta.env.VITE_BACKEND_URL;

// The endpoint-name sets (auth / tenant-exempt / impersonation) live in
// ./api-endpoints — see that module for why and how to extend them.

// Read the active proxy session straight off the live store. Typed loosely
// because the base query only ever receives the root state as `unknown`.
const readImpersonation = (getState: () => unknown): ActiveImpersonation | null =>
  (getState() as { auth?: { impersonation?: ActiveImpersonation | null } })?.auth
    ?.impersonation ?? null;

// True when the request already asserts a tenant, so central injection leaves
// it untouched (handles both string and object arg forms).
const hasTenantParam = (args: string | FetchArgs): boolean => {
  if (typeof args === "string") return /[?&]tenant=/.test(args);
  if (typeof args.url === "string" && /[?&]tenant=/.test(args.url)) return true;
  const params = (args as FetchArgs).params as Record<string, unknown> | undefined;
  return !!params && params.tenant != null && params.tenant !== "";
};

// Append ?tenant=<slug> unless the endpoint is exempt or already asserts one.
const injectTenant = (args: string | FetchArgs, endpoint: string): string | FetchArgs => {
  if (TENANT_EXEMPT_ENDPOINTS.has(endpoint) || hasTenantParam(args)) return args;
  const slug = getTenantSlug();
  if (!slug) return args; // pre-login / legacy token — backend 400s, auth flow handles it
  if (typeof args === "string") {
    const sep = args.includes("?") ? "&" : "?";
    return `${args}${sep}tenant=${encodeURIComponent(slug)}`;
  }
  return { ...args, params: { ...(args.params as object), tenant: slug } };
};

export const baseQuery = fetchBaseQuery({
  baseUrl,
  prepareHeaders: (headers, { endpoint, getState }) => {
    const accessToken = getAccessToken();
    if (accessToken && !AUTH_ENDPOINTS.has(endpoint)) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }
    // While a proxy session is active every data call rides with the session
    // header, so the backend resolves the request — and evaluates RBAC — as the
    // target user. The auth routes, logout and the impersonation management
    // endpoints themselves are exempt: they must act as the original actor.
    const impersonation = readImpersonation(getState);
    if (impersonation && sendsImpersonationHeader(endpoint)) {
      headers.set("X-Impersonation-Session", String(impersonation.id));
    }
    headers.set("accept", "application/json");
    return headers;
  },
});

let sessionRecoveryInProgress = false;

const forceLogoutAndRedirect = (api: Parameters<BaseQueryFn>[1]) => {
  if (sessionRecoveryInProgress) return;
  sessionRecoveryInProgress = true;
  api.dispatch(resetAuth());
  endSession();
  // Preserve the page they were on so login can return them there. Must run
  // AFTER endSession (which clears sessionStorage).
  captureReturnTo();
  window.location.href = routesPath.AUTH.LOGIN;
};

// /user/auth/me/ is tenant-exempt, so this raw fetch needs no ?tenant=. It
// refreshes both the permission set and the cached tenant context.
const fetchFreshMe = async (
  accessToken: string,
  impersonation: ActiveImpersonation | null,
): Promise<{ permissions: string[] | null; tenant: TenantInfo | null }> => {
  try {
    const response = await fetch(`${baseUrl}/user/auth/me/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        accept: "application/json",
        // Raw fetch, so it bypasses prepareHeaders — the proxy header has to be
        // replayed by hand or a post-refresh /me would hydrate the ACTOR's
        // permissions while the rest of the app still runs as the target.
        ...(impersonation
          ? { "X-Impersonation-Session": String(impersonation.id) }
          : {}),
      },
    });
    if (!response.ok) return { permissions: null, tenant: null };
    const data = await response.json();
    return {
      permissions: data?.data?.permissions ?? null,
      tenant: data?.data?.tenant ?? null,
    };
  } catch {
    return { permissions: null, tenant: null };
  }
};

/**
 * Return to the original identity after the server ended the proxy session
 * behind our back (idle timeout, target logged out, target deactivated).
 *
 * The retained actor snapshot makes this instant and offline-safe — no network
 * call is needed to know who the admin really is. Runs inside the identity-swap
 * gate so the target's still-mounted screens cannot refire under the restored
 * actor, and resets the cache only after the gate lifts.
 */
const restoreActorAfterCollapse = async (
  api: Parameters<BaseQueryFn>[1],
  impersonation: ActiveImpersonation,
) => {
  await runWithIdentitySwap(async () => {
    api.dispatch(setImpersonation(null));
    api.dispatch(setAuthContext(impersonation.actor));
    // Lazily imported: the route table imports pages that import this module,
    // so a static import would be circular.
    const { router } = await import("@/routes");
    await router.navigate(routesPath.PROTECTED.OVERVIEW.INDEX, { replace: true });
  });
  api.dispatch(baseApi.util.resetApiState());
  toast.info("Your proxy session ended. You are back in your own account.");
};

const extractFirstDetailError = (detail: unknown): string | null => {
  if (!detail) return null;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return typeof detail[0] === "string" ? detail[0] : null;
  if (typeof detail === "object") {
    for (const key of Object.keys(detail as Record<string, unknown>)) {
      const found = extractFirstDetailError((detail as Record<string, unknown>)[key]);
      if (found) return found;
    }
  }
  return null;
};

const AUTH_URLS = [
  "login",
  "reset-password",
  "password/reset",
  "forgot-password",
  "activate",
];

const isAuthRoute = (args: string | FetchArgs): boolean => {
  const url =
    typeof args === "string"
      ? args
      : typeof args === "object" && "url" in args && typeof args.url === "string"
        ? args.url
        : "";
  return AUTH_URLS.some((u) => url.includes(u));
};

export const baseQueryInterceptor: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // Identity-swap gate: a proxy start/exit replaces the effective user while
  // the old identity's screens are still mounted. Drop their in-flight refires
  // here so they never reach the backend under the wrong identity. The error
  // shape matches an abort, which the suppression below already keeps silent.
  if (isIdentitySwapInProgress() && blockedDuringIdentitySwap(api.endpoint)) {
    return {
      error: {
        status: "FETCH_ERROR",
        error: "AbortError: identity swap in progress",
      } as FetchBaseQueryError,
    };
  }

  // Central tenant assertion: every authenticated, non-exempt request carries
  // ?tenant=<the caller's slug> unless it already asserts one.
  const tenantArgs = injectTenant(args, api.endpoint);
  const result = await baseQuery(tenantArgs, api, extraOptions);
  if (!result?.error) return result;

  // Background requests (e.g. polls that resume the instant the tab regains
  // focus) pass `{ silent: true }` so a transient 5xx never interrupts the
  // user with a global error toast — they just retry on the next cycle. The
  // refresh/retry and force-logout machinery still runs.
  const silent = !!(extraOptions as { silent?: boolean } | undefined)?.silent;
  const notify = (message: string) => {
    if (!silent) toast.error(message);
  };

  // FetchBaseQueryError uses a string status for transport-level failures
  // and a number for HTTP responses, so narrow access via `any`.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res: any = result.error;

  // Cache resets and the identity-swap gate intentionally abort requests during
  // an identity change. They are not connectivity failures and must never
  // produce a burst of misleading "Could not reach the server" toasts.
  if (
    res?.status === "FETCH_ERROR" &&
    /abort|aborted/i.test(String(res?.error ?? ""))
  ) {
    return result;
  }

  if (res?.status === 400 || res?.status === 422) {
    // Auth routes (login, reset, activate…) own their own inline/panel error
    // UX and route the message through humanizeAuthError, so never fire a global
    // toast here — doing so leaks the raw backend detail (and even machine
    // codes like INVITATION_NOT_FOUND) into the UI beside the friendly panel.
    if (!isAuthRoute(args)) {
      const message =
        extractFirstDetailError(res?.data?.error?.detail) ||
        extractFirstDetailError(res?.data?.error) ||
        res?.data?.message;
      if (message) notify(message);
    }
    return result;
  }

  if (res?.status === 401) {
    // A 401 on an auth route (login, reset, activate…) means bad credentials or
    // an expired link — not a recoverable session. Never run the refresh/retry
    // machinery here — doing otherwise would attempt a token refresh and retry
    // the login itself. No toast either: the page owns the error UI (it routes
    // the caught error through humanizeAuthError), so a global toast here would
    // duplicate the inline message.
    if (isAuthRoute(args)) {
      return result;
    }

    const refreshed = await refreshTokenSingleFlight();

    if (refreshed.ok) {
      // The singleton already updated cookies. Mirror access into Redux so any
      // selector reading state.auth.access stays consistent.
      api.dispatch(setToken(refreshed.access));

      // Role may have changed since last login — keep permissions + tenant fresh.
      const activeImpersonation = readImpersonation(api.getState);
      const fresh = await fetchFreshMe(refreshed.access, activeImpersonation);
      if (fresh.permissions) api.dispatch(updatePermissions(fresh.permissions));
      if (fresh.tenant) api.dispatch(updateTenant(fresh.tenant));

      const retry = await baseQuery(tenantArgs, api, extraOptions);
      if (retry?.error?.status === 401) {
        if (activeImpersonation) {
          // The actor's token was just refreshed successfully, so a second 401
          // while proxying is the PROXY session dying, not the login session:
          // the server ends it on idle timeout (30 min), target logout or
          // target deactivation. Logging the admin out here would be wrong —
          // restore their own identity instead of leaving a broken screen.
          await restoreActorAfterCollapse(api, activeImpersonation);
        } else {
          forceLogoutAndRedirect(api);
        }
      }
      return retry;
    }

    if (refreshed.reason === "token_invalid") {
      forceLogoutAndRedirect(api);
      return result;
    }

    // network_error, server_error, no_token — transient. Keep the user signed
    // in; the failing query surfaces its own error. Do not show the misleading
    // "session could not be restored" toast.
    return result;
  }

  if (res?.status === 403) {
    if (!isAuthRoute(args)) {
      const msg =
        extractFirstDetailError(res?.data?.error?.detail) ||
        res?.data?.message ||
        "You don't have permission to perform this action.";
      notify(msg);
    }
    return result;
  }

  if (res?.status === 404) {
    if (!isAuthRoute(args)) notify(res?.data?.message || "Resource not found.");
    return result;
  }

  if (res?.status === 405) {
    notify(res?.data?.detail || "Something went wrong. Please try again.");
    return result;
  }

  if (res?.status === 413) {
    notify("Content Too Large");
    return result;
  }

  if (typeof res?.status === "number" && res.status >= 500) {
    // Auth pages surface their own error state (friendly panel / inline copy).
    if (!isAuthRoute(args)) notify("A server error occurred. Please try again later.");
    return result;
  }

  // Transport-level failures (offline, DNS, timeout). Auth pages render their
  // own friendly panel from the query's isError, so stay quiet there.
  if (!isAuthRoute(args)) {
    if (res?.status === "TIMEOUT_ERROR") notify("The request timed out. Please try again.");
    else if (res?.status === "FETCH_ERROR") notify("Could not reach the server. Please try again.");
    else if (res?.status === "PARSING_ERROR") notify("Unexpected response from the server. Please try again.");
  }

  return result;
};

export const baseApi = createApi({
  baseQuery: baseQueryInterceptor,
  endpoints: () => ({}),
  reducerPath: "baseApi",
  tagTypes: [
    "Users",
    "Branches",
    "Students",
    "Teachers",
    "Administrators",
    "Sessions",
    "Calendar",
    "Classes",
    "Fees",
    "Roles",
    "ProxySessions",
  ],
});
