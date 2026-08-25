import { useMemo, useState } from "react";
import {
  Archive,
  Layers,
  LayoutGrid,
  Pencil,
  Pin,
  Plus,
  RotateCcw,
  Rows3,
  Search,
  Trash2,
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
import { CardActions, ClickableCard } from "@/components/custom/clickable-card";
import { P } from "@/permissions";
import { usePermissions } from "@/hooks/use-permissions";
import { useBranchLens } from "@/hooks/use-branch-lens";
import { parseApiError } from "@/utils/api-error";
import {
  useCreateDepartmentMutation,
  useDeleteDepartmentMutation,
  useGetDepartmentsQuery,
  useUpdateDepartmentMutation,
} from "@/redux/services/academics/academics-api";
import type { Department } from "@/redux/services/academics/academics-types";
import { SegmentedToggle } from "@/components/custom/segmented-toggle";
import { EntityDrawer } from "../components/entity-drawer";
import { ExportButton } from "../components/export-button";
import { blankDraft, type EntityDraft } from "../components/entity-draft";
import { ScopeCell } from "../components/scope-cell";

/**
 * Faculty groupings that programmes and subjects hang off.
 *
 * The smallest of the four catalogue screens, and the first to use the shared
 * entity drawer - which is why it is built before Programmes, Classes and
 * Subjects rather than after them.
 *
 * Three refusals are the school's to resolve rather than ours to hide, so each
 * gets a modal that says what to do next: a department with programmes mapped
 * to it cannot be deleted, narrowing a school-wide department to one branch
 * takes it away from the others, and deleting one is final.
 */
export default function Departments() {
  const { branch, applies: multiBranch } = useBranchLens();
  const { hasPermission } = usePermissions();

  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState<"true" | "false" | "all">("true");
  const [view, setView] = useState<"cards" | "table">("cards");
  const [page, setPage] = useState(1);

  const [editing, setEditing] = useState<Department | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirm, setConfirm] = useState<Confirmation | null>(null);

  const { data, isLoading, isError, refetch } = useGetDepartmentsQuery({
    branch,
    search,
    is_active: showArchived,
    page,
  });

  const [create, { isLoading: creating }] = useCreateDepartmentMutation();
  const [update, { isLoading: updating }] = useUpdateDepartmentMutation();
  const [remove, { isLoading: removing }] = useDeleteDepartmentMutation();

  const departments = useMemo(() => data?.data ?? [], [data]);
  const pagination = data?.pagination;

  const canEdit = hasPermission(P.MODIFY_STRUCTURE);
  const canManage = hasPermission(P.MANAGE_STRUCTURE);
  const filtered = !!search || showArchived !== "true";

  const openNew = () => {
    setEditing(null);
    setDrawerOpen(true);
  };
  const openEdit = (dept: Department) => {
    setEditing(dept);
    setDrawerOpen(true);
  };

  const draft: EntityDraft = editing
    ? {
        name: editing.name,
        code: editing.code,
        description: editing.description ?? "",
        branch: editing.branch ?? null,
      }
    : blankDraft(branch === "all" ? null : branch);

  /**
   * Narrowing a school-wide department to one branch is guarded, not silent.
   *
   * It takes the department away from every other branch, and anything already
   * mapped to it there stays but can never be used again. That is not a saving
   * detail, so the save is held and the consequence is named first.
   */
  const saveDraft = async (body: Parameters<typeof create>[0]) => {
    const narrowing =
      !!editing && editing.branch == null && body.branch != null && multiBranch;
    if (narrowing) {
      return new Promise<void>((resolve, reject) => {
        setConfirm({
          kind: "narrow",
          department: editing,
          payload: body,
          resolve,
          reject,
        });
      });
    }
    const result = editing
      ? await update({ id: editing.id, ...body }).unwrap()
      : await create(body).unwrap();
    toast.success(result.message);
  };

  const runConfirm = async () => {
    if (!confirm) return;
    try {
      if (confirm.kind === "narrow") {
        const result = await update({
          id: confirm.department.id,
          ...confirm.payload,
        }).unwrap();
        toast.success(result.message);
        confirm.resolve();
      } else if (confirm.kind === "delete") {
        const result = await remove(confirm.department.id).unwrap();
        toast.success(result.message);
      } else {
        const result = await update({
          id: confirm.department.id,
          is_active: confirm.kind === "restore",
        }).unwrap();
        toast.success(result.message);
      }
      setConfirm(null);
    } catch (error) {
      const parsed = parseApiError(error);
      // A department with programmes mapped to it cannot be deleted, and the
      // server says which and how many. That is a different modal, not a toast:
      // the reader has to go and move those programmes.
      if (parsed.code === "PROTECTED_REFERENCE" && confirm.kind === "delete") {
        setConfirm({ kind: "blocked", department: confirm.department, message: parsed.message });
        return;
      }
      toast.error(parsed.message || "That could not be done.");
      if (confirm.kind === "narrow") confirm.reject(error);
      setConfirm(null);
    }
  };

  if (isError) {
    return (
      <main className="px-5 pt-3 pb-8">
        <OutlinedNotice
          icon={Layers}
          title="We could not load your departments"
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
            placeholder="Search departments"
            aria-label="Search departments"
            className="h-9 w-full rounded-full border border-white-02 bg-white pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>

        <select
          value={showArchived}
          onChange={(e) => {
            setShowArchived(e.target.value as "true" | "false" | "all");
            setPage(1);
          }}
          aria-label="Filter by status"
          className="h-9 shrink-0 rounded-full border border-white-02 bg-white px-3 text-sm outline-none focus:border-primary"
        >
          <option value="true">Active</option>
          <option value="false">Archived</option>
          <option value="all">All statuses</option>
        </select>

        <SegmentedToggle
          ariaLabel="Department view"
          value={view}
          onChange={setView}
          options={[
            { value: "cards", label: "Cards", icon: LayoutGrid },
            { value: "table", label: "Table", icon: Rows3 },
          ]}
        />

        <ExportButton
          screen="academics.departments"
          params={{
            search,
            is_active: showArchived,
            branch: branch === "all" ? undefined : branch,
          }}
        />

        <PermissionGate permission={P.CREATE_STRUCTURE}>
          <Button className="shrink-0 text-sm" onClick={openNew}>
            <Plus /> Add department
          </Button>
        </PermissionGate>
      </div>

      {isLoading ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-md" />
          ))}
        </div>
      ) : !departments.length ? (
        <OutlinedNotice
          icon={Layers}
          title={filtered ? "No departments match that" : "No departments yet"}
          body={
            filtered
              ? "Try a different search, or change the status filter."
              : "Departments group the programmes and subjects a school teaches. Add the first one."
          }
          actionLabel={filtered ? "Clear filters" : undefined}
          onAction={
            filtered
              ? () => {
                  setSearch("");
                  setShowArchived("true");
                  setPage(1);
                }
              : undefined
          }
        />
      ) : view === "cards" ? (
        <div className="grid items-start gap-5 md:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => (
            <DepartmentCard
              key={dept.id}
              dept={dept}
              multiBranch={multiBranch}
              canEdit={canEdit}
              canManage={canManage}
              onEdit={() => openEdit(dept)}
              onArchive={() => setConfirm({ kind: "archive", department: dept })}
              onRestore={() => setConfirm({ kind: "restore", department: dept })}
              onDelete={() => setConfirm({ kind: "delete", department: dept })}
            />
          ))}
        </div>
      ) : (
        <CustomTable
          tableHeaderList={[
            "Department",
            "Code",
            ...(multiBranch ? ["Scope"] : []),
            "Programmes",
            "Subjects",
            "Status",
          ]}
          tableBodyList={departments.map((d) => ({
            id: d.id,
            Department: d.name,
            Code: d.code,
            ...(multiBranch ? { Scope: d.scope_label ?? "School-wide" } : {}),
            Programmes: String(d.program_count),
            Subjects: String(d.subject_count),
            Status: d.is_active ? "Active" : "Archived",
          }))}
          onRowClick={(row: { id: number }) => {
            const dept = departments.find((d) => d.id === row.id);
            if (dept && canEdit) openEdit(dept);
          }}
          currentPage={pagination?.currentPage ?? 1}
          totalPage={pagination?.totalPages ?? 1}
          onPageChange={(next) => setPage(Number(next) || 1)}
          emptyText="No departments"
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
        initial={draft}
        copy={{
          title: editing ? `Edit ${editing.name}` : "Add department",
          subtitle: "Departments group the programmes and subjects a school teaches.",
          nameLabel: "Department name",
          namePlaceholder: "e.g. Sciences",
          codePlaceholder: "e.g. SCI",
          scopeHint: "Most schools run one set of departments across every branch.",
        }}
        onClose={() => setDrawerOpen(false)}
        onSave={saveDraft}
      />

      <PromptModal
        isOpen={!!confirm}
        onClose={() => {
          if (confirm?.kind === "narrow") confirm.reject(new Error("cancelled"));
          setConfirm(null);
        }}
        onConfirm={confirm?.kind === "blocked" ? () => setConfirm(null) : runConfirm}
        loading={updating || removing}
        canCancel={confirm?.kind !== "blocked"}
        title={confirmTitle(confirm)}
        description={confirmBody(confirm)}
        onConfirmText={confirmAction(confirm)}
        containerClass="min-h-[320px] lg:w-[420px]"
        srcClass="size-25"
        src="/image/caution.png"
        onConfirmClass={
          confirm?.kind === "delete" || confirm?.kind === "narrow"
            ? "bg-error-01 text-white shadow-xs hover:bg-error-01/90 focus-visible:ring-error-01/20"
            : undefined
        }
      />
    </main>
  );
}

