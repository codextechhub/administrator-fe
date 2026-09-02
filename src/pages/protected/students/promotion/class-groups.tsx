import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  PromotionOutcome,
  PromotionPlan,
} from "@/redux/services/students/students-types";

import { OUTCOME, OUTCOMES, destinationOf } from "./outcome";

/**
 * The review step: every candidate, grouped by the class they are leaving.
 *
 * **Collapsed by default, and that is not tidiness.** The review legitimately
 * covers every student, but 154 rows of four buttons is 616 live controls on
 * one screen. The per-class tally answers "is this class right?" without
 * expanding it, and a registrar only opens the class whose tally looks wrong.
 *
 * The tally is computed from the outcome each student currently carries -
 * override first, then the server's default - so it moves as decisions are
 * made. The authoritative counts still come from re-previewing before the
 * confirm step; this is a reading aid, not the number anyone acts on.
 */
export function ClassGroups({
  plan,
  overrides,
  onSetStudent,
  onSetClass,
}: {
  plan: PromotionPlan;
  overrides: Record<string, PromotionOutcome>;
  onSetStudent: (studentId: number, outcome: PromotionOutcome) => void;
  onSetClass: (classId: number, outcome: PromotionOutcome) => void;
}) {
  const [open, setOpen] = useState<Record<number, boolean>>({});

  const outcomeOf = (s: PromotionPlan["students"][number]) =>
    overrides[String(s.id)] ?? s.outcome;

  const groups = plan.level_map
    .map((row) => ({
      ...row,
      students: plan.students.filter((s) => s.from_class_id === row.from_id),
    }))
    .filter((g) => g.students.length > 0);

  if (groups.length === 0) {
    return (
      <p className="rounded-lg bg-white px-4 py-10 text-center text-sm text-gray-05">
        No student in this year is a candidate for promotion.
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      {groups.map((group) => {
        const isOpen = Boolean(open[group.from_id]);
        const tally = group.students.reduce<Record<string, number>>((acc, s) => {
          const key = outcomeOf(s);
          acc[key] = (acc[key] ?? 0) + 1;
          return acc;
        }, {});
        const tallyLine = OUTCOMES.filter((k) => tally[k])
          .map((k) => `${tally[k]} ${OUTCOME[k].label.toLowerCase()}`)
          .join(" · ");

        return (
          <section
            key={group.from_id}
            className="min-w-0 rounded-lg bg-white"
          >
            <div className="flex flex-wrap items-center gap-2 p-3.5">
              <button
                type="button"
                onClick={() =>
                  setOpen((o) => ({ ...o, [group.from_id]: !isOpen }))
                }
                aria-expanded={isOpen}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-gray-05 transition-transform",
                    isOpen && "rotate-180",
                  )}
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-black-01">
                    {group.from} → {destinationOf(plan, group).label}
                  </span>
                  <span className="block truncate text-xs text-gray-05">
                    {group.students.length}{" "}
                    {group.students.length === 1 ? "student" : "students"}
                    {tallyLine ? ` · ${tallyLine}` : ""}
                  </span>
                </span>
              </button>

              {/* Whole-class shortcuts, because a registrar's decision is
                  usually about the class and only sometimes about a child. */}
              <div className="flex shrink-0 flex-wrap gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    onSetClass(
                      group.from_id,
                      group.terminal ? "GRADUATE" : "PROMOTE",
                    )
                  }
                >
                  All {group.terminal ? "graduate" : "promote"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSetClass(group.from_id, "HOLD")}
                >
                  All hold
                </Button>
              </div>
            </div>

            {isOpen && (
              <ul className="border-t border-white-02">
                {group.students.map((s) => {
                  const current = outcomeOf(s);
                  return (
                    <li
                      key={s.id}
                      className="flex flex-wrap items-center justify-between gap-2 border-b border-white-02 p-3 last:border-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm text-black-01">{s.name}</p>
                        <p className="truncate text-xs text-gray-05">
                          {s.student_number || "No admission number"}
                          {s.to_class ? ` · into ${s.to_class}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-1">
                        {OUTCOMES.map((k) => (
                          <button
                            key={k}
                            type="button"
                            aria-pressed={current === k}
                            onClick={() => onSetStudent(s.id, k)}
                            className={cn(
                              "rounded-full px-2.5 py-1 text-xs",
                              current === k
                                ? OUTCOME[k].on
                                : "border border-white-02 text-gray-05 hover:text-black-01",
                            )}
                          >
                            {OUTCOME[k].label}
                          </button>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
