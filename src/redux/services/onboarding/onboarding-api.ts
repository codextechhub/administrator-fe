import { updateTenant } from "../../features/auth/auth-slice";
import type { TenantInfo } from "../../features/auth/auth-types";
import { baseApi } from "../base-api";
import type {
  Envelope,
  GoLiveRequest,
  GoLiveStatus,
  OnboardingState,
  OnboardingTask,
  PaginatedEnvelope,
  TaskKey,
  TaskStatus,
} from "./onboarding-types";

// ─────────────────────────────────────────────────────────────────────────────
// The onboarding control room: /v1/onboarding/.
//
// This is the ONLY surface a school that has not gone live can reach (plus its
// own account, the notification inbox and filing one support ticket). Every
// other endpoint answers 403 TENANT_NOT_LIVE for a PENDING tenant, which is why
// the control room links out with an explanation rather than into a form that
// would be refused.
//
// `extraOptions: { silent: true }` on every endpoint is deliberate. The base
// query toasts 400/403/404/422 globally, and onboarding's refusals are not
// generic failures - each one is a sentence the school has to keep reading
// (TASK_CONDITION_NOT_MET renders inline under its card; ONBOARDING_NOT_
// PROVISIONED is a whole empty state). The pages own that copy; see
// @/utils/api-error for reading the code back off the rejection.
// ─────────────────────────────────────────────────────────────────────────────
export const onboardingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * The whole control room in one call: readiness, the checklist, the counts,
     * what is blocking go-live and the expiry window.
     *
     * A 404 here is not "nothing done yet" - it is ONBOARDING_NOT_PROVISIONED,
     * meaning this school's control room was never built. The two must render
     * differently, so the page branches on the error code rather than on an
     * empty task list.
     */
    getOnboardingState: builder.query<Envelope<OnboardingState>, void>({
      query: () => ({ url: `/onboarding/state/`, method: "GET" }),
      extraOptions: { silent: true },
      providesTags: ["Onboarding"],
      async onQueryStarted(_, { dispatch, getState, queryFulfilled }) {
        // Self-heal the cached tenant status.
        //
        // The shell reads `tenant.status` to decide what a school may open, and
        // that value arrives with the session. Activation happens on CodeX's
        // side: the school is told by notification, so its cached tenant still
        // says PENDING while the server has already opened every surface. This
        // payload is the authority on whether a school is live, so the moment
        // it says LIVE the cached status is corrected - the school's own
        // sidebar comes back without it having to sign in again.
        try {
          const { data } = await queryFulfilled;
          if (data?.data?.readiness_state !== "LIVE") return;
          const tenant = (getState() as { auth?: { tenant?: TenantInfo | null } })
            ?.auth?.tenant;
          if (!tenant || tenant.status === "ACTIVE") return;
          dispatch(updateTenant({ ...tenant, status: "ACTIVE" }));
        } catch {
          // A failed state call says nothing about the tenant; leave it alone.
        }
      },
    }),

    /**
     * Force the readiness evaluation to run again.
     *
     * Stamps `last_validation_at` even when nothing changed, which is the point:
     * the school asked "is it still true?" and deserves a fresh timestamp for
     * the answer. Returns the same payload as `state/`.
     */
    revalidateOnboarding: builder.mutation<Envelope<OnboardingState>, void>({
      query: () => ({ url: `/onboarding/revalidate/`, method: "POST" }),
      extraOptions: { silent: true },
      invalidatesTags: ["Onboarding"],
    }),

    /**
     * Move one step. Addressed by catalog key, never by id.
     *
     * The server refuses more than it accepts here, and each refusal means
     * something different to the school: TASK_CONDITION_NOT_MET carries the
     * sentence naming what is still missing, REQUIRED_TASK_NOT_SKIPPABLE says
     * this step may not be set aside at all, TASK_ALREADY_IN_STATE says nothing
     * needed doing. The card renders the first inline and toasts the other two.
     */
    transitionOnboardingTask: builder.mutation<
      Envelope<OnboardingTask>,
      { key: TaskKey; status: TaskStatus }
    >({
      query: ({ key, status }) => ({
        url: `/onboarding/tasks/${encodeURIComponent(key)}/`,
        method: "PATCH",
        body: { status },
      }),
      extraOptions: { silent: true },
      // Readiness, the counts and the blocker list all move with a task, so the
      // whole state is refetched rather than patched locally - the gate must
      // never be computed on this side.
      invalidatesTags: ["Onboarding"],
    }),

    /**
     * Current and historical go-live requests, newest first.
     *
     * The one onboarding list that grows without bound: a school rejected four
     * times has four rows plus the one it is waiting on. Without it a rejected
     * request would simply vanish from the interface.
     */
    getGoLiveRequests: builder.query<
      PaginatedEnvelope<GoLiveRequest>,
      { page?: number; page_size?: number; status?: GoLiveStatus } | void
    >({
      query: (params) => ({
        url: `/onboarding/go-live/`,
        method: "GET",
        params: params ?? undefined,
      }),
      extraOptions: { silent: true },
      providesTags: ["GoLiveRequests"],
    }),

    /**
     * Ask CodeX to take the school live.
     *
     * `acknowledged` is what makes the request valid - the server answers 422
     * ACKNOWLEDGEMENT_REQUIRED for both a missing and a false one - and
     * `preferred_go_live_at` is advisory: activation happens when CodeX
     * approves, not on the date the school picked.
     */
    submitGoLiveRequest: builder.mutation<
      Envelope<GoLiveRequest>,
      { preferred_go_live_at: string; note?: string; acknowledged: boolean }
    >({
      query: (body) => ({
        url: `/onboarding/go-live/request/`,
        method: "POST",
        body,
      }),
      extraOptions: { silent: true },
      // Readiness flips to PENDING_APPROVAL on the same call, so the control
      // room's gate panel is stale the moment this succeeds.
      invalidatesTags: ["GoLiveRequests", "Onboarding"],
    }),
  }),
});

export const {
  useGetOnboardingStateQuery,
  useRevalidateOnboardingMutation,
  useTransitionOnboardingTaskMutation,
  useGetGoLiveRequestsQuery,
  useSubmitGoLiveRequestMutation,
} = onboardingApi;
