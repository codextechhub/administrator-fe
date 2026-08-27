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
import type { RoomType, RoomWrite } from "@/redux/services/calendar/calendar-types";
import type { RoomDraft } from "./room-draft";

// ─────────────────────────────────────────────────────────────────────────────
// Add or edit a room.
//
// **The branch is required and can never be "the whole school".** It is the one
// non-null branch column in the schools product, and the reason is physical: a
// room is a place, and a place is at one site. So this drawer has a branch
// PICKER where the event drawer has a whole-school / one-branch choice, and no
// third option to leave out.
//
// **Capacity is advisory and the form says so.** Nothing in the platform
// compares it with anything - there is no student count in this module at all -
// so a class of forty fits a room of twenty-five as far as the server is
// concerned. Saying that under the box is honest; a validation that pretended
// otherwise would be a rule with nothing behind it.
//
// **Active is not archive-by-another-name, and the copy distinguishes them.**
// An inactive room stops being offered when anyone picks a room, and everything
// already scheduled in it stays exactly where it is.
// ─────────────────────────────────────────────────────────────────────────────

const ROOM_TYPES: { value: RoomType; label: string }[] = [
  { value: "CLASSROOM", label: "Classroom" },
  { value: "LABORATORY", label: "Laboratory" },
  { value: "HALL", label: "Hall" },
  { value: "LIBRARY", label: "Library" },
  { value: "SPORTS", label: "Sports" },
  { value: "OTHER", label: "Other" },
];

export function RoomDrawer({
  open,
  initial,
  editing,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: RoomDraft;
  editing: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (body: RoomWrite) => Promise<unknown>;
}) {
  const {
    applies: multiBranch,
    isTied,
    branch: tiedBranch,
    branches,
    label: tiedLabel,
  } = useBranchLens();

  const [draft, setDraft] = useState<RoomDraft>(initial);
  const [touched, setTouched] = useState<{ name?: boolean }>({});
  const [edited, setEdited] = useState<{ name?: boolean }>({});
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

  const patch = (next: Partial<RoomDraft>) => {
    setDraft((d) => ({ ...d, ...next }));
    setRefusal(null);
  };

  const tiedLock =
    isTied && tiedBranch !== "all"
      ? { id: tiedBranch as number, name: tiedLabel }
      : null;
  const effectiveBranch = tiedLock ? tiedLock.id : draft.branch;

  const nameEmpty = !!touched.name && !draft.name.trim();
  // Never optional, unlike everywhere else in this module. A single-branch
  // school never sees the control and the server fills in its only branch.
  const branchMissing = multiBranch && !tiedLock && draft.branch === -1;

  const valid = !!draft.name.trim() && !branchMissing;
  const dirty =
    JSON.stringify({ ...draft, branch: effectiveBranch }) !==
    JSON.stringify({ ...initial, branch: tiedLock ? tiedLock.id : initial.branch });

  const save = async () => {
    setTouched({ name: true });
    if (!valid) return;
    try {
      await onSave({
        name: draft.name.trim(),
        code: draft.code.trim().toUpperCase(),
        room_type: draft.room_type,
        // Omitted entirely at a single-branch school: the server fills in the
        // only branch there, and sending -1 would be a reference to nothing.
        ...(multiBranch ? { branch: effectiveBranch } : {}),
        // "" means "no answer" and must not become 0, which would read as a
        // room that seats nobody.
        capacity: draft.capacity.trim() ? Number(draft.capacity) : null,
        is_active: draft.is_active,
      });
      onClose();
    } catch (error) {
      const parsed = parseApiError(error);
      // DUPLICATE_NAME and DUPLICATE_CODE both carry `detail.field`, so the
      // sentence lands under the box that was wrong rather than in a toast.
      setRefusal({
        field: String(parsed.detail.field ?? ""),
        message: parsed.message || "That room could not be saved.",
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
            {editing ? `Edit ${initial.name}` : "Add room"}
          </SheetTitle>
          <SheetDescription className="text-[13px] text-gray-01 text-pretty">
            A place a lesson or an examination happens in. Rooms are what make a
            double-booking detectable.
          </SheetDescription>
        </SheetHeader>

        <div className="min-w-0 flex-1 overflow-y-auto px-5 py-5">
          <Field
            label="Room name *"
            error={
              nameEmpty
                ? "A room name is required."
                : refusal?.field === "name"
                  ? refusal.message
                  : ""
            }
          >
            <Input
              value={draft.name}
              onChange={(e) => {
                setEdited((t) => ({ ...t, name: true }));
                patch({ name: e.target.value });
              }}
              onBlur={() => edited.name && setTouched((t) => ({ ...t, name: true }))}
              placeholder="e.g. Block A Room 1"
              aria-invalid={nameEmpty || refusal?.field === "name" || undefined}
            />
          </Field>

          <div className="mt-4">
            <Field
              label="Code"
              error={refusal?.field === "code" ? refusal.message : ""}
            >
              <Input
                value={draft.code}
                onChange={(e) => patch({ code: e.target.value.toUpperCase() })}
                placeholder="e.g. A-1"
                aria-invalid={refusal?.field === "code" || undefined}
              />
            </Field>
            <p className="mt-1 text-xs text-gray-05 text-pretty">
              Optional, and unique across the whole school - unlike the name,
              which only has to be unique within its branch.
            </p>
          </div>

          <div className="mt-4">
            <Field label="Type *">
              <div className="flex flex-wrap gap-1.5">
                {ROOM_TYPES.map((kind) => {
                  const on = draft.room_type === kind.value;
                  return (
                    <button
                      key={kind.value}
                      type="button"
                      onClick={() => patch({ room_type: kind.value })}
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
            <p className="mt-1.5 text-xs text-gray-05 text-pretty">
              A label, not a rule. Nothing refuses a Physics lesson in a
              classroom, because nothing records which subject needs which kind
              of room.
            </p>
          </div>

          {multiBranch && (
            <div className="mt-5 border-t border-white-02 pt-4">
              <p className="mb-2 text-[13px] font-medium text-gray-06">Branch *</p>
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
                  <p className="mt-2 text-xs text-gray-05 text-pretty">
                    A room is a physical place, so it belongs to one branch. The
                    same room name at another branch is fine.
                  </p>
                </>
              )}
            </div>
          )}

          <div className="mt-5 border-t border-white-02 pt-4">
            <Field label="Capacity">
              <Input
                type="number"
                min={1}
                value={draft.capacity}
                onChange={(e) => patch({ capacity: e.target.value })}
                placeholder="Optional"
              />
            </Field>
            <p className="mt-1 text-xs text-gray-05 text-pretty">
              A note for whoever is scheduling. Nothing checks it.
            </p>
          </div>

          <label className="mt-4 flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              checked={draft.is_active}
              onChange={(e) => patch({ is_active: e.target.checked })}
              className="mt-0.5 size-4 shrink-0 accent-[var(--color-primary,#4A659D)]"
            />
            <span className="min-w-0">
              <span className="block text-[13px] font-medium text-gray-06">
                Active
              </span>
              <span className="block text-xs text-gray-05 text-pretty">
                An inactive room stops appearing when anyone picks a room.
                Everything already scheduled in it stays exactly where it is.
              </span>
            </span>
          </label>

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
            {editing ? "Save changes" : "Add room"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
