import {
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";
import { resetAuth, setToken, updatePermissions } from "../features/auth/auth-slice";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { routesPath } from "@/routes/routesPath";
import { refreshTokenSingleFlight } from "@/utils/token-refresh";
import { endSession } from "@/utils/end-session";
import { captureReturnTo } from "@/utils/return-to";

const getAccessToken = () => {
  const token = Cookies.get("token");
  return token && token !== "undefined" ? token : "";
};

const baseUrl = import.meta.env.VITE_BACKEND_URL;

// Endpoints that must never carry a (possibly stale) Bearer token. Sending one
// to the login/activation/reset routes makes the backend treat the request as
// already-authenticated, which can surface as a 500. Mirrors AUTH_URLS below;
// prepareHeaders only has the endpoint name to work with, not the URL.
const AUTH_ENDPOINTS = new Set([
  "login",
  "forgotPassword",
  "passwordResetPreview",
  "passwordResetConfirm",
  "activationPreview",
  "activateAccount",
]);

export const baseQuery = fetchBaseQuery({
  baseUrl,
  prepareHeaders: (headers, { endpoint }) => {
    const accessToken = getAccessToken();
    if (accessToken && !AUTH_ENDPOINTS.has(endpoint)) {
      headers.set("Authorization", `Bearer ${accessToken}`);
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

const fetchFreshPermissions = async (accessToken: string): Promise<string[] | null> => {
  try {
    const response = await fetch(`${baseUrl}/user/auth/me/`, {
      headers: { Authorization: `Bearer ${accessToken}`, accept: "application/json" },
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.data?.permissions ?? null;
  } catch {
    return null;
  }
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
  const result = await baseQuery(args, api, extraOptions);
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

      // Role may have changed since last login — keep permissions fresh.
      const freshPermissions = await fetchFreshPermissions(refreshed.access);
      if (freshPermissions) api.dispatch(updatePermissions(freshPermissions));

      const retry = await baseQuery(args, api, extraOptions);
      if (retry?.error?.status === 401) {
        forceLogoutAndRedirect(api);
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
  ],
});
