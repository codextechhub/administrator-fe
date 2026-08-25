import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  ListTree,
  Pencil,
  Plus,
  Rows3,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import PromptModal from "@/components/modal/prompt-modal";
import PermissionGate from "@/components/custom/permission-gate";
import { OutlinedNotice } from "@/pages/protected/onboarding/components/outlined-notice";
import { P } from "@/permissions";
import { usePermissions } from "@/hooks/use-permissions";
import { useAcademicsLens } from "@/hooks/use-academics-lens";
import { cn } from "@/lib/utils";
import { parseApiError } from "@/utils/api-error";
import {
  useCreateLevelMutation,
  useCreateProgramMutation,
  useDeleteLevelMutation,
  useDeleteProgramMutation,
  useGetDepartmentsQuery,
  useGetProgramsQuery,
  useUpdateLevelMutation,
  useUpdateProgramMutation,
} from "@/redux/services/academics/academics-api";
import type {
  EntityWrite,
  Level,
  Program,
} from "@/redux/services/academics/academics-types";
import { Panel } from "@/components/custom/surface";
import { BulkLevelsDrawer } from "./bulk-levels-drawer";
import { EntityDrawer } from "../components/entity-drawer";
import { ExportButton } from "../components/export-button";
import { EmptyYear } from "@/pages/protected/academics/components/empty-year";
import { blankDraft, type EntityDraft } from "../components/entity-draft";
import { ScopeCell } from "../components/scope-cell";

/**
 * Programmes, and the levels inside them.
 *
 * An accordion rather than two screens, because a level means nothing without
 * its programme - "Year 1" is a different thing inside Nursery and inside
 * Primary, and the database says so: a level's name is unique within its
 * programme, not across the school. The API nests the levels in the programme
 * for the same reason, so drawing this page costs one request rather than one
 * per programme.
 *
 * This is the first screen where scope is INHERITED. A level inside a
 * branch-only programme cannot be school-wide - it would be visible where its
 * own parent is not - so its drawer states the branch and says why, rather than
 * offering a choice the server would refuse.
 */
