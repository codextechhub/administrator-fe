import { useMemo, useState } from "react";
import { Bell, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import CustomTable from "@/components/custom/custom-table";
import PermissionGate from "@/components/custom/permission-gate";
import PromptModal from "@/components/modal/prompt-modal";
import { Panel } from "@/components/custom/surface";
import { OutlinedNotice } from "@/pages/protected/onboarding/components/outlined-notice";
import { P } from "@/permissions";
import { usePermissions } from "@/hooks/use-permissions";
import { useAcademicsLens } from "@/hooks/use-academics-lens";
import { cn } from "@/lib/utils";
import { parseApiError } from "@/utils/api-error";
import {
  useCreatePeriodMutation,
  useDeletePeriodMutation,
  useGetPeriodsQuery,
  useUpdatePeriodMutation,
} from "@/redux/services/calendar/calendar-api";
import type {
  DayOfWeek,
  Period,
  PeriodWrite,
} from "@/redux/services/calendar/calendar-types";
import { RowActions } from "../components/row-actions";
import { PeriodDrawer } from "../components/period-drawer";
import { blankPeriod, periodDraftFrom } from "../components/period-draft";
import { PageShell } from "@/components/layout/page-shell";

const DAY_TABS: { value: DayOfWeek | "all"; label: string; short: string }[] = [
  { value: "all", label: "The whole schedule", short: "All" },
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
];

/**
 * The daily period structure every timetable grid is built on.
 *
 * **Two reads of one thing, and the day tabs are not a filter.** "The whole
 * schedule" lists every row on file. Picking a weekday asks a different
 * question - what actually runs that day - and the answer is not a subset: a
 * day with periods of its own runs ONLY those, and the everyday schedule does
 * not apply to it at all. The server computes that, and writes the sentence
 * explaining it, because a client deciding it would be a second implementation
 * of the rule.
 *
 * **The order column is not editable anywhere.** It is assigned from the times,
 * so the school day cannot be put in an order that disagrees with the clock.
 */
export default function BellSchedule() {
  const { lens, branch, readOnlyYear, multiBranch, sessionName } =
    useAcademicsLens();
  const { hasPermission } = usePermissions();

  const [day, setDay] = useState<DayOfWeek | "all">("all");
  const [editing, setEditing] = useState<Period | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirm, setConfirm] = useState<Period | null>(null);

  const { data, isLoading, isError, refetch } = useGetPeriodsQuery({
    ...lens,
    day,
  });
  // The whole schedule, always, whichever tab is showing. The drawer needs it
  // to answer "does this day already have its own schedule", and the tabs need
  // it to mark the days that do.
  const { data: allData } = useGetPeriodsQuery({ ...lens, day: "all" });

  const [create, { isLoading: creating }] = useCreatePeriodMutation();
  const [update, { isLoading: updating }] = useUpdatePeriodMutation();
  const [remove, { isLoading: removing }] = useDeletePeriodMutation();

  const schedule = data?.data;
  const periods = useMemo(() => schedule?.periods ?? [], [schedule]);
  const everyPeriod = useMemo(() => allData?.data?.periods ?? [], [allData]);

  /**
   * What the strip draws, which is never the same as what the table lists.
   *
   * The table answers "what rows exist"; the strip answers "what does a day
   * look like", and those differ the moment one day owns its own periods. On
   * the All tab it drew every row end to end - the everyday schedule followed
   * by Friday's - and reported a school day running 08:00 to 10:00, which is
   * not a day this school or any other has. On All it now shows the everyday
   * schedule, which is what runs on the days nobody has overridden.
   */
  const stripPeriods = useMemo(
    () => (day === "all" ? periods.filter((p) => !p.day_of_week) : periods),
    [day, periods],
  );
  const stripLabel =
    day === "all"
      ? "Every day, on the days that do not run their own schedule"
      : DAY_TABS.find((t) => t.value === day)?.label ?? "";

  /** Which weekdays carry rows of their own, so run their own schedule. */
  const ownDays = useMemo(
    () => new Set(everyPeriod.map((p) => p.day_of_week).filter(Boolean)),
    [everyPeriod],
  );

  const canCreate = hasPermission(P.CREATE_TIMETABLE_ENTRY) && !readOnlyYear;
  const canEdit = hasPermission(P.MODIFY_TIMETABLE_ENTRY) && !readOnlyYear;
  const canDelete = hasPermission(P.MANAGE_TIMETABLES) && !readOnlyYear;

  const open = (period: Period | null) => {
    setEditing(period);
    setDrawerOpen(true);
  };

  const save = async (body: PeriodWrite) => {
    const result = editing
      ? await update({ id: editing.id, ...body }).unwrap()
      : await create(body).unwrap();
    toast.success(result.message);
  };

  const runDelete = async () => {
    if (!confirm) return;
    try {
      const result = await remove(confirm.id).unwrap();
      toast.success(result.message || `${confirm.label} removed.`);
    } catch (error) {
      toast.error(
        parseApiError(error).message || "That period could not be removed.",
      );
    }
    setConfirm(null);
  };

  if (isError) {
    return (
      <PageShell>
        <OutlinedNotice
          icon={Bell}
          title="We could not load your bell schedule"
          body="Something went wrong on our side. Try again in a moment."
          actionLabel="Try again"
          onAction={() => refetch()}
        />
      </PageShell>
    );
  }

  const empty = !isLoading && everyPeriod.length === 0;

  return (
    <PageShell className="content-start gap-5" grid>
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <p className="min-w-0 text-sm text-gray-06 text-pretty">
          The daily period structure every timetable grid is built on.
        </p>
        <PermissionGate
          permission={P.CREATE_TIMETABLE_ENTRY}
          disabled={readOnlyYear}
        >
          <Button
            className="shrink-0 text-sm"
            onClick={() => open(null)}
            disabled={!canCreate}
          >
            <Plus /> Add period
          </Button>
        </PermissionGate>
      </div>

      {isLoading ? (
        <>
          <Skeleton className="h-32 w-full rounded-md" />
          <Skeleton className="h-64 w-full rounded-md" />
        </>
      ) : empty ? (
        <OutlinedNotice
          icon={Bell}
          title="No bell schedule yet"
          body={
            sessionName
              ? `${sessionName} has no periods on it. Class timetables are built on these, so they need a bell schedule before a single lesson can be placed.`
              : "Class timetables are built on these periods, so they need a bell schedule first."
          }
          actionLabel={canCreate ? "Add the first period" : undefined}
          onAction={() => open(null)}
        />
      ) : (
        <>
          {/* ── The school day, as it actually runs ─────────────────────── */}
          <Panel className="p-5">
            <h2 className="font-mont text-[15px] font-semibold text-black-01">
              The school day
            </h2>
            <p className="mt-0.5 text-[13px] text-gray-05 text-pretty">
              {stripLabel}
            </p>

            <div className="mt-3 max-w-full overflow-x-auto">
              <div className="inline-flex gap-1.5 pb-1">
                {DAY_TABS.map((tab) => (
                  <button
                    key={String(tab.value)}
                    type="button"
                    onClick={() => setDay(tab.value)}
                    aria-pressed={day === tab.value}
                    className={cn(
                      "whitespace-nowrap rounded-full border px-3 py-1.5 text-xs",
                      day === tab.value
                        ? "border-primary bg-pry-01 font-medium text-primary"
                        : "border-white-02 bg-white text-gray-06 hover:bg-gray-04",
                    )}
                  >
                    {tab.short}
                    {/* A dot on the days that override the everyday schedule,
                        so the one short Friday is findable without opening
                        every tab. */}
                    {tab.value !== "all" && ownDays.has(tab.value) && (
                      <span className="ml-1.5 inline-block size-1.5 rounded-full bg-primary align-middle" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* The server's own sentence for a day that replaces the everyday
                schedule. Rendered verbatim: it counts the periods in force. */}
            {schedule?.note && (
              <p className="mt-3 rounded-lg border border-primary/30 bg-pry-01/40 px-3 py-2 text-[13px] text-gray-06 text-pretty">
                {schedule.note}
              </p>
            )}

            <div className="mt-4 max-w-full overflow-x-auto">
              <div className="flex min-w-max items-stretch gap-1.5 pb-1">
                {stripPeriods.map((period) => (
                  <div
                    key={period.id}
                    className={cn(
                      "min-w-24 rounded-lg border px-2.5 py-2",
                      period.period_type === "LESSON"
                        ? "border-white-02 bg-white"
                        : "border-transparent bg-white-05",
                    )}
                  >
                    <p
                      className={cn(
                        "truncate text-xs font-medium",
                        period.period_type === "LESSON"
                          ? "text-black-01"
                          : "text-gray-05",
                      )}
                    >
                      {period.label}
                    </p>
                    <p className="mt-0.5 whitespace-nowrap text-[11px] text-gray-05">
                      {clock(period.start_time)} - {clock(period.end_time)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-3 text-xs text-gray-05">{summary(stripPeriods)}</p>
          </Panel>

          {/* ── Every row on file ───────────────────────────────────────── */}
          <CustomTable
            tableHeaderList={[
              "Order",
              "Label",
              "Time",
              "Type",
              "Applies on",
              ...(multiBranch ? ["Scope"] : []),
              "Action",
            ]}
            defaultBodyList={periods}
            tableBodyList={periods.map((period) => ({
              Order: String(period.order_index),
              Label: period.label,
              Time: `${clock(period.start_time)} - ${clock(period.end_time)}`,
              Type: period.type_label,
              "Applies on": period.day_label,
              ...(multiBranch
                ? {
                    Scope: period.branch ? (
                      period.scope_label
                    ) : (
                      <Badge
                        variant="blue"
                        className="rounded-full py-0 text-[11px]"
                      >
                        School-wide
                      </Badge>
                    ),
                  }
                : {}),
              Action: (
                <RowActions
                  label={`Actions for ${period.label}`}
                  actions={[
                    canEdit && {
                      label: "Edit",
                      icon: Pencil,
                      onSelect: () => open(period),
                    },
                    canDelete && {
                      label: "Delete",
                      icon: Trash2,
                      destructive: true,
                      onSelect: () => setConfirm(period),
                    },
                  ]}
                />
              ),
            }))}
            onRowClick={(period: Period) => {
              if (period && canEdit) open(period);
            }}
            emptyText="No periods run on this day"
            mobile="scroll"
          />
        </>
      )}

      <PeriodDrawer
        open={drawerOpen}
        editing={!!editing}
        saving={creating || updating}
        initial={editing ? periodDraftFrom(editing) : blankPeriod(branch)}
        dayHasOwnSchedule={(d) => ownDays.has(d)}
        onClose={() => setDrawerOpen(false)}
        onSave={save}
      />

      <PromptModal
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={runDelete}
        loading={removing}
        canCancel
        title={`Remove ${confirm?.label}?`}
        description={deleteBody(confirm)}
        onConfirmText="Remove"
        containerClass="min-h-[320px] lg:w-[420px]"
        srcClass="size-25"
        src="/image/caution.png"
      />
    </PageShell>
  );
}

/** "08:00:00" as "08:00". The seconds are never anything but zero here. */
function clock(value: string): string {
  return (value ?? "").slice(0, 5);
}

/** How long the day is, and how much of it is teaching. */
function summary(periods: Period[]): string {
  if (!periods.length) return "";
  const lessons = periods.filter((p) => p.period_type === "LESSON").length;
  const first = clock(periods[0].start_time);
  const last = clock(periods[periods.length - 1].end_time);
  return `${periods.length} period${periods.length === 1 ? "" : "s"}, ${lessons} of them teaching · ${first} to ${last}`;
}


/**
 * What removing a period does.
 *
 * A lesson period holding slots is PROTECTed by the server, so this warns
 * rather than promises. The day-replacing case gets its own sentence, because
 * removing the LAST row a day owns hands that day back to the everyday
 * schedule - a change to a day nobody was editing.
 */
function deleteBody(period: Period | null): string {
  if (!period) return "";
  const when = `${clock(period.start_time)} to ${clock(period.end_time)}`;
  if (period.day_of_week) {
    return `${period.label} runs ${when} on ${period.day_label} only. If it is the last period that day owns, the day goes back to running the everyday schedule. Any lesson already scheduled in it will block the removal.`;
  }
  return `${period.label} runs ${when} every day, so it comes off every timetable grid built on it. Any lesson already scheduled in it will block the removal.`;
}
