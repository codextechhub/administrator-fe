import { useMemo, useState } from "react";
import { AlertTriangle, CalendarPlus, ClipboardList, Pencil, Plus, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import CustomTable from "@/components/custom/custom-table";
import PermissionGate from "@/components/custom/permission-gate";
import { Panel } from "@/components/custom/surface";
import { OutlinedNotice } from "@/pages/protected/onboarding/components/outlined-notice";
import { routesPath } from "@/routes/routesPath";
import { P } from "@/permissions";
import { usePermissions } from "@/hooks/use-permissions";
import { useAcademicsLens } from "@/hooks/use-academics-lens";
import { parseApiError } from "@/utils/api-error";
import {
  useCreateExamSlotMutation,
  useDeleteExamSlotMutation,
  useGetExamsQuery,
  useGetRoomsQuery,
  useGetTeachersQuery,
  usePublishExamMutation,
  useUpdateExamSlotMutation,
} from "@/redux/services/calendar/calendar-api";
import {
  useGetClassesQuery,
  useGetSubjectsQuery,
} from "@/redux/services/academics/academics-api";
import type {
  ExamSlot,
  ExamSlotWrite,
} from "@/redux/services/calendar/calendar-types";
import { formatDate, formatRange } from "../components/dates";
import { PaperDrawer } from "../components/paper-drawer";
import {
  blankPaper,
  paperValuesFrom,
  type PaperValues,
} from "../components/paper-values";
import { RowActions } from "../components/row-actions";
import { RowPicker } from "../components/row-picker";

/**
 * Papers placed inside a dated exam period on the calendar.
 *
 * **The schedule hangs off the calendar rather than floating beside it.** The
 * school says in its calendar that it is examining in the first week of
 * December, and the papers hang off that statement: the dates, the session and
 * the branch scope are read from the event and none is copied. So with no exam
 * period there is nothing to schedule into, and this screen sends the reader to
 * the calendar rather than showing an empty table.
 *
 * **The refusal and the warnings are the opposite way round from a class
 * timetable**, and that is deliberate on the server's part. A class sitting two
 * papers at once is impossible and is refused; a room used twice and an
 * invigilator in two rooms are both things a school legitimately does, so they
 * warn and save. The drawer says so, because meeting one rule and not the other
 * without explanation reads as arbitrary.
 */
export default function ExamScheduling() {
  const { lens, readOnlyYear } = useAcademicsLens();
  const { hasPermission } = usePermissions();

  const [examId, setExamId] = useState<number | null>(null);
  const [paper, setPaper] = useState<{
    values: PaperValues;
    slot: ExamSlot | null;
  } | null>(null);

  const { data, isLoading, isError, refetch } = useGetExamsQuery({
    session: lens.session,
  });
  const exams = useMemo(() => data?.data ?? [], [data]);

  const current = examId ?? exams[0]?.id ?? null;
  const exam = exams.find((e) => e.id === current) ?? null;

  const { data: classData } = useGetClassesQuery(lens);
  const { data: subjectData } = useGetSubjectsQuery(lens);
  const { data: roomData } = useGetRoomsQuery({
    branch: lens.branch,
    active: "true",
  });
  const { data: teacherData } = useGetTeachersQuery({ session: lens.session });

  const [create, { isLoading: creating }] = useCreateExamSlotMutation();
  const [update, { isLoading: updating }] = useUpdateExamSlotMutation();
  const [remove, { isLoading: removing }] = useDeleteExamSlotMutation();
  const [publish, { isLoading: publishing }] = usePublishExamMutation();

  const canCreate = hasPermission(P.CREATE_TIMETABLE_ENTRY) && !readOnlyYear;
  const canEdit = hasPermission(P.MODIFY_TIMETABLE_ENTRY) && !readOnlyYear;
  const canDelete = hasPermission(P.MANAGE_TIMETABLES) && !readOnlyYear;
  const canPublish = hasPermission(P.PUBLISH_TIMETABLE) && !readOnlyYear;

  const published = exam?.status === "PUBLISHED";

  const savePaper = async (body: ExamSlotWrite) => {
    if (!exam) return;
    const result = paper?.slot
      ? await update({ examId: exam.id, id: paper.slot.id, ...body }).unwrap()
      : await create({ examId: exam.id, ...body }).unwrap();
    toast.success(result.message);
    // Saved AND flagged. Each sentence names the room or the person and the
    // sitting it collides with.
    for (const w of result.data?.warnings ?? []) toast.warning(w.detail);
  };

  const removePaper = async () => {
    if (!exam || !paper?.slot) return;
    const result = await remove({ examId: exam.id, id: paper.slot.id }).unwrap();
    toast.success(result.message || "Paper removed.");
  };

  const runPublish = async () => {
    if (!exam) return;
    try {
      const result = await publish({ id: exam.id }).unwrap();
      toast.success(result.message);
    } catch (error) {
      toast.error(
        parseApiError(error).message || "That schedule could not be published.",
      );
    }
  };

  if (isError) {
    return (
      <main className="px-5 pt-3 pb-8">
        <OutlinedNotice
          icon={ClipboardList}
          title="We could not load your exam schedule"
          body="Something went wrong on our side. Try again in a moment."
          actionLabel="Try again"
          onAction={() => refetch()}
        />
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="grid min-w-0 grid-cols-1 content-start gap-5 px-5 pt-3 pb-8">
        <Skeleton className="h-24 w-full rounded-md" />
        <Skeleton className="h-80 w-full rounded-md" />
      </main>
    );
  }

  // The blocking state. Not "no papers" - there is nowhere to put one, because
  // a schedule hangs off a dated exam period and the calendar holds none.
  if (!exams.length || !exam) {
    return (
      <main className="px-5 pt-3 pb-8">
        <OutlinedNotice
          icon={CalendarPlus}
          title="No exam period yet"
          body="An exam timetable sits inside a dated exam period on the calendar, so that has to exist first. Add one as a calendar event with the type Exam period."
          actionLabel="Add an exam period"
          onAction={() => {
            window.location.assign(routesPath.PROTECTED.ACADEMIC_CALENDAR.EVENTS);
          }}
        />
      </main>
    );
  }

  const range = formatRange(exam.start_date, exam.end_date);

  return (
    <main className="grid min-w-0 grid-cols-1 content-start gap-5 px-5 pt-3 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Only where there is a choice to make. A school running mocks in
            November and end-of-term exams in December has two, and the design
            offered no way to reach the second - see ruling C. */}
        {exams.length > 1 ? (
          <RowPicker
            label="Exam period"
            rows={exams.map((e) => ({
              id: e.id,
              name: e.name,
              has_clash: e.warnings.length > 0,
            }))}
            current={current}
            searchPlaceholder="Search exam periods"
            emptyText="No exam period matches that."
            subtitle={(row) => {
              const found = exams.find((e) => e.id === row.id)!;
              return `${formatRange(found.start_date, found.end_date)} · ${found.paper_count} paper${found.paper_count === 1 ? "" : "s"} · ${found.status_label}`;
            }}
            onPick={setExamId}
          />
        ) : (
          <div className="min-w-0">
            <h2 className="truncate font-mont text-[15px] font-semibold text-black-01">
              {exam.name}
            </h2>
            <p className="mt-0.5 text-[13px] text-gray-05">
              {range} · from the calendar
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <PermissionGate
            permission={P.CREATE_TIMETABLE_ENTRY}
            disabled={readOnlyYear}
          >
            <Button
              variant="outline"
              className="text-sm"
              disabled={!canCreate || published}
              onClick={() =>
                setPaper({ values: blankPaper(exam.start_date), slot: null })
              }
            >
              <Plus className="size-4" /> Add paper
            </Button>
          </PermissionGate>
          <PermissionGate
            permission={P.PUBLISH_TIMETABLE}
            disabled={readOnlyYear}
          >
            <Button
              className="text-sm"
              onClick={runPublish}
              disabled={!canPublish || publishing || published}
            >
              <Send className="size-4" />
              {published ? "Published" : "Publish"}
            </Button>
          </PermissionGate>
        </div>
      </div>

      <Panel className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            {exams.length > 1 && (
              <p className="text-[13px] text-gray-05">
                {range} · from the calendar
              </p>
            )}
            <p className="text-[13px] text-gray-06">
              {exam.paper_count} paper{exam.paper_count === 1 ? "" : "s"}
            </p>
          </div>
          <Badge
            variant={published ? "active" : "pending"}
            className="rounded-full py-0.5 text-[11px]"
          >
            {exam.status_label}
          </Badge>
        </div>

        {exam.warnings.length > 0 && (
          <div className="mt-4 rounded-lg border border-error-text/30 bg-error-text/5 px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-[13px] font-medium text-error-text">
              <AlertTriangle className="size-3.5 shrink-0" />
              {exam.warnings.length} clash
              {exam.warnings.length === 1 ? "" : "es"} in this schedule
            </p>
            <ul className="mt-1.5 grid gap-1">
              {exam.warnings.map((w, i) => (
                <li
                  key={`${w.code}-${i}`}
                  className="text-xs text-gray-06 text-pretty"
                >
                  {w.detail}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-gray-05 text-pretty">
              Two classes really can sit in one hall, and one person really does
              float between rooms, so these save. They only block publishing.
            </p>
          </div>
        )}

        {published && (
          <p className="mt-4 rounded-lg border border-white-02 bg-white-05 px-3 py-2.5 text-[13px] text-gray-06 text-pretty">
            This schedule has been published, so it can no longer be changed.
          </p>
        )}

        <div className="mt-4">
          {exam.slots.length === 0 ? (
            <OutlinedNotice
              icon={ClipboardList}
              title="No papers scheduled"
              body={`${exam.name} runs ${range}. Add the papers that sit inside it.`}
              actionLabel={canCreate && !published ? "Add the first paper" : undefined}
              onAction={() =>
                setPaper({ values: blankPaper(exam.start_date), slot: null })
              }
            />
          ) : (
            <CustomTable
              tableHeaderList={[
                "Date",
                "Sitting",
                "Class",
                "Subject",
                "Room",
                "Invigilator",
                "Action",
              ]}
              defaultBodyList={exam.slots}
              tableBodyList={exam.slots.map((slot) => ({
                Date: formatDate(slot.exam_date),
                Sitting: slot.sitting_label,
                Class: slot.class_name,
                Subject: slot.subject_name,
                Room: slot.room_name ?? "-",
                Invigilator: slot.invigilator?.name ?? "-",
                Action: (
                  <RowActions
                    label={`Actions for ${slot.class_name} ${slot.subject_name}`}
                    actions={[
                      canEdit && !published && {
                        label: "Edit",
                        icon: Pencil,
                        onSelect: () =>
                          setPaper({ values: paperValuesFrom(slot), slot }),
                      },
                      canDelete && !published && {
                        label: "Remove paper",
                        icon: Trash2,
                        destructive: true,
                        onSelect: async () => {
                          try {
                            const result = await remove({
                              examId: exam.id,
                              id: slot.id,
                            }).unwrap();
                            toast.success(result.message || "Paper removed.");
                          } catch (error) {
                            toast.error(
                              parseApiError(error).message ||
                                "That paper could not be removed.",
                            );
                          }
                        },
                      },
                    ]}
                  />
                ),
              }))}
              onRowClick={(slot: ExamSlot) => {
                if (slot && canEdit && !published) {
                  setPaper({ values: paperValuesFrom(slot), slot });
                }
              }}
              emptyText="No papers"
            />
          )}
        </div>
      </Panel>

      <PaperDrawer
        open={!!paper}
        initial={paper?.values ?? blankPaper(exam.start_date)}
        editing={!!paper?.slot}
        periodName={exam.name}
        periodRange={range}
        minDate={exam.start_date}
        maxDate={exam.end_date}
        classes={classData?.data ?? []}
        subjects={subjectData?.data ?? []}
        rooms={roomData?.data ?? []}
        teachers={teacherData?.data ?? []}
        saving={creating || updating}
        removing={removing}
        onClose={() => setPaper(null)}
        onSave={savePaper}
        onRemove={removePaper}
      />
    </main>
  );
}

