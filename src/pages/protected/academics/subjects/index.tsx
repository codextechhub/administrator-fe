import { useMemo, useState } from "react";
import {
  Archive,
  RotateCcw,
  BookOpen,
  LayoutGrid,
  Pencil,
  Pin,
  Plus,
  Rows3,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import PromptModal from "@/components/modal/prompt-modal";
import CustomTable from "@/components/custom/custom-table";
import PermissionGate from "@/components/custom/permission-gate";
import { OutlinedNotice } from "@/pages/protected/onboarding/components/outlined-notice";
import { CardActions, ClickableCard } from "@/components/custom/surface";
import { P } from "@/permissions";
import { usePermissions } from "@/hooks/use-permissions";
import { useAcademicsLens } from "@/hooks/use-academics-lens";
import { cn } from "@/lib/utils";
import { parseApiError } from "@/utils/api-error";
import {
  useCreateSubjectMutation,
  useArchiveSubjectMutation,
  useRestoreSubjectMutation,
  useGetDepartmentsQuery,
  useGetProgramsQuery,
  useGetSubjectsQuery,
  useUpdateSubjectMutation,
} from "@/redux/services/academics/academics-api";
import type {
  Subject,
  SubjectWrite,
} from "@/redux/services/academics/academics-types";
import { SegmentedToggle } from "@/components/custom/segmented-toggle";
import { EntityDrawer } from "../components/entity-drawer";
import { ExportButton } from "../components/export-button";
import { blankDraft } from "../components/entity-draft";
import { ScopeCell } from "../components/scope-cell";
import { OfferedAt } from "./offered-at";

/**
 * What is taught, and the levels it is offered at.
 *
 * The offerings are the screen's point rather than a detail on it: a subject
 * that exists but is offered nowhere is a row that does nothing, and the count
 * a class reports as its subjects is derived from these. So the drawer sends
 * `level_ids` with everything else - one Save, one call - and the picker is
 * grouped by programme, because "taught right through Primary" should be one
 * tap rather than six.
 */
export default function Subjects() {
  const { lens, branch, multiBranch, readOnlyYear, sessionName } =
    useAcademicsLens();
  const { hasPermission } = usePermissions();

  const [search, setSearch] = useState("");
  const [type, setType] = useState<"all" | "true" | "false">("all");
  const [view, setView] = useState<"cards" | "table">("cards");
  const [page, setPage] = useState(1);

  const [editing, setEditing] = useState<Subject | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirm, setConfirm] = useState<Subject | null>(null);

  // The drawer's two extra fields, owned here so they travel in its one save.
  const [isCore, setIsCore] = useState(true);
  const [levelIds, setLevelIds] = useState<number[]>([]);
  const [deptId, setDeptId] = useState<number | null>(null);

  const { data, isLoading, isError, refetch } = useGetSubjectsQuery({
    ...lens,
    search,
    is_core: type === "all" ? undefined : type,
    page,
  });
  const { data: programData } = useGetProgramsQuery(lens);
  const { data: deptData } = useGetDepartmentsQuery({ branch });

  const [create, { isLoading: creating }] = useCreateSubjectMutation();
  const [update, { isLoading: updating }] = useUpdateSubjectMutation();
  const [archive, { isLoading: archiving }] = useArchiveSubjectMutation();
  const [restore, { isLoading: restoring }] = useRestoreSubjectMutation();

  const subjects = useMemo(() => data?.data ?? [], [data]);
  const pagination = data?.pagination;
  const programs = useMemo(() => programData?.data ?? [], [programData]);
  const departments = useMemo(() => deptData?.data ?? [], [deptData]);

  // The server refuses every write into an archived year, so an Edit here
  // would only answer 409.
  const canEdit = hasPermission(P.MODIFY_SUBJECT) && !readOnlyYear;
  const canManage = hasPermission(P.MANAGE_SUBJECTS) && !readOnlyYear;
  const filtered = !!search || type !== "all";

  // Seed the extras when the drawer is pointed somewhere new. Adjusted during
  // render, so the picker already shows the subject's levels on first paint.
  const drawerKey = drawerOpen ? String(editing?.id ?? "new") : "shut";
  const [lastKey, setLastKey] = useState(drawerKey);
  if (drawerKey !== lastKey) {
    setLastKey(drawerKey);
    if (drawerOpen) {
      setIsCore(editing?.is_core ?? true);
      setLevelIds((editing?.offerings ?? []).map((o) => o.level));
      setDeptId(editing?.department ?? null);
    }
  }

  const open = (subject: Subject | null) => {
    setEditing(subject);
    setDrawerOpen(true);
  };

  const save = async (body: SubjectWrite) => {
    const result = editing
      ? await update({ id: editing.id, ...body }).unwrap()
      : await create(body).unwrap();
    toast.success(result.message);
  };

  const runDelete = async () => {
    if (!confirm) return;
    try {
      const run = confirm.is_active ? archive : restore;
      const result = await run(confirm.id).unwrap();
      toast.success(result.message);
    } catch (error) {
      toast.error(parseApiError(error).message || "That could not be deleted.");
    }
    setConfirm(null);
  };

  if (isError) {
    return (
      <main className="px-5 pt-3 pb-8">
        <OutlinedNotice
          icon={BookOpen}
          title="We could not load your subjects"
          body="Something went wrong on our side. Try again in a moment."
          actionLabel="Try again"
          onAction={() => refetch()}
        />
      </main>
    );
  }

  return (
    <main className="grid min-w-0 grid-cols-1 content-start gap-5 px-5 pt-3 pb-8">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-0 flex-1 basis-52">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-05" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search subjects"
            aria-label="Search subjects"
            className="h-9 w-full rounded-full border border-white-02 bg-white pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>

        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value as "all" | "true" | "false");
            setPage(1);
          }}
          aria-label="Filter by type"
          className="h-9 shrink-0 rounded-full border border-white-02 bg-white px-3 text-sm outline-none focus:border-primary"
        >
          <option value="all">All subjects</option>
          <option value="true">Core only</option>
          <option value="false">Electives only</option>
        </select>

        <SegmentedToggle
          ariaLabel="Subject view"
          value={view}
          onChange={setView}
          options={[
            { value: "cards", label: "Cards", icon: LayoutGrid },
            { value: "table", label: "Table", icon: Rows3 },
          ]}
        />

        <ExportButton
          screen="academics.subjects"
          params={{
            search,
            is_core: type,
            branch: branch === "all" ? undefined : branch,
          }}
        />

        <PermissionGate permission={P.CREATE_SUBJECT} disabled={readOnlyYear}>
          <Button className="shrink-0 text-sm" onClick={() => open(null)}>
            <Plus /> Add subject
          </Button>
        </PermissionGate>
      </div>

      {isLoading ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-md" />
          ))}
        </div>
      ) : !subjects.length ? (
        <OutlinedNotice
          icon={BookOpen}
          title={filtered ? "No subjects match that" : "No subjects yet"}
          body={
            filtered
              ? "Try a different search, or change the type filter."
              : "Subjects are what the school teaches, and each one names the levels it is taught at. Add the first."
          }
          actionLabel={filtered ? "Clear filters" : undefined}
          onAction={
            filtered
              ? () => {
                  setSearch("");
                  setType("all");
                  setPage(1);
                }
              : undefined
          }
        />
      ) : view === "cards" ? (
        <div className="grid items-start gap-5 md:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              sessionName={sessionName}
              multiBranch={multiBranch}
              canEdit={canEdit}
              canManage={canManage}
              onEdit={() => open(subject)}
              onDelete={() => setConfirm(subject)}
            />
          ))}
        </div>
      ) : (
        <CustomTable
          tableHeaderList={[
            "Subject",
            "Code",
            "Department",
            "Type",
            "Offered at",
            ...(multiBranch ? ["Scope"] : []),
          ]}
          defaultBodyList={subjects}
          tableBodyList={subjects.map((s) => ({
            Subject: s.name,
            Code: s.code,
            Department: s.department_name ?? "-",
            Type: s.is_core ? "Core" : "Elective",
            "Offered at": s.offered_label,
            ...(multiBranch ? { Scope: s.scope_label ?? "School-wide" } : {}),
          }))}
          onRowClick={(subject: Subject) => {
            if (subject && canEdit) open(subject);
          }}
          currentPage={pagination?.currentPage ?? 1}
          totalPage={pagination?.totalPages ?? 1}
          onPageChange={(next) => setPage(Number(next) || 1)}
          emptyText="No subjects"
        />
      )}

      {view === "cards" && (pagination?.totalPages ?? 1) > 1 && (
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

      <EntityDrawer
        open={drawerOpen}
        editing={!!editing}
        saving={creating || updating}
        initial={
          editing
            ? {
                name: editing.name,
                code: editing.code,
                description: editing.description ?? "",
                branch: editing.branch ?? null,
              }
            : blankDraft(branch === "all" ? null : branch)
        }
        extraBody={{
          is_core: isCore,
          level_ids: levelIds,
          department: deptId,
        }}
        copy={{
          title: editing ? `Edit ${editing.name}` : "Add subject",
          subtitle:
            "A subject stays on file year to year. Where it is taught is what changes.",
          nameLabel: "Subject name",
          namePlaceholder: "e.g. Mathematics",
          codePlaceholder: "e.g. MTH",
          scopeHint:
            "A subject offered school-wide is available at every branch that has these levels.",
        }}
        onClose={() => setDrawerOpen(false)}
        onSave={save}
      >
        {() => (
          <>
            <div className="mt-4">
              <label className="mb-1.5 block text-[13px] font-medium text-gray-06">
                Department
              </label>
              <select
                value={deptId ?? ""}
                onChange={(e) =>
                  setDeptId(e.target.value ? Number(e.target.value) : null)
                }
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
            </div>

            <label className="mt-4 flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={isCore}
                onChange={(e) => setIsCore(e.target.checked)}
                className="mt-0.5 size-4 shrink-0 accent-[var(--color-primary,#4A659D)]"
              />
              <span className="min-w-0">
                <span className="block text-[13px] font-medium text-gray-06">
                  Core subject
                </span>
                <span className="block text-xs text-gray-05 text-pretty">
                  Core subjects are taken by every pupil at the levels they are
                  offered. Electives are chosen.
                </span>
              </span>
            </label>

            <OfferedAt
              programs={programs}
              selected={levelIds}
              onChange={setLevelIds}
            />
          </>
        )}
      </EntityDrawer>

      <PromptModal
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={runDelete}
        loading={archiving || restoring}
        canCancel
        title={
          confirm?.is_active
            ? `Archive ${confirm?.name}?`
            : `Restore ${confirm?.name}?`
        }
        description={archiveBody(confirm)}
        onConfirmText={confirm?.is_active ? "Archive" : "Restore"}
        containerClass="min-h-[320px] lg:w-[420px]"
        srcClass="size-25"
        src="/image/caution.png"
      />
    </main>
  );
}

