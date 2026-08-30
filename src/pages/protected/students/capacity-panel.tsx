import { Skeleton } from "@/components/ui/skeleton";
import type { StudentSummary } from "@/redux/services/students/students-types";

/**
 * Which classes are nearly full.
 *
 * A bar per level grows with the school without telling you more. What an
 * administrator can act on is pressure: where will I struggle to place the next
 * child.
 *
 * **The empty state is worded carefully, and that is not fussiness.** The
 * backend returns only classes with five or fewer seats free, so an empty list
 * means "nothing is close to full" - a good state. The design's own wording
 * here is "No class holds any students yet", which at a half-full school would
 * be a plain lie in the one panel that exists to warn you. Until the backend
 * ask lands and this returns the fullest four at any load, it says what it can
 * actually support.
 */
export function CapacityPanel({
  rows,
  loading,
}: {
  rows: StudentSummary["nearest_capacity"];
  loading?: boolean;
}) {
  return (
    <section className="min-w-0 rounded-xl border border-white-02 bg-white p-4">
      <p className="text-xs font-medium text-gray-05">Nearest capacity</p>

      {loading ? (
        <div className="mt-3 grid gap-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : rows.length === 0 ? (
        <p className="mt-3 text-sm text-gray-05">
          No class is close to full. There is room to place a new student
          anywhere.
        </p>
      ) : (
        <ul className="mt-3 grid gap-3">
          {rows.map((c) => {
            const pct = c.capacity
              ? Math.min(100, Math.round((c.used / c.capacity) * 100))
              : 0;
            const over = c.used > c.capacity;
            const full = c.remaining === 0;
            return (
              <li key={c.id} className="min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm text-black-01">{c.name}</span>
                  <span className="shrink-0 text-xs text-gray-05">
                    {c.used}/{c.capacity}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-04">
                  <div
                    className={
                      over ? "h-full bg-red-500" : full ? "h-full bg-amber-500" : "h-full bg-primary"
                    }
                    style={{ width: `${over ? 100 : pct}%` }}
                  />
                </div>
                <p
                  className={`mt-1 text-xs ${
                    over ? "text-red-600" : full ? "text-amber-700" : "text-gray-05"
                  }`}
                >
                  {over
                    ? `Over by ${c.used - c.capacity}`
                    : full
                      ? "Full"
                      : `${c.remaining} ${c.remaining === 1 ? "seat" : "seats"} free`}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
