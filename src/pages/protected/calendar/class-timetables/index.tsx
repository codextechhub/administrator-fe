import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  AlertTriangle,
  Bell,
  Copy,
  Eraser,
  GraduationCap,
  Printer,
  Send,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Panel } from "@/components/custom/surface";
import PermissionGate from "@/components/custom/permission-gate";
import PromptModal from "@/components/modal/prompt-modal";
import { OutlinedNotice } from "@/pages/protected/onboarding/components/outlined-notice";
import { routesPath } from "@/routes/routesPath";
import { P } from "@/permissions";
import { usePermissions } from "@/hooks/use-permissions";
import { useAcademicsLens } from "@/hooks/use-academics-lens";
import { parseApiError } from "@/utils/api-error";
import {
  useClearTimetableMutation,
  useCreateSlotMutation,
  useDeleteSlotMutation,
  useDuplicateTimetableMutation,
  useGetClassTimetableQuery,
  useGetClassTimetablesQuery,
  useGetRoomsQuery,
  useGetTeachersQuery,
  useLazyPreviewDuplicateTimetableQuery,
  usePublishTimetableMutation,
  useUpdateSlotMutation,
} from "@/redux/services/calendar/calendar-api";
import { useGetSubjectsQuery } from "@/redux/services/academics/academics-api";
import type { GridCell } from "@/redux/services/calendar/calendar-types";
import { TimetableGrid } from "../components/timetable-grid";
import {
  LessonDrawer,
  type LessonTarget,
  type LessonValues,
} from "../components/lesson-drawer";
import { DuplicateDrawer } from "../components/duplicate-drawer";
import { ExportButton } from "@/pages/protected/academics/components/export-button";
import { ClassPicker } from "./class-picker";

/**
 * A weekly grid per class. Click an empty cell to fill it.
 *
 * **Three states this screen has that a list does not**, and each is a
 * different answer:
 *
 * *No bell schedule* blocks everything. A grid is built on the school's
 * periods, so with none there are no rows to draw and nothing to click. It
 * points at the screen that fixes it rather than rendering an empty table.
 *
 * *Clashes* are shown and do not block editing. They block PUBLISHING, which
 * is the one moment a school asserts the week is finished.
 *
 * *Published* is not read-only here. A published grid can still be edited, and
 * the seeded data proves it matters: a class can be published and then acquire
 * a clash when another class books the same teacher.
 */
