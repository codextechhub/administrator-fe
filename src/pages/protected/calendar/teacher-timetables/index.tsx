import { useMemo, useState } from "react";
import { Link } from "react-router";
import { AlertTriangle, Lock, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Panel } from "@/components/custom/surface";
import { OutlinedNotice } from "@/pages/protected/onboarding/components/outlined-notice";
import { routesPath } from "@/routes/routesPath";
import { useAcademicsLens } from "@/hooks/use-academics-lens";
import {
  useGetTeachersQuery,
  useGetTeacherTimetableQuery,
} from "@/redux/services/calendar/calendar-api";
import { TimetableGrid } from "../components/timetable-grid";
import { warningsFromDays } from "../components/grid-shape";
import { PersonPicker } from "./person-picker";

/**
 * One teacher's week, derived from the class grids.
 *
 * **Read-only, and not because of a permission.** There is no teacher-timetable
 * table to write to: a person's week is a query over the class grids, and a
 * stored copy would go stale the moment one lesson moved. So this screen shows
 * and links; editing happens where the lesson lives.
 *
 * **The picker is not narrowed by the branch lens**, and that is the one place
 * this module deliberately ignores it. Mr Eze teaches at Lekki on Monday to
 * Wednesday and at Ikeja on Thursday and Friday; a list filtered to the branch
 * being looked at would hide half his week from the person checking whether he
 * is over-booked. What makes it safe is that the clash query is wide too.
 *
 * **Clashes arrive per cell here**, not once at the top as they do on a class
 * grid, and the same double-booking rides on both cells of its pair - so the
 * panel deduplicates or it reports one problem twice.
 */
