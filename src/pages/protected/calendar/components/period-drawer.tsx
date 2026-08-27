import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SearchSelect } from "@/components/custom/search-select";
import { Field } from "@/pages/protected/academics/components/entity-drawer";
import { cn } from "@/lib/utils";
import { parseApiError } from "@/utils/api-error";
import { useBranchLens } from "@/hooks/use-branch-lens";
import type {
  DayOfWeek,
  PeriodType,
  PeriodWrite,
} from "@/redux/services/calendar/calendar-types";
import type { PeriodDraft } from "./period-draft";

// ─────────────────────────────────────────────────────────────────────────────
// One row of the school day.
//
// **There is no order field, and its absence is the point.** The server assigns
// the position from the times, so a school cannot make the order disagree with
// the clock. Offering a number here would be offering a way to break that.
//
// **"Applies on" REPLACES, it does not add.** Giving Friday its own periods
// means Friday runs only those and the everyday schedule does not apply to it
// at all. That is what a school with a short Friday means, and it is also the
// single most surprising thing on this screen - so it is said in the form, at
// the moment a day is chosen, rather than discovered afterwards.
// ─────────────────────────────────────────────────────────────────────────────

const PERIOD_TYPES: { value: PeriodType; label: string }[] = [
  { value: "LESSON", label: "Lesson" },
  { value: "BREAK", label: "Break" },
  { value: "LUNCH", label: "Lunch" },
  { value: "ASSEMBLY", label: "Assembly" },
];

/**
 * Monday to Friday, and Saturday and Sunday are deliberately absent.
 *
 * The column holds all seven and a Saturday school is a real thing, so the
 * server accepts them. Which days a FORM offers is the client's choice, and
 * this one offers the five a school building a bell schedule means.
 */
const DAYS: { value: DayOfWeek; label: string }[] = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
];

