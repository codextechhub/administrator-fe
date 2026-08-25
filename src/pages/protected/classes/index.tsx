import { useMemo, useState } from "react";
import {
  Archive,
  Edit,
  GraduationCap,
  LayoutGrid,
  MapPin,
  Plus,
  RotateCcw,
  Rows3,
  Search,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PromptModal from "@/components/modal/prompt-modal";
import CustomTable from "@/components/custom/custom-table";
import PermissionGate from "@/components/custom/permission-gate";
import { OutlinedNotice } from "@/pages/protected/onboarding/components/outlined-notice";
import { ScopeCell } from "@/pages/protected/academics/components/scope-cell";
import { P } from "@/permissions";
import { usePermissions } from "@/hooks/use-permissions";
import { useBranchLens } from "@/hooks/use-branch-lens";
import { cn } from "@/lib/utils";
import { parseApiError } from "@/utils/api-error";
import {
  useArchiveClassMutation,
  useCreateClassMutation,
  useGetClassesQuery,
  useGetProgramsQuery,
  useRestoreClassMutation,
  useUpdateClassMutation,
} from "@/redux/services/academics/academics-api";
import type {
  ClassWrite,
  Level,
  SchoolClass,
} from "@/redux/services/academics/academics-types";
import { ExportButton } from "@/pages/protected/academics/components/export-button";
import { ClassDrawer } from "./class-drawer";
import { GenerateArmsDrawer } from "./generate-arms-drawer";

/**
 * The classes pupils sit in, with their arms.
 *
 * The card is the one this screen already had - name, a coloured tile keyed off
 * the programme band, three stats, and the buttons - with the real API behind
 * it. The three stats changed, and only because two of them had nothing behind
 * them: they read Students / Subject / Avg Score, and there is no student model
 * in the product and no assessment module at all. Subjects is real (it is the
 * offerings at this class's level), so it stays, and Level and Arm take the
 * other two slots - the facts a class card is actually for.
 *
 * There is no Delete, and its absence is a promise rather than an omission:
 * M11's enrolment points at SchoolClass with on_delete=PROTECT, which is safe
 * precisely because no route can reach that refusal. Archive is the lifecycle.
 */
export default function Classes() {
  const { branch, applies: multiBranch } = useBranchLens();
  const { hasPermission } = usePermissions();

  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<number | "all">("all");
  const [status, setStatus] = useState<"true" | "false" | "all">("true");
  const [view, setView] = useState<"cards" | "table">("cards");
  const [page, setPage] = useState(1);

  const [editing, setEditing] = useState<SchoolClass | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [armsOpen, setArmsOpen] = useState(false);
  const [confirm, setConfirm] = useState<Confirmation | null>(null);

  const { data, isLoading, isError, refetch } = useGetClassesQuery({
    branch,
    search,
    is_active: status,
    level: levelFilter === "all" ? undefined : levelFilter,
    page,
  });
  // Levels come from the programmes call, which already nests them - one
  // request rather than a second flat list of the same rows.
  const { data: programData } = useGetProgramsQuery({ branch });

  const [create, { isLoading: creating }] = useCreateClassMutation();
  const [update, { isLoading: updating }] = useUpdateClassMutation();
  const [archive, { isLoading: archiving }] = useArchiveClassMutation();
  const [restore, { isLoading: restoring }] = useRestoreClassMutation();

  const classes = useMemo(() => data?.data ?? [], [data]);
  const pagination = data?.pagination;
  const levels = useMemo<Level[]>(
    () => (programData?.data ?? []).flatMap((p) => p.levels ?? []),
    [programData],
  );

  const canEdit = hasPermission(P.MODIFY_CLASS);
  const canManage = hasPermission(P.MANAGE_CLASSES);
  const filtered = !!search || status !== "true" || levelFilter !== "all";

  const saveClass = async (body: ClassWrite) => {
    const result = editing
      ? await update({ id: editing.id, ...body }).unwrap()
      : await create(body).unwrap();
    toast.success(result.message);
  };

  const runConfirm = async () => {
    if (!confirm) return;
    try {
      const result =
        confirm.kind === "archive"
          ? await archive(confirm.klass.id).unwrap()
          : await restore(confirm.klass.id).unwrap();
      toast.success(result.message);
    } catch (error) {
      toast.error(parseApiError(error).message || "That could not be done.");
    }
    setConfirm(null);
  };

  if (isError) {
    return (
      <main className="px-5 pt-3 pb-8">
        <OutlinedNotice
          icon={GraduationCap}
          title="We could not load your classes"
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
            placeholder="Search classes"
            aria-label="Search classes"
            className="h-9 w-full rounded-full border border-white-02 bg-white pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>

        <select
          value={levelFilter}
          onChange={(e) => {
            setLevelFilter(e.target.value === "all" ? "all" : Number(e.target.value));
            setPage(1);
          }}
          aria-label="Filter by level"
          className="h-9 shrink-0 rounded-full border border-white-02 bg-white px-3 text-sm outline-none focus:border-primary"
        >
          <option value="all">All levels</option>
          {levels.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as "true" | "false" | "all");
            setPage(1);
          }}
          aria-label="Filter by status"
          className="h-9 shrink-0 rounded-full border border-white-02 bg-white px-3 text-sm outline-none focus:border-primary"
        >
          <option value="true">Active</option>
          <option value="false">Archived</option>
          <option value="all">All statuses</option>
        </select>

        <div className="inline-flex shrink-0 rounded-full border border-white-02 bg-white p-0.5">
          <ViewButton
            active={view === "cards"}
            onClick={() => setView("cards")}
            icon={LayoutGrid}
            label="Cards"
          />
          <ViewButton
            active={view === "table"}
            onClick={() => setView("table")}
            icon={Rows3}
            label="Table"
          />
        </div>

        <ExportButton
          screen="academics.classes"
          params={{
            search,
            is_active: status,
            level: levelFilter === "all" ? undefined : levelFilter,
            branch: branch === "all" ? undefined : branch,
          }}
        />

        <PermissionGate permission={P.CREATE_CLASS}>
          <Button
            variant="outline"
            className="shrink-0 border-primary text-sm text-primary"
            onClick={() => setArmsOpen(true)}
          >
            <Wand2 className="size-4" />
            Generate arms
          </Button>
          <Button
            className="shrink-0 text-sm"
            onClick={() => {
              setEditing(null);
              setDrawerOpen(true);
            }}
          >
            <Plus /> Add class
          </Button>
        </PermissionGate>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-52 w-full rounded-md" />
          ))}
        </div>
      ) : !classes.length ? (
        <OutlinedNotice
          icon={GraduationCap}
          title={filtered ? "No classes match that" : "No classes yet"}
          body={
            filtered
              ? "Try a different search, or change the level and status filters."
              : "A class is a level plus an arm. Generate a set of arms for a level, or add one class at a time."
          }
          actionLabel={filtered ? "Clear filters" : undefined}
          onAction={
            filtered
              ? () => {
                  setSearch("");
                  setStatus("true");
                  setLevelFilter("all");
                  setPage(1);
                }
              : undefined
          }
        />
      ) : view === "cards" ? (
        <div className="grid items-start gap-6 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((klass) => (
            <ClassCard
              key={klass.id}
              klass={klass}
              multiBranch={multiBranch}
              canEdit={canEdit}
              canManage={canManage}
              onEdit={() => {
                setEditing(klass);
                setDrawerOpen(true);
              }}
              onArchive={() => setConfirm({ kind: "archive", klass })}
              onRestore={() => setConfirm({ kind: "restore", klass })}
            />
          ))}
        </div>
      ) : (
        <CustomTable
          tableHeaderList={[
            "Class",
            "Code",
            "Level",
            "Arm",
            ...(multiBranch ? ["Scope"] : []),
            "Subjects",
            "Status",
          ]}
          tableBodyList={classes.map((c) => ({
            id: c.id,
            Class: c.name,
            Code: c.code,
            Level: c.level_name,
            Arm: c.arm || "-",
            ...(multiBranch ? { Scope: c.scope_label ?? "School-wide" } : {}),
            Subjects: String(c.subject_count),
            Status: c.is_active ? "Active" : "Archived",
          }))}
          onRowClick={(row: { id: number }) => {
            const klass = classes.find((c) => c.id === row.id);
            if (klass && canEdit) {
              setEditing(klass);
              setDrawerOpen(true);
            }
          }}
          currentPage={pagination?.currentPage ?? 1}
          totalPage={pagination?.totalPages ?? 1}
          onPageChange={(next) => setPage(Number(next) || 1)}
          emptyText="No classes"
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

      <ClassDrawer
        open={drawerOpen}
        editing={editing}
        levels={levels}
        saving={creating || updating}
        onClose={() => setDrawerOpen(false)}
        onSave={saveClass}
      />

      <GenerateArmsDrawer
        open={armsOpen}
        levels={levels}
        classes={classes}
        onClose={() => setArmsOpen(false)}
      />

      <PromptModal
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={runConfirm}
        loading={archiving || restoring}
        canCancel
        title={
          confirm?.kind === "archive"
            ? `Archive ${confirm.klass.name}?`
            : `Restore ${confirm?.klass.name}?`
        }
        description={
          confirm?.kind === "archive"
            ? "An archived class stops appearing when anyone picks a class, but its history stays intact. Pupils already in it are not moved for you."
            : `${confirm?.klass.name} will appear again wherever a class can be picked.`
        }
        onConfirmText={confirm?.kind === "archive" ? "Archive class" : "Restore"}
        containerClass="min-h-[320px] lg:w-[420px]"
        srcClass="size-25"
        src="/image/caution.png"
        onConfirmClass={
          confirm?.kind === "archive"
            ? "bg-error-01 text-white shadow-xs hover:bg-error-01/90 focus-visible:ring-error-01/20"
            : undefined
        }
      />
    </main>
  );
}

