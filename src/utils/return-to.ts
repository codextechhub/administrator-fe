// Preserve the page a user was trying to reach when an involuntary redirect to
// login happens (idle/expired session, unrecoverable 401). After they log back
// in we send them there instead of the default landing page.
//
// Stored in sessionStorage so it is scoped to the tab and survives the
// full-page reload our auth redirects perform. NOTE: endSession() calls
// sessionStorage.clear(), so always capture AFTER endSession at the call site.

const KEY = "_auth_return_to";

// Auth/entry routes we must never bounce back to — that would loop the user
// through login again. Mirrors routesPath.AUTH: everything lives under
// /accounts, plus the legacy /login redirect.
const AUTH_PREFIXES = ["/accounts", "/login"];

// A redirect target is safe only if it is a plain root-relative path on THIS
// origin. Reject protocol-relative (//evil.com), backslash tricks, and any
// absolute URL so a crafted return-to can't redirect off-site.
function isSafeInternalPath(path: string): boolean {
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//") || path.startsWith("/\\")) return false;

  const pathname = path.split(/[?#]/)[0];
  if (AUTH_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) return false;
  return true;
}

/** Snapshot the current location as the post-login destination, if it's safe. */
export function captureReturnTo(): void {
  const current = window.location.pathname + window.location.search + window.location.hash;
  if (isSafeInternalPath(current)) {
    sessionStorage.setItem(KEY, current);
  }
}

/** Read and clear the stored destination; returns null if absent or unsafe. */
export function consumeReturnTo(): string | null {
  const value = sessionStorage.getItem(KEY);
  sessionStorage.removeItem(KEY);
  return value && isSafeInternalPath(value) ? value : null;
}
