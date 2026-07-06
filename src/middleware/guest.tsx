import { Navigate, Outlet } from "react-router";
import { routesPath } from "@/routes/routesPath";
import { hasLiveSession } from "@/utils/session-gate";

// Guest-only gate for the sign-in page. A user who already has a live session
// shouldn't see the login form — e.g. by pressing Back after signing in — so
// bounce them into the app. Uses the same session check as the Authenticated
// gate, so the two can never disagree.
export default function Guest() {
  if (hasLiveSession()) {
    return <Navigate to={routesPath.PROTECTED.OVERVIEW.INDEX} replace />;
  }
  return <Outlet />;
}
