import { Link } from "react-router";
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  DoorOpen,
  GraduationCap,
  LayoutGrid,
  Layers,
  Users,
} from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { cn } from "@/lib/utils";
import { P } from "@/permissions";
import { usePermissions } from "@/hooks/use-permissions";
import { useAcademicsLens } from "@/hooks/use-academics-lens";
import { useAppSelector } from "@/redux/store";
import { selectUser } from "@/redux/features/auth/auth-slice";
import { routesPath } from "@/routes/routesPath";
import { useGetAcademicOverviewQuery } from "@/redux/services/academics/academics-api";
import { useGetCalendarOverviewQuery } from "@/redux/services/calendar/calendar-api";
import { useGetOnboardingStateQuery } from "@/redux/services/onboarding/onboarding-api";
import { buildAttention } from "./attention";
import { FocusPanel } from "./focus-panel";

const R = routesPath.PROTECTED;

// ─────────────────────────────────────────────────────────────────────────────
// The first screen a school sees.
//
// Built on the console's overview and rearranged around what a school actually
// runs. The console opens with a worklist and then counts the platform; this
// opens with a worklist and then answers the question a school asks every
// morning, which is **where are we in the year**. That question has no analogue
// on the console side and it is the reason this is not a copy.
//
// **Three requests, revealed as one.** The console's own comment records why it
// went from eight to one: they arrived in whatever order the network settled
// and the page appeared in waves. There is no school-side aggregate endpoint to
// call, and inventing one is a backend change this screen does not need - so
// the three that exist are held until all three have landed, which fixes the
// waves without the round trip. All three are already fetched by other screens,
// so arriving here from anywhere in Academics or the Calendar costs nothing.
//
// **The counts are the lens's counts.** Every figure here is for the branch and
// the year in the switcher, the same as the screen it links to. A dashboard
// that answers about the whole school while the switcher says Ikeja is a
// dashboard that has to be checked against the screen below it, which is the
// same as not having it.
// ─────────────────────────────────────────────────────────────────────────────

/** Slow poll, and only while the tab is actually being looked at. */
const REFRESH = {
  pollingInterval: 180_000,
  skipPollingIfUnfocused: true,
  refetchOnFocus: true,
} as const;

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function Shimmer({ className }: { className?: string }) {
  return <span className={cn("block animate-pulse rounded bg-gray-04", className)} />;
}

function Metric({
  icon: Icon,
  label,
  value,
  note,
  to,
  loading,
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
  note?: string;
  to: string;
  loading?: boolean;
}) {
  return (
    <Link
      to={to}
      className="group min-w-0 rounded-xl border border-white-02 bg-white px-3 py-2.5 transition-colors hover:border-primary/30"
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-pry-01 text-primary">
          <Icon className="size-3.5" />
        </span>
        <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-gray-05">
          {label}
        </span>
      </span>
      <span className="mt-1.5 block truncate font-mont text-lg font-semibold leading-none text-black-01 tabular-nums">
        {loading ? <Shimmer className="my-0.5 h-4 w-10" /> : value}
      </span>
      {note && !loading && (
        <span className="mt-1 block truncate text-[11px] text-gray-05">{note}</span>
      )}
    </Link>
  );
}

