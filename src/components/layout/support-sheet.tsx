import { Headset } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SupportTicketForm } from "@/components/custom/support-ticket-form";

/**
 * The header's headset, as console-fe does it: the ticket form opens in place
 * rather than navigating.
 *
 * Why in place matters. Somebody raises a ticket because a screen is not doing
 * what they expect, and navigating away takes the evidence off their screen -
 * they lose the half-filled form, the error, the row they were looking at. A
 * sheet keeps the page behind it and returns them to it when they are done.
 *
 * The sidebar's Help item still navigates to the full page. That is the same
 * form with a heading around it, for somebody who set out to raise a ticket
 * rather than hitting a wall mid-task.
 */
export function SupportSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 bg-white p-0 sm:max-w-md overflow-y-auto"
      >
        <SheetHeader className="border-b border-border px-5 pb-4 pt-5 pr-12 text-left">
          <SheetTitle className="flex items-center gap-2 font-mont text-base">
            <span className="grid size-8 shrink-0 place-content-center rounded-full bg-pry-01 text-primary">
              <Headset className="size-4 stroke-[2.15]" />
            </span>
            Get help
          </SheetTitle>
          <SheetDescription className="text-[13px] text-gray-01 text-pretty">
            Tell CodeX support what is blocking you. Your school and where you
            are in onboarding travel with the ticket.
          </SheetDescription>
        </SheetHeader>

        <div className="px-5 py-5 min-w-0">
          <SupportTicketForm
            onCancel={() => onOpenChange(false)}
            cancelLabel="Close"
            onDone={() => onOpenChange(false)}
            doneLabel="Done"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
