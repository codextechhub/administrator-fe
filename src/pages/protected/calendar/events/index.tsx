import { useMemo, useState } from "react";
import { CalendarDays, Pencil, Plus, Search, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import CustomTable from "@/components/custom/custom-table";
import PermissionGate from "@/components/custom/permission-gate";
import PromptModal from "@/components/modal/prompt-modal";
import { OutlinedNotice } from "@/pages/protected/onboarding/components/outlined-notice";
import { P } from "@/permissions";
import { usePermissions } from "@/hooks/use-permissions";
import { useAcademicsLens } from "@/hooks/use-academics-lens";
import { parseApiError } from "@/utils/api-error";
import {
  useCreateCalendarEventMutation,
  useDeleteCalendarEventMutation,
  useGetCalendarEventsQuery,
  useGetCalendarYearQuery,
  useUpdateCalendarEventMutation,
} from "@/redux/services/calendar/calendar-api";
import {
  useGetClassesQuery,
  useGetProgramsQuery,
} from "@/redux/services/academics/academics-api";
import type {
  CalendarEvent,
  CalendarEventWrite,
} from "@/redux/services/calendar/calendar-types";
import { eventVariant } from "../components/event-kind";
import { formatRange } from "../components/dates";
import { RowActions } from "../components/row-actions";
import { audienceLine } from "../components/audience";
import { warnAboutClashes } from "../components/clash-toast";
import { eventDeleteBody } from "../components/event-delete";
import { blankEvent, draftFrom } from "../components/event-draft";
import { EventDetail, EventDrawer } from "../components/event-drawer";
import { EventFilters } from "./event-filters";
import { BLANK_FACETS, type EventFacets } from "./event-facets";

/**
 * Holidays, breaks, exam periods and school events, each dated inside a term.
 *
 * Three things on this screen are the server's answers rather than ours, and
 * that is deliberate in each case.
 *
 * **Which term an event is in.** A term is a date range, not a column on the
 * row: an event "in First Term" is one whose dates fall inside it. Computing it
 * here would give a school two truths the day a term's dates were corrected.
 *
 * **Whether an event is outside every term.** Null is a real answer, and it is
 * not an error - the event is still on the calendar, and the hub raises an
 * alert about it rather than this screen hiding it.
 *
 * **Every refusal and every warning.** Saving an event that overlaps another,
 * or that falls outside every term, SUCCEEDS and comes back with `warnings`.
 * They are toasted after the drawer closes, because the write happened and the
 * school needs to see what it just did.
 */
export default function CalendarEvents() {
  const { lens, branch, multiBranch, readOnlyYear, sessionName } =
    useAcademicsLens();
  const { hasPermission } = usePermissions();

  const [facets, setFacets] = useState<EventFacets>(BLANK_FACETS);
  const [page, setPage] = useState(1);

  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [viewing, setViewing] = useState<CalendarEvent | null>(null);
  const [confirm, setConfirm] = useState<CalendarEvent | null>(null);

  const { data, isLoading, isError, refetch } = useGetCalendarEventsQuery({
    ...lens,
    search: facets.search,
    type: facets.type,
    term: facets.term,
    scope: facets.scope,
    page,
  });
  // The term filter's options. The year read is cheap and already cached by
  // the hub, so this costs nothing on a normal visit.
  const { data: yearData } = useGetCalendarYearQuery({ session: lens.session });
  // The audience picker's two lists. Fetched by the screen rather than the
  // drawer so opening it is instant, and so both are already scoped by the lens.
  const { data: programData } = useGetProgramsQuery(lens);
  const { data: classData } = useGetClassesQuery(lens);

  const [create, { isLoading: creating }] = useCreateCalendarEventMutation();
  const [update, { isLoading: updating }] = useUpdateCalendarEventMutation();
  const [remove, { isLoading: removing }] = useDeleteCalendarEventMutation();

  const events = useMemo(() => data?.data ?? [], [data]);
  const pagination = data?.pagination;
  const terms = useMemo(() => yearData?.data?.terms ?? [], [yearData]);
  const programs = useMemo(() => programData?.data ?? [], [programData]);
  const classes = useMemo(() => classData?.data ?? [], [classData]);

  // An archived year is read-only on the server, so an Edit here would only
  // ever answer 409.
  const canCreate = hasPermission(P.CREATE_CALENDAR_EVENT) && !readOnlyYear;
  const canEdit = hasPermission(P.MODIFY_CALENDAR_EVENT) && !readOnlyYear;
  const canDelete = hasPermission(P.MANAGE_CALENDAR) && !readOnlyYear;

  const filtered =
    !!facets.search ||
    facets.type !== "all" ||
    facets.term !== "all" ||
    facets.scope !== "all";

  const clearFilters = () => {
    setFacets(BLANK_FACETS);
    setPage(1);
  };

  const openForm = (event: CalendarEvent | null) => {
    setEditing(event);
    setViewing(null);
    setFormOpen(true);
  };

  const save = async (body: CalendarEventWrite) => {
    const result = editing
      ? await update({ id: editing.id, ...body }).unwrap()
      : await create(body).unwrap();
    toast.success(result.message);
    // The write succeeded AND has something to say. Each warning is the
    // server's own sentence, and it carries a way back to the event it is
    // about, because "that was a mistake" is the commonest reply to one.
    warnAboutClashes(
      result.data,
      canEdit
        ? (row) => {
            setEditing(row);
            setFormOpen(true);
          }
        : undefined,
    );
  };

  const runDelete = async () => {
    if (!confirm) return;
    try {
      const result = await remove(confirm.id).unwrap();
      toast.success(result.message || `${confirm.name} removed.`);
    } catch (error) {
      toast.error(
        parseApiError(error).message || "That event could not be removed.",
      );
    }
    setConfirm(null);
  };

  if (isError) {
    return (
      <main className="px-5 pt-3 pb-8">
        <OutlinedNotice
          icon={CalendarDays}
          title="We could not load your calendar"
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
            placeholder="Search events"
            aria-label="Search events"
            className="h-9 w-full rounded-full border border-white-02 bg-white pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>

        <EventFilters
          facets={facets}
          terms={terms}
          showScope={multiBranch}
          onChange={(next) => {
            setFacets(next);
            setPage(1);
          }}
        />

        <PermissionGate
          permission={P.CREATE_CALENDAR_EVENT}
          disabled={readOnlyYear}
        >
          <Button
            className="shrink-0 text-sm"
            onClick={() => openForm(null)}
            disabled={!canCreate}
          >
            <Plus /> Add event
          </Button>
        </PermissionGate>
      </div>

      {isLoading ? (
        <Skeleton className="h-80 w-full rounded-md" />
      ) : !events.length ? (
        <OutlinedNotice
          icon={CalendarDays}
          title={filtered ? "No events match these filters" : "No events yet"}
          body={
            filtered
              ? "Try a different search, or clear the type, term and scope filters."
              : sessionName
                ? `${sessionName} has nothing dated on it yet. Holidays, breaks and exam periods all start here.`
                : "Holidays, breaks, exam periods and school events all start here."
          }
          actionLabel={
            filtered ? "Clear filters" : canCreate ? "Add event" : undefined
          }
          onAction={filtered ? clearFilters : () => openForm(null)}
        />
      ) : (
        <CustomTable
          tableHeaderList={[
            "Event",
            "Type",
            "Dates",
            "Term",
            ...(multiBranch ? ["Scope"] : []),
            "Action",
          ]}
          defaultBodyList={events}
          tableBodyList={events.map((event) => ({
            Event: (
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate font-medium text-black-01">
                  {event.name}
                </span>
                {event.closes_school && (
                  <span className="text-[11px] text-gray-05">School closed</span>
                )}
              </span>
            ),
            Type: (
              <Badge
                variant={eventVariant(event.event_type)}
                className="rounded-full py-0 text-[11px]"
              >
                {event.type_label}
              </Badge>
            ),
            Dates: formatRange(event.start_date, event.end_date),
            Term: event.term ? (
              event.term.name
            ) : (
              // Not an error, and not hidden. The event is still on the
              // calendar; the hub raises an alert about it.
              <span className="text-gray-05">Outside every term</span>
            ),
            ...(multiBranch
              ? {
                  Scope: <ScopeWithAudience event={event} />,
                }
              : {}),
            Action: (
              <RowActions
                label={`Actions for ${event.name}`}
                actions={[
                  { label: "View details", icon: Eye, onSelect: () => setViewing(event) },
                  canEdit && {
                    label: "Edit",
                    icon: Pencil,
                    onSelect: () => openForm(event),
                  },
                  canDelete && {
                    label: "Delete",
                    icon: Trash2,
                    destructive: true,
                    onSelect: () => setConfirm(event),
                  },
                ]}
              />
            ),
          }))}
          onRowClick={(event: CalendarEvent) => event && setViewing(event)}
          currentPage={pagination?.currentPage ?? 1}
          totalPage={pagination?.totalPages ?? 1}
          onPageChange={(next) => setPage(Number(next) || 1)}
          emptyText="No events"
        />
      )}

      {events.length > 0 && (
        <p className="text-xs text-gray-05">
          {pagination?.totalItems ?? events.length}{" "}
          {(pagination?.totalItems ?? events.length) === 1 ? "event" : "events"}
          {filtered ? " match these filters" : ""}
        </p>
      )}

      <EventDrawer
        open={formOpen}
        editing={!!editing}
        saving={creating || updating}
        initial={
          editing
            ? draftFrom(editing)
            : blankEvent(branch === "all" ? null : branch)
        }
        programs={programs}
        classes={classes}
        onClose={() => setFormOpen(false)}
        onSave={save}
      />

      <EventDetail
        event={viewing}
        open={!!viewing}
        multiBranch={multiBranch}
        onClose={() => setViewing(null)}
        onEdit={canEdit ? () => openForm(viewing) : undefined}
      />

      <PromptModal
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={runDelete}
        loading={removing}
        canCancel
        title={`Remove ${confirm?.name}?`}
        description={eventDeleteBody(confirm)}
        onConfirmText="Remove"
        containerClass="min-h-[320px] lg:w-[420px]"
        srcClass="size-25"
        src="/image/caution.png"
      />
    </main>
  );
}

/**
 * Where an event applies, and to whom.
 *
 * The audience line is the half the prototype had no room for, and leaving it
 * out is what made a narrowed closure read as a whole-branch one. It renders
 * only when the event IS narrowed - a Scope column where most rows say nothing
 * extra is a column where the narrowed ones stand out.
 */
function ScopeWithAudience({ event }: { event: CalendarEvent }) {
  const who = audienceLine(event.audience);
  return (
    <span className="flex min-w-0 flex-col gap-0.5">
      {event.branch ? (
        <span className="min-w-0 truncate">{event.scope_label}</span>
      ) : (
        <Badge variant="blue" className="h-fit w-fit rounded-full py-0 text-[11px]">
          School-wide
        </Badge>
      )}
      {who && <span className="truncate text-[11px] text-gray-05">{who}</span>}
    </span>
  );
}