// ── The confirmations ───────────────────────────────────────────────────────

type Confirmation =
  | { kind: "archive" | "restore" | "delete"; department: Department }
  | { kind: "blocked"; department: Department; message: string }
  | {
      kind: "narrow";
      department: Department;
      payload: { name?: string; code?: string; description?: string; branch?: number | null };
      resolve: () => void;
      reject: (reason?: unknown) => void;
    };

function confirmTitle(c: Confirmation | null) {
  if (!c) return "";
  switch (c.kind) {
    case "archive":
      return `Archive ${c.department.name}?`;
    case "restore":
      return `Restore ${c.department.name}?`;
    case "delete":
      return `Delete ${c.department.name}?`;
    case "blocked":
      return `Cannot delete ${c.department.name}`;
    case "narrow":
      return `Narrow ${c.department.name} to one branch?`;
  }
}

function confirmBody(c: Confirmation | null) {
  if (!c) return "";
  switch (c.kind) {
    case "archive":
      return "An archived department stops appearing when anyone picks one. Nothing already mapped to it is moved, and you can restore it at any time.";
    case "restore":
      return `${c.department.name} will appear again wherever a department can be picked.`;
    case "delete":
      return c.department.branch == null
        ? `${c.department.name} applies to the whole school and will be removed everywhere. This cannot be undone - archive it instead if you may want it back.`
        : `${c.department.name} at ${c.department.branch_name} will be removed. This cannot be undone.`;
    case "blocked":
      // The server's own sentence: it counts the programmes and says what to do.
      return c.message;
    case "narrow":
      return `Every other branch will stop seeing ${c.department.name}. Anything already mapped to it there stays, but nobody at those branches can use it again.`;
  }
}

