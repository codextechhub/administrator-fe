import type { ReactNode } from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

/**
 * The frame all five student drawers sit in.
 *
 * One shell rather than five, because the differences between them are the
 * fields and nothing else: same width, same header, same footer, same
 * disabled-until-valid rule. Five copies would drift, and the first thing to
 * drift is which of them can be saved empty.
 *
 * `w-full sm:max-w-md` is the house rule - full bleed on a phone, a panel above
 * it. The body scrolls, the footer does not, so Save is reachable without
 * scrolling to the end of a long form on a small screen.
 */
export function DrawerShell({
  open,
  onClose,
  title,
  subtitle,
  children,
  saveLabel,
  onSave,
  canSave,
  saving,
  destructive,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  saveLabel: string;
  onSave: () => void;
  canSave: boolean;
  saving?: boolean;
  /** Colours the primary button for a move that takes a child off the roll. */
  destructive?: boolean;
}) {
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 bg-white p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b border-border px-5 pb-4 pt-5 pr-12 text-left">
          <SheetTitle className="font-mont text-base">{title}</SheetTitle>
          {subtitle && (
            <SheetDescription className="text-[13px] text-gray-01">
              {subtitle}
            </SheetDescription>
          )}
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border px-5 py-3">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={!canSave || saving}
            className={destructive ? "bg-red-600 hover:bg-red-700" : undefined}
          >
            {saving ? "Saving…" : saveLabel}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** A labelled field. `error` shows only once the field has been touched. */
export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-gray-05">{label}</span>
      {children}
      {error ? (
        <span className="text-xs text-red-600">{error}</span>
      ) : hint ? (
        <span className="text-xs text-gray-05">{hint}</span>
      ) : null}
    </label>
  );
}

export const inputClass =
  "h-9 w-full rounded-lg border border-white-02 bg-white px-3 text-sm outline-none focus:border-primary";

export const errorInputClass =
  "h-9 w-full rounded-lg border border-red-400 bg-white px-3 text-sm outline-none focus:border-red-500";
