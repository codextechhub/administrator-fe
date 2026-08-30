import { baseApi } from "../base-api";
import type { Envelope, PaginatedEnvelope } from "../onboarding/onboarding-types";
import type {
  AdmissionPolicy,
  StudentStatus,
  StudentWrite,
  ClassHistoryRow,
  GuardianDetail,
  GuardianRow,
  HistoryEntry,
  StudentDetail,
  StudentDocumentRow,
  StudentGuardianLink,
  StudentListArgs,
  StudentRow,
  StudentSubject,
  StudentSummary,
} from "./students-types";

// ─────────────────────────────────────────────────────────────────────────────
// Student Management, at /v1/students/ and /v1/guardians/.
//
// **Every read here is closed to a school that has not gone live.** The module
// declares no `pending_tenant_surface`, deliberately: enrolling a child and
// running a promotion are operations of a live school. A pending school gets
// 403 TENANT_NOT_LIVE and base-api redirects it to the not-live screen, so
// nothing in this file needs to handle that case itself.
//
// **`?tenant=` is injected centrally** by base-api. Never add it here.
//
// **Guardians sit under their own prefix**, not under a student, because a
// guardian is reachable from more than one child - so the tenant check on
// those routes cannot be inherited from a student id in the URL.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Drop what the API should not receive.
 *
 * "all" is the screen's word for "no filter", and sending it would be read as a
 * literal value; `undefined` and "" are the same idea arriving by other routes.
 * Doing it here rather than at each call site means one place decides, and a
 * new filter cannot forget.
 */
function listParams(args: StudentListArgs | void) {
  const source = (args ?? {}) as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(source).filter(
      ([, value]) => value !== undefined && value !== "" && value !== "all",
    ),
  );
}

