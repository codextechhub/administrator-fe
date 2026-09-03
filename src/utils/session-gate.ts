/**
 * Pure session-liveness check, shared by the route guards (Authenticated bounces
 * a dead session to /login; Guest bounces a live session away from /login). Kept
 * in one place so the two can never disagree. A deliberate once-per-decision
 * snapshot of external state (cookies, last-activity timestamp, wall clock) -
 * live expiry while mounted is handled by useSessionTimeout + the 401
 * interceptor, not by this gate.
 */
import Cookies from "js-cookie";
import { IDLE_MS, WARNING_MS } from "@/hooks/use-session-timeout";
import { getLastActivity } from "@/utils/session-activity";
import { isJwtExpired } from "@/utils/jwt";

// Same constants as the live idle-warning hook, imported so the on-reload check
// can never drift from the in-app behaviour.
const STALE_AFTER_MS = IDLE_MS + WARNING_MS;

export function evaluateGate() {
  const accessToken = Cookies.get("token");
  const refreshToken = Cookies.get("refresh_token");

  const hasAccess = !!accessToken && accessToken !== "undefined";
  const hasRefresh = !!refreshToken && refreshToken !== "undefined";

  // Refresh token expired → silent refresh can't recover. Force logout.
  const refreshExpired = hasRefresh && isJwtExpired(refreshToken!);

  // Idle gap longer than the in-app warning window → treat as expired. Skip when
  // no activity has ever been recorded (e.g. a brand-new login on this device)
  // so first-time users aren't immediately bounced.
  const lastActivity = getLastActivity();
  const idleTooLong =
    lastActivity !== null && Date.now() - lastActivity >= STALE_AFTER_MS;

  return {
    shouldRedirect: !hasAccess || refreshExpired || idleTooLong,
    refreshExpired,
    idleTooLong,
  };
}

/** True when there is a usable, non-expired session right now - the exact
 * inverse of the Authenticated gate's redirect decision. */
export function hasLiveSession(): boolean {
  return !evaluateGate().shouldRedirect;
}
