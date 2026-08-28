import { EllipsisVertical, type LucideIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─────────────────────────────────────────────────────────────────────────────
// The per-row menu in an Action column.
//
// One component for the four tables in this module, which had four copies of it
// and two faults in every copy:
//
//   * the trigger was the character "⋮" in a ghost button - a glyph at text
//     weight, which on a grey row is barely there. It is the same
//     EllipsisVertical icon CustomTable uses for its own row menu now.
//   * the cell was left-aligned under a centred header. CustomTable centres any
//     column called "Action" in the header and leaves the body cell to the
//     caller, so the two only line up if the caller centres too.
//
// CustomTable's built-in `dropDown` is not used, and the reason is per-row
// labels: its list is static strings, and a room's middle item reads
// "Deactivate" or "Activate" depending on the row it is on. A menu that cannot
// say which of the two it will do is worse than one more component.
// ─────────────────────────────────────────────────────────────────────────────

export interface RowAction {
  label: string;
  icon?: LucideIcon;
  /** Renders in the destructive style. Does not confirm - the caller does. */
  destructive?: boolean;
  onSelect: () => void;
}

export function RowActions({
  label,
  actions,
}: {
  /** Names the row for anyone not looking at the screen. */
  label: string;
  actions: (RowAction | false | null | undefined)[];
}) {
  const items = actions.filter(Boolean) as RowAction[];
  // A reader who may do nothing to this row gets no control at all, rather
  // than a button that opens an empty menu.
  if (!items.length) return null;

  return (
    <div className="flex justify-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={label}
            // The row underneath is usually clickable too, so the press must
            // stop here or the menu opens behind whatever the row just did.
            onClick={(e) => e.stopPropagation()}
            className="grid size-8 place-content-center rounded-full text-gray-06 transition-colors hover:bg-gray-04 hover:text-black-01 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <EllipsisVertical className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          {items.map((action) => (
            <DropdownMenuItem
              key={action.label}
              onSelect={action.onSelect}
              variant={action.destructive ? "destructive" : undefined}
            >
              {action.icon && <action.icon className="size-4" />}
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