export default function ClassTimetables() {
  const { lens, readOnlyYear } = useAcademicsLens();
  const { hasPermission } = usePermissions();

  const [classId, setClassId] = useState<number | null>(null);
  const [lesson, setLesson] = useState<LessonTarget | null>(null);
  const [dupOpen, setDupOpen] = useState(false);
  const [confirm, setConfirm] = useState<"clear" | null>(null);

  const { data: listData, isLoading: listLoading } =
    useGetClassTimetablesQuery(lens);
  const classes = useMemo(() => listData?.data ?? [], [listData]);

  // The first class the caller can see, until one is picked. A screen that
  // opens on "choose a class" makes a reader do a step the server can do.
  const current = classId ?? classes[0]?.id ?? null;
  const currentRow = classes.find((c) => c.id === current) ?? null;

  const { data: gridData, isLoading: gridLoading } = useGetClassTimetableQuery(
    current ? { id: current, session: lens.session } : { id: 0 },
    { skip: !current },
  );
  const grid = gridData?.data;

  const { data: subjectData } = useGetSubjectsQuery(lens);
  // Deliberately unnarrowed, unlike the teacher screen's list. This is the
  // picker that ASSIGNS a teacher to a lesson, and Mr Eze teaches at both
  // branches: filtering it would make him unschedulable at the second one.
  // What makes the wide picker safe is that the clash query is wide too.
  const { data: teacherData } = useGetTeachersQuery({ session: lens.session });
  // Rooms at THIS class's branch: the server refuses a room anywhere else.
  const { data: roomData } = useGetRoomsQuery(
    currentRow?.branch
      ? { branch: currentRow.branch, active: "true" }
      : { active: "true" },
  );

  const [createSlot, { isLoading: creating }] = useCreateSlotMutation();
  const [updateSlot, { isLoading: updating }] = useUpdateSlotMutation();
  const [deleteSlot, { isLoading: deleting }] = useDeleteSlotMutation();
  const [clear, { isLoading: clearing }] = useClearTimetableMutation();
  const [publish, { isLoading: publishing }] = usePublishTimetableMutation();
  const [previewDuplicate, previewState] =
    useLazyPreviewDuplicateTimetableQuery();
  const [runDuplicate, { isLoading: duplicating }] =
    useDuplicateTimetableMutation();

  const canEdit = hasPermission(P.MODIFY_TIMETABLE_ENTRY) && !readOnlyYear;
  const canManage = hasPermission(P.MANAGE_TIMETABLES) && !readOnlyYear;
  const canPublish = hasPermission(P.PUBLISH_TIMETABLE) && !readOnlyYear;

  const warnings = grid?.warnings ?? [];
  const published = grid?.status === "PUBLISHED";

  const openCell = (cell: GridCell, dayIndex: number) => {
    if (!canEdit || !grid) return;
    const day = grid.days[dayIndex];
    setLesson({
      slot: cell.slot ?? null,
      period: cell.period,
      periodLabel: cell.period_label,
      dayOfWeek: day.day_of_week,
      dayLabel: day.day_label,
    });
  };

  const saveLesson = async (values: LessonValues) => {
    if (!lesson || !current) return [];
    const body = {
      subject: values.subject!,
      teacher: values.teacher,
      room: values.room,
    };
    const result = lesson.slot
      ? await updateSlot({ id: lesson.slot.id, ...body }).unwrap()
      : await createSlot({
          school_class: current,
          day_of_week: lesson.dayOfWeek as 1 | 2 | 3 | 4 | 5,
          period: lesson.period,
          ...body,
        }).unwrap();
    toast.success(result.message);
    // The write happened AND has something to say. Each warning is the
    // server's own sentence, naming who is double-booked and where.
    for (const w of result.data?.warnings ?? []) toast.warning(w.detail);
    return result.data?.warnings ?? [];
  };

  const removeLesson = async () => {
    if (!lesson?.slot) return;
    const result = await deleteSlot(lesson.slot.id).unwrap();
    toast.success(result.message || "Slot cleared.");
  };

  const runClear = async () => {
    if (!current) return;
    try {
      const result = await clear({ id: current }).unwrap();
      toast.success(result.message);
    } catch (error) {
      toast.error(
        parseApiError(error).message || "That timetable could not be cleared.",
      );
    }
    setConfirm(null);
  };

  const runPublish = async () => {
    if (!current) return;
    try {
      const result = await publish({ id: current }).unwrap();
      toast.success(result.message);
    } catch (error) {
      // TIMETABLE_HAS_CLASHES or TIMETABLE_INCOMPLETE. Both are sentences
      // written for this reader and shown as they arrived.
      toast.error(
        parseApiError(error).message || "That timetable could not be published.",
      );
    }
  };

  if (listLoading) {
    return (
      <main className="grid min-w-0 grid-cols-1 content-start gap-5 px-5 pt-3 pb-8">
        <Skeleton className="h-16 w-full rounded-md" />
        <Skeleton className="h-[28rem] w-full rounded-md" />
      </main>
    );
  }

  if (!classes.length) {
    return (
      <main className="px-5 pt-3 pb-8">
        <OutlinedNotice
          icon={GraduationCap}
          title="No classes yet"
          body="A timetable is a week for one class, so there has to be a class first. Add them on Classes & Arms."
          actionLabel="Go to Classes & Arms"
          onAction={() => {
            window.location.assign(
              routesPath.PROTECTED.ACADEMIC_STRUCTURE.CLASSES,
            );
          }}
        />
      </main>
    );
  }

  // The blocking state, and it is the whole screen. A grid is built on the
  // school's periods; with none there are no rows to draw.
  if (grid && !grid.has_bell_schedule) {
    return (
      <main className="grid min-w-0 grid-cols-1 content-start gap-5 px-5 pt-3 pb-8">
        <ClassPicker
          classes={classes}
          current={current}
          onPick={setClassId}
        />
        <OutlinedNotice
          icon={Bell}
          title="No bell schedule yet"
          body="A timetable grid is built on the school's periods, so the bell schedule has to come first."
          actionLabel="Set up the bell schedule"
          onAction={() => {
            window.location.assign(routesPath.PROTECTED.TIMETABLES.BELL_SCHEDULE);
          }}
        />
      </main>
    );
  }

  return (
    <main className="grid min-w-0 grid-cols-1 content-start gap-5 px-5 pt-3 pb-8">
      <div className="print-hide flex flex-wrap items-center justify-between gap-2.5">
        <ClassPicker classes={classes} current={current} onPick={setClassId} />

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="text-sm"
            onClick={() => window.print()}
          >
            <Printer className="size-4" /> Print
          </Button>
          {/* Beside Print rather than instead of it, and absent until a school
              is granted the export keys - which no school role holds today. A
              CSV of forty rows is not what goes on a noticeboard, but it is
              what somebody wants when they are moving the week into a
              spreadsheet, so both are offered where both are possible. */}
          <ExportButton
            screen="calendar.timetable"
            params={{
              school_class: current ?? undefined,
              branch: currentRow?.branch ?? undefined,
            }}
          />
          {canEdit && (
            <Button
              variant="outline"
              className="text-sm"
              onClick={() => setDupOpen(true)}
            >
              <Copy className="size-4" /> Duplicate from…
            </Button>
          )}
          {canManage && (grid?.filled ?? 0) > 0 && (
            <Button
              variant="outline"
              className="text-sm text-error-text"
              onClick={() => setConfirm("clear")}
            >
              <Eraser className="size-4" /> Clear
            </Button>
          )}
          <PermissionGate
            permission={P.PUBLISH_TIMETABLE}
            disabled={readOnlyYear}
          >
            <Button
              className="text-sm"
              onClick={runPublish}
              disabled={!canPublish || publishing}
            >
              <Send className="size-4" />
              {published ? "Republish" : "Publish"}
            </Button>
          </PermissionGate>
        </div>
      </div>

      {gridLoading || !grid ? (
        <Skeleton className="h-[28rem] w-full rounded-md" />
      ) : (
        <Panel className="print-area p-5">
          {/* The document's own heading: on paper there is no session pill and
              no page title to say which class or which year this is. */}
          <div className="print-only mb-4">
            <h1 className="font-mont text-lg font-semibold text-black-01">
              {grid.school_class.name} - weekly timetable
            </h1>
            <p className="text-sm text-gray-06">
              {grid.session.name} · {grid.status_label} ·{" "}
              {grid.filled} of {grid.lesson_periods} teaching periods filled
            </p>
          </div>

          <div className="print-hide flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-mont text-[15px] font-semibold text-black-01">
                {grid.school_class.name}
              </h2>
              <p className="mt-0.5 text-[13px] text-gray-05">
                {/* A count of what exists, carrying no expectation. Nothing
                    knows how many periods a subject should get, so there is no
                    percentage here and no "complete". */}
                {grid.filled} of {grid.lesson_periods} teaching periods filled
              </p>
            </div>
            <Badge
              variant={published ? "active" : grid.status ? "pending" : "inactive"}
              className="rounded-full py-0.5 text-[11px]"
            >
              {grid.status_label}
            </Badge>
          </div>

          {/* A printed copy carries the fact that the week is unresolved, but
              not the list: a noticeboard cannot act on "Mrs Eze is
              double-booked", and a reader who can is looking at the screen. */}
          {warnings.length > 0 && (
            // States the clashes and nothing about publication: a grid can be
            // published and then acquire one when another class books the same
            // teacher, so "has not been published" would be false exactly when
            // it matters most.
            <p className="print-only mb-3 text-sm text-error-text">
              {warnings.length} unresolved clash
              {warnings.length === 1 ? "" : "es"} in this week.
            </p>
          )}

          {warnings.length > 0 && (
            <div className="print-hide mt-4 rounded-lg border border-error-text/30 bg-error-text/5 px-3 py-2.5">
              <p className="flex items-center gap-1.5 text-[13px] font-medium text-error-text">
                <AlertTriangle className="size-3.5 shrink-0" />
                {warnings.length} clash
                {warnings.length === 1 ? "" : "es"} in this timetable
              </p>
              <ul className="mt-1.5 grid gap-1">
                {warnings.map((w, i) => (
                  <li
                    key={`${w.code}-${i}`}
                    className="text-xs text-gray-06 text-pretty"
                  >
                    {w.detail}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-gray-05 text-pretty">
                The grid saves with clashes in it. They only block publishing.
              </p>
            </div>
          )}

          {grid.filled === 0 && (
            <p className="print-hide mt-4 rounded-lg border border-white-02 bg-white-05 px-3 py-2.5 text-[13px] text-gray-06 text-pretty">
              Nothing scheduled yet. Click any empty cell to add a lesson, or
              copy another class's week across with Duplicate from.
            </p>
          )}

          <div className="mt-4">
            <TimetableGrid
              days={grid.days}
              warnings={warnings}
              variant="class"
              onCellClick={canEdit ? openCell : undefined}
              emptyLabel={canEdit ? "Add" : "Free"}
            />
          </div>

          {published && (
            <p className="print-hide mt-3 text-xs text-gray-05 text-pretty">
              Published{" "}
              {grid.published_at
                ? new Date(grid.published_at).toLocaleDateString()
                : ""}
              . Editing it here does not unpublish it; press Republish when the
              week is right again.
            </p>
          )}
        </Panel>
      )}

      <p className="print-hide text-xs text-gray-05">
        Teacher weeks are derived from these grids.{" "}
        <Link
          to={routesPath.PROTECTED.TIMETABLES.TEACHERS}
          className="font-medium text-primary hover:underline"
        >
          See a teacher's timetable
        </Link>
      </p>

      <LessonDrawer
        open={!!lesson}
        target={lesson}
        className={grid?.school_class.name ?? ""}
        subjects={subjectData?.data ?? []}
        teachers={teacherData?.data ?? []}
        rooms={roomData?.data ?? []}
        saving={creating || updating}
        removing={deleting}
        onClose={() => setLesson(null)}
        onSave={saveLesson}
        onRemove={removeLesson}
      />

      <DuplicateDrawer
        open={dupOpen}
        targetName={currentRow?.name ?? ""}
        // A class cannot be copied into itself, and a class with no lessons
        // has nothing to give.
        sources={classes.filter((c) => c.id !== current && c.lesson_count > 0)}
        summary={previewState.data?.data ?? null}
        previewing={previewState.isFetching}
        running={duplicating}
        onPreview={({ source, keepTeachers, keepRooms }) =>
          current &&
          previewDuplicate({
            id: current,
            source_class: source,
            keep_teachers: keepTeachers,
            keep_rooms: keepRooms,
          })
        }
        onClose={() => setDupOpen(false)}
        onRun={async ({ source, keepTeachers, keepRooms }) => {
          if (!current) return;
          const result = await runDuplicate({
            id: current,
            source_class: source,
            keep_teachers: keepTeachers,
            keep_rooms: keepRooms,
          }).unwrap();
          toast.success(result.message);
        }}
      />

      <PromptModal
        isOpen={confirm === "clear"}
        onClose={() => setConfirm(null)}
        onConfirm={runClear}
        loading={clearing}
        canCancel
        title={`Clear ${currentRow?.name}'s timetable?`}
        description={`Every lesson in ${currentRow?.name}'s week is removed - ${grid?.filled ?? 0} of them. ${
          published
            ? "The timetable also drops back to draft, so it will need publishing again."
            : "Nothing else is affected."
        } This cannot be undone.`}
        onConfirmText="Clear it"
        containerClass="min-h-[320px] lg:w-[420px]"
        srcClass="size-25"
        src="/image/caution.png"
      />
    </main>
  );
}
