import { useMemo, useState } from "react";
import {
  DoorOpen,
  LayoutGrid,
  Pencil,
  Plus,
  Power,
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
import CustomTable from "@/components/custom/custom-table";
import PermissionGate from "@/components/custom/permission-gate";
import PromptModal from "@/components/modal/prompt-modal";
import { SegmentedToggle } from "@/components/custom/segmented-toggle";
import { CardActions, ClickableCard, Panel } from "@/components/custom/surface";
import { OutlinedNotice } from "@/pages/protected/onboarding/components/outlined-notice";
import { P } from "@/permissions";
import { usePermissions } from "@/hooks/use-permissions";
import { useAcademicsLens } from "@/hooks/use-academics-lens";
import { parseApiError } from "@/utils/api-error";
import {
  useCreateRoomMutation,
  useDeleteRoomMutation,
  useGetRoomsQuery,
  useUpdateRoomMutation,
} from "@/redux/services/calendar/calendar-api";
import type { Room, RoomWrite } from "@/redux/services/calendar/calendar-types";
import { RoomDrawer } from "../components/room-drawer";
import { blankRoom, roomDraftFrom } from "../components/room-draft";
import { RoomFilters } from "./room-filters";
import { BLANK_ROOM_FACETS, type RoomFacets } from "./room-facets";

/**
 * The places lessons and examinations happen in.
 *
 * **Two controls that look like one, and are not.** Deactivate takes a room out
 * of use: it stops being offered when anyone picks a room, and every lesson and
 * paper already in it stays exactly where it is. Delete removes it outright,
 * and the server refuses that for any room holding anything, with a sentence
 * naming what is in it. Both are kept because the two cases are genuinely
 * different: a room typed by mistake on Monday morning should leave nothing
 * behind, and the Science Lab closed for a refit should leave everything.
 *
 * **Usage is the server's count, not ours.** Each row carries how many lessons
 * and papers sit in it, and the delete refusal is worded from the same numbers -
 * so the card and the refusal can never disagree.
 */
export default function Rooms() {
  const { lens, branch, multiBranch, readOnlyYear } = useAcademicsLens();
  const { hasPermission } = usePermissions();

  const [facets, setFacets] = useState<RoomFacets>(BLANK_ROOM_FACETS);
  const [view, setView] = useState<"cards" | "table">("cards");
  const [page, setPage] = useState(1);

  const [editing, setEditing] = useState<Room | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirm, setConfirm] = useState<Room | null>(null);

  // No session in the args: a room outlives the school year, and it is the one
  // thing in this module with no session column at all.
  const { data, isLoading, isError, refetch } = useGetRoomsQuery({
    branch: lens.branch,
    search: facets.search,
    type: facets.type === "all" ? undefined : facets.type,
    active: facets.active === "all" ? undefined : facets.active,
    page,
  });

  const [create, { isLoading: creating }] = useCreateRoomMutation();
  const [update, { isLoading: updating }] = useUpdateRoomMutation();
  const [remove, { isLoading: removing }] = useDeleteRoomMutation();

  const rooms = useMemo(() => data?.data ?? [], [data]);
  const pagination = data?.pagination;

  const canCreate = hasPermission(P.CREATE_TIMETABLE_ENTRY) && !readOnlyYear;
  const canEdit = hasPermission(P.MODIFY_TIMETABLE_ENTRY) && !readOnlyYear;
  const canDelete = hasPermission(P.MANAGE_TIMETABLES) && !readOnlyYear;

  const filtered =
    !!facets.search || facets.type !== "all" || facets.active !== "all";

  const clearFilters = () => {
    setFacets(BLANK_ROOM_FACETS);
    setPage(1);
  };

  const open = (room: Room | null) => {
    setEditing(room);
    setDrawerOpen(true);
  };

  const save = async (body: RoomWrite) => {
    const result = editing
      ? await update({ id: editing.id, ...body }).unwrap()
      : await create(body).unwrap();
    toast.success(result.message);
  };

  /** The toggle, which is the archive here. Never routed through the modal. */
  const toggleActive = async (room: Room) => {
    try {
      const result = await update({
        id: room.id,
        is_active: !room.is_active,
      }).unwrap();
      toast.success(result.message);
    } catch (error) {
      toast.error(
        parseApiError(error).message || "That room could not be changed.",
      );
    }
  };

  const runDelete = async () => {
    if (!confirm) return;
    try {
      const result = await remove(confirm.id).unwrap();
      toast.success(result.message || `${confirm.name} deleted.`);
    } catch (error) {
      // PROTECTED_REFERENCE, and its message names the lessons and papers in
      // the room and tells the school to deactivate instead. Shown as it
      // arrived: rewriting it would be a second version of the same count.
      toast.error(
        parseApiError(error).message || "That room could not be deleted.",
      );
    }
    setConfirm(null);
  };

  if (isError) {
    return (
      <main className="px-5 pt-3 pb-8">
        <OutlinedNotice
          icon={DoorOpen}
          title="We could not load your rooms"
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
            value={facets.search}
            onChange={(e) => {
              setFacets((f) => ({ ...f, search: e.target.value }));
              setPage(1);
            }}
            placeholder="Search rooms"
            aria-label="Search rooms"
            className="h-9 w-full rounded-full border border-white-02 bg-white pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>

        <RoomFilters
          facets={facets}
          onChange={(next) => {
            setFacets(next);
            setPage(1);
          }}
        />

        <SegmentedToggle
          ariaLabel="Room view"
          value={view}
          onChange={setView}
          options={[
            { value: "cards", label: "Cards", icon: LayoutGrid },
            { value: "table", label: "Table", icon: Rows3 },
          ]}
        />

        <PermissionGate
          permission={P.CREATE_TIMETABLE_ENTRY}
          disabled={readOnlyYear}
        >
          <Button
            className="shrink-0 text-sm"
            onClick={() => open(null)}
            disabled={!canCreate}
          >
            <Plus /> Add room
          </Button>
        </PermissionGate>
      </div>

      {isLoading ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-md" />
          ))}
        </div>
      ) : !rooms.length ? (
        <OutlinedNotice
          icon={DoorOpen}
          title={filtered ? "No rooms match these filters" : "No rooms yet"}
          body={
            filtered
              ? "Try a different search, or clear the type and status filters."
              : "A room is what makes a double-booking detectable: without them a timetable can put two classes in one place and nothing will notice."
          }
          actionLabel={
            filtered ? "Clear filters" : canCreate ? "Add room" : undefined
          }
          onAction={filtered ? clearFilters : () => open(null)}
        />
      ) : view === "cards" ? (
        <div className="grid items-start gap-5 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              multiBranch={multiBranch}
              canEdit={canEdit}
              canDelete={canDelete}
              onEdit={() => open(room)}
              onToggle={() => toggleActive(room)}
              onDelete={() => setConfirm(room)}
            />
          ))}
        </div>
      ) : (
        <CustomTable
          tableHeaderList={[
            "Room",
            "Code",
            "Type",
            ...(multiBranch ? ["Branch"] : []),
            "Capacity",
            "Status",
            "Action",
          ]}
          defaultBodyList={rooms}
          tableBodyList={rooms.map((room) => ({
            Room: room.name,
            Code: room.code || "-",
            Type: room.type_label,
            ...(multiBranch ? { Branch: room.branch_name ?? "-" } : {}),
            // Never "0": an unset capacity is no answer, and a zero would read
            // as a room that seats nobody.
            Capacity: room.capacity == null ? "-" : String(room.capacity),
            Status: (
              <Badge
                variant={room.is_active ? "active" : "inactive"}
                className="rounded-full py-0 text-[11px]"
              >
                {room.is_active ? "Active" : "Inactive"}
              </Badge>
            ),
            Action: (
              <RowMenu
                room={room}
                canEdit={canEdit}
                canDelete={canDelete}
                onEdit={() => open(room)}
                onToggle={() => toggleActive(room)}
                onDelete={() => setConfirm(room)}
              />
            ),
          }))}
          onRowClick={(room: Room) => {
            if (room && canEdit) open(room);
          }}
          currentPage={pagination?.currentPage ?? 1}
          totalPage={pagination?.totalPages ?? 1}
          onPageChange={(next) => setPage(Number(next) || 1)}
          emptyText="No rooms"
        />
      )}

      {rooms.length > 0 && (
        <p className="text-xs text-gray-05">
          {pagination?.totalItems ?? rooms.length}{" "}
          {(pagination?.totalItems ?? rooms.length) === 1 ? "room" : "rooms"}
          {filtered ? " match these filters" : ""}
        </p>
      )}

      <RoomDrawer
        open={drawerOpen}
        editing={!!editing}
        saving={creating || updating}
        initial={editing ? roomDraftFrom(editing) : blankRoom(branch)}
        onClose={() => setDrawerOpen(false)}
        onSave={save}
      />

      <PromptModal
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={runDelete}
        loading={removing}
        canCancel
        title={`Delete ${confirm?.name}?`}
        description={deleteBody(confirm)}
        onConfirmText="Delete"
        containerClass="min-h-[320px] lg:w-[420px]"
        srcClass="size-25"
        src="/image/caution.png"
      />
    </main>
  );
}

