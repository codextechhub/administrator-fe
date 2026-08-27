import { cn } from "@/lib/utils";
import type {
  Program,
  SchoolClass,
} from "@/redux/services/academics/academics-types";
import type { AudiencePick } from "./audience";

// ─────────────────────────────────────────────────────────────────────────────
// Who an event covers, when it covers only some of the school.
//
// **Not in the Claude prototype, and its absence was the sharpest defect in
// it.** The server has narrowed events from the start; the design's drawer
// offered branch scope and nothing else, so a narrowed closure would have
// rendered as covering the whole branch:
//
//     Lekki Branch holds Speech Day on Friday 21 November for the primary
//     school only. As drawn, the row says "Lekki Branch" and the drawer says
//     "School closed: Yes". Mrs Adeyemi teaches JSS1 A, reads that Friday as
//     closed, and does not come in. Thirty JSS1 pupils sit in Block A Room 1 on
//     their own.
//
// **Nothing picked means everybody**, which is the default and six events out
// of seven. It is not "nobody": an empty selection sends no audience at all and
// the event covers the whole of its branch scope. The counter says so in words
// rather than showing "0 selected", because a zero here reads as the opposite
// of what it means.
//
// **A level covers every class under it**, which is what a school means by "the
// whole of JSS1" and saves it naming three arms one at a time. So levels are
// offered first and classes are the finer cut below them.
//
// Only what is visible in the current branch is offered. The server resolves
// these ids through the same scoping and refuses one the caller cannot see,
// failing the WHOLE write - so offering an invisible level would build a
// request that cannot succeed.
// ─────────────────────────────────────────────────────────────────────────────

const has = (picks: AudiencePick[], type: "level" | "class", id: number) =>
  picks.some((p) => p.type === type && p.id === id);

export function AudiencePicker({
  programs,
  classes,
  value,
  onChange,
}: {
  programs: Program[];
  classes: SchoolClass[];
  value: AudiencePick[];
  onChange: (next: AudiencePick[]) => void;
}) {
  const groups = programs
    .map((p) => ({ program: p, levels: p.levels ?? [] }))
    .filter((g) => g.levels.length > 0);

  const toggle = (type: "level" | "class", id: number) =>
    onChange(
      has(value, type, id)
        ? value.filter((p) => !(p.type === type && p.id === id))
        : [...value, { type, id }],
    );

  // Classes whose level is already picked are covered, so ticking them adds
  // nothing. Shown as covered rather than hidden: a reader who picked JSS1
  // needs to see that JSS1 A came with it, or they will go looking for it.
  const coveredLevels = new Set(
    value.filter((p) => p.type === "level").map((p) => p.id),
  );

  if (groups.length === 0 && classes.length === 0) {
    return null;
  }

  return (
    <div className="mt-5 border-t border-white-02 pt-4">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        {/* NOT "Applies to". The branch block directly above already uses
            that, and two adjacent headings reading the same words while
            meaning different things - where, and who - is a form nobody can
            fill in confidently. */}
        <p className="text-[13px] font-medium text-gray-06">Who it covers</p>
        <p className="text-xs text-gray-05">
          {value.length === 0
            ? "Everybody"
            : `${value.length} picked`}
        </p>
      </div>
      <p className="mb-2.5 text-xs text-gray-05 text-pretty">
        Leave this empty and the event covers everybody. Pick year groups or
        classes to narrow it, which is what a closure for the primary school
        only looks like.
      </p>

      {value.length > 0 && (
        <button
          type="button"
          onClick={() => onChange([])}
          className="mb-2.5 text-xs font-medium text-primary hover:underline"
        >
          Clear, and cover everybody
        </button>
      )}

      <div className="grid gap-3">
        {groups.map(({ program, levels }) => (
          <div
            key={program.id}
            className="rounded-lg border border-white-02 bg-white-05 p-3"
          >
            <p className="mb-2 min-w-0 truncate text-[13px] font-medium text-black-01">
              {program.name}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {levels.map((level) => (
                <Chip
                  key={level.id}
                  on={has(value, "level", level.id)}
                  label={level.name}
                  onClick={() => toggle("level", level.id)}
                />
              ))}
            </div>
          </div>
        ))}

        {classes.length > 0 && (
          <div className="rounded-lg border border-white-02 bg-white-05 p-3">
            <p className="mb-2 text-[13px] font-medium text-black-01">
              Single classes
            </p>
            <div className="flex flex-wrap gap-1.5">
              {classes.map((row) => {
                const covered = coveredLevels.has(row.level);
                return (
                  <Chip
                    key={row.id}
                    on={has(value, "class", row.id) || covered}
                    label={row.name}
                    // Its level already covers it, so the tick would be a
                    // second way of saying the same thing.
                    muted={covered}
                    title={
                      covered
                        ? `Already covered by ${row.level_name}`
                        : undefined
                    }
                    onClick={covered ? undefined : () => toggle("class", row.id)}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({
  on,
  muted,
  label,
  title,
  onClick,
}: {
  on: boolean;
  muted?: boolean;
  label: string;
  title?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={on}
      disabled={!onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs",
        on
          ? "border-primary bg-pry-01 text-primary"
          : "border-white-02 bg-white text-gray-06 hover:bg-gray-04",
        muted && "cursor-default opacity-60",
      )}
    >
      {label}
    </button>
  );
}