type Confirmation = { kind: "archive" | "restore"; klass: SchoolClass };

// ── The card ────────────────────────────────────────────────────────────────

/** The tile colour keys off the programme band, as this card always did. */
function tileVariant(levelName: string) {
  if (/^JSS|^Junior/i.test(levelName)) return "green";
  if (/^Primary|^Nursery/i.test(levelName)) return "amber";
  return "blue";
}

function ClassCard({
  klass,
  multiBranch,
  canEdit,
  canManage,
  onEdit,
  onArchive,
  onRestore,
}: {
  klass: SchoolClass;
  multiBranch: boolean;
  canEdit: boolean;
  canManage: boolean;
  onEdit: () => void;
  onArchive: () => void;
  onRestore: () => void;
}) {
  return (
    <div className="h-fit w-full min-w-0 rounded-md bg-white px-4 py-3">
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="truncate font-medium">{klass.name}</h4>
          {multiBranch && (
            <div className="mt-1.5 flex items-center gap-1.5 text-gray-05">
              <MapPin className="size-3 shrink-0 text-amber-01" />
              <span className="min-w-0 truncate text-xs">
                <ScopeCell
                  label={klass.scope_label}
                  shared={klass.branch == null}
                />
              </span>
            </div>
          )}
        </div>

        <div className="inline-flex shrink-0 items-center gap-2">
          {!klass.is_active && (
            <Badge variant="inactive" className="h-fit rounded-full py-0 text-[11px]">
              Archived
            </Badge>
          )}
          <figure
            className={cn(
              badgeVariants({ variant: tileVariant(klass.level_name) }),
              "grid size-8 place-content-center rounded-md",
            )}
          >
            <GraduationCap className="size-5!" />
          </figure>
        </div>
      </div>

      <hr className="my-3 border-gray-0 border-1.5" />

      {/* Level / Arm / Subjects. See the note at the top of this file for why
          this is not Students / Subject / Avg Score. */}
      <div className="flex items-center justify-between gap-2 px-1 xl:px-3">
        <Stat label="Level" value={klass.level_name} />
        <Stat label="Arm" value={klass.arm || "-"} />
        <Stat label="Subjects" value={String(klass.subject_count)} />
      </div>

      <div className="mt-4 inline-flex flex-wrap items-center gap-3">
        {canEdit && (
          <Button
            size="sm"
            variant="outline"
            className="border-primary text-primary"
            onClick={onEdit}
          >
            <Edit />
            Edit
          </Button>
        )}
        {canManage &&
          (klass.is_active ? (
            <Button size="sm" variant="ghost" className="text-gray-06" onClick={onArchive}>
              <Archive className="size-4" />
              Archive
            </Button>
          ) : (
            <Button size="sm" variant="ghost" className="text-primary" onClick={onRestore}>
              <RotateCcw className="size-4" />
              Restore
            </Button>
          ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-gray-05">{label}</p>
      <p className="truncate text-lg font-semibold text-black-01">{value}</p>
    </div>
  );
}

function ViewButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={`${label} view`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs whitespace-nowrap",
        active ? "bg-pry-01 text-primary" : "text-gray-06 hover:text-black-01",
      )}
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  );
}
