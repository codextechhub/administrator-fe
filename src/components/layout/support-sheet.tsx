import { Headset } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  SupportTicketForm,
  type EscalationPrefill,
} from "@/components/custom/support-ticket-form";

/**
 * The header's headset, as console-fe does it: a panel anchored under the
 * button, not a page and not a full-height side sheet.
 *
 * Why anchored rather than centred or full-height. Somebody raises a ticket
 * because a screen is not doing what they expect, so the screen has to stay
 * visible while they describe it. A modal in the middle of the viewport covers
 * exactly the thing they are writing about; navigating away loses it entirely
 * along with anything half-typed. This sits in the corner it was opened from
 * and leaves the rest of the page where it was.
 *
 * On a phone there is no corner to anchor to, so it takes the bottom of the
 * screen instead - reachable by thumb, and still not covering the whole page.
 */
export function SupportSheet({
  open,
  onOpenChange,
  prefill,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  /** What the screen that opened it already knows. */
  prefill?: EscalationPrefill;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="left-3 right-3 top-auto bottom-3 max-h-[calc(100dvh-1.5rem)] w-auto max-w-none translate-x-0 translate-y-0 gap-0 overflow-y-auto overscroll-contain rounded-3xl border-white bg-white p-0 shadow-[0_24px_80px_rgba(15,23,42,.24)] sm:bottom-auto sm:left-auto sm:right-6 sm:top-[72px] sm:h-auto sm:max-h-[calc(100dvh-96px)] sm:w-[430px] sm:max-w-[calc(100vw-3rem)]"
        showCloseButton
      >
        <DialogHeader className="relative border-b border-border px-5 pb-4 pt-5 pr-12 text-left">
          <div className="mb-2 grid size-9 place-items-center rounded-xl border border-border bg-white text-primary shadow-sm">
            <Headset className="size-4.5 stroke-[2.15]" />
          </div>
          <DialogTitle className="text-base font-mont">
            How can we help?
          </DialogTitle>
          <DialogDescription className="text-[13px] text-gray-01 text-pretty">
            Create a ticket without leaving your work.
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 py-4 min-w-0">
          <SupportTicketForm
            // Keyed on the prefill so opening it a second time with different
            // context rebuilds the form rather than showing the last one's
            // values. Formik only reads initialValues once.
            key={JSON.stringify(prefill ?? {})}
            prefill={prefill}
            compact
            onCancel={() => onOpenChange(false)}
            cancelLabel="Close"
            onDone={() => onOpenChange(false)}
            doneLabel="Done"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
