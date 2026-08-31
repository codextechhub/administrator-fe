import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { LayoutGrid, List, Search, Users, X } from "lucide-react";

import CustomTable from "@/components/custom/custom-table";
import { Button } from "@/components/ui/button";
import PermissionGate from "@/components/custom/permission-gate";
import { P } from "@/permissions";
import { PageShell } from "@/components/layout/page-shell";
import { OutlinedNotice } from "@/pages/protected/onboarding/components/outlined-notice";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { routesPath } from "@/routes/routesPath";
import { useBranchLens } from "@/hooks/use-branch-lens";
import { cn } from "@/lib/utils";
import {
  useGetStudentSummaryQuery,
  useGetStudentsQuery,
} from "@/redux/services/students/students-api";
import type {
  StudentRow,
  StudentStatus,
} from "@/redux/services/students/students-types";
import { useGetClassesQuery } from "@/redux/services/academics/academics-api";

import { StudentDrawers, type DrawerRequest } from "./drawers";
import { CapacityPanel } from "./capacity-panel";
import { StatusBar } from "./status-bar";
import { StudentCards } from "./student-cards";
import { statusChipClass } from "./status-chip";

/**
 * The student directory. The module's front door, and its biggest screen.
 *
 * Read-only in this phase, deliberately: the whole API contract, the envelope,
 * the pagination shape and the branch lens are proven here before a single
 * mutation is written. The row menu's Edit, Change status and Transfer arrive
 * with the drawer bundle.
 *
 * **The tiles and the table come from two different endpoints and must agree.**
 * Both are given the same branch. They did not use to be: `/students/summary/`
 * took no branch, so the tiles read 87 over a table showing 49, with nothing on
 * the page marking which number was which. If a figure here is ever fed from a
 * call that does not carry `branch`, that gap comes straight back.
 */
