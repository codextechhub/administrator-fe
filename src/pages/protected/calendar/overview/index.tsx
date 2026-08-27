import { Link, useNavigate } from "react-router";
import {
  AlertTriangle,
  CalendarDays,
  CalendarRange,
  Check,
  DoorOpen,
  GraduationCap,
  LayoutGrid,
  Bell,
  Users,
  ClipboardList,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Panel } from "@/components/custom/surface";
import { OutlinedNotice } from "@/pages/protected/onboarding/components/outlined-notice";
import { routesPath } from "@/routes/routesPath";
import { useAcademicsLens } from "@/hooks/use-academics-lens";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/permissions";
import { cn } from "@/lib/utils";
import {
  useGetCalendarOverviewQuery,
  useGetCalendarYearQuery,
} from "@/redux/services/calendar/calendar-api";
import { eventVariant } from "../components/event-kind";
import { formatRange, relativeDays } from "../components/dates";

const C = routesPath.PROTECTED.ACADEMIC_CALENDAR;
const T = routesPath.PROTECTED.TIMETABLES;

/**
 * Where the school year stands, what is coming, and what is wrong.
 *
 * One screen over both halves of the module, which is why it lists timetable
 * destinations it does not itself read.
 *
 * **The progress figure counts TEACHING days, not days.** A term that is 70
 * days long with a week of mid-term break in it is 65 teaching days, and a
 * school looking at "48% through the term" while its staff know they have
 * taught more than that would stop trusting the number. The server computes
 * both, because `closes_school` is what makes the difference and only it knows
 * which events carry it.
 *
 * **Nothing here is a completeness score.** The counts are of what exists -
 * classes holding at least one lesson, rooms on file - never of what is
 * finished. Nothing in the platform knows how many periods a subject should
 * get, so a "78% complete" would be a number with no definition behind it.
 */
