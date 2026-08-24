import { useLocation, useNavigate } from "react-router";
import {
  SupportTicketForm,
  type EscalationPrefill,
} from "@/components/custom/support-ticket-form";
import { routesPath } from "@/routes/routesPath";

/**
 * Escalate an onboarding issue, as a page.
 *
 * The form itself lives in `SupportTicketForm`, shared with the header's
 * headset button which opens the same thing in a sheet. This screen is the
 * page frame around it: a heading, and the route another screen can send
 * somebody to with a prefill in `location.state`.
 */
export default function OnboardingHelp() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = (location.state ?? {}) as EscalationPrefill;

  const toControlRoom = () =>
    navigate(routesPath.PROTECTED.ONBOARDING.INDEX);

  return (
    <main className="px-5 pt-3 pb-8 space-y-5">
      <div>
        <h2 className="text-lg font-semibold font-mont text-black-01">
          Get help
        </h2>
        <p className="mt-1 text-sm text-gray-01 max-w-[70ch] text-pretty">
          Tell CodeX support what is blocking you. Your school and where you are
          in onboarding travel with the ticket, so you do not have to explain the
          setup.
        </p>
      </div>

      <SupportTicketForm
        prefill={prefill}
        onCancel={toControlRoom}
        onDone={toControlRoom}
        className="bg-white rounded-md px-4 py-5 sm:px-6 max-w-200"
      />
    </main>
  );
}
