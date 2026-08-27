import { baseApi } from "../base-api";
import type { Envelope, PaginatedEnvelope } from "../onboarding/onboarding-types";
import {
  branchParam,
  eventParams,
  periodParams,
  roomParams,
  sessionParam,
} from "./calendar-params";
import type {
  BellSchedule,
  CalendarCurrent,
  CalendarEvent,
  CalendarEventWrite,
  CalendarOverview,
  CalendarYear,
  ClassTimetable,
  ClassTimetableRow,
  DuplicateArgs,
  DuplicateSummary,
  EventListArgs,
  Exam,
  ExamSlot,
  ExamSlotWrite,
  Period,
  PeriodListArgs,
  PeriodWrite,
  Room,
  RoomListArgs,
  RoomWrite,
  SlotWrite,
  TeacherRow,
  TeacherTimetable,
  TimetableSlot,
  WithWarnings,
} from "./calendar-types";

// ─────────────────────────────────────────────────────────────────────────────
// The academic calendar and the timetables that run inside it.
//
//   /academics/calendar/    events, and the three reads behind the hub
//   /academics/timetable/   rooms, the bell schedule, class and teacher grids
//   /academics/exams/       exam periods and their papers
//
// **Both lenses are applied here, not at the call sites.** Every row in this
// module belongs to exactly one branch scope AND exactly one school year, and a
// lens each screen remembers to pass is a lens one screen will forget. The
// screen that forgets shows another branch's rooms, or last year's bell
// schedule, with nothing on screen to say so. Same rule, and the same single
// `params` helper, as academics-api.ts.
//
// The school is the session's - `?tenant=` is injected centrally by base-api -
// so nothing here takes a school identifier and no caller can reach another
// school's calendar by changing an argument.
//
// **A clash is not an error.** Several writes here succeed and still have
// something to say, and it arrives in `data.warnings` beside the row that WAS
// written. Nothing in this file treats a warning as a failure, and no screen
// should either: the grid saves with clashes in it, and only publishing is
// blocked while one stands.
// ─────────────────────────────────────────────────────────────────────────────

