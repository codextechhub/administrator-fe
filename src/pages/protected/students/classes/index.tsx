import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Users } from "lucide-react";

import CustomTable from "@/components/custom/custom-table";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import PermissionGate from "@/components/custom/permission-gate";
import Tabs from "@/components/custom/tab";
import { useStudentsLens } from "@/hooks/use-students-lens";
import { P } from "@/permissions";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyRing } from "../empty-ring";
import { OutlinedNotice } from "@/pages/protected/onboarding/components/outlined-notice";
import { routesPath } from "@/routes/routesPath";
import { cn } from "@/lib/utils";
import { writeErrorMessage } from "@/utils/api-error";
import {
  useBulkAssignClassMutation,
  useGetClassSeatsQuery,
  useGetClassRosterQuery,
  useGetUnplacedStudentsQuery,
} from "@/redux/services/students/students-api";
import type { BulkResultRow, StudentRow } from "@/redux/services/students/students-types";

import { StudentStatusBadge } from "../status-badge";
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

  const { lens } = useStudentsLens();
  const { data: classesData } = useGetClassSeatsQuery(lens);
  const classes = useMemo(() => classesData?.data ?? [], [classesData]);

  const {
    data: unplacedData,
    isLoading: unplacedLoading,
    isError: unplacedError,
    refetch: refetchUnplaced,
  } = useGetUnplacedStudentsQuery(lens);
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

  // The roster's own seats_used is not read here: the class rail above the
  // register already carries every class's load, from the aggregate the backend
  // pins to this endpoint (test_it_agrees_with_the_roster_it_is_meant_to
  // _replace). Reading both would be two sources for one number.
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
      const message = writeErrorMessage(error, "We could not assign those students.");
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
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-black-01">
          Classes &amp; transfers
        </h2>
        <p className="mt-1 text-sm text-gray-01">
          Place students who have no class, and read any class register.
        </p>
      </div>

      {/* The app's tab strip. It reads and writes `?tab=` itself, which is
          the same URL this screen already used - so the capacity panel's deep
          link into a register keeps working, and the sliding marker now
          matches every other tabbed screen. */}
      <Tabs
        tabKey="tab"
        tabs={[
          {
            value: "unplaced",
            label: `Waiting for a class${unplaced.length ? ` (${unplaced.length})` : ""}`,
          },
          { value: "roster", label: "Class register" },
        ]}
      />

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
            <EmptyRing>Every student has a class</EmptyRing>
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
                    <StudentStatusBadge status={s.status} label={s.status_label} />
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
                  {/* The screen reads a register as well as filling one, so
                      the SCREEN stays open on `view` and only the write is
                      gated. The nav item already hides it from somebody
                      without the key, but a URL still reaches it. */}
                  <PermissionGate permission={P.ASSIGN_CLASS}>
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
                  </PermissionGate>
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
          {/* The class picker IS the capacity list.
              These are the four bars the directory used to carry as a summary.
              Here they are not a summary - they are the thing you came for, so
              they do the navigating too. A bare <select> naming twelve classes
              made you pick one to find out how full it was, which is backwards:
              the load is what tells you which one to open. */}
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {classes.map((c) => {
              const chosen = c.id === rosterClassId;
              const isOver = c.capacity != null && c.used > c.capacity;
              const isFull = c.remaining === 0;
              const pct = c.capacity
                ? Math.min(100, Math.round((c.used / c.capacity) * 100))
                : 0;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={chosen}
                  onClick={() => setRosterClass(String(c.id))}
                  className={cn(
                    "min-w-0 rounded-lg border px-3.5 py-3 text-left",
                    chosen
                      ? "border-primary bg-white-03"
                      : "border-white-02 bg-white hover:border-primary/30 hover:bg-white-05",
                  )}
                >
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium text-black-01">
                      {c.name}
                    </span>
                    <span className="shrink-0 text-xs text-gray-06">
                      {c.capacity == null ? c.used : `${c.used}/${c.capacity}`}
                    </span>
                  </span>
                  <span className="mt-2 block h-[7px] overflow-hidden rounded-full bg-gray-04">
                    <span
                      className={cn(
                        "block h-full rounded-full",
                        isOver
                          ? "bg-red-500"
                          : isFull
                            ? "bg-amber-500"
                            : "bg-primary",
                      )}
                      style={{ width: `${isOver ? 100 : pct}%` }}
                    />
                  </span>
                  <span
                    className={cn(
                      "mt-1.5 block text-xs",
                      isOver
                        ? "text-red-600"
                        : isFull
                          ? "text-amber-700"
                          : "text-gray-05",
                    )}
                  >
                    {c.capacity == null
                      ? "No limit set"
                      : isOver
                        ? `Over by ${c.used - c.capacity}`
                        : isFull
                          ? "Full"
                          : `${c.remaining} free`}
                  </span>
                </button>
              );
            })}
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
                <StudentStatusBadge status={s.status} label={s.status_label} />
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
