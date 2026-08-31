import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Users } from "lucide-react";

import CustomTable from "@/components/custom/custom-table";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { PageShell } from "@/components/layout/page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { OutlinedNotice } from "@/pages/protected/onboarding/components/outlined-notice";
import { routesPath } from "@/routes/routesPath";
import { cn } from "@/lib/utils";
import { apiDetailMessage } from "@/utils/api-error";
import {
  useBulkAssignClassMutation,
  useGetClassSeatsQuery,
  useGetClassRosterQuery,
  useGetUnplacedStudentsQuery,
} from "@/redux/services/students/students-api";
import type { BulkResultRow, StudentRow } from "@/redux/services/students/students-types";

import { statusChipClass } from "../status-chip";
import { TransferDrawer } from "../drawers/transfer-drawer";

type Tab = "unplaced" | "roster";

/**
 * Placing children, and reading a class register.
 *
 * Two tabs because they are two jobs: "who has nowhere to sit" is a worklist
 * that should empty, and "who is in JSS1 A" is a reference you come back to.
 *
 * **Partial success is reported as partial.** The bulk route answers per
 * student - each is its own transaction - so twenty picked can come back as
 * eighteen placed and two refused, with a reason on each. Collapsing that into
 * one "Done" would hide the two, and the unplaced children are the entire point
 * of the screen.
 */