export default function Programs() {
  const { lens, branch, multiBranch, readOnlyYear } = useAcademicsLens();
  const { hasPermission } = usePermissions();

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const [page, setPage] = useState(1);

  const [programDrawer, setProgramDrawer] = useState<Program | null | "new">(null);
  const [deptChoice, setDeptChoice] = useState<number | null>(null);
  const [lastDrawer, setLastDrawer] = useState<string | number>("shut");
  const [levelDrawer, setLevelDrawer] = useState<
    { program: Program; level: Level | null } | null
  >(null);
  const [confirm, setConfirm] = useState<Confirmation | null>(null);
  const [bulkFor, setBulkFor] = useState<Program | null>(null);

  const { data, isLoading, isError, refetch } = useGetProgramsQuery({
    ...lens,
    search,
    page,
  });
  const { data: deptData } = useGetDepartmentsQuery({ branch });

  const [createProgram, { isLoading: cp }] = useCreateProgramMutation();
  const [updateProgram, { isLoading: up }] = useUpdateProgramMutation();
  const [deleteProgram, { isLoading: dp }] = useDeleteProgramMutation();
  const [createLevel, { isLoading: cl }] = useCreateLevelMutation();
  const [updateLevel, { isLoading: ul }] = useUpdateLevelMutation();
  const [deleteLevel, { isLoading: dl }] = useDeleteLevelMutation();

  const programs = useMemo(() => data?.data ?? [], [data]);
  // Every programme empty, and not because of a search: the year itself has
  // not been started. One level anywhere is enough to disprove it.
  const noLevelsThisYear =
    !search && programs.length > 0 && programs.every((p) => !p.levels?.length);
  const pagination = data?.pagination;
  const departments = useMemo(() => deptData?.data ?? [], [deptData]);

  // An archived year is a record, and the server refuses every write into
  // one. Withdrawing the controls is the honest half of that: an Edit that
  // answers 409 is worse than no Edit at all.
  const canEdit = hasPermission(P.MODIFY_STRUCTURE) && !readOnlyYear;
  const canCreate = hasPermission(P.CREATE_STRUCTURE) && !readOnlyYear;
  const canManage = hasPermission(P.MANAGE_STRUCTURE) && !readOnlyYear;

  const allOpen = programs.length > 0 && programs.every((p) => open[p.id]);
  const toggleAll = () =>
    setOpen(
      allOpen
        ? {}
        : programs.reduce<Record<number, boolean>>((acc, p) => {
            acc[p.id] = true;
            return acc;
          }, {}),
    );

  const saveProgram = async (body: EntityWrite) => {
    const editing = programDrawer !== "new" ? programDrawer : null;
    const result = editing
      ? await updateProgram({ id: editing.id, ...body }).unwrap()
      : await createProgram(body).unwrap();
    toast.success(result.message);
  };

  const saveLevel = async (body: EntityWrite) => {
    if (!levelDrawer) return;
    const { program, level } = levelDrawer;
    const result = level
      ? await updateLevel({ id: level.id, ...body }).unwrap()
      : await createLevel({ program: program.id, ...body }).unwrap();
    toast.success(result.message);
  };

  const runConfirm = async () => {
    if (!confirm || confirm.kind === "blocked") return setConfirm(null);
    try {
      const result =
        confirm.kind === "deleteProgram"
          ? await deleteProgram(confirm.program.id).unwrap()
          : await deleteLevel(confirm.level.id).unwrap();
      toast.success(result.message);
      setConfirm(null);
    } catch (error) {
      const parsed = parseApiError(error);
      // A programme still holding levels, or a level still holding classes, is
      // refused by a foreign key the server explains with a count. That needs
      // its own modal, not a toast: the reader has to go and move those rows.
      if (parsed.code === "PROTECTED_REFERENCE") {
        setConfirm({
          kind: "blocked",
          title:
            confirm.kind === "deleteProgram"
              ? `Cannot delete ${confirm.program.name}`
              : `Cannot delete ${confirm.level.name}`,
          message: parsed.message,
        });
        return;
      }
      toast.error(parsed.message || "That could not be done.");
      setConfirm(null);
    }
  };

  if (isError) {
    return (
      <main className="px-5 pt-3 pb-8">
        <OutlinedNotice
          icon={ListTree}
          title="We could not load your programmes"
          body="Something went wrong on our side. Try again in a moment."
          actionLabel="Try again"
          onAction={() => refetch()}
        />
      </main>
    );
  }

  const editingProgram = programDrawer !== "new" ? programDrawer : null;
  const drawerKey = programDrawer === null ? "shut" : (editingProgram?.id ?? "new");

  return (
    <main className="grid min-w-0 grid-cols-1 content-start gap-5 px-5 pt-3 pb-8">
      {/* Adjusted during render, not in an effect - the select must already
          hold the programme's department on the first paint. */}
      {(() => {
        const want = editingProgram?.department ?? null;
        if (programDrawer !== null && lastDrawer !== drawerKey) {
          setLastDrawer(drawerKey);
          setDeptChoice(want);
        }
        return null;
      })()}

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-0 flex-1 basis-52">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-05" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search programmes and levels"
            aria-label="Search programmes"
            className="h-9 w-full rounded-full border border-white-02 bg-white pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>

        <Button
          size="sm"
          variant="outline"
          className="h-9 shrink-0 rounded-full border-primary text-primary"
          onClick={toggleAll}
          disabled={!programs.length}
        >
          <Rows3 className="size-3.5" />
          {allOpen ? "Collapse all" : "Expand all"}
        </Button>

        <ExportButton
          screen="academics.programs"
          params={{ search, branch: branch === "all" ? undefined : branch }}
        />

        <PermissionGate permission={P.CREATE_STRUCTURE} disabled={readOnlyYear}>
          <Button className="shrink-0 text-sm" onClick={() => setProgramDrawer("new")}>
            <Plus /> Add programme
          </Button>
        </PermissionGate>
      </div>

      {isLoading ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-md" />
          ))}
        </div>
      ) : !programs.length ? (
        <OutlinedNotice
          icon={ListTree}
          title={search ? "No programmes match that" : "No programmes yet"}
          body={
            search
              ? "Try a different search - this looks at level names too."
              : "Programmes group the levels pupils move through: Nursery, Primary, Junior Secondary. Add the first one."
          }
          actionLabel={search ? "Clear search" : undefined}
          onAction={search ? () => setSearch("") : undefined}
        />
      ) : noLevelsThisYear ? (
        // Programmes are not per-year - Junior Secondary is Junior Secondary -
        // but the LEVELS inside them are. A school that has just drafted next
        // year sees every programme with nothing in it, which reads as loss
        // rather than as a year that has not been started.
        <EmptyYear
          icon={ListTree}
          thing="levels"
          body="Levels are the rungs pupils move through inside a programme. Open a programme and add its first level."
          filtered={false}
          filteredBody=""
          onClearFilters={() => setSearch("")}
        />
      ) : (
        <div className="grid gap-3">
          {programs.map((program) => (
            <ProgramRow
              key={program.id}
              program={program}
              open={!!open[program.id]}
              multiBranch={multiBranch}
              canEdit={canEdit}
              canCreate={canCreate}
              canManage={canManage}
              onToggle={() =>
                setOpen((o) => ({ ...o, [program.id]: !o[program.id] }))
              }
              onEdit={() => setProgramDrawer(program)}
              onDelete={() => setConfirm({ kind: "deleteProgram", program })}
              onAddLevel={() => setLevelDrawer({ program, level: null })}
              onBulkLevels={() => setBulkFor(program)}
              onEditLevel={(level) => setLevelDrawer({ program, level })}
              onDeleteLevel={(level) =>
                setConfirm({ kind: "deleteLevel", program, level })
              }
            />
          ))}
        </div>
      )}

      {(pagination?.totalPages ?? 1) > 1 && (
        <div className="flex items-center justify-between text-xs text-gray-05">
          <span>
            Page {pagination?.currentPage} of {pagination?.totalPages}
          </span>
          <div className="inline-flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={!pagination?.previous}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!pagination?.next}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* ── The programme drawer ─────────────────────────────────────────── */}
      <EntityDrawer
        open={programDrawer !== null}
        editing={!!editingProgram}
        saving={cp || up}
        extraBody={{ department: deptChoice }}
        initial={
          editingProgram
            ? {
                name: editingProgram.name,
                code: editingProgram.code,
                description: editingProgram.description ?? "",
                branch: editingProgram.branch ?? null,
              }
            : blankDraft(branch === "all" ? null : branch)
        }
        copy={{
          title: editingProgram ? `Edit ${editingProgram.name}` : "Add programme",
          subtitle: "Programmes group the levels pupils move through.",
          nameLabel: "Programme name",
          namePlaceholder: "e.g. Junior Secondary",
          codePlaceholder: "e.g. JSS",
          scopeHint: "Most schools run one set of programmes across every branch.",
        }}
        onClose={() => setProgramDrawer(null)}
        onSave={saveProgram}
      >
        {() => (
          <DepartmentPicker
            departments={departments}
            value={deptChoice}
            onChange={setDeptChoice}
          />
        )}
      </EntityDrawer>

      {/* ── The level drawer ─────────────────────────────────────────────── */}
      <EntityDrawer
        open={levelDrawer !== null}
        editing={!!levelDrawer?.level}
        saving={cl || ul}
        initial={levelInitial(levelDrawer)}
        // The parent decides. A level inside a branch-only programme cannot be
        // school-wide, so the branch is stated rather than offered.
        lockedTo={
          levelDrawer?.program.branch != null
            ? {
                id: levelDrawer.program.branch,
                name: levelDrawer.program.branch_name ?? "This branch",
                reason: `${levelDrawer.program.name} belongs to this branch, so its levels cannot be school-wide.`,
              }
            : null
        }
        copy={{
          title: levelDrawer?.level
            ? `Edit ${levelDrawer.level.name}`
            : `Add level to ${levelDrawer?.program.name ?? ""}`,
          subtitle: "Levels sit inside a programme, in the order pupils move through them.",
          nameLabel: "Level name",
          namePlaceholder: "e.g. JSS1",
          codePlaceholder: "e.g. JSS1",
          scopeHint: "A level usually belongs wherever its programme does.",
        }}
        onClose={() => setLevelDrawer(null)}
        onSave={saveLevel}
      />

      <BulkLevelsDrawer
        open={bulkFor !== null}
        program={bulkFor}
        onClose={() => setBulkFor(null)}
      />

      <PromptModal
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={runConfirm}
        loading={dp || dl}
        canCancel={confirm?.kind !== "blocked"}
        title={confirmTitle(confirm)}
        description={confirmBody(confirm)}
        onConfirmText={confirm?.kind === "blocked" ? "Got it" : "Delete"}
        containerClass="min-h-[320px] lg:w-[420px]"
        srcClass="size-25"
        src="/image/caution.png"
        onConfirmClass={
          confirm && confirm.kind !== "blocked"
            ? "bg-error-01 text-white shadow-xs hover:bg-error-01/90 focus-visible:ring-error-01/20"
            : undefined
        }
      />
    </main>
  );
}

