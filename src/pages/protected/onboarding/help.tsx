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
    <main className="px-5 pt-3 pb-8 flex justify-center">
      {/* A floating card rather than a full-width form, matching the sheet the
          headset opens. A ticket is a short, self-contained thing to write;
          stretching it across a desktop just makes the fields harder to scan. */}
      <section className="w-full max-w-140 bg-white rounded-md px-5 py-6 sm:px-7">
        <h2 className="text-lg font-semibold font-mont text-black-01">
          Get help
        </h2>
        <p className="mt-1 text-sm text-gray-01 text-pretty">
          Tell us what went wrong and we will pick it up.
        </p>

        <div className="mt-5">
          <SupportTicketForm
            prefill={prefill}
            onCancel={toControlRoom}
            onDone={toControlRoom}
          />
        </div>
      </section>
    </main>
  );
}
