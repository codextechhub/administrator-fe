import { baseApi } from "../base-api";
import type { Envelope } from "../onboarding/onboarding-types";
import type {
  SchoolStaffList,
  SchoolStaffMember,
  StaffInvite,
} from "./staff-types";

// ─────────────────────────────────────────────────────────────────────────────
// The school's own staff, at /v1/i/me/staff/.
//
// Like `/v1/i/me/profile/`, it takes no school identifier: the school is the
// session's, so there is nothing to tamper with and no way to read anybody
// else's people. It is open before go-live, which is the whole point - "Add
// Staff & Invitations" is a step on the school's checklist, and the platform's
// own accounts endpoint is gated on `platform.team.*`, which a school
// administrator does not hold and should not.
//
// `silent: true` for the same reason as the onboarding endpoints: the refusals
// here are sentences the reader has to act on ("that address already has an
// account"), and they are rendered against the field that caused them rather
// than thrown at a global toast.
// ─────────────────────────────────────────────────────────────────────────────
export const staffApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSchoolStaff: builder.query<SchoolStaffList, { page?: number } | void>({
      query: (args) => ({
        url: `/i/me/staff/`,
        method: "GET",
        params: { page: args?.page ?? 1 },
      }),
      extraOptions: { silent: true },
      providesTags: ["SchoolStaff"],
    }),

    /**
     * Invite somebody onto the staff.
     *
     * Invalidates the checklist as well as the list: the platform decides
     * whether "Add Staff & Invitations" is done by looking at who is here, so
     * a successful invitation can change the card behind this screen.
     */
    inviteSchoolStaff: builder.mutation<Envelope<SchoolStaffMember>, StaffInvite>({
      query: (body) => ({ url: `/i/me/staff/`, method: "POST", body }),
      extraOptions: { silent: true },
      invalidatesTags: ["SchoolStaff", "Onboarding"],
    }),

    /**
     * Send an existing invitation again.
     *
     * Deliberately not "invite them again": this reuses the account that is
     * already there, so a school chasing somebody who never clicked the link
     * cannot end up with two rows for one person.
     */
    resendStaffInvitation: builder.mutation<Envelope<SchoolStaffMember>, number>({
      query: (id) => ({ url: `/i/me/staff/${id}/resend/`, method: "POST" }),
      extraOptions: { silent: true },
      invalidatesTags: ["SchoolStaff"],
    }),
  }),
});

export const {
  useGetSchoolStaffQuery,
  useInviteSchoolStaffMutation,
  useResendStaffInvitationMutation,
} = staffApi;