function RoomCard({
  room,
  multiBranch,
  canEdit,
  canDelete,
  onEdit,
  onToggle,
  onDelete,
}: {
  room: Room;
  multiBranch: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    // A reader who cannot edit still gets a card, just not a button-shaped
    // one: `ClickableCard` always opens something, so a no-op handler would be
    // a control that looks pressable and is not.
    <Card
      canEdit={canEdit}
      label={`Edit ${room.name}`}
      onOpen={onEdit}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-mont text-[15px] font-medium text-black-01">
            {room.name}
          </h3>
          {multiBranch && room.branch_name && (
            <p className="mt-0.5 truncate text-xs text-gray-05">
              {room.branch_name}
            </p>
          )}
        </div>
        <Badge
          variant={room.is_active ? "active" : "inactive"}
          className="shrink-0 rounded-full py-0 text-[11px]"
        >
          {room.is_active ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-05">
        {room.code && <span>{room.code}</span>}
        <span>{room.type_label}</span>
        {room.capacity != null && <span>Seats {room.capacity}</span>}
      </div>

      {/* The server's own sentence: "3 lessons · 1 exam paper", or "Nothing
          scheduled here yet". The delete refusal is worded from the same
          counts, so the card and the refusal cannot disagree. */}
      <p className="mt-2 text-[13px] text-gray-06 text-pretty">
        {room.usage.label}
      </p>

      {(canEdit || canDelete) && (
        <CardActions>
          {canEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="size-3.5" /> Edit
            </Button>
          )}
          {canEdit && (
            <Button variant="outline" size="sm" onClick={onToggle}>
              <Power className="size-3.5" />
              {room.is_active ? "Deactivate" : "Activate"}
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="text-error-text"
              onClick={onDelete}
            >
              <Trash2 className="size-3.5" /> Delete
            </Button>
          )}
        </CardActions>
      )}
    </Card>
  );
}