export default function CalendarOverview() {
  const { lens, sessionName } = useAcademicsLens();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useGetCalendarOverviewQuery(lens);
  const { data: yearData } = useGetCalendarYearQuery({ session: lens.session });

  const overview = data?.data ?? {};
  const year = yearData?.data ?? {};
  const terms = year.terms ?? [];

  const canSeeTimetables = hasPermission(P.BROWSE_TIMETABLES);

  if (isError) {
    return (
      <main className="px-5 pt-3 pb-8">
        <OutlinedNotice
          icon={CalendarRange}
          title="We could not load your calendar"
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
        <Skeleton className="h-40 w-full rounded-md" />
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-md" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-md" />
      </main>
    );
  }

  // A 200 with `{}` rather than a 404, because a school that has not opened its
  // first year is not a school with a broken calendar. It is the ONE state on
  // this screen that is about the school rather than about the calendar, so it
  // points at the year, not at an Add event button that would refuse.
  if (!overview.session) {
    return (
      <main className="px-5 pt-3 pb-8">
        <OutlinedNotice
          icon={CalendarRange}
          title="No school year yet"
          body="A calendar hangs off a school year: every holiday, break and exam period is dated inside one. Start a year on Sessions & Terms and this fills in."
          actionLabel="Go to Sessions & Terms"
          onAction={() =>
            navigate(routesPath.PROTECTED.ACADEMIC_STRUCTURE.SESSIONS)
          }
        />
      </main>
    );
  }

  const term = overview.term ?? null;
  const counts = overview.counts;
  const nextUp = overview.next_up ?? [];
  const alerts = overview.alerts ?? [];

  const taught = term?.teaching_days_elapsed ?? 0;
  const total = term?.teaching_days_total ?? 0;
  const pct = total > 0 ? Math.round((taught / total) * 100) : 0;

  return (
    <main className="grid min-w-0 grid-cols-1 content-start gap-5 px-5 pt-3 pb-8">
      {/* ── The year, and where inside it we are ─────────────────────────── */}
      <Panel className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-gray-05">
              Active session
            </p>
            <h2 className="mt-1 font-mont text-lg font-semibold text-black-01">
              {overview.session.name}
            </h2>
            <p className="mt-0.5 text-sm text-gray-06">
              {formatRange(
                overview.session.start_date,
                overview.session.end_date,
              )}
              {term ? ` · ${term.name}` : " · Between terms"}
            </p>
          </div>
          {year.session?.read_only && (
            <Badge variant="inactive" className="rounded-full py-0.5 text-[11px]">
              Read-only
            </Badge>
          )}
        </div>

        {terms.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {terms.map((row) => (
              <span
                key={row.id}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs",
                  row.state === "ongoing"
                    ? "border-primary bg-pry-01 font-medium text-primary"
                    : row.state === "completed"
                      ? "border-white-02 bg-white-05 text-gray-05"
                      : "border-white-02 bg-white text-gray-06",
                )}
              >
                {row.state === "completed" && <Check className="size-3" />}
                {row.name}
                {row.state === "ongoing" && " · now"}
              </span>
            ))}
          </div>
        )}

        {term && total > 0 && (
          <div className="mt-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-[13px] text-gray-06">
                {taught} of {total} teaching days in {term.name}
              </p>
              <p className="text-[13px] font-medium text-black-01">{pct}%</p>
            </div>
            <div
              className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white-02"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${term.name} progress`}
            >
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${pct}%` }}
              />
            </div>
            {/* Said out loud, because the two numbers differ and the
                difference is the whole reason the closed flag exists. */}
            <p className="mt-1.5 text-xs text-gray-05 text-pretty">
              Days the school is closed do not count.
            </p>
          </div>
        )}
      </Panel>

      {/* ── Four counts of what exists ───────────────────────────────────── */}
      {counts && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Count icon={CalendarRange} value={counts.terms} label="Terms defined" />
          <Count
            icon={CalendarDays}
            value={counts.events_in_term}
            label={term ? `Events in ${term.name}` : "Events this year"}
          />
          <Count
            icon={GraduationCap}
            value={counts.classes_timetabled}
            label="Classes timetabled"
          />
          <Count icon={DoorOpen} value={counts.rooms} label="Rooms" />
        </div>
      )}

      <div className="grid min-w-0 gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="grid min-w-0 content-start gap-5">
          {/* ── Next up ──────────────────────────────────────────────────── */}
          <Panel className="p-5">
            <h3 className="font-mont text-[15px] font-semibold text-black-01">
              Next up
            </h3>
            <p className="mt-0.5 text-[13px] text-gray-05">
              The next few dated entries, whichever term they fall in.
            </p>
            {nextUp.length === 0 ? (
              <p className="mt-4 rounded-lg border border-white-02 bg-white-05 px-3 py-2.5 text-sm text-gray-05">
                Nothing dated ahead.
              </p>
            ) : (
              <ul className="mt-4 grid gap-2.5">
                {nextUp.map((event) => (
                  // Two lines at every width, rather than one that wraps. On a
                  // phone the single row put the name in a flex-1 box between a
                  // chip and two dates and truncated it to "Indep…" - the one
                  // thing on the row a reader actually needs.
                  <li
                    key={event.id}
                    className="rounded-lg border border-white-02 px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={eventVariant(event.event_type)}
                        className="shrink-0 rounded-full py-0 text-[11px]"
                      >
                        {event.type_label}
                      </Badge>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-black-01">
                        {event.name}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs">
                      <span className="text-gray-05">
                        {formatRange(event.start_date, event.end_date)}
                      </span>
                      <span className="font-medium text-gray-06">
                        {relativeDays(event.days_away)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* ── Where to go ──────────────────────────────────────────────── */}
          <Panel className="p-5">
            <h3 className="font-mont text-[15px] font-semibold text-black-01">
              Go to
            </h3>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              <GoTo to={C.EVENTS} icon={CalendarDays} label="Calendar & Events" />
              <GoTo to={C.TERM_VIEW} icon={LayoutGrid} label="Term calendar view" />
              {/* Absent, not greyed out, for a reader without the timetable
                  key: a link that answers 403 is a door drawn on a wall. */}
              {canSeeTimetables && (
                <>
                  <GoTo to={T.ROOMS} icon={DoorOpen} label="Rooms" />
                  <GoTo to={T.BELL_SCHEDULE} icon={Bell} label="Bell schedule" />
                  <GoTo
                    to={T.CLASSES}
                    icon={GraduationCap}
                    label="Class timetables"
                  />
                  <GoTo to={T.TEACHERS} icon={Users} label="Teacher timetables" />
                  <GoTo
                    to={T.EXAMS}
                    icon={ClipboardList}
                    label="Exam scheduling"
                  />
                </>
              )}
            </div>
          </Panel>
        </div>

        {/* ── What is wrong ───────────────────────────────────────────────── */}
        <Panel className="h-fit p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-mont text-[15px] font-semibold text-black-01">
              Needs attention
            </h3>
            {alerts.length > 0 && (
              <Badge variant="amber" className="rounded-full py-0 text-[11px]">
                {alerts.length}
              </Badge>
            )}
          </div>
          {alerts.length === 0 ? (
            <p className="mt-4 rounded-lg border border-white-02 bg-white-05 px-3 py-2.5 text-sm text-gray-05">
              Nothing needs attention{sessionName ? ` in ${sessionName}` : ""}.
            </p>
          ) : (
            <ul className="mt-4 grid gap-2.5">
              {alerts.map((alert) => (
                <li
                  key={alert.code}
                  className="rounded-lg border border-white-02 px-3 py-2.5"
                >
                  <p className="flex items-center gap-1.5 text-[13px] font-medium text-black-01">
                    <AlertTriangle className="size-3.5 shrink-0 text-yellow-01-text" />
                    {ALERT_TITLES[alert.code] ?? "Something needs a look"}
                  </p>
                  {/* The server's own sentence, rendered as it arrived. It
                      names the rows and counts them, and rewriting it here
                      would be a second version of the truth to keep in step. */}
                  <p className="mt-1 text-xs text-gray-05 text-pretty">
                    {alert.detail}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </main>
  );
}

/**
 * Titles for the six alert codes.
 *
 * Only the title. The sentence under it is the server's, because it counts and
 * names the actual rows - and two of these codes report a state the API cannot
 * even produce (a term outside its session, two terms overlapping), which
 * arrives by import or by migration. A client-side sentence for those would be
 * guessing at data it has never seen.
 */
const ALERT_TITLES: Record<string, string> = {
  SESSION_HAS_NO_TERMS: "This year has no terms",
  EVENT_OUTSIDE_ANY_TERM: "Events outside every term",
  TERM_OUTSIDE_SESSION: "A term falls outside the year",
  TERM_DATES_OVERLAP: "Two terms overlap",
  TIMETABLE_HAS_CLASHES: "Unresolved timetable clashes",
  CLASS_HAS_NO_TIMETABLE: "Classes with no timetable",
};

function Count({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof CalendarDays;
  value: number;
  label: string;
}) {
  return (
    <Panel className="flex min-w-0 items-center gap-3 p-4">
      <span className="grid size-9 shrink-0 place-content-center rounded-full bg-pry-01 text-primary">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block font-mont text-xl font-semibold text-black-01">
          {value}
        </span>
        <span className="block truncate text-xs text-gray-05">{label}</span>
      </span>
    </Panel>
  );
}

function GoTo({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: typeof CalendarDays;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex min-w-0 items-center gap-2.5 rounded-lg border border-white-02 px-3 py-2.5 text-sm text-gray-06 hover:border-primary hover:text-primary"
    >
      <Icon className="size-4 shrink-0" />
      <span className="min-w-0 truncate">{label}</span>
    </Link>
  );
}