export default function StudentDirectory() {
  const navigate = useNavigate();
  const branchLens = useBranchLens();

  const [search, setSearch] = useState("");
  const [classId, setClassId] = useState("all");
  const [level, setLevel] = useState("all");
  const [status, setStatus] = useState<StudentStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"list" | "cards">("list");
  const [drawer, setDrawer] = useState<DrawerRequest | null>(null);

  // "all" is the pill's word for "every branch"; the API wants the key absent.
  const branch =
    branchLens.applies && branchLens.branch !== "all"
      ? (branchLens.branch as number)
      : undefined;

  const listArgs = {
    search: search.trim() || undefined,
    class: classId === "all" ? undefined : classId,
    level: level === "all" ? undefined : level,
    status: status === "all" ? undefined : status,
    branch,
    page,
  };

  const {
    data: listData,
    isLoading: listLoading,
    isFetching,
    isError: listError,
    refetch,
  } = useGetStudentsQuery(listArgs);
  // The same branch the table gets. These two used to disagree.
  const { data: summaryData, isLoading: summaryLoading } =
    useGetStudentSummaryQuery({ branch });
  // The filter dropdowns' options. Classes are Academic Structure's, not ours.
  const { data: classesData } = useGetClassesQuery();

  const rows = useMemo(() => listData?.data ?? [], [listData]);
  const pagination = listData?.pagination;
  const summary = summaryData?.data;
  const classes = useMemo(() => classesData?.data ?? [], [classesData]);

  // Levels come from the classes the school actually runs, so the filter can
  // never offer a level with no class behind it.
  const levels = useMemo(() => {
    const seen = new Map<number, string>();
    for (const c of classes) {
      if (c.level && c.level_name) seen.set(c.level, c.level_name);
    }
    return [...seen].map(([id, name]) => ({ id, name }));
  }, [classes]);

  const facets =
    (classId !== "all" ? 1 : 0) +
    (level !== "all" ? 1 : 0) +
    (status !== "all" ? 1 : 0);
  const anyFilter = facets > 0 || search.trim().length > 0;

  const chips = [
    search.trim() && { label: `"${search.trim()}"`, clear: () => setSearch("") },
    classId !== "all" && {
      label: classes.find((c) => String(c.id) === classId)?.name ?? "Class",
      clear: () => setClassId("all"),
    },
    level !== "all" && {
      label: levels.find((l) => String(l.id) === level)?.name ?? "Level",
      clear: () => setLevel("all"),
    },
    status !== "all" && {
      label: summary?.by_status.find((s) => s.status === status)?.label ?? status,
      clear: () => setStatus("all"),
    },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  function resetTo(next: () => void) {
    next();
    setPage(1);
  }

  function clearAll() {
    setSearch("");
    setClassId("all");
    setLevel("all");
    setStatus("all");
    setPage(1);
  }

  if (listError) {
    return (
      <PageShell>
        <OutlinedNotice
          icon={Users}
          title="We could not load your students"
          body="Something went wrong on our side. Try again in a moment."
          actionLabel="Try again"
          onAction={() => refetch()}
        />
      </PageShell>
    );
  }

  return (
    <PageShell className="content-start gap-5" grid>
      {/* ── The lead figure, then the roll ───────────────────────────────── */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile
          loading={summaryLoading}
          label="Students"
          value={summary?.total}
          sub={`${summary?.on_roll ?? 0} currently on the roll`}
        />
        <Tile loading={summaryLoading} label="Active" value={summary?.active} />
        <Tile
          loading={summaryLoading}
          label="Applicants"
          value={summary?.applicants}
        />
        <Tile
          loading={summaryLoading}
          label="No class"
          value={summary?.unassigned}
          sub={summary?.unassigned ? "Needs a class" : "All placed"}
          emphasis={Boolean(summary?.unassigned)}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <StatusBar
          loading={summaryLoading}
          rows={summary?.by_status ?? []}
          total={summary?.total ?? 0}
          onPick={(next) => resetTo(() => setStatus(next))}
        />
        <CapacityPanel
          loading={summaryLoading}
          rows={summary?.nearest_capacity ?? []}
          onOpenClass={(classId) =>
            navigate(
              `${routesPath.PROTECTED.STUDENTS.ASSIGN}?tab=roster&class=${classId}`,
            )
          }
        />
      </div>

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-0 flex-1 basis-52">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-05" />
          <input
            value={search}
            onChange={(e) => resetTo(() => setSearch(e.target.value))}
            placeholder="Search by name or admission number"
            aria-label="Search students"
            className="h-9 w-full rounded-full border border-white-02 bg-white pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>

        <NativeSelect
          aria-label="Filter by class"
          value={classId}
          onChange={(e) => resetTo(() => setClassId(e.target.value))}
          className="h-9 w-auto min-w-36"
        >
          <option value="all">All classes</option>
          {/* Not a class id: the server reads it as "on the roll, no class". */}
          <option value="unassigned">No class yet</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </NativeSelect>

        <NativeSelect
          aria-label="Filter by level"
          value={level}
          onChange={(e) => resetTo(() => setLevel(e.target.value))}
          className="h-9 w-auto min-w-32"
        >
          <option value="all">All levels</option>
          {levels.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </NativeSelect>

        <NativeSelect
          aria-label="Filter by status"
          value={status}
          onChange={(e) =>
            resetTo(() => setStatus(e.target.value as StudentStatus | "all"))
          }
          className="h-9 w-auto min-w-32"
        >
          <option value="all">All statuses</option>
          {(summary?.by_status ?? []).map((s) => (
            <option key={s.status} value={s.status}>
              {s.label}
            </option>
          ))}
        </NativeSelect>

        <PermissionGate permission={P.ENROLL_STUDENT}>
          <Button
            size="sm"
            onClick={() => navigate(routesPath.PROTECTED.STUDENTS.ENROL)}
          >
            Enrol a student
          </Button>
        </PermissionGate>

        <div className="inline-flex rounded-full border border-white-02 bg-white p-0.5">
          <ViewButton
            active={view === "list"}
            onClick={() => setView("list")}
            label="List view"
          >
            <List className="size-4" />
          </ViewButton>
          <ViewButton
            active={view === "cards"}
            onClick={() => setView("cards")}
            label="Card view"
          >
            <LayoutGrid className="size-4" />
          </ViewButton>
        </div>
      </div>

      {/* Two or more filters is where a reader loses track of what is applied,
          so the chips appear then rather than for every single one. */}
      {chips.length >= 2 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => resetTo(chip.clear)}
              className="inline-flex items-center gap-1.5 rounded-full bg-gray-04 px-2.5 py-1 text-xs text-black-01 hover:bg-white-02"
            >
              {chip.label}
              <X className="size-3" />
            </button>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-primary underline-offset-2 hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      {anyFilter && !listLoading && (
        <p className="text-xs text-gray-05" aria-live="polite">
          {pagination?.totalItems ?? 0}{" "}
          {pagination?.totalItems === 1 ? "student" : "students"} match
          {pagination?.totalItems === 1 ? "es" : ""} your filters
        </p>
      )}

      {view === "list" ? (
        <CustomTable
          tableHeaderList={[
            "Student",
            "Admission no.",
            "Class",
            "Level",
            "Status",
            "Primary guardian",
          ]}
          loading={listLoading || isFetching}
          defaultBodyList={rows}
          dropDown
          dropDownList={[
            {
              label: "Open profile",
              onActionClick: (row: { _id: number }) =>
                navigate(routesPath.PROTECTED.STUDENTS.PROFILE_ID(row._id)),
            },
            {
              label: "Edit record",
              onActionClick: (row: { _id: number }) =>
                setDrawer({ kind: "edit", studentId: row._id }),
            },
            {
              label: "Change status",
              onActionClick: (row: { _id: number }) =>
                setDrawer({ kind: "status", studentId: row._id }),
            },
            {
              // One item, two words, because the route is the same either way
              // and the difference is only whether the student had a class.
              label: "Assign or transfer class",
              onActionClick: (row: { _id: number }) =>
                setDrawer({ kind: "transfer", studentId: row._id }),
            },
            {
              label: "Link a guardian",
              onActionClick: (row: { _id: number }) =>
                setDrawer({ kind: "guardian", studentId: row._id }),
            },
          ]}
          tableBodyList={rows.map((s) => ({
            // Carried so the row menu can find the student back; CustomTable
            // hands the DISPLAY row to onActionClick, not the source record.
            _id: s.id,
            Student: s.full_name,
            // "Not issued" rather than a dash: an applicant legitimately has no
            // number yet, which is a different thing from a missing value.
            "Admission no.": s.student_number || "Not issued",
            Class: s.class_name || "No class yet",
            Level: s.level_name || "-",
            Status: (
              <span className={statusChipClass(s.status)}>{s.status_label}</span>
            ),
            "Primary guardian": s.primary_guardian || "None linked",
          }))}
          onRowClick={(student: StudentRow) => {
            if (student?.id) {
              navigate(routesPath.PROTECTED.STUDENTS.PROFILE_ID(student.id));
            }
          }}
          currentPage={pagination?.currentPage ?? 1}
          totalPage={pagination?.totalPages ?? 1}
          onPageChange={(next) => setPage(Number(next) || 1)}
          emptyText={
            anyFilter ? "No students match your filters" : "No students yet"
          }
        />
      ) : (
        <StudentCards
          loading={listLoading || isFetching}
          rows={rows}
          onOpen={(id) =>
            navigate(routesPath.PROTECTED.STUDENTS.PROFILE_ID(id))
          }
          page={pagination?.currentPage ?? 1}
          totalPages={pagination?.totalPages ?? 1}
          onPageChange={setPage}
          emptyText={
            anyFilter ? "No students match your filters" : "No students yet"
          }
        />
      )}

      <StudentDrawers request={drawer} onClose={() => setDrawer(null)} />
    </PageShell>
  );
}

function Tile({
  label,
  value,
  sub,
  loading,
  emphasis,
}: {
  label: string;
  value?: number;
  sub?: string;
  loading?: boolean;
  emphasis?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-white-02 bg-white p-4">
      <p className="text-xs font-medium text-gray-05">{label}</p>
      {loading ? (
        <Skeleton className="mt-2 h-7 w-14" />
      ) : (
        <p
          className={cn(
            "mt-1 text-2xl font-semibold",
            emphasis ? "text-amber-700" : "text-black-01",
          )}
        >
          {value ?? 0}
        </p>
      )}
      {sub && <p className="mt-0.5 truncate text-xs text-gray-05">{sub}</p>}
    </div>
  );
}

function ViewButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "h-8 rounded-full px-3",
        active ? "bg-white-03 text-primary" : "text-gray-05",
      )}
    >
      {children}
    </Button>
  );
}