/**
 * What archiving a subject does, which is less than deleting used to.
 *
 * A delete cascaded its offerings away, so the record of where it had been
 * taught went with it. Archiving keeps them: the subject stops being offered
 * when anyone picks one, and comes back unchanged on request. Said plainly,
 * because a reader who met "delete" on this screen before will expect the old
 * consequences.
 */
function archiveBody(subject: Subject | null) {
  if (!subject) return "";
  if (!subject.is_active) {
    return `${subject.name} will appear again wherever a subject can be picked, still offered at the levels it was.`;
  }
  const levels =
    subject.level_count > 0
      ? ` The ${subject.level_count === 1 ? "level it is taught at stays" : `${subject.level_count} levels it is taught at stay`} exactly as ${subject.level_count === 1 ? "it is" : "they are"}.`
      : "";
  return `${subject.name} stops appearing when anyone picks a subject.${levels} You can restore it at any time.`;
}

// ── The card ────────────────────────────────────────────────────────────────

function SubjectCard({
  subject,
  sessionName,
  multiBranch,
  canEdit,
  canManage,
  onEdit,
  onDelete,
}: {
  subject: Subject;
  sessionName: string | null;
  multiBranch: boolean;
  canEdit: boolean;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <ClickableCard
      label={`Open ${subject.name}`}
      onOpen={canEdit ? onEdit : () => {}}
      // The left edge marks core against elective, so it overrides the shared
      // hairline on that one side only.
      className={cn(
        "border-l-4",
        subject.is_core ? "border-l-primary" : "border-l-border",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h5 className="truncate text-base font-medium text-black-01">
            {subject.name}
          </h5>
          <p className="truncate text-xs text-gray-05">
            {subject.code} · {subject.department_name ?? "No department"}
          </p>
        </div>
        <div className="inline-flex shrink-0 items-center gap-1.5">
          <Badge
            variant={subject.is_core ? "blue" : "inactive"}
            className="h-fit rounded-full py-0 text-[11px] uppercase"
          >
            {subject.is_core ? "Core" : "Elective"}
          </Badge>
          {(canEdit || canManage) && (
            <CardActions>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={`Actions for ${subject.name}`}
                  className="grid size-6 place-content-center rounded-full text-gray-06 hover:bg-gray-04"
                >
                  <span className="text-lg leading-none">⋯</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {canEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="size-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {canManage && (
                  <DropdownMenuItem onClick={onDelete}>
                    {subject.is_active ? (
                      <>
                        <Archive className="size-4" />
                        Archive
                      </>
                    ) : (
                      <>
                        <RotateCcw className="size-4" />
                        Restore
                      </>
                    )}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            </CardActions>
          )}
        </div>
      </div>

      {multiBranch && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-05">
          <Pin className="size-3 shrink-0" />
          <ScopeCell label={subject.scope_label} shared={subject.branch == null} />
        </div>
      )}

      <hr className="my-3 border-white-02" />

      {/* The one part of a subject that belongs to a year: a subject is on
          file whatever the pill says, and where it is taught changes. */}
      <div>
        <p className="text-xs text-gray-05">
          Offered at{sessionName ? ` in ${sessionName}` : ""}
        </p>
        <p className="mt-0.5 truncate text-sm font-medium text-black-01">
          {subject.level_count > 0 ? subject.offered_label : "Not taught"}
        </p>
        <p className="mt-0.5 text-xs text-gray-05">
          {subject.level_count === 1
            ? "1 level"
            : `${subject.level_count} levels`}
        </p>
      </div>
    </ClickableCard>
  );
}