export function PeriodDrawer({
  open,
  initial,
  editing,
  saving,
  /** True when the chosen day already has a schedule of its own. */
  dayHasOwnSchedule,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: PeriodDraft;
  editing: boolean;
  saving: boolean;
  dayHasOwnSchedule: (day: DayOfWeek) => boolean;
  onClose: () => void;
  onSave: (body: PeriodWrite) => Promise<unknown>;
}) {
  const {
    applies: multiBranch,
    isTied,
    branch: tiedBranch,
    branches,
    label: tiedLabel,
  } = useBranchLens();

  const [draft, setDraft] = useState<PeriodDraft>(initial);
  const [touched, setTouched] = useState<{ label?: boolean; times?: boolean }>({});
  const [edited, setEdited] = useState<{ label?: boolean }>({});
  const [refusal, setRefusal] = useState<{ field: string; message: string } | null>(
    null,
  );

  const openedFor = open ? JSON.stringify(initial) : "shut";
  const [lastOpenedFor, setLastOpenedFor] = useState(openedFor);
  if (openedFor !== lastOpenedFor) {
    setLastOpenedFor(openedFor);
    if (open) {
      setDraft(initial);
      setTouched({});
      setEdited({});
      setRefusal(null);
    }
  }

  const patch = (next: Partial<PeriodDraft>) => {
    setDraft((d) => ({ ...d, ...next }));
    setRefusal(null);
  };

  const tiedLock =
    isTied && tiedBranch !== "all"
      ? { id: tiedBranch as number, name: tiedLabel }
      : null;
  const effectiveBranch = tiedLock ? tiedLock.id : draft.branch;

  const labelEmpty = !!touched.label && !draft.label.trim();
  // The server refuses this too, with the same sentence. Caught here as well so
  // a reader looking at both boxes is told before they press Save.
  const endsBeforeStart =
    !!draft.start_time && !!draft.end_time && draft.end_time <= draft.start_time;
  const branchMissing = multiBranch && draft.branch === -1;

  const valid =
    !!draft.label.trim() &&
    !!draft.start_time &&
    !!draft.end_time &&
    !endsBeforeStart &&
    !branchMissing;

  const dirty =
    JSON.stringify({ ...draft, branch: effectiveBranch }) !==
    JSON.stringify({ ...initial, branch: tiedLock ? tiedLock.id : initial.branch });

  // The warning only matters when this period would be the FIRST on that day:
  // once the day has its own schedule, adding a second row to it changes
  // nothing about the everyday one.
  const replacesWholeDay =
    draft.day_of_week !== null &&
    !dayHasOwnSchedule(draft.day_of_week) &&
    !editing;

  const save = async () => {
    setTouched({ label: true, times: true });
    if (!valid) return;
    try {
      await onSave({
        label: draft.label.trim(),
        start_time: draft.start_time,
        end_time: draft.end_time,
        period_type: draft.period_type,
        day_of_week: draft.day_of_week,
        ...(multiBranch ? { branch: effectiveBranch } : {}),
        is_active: draft.is_active,
      });
      onClose();
    } catch (error) {
      const parsed = parseApiError(error);
      // PERIOD_OVERLAP names the period it collided with and the time it runs.
      // PERIOD_TIME_INVALID is about the two boxes. Both belong under the times.
      const field =
        parsed.code === "PERIOD_OVERLAP" || parsed.code === "PERIOD_TIME_INVALID"
          ? "times"
          : String(parsed.detail.field ?? "");
      setRefusal({
        field,
        message: parsed.message || "That period could not be saved.",
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 bg-white p-0 sm:max-w-lg"
      >
        <SheetHeader className="border-b border-border px-5 pb-4 pt-5 pr-12 text-left">
          <SheetTitle className="truncate font-mont text-base">
            {editing ? `Edit ${initial.label}` : "Add period"}
          </SheetTitle>
          <SheetDescription className="text-[13px] text-gray-01 text-pretty">
            One row of the school day. Every timetable grid is built on these,
            and their order comes from their times.
          </SheetDescription>
        </SheetHeader>

        <div className="min-w-0 flex-1 overflow-y-auto px-5 py-5">
          <Field
            label="Label *"
            error={
              labelEmpty
                ? "A label is required."
                : refusal?.field === "label"
                  ? refusal.message
                  : ""
            }
          >
            <Input
              value={draft.label}
              onChange={(e) => {
                setEdited((t) => ({ ...t, label: true }));
                patch({ label: e.target.value });
              }}
              onBlur={() => edited.label && setTouched((t) => ({ ...t, label: true }))}
              placeholder="e.g. Period 1"
              aria-invalid={labelEmpty || refusal?.field === "label" || undefined}
            />
          </Field>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Start time *">
              <Input
                type="time"
                value={draft.start_time}
                onChange={(e) => patch({ start_time: e.target.value })}
                onBlur={() => setTouched((t) => ({ ...t, times: true }))}
              />
            </Field>
            <Field label="End time *">
              <Input
                type="time"
                value={draft.end_time}
                onChange={(e) => patch({ end_time: e.target.value })}
                aria-invalid={endsBeforeStart || undefined}
              />
            </Field>
          </div>
          {(endsBeforeStart || refusal?.field === "times") && (
            <p className="mt-1.5 text-xs text-error-text text-pretty">
              {endsBeforeStart
                ? "The end time must be after the start time."
                : refusal?.message}
            </p>
          )}

          <div className="mt-4">
            <Field label="Type *">
              <div className="flex flex-wrap gap-1.5">
                {PERIOD_TYPES.map((kind) => {
                  const on = draft.period_type === kind.value;
                  return (
                    <button
                      key={kind.value}
                      type="button"
                      onClick={() => patch({ period_type: kind.value })}
                      aria-pressed={on}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs",
                        on
                          ? "border-primary bg-pry-01 font-medium text-primary"
                          : "border-white-02 bg-white text-gray-06 hover:bg-gray-04",
                      )}
                    >
                      {kind.label}
                    </button>
                  );
                })}
              </div>
            </Field>
            {draft.period_type !== "LESSON" && (
              <p className="mt-1.5 text-xs text-gray-05 text-pretty">
                Only a lesson period can hold a timetable slot. A break, a lunch
                and an assembly show on the grid and cannot be filled.
              </p>
            )}
          </div>

          <div className="mt-5 border-t border-white-02 pt-4">
            <p className="mb-2 text-[13px] font-medium text-gray-06">
              Applies on *
            </p>
            <div className="flex flex-wrap gap-1.5">
              <DayChip
                on={draft.day_of_week === null}
                label="Every day"
                onClick={() => patch({ day_of_week: null })}
              />
              {DAYS.map((day) => (
                <DayChip
                  key={day.value}
                  on={draft.day_of_week === day.value}
                  label={day.label}
                  onClick={() => patch({ day_of_week: day.value })}
                />
              ))}
            </div>
            {replacesWholeDay && (
              // The most surprising rule on the screen, said at the moment it
              // becomes true rather than discovered on the grid afterwards.
              <p className="mt-2 rounded-lg border border-yellow-01/40 bg-yellow-01/5 px-3 py-2 text-xs text-gray-06 text-pretty">
                {DAYS.find((d) => d.value === draft.day_of_week)?.label} does not
                have its own schedule yet. Adding this gives it one, and it will
                then run ONLY the periods you put on it - the everyday schedule
                will not apply to it at all.
              </p>
            )}
          </div>

          {multiBranch && (
            <div className="mt-5 border-t border-white-02 pt-4">
              <p className="mb-2 text-[13px] font-medium text-gray-06">
                Applies to *
              </p>
              {tiedLock ? (
                <div className="rounded-lg border border-white-02 bg-white-05 px-3 py-2.5">
                  <p className="text-sm text-black-01">{tiedLock.name}</p>
                  <p className="mt-0.5 text-xs text-gray-05 text-pretty">
                    Your account is tied to this branch, so anything you create
                    belongs to it.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <ScopeOption
                      on={draft.branch === null}
                      label="The whole school"
                      onClick={() => patch({ branch: null })}
                    />
                    <ScopeOption
                      on={draft.branch !== null}
                      label="One branch"
                      onClick={() =>
                        patch({ branch: draft.branch ?? branches[0]?.id ?? -1 })
                      }
                    />
                  </div>
                  {draft.branch !== null && (
                    <div className="mt-2">
                      <SearchSelect
                        aria-label="Branch"
                        placeholder="Search branches"
                        value={draft.branch === -1 ? "" : String(draft.branch)}
                        onChange={(e) =>
                          patch({
                            branch: e.target.value ? Number(e.target.value) : -1,
                          })
                        }
                        options={branches.map((b) => ({
                          value: String(b.id),
                          label: b.name,
                        }))}
                      />
                    </div>
                  )}
                  <p className="mt-2 text-xs text-gray-05 text-pretty">
                    One branch can start earlier than another, so a period can
                    belong to just one.
                  </p>
                </>
              )}
            </div>
          )}

          {refusal && !refusal.field && (
            <p className="mt-4 text-xs text-error-text text-pretty">
              {refusal.message}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-white-02 px-5 py-4">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!valid || !dirty || saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {editing ? "Save changes" : "Add period"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DayChip({
  on,
  label,
  onClick,
}: {
  on: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs",
        on
          ? "border-primary bg-pry-01 font-medium text-primary"
          : "border-white-02 bg-white text-gray-06 hover:bg-gray-04",
      )}
    >
      {label}
    </button>
  );
}

function ScopeOption({
  on,
  label,
  onClick,
}: {
  on: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "rounded-lg border px-3 py-2 text-left text-sm",
        on ? "border-primary bg-pry-01 text-primary" : "border-white-02 text-gray-06",
      )}
    >
      {label}
    </button>
  );
}
