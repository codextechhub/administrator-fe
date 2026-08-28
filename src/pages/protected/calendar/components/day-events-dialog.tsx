import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/redux/services/calendar/calendar-types";
import { eventVariant } from "./event-kind";
import { audienceLine } from "./audience";
import { formatDate, formatRange } from "./dates";

// ─────────────────────────────────────────────────────────────────────────────
// What is on one day, when there is something on it.
//
// Pressing an empty day goes straight to the form - there is only one thing it
// could mean. Pressing a day that already holds something is ambiguous: it
// might mean "show me what is on", "let me fix that one", or "add another". So
// it opens this instead, which offers all three rather than guessing.
//
// The list is the day's events in full, not the two the cell had room for, and
// each row is the whole row rather than a small link inside it - a dialog you
// opened to act on something should not then ask you to find the target.
// ─────────────────────────────────────────────────────────────────────────────

export function DayEventsDialog({
  date,
  events,
  open,
  multiBranch,
  canCreate,
  onClose,
  onPick,
  onAdd,
}: {
  /** The day, `YYYY-MM-DD`. */
  date: string;
  events: CalendarEvent[];
  open: boolean;
  multiBranch: boolean;
  canCreate: boolean;
  onClose: () => void;
  onPick: (event: CalendarEvent) => void;
  onAdd: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mont text-base">
            {formatDate(date)}
          </DialogTitle>
          <DialogDescription className="text-[13px]">
            {events.length} {events.length === 1 ? "entry" : "entries"} on this
            day.
          </DialogDescription>
        </DialogHeader>

        <ul className="grid max-h-80 gap-1.5 overflow-y-auto">
          {events.map((event) => {
            const who = audienceLine(event.audience);
            return (
              <li key={event.id}>
                <button
                  type="button"
                  onClick={() => onPick(event)}
                  className="w-full rounded-lg border border-white-02 px-3 py-2.5 text-left transition-colors hover:border-primary/60 hover:bg-pry-01/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={eventVariant(event.event_type)}
                      className="shrink-0 rounded-full py-0 text-[11px]"
                    >
                      {event.type_label}
                    </Badge>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-black-01">
                      {event.name}
                    </span>
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-gray-05">
                    {/* The range, not this day, because a mid-term break is
                        one event and seeing only today's slice of it is how
                        somebody concludes it is a one-day thing. */}
                    <span>{formatRange(event.start_date, event.end_date)}</span>
                    {event.closes_school && (
                      <span className="text-gray-06">School closed</span>
                    )}
                    {multiBranch && event.scope_label && (
                      <span>{event.scope_label}</span>
                    )}
                    {who && <span>{who}</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div
          className={cn(
            "flex items-center gap-2",
            canCreate ? "justify-between" : "justify-end",
          )}
        >
          {canCreate && (
            <Button variant="outline" onClick={onAdd}>
              <Plus className="size-4" /> Add event
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
