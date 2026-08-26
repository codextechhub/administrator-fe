import { type ReactNode, useState } from "react";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// The rows the school is not running in the year being read.
//
// A programme and a department both outlive the year they ran in, so "we
// stopped running Commercial" cannot be a delete (refused while last year's
// levels point at it) and must not be an archive (that hides it from the year
// it DID run). It is expressed by having nothing in the new year, and this is
// how a screen shows that: present, out of the way, one tap from starting
// again.
//
// `open` is controllable from outside for one reason: something JUST CREATED
// has nothing in it either, and would drop into a closed fold and read as
// having vanished. The screen that creates it opens the fold.
// ─────────────────────────────────────────────────────────────────────────────

export function DormantFold({
  count,
  open,
  onOpenChange,
  children,
}: {
  count: number;
  /** Controlled when given; self-managed and closed by default when not. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}) {
  const [own, setOwn] = useState(false);
  const isOpen = open ?? own;
  const toggle = () => (onOpenChange ? onOpenChange(!isOpen) : setOwn(!isOpen));

  if (count === 0) return null;

  return (
    <div className="grid min-w-0 grid-cols-1 gap-3">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        className="flex items-center gap-2 px-1 pt-2 text-left text-[13px] text-gray-05 hover:text-black-01"
      >
        <ChevronRight
          className={cn("size-3.5 transition-transform", isOpen && "rotate-90")}
        />
        No levels yet
        <span className="text-gray-05">({count})</span>
      </button>
      {isOpen && children}
    </div>
  );
}