function levelInitial(
  d: { program: Program; level: Level | null } | null,
): EntityDraft {
  if (!d) return blankDraft(null);
  if (d.level) {
    return {
      name: d.level.name,
      code: d.level.code,
      description: d.level.description ?? "",
      branch: d.level.branch ?? null,
    };
  }
  // A new level starts wherever its programme is, so the common case needs no
  // decision at all.
  return blankDraft(d.program.branch ?? null);
}

// ── The department picker, the programme drawer's one extra control ─────────

function DepartmentPicker({
  departments,
  value,
  onChange,
}: {
  departments: { id: number; name: string }[];
  value: number | null;
  /** Lifted, so the choice travels in the drawer's single save request. */
  onChange: (next: number | null) => void;
}) {
  return (
    <div className="mt-4">
      <label className="mb-1.5 block text-[13px] font-medium text-gray-06">
        Department
      </label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        aria-label="Department"
        className="w-full rounded-lg border border-white-02 px-3 py-2.5 text-sm outline-none focus:border-primary"
      >
        <option value="">No department</option>
        {departments.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>
      <p className="mt-1 text-xs text-gray-05">
        Optional. A programme with no department still works everywhere.
      </p>
    </div>
  );
}

// ── Confirmations ──────────────────────────────────────────────────────────

type Confirmation =
  | { kind: "deleteProgram"; program: Program }
  | { kind: "deleteLevel"; program: Program; level: Level }
  | { kind: "blocked"; title: string; message: string };

function confirmTitle(c: Confirmation | null) {
  if (!c) return "";
  if (c.kind === "blocked") return c.title;
  if (c.kind === "deleteProgram") return `Delete ${c.program.name}?`;
  return `Delete ${c.level.name}?`;
}

function confirmBody(c: Confirmation | null) {
  if (!c) return "";
  if (c.kind === "blocked") return c.message;
  if (c.kind === "deleteProgram") {
    return c.program.branch == null
      ? `${c.program.name} applies to the whole school and will be removed everywhere. This cannot be undone.`
      : `${c.program.name} at ${c.program.branch_name} will be removed. This cannot be undone.`;
  }
  // Offerings cascade with the level, so the confirmation says so. A cascade
  // the reader was not told about is indistinguishable from data loss.
  const offered =
    c.level.subject_count > 0
      ? ` ${c.level.subject_count === 1 ? "One subject is" : `${c.level.subject_count} subjects are`} offered at it and will stop being offered here - the ${c.level.subject_count === 1 ? "subject itself stays" : "subjects themselves stay"}.`
      : "";
  return `${c.level.name} will be removed from ${c.program.name}.${offered} This cannot be undone.`;
}

// ── One programme, with its levels ─────────────────────────────────────────

function ProgramRow({
  program,
  open,
  multiBranch,
  canEdit,
  canCreate,
  canManage,
  onToggle,
  onEdit,
  onDelete,
  onAddLevel,
  onBulkLevels,
  onEditLevel,
  onDeleteLevel,
}: {
  program: Program;
  open: boolean;
  multiBranch: boolean;
  canEdit: boolean;
  canCreate: boolean;
  canManage: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddLevel: () => void;
  onBulkLevels: () => void;
  onEditLevel: (level: Level) => void;
  onDeleteLevel: (level: Level) => void;
}) {
  const levels = program.levels ?? [];
  return (
    <Panel as="section" className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-label={`${open ? "Collapse" : "Expand"} ${program.name}`}
          className="grid size-6 shrink-0 place-content-center rounded text-gray-06 hover:bg-gray-04"
        >
          {open ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </button>

        <div className="min-w-0 flex-1 basis-40">
          <p className="truncate font-medium text-black-01">{program.name}</p>
          <p className="truncate text-xs text-gray-05">
            {program.code} ·{" "}
            {levels.length === 1 ? "1 level" : `${levels.length} levels`} ·{" "}
            {program.department_name ?? "No department"}
          </p>
        </div>

        {multiBranch && (
          <div className="shrink-0 text-xs text-gray-05">
            <ScopeCell label={program.scope_label} shared={program.branch == null} />
          </div>
        )}

        <div className="inline-flex shrink-0 items-center gap-1.5">
          {canCreate && (
            <Button
              size="sm"
              variant="outline"
              className="border-primary text-primary"
              onClick={onAddLevel}
            >
              <Plus className="size-3.5" />
              Add level
            </Button>
          )}
          {(canEdit || canManage || canCreate) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={`Actions for ${program.name}`}
                  className="grid size-6 place-content-center rounded-full text-gray-06 hover:bg-gray-04"
                >
                  <span className="text-lg leading-none">⋯</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {canEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="size-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {canCreate && (
                  <DropdownMenuItem onClick={onBulkLevels}>
                    <Rows3 className="size-4" />
                    Add levels in bulk
                  </DropdownMenuItem>
                )}
                {canManage && (
                  <DropdownMenuItem variant="destructive" onClick={onDelete}>
                    <Trash2 className="size-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {open && (
        <div className="border-t border-white-02 bg-white-05">
          {levels.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-05">
              No levels in this programme yet.
            </p>
          ) : (
            levels.map((level, i) => (
              <div
                key={level.id}
                className={cn(
                  "flex flex-wrap items-center gap-3 px-4 py-2.5 pl-11",
                  i > 0 && "border-t border-white-02",
                )}
              >
                <div className="min-w-0 flex-1 basis-40">
                  <p className="truncate text-sm text-black-01">{level.name}</p>
                  <p className="truncate text-xs text-gray-05">
                    {level.code} ·{" "}
                    {level.class_count === 0
                      ? "No classes"
                      : level.class_count === 1
                        ? "1 class"
                        : `${level.class_count} classes`}
                  </p>
                </div>

                {multiBranch && (
                  <div className="shrink-0 text-xs text-gray-05">
                    <ScopeCell
                      label={level.scope_label}
                      shared={level.branch == null}
                    />
                  </div>
                )}

                <div className="inline-flex shrink-0 items-center gap-1">
                  {canEdit && (
                    <button
                      type="button"
                      aria-label={`Edit ${level.name}`}
                      onClick={() => onEditLevel(level)}
                      className="grid size-7 place-content-center rounded-md text-gray-06 hover:bg-gray-04"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                  )}
                  {canManage && (
                    <button
                      type="button"
                      aria-label={`Delete ${level.name}`}
                      onClick={() => onDeleteLevel(level)}
                      className="grid size-7 place-content-center rounded-md text-gray-06 hover:bg-gray-04 hover:text-error-01"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </Panel>
  );
}