export default function ClassesAndTransfers() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  // The tab and the class live in the URL: the directory's capacity panel deep
  // links straight to one class's register, and a registrar sends a colleague
  // the link to the list they are looking at.
  const tab = (params.get("tab") as Tab) || "unplaced";
  const classParam = params.get("class") ?? "";

  const [picked, setPicked] = useState<number[]>([]);
  const [target, setTarget] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [refusals, setRefusals] = useState<BulkResultRow[]>([]);
  const [moving, setMoving] = useState<StudentRow | null>(null);

  const { data: classesData } = useGetClassSeatsQuery();
  const classes = useMemo(() => classesData?.data ?? [], [classesData]);

  const {
    data: unplacedData,
    isLoading: unplacedLoading,
    isError: unplacedError,
    refetch: refetchUnplaced,
  } = useGetUnplacedStudentsQuery();
  const unplaced = useMemo(() => unplacedData?.data ?? [], [unplacedData]);

  // Default to the first class only once the list has arrived, so the roster
  // does not fetch against an empty id on the first render.
  const rosterClassId = Number(classParam) || classes[0]?.id;
  const { data: rosterData, isFetching: rosterLoading } = useGetClassRosterQuery(
    rosterClassId as number,
    { skip: tab !== "roster" || !rosterClassId },
  );
  const roster = useMemo(() => rosterData?.data ?? [], [rosterData]);

  const [bulkAssign, { isLoading: assigning }] = useBulkAssignClassMutation();

  function setTab(next: Tab) {
    const p = new URLSearchParams(params);
    p.set("tab", next);
    setParams(p, { replace: true });
  }

  function setRosterClass(id: string) {
    const p = new URLSearchParams(params);
    p.set("tab", "roster");
    p.set("class", id);
    setParams(p, { replace: true });
  }

  // Which classes the picked students could actually join.
  //
  // A class carries a branch; a student carries a branch; the server refuses a
  // placement that crosses them. Offering the refusal and then explaining it is
  // worse than not offering it: the registrar picks a class, waits, and is told
  // no. A class with no branch is school-wide and takes anyone, and at a
  // single-branch school the field is absent entirely so nothing is excluded.
  const pickedBranches = new Set(
    unplaced.filter((s) => picked.includes(s.id)).map((s) => s.branch),
  );
  const classFits = (c: (typeof classes)[number]) => {
    if (c.branch == null) return true;
    if (pickedBranches.size === 0) return true;
    return pickedBranches.size === 1 && pickedBranches.has(c.branch);
  };

  const seatsUsed = rosterData?.seats_used ?? 0;
  const capacity = rosterData?.capacity ?? null;
  const over = capacity != null && seatsUsed > capacity;
  const targetClass = classes.find((c) => String(c.id) === target);

  async function assign(allowOver = false) {
    if (!target || picked.length === 0) return;
    setRefusals([]);
    try {
      const result = await bulkAssign({
        student_ids: picked,
        school_class: Number(target),
        allow_over_capacity: allowOver,
      }).unwrap();

      const rows = result.data.results ?? [];
      const failed = rows.filter((r) => !r.ok);
      setPicked([]);
      setAcknowledged(false);

      if (failed.length === 0) {
        toast.success(result.message);
      } else {
        // Named, not counted. "2 could not be placed" tells a registrar
        // nothing about which two or what to do next.
        setRefusals(failed);
        toast.warning(result.message);
      }
    } catch (error) {
      const message = apiDetailMessage(error, "We could not assign those students.");
      // Capacity is a question, not a fault: the server refuses once for the
      // whole selection, and the registrar decides whether to overfill.
      if (/capacit/i.test(message) && !allowOver) {
        setAcknowledged(true);
        toast.warning(`${message} Press Assign again to go ahead anyway.`);
        return;
      }
      toast.error(message);
    }
  }

  if (unplacedError && tab === "unplaced") {
    return (
      <PageShell>
        <OutlinedNotice
          icon={Users}
          title="We could not load the students waiting for a class"
          body="Something went wrong on our side. Try again in a moment."
          actionLabel="Try again"
          onAction={() => refetchUnplaced()}
        />
      </PageShell>
    );
  }

  return (
    <PageShell className="content-start gap-5" grid>
      <div
        role="tablist"
        aria-label="Classes and transfers"
        className="flex max-w-full gap-1 overflow-x-auto"
      >
        {(
          [
            ["unplaced", `Waiting for a class${unplaced.length ? ` (${unplaced.length})` : ""}`],
            ["roster", "Class register"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            type="button"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              "whitespace-nowrap rounded-full px-3 py-1.5 text-sm",
              tab === key
                ? "bg-white-03 font-semibold text-primary"
                : "text-gray-05 hover:text-black-01",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Refusals from the last run ──────────────────────────────────── */}
      {refusals.length > 0 && (
        <section className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-amber-900">
              {refusals.length} {refusals.length === 1 ? "student was" : "students were"}{" "}
              not placed
            </h3>
            <button
              type="button"
              onClick={() => setRefusals([])}
              className="text-xs text-amber-900 underline-offset-2 hover:underline"
            >
              Dismiss
            </button>
          </div>
          <ul className="mt-2 grid gap-1.5">
            {refusals.map((r) => (
              <li key={r.student} className="text-sm text-amber-900">
                <span className="font-medium">{r.name || `Student ${r.student}`}</span>
                {r.message ? ` - ${r.message}` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === "unplaced" ? (
        <>
          {unplaced.length === 0 && !unplacedLoading ? (
            <p className="rounded-xl border border-dashed border-white-02 bg-white px-4 py-10 text-center text-sm text-gray-05">
              Every student on the roll has a class. Nothing to place.
            </p>
          ) : (
            <>
              <CustomTable
                tableHeaderList={[
                  "",
                  "Student",
                  "Admission no.",
                  "Status",
                  "Level applied for",
                  "Primary guardian",
                ]}
                loading={unplacedLoading}
                defaultBodyList={unplaced}
                tableBodyList={unplaced.map((s) => ({
                  "": (
                    <input
                      type="checkbox"
                      aria-label={`Select ${s.full_name}`}
                      checked={picked.includes(s.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        setPicked((p) =>
                          p.includes(s.id)
                            ? p.filter((x) => x !== s.id)
                            : [...p, s.id],
                        );
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="size-4"
                    />
                  ),
                  Student: s.full_name,
                  "Admission no.": s.student_number || "Not issued",
                  Status: (
                    <span className={statusChipClass(s.status)}>{s.status_label}</span>
                  ),
                  "Level applied for": s.level_name || "-",
                  "Primary guardian": s.primary_guardian || "None linked",
                }))}
                onRowClick={(student: StudentRow) => {
                  if (student?.id) {
                    navigate(routesPath.PROTECTED.STUDENTS.PROFILE_ID(student.id));
                  }
                }}
                hidePagination
                emptyText="Nobody is waiting for a class"
              />

              {/* The action bar appears only once something is picked, so the
                  screen is a list until it is a worklist. */}
              {picked.length > 0 && (
                <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-2.5 rounded-xl border border-white-02 bg-white p-3 shadow-lg">
                  <span className="text-sm text-black-01">
                    {picked.length} picked
                  </span>
                  <NativeSelect
                    aria-label="Assign into"
                    value={target}
                    onChange={(e) => {
                      setTarget(e.target.value);
                      setAcknowledged(false);
                    }}
                    className="h-9 w-auto min-w-44"
                  >
                    <option value="">Assign into…</option>
                    {classes.map((c) => {
                      const fits = classFits(c);
                      return (
                        <option key={c.id} value={c.id} disabled={!fits}>
                          {c.name}
                          {c.capacity == null
                            ? ` · ${c.used} enrolled`
                            : ` · ${c.used}/${c.capacity}`}
                          {!fits && c.branch_name
                            ? ` · ${c.branch_name} only`
                            : ""}
                        </option>
                      );
                    })}
                  </NativeSelect>
                  <Button
                    size="sm"
                    disabled={!target || assigning}
                    onClick={() => assign(acknowledged)}
                  >
                    {assigning
                      ? "Assigning…"
                      : acknowledged
                        ? "Assign anyway"
                        : "Assign"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setPicked([]);
                      setAcknowledged(false);
                    }}
                  >
                    Clear
                  </Button>
                  {/* What this selection does to the class, before it runs.
                      The server checks capacity once for the whole selection,
                      so the arithmetic that matters is used + picked - not
                      used + 1, and getting it wrong here means the warning
                      fires on the wrong side of the limit. */}
                  {targetClass && (
                    <span
                      className={
                        targetClass.capacity != null &&
                        targetClass.used + picked.length > targetClass.capacity
                          ? "text-xs text-amber-700"
                          : "text-xs text-gray-05"
                      }
                    >
                      {targetClass.capacity == null
                        ? `Into ${targetClass.name} · no capacity set`
                        : targetClass.used + picked.length > targetClass.capacity
                          ? `${targetClass.name} holds ${targetClass.used} of ${targetClass.capacity}. These ${picked.length} would put it ${targetClass.used + picked.length - targetClass.capacity} over.`
                          : `Into ${targetClass.name} · ${targetClass.used} of ${targetClass.capacity} used, ${targetClass.capacity - targetClass.used} free`}
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <label
                htmlFor="roster-class"
                className="text-xs font-medium text-gray-05"
              >
                Class
              </label>
              <NativeSelect
                id="roster-class"
                value={String(rosterClassId ?? "")}
                onChange={(e) => setRosterClass(e.target.value)}
                className="mt-1 h-9 w-auto min-w-44"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </NativeSelect>
            </div>

            {/* The seat count is a fact about the CLASS, not about the rows
                below it: a branch-bound reader sees their own children in a
                school-wide class, and showing them 12 of 30 would have them
                fill a class that is already full. */}
            <div className="min-w-0">
              {rosterLoading ? (
                <Skeleton className="h-9 w-40" />
              ) : (
                <>
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      over ? "text-red-600" : "text-black-01",
                    )}
                  >
                    {seatsUsed}
                    {capacity != null ? ` of ${capacity}` : ""} seats used
                  </p>
                  <p className="text-xs text-gray-05">
                    {capacity == null
                      ? "This class has no capacity set."
                      : over
                        ? `Over by ${seatsUsed - capacity}.`
                        : `${capacity - seatsUsed} free.`}
                  </p>
                </>
              )}
            </div>
          </div>

          <CustomTable
            tableHeaderList={[
              "Student",
              "Admission no.",
              "Status",
              "Primary guardian",
              "",
            ]}
            loading={rosterLoading}
            defaultBodyList={roster}
            tableBodyList={roster.map((s) => ({
              Student: s.full_name,
              "Admission no.": s.student_number || "Not issued",
              Status: (
                <span className={statusChipClass(s.status)}>{s.status_label}</span>
              ),
              "Primary guardian": s.primary_guardian || "None linked",
              "": (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMoving(s);
                  }}
                  className="text-xs text-primary underline-offset-2 hover:underline"
                >
                  Move
                </button>
              ),
            }))}
            onRowClick={(student: StudentRow) => {
              if (student?.id) {
                navigate(routesPath.PROTECTED.STUDENTS.PROFILE_ID(student.id));
              }
            }}
            hidePagination
            emptyText="Nobody is in this class yet"
          />
        </>
      )}

      {moving && (
        <TransferDrawer
          student={moving}
          open
          onClose={() => setMoving(null)}
        />
      )}
    </PageShell>
  );
}
