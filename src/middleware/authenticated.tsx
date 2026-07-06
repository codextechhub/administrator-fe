import { selectUser } from "@/redux/features/auth/auth-slice";
import { useGetMeQuery } from "@/redux/services/auth/auth-api";
import { routesPath } from "@/routes/routesPath";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Outlet } from "react-router";
import { evaluateGate } from "@/utils/session-gate";
import { endSession } from "@/utils/end-session";
import { captureReturnTo } from "@/utils/return-to";
import { DEFAULT_FAVICON, setFavicon } from "@/utils/favicon";
import { useSchoolLogo } from "@/hooks/use-school-logo";

const { LOGIN } = routesPath.AUTH;

export default function Authenticated() {
  const [{ shouldRedirect, refreshExpired, idleTooLong }] = useState(evaluateGate);
  const user = useSelector(selectUser);
  // Auth-gated /media/ logo → renderable blob: URL (see use-school-logo).
  const logoBlobUrl = useSchoolLogo();

  useEffect(() => {
    if (!shouldRedirect) return;
    // Only show the expiry banner + clean up when there was an actual session
    // to end. A missing cookie just means "go log in" — no banner needed.
    if (refreshExpired || idleTooLong) {
      endSession(
        idleTooLong
          ? "Your session expired due to inactivity. Please log in to continue."
          : "Your session has expired. Please log in to continue."
      );
    }
    // Remember the page they were trying to reach so login can return them
    // there. Must run AFTER endSession (which clears sessionStorage).
    captureReturnTo();
    // Hard-redirect (full reload) rather than an in-SPA navigate so all the
    // stale in-memory state from the dead session — Redux store, RTK Query
    // cache, module-level refresh/logout flags — is torn down. This keeps every
    // logout path consistent and prevents a stale token leaking into the next
    // login attempt.
    window.location.replace(LOGIN);
  }, [shouldRedirect, refreshExpired, idleTooLong]);

  // Sync permissions on mount — catches role changes that happened while the
  // token was still valid. onQueryStarted in getMe dispatches updatePermissions.
  useGetMeQuery(undefined, { skip: shouldRedirect });

  useEffect(() => {
    document.title = user?.first_name ? `${user.first_name} - XVS` : "XVS";
  }, [user?.first_name]);

  // Post-login favicon: the signed-in user's school logo, falling back to the
  // bundled XVS mark when the school has no branding upload.
  useEffect(() => {
    setFavicon(logoBlobUrl ?? DEFAULT_FAVICON);
  }, [logoBlobUrl]);

  if (shouldRedirect) return null;

  return <Outlet />;
}
