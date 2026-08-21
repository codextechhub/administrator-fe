import { useNavigate } from "react-router";
import { toast } from "sonner";
import { UsersRound } from "lucide-react";
import { routesPath } from "@/routes/routesPath";
import { useTransitionOnboardingTaskMutation } from "@/redux/services/onboarding/onboarding-api";
import { apiErrorMessage, parseApiError } from "@/utils/api-error";
import { OutlinedNotice } from "./components/outlined-notice";
import { useOnboardingState } from "./use-onboarding-state";

const STAFF_KEY = "STAFF_INVITATIONS";

/**
 * "Invite your staff" - the explanation, not the workshop.
 *
 * The original brief drew a roles-and-invitations screen here: tabs, custom
 * role creation, a module-grouped permission picker, a preview drawer, a bulk
 * upload and an invitation table. The design's own update removed all of it
 * from the pre-go-live app, and the FRD agrees from the other direction -
 * roles and invitations are Module 4's, and M9's entire roles scope is two
 * verification checks it performs on the school's behalf. None of that surface
 * is reachable by a school that has not gone live.
 *
 * So this screen says what is true and offers the two things that actually
 * work: set the step aside, or go back. Skipping is legitimate here in a way it
 * is not for most steps - this one is optional, so it never blocks go-live.
 */
export default function OnboardingStaff() {
  const navigate = useNavigate();
  const { state } = useOnboardingState();
  const [transition, { isLoading }] = useTransitionOnboardingTaskMutation();

  const task = state?.tasks.find((entry) => entry.key === STAFF_KEY);
  const alreadySkipped = task?.status === "SKIPPED";
  const isDone = task?.status === "DONE";

  const skip = async () => {
    try {
      await transition({ key: STAFF_KEY, status: "SKIPPED" }).unwrap();
      toast.success("\"Invite your staff\" set aside for now.");
      navigate(routesPath.PROTECTED.ONBOARDING.INDEX);
    } catch (error) {
      const { code } = parseApiError(error);
      // Asking for the status it already holds is a friendlier refusal than a
      // failure, and the reader has nothing to do about it either way.
      if (code === "TASK_ALREADY_IN_STATE") {
        navigate(routesPath.PROTECTED.ONBOARDING.INDEX);
        return;
      }
      toast.error(
        apiErrorMessage(error, "We could not set that step aside. Try again."),
      );
    }
  };

  return (
    <main className="px-3 py-6 lg:px-10">
      <OutlinedNotice
        icon={UsersRound}
        title="Invite your staff"
        body={
          isDone
            ? "Your staff are in. Nothing more is needed here."
            : "Staff invitations open when your school goes live. You can skip this step for now - it is optional, so skipping it will not hold up your go-live request."
        }
        actionLabel={!isDone && !alreadySkipped ? "Skip for now" : undefined}
        onAction={skip}
        actionLoading={isLoading}
        secondaryLabel="Back to control room"
        onSecondary={() => navigate(routesPath.PROTECTED.ONBOARDING.INDEX)}
      />
    </main>
  );
}