export default function TeacherTimetables() {
  const { lens, multiBranch } = useAcademicsLens();
  const [teacherId, setTeacherId] = useState<number | null>(null);

  const { data: listData, isLoading: listLoading } = useGetTeachersQuery({
    session: lens.session,
  });
  const teachers = useMemo(() => listData?.data ?? [], [listData]);

  const current = teacherId ?? teachers[0]?.id ?? null;
  const currentRow = teachers.find((t) => t.id === current) ?? null;

  const { data: weekData, isLoading: weekLoading } = useGetTeacherTimetableQuery(
    current ? { id: current, session: lens.session } : { id: 0 },
    { skip: !current },
  );
  const week = weekData?.data;

  const warnings = useMemo(
    () => (week ? warningsFromDays(week.days) : []),
    [week],
  );

  if (listLoading) {
    return (
      <main className="grid min-w-0 grid-cols-1 content-start gap-5 px-5 pt-3 pb-8">
        <Skeleton className="h-16 w-full rounded-md" />
        <Skeleton className="h-[28rem] w-full rounded-md" />
      </main>
    );
  }

  // Not "no timetables": there is nobody to have one. A school whose staff have
  // not been given the teacher role yet needs sending there, not to a grid.
  if (!teachers.length) {
    return (
      <main className="px-5 pt-3 pb-8">
        <OutlinedNotice
          icon={Users}
          title="Nobody carries the teacher role yet"
          body="A timetable names a person, so somebody has to be a teacher before there is a week to show. Give the role on the Teachers screen, then come back."
          actionLabel="Go to Teachers"
          onAction={() => {
            window.location.assign(routesPath.PROTECTED.TEACHERS.INDEX);
          }}
        />
      </main>
    );
  }

  return (
    <main className="grid min-w-0 grid-cols-1 content-start gap-5 px-5 pt-3 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <PersonPicker
          people={teachers}
          current={current}
          onPick={setTeacherId}
        />
        <Badge
          variant="inactive"
          className="shrink-0 gap-1 rounded-full py-0.5 text-[11px]"
        >
          <Lock className="size-3" /> Read-only
        </Badge>
      </div>

      {weekLoading || !week ? (
        <Skeleton className="h-[28rem] w-full rounded-md" />
      ) : (
        <Panel className="p-5">
          <h2 className="font-mont text-[15px] font-semibold text-black-01">
            {week.teacher.name}
          </h2>

          {/* Plain counts. No threshold, no colour, no comparison: nothing in
              the platform records a maximum teaching load, so a figure shown
              as good or bad would be an opinion with nothing behind it. */}
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Figure value={week.summary.teaching_periods} label="Teaching periods" />
            <Figure value={week.summary.free_periods} label="Free periods" />
            <Figure
              value={week.summary.busiest_day ?? "-"}
              label="Busiest day"
            />
            {multiBranch && (week.summary.branches?.length ?? 0) > 0 && (
              <Figure
                value={String(week.summary.branches!.length)}
                label={
                  week.summary.branches!.length === 1 ? "Branch" : "Branches"
                }
                hint={week.summary.branches!.join(", ")}
              />
            )}
          </div>

          {/* The cross-branch case, said out loud. A person teaching at two
              sites cannot be checked against one branch's grid alone, and this
              is the line that tells a branch admin their view is partial. */}
          {multiBranch && (week.summary.branches?.length ?? 0) > 1 && (
            <p className="mt-3 rounded-lg border border-white-02 bg-white-05 px-3 py-2 text-xs text-gray-06 text-pretty">
              {week.teacher.name} teaches at{" "}
              {week.summary.branches!.join(" and ")}. This week is every lesson
              they hold, wherever it happens.
            </p>
          )}

          {warnings.length > 0 && (
            <div className="mt-4 rounded-lg border border-error-text/30 bg-error-text/5 px-3 py-2.5">
              <p className="flex items-center gap-1.5 text-[13px] font-medium text-error-text">
                <AlertTriangle className="size-3.5 shrink-0" />
                {warnings.length} clash
                {warnings.length === 1 ? "" : "es"} in this week
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
                Fix these on the class timetable the lesson belongs to.
              </p>
            </div>
          )}

          {/* The two figures on this screen can disagree, and when they do it
              needs saying. The picker counts LESSONS; the grid counts PERIODS,
              and a cell can only draw one lesson - so a teacher booked into
              three classes at 9am holds three lessons in one period and the
              grid shows one of them. The hidden ones are exactly the clashes
              listed above, which is why this only appears alongside them. */}
          {currentRow &&
            currentRow.lesson_count > week.summary.teaching_periods && (
              <p className="mt-3 text-xs text-gray-05 text-pretty">
                {week.teacher.name} holds {currentRow.lesson_count} lessons
                across {week.summary.teaching_periods} period
                {week.summary.teaching_periods === 1 ? "" : "s"}. A cell can
                only draw one, so the{" "}
                {currentRow.lesson_count - week.summary.teaching_periods} not
                shown are the double-bookings above.
              </p>
            )}

          {week.summary.teaching_periods === 0 && (
            <p className="mt-4 rounded-lg border border-white-02 bg-white-05 px-3 py-2.5 text-[13px] text-gray-06 text-pretty">
              {week.teacher.name} holds no lessons this year. A teacher's week
              fills in as classes are timetabled.
            </p>
          )}

          <div className="mt-4">
            {/* No onCellClick: the week is derived, so there is nothing here
                to press. A cell that looked pressable and did nothing would be
                worse than one that plainly does not. */}
            <TimetableGrid days={week.days} variant="teacher" />
          </div>
        </Panel>
      )}

      <p className="text-xs text-gray-05 text-pretty">
        This week is read from the class grids and cannot be edited here.{" "}
        <Link
          to={routesPath.PROTECTED.TIMETABLES.CLASSES}
          className="font-medium text-primary hover:underline"
        >
          Edit a class timetable
        </Link>
      </p>
    </main>
  );
}

function Figure({
  value,
  label,
  hint,
}: {
  value: number | string;
  label: string;
  hint?: string;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-white-02 px-3 py-2.5">
      <p className="truncate font-mont text-lg font-semibold text-black-01">
        {value}
      </p>
      <p className="truncate text-xs text-gray-05">{label}</p>
      {hint && (
        <p className="mt-0.5 truncate text-[11px] text-gray-05" title={hint}>
          {hint}
        </p>
      )}
    </div>
  );
}