function confirmAction(c: Confirmation | null) {
  if (!c) return "Confirm";
  switch (c.kind) {
    case "archive":
      return "Archive";
    case "restore":
      return "Restore";
    case "delete":
      return "Delete";
    case "blocked":
      return "Got it";
    case "narrow":
      return "Narrow scope";
  }
}

// ── The card ────────────────────────────────────────────────────────────────

function DepartmentCard({
  dept,
  multiBranch,
  canEdit,
  canManage,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}: {
  dept: Department;
  multiBranch: boolean;
  canEdit: boolean;
  canManage: boolean;
  onEdit: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  return (
    <ClickableCard
      label={`Open ${dept.name}`}
      // Edit is what a card press means here: the drawer IS the detail view.
      onOpen={canEdit ? onEdit : () => {}}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h5 className="truncate text-base font-medium text-black-01">{dept.name}</h5>
          <p className="text-xs text-gray-05">{dept.code}</p>
        </div>
        <div className="inline-flex shrink-0 items-center gap-1.5">
          <Badge
            variant={dept.is_active ? "active" : "inactive"}
            className="h-fit rounded-full py-0 text-[11px] uppercase"
          >
            {dept.is_active ? "Active" : "Archived"}
          </Badge>
          {(canEdit || canManage) && (
            <CardActions>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={`Actions for ${dept.name}`}
                  className="grid size-6 place-content-center rounded-full text-gray-06 hover:bg-gray-04"
                >
                  <span className="text-lg leading-none">⋯</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {canEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="size-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {canEdit && dept.is_active && (
                  <DropdownMenuItem onClick={onArchive}>
                    <Archive className="size-4" />
                    Archive
                  </DropdownMenuItem>
                )}
                {canEdit && !dept.is_active && (
                  <DropdownMenuItem onClick={onRestore}>
                    <RotateCcw className="size-4" />
                    Restore
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
            </CardActions>
          )}
        </div>
      </div>

      {multiBranch && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-05">
          <Pin className="size-3 shrink-0" />
          <ScopeCell label={dept.scope_label} shared={dept.branch == null} />
        </div>
      )}

      <hr className="my-3 border-white-02" />

      <div className="flex items-center justify-between px-1">
        <Stat label="Programmes" value={dept.program_count} />
        <Stat label="Subjects" value={dept.subject_count} />
      </div>
    </ClickableCard>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs text-gray-05">{label}</p>
      <p className="text-lg font-semibold text-black-01">{value}</p>
    </div>
  );
}

