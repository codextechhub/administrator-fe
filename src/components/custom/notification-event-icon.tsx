import {
  Bell,
  CircleDollarSign,
  ClipboardCheck,
  DatabaseZap,
  FileOutput,
  Headset,
  KeyRound,
  Rocket,
  ShieldCheck,
  UserRound,
} from "lucide-react";

/**
 * An icon for a notification, chosen from its event key's namespace.
 *
 * Matched on the prefix rather than the whole key, so an event added on the
 * backend gets a sensible icon on the day it ships instead of the generic bell.
 * The bell is the honest fallback for anything genuinely new.
 */
export function NotificationEventIcon({
  eventKey,
  className = "size-4",
}: {
  eventKey: string;
  className?: string;
}) {
  // Onboarding first: it is most of what a school sees before go-live, and its
  // events would otherwise fall through to the generic bell.
  if (eventKey.startsWith("onboarding.")) return <Rocket className={className} />;
  if (eventKey.startsWith("ticket.")) return <Headset className={className} />;
  if (eventKey.startsWith("workflow.")) {
    return <ClipboardCheck className={className} />;
  }
  if (eventKey.startsWith("import.")) return <DatabaseZap className={className} />;
  if (eventKey.startsWith("export.")) return <FileOutput className={className} />;
  if (
    ["finance.", "payments.", "procurement."].some((prefix) =>
      eventKey.startsWith(prefix),
    )
  ) {
    return <CircleDollarSign className={className} />;
  }
  if (eventKey.startsWith("security.")) return <ShieldCheck className={className} />;
  if (eventKey.startsWith("user.password")) return <KeyRound className={className} />;
  if (["user.", "team."].some((prefix) => eventKey.startsWith(prefix))) {
    return <UserRound className={className} />;
  }
  return <Bell className={className} />;
}
