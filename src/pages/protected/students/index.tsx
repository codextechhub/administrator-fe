import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { LayoutGrid, List, Search, Upload, UserPlus, Users, X } from "lucide-react";

import CustomTable from "@/components/custom/custom-table";
import { Button } from "@/components/ui/button";
import PermissionGate from "@/components/custom/permission-gate";
import { P } from "@/permissions";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton } from "@/components/custom/export-button";
import { OutlinedNotice } from "@/pages/protected/onboarding/components/outlined-notice";
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
import { FiltersPopover } from "./filters-popover";
import { OverviewCard } from "./overview-card";
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [drawer, setDrawer] = useState<DrawerRequest | null>(null);

  // "all" is the pill's word for "every branch"; the API wants the key absent.
  const branch =
    branchLens.applies && branchLens.branch !== "all"
      ? (branchLens.branch as number)
      : undefined;

  const listArgs = {
    search: search.trim() || undefined,
    // "unassigned" is not a class id: the server reads it as "on the roll with
    // no class", which is a different query from any particular class.
    class: unassignedOnly ? "unassigned" : classId === "all" ? undefined : classId,
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
    (status !== "all" ? 1 : 0) +
    (unassignedOnly ? 1 : 0);
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
    unassignedOnly && {
      label: "Unassigned class",
      clear: () => setUnassignedOnly(false),
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
    setUnassignedOnly(false);
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
      {/* ── Who this page is about, and the two ways in ──────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-black-01">
            Student Directory
          </h2>
          <p className="mt-1 text-sm text-gray-01">
            Every student at {branchLens.applies ? branchLens.label : "this school"}
            {summary?.session ? ` for ${summary.session}` : ""}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <PermissionGate permission={P.IMPORT_STUDENTS}>
            <button
              type="button"
              onClick={() => navigate(routesPath.PROTECTED.STUDENTS.IMPORT)}
              className="inline-flex h-10.5 items-center gap-2 rounded-lg border border-white-02 bg-white px-4 text-sm font-medium text-gray-01 hover:bg-gray-03 hover:text-primary"
            >
              <Upload className="size-4" />
              Bulk import
            </button>
          </PermissionGate>
          <PermissionGate permission={P.ENROLL_STUDENT}>
            <button
              type="button"
              onClick={() => navigate(routesPath.PROTECTED.STUDENTS.ENROL)}
              className="inline-flex h-10.5 items-center gap-2 rounded-lg bg-primary px-4.5 text-sm font-medium text-white hover:bg-primary/90"
            >
              <UserPlus className="size-4" />
              Enrol student
            </button>
          </PermissionGate>
        </div>
      </div>

      <OverviewCard
        summary={summary}
        loading={summaryLoading}
        onPickStatus={(next) => resetTo(() => setStatus(next))}
        onOpenApplicants={() =>
          navigate(routesPath.PROTECTED.STUDENTS.APPLICANTS)
        }
        onOpenUnassigned={() => navigate(routesPath.PROTECTED.STUDENTS.ASSIGN)}
        onOpenClass={() => navigate(routesPath.PROTECTED.STUDENTS.ASSIGN)}
      />

      {/* ── Search, filters, export, view ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-55 max-w-85 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-05" />
          <input
            value={search}
            onChange={(e) => resetTo(() => setSearch(e.target.value))}
            placeholder="Search name or admission no."
            aria-label="Search students"
            className="h-10.5 w-full rounded-lg border border-white-02 bg-white pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>

        <FiltersPopover
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          value={{ classId, level, status, unassignedOnly }}
          onChange={(next) =>
            resetTo(() => {
              if (next.classId !== undefined) setClassId(next.classId);
              if (next.level !== undefined) setLevel(next.level);
              if (next.status !== undefined) setStatus(next.status);
              if (next.unassignedOnly !== undefined) {
                setUnassignedOnly(next.unassignedOnly);
                // The two ask different questions of the same column, so one
                // has to give: a class filter and "no class at all" cannot
                // both be true, and leaving the old class on returns nothing.
                if (next.unassignedOnly) setClassId("all");
              }
            })
          }
          onClear={clearAll}
          classes={classes}
          levels={levels}
          statuses={summary?.by_status ?? []}
        />

        {/* The branch goes by NAME, not id: the export filters on the branch's
            name and a translator has no tenant to resolve one into the other.
            Sending it means the file narrows exactly as the table does - which
            a student export can do and a catalogue export cannot, because a
            student belongs to one branch and is never school-wide. */}
        <ExportButton
          screen="students.directory"
          params={{
            search: search.trim() || undefined,
            status: status === "all" ? undefined : status,
            class: classId === "all" ? undefined : classId,
            level: level === "all" ? undefined : level,
            branch_name: branch !== undefined ? branchLens.label : undefined,
          }}
        />

        <div className="ml-auto inline-flex rounded-lg border border-white-02 bg-white p-0.5">
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
            // Avatar, name, and the level UNDER the name rather than in a
            // column of its own. A level is a property of the class, so a
            // separate column repeated a fact already on the row and pushed
            // the guardian off the fold on a laptop.
            Student: (
              <span className="flex min-w-0 items-center gap-2.5">
                <span
                  aria-hidden
                  className="grid size-8.5 shrink-0 place-content-center rounded-full bg-white-03 text-xs font-semibold text-primary"
                >
                  {initials(s.full_name)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm text-black-01">
                    {s.full_name}
                  </span>
                  <span className="block truncate text-xs text-gray-05">
                    {s.level_name || "No level"}
                  </span>
                </span>
              </span>
            ),
            // "Not issued" rather than a dash: an applicant legitimately has no
            // number yet, which is a different thing from a missing value.
            "Admission no.": s.student_number || "Not issued",
            // A chip, and amber when there is none: a student with no class is
            // the one row on this table somebody has to act on, so it should
            // not read like ordinary text.
            Class: s.class_name ? (
              <span className="inline-flex rounded-full bg-white-03 px-2 py-0.5 text-xs font-medium text-primary">
                {s.class_name}
              </span>
            ) : (
              <span className="inline-flex rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700">
                Unassigned
              </span>
            ),
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

/** Two letters from the name, for the row avatar. */
function initials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
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