export const calendarApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ── The hub, and the year as a timeline ────────────────────────────────
    //
    // All three answer 200 with `{}` when the school has not started a year. A
    // school that has not opened its first session is not a school with a
    // broken calendar, so nothing here 404s on that.

    getCalendarOverview: builder.query<
      Envelope<CalendarOverview>,
      { branch?: number | "all"; session?: number; on?: string } | void
    >({
      query: (args) => ({
        url: `/academics/calendar/overview/`,
        method: "GET",
        params: {
          ...branchParam(args?.branch),
          ...sessionParam(args?.session),
          ...(args?.on ? { on: args.on } : {}),
        },
      }),
      providesTags: ["CalendarOverview"],
    }),

    getCalendarYear: builder.query<
      Envelope<CalendarYear>,
      { session?: number; on?: string } | void
    >({
      query: (args) => ({
        url: `/academics/calendar/year/`,
        method: "GET",
        params: { ...sessionParam(args?.session), ...(args?.on ? { on: args.on } : {}) },
      }),
      providesTags: ["CalendarOverview"],
    }),

    /** What year and term it is. Cheap, and what the session pill defaults to. */
    getCalendarCurrent: builder.query<Envelope<CalendarCurrent>, void>({
      query: () => ({ url: `/academics/calendar/current/`, method: "GET" }),
      providesTags: ["CalendarOverview"],
    }),

    // ── Events ─────────────────────────────────────────────────────────────

    getCalendarEvents: builder.query<
      PaginatedEnvelope<CalendarEvent>,
      EventListArgs | void
    >({
      query: (args) => ({
        url: `/academics/calendar/events/`,
        method: "GET",
        params: eventParams(args ?? {}),
      }),
      providesTags: ["Calendar"],
    }),

    getCalendarEvent: builder.query<Envelope<CalendarEvent>, number>({
      query: (id) => ({ url: `/academics/calendar/events/${id}/`, method: "GET" }),
      providesTags: ["Calendar"],
    }),

    createCalendarEvent: builder.mutation<
      Envelope<WithWarnings<CalendarEvent>>,
      CalendarEventWrite
    >({
      query: (body) => ({
        url: `/academics/calendar/events/`,
        method: "POST",
        body,
      }),
      // The hub counts events in the term and raises an alert for one dated
      // outside every term, so both move. An EXAM_PERIOD event is also what an
      // exam timetable hangs off, which is why Exams goes too.
      invalidatesTags: ["Calendar", "CalendarOverview", "Exams"],
    }),

    updateCalendarEvent: builder.mutation<
      Envelope<WithWarnings<CalendarEvent>>,
      { id: number } & Partial<CalendarEventWrite>
    >({
      query: ({ id, ...body }) => ({
        url: `/academics/calendar/events/${id}/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Calendar", "CalendarOverview", "Exams"],
    }),

    deleteCalendarEvent: builder.mutation<Envelope<null>, number>({
      query: (id) => ({
        url: `/academics/calendar/events/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["Calendar", "CalendarOverview", "Exams"],
    }),

    // ── Rooms ──────────────────────────────────────────────────────────────

    getRooms: builder.query<PaginatedEnvelope<Room>, RoomListArgs | void>({
      query: (args) => ({
        url: `/academics/timetable/rooms/`,
        method: "GET",
        params: roomParams(args ?? {}),
      }),
      providesTags: ["Rooms"],
    }),

    createRoom: builder.mutation<Envelope<Room>, RoomWrite>({
      query: (body) => ({ url: `/academics/timetable/rooms/`, method: "POST", body }),
      invalidatesTags: ["Rooms", "CalendarOverview"],
    }),

    updateRoom: builder.mutation<Envelope<Room>, { id: number } & Partial<RoomWrite>>({
      query: ({ id, ...body }) => ({
        url: `/academics/timetable/rooms/${id}/`,
        method: "PATCH",
        body,
      }),
      // A renamed or deactivated room is named on every grid that books it, and
      // on every exam paper sitting in it.
      invalidatesTags: [
        "Rooms", "CalendarOverview", "ClassTimetables", "TeacherTimetables", "Exams",
      ],
    }),

    /**
     * Delete a room outright, for one typed by mistake.
     *
     * A room that holds lessons or papers is refused by the server with a
     * sentence naming what is in it, and that sentence is what the screen shows.
     * Taking a room out of use is `updateRoom({is_active: false})`, not this.
     */
    deleteRoom: builder.mutation<Envelope<null>, number>({
      query: (id) => ({
        url: `/academics/timetable/rooms/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["Rooms", "CalendarOverview"],
    }),

    // ── The bell schedule ──────────────────────────────────────────────────

    /**
     * Unpaginated, and an object rather than a list.
     *
     * `day` does not filter on the column: it returns the periods in FORCE that
     * weekday, and a day with its own rows runs only those.
     */
    getPeriods: builder.query<Envelope<BellSchedule>, PeriodListArgs | void>({
      query: (args) => ({
        url: `/academics/timetable/periods/`,
        method: "GET",
        params: periodParams(args ?? {}),
      }),
      providesTags: ["Periods"],
    }),

    createPeriod: builder.mutation<Envelope<Period>, PeriodWrite>({
      query: (body) => ({
        url: `/academics/timetable/periods/`,
        method: "POST",
        body,
      }),
      // The periods ARE the rows of every grid, so adding one adds a row to
      // every class's week and every teacher's.
      invalidatesTags: ["Periods", "ClassTimetables", "TeacherTimetables"],
    }),

    updatePeriod: builder.mutation<
      Envelope<Period>,
      { id: number } & Partial<PeriodWrite>
    >({
      query: ({ id, ...body }) => ({
        url: `/academics/timetable/periods/${id}/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Periods", "ClassTimetables", "TeacherTimetables"],
    }),

    deletePeriod: builder.mutation<Envelope<null>, number>({
      query: (id) => ({
        url: `/academics/timetable/periods/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["Periods", "ClassTimetables", "TeacherTimetables"],
    }),

    // ── Class timetables ───────────────────────────────────────────────────

    /** The class picker: every class, with its lesson count, state and clash. */
    getClassTimetables: builder.query<
      Envelope<ClassTimetableRow[]>,
      { branch?: number | "all"; session?: number } | void
    >({
      query: (args) => ({
        url: `/academics/timetable/classes/`,
        method: "GET",
        params: { ...branchParam(args?.branch), ...sessionParam(args?.session) },
      }),
      providesTags: ["ClassTimetables"],
    }),

    getClassTimetable: builder.query<
      Envelope<ClassTimetable>,
      { id: number; session?: number }
    >({
      query: ({ id, session }) => ({
        url: `/academics/timetable/classes/${id}/`,
        method: "GET",
        params: sessionParam(session),
      }),
      providesTags: ["ClassTimetables"],
    }),

    /**
     * Fill one empty cell.
     *
     * Succeeds even when it creates a clash, and says so in `warnings`. That is
     * the product rule, not a leak: a school that discovers at Period 5 that
     * Mrs Adeyemi is already booked needs to save the grid, see both cells in
     * red, and resolve them when the head of department is back on Monday.
     */
    createSlot: builder.mutation<Envelope<WithWarnings<TimetableSlot>>, SlotWrite>({
      query: (body) => ({ url: `/academics/timetable/slots/`, method: "POST", body }),
      // A lesson lands on the class's grid, on the teacher's week, and on the
      // hub's clash alert and timetabled count.
      invalidatesTags: ["ClassTimetables", "TeacherTimetables", "CalendarOverview"],
    }),

    updateSlot: builder.mutation<
      Envelope<WithWarnings<TimetableSlot>>,
      { id: number } & Partial<SlotWrite>
    >({
      query: ({ id, ...body }) => ({
        url: `/academics/timetable/slots/${id}/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["ClassTimetables", "TeacherTimetables", "CalendarOverview"],
    }),

    /** "Clear this slot" in the lesson drawer. */
    deleteSlot: builder.mutation<Envelope<null>, number>({
      query: (id) => ({ url: `/academics/timetable/slots/${id}/`, method: "DELETE" }),
      invalidatesTags: ["ClassTimetables", "TeacherTimetables", "CalendarOverview"],
    }),

    /**
     * What duplicating a week WOULD do. Writes nothing.
     *
     * Separate from the real call rather than a flag on it, so a caller cannot
     * mistype the flag and perform the write it meant to preview. It provides
     * no tags and invalidates none: nothing changed.
     */
    previewDuplicateTimetable: builder.query<Envelope<DuplicateSummary>, DuplicateArgs>({
      query: ({ id, source_class, keep_teachers, keep_rooms }) => ({
        url: `/academics/timetable/classes/${id}/duplicate/`,
        method: "POST",
        params: { preview: 1 },
        body: {
          source_class,
          keep_teachers: keep_teachers ?? true,
          keep_rooms: keep_rooms ?? true,
        },
      }),
    }),

    duplicateTimetable: builder.mutation<Envelope<DuplicateSummary>, DuplicateArgs>({
      query: ({ id, source_class, keep_teachers, keep_rooms }) => ({
        url: `/academics/timetable/classes/${id}/duplicate/`,
        method: "POST",
        body: {
          source_class,
          keep_teachers: keep_teachers ?? true,
          keep_rooms: keep_rooms ?? true,
        },
      }),
      invalidatesTags: ["ClassTimetables", "TeacherTimetables", "CalendarOverview"],
    }),

    /** Empties the grid, and drops a published one back to draft. */
    clearTimetable: builder.mutation<Envelope<null>, { id: number }>({
      query: ({ id }) => ({
        url: `/academics/timetable/classes/${id}/clear/`,
        method: "POST",
      }),
      invalidatesTags: ["ClassTimetables", "TeacherTimetables", "CalendarOverview"],
    }),

    /**
     * Publish, which is the one moment a school asserts the grid is finished.
     *
     * Refused while a clash stands, or while the grid is incomplete. The
     * refusal is the server's sentence and is shown as it arrives.
     */
    publishTimetable: builder.mutation<Envelope<ClassTimetable>, { id: number }>({
      query: ({ id }) => ({
        url: `/academics/timetable/classes/${id}/publish/`,
        method: "POST",
      }),
      invalidatesTags: ["ClassTimetables", "CalendarOverview"],
    }),

    // ── Teacher timetables ─────────────────────────────────────────────────

    /**
     * The teacher picker: every teacher of the school, alphabetical.
     *
     * Deliberately NOT narrowed by the branch lens. Mr Eze teaches Physics at
     * Lekki on Monday to Wednesday and at Ikeja on Thursday and Friday, and a
     * picker filtered by the branch being edited would make him unschedulable
     * at the second. What makes the wide picker safe is that the clash query is
     * wide too.
     */
    getTeachers: builder.query<
      Envelope<TeacherRow[]>,
      { search?: string; session?: number } | void
    >({
      query: (args) => ({
        url: `/academics/timetable/teachers/`,
        method: "GET",
        params: {
          ...(args?.search?.trim() ? { search: args.search.trim() } : {}),
          ...sessionParam(args?.session),
        },
      }),
      providesTags: ["TeacherTimetables"],
    }),

    getTeacherTimetable: builder.query<
      Envelope<TeacherTimetable>,
      { id: number; session?: number }
    >({
      query: ({ id, session }) => ({
        url: `/academics/timetable/teachers/${id}/`,
        method: "GET",
        params: sessionParam(session),
      }),
      providesTags: ["TeacherTimetables"],
    }),

    // ── Exams ──────────────────────────────────────────────────────────────

    /**
     * Every exam period in the year, each with its papers and its clashes.
     *
     * A list, not one row: a school may run mocks in November and end-of-term
     * exams in December, and both are exam periods. An empty list is the
     * screen's blocking empty state, and it means the calendar holds no
     * EXAM_PERIOD event rather than that anything is broken.
     */
    getExams: builder.query<Envelope<Exam[]>, { session?: number } | void>({
      query: (args) => ({
        url: `/academics/exams/`,
        method: "GET",
        params: sessionParam(args?.session),
      }),
      providesTags: ["Exams"],
    }),

    /**
     * Attach an exam timetable to an exam period.
     *
     * Idempotent against the event: asked twice for the same exam period it
     * returns the row that already exists. So a screen may call it on the way
     * to adding the first paper without asking a school to name the same thing
     * twice.
     */
    createExam: builder.mutation<
      Envelope<Exam>,
      { calendar_event: number; name?: string }
    >({
      query: (body) => ({ url: `/academics/exams/`, method: "POST", body }),
      invalidatesTags: ["Exams"],
    }),

    createExamSlot: builder.mutation<
      Envelope<WithWarnings<ExamSlot>>,
      { examId: number } & ExamSlotWrite
    >({
      query: ({ examId, ...body }) => ({
        url: `/academics/exams/${examId}/slots/`,
        method: "POST",
        body,
      }),
      // A room booked for a paper changes what that room reports as its usage.
      invalidatesTags: ["Exams", "Rooms"],
    }),

    updateExamSlot: builder.mutation<
      Envelope<WithWarnings<ExamSlot>>,
      { examId: number; id: number } & Partial<ExamSlotWrite>
    >({
      query: ({ examId, id, ...body }) => ({
        url: `/academics/exams/${examId}/slots/${id}/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Exams", "Rooms"],
    }),

    deleteExamSlot: builder.mutation<Envelope<null>, { examId: number; id: number }>({
      query: ({ examId, id }) => ({
        url: `/academics/exams/${examId}/slots/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["Exams", "Rooms"],
    }),

    publishExam: builder.mutation<Envelope<Exam>, { id: number }>({
      query: ({ id }) => ({ url: `/academics/exams/${id}/publish/`, method: "POST" }),
      invalidatesTags: ["Exams"],
    }),
  }),
});

export const {
  useGetCalendarOverviewQuery,
  useGetCalendarYearQuery,
  useGetCalendarCurrentQuery,
  useGetCalendarEventsQuery,
  useGetCalendarEventQuery,
  useCreateCalendarEventMutation,
  useUpdateCalendarEventMutation,
  useDeleteCalendarEventMutation,
  useGetRoomsQuery,
  useCreateRoomMutation,
  useUpdateRoomMutation,
  useDeleteRoomMutation,
  useGetPeriodsQuery,
  useCreatePeriodMutation,
  useUpdatePeriodMutation,
  useDeletePeriodMutation,
  useGetClassTimetablesQuery,
  useGetClassTimetableQuery,
  useCreateSlotMutation,
  useUpdateSlotMutation,
  useDeleteSlotMutation,
  useLazyPreviewDuplicateTimetableQuery,
  useDuplicateTimetableMutation,
  useClearTimetableMutation,
  usePublishTimetableMutation,
  useGetTeachersQuery,
  useGetTeacherTimetableQuery,
  useGetExamsQuery,
  useCreateExamMutation,
  useCreateExamSlotMutation,
  useUpdateExamSlotMutation,
  useDeleteExamSlotMutation,
  usePublishExamMutation,
} = calendarApi;
