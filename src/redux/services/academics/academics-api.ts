import { baseApi } from "../base-api";
import type { Envelope, PaginatedEnvelope } from "../onboarding/onboarding-types";
import type {
  AcademicOverview,
  AcademicSession,
  BranchFilter,
  ClassListArgs,
  Department,
  EntityWrite,
  ListArgs,
  Program,
  SchoolClass,
  SessionListArgs,
  SessionWrite,
  StructureTree,
  Subject,
  SubjectListArgs,
} from "./academics-types";

// ─────────────────────────────────────────────────────────────────────────────
// /v1/academics/ - sessions, terms, departments, programmes, levels, classes
// and subjects.
//
// Every list here takes the same branch lens, and it is applied in ONE place
// (`params` below) rather than at each call site. That is deliberate: a lens
// that each screen remembers to pass is a lens one screen will forget, and the
// screen that forgets shows another branch's rows without anything looking
// wrong.
//
// The school is the session's - `?tenant=` is injected centrally by base-api -
// so nothing here takes a school identifier and no caller can reach another
// school's structure by changing an argument.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Turn the lens into query params.
 *
 * "all" and undefined are both dropped, because the server's default IS every
 * branch the caller can see. Sending `branch=all` would be a literal branch
 * reference and answer 404.
 */
function branchParam(branch: BranchFilter): Record<string, string | number> {
  if (branch === undefined || branch === "all") return {};
  return { branch };
}

function listParams(args: ListArgs = {}): Record<string, string | number> {
  const { branch, search, is_active, page } = args;
  return {
    ...branchParam(branch),
    ...(search?.trim() ? { search: search.trim() } : {}),
    // Omitted means active-only on the server, which is what every screen's
    // default filter wants. "all" is the only value worth spelling out.
    ...(is_active ? { is_active } : {}),
    ...(page && page > 1 ? { page } : {}),
  };
}

