import { useGetOnboardingStateQuery } from "@/redux/services/onboarding/onboarding-api";
import type { TaskKey } from "@/redux/services/onboarding/onboarding-types";
import { parseApiError } from "@/utils/api-error";

/**
 * The control room's state, plus the two failures that are not "it broke".
 *
 * `notProvisioned` is the important one. A 404 here does NOT mean the school has
 * done nothing yet - that case answers 200 with a full checklist of Not started
 * steps. It means this school's control room was never built, which is
 * somebody's bug and needs a different screen and a different sentence. Reading
 * both as "empty" is exactly the confusion the backend split the codes to avoid.
 *
 * `closedToYou` covers the 403 a user without `onboarding.progress.view` gets,
 * and the 403 a school gets on a surface that opens at go-live.
 *
 * `skip` is for callers that only want this state in the pre-live case - the
 * support form is the one that does. Once a school is live the call answers
 * nothing they use, and for a user without `onboarding.progress.view` it is a
 * 403 for the trouble.
 */
export function useOnboardingState({ skip = false }: { skip?: boolean } = {}) {
  const query = useGetOnboardingStateQuery(undefined, { skip });
  const { code, status } = parseApiError(query.error);

  const state = query.data?.data ?? null;

  /** Step titles by key, so a blocker list can be named rather than keyed. */
  const titleOf = (key: TaskKey): string =>
    state?.tasks.find((task) => task.key === key)?.title ?? key;

  return {
    ...query,
    state,
    titleOf,
    notProvisioned: code === "ONBOARDING_NOT_PROVISIONED",
    closedToYou: status === 403,
    /** A failure that is none of the above and deserves a retry button. */
    unexpectedError:
      !!query.error && code !== "ONBOARDING_NOT_PROVISIONED" && status !== 403,
  };
}