/** A room card, pressable only where pressing it would do something. */
function Card({
  canEdit,
  label,
  onOpen,
  children,
}: {
  canEdit: boolean;
  label: string;
  onOpen: () => void;
  children: React.ReactNode;
}) {
  if (!canEdit) {
    return <Panel className="h-fit p-4">{children}</Panel>;
  }
  return (
    <ClickableCard label={label} onOpen={onOpen} className="p-4">
      {children}
    </ClickableCard>
  );
}

function RowMenu({
  room,
  canEdit,
  canDelete,
  onEdit,
  onToggle,
  onDelete,
}: {
  room: Room;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  if (!canEdit && !canDelete) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-gray-05"
          aria-label={`${room.name} actions`}
          onClick={(e) => e.stopPropagation()}
        >
          &#8942;
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        {canEdit && (
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil className="size-4" /> Edit
          </DropdownMenuItem>
        )}
        {canEdit && (
          <DropdownMenuItem onSelect={onToggle}>
            <Power className="size-4" />
            {room.is_active ? "Deactivate" : "Activate"}
          </DropdownMenuItem>
        )}
        {canDelete && (
          <DropdownMenuItem onSelect={onDelete} variant="destructive">
            <Trash2 className="size-4" /> Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * What deleting a room does, and when it will not happen.
 *
 * The room's own usage count is read here rather than left to the refusal,
 * because saying so BEFORE the press is better than a 409 after it. The server
 * still refuses - this is a warning, not the gate.
 */
function deleteBody(room: Room | null): string {
  if (!room) return "";
  if (room.usage.lessons || room.usage.exam_papers) {
    return `${room.name} holds ${room.usage.label.toLowerCase()}, so this will be refused. Deactivate it instead: it stops being offered when anyone picks a room, and everything already scheduled here stays intact.`;
  }
  return `${room.name} has nothing scheduled in it, so it will be removed outright. To keep it on file but out of use, deactivate it instead.`;
}