export const academicsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ── Reads composed by the server, one call per screen ──────────────────
    getAcademicOverview: builder.query<Envelope<AcademicOverview>, void>({
      query: () => ({ url: `/academics/overview/`, method: "GET" }),
      providesTags: ["AcademicOverview"],
    }),

    getStructureTree: builder.query<
      Envelope<StructureTree>,
      { branch?: BranchFilter; session?: number; full?: boolean } | void
    >({
      query: (args) => {
        const { branch, session, full } = args ?? {};
        return {
          url: `/academics/structure/tree/`,
          method: "GET",
          params: {
            ...branchParam(branch),
            ...(session ? { session } : {}),
            // The default stops at levels with counts. That depth cap is what
            // makes this safe to serve unpaginated, so ask for full only when
            // the reader has actually opened a level.
            ...(full ? { depth: "full" } : {}),
          },
        };
      },
      providesTags: ["AcademicStructure"],
    }),

    // ── Sessions and terms ─────────────────────────────────────────────────
    getSessions: builder.query<PaginatedEnvelope<AcademicSession>, SessionListArgs | void>({
      query: (args) => {
        const { branch, search, status, page } = args ?? {};
        return {
          url: `/academics/sessions/`,
          method: "GET",
          params: {
            ...branchParam(branch),
            ...(search?.trim() ? { search: search.trim() } : {}),
            ...(status && status !== "all" ? { status } : {}),
            ...(page && page > 1 ? { page } : {}),
          },
        };
      },
      providesTags: ["Sessions"],
    }),

    getSession: builder.query<Envelope<AcademicSession>, number>({
      query: (id) => ({ url: `/academics/sessions/${id}/`, method: "GET" }),
      providesTags: ["Sessions"],
    }),

    createSession: builder.mutation<Envelope<AcademicSession>, SessionWrite>({
      query: (body) => ({ url: `/academics/sessions/`, method: "POST", body }),
      // A new year changes what the overview's hero and its session count say,
      // so both tags go. Cheaper than a stale landing screen.
      invalidatesTags: ["Sessions", "AcademicOverview"],
    }),

    updateSession: builder.mutation<
      Envelope<AcademicSession>,
      { id: number } & Partial<SessionWrite>
    >({
      query: ({ id, ...body }) => ({
        url: `/academics/sessions/${id}/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Sessions", "AcademicOverview"],
    }),

    activateSession: builder.mutation<Envelope<AcademicSession>, number>({
      query: (id) => ({
        url: `/academics/sessions/${id}/activate/`,
        method: "POST",
      }),
      // Activating one year archives another, so the whole list is stale - and
      // the tree is labelled by the active year, so that goes too.
      invalidatesTags: ["Sessions", "AcademicOverview", "AcademicStructure"],
    }),

    archiveSession: builder.mutation<Envelope<AcademicSession>, number>({
      query: (id) => ({
        url: `/academics/sessions/${id}/archive/`,
        method: "POST",
      }),
      invalidatesTags: ["Sessions", "AcademicOverview", "AcademicStructure"],
    }),

    // ── Departments ────────────────────────────────────────────────────────
    getDepartments: builder.query<PaginatedEnvelope<Department>, ListArgs | void>({
      query: (args) => ({
        url: `/academics/departments/`,
        method: "GET",
        params: listParams(args ?? {}),
      }),
      providesTags: ["AcademicStructure"],
    }),

    createDepartment: builder.mutation<Envelope<Department>, EntityWrite>({
      query: (body) => ({
        url: `/academics/departments/`,
        method: "POST",
        body,
      }),
      // The overview counts departments, so its cache goes with the list's.
      invalidatesTags: ["AcademicStructure", "AcademicOverview"],
    }),

    updateDepartment: builder.mutation<
      Envelope<Department>,
      { id: number } & EntityWrite
    >({
      query: ({ id, ...body }) => ({
        url: `/academics/departments/${id}/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["AcademicStructure", "AcademicOverview"],
    }),

    deleteDepartment: builder.mutation<Envelope<null>, number>({
      query: (id) => ({
        url: `/academics/departments/${id}/`,
        method: "DELETE",
      }),
      // Subjects carry a department, so a deletion changes what their cards
      // print even though it does not delete them.
      invalidatesTags: ["AcademicStructure", "AcademicOverview", "Subjects"],
    }),

    // ── Programmes (levels arrive nested - the screen is an accordion) ──────
    getPrograms: builder.query<PaginatedEnvelope<Program>, ListArgs | void>({
      query: (args) => ({
        url: `/academics/programs/`,
        method: "GET",
        params: listParams(args ?? {}),
      }),
      providesTags: ["AcademicStructure"],
    }),

    // ── Classes ────────────────────────────────────────────────────────────
    getClasses: builder.query<PaginatedEnvelope<SchoolClass>, ClassListArgs | void>({
      query: (args) => {
        const { level, ...rest } = args ?? {};
        return {
          url: `/academics/classes/`,
          method: "GET",
          params: { ...listParams(rest), ...(level ? { level } : {}) },
        };
      },
      providesTags: ["Classes"],
    }),

    // ── Subjects ───────────────────────────────────────────────────────────
    getSubjects: builder.query<PaginatedEnvelope<Subject>, SubjectListArgs | void>({
      query: (args) => {
        const { is_core, ...rest } = args ?? {};
        return {
          url: `/academics/subjects/`,
          method: "GET",
          params: { ...listParams(rest), ...(is_core ? { is_core } : {}) },
        };
      },
      providesTags: ["Subjects"],
    }),
  }),
});

export const {
  useGetAcademicOverviewQuery,
  useGetStructureTreeQuery,
  useGetSessionsQuery,
  useGetSessionQuery,
  useCreateSessionMutation,
  useUpdateSessionMutation,
  useActivateSessionMutation,
  useArchiveSessionMutation,
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
  useGetProgramsQuery,
  useGetClassesQuery,
  useGetSubjectsQuery,
} = academicsApi;