export const studentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * The directory's header: the tiles, the status bar and the capacity panel.
     *
     * Aggregated over the same scoped queryset the list uses, and narrowed by
     * the same `?branch=`, so the figures can never describe a different set of
     * students from the table below them. That agreement is the whole point:
     * the summary used not to take a branch, and the tiles sat there saying 87
     * over a table showing 49.
     */
    getStudentSummary: builder.query<
      Envelope<StudentSummary>,
      { branch?: number } | void
    >({
      query: (args) => ({
        url: `/students/summary/`,
        method: "GET",
        params: listParams(args as StudentListArgs | void),
      }),
      providesTags: ["Students"],
    }),

    getStudents: builder.query<PaginatedEnvelope<StudentRow>, StudentListArgs | void>({
      query: (args) => ({
        url: `/students/`,
        method: "GET",
        params: listParams(args),
      }),
      providesTags: ["Students"],
    }),

    /**
     * On the roll with no class. Drives the nav badge and the assign screen.
     *
     * Deliberately narrower than "no active enrolment", which would also sweep
     * in applicants and leavers - and this is a count in front of a registrar
     * all day, so a wrong definition is a wrong number all day.
     */
    getUnplacedStudents: builder.query<
      PaginatedEnvelope<StudentRow>,
      { branch?: number } | void
    >({
      query: (args) => ({
        url: `/students/unplaced/`,
        method: "GET",
        params: listParams(args as StudentListArgs | void),
      }),
      providesTags: ["Students"],
    }),

    getStudent: builder.query<Envelope<StudentDetail>, number>({
      query: (id) => ({ url: `/students/${id}/`, method: "GET" }),
      providesTags: ["Students"],
    }),

    getStudentGuardians: builder.query<Envelope<StudentGuardianLink[]>, number>({
      query: (id) => ({ url: `/students/${id}/guardians/`, method: "GET" }),
      providesTags: ["Students", "Guardians"],
    }),

    /** Read from Academic Structure for the level of the student's class. */
    getStudentSubjects: builder.query<Envelope<StudentSubject[]>, number>({
      query: (id) => ({ url: `/students/${id}/subjects/`, method: "GET" }),
      providesTags: ["Students"],
    }),

    getStudentClassHistory: builder.query<PaginatedEnvelope<ClassHistoryRow>, number>({
      query: (id) => ({ url: `/students/${id}/class-history/`, method: "GET" }),
      providesTags: ["Students"],
    }),

    getStudentDocuments: builder.query<Envelope<StudentDocumentRow[]>, number>({
      query: (id) => ({ url: `/students/${id}/documents/`, method: "GET" }),
      providesTags: ["Students"],
    }),

    /**
     * The History tab: the module's status log and the platform's audit trail
     * merged into one stream, newest first.
     */
    getStudentHistory: builder.query<PaginatedEnvelope<HistoryEntry>, number>({
      query: (id) => ({ url: `/students/${id}/history/`, method: "GET" }),
      providesTags: ["Students"],
    }),

    getGuardians: builder.query<
      PaginatedEnvelope<GuardianRow>,
      { search?: string; page?: number; branch?: number } | void
    >({
      query: (args) => ({
        url: `/guardians/`,
        method: "GET",
        params: listParams(args as StudentListArgs | void),
      }),
      providesTags: ["Guardians"],
    }),

    getGuardian: builder.query<Envelope<GuardianDetail>, number>({
      query: (id) => ({ url: `/guardians/${id}/`, method: "GET" }),
      providesTags: ["Guardians"],
    }),

    // ── writes ────────────────────────────────────────────────────────────
    //
    // **Every one of them is `silent`.** base-api fires a global toast for a
    // 400, built from the FIRST entry in the error's `detail` map - which for
    // these routes is a bare value with no sentence around it. Refusing a
    // cross-branch transfer produced two toasts: the envelope's actual message
    // ("SSS1 B belongs to the Annex, and this student is at the Main Branch.
    // Move the student's branch or pick a class at the Main Branch.") and,
    // under it, the words "Lagoon View Academy Main Branch" on their own.
    // Every drawer here handles its own errors and shows the message, so the
    // global one is silenced rather than left to contradict it.
    //
    // Four routes, and which one to use is not a style choice. Class and status
    // each move through their OWN endpoint so each keeps its reason, its
    // effective date and its own audit line - the record has to be able to say
    // WHY a child left a class, and a PATCH that silently changed it could not.
    // `PATCH /students/<id>/` therefore accepts neither.

    updateStudent: builder.mutation<
      Envelope<StudentDetail>,
      { id: number } & Partial<StudentWrite>
    >({
      query: ({ id, ...body }) => ({
        url: `/students/${id}/`,
        method: "PATCH",
        body,
      }),
      extraOptions: { silent: true },
      invalidatesTags: ["Students"],
    }),

    /**
     * Move a student along the state machine.
     *
     * `to_status` must be one the server offered in `allowed_transitions` on
     * the detail payload. The screen never derives that list: a transition the
     * backend refuses should not be a button at all.
     */
    changeStudentStatus: builder.mutation<
      Envelope<StudentDetail>,
      {
        id: number;
        to_status: StudentStatus;
        reason: string;
        effective_date?: string;
        destination_school?: string;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/students/${id}/status/`,
        method: "POST",
        body,
      }),
      extraOptions: { silent: true },
      invalidatesTags: ["Students"],
    }),

    /**
     * Assign or transfer. One route for both: the difference is whether the
     * student already had a class, which the server knows and the screen does
     * not need to encode twice.
     *
     * `allow_over_capacity` is an acknowledgement, not a preference. Send false
     * first; the server refuses with a capacity error, and only then does the
     * screen ask and resend with true.
     */
    assignClass: builder.mutation<
      Envelope<StudentDetail>,
      {
        id: number;
        school_class: number;
        reason?: string;
        effective_date?: string;
        allow_over_capacity?: boolean;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/students/${id}/assign-class/`,
        method: "POST",
        body,
      }),
      extraOptions: { silent: true },
      invalidatesTags: ["Students"],
    }),

    /** Link an existing guardian by id, or create one inline by name + phone. */
    linkGuardian: builder.mutation<
      Envelope<StudentGuardianLink[]>,
      {
        id: number;
        guardian_id?: number;
        full_name?: string;
        phone?: string;
        email?: string;
        relationship: string;
        is_primary?: boolean;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/students/${id}/guardians/`,
        method: "POST",
        body,
      }),
      extraOptions: { silent: true },
      invalidatesTags: ["Students", "Guardians"],
    }),

    /**
     * Remove the LINK, not the guardian.
     *
     * The guardian record stays in the school's book - they may stand for
     * another child, and deleting the person because one link ended would take
     * a sibling's contact with it.
     */
    unlinkGuardian: builder.mutation<
      Envelope<null>,
      { id: number; guardianId: number }
    >({
      query: ({ id, guardianId }) => ({
        url: `/students/${id}/guardians/${guardianId}/`,
        method: "DELETE",
      }),
      extraOptions: { silent: true },
      invalidatesTags: ["Students", "Guardians"],
    }),

    /**
     * One class's roster, for its seat count.
     *
     * The transfer drawer needs "29 of 30 seats used" for the class being moved
     * INTO. There is no endpoint returning seats for every class at once (see
     * the phase 2 backend ask), so this is fetched for the one class the user
     * picked - which is also all the design shows, since its destination meta
     * only appears after a selection.
     */
    getClassRoster: builder.query<
      PaginatedEnvelope<StudentRow> & {
        seats_used: number;
        capacity: number | null;
        class_name: string;
      },
      number
    >({
      query: (classId) => ({
        url: `/students/classes/${classId}/roster/`,
        method: "GET",
      }),
      providesTags: ["Students"],
    }),

    /** Read with `view`, so the enrolment form can render the rule's hint. */
    getAdmissionPolicy: builder.query<Envelope<AdmissionPolicy>, void>({
      query: () => ({ url: `/students/admission-number-policy/`, method: "GET" }),
      providesTags: ["Students"],
    }),
  }),
});

export const {
  useGetStudentSummaryQuery,
  useGetStudentsQuery,
  useGetUnplacedStudentsQuery,
  useGetStudentQuery,
  useGetStudentGuardiansQuery,
  useGetStudentSubjectsQuery,
  useGetStudentClassHistoryQuery,
  useGetStudentDocumentsQuery,
  useGetStudentHistoryQuery,
  useGetGuardiansQuery,
  useGetGuardianQuery,
  useGetAdmissionPolicyQuery,
  useGetClassRosterQuery,
  useUpdateStudentMutation,
  useChangeStudentStatusMutation,
  useAssignClassMutation,
  useLinkGuardianMutation,
  useUnlinkGuardianMutation,
} = studentsApi;
