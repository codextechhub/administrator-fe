import { useNavigate } from "react-router";
import { Lock } from "lucide-react";
import { routesPath } from "@/routes/routesPath";
import { OutlinedNotice } from "./outlined-notice";

/**
 * What a school that has not gone live sees where a closed screen would be.
 *
 * Not an error, and styled as none: the school did nothing wrong, the door
 * opens later. Two callers share it, and they answer the same question from
 * different directions. The layout renders it in place of any page outside
 * onboarding, using the tenant status the session already carries - that
 * catches a screen which makes no request at all, which is most of this app
 * today. The `/onboarding/not-live` route renders it for a request the server
 * refused with TENANT_NOT_LIVE, which catches the rest.
 */
export function NotLiveNotice() {
  const navigate = useNavigate();
  return (
    <main className="px-5 pt-3 pb-8">
      <OutlinedNotice
        icon={Lock}
        title="This part of XVS opens when your school goes live"
        body="Until then, onboarding is the part of the app you can use. Your checklist is where you left it."
        actionLabel="Back to control room"
        onAction={() => navigate(routesPath.PROTECTED.ONBOARDING.INDEX)}
      />
    </main>
  );
}
