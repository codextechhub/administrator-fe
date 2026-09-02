import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * First, last, current and its neighbours, with gaps for the rest.
 *
 * A fixed width at any roll size, which is the whole point: a school with a
 * hundred pages of guardians must not render a hundred buttons and push the
 * card off the side of the screen. `CustomTable` has its own paginator, so this
 * exists for the screens that are card grids rather than tables.
 */
export function Pager({
  page,
  totalPages,
  onGo,
}: {
  page: number;
  totalPages: number;
  onGo: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const wanted = [1, totalPages, page - 1, page, page + 1]
    .filter((n) => n >= 1 && n <= totalPages)
    .filter((n, i, all) => all.indexOf(n) === i)
    .sort((a, b) => a - b);

  const slots: (number | "gap")[] = [];
  wanted.forEach((n, i) => {
    if (i > 0 && n - wanted[i - 1] > 1) slots.push("gap");
    slots.push(n);
  });

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-center gap-1"
    >
      <button
        type="button"
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => onGo(page - 1)}
        className="grid size-8 place-content-center rounded-md text-gray-06 disabled:opacity-40 enabled:hover:bg-gray-03"
      >
        <ChevronLeft className="size-4" />
      </button>

      {slots.map((slot, i) =>
        slot === "gap" ? (
          <span
            key={`gap-${i}`}
            aria-hidden
            className="grid size-8 place-content-center text-gray-02"
          >
            …
          </span>
        ) : (
          <button
            key={slot}
            type="button"
            aria-label={`Page ${slot}`}
            aria-current={slot === page ? "page" : undefined}
            onClick={() => onGo(slot)}
            className={cn(
              "grid size-8 place-content-center rounded-md text-[13px]",
              slot === page
                ? "bg-primary font-semibold text-white"
                : "text-gray-06 hover:bg-gray-03",
            )}
          >
            {slot}
          </button>
        ),
      )}

      <button
        type="button"
        aria-label="Next page"
        disabled={page >= totalPages}
        onClick={() => onGo(page + 1)}
        className="grid size-8 place-content-center rounded-md text-gray-06 disabled:opacity-40 enabled:hover:bg-gray-03"
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}