export default function Dashboard() {
  const user = useAppSelector(selectUser);
  const { hasPermission } = usePermissions();
  const { lens, sessionName } = useAcademicsLens();

  const canSeeCalendar = hasPermission(P.BROWSE_CALENDAR);
  const canSeeStructure = hasPermission(P.BROWSE_STRUCTURE);
  const canSeeTimetables = hasPermission(P.BROWSE_TIMETABLES);
  const canSeeOnboarding = hasPermission(P.VIEW_ONBOARDING);

  // `skip` rather than a permission check inside the component: a reader who
  // may not see the academic structure should not be sending the request at
  // all, and the server would refuse it anyway.
  const structure = useGetAcademicOverviewQuery(lens, {
    ...REFRESH,
    skip: !canSeeStructure,
  });
  const calendar = useGetCalendarOverviewQuery(lens, {
    ...REFRESH,
    skip: !canSeeCalendar,
  });
  const onboarding = useGetOnboardingStateQuery(undefined, {
    ...REFRESH,
    skip: !canSeeOnboarding,
  });

  // Held until every part that was asked for has landed. Revealing each as it
  // arrives is what made the console's version appear in waves.
  const loading =
    (canSeeStructure && structure.isLoading) ||
    (canSeeCalendar && calendar.isLoading) ||
    (canSeeOnboarding && onboarding.isLoading);

  const cal = calendar.data?.data;
  const str = structure.data?.data;

  const attention = buildAttention({
    alerts: cal?.alerts,
    onboarding: onboarding.data?.data ?? null,
    branchesWithoutSession: str?.branches_without_a_session,
  });

  const term = cal?.term ?? null;
  const taught = term?.teaching_days_elapsed ?? 0;
  const teachable = term?.teaching_days_total ?? 0;
  const termPercent = teachable > 0 ? Math.round((taught / teachable) * 100) : 0;
  const terms = str?.viewed_session?.terms ?? [];

  const today = new Intl.DateTimeFormat("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const metrics = [
    canSeeStructure && (
      <Metric
        key="classes"
        icon={Users}
        label="Classes"
        value={str?.counts.classes ?? 0}
        note={`${str?.counts.levels ?? 0} levels`}
        to={R.ACADEMIC_STRUCTURE.CLASSES}
        loading={loading}
      />
    ),
    canSeeStructure && (
      <Metric
        key="subjects"
        icon={BookOpen}
        label="Subjects"
        value={str?.counts.subjects ?? 0}
        note={`${str?.counts.programs ?? 0} programmes`}
        to={R.ACADEMIC_STRUCTURE.SUBJECTS}
        loading={loading}
      />
    ),
    canSeeTimetables && (
      <Metric
        key="timetabled"
        icon={LayoutGrid}
        label="Timetabled"
        value={cal?.counts?.classes_timetabled ?? 0}
        note={
          str?.counts.classes
            ? `of ${str.counts.classes}`
            : "at least one lesson each"
        }
        to={R.TIMETABLES.CLASSES}
        loading={loading}
      />
    ),
    canSeeTimetables && (
      <Metric
        key="rooms"
        icon={DoorOpen}
        label="Rooms"
        value={cal?.counts?.rooms ?? 0}
        to={R.TIMETABLES.ROOMS}
        loading={loading}
      />
    ),
    canSeeCalendar && (
      <Metric
        key="events"
        icon={CalendarRange}
        label="On the calendar"
        value={cal?.counts?.events_in_term ?? 0}
        note="this term"
        to={R.ACADEMIC_CALENDAR.EVENTS}
        loading={loading}
      />
    ),
    canSeeStructure && (
      <Metric
        key="departments"
        icon={Layers}
        label="Departments"
        value={str?.counts.departments ?? 0}
        to={R.ACADEMIC_STRUCTURE.DEPARTMENTS}
        loading={loading}
      />
    ),
  ].filter(Boolean);

  const modules = [
    { label: "Academic Structure", to: R.ACADEMIC_STRUCTURE.INDEX, icon: GraduationCap, show: canSeeStructure },
    { label: "Calendar", to: R.ACADEMIC_CALENDAR.INDEX, icon: CalendarDays, show: canSeeCalendar },
    { label: "Timetables", to: R.TIMETABLES.CLASSES, icon: LayoutGrid, show: canSeeTimetables },
    { label: "Branches", to: R.BRANCHES.INDEX, icon: DoorOpen, show: hasPermission(P.BROWSE_BRANCHES) },
  ].filter((m) => m.show);

  return (
    <PageShell className="space-y-6">
      {/* ── who, when, and where in the year ─────────────────────────────── */}
      <section className="rounded-2xl bg-primary px-5 py-4.5 text-white">
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-white/60">
          <CalendarDays className="size-3.5" />
          {today}
        </p>
        <h1 className="mt-1.5 font-mont text-xl font-semibold tracking-tight">
          {greeting(new Date().getHours())}
          {user?.first_name ? `, ${user.first_name}` : ""}.
        </h1>
        <p className="mt-1 text-xs leading-5 text-white/65 text-pretty">
          {term
            ? `${term.name} of ${sessionName ?? "this year"}, day ${taught} of ${teachable} taught.`
            : sessionName
              ? `${sessionName}. No term covers today, so nothing is being taught right now.`
              : "No academic year is set up yet, so there is nothing to teach into."}
        </p>
      </section>

      {/* ── today's focus ───────────────────────────────────────────────── */}
      {loading ? (
        <Shimmer className="h-20 rounded-2xl" />
      ) : attention.length === 0 ? (
        // Said plainly rather than left blank. The console renders nothing at
        // all on a clear day because its hero already says so; this hero
        // reports the year rather than the workload, so the clear day has to be
        // stated here or the screen simply loses a section.
        <section className="flex items-center gap-2.5 rounded-2xl border border-white-02 bg-white px-4 py-3.5">
          <CheckCircle2 className="size-4 shrink-0 text-success-text" />
          <p className="text-[13px] text-gray-06 text-pretty">
            Nothing is waiting on you. The year is set up, the terms line up and
            every timetable that exists is free of clashes.
          </p>
        </section>
      ) : (
        <FocusPanel items={attention} />
      )}

      {/* ── the term, and what is coming ─────────────────────────────────── */}
      {canSeeCalendar && (
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="rounded-2xl border border-white-02 bg-white p-4.5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-mont text-base font-semibold text-black-01">
                {term ? term.name : "The year"}
              </h2>
              <Link
                to={R.ACADEMIC_CALENDAR.TERM_VIEW}
                className="text-xs font-medium text-primary"
              >
                Term view
              </Link>
            </div>
            {loading ? (
              <Shimmer className="mt-4 h-10" />
            ) : term ? (
              <>
                {/* Teaching days, not calendar days. The difference is the
                    whole point of the closed-school flag: a term that is 60
                    days long and shut for eight of them has 52 to teach in,
                    and a bar drawn on the calendar span would say a school is
                    further ahead than it is. */}
                <p className="mt-3 font-mont text-2xl font-semibold leading-none text-black-01 tabular-nums">
                  {taught}
                  <span className="text-base font-medium text-gray-05">
                    {" "}/ {teachable}
                  </span>
                </p>
                <p className="mt-1 text-xs text-gray-05">
                  teaching days, {termPercent}% of the term
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-04">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-500"
                    style={{ width: `${Math.min(100, termPercent)}%` }}
                  />
                </div>

                {/* The rest of the year, so the card answers "where are we"
                    rather than only "how far into this one". The state is the
                    server's: a term is ongoing because today falls inside its
                    dates, and that is a comparison the client must not make a
                    second time and get differently. */}
                {terms.length > 0 && (
                  <ul className="mt-4 grid gap-1.5">
                    {terms.map((row) => (
                      <li
                        key={row.id}
                        className="flex items-center justify-between gap-3 text-[13px]"
                      >
                        <span
                          className={cn(
                            "min-w-0 truncate",
                            row.state === "ongoing"
                              ? "font-medium text-black-01"
                              : "text-gray-05",
                          )}
                        >
                          {row.name}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                            row.state === "ongoing" && "bg-pry-01 text-primary",
                            row.state === "completed" && "bg-gray-04 text-gray-05",
                            row.state === "pending" && "text-gray-05",
                          )}
                        >
                          {row.state === "ongoing"
                            ? "underway"
                            : row.state === "completed"
                              ? "done"
                              : "ahead"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <p className="mt-3 text-[13px] text-gray-05 text-pretty">
                No term covers today. Between terms the school still has a
                calendar, but nothing is being taught.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-white-02 bg-white p-4.5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-mont text-base font-semibold text-black-01">
                Coming up
              </h2>
              <Link
                to={R.ACADEMIC_CALENDAR.EVENTS}
                className="text-xs font-medium text-primary"
              >
                All events
              </Link>
            </div>
            {loading ? (
              <Shimmer className="mt-4 h-16" />
            ) : (cal?.next_up?.length ?? 0) === 0 ? (
              <p className="mt-3 text-[13px] text-gray-05 text-pretty">
                Nothing is dated ahead of today. Holidays, breaks and exam
                periods all show here once they are on the calendar.
              </p>
            ) : (
              <ul className="mt-3 grid gap-2">
                {cal!.next_up!.map((event) => (
                  <li
                    key={event.id}
                    className="flex items-center gap-3 border-b border-white-02 pb-2 last:border-0 last:pb-0"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-black-01">
                        {event.name}
                      </span>
                      <span className="block truncate text-[11px] text-gray-05">
                        {event.type_label}
                      </span>
                    </span>
                    <span className="shrink-0 text-[11px] text-gray-05 tabular-nums">
                      {event.days_away === 0
                        ? "today"
                        : event.days_away === 1
                          ? "tomorrow"
                          : `in ${event.days_away} days`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {/* ── the numbers ──────────────────────────────────────────────────── */}
      {metrics.length > 0 && (
        <section>
          <h2 className="font-mont text-base font-semibold text-black-01">
            At a glance
          </h2>
          <p className="mt-0.5 text-xs text-gray-05">
            For the branch and year in the switcher.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {metrics}
          </div>
        </section>
      )}

      {/* ── where to go ──────────────────────────────────────────────────── */}
      {modules.length > 0 && (
        <section>
          <h2 className="font-mont text-base font-semibold text-black-01">
            Your workspace
          </h2>
          <p className="mt-0.5 text-xs text-gray-05">
            Modules matched to your access.
          </p>
          {/* One column on a phone, not two. At 390px, two columns with an icon
              and an arrow leaves about eleven characters for the label, and
              "Academic Structure" arrived as "Academi…" - a truncated module
              name is a module a reader has to guess at. */}
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {modules.map(({ label, to, icon: Icon }) => (
              <Link
                key={label}
                to={to}
                className="group flex min-w-0 items-center gap-3 rounded-xl border border-white-02 bg-white p-3.5 transition-colors hover:border-primary/30"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-gray-04 text-gray-06 transition-colors group-hover:bg-pry-01 group-hover:text-primary">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-black-01">
                  {label}
                </span>
                <ArrowUpRight className="size-4 shrink-0 text-gray-05 transition-colors group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </PageShell>
  );
}
