import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  subscribeToApprovalConfirm,
  type ApprovalConfirmRequest,
} from "@/lib/approval-confirm";

/**
 * "Nobody will review this. Post it anyway?"
 *
 * Mounted once, above every screen, because the request it answers can come
 * from any of them - including the finance screens this app renders out of
 * @xvs/finance and does not own.
 *
 * The reason is required. Posting a credit note that nobody approved is a thing
 * the school may legitimately need to do and is also the shape of every quiet
 * loss: the record has to say who decided and why, or the audit entry is a
 * timestamp with nothing behind it. That entry is written server-side, so a
 * reason typed here is the only part a person supplies.
 */
export function ApprovalConfirmDialog() {
  const [pending, setPending] = useState<ApprovalConfirmRequest | null>(null);
  const [reason, setReason] = useState("");

  useEffect(
    () =>
      subscribeToApprovalConfirm((next) => {
        setPending(next);
        if (next) setReason("");
      }),
    [],
  );

  const decline = () => pending?.settle(null);

  return (
    <Dialog
      open={pending !== null}
      onOpenChange={(next) => {
        // Dismissing is declining. The alternative - treating a stray click as
        // consent to post unreviewed - is the one reading of a closed dialog
        // that must never be possible.
        if (!next) decline();
      }}
    >
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-mont">
            <ShieldAlert className="size-4 text-gray-01" />
            Post without approval?
          </DialogTitle>
          <DialogDescription className="text-pretty">
            {pending?.message}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label
            htmlFor="approval-confirm-reason"
            className="text-[13px] font-medium text-black-01"
          >
            Why are you posting it without approval?
          </label>
          <Textarea
            id="approval-confirm-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="e.g. Approval steps not set up yet; agreed with the head teacher."
            rows={3}
          />
          <p className="text-xs text-gray-05 text-pretty">
            This is recorded against your name.
          </p>
        </div>

        <DialogFooter className="gap-2.5">
          <Button variant="outline" onClick={decline}>
            Cancel
          </Button>
          <Button
            disabled={!reason.trim()}
            onClick={() => pending?.settle(reason.trim())}
          >
            Post without approval
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
