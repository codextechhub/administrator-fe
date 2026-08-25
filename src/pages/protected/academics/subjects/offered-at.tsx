import { cn } from "@/lib/utils";
import type { Program } from "@/redux/services/academics/academics-types";

/**
 * Which levels a subject is taught at.
 *
 * Grouped by programme rather than one flat wrap of chips, and the grouping is
 * doing work: a school with sixteen levels reads as four short rows instead of
 * a wall, and "Mathematics is taught right through Primary" is one tap on that
 * programme's All rather than six taps on six chips.
 *
 * What is offered here is the complete answer, because the server takes it as
 * one: `level_ids` REPLACES the set. So a level not ticked is a level the
 * subject is not offered at - there is no third state, and nothing is left
 * alone by omission.
 *
 * Only levels visible in the current branch appear. That is the same list the
 * server will accept - it resolves ids through `scope_to_visible_branches` and
 * refuses one the caller cannot see, failing the WHOLE call - so offering an
 * invisible level here would build a request that cannot succeed.
 */
export function OfferedAt({
  programs,
  selected,
  onChange,
}: {
  programs: Program[];
  selected: number[];
  onChange: (next: number[]) => void;
}) {
  const groups = programs
    .map((p) => ({ program: p, levels: p.levels ?? [] }))
    .filter((g) => g.levels.length > 0);

  const toggle = (id: number) =>
    onChange(
      selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id],
    );

  if (groups.length === 0) {
    return (
      <div className="mt-5 border-t border-white-02 pt-4">
        <p className="mb-2 text-[13px] font-medium text-gray-06">Offered at</p>
        <p className="rounded-lg border border-white-02 bg-white-05 px-3 py-2.5 text-sm text-gray-05 text-pretty">
          No levels are in view, so there is nothing to offer this subject at
          yet. Add levels on the Programmes &amp; Levels screen first, or widen
          the branch filter.
        </p>
      </div>
    );
  }

  const total = groups.reduce((n, g) => n + g.levels.length, 0);
  const chosen = groups
    .flatMap((g) => g.levels)
    .filter((l) => selected.includes(l.id)).length;

  return (
    <div className="mt-5 border-t border-white-02 pt-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] font-medium text-gray-06">Offered at</p>
        <p className="text-xs text-gray-05">
          {chosen === 0
            ? "No levels picked yet"
            : `${chosen} of ${total} levels`}
        </p>
      </div>

      <div className="grid gap-3">
        {groups.map(({ program, levels }) => {
          const ids = levels.map((l) => l.id);
          const picked = ids.filter((id) => selected.includes(id));
          const allOn = picked.length === ids.length;
          return (
            <div
              key={program.id}
              className="rounded-lg border border-white-02 bg-white-05 p-3"
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="min-w-0 truncate text-[13px] font-medium text-black-01">
                  {program.name}
                </p>
                <div className="inline-flex shrink-0 items-center gap-2">
                  <span className="text-xs text-gray-05">
                    {picked.length} of {ids.length}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onChange(
                        allOn
                          ? selected.filter((id) => !ids.includes(id))
                          : [...new Set([...selected, ...ids])],
                      )
                    }
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    {allOn ? "Clear" : "All"}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {levels.map((level) => {
                  const on = selected.includes(level.id);
                  return (
                    <button
                      key={level.id}
                      type="button"
                      onClick={() => toggle(level.id)}
                      aria-pressed={on}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs",
                        on
                          ? "border-primary bg-pry-01 text-primary"
                          : "border-white-02 bg-white text-gray-06 hover:bg-gray-04",
                      )}
                    >
                      {level.name}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
