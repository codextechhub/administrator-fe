import { CircleCheck, TriangleAlert, UserPlus } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type {
  StudentStatus,
  StudentSummary,
} from "@/redux/services/students/students-types";

// ─────────────────────────────────────────────────────────────────────────────
// The directory's header, as ONE card.
//
// This was four separate tiles plus two sibling cards, and the design is
// deliberately not that: it is a single surface with a lead figure, and the
// difference is what the screen says rather than how it looks. Six equal boxes
// give every number the same weight, so nothing leads and a reader has to pick
// out which one matters. Here the roll is the headline at 40px, the split of it
// is the bar directly underneath, and the three numbers that are JOBS rather
// than facts sit below a rule as small tiles - two of which are doors.
//
// Two of the three mini-tiles are buttons and one is not, and that is the same
// rule: Applicants and No-class are worklists somebody is asked to empty, so
// they lead somewhere. "Active today" is a fact about the school, so it does
// not pretend to be clickable.
// ─────────────────────────────────────────────────────────────────────────────

const SEGMENT: Partial<Record<StudentStatus, string>> = {
  ACTIVE: "bg-green-700",
  ENROLLED: "bg-lime-600",
  APPLICANT: "bg-primary",
  SUSPENDED: "bg-red-500",
  GRADUATED: "bg-gray-02",
  TRANSFERRED: "bg-gray-02",
  WITHDRAWN: "bg-gray-02",
  REJECTED: "bg-gray-02",
};

/** The 11.5px uppercase micro-label the design uses over each column. */
function ColumnLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-gray-05">
      {children}
    </p>
  );
}

export function OverviewCard({
  summary,
  loading,
  onPickStatus,
  onOpenApplicants,
  onOpenUnassigned,
  onOpenClass,
}: {
  summary?: StudentSummary;
  loading?: boolean;
  onPickStatus: (status: StudentStatus) => void;
  onOpenApplicants: () => void;
  onOpenUnassigned: () => void;
  onOpenClass: (classId: number) => void;
}) {
  const present = (summary?.by_status ?? []).filter((r) => r.count > 0);
  const total = Math.max(1, summary?.total ?? 0);
  const capacity = summary?.nearest_capacity ?? [];

  return (
    <section className="min-w-0 rounded-xl border border-white-02 bg-white px-6 py-5.5">
      <div className="flex flex-wrap items-start gap-8">
        {/* ── The roll, and how it splits ─────────────────────────────────── */}
        <div className="min-w-0 flex-[1_1_300px]">
          <ColumnLabel>Student records</ColumnLabel>
          {loading ? (
            <Skeleton className="mt-2 h-10 w-24" />
          ) : (
            <p className="mt-2 text-[40px] font-semibold leading-none text-black-01">
              {summary?.total ?? 0}
            </p>
          )}
          <p className="mt-1.5 text-[13px] text-gray-05">
            {summary?.on_roll ?? 0} currently on the roll
          </p>

          <div className="mt-5 flex flex-col gap-2.5">
            <div className="flex h-2.5 overflow-hidden rounded-full bg-gray-04">
              {present.map((row) => (
                <button
                  key={row.status}
                  type="button"
                  title={`${row.label}: ${row.count}`}
                  aria-label={`Filter to ${row.label}`}
                  onClick={() => onPickStatus(row.status)}
                  className={cn("h-2.5", SEGMENT[row.status] ?? "bg-gray-02")}
                  style={{ width: `${(row.count / total) * 100}%` }}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {present.map((row) => (
                <button
                  key={row.status}
                  type="button"
                  onClick={() => onPickStatus(row.status)}
                  className="inline-flex items-center gap-[7px] hover:opacity-70"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      SEGMENT[row.status] ?? "bg-gray-02",
                    )}
                  />
                  <span className="text-[12.5px] text-gray-01">{row.label}</span>
                  <span className="text-[12.5px] font-semibold text-black-01">
                    {row.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Where the next child will be hard to place ──────────────────── */}
        <div className="min-w-0 flex-[1_1_260px]">
          <ColumnLabel>Nearest capacity</ColumnLabel>
          {loading ? (
            <Skeleton className="mt-3.5 h-16 w-full" />
          ) : capacity.length === 0 ? (
            <p className="mt-3.5 text-[13px] text-pretty text-gray-05">
              No class is close to full. There is room to place a new student
              anywhere.
            </p>
          ) : (
            <div className="mt-3.5 flex flex-col gap-[11px]">
              {capacity.map((c) => {
                const pct = c.capacity
                  ? Math.min(100, Math.round((c.used / c.capacity) * 100))
                  : 0;
                const over = c.used > c.capacity;
                const full = c.remaining === 0;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onOpenClass(c.id)}
                    className="flex items-center gap-[11px] text-left hover:opacity-70"
                  >
                    <span className="w-26 shrink-0 truncate text-[12.5px] font-medium text-black-01">
                      {c.name}
                    </span>
                    <span className="block h-[7px] min-w-0 flex-1 overflow-hidden rounded-full bg-gray-04">
                      <span
                        className={cn(
                          "block h-full rounded-full",
                          over ? "bg-red-500" : full ? "bg-amber-500" : "bg-primary",
                        )}
                        style={{ width: `${over ? 100 : pct}%` }}
                      />
                    </span>
                    <span className="w-13 shrink-0 text-right text-xs text-gray-06">
                      {c.used}/{c.capacity}
                    </span>
                    <span
                      className={cn(
                        "w-[62px] shrink-0 text-right text-[11.5px]",
                        over
                          ? "text-red-600"
                          : full
                            ? "text-amber-700"
                            : "text-gray-05",
                      )}
                    >
                      {over
                        ? `Over by ${c.used - c.capacity}`
                        : full
                          ? "Full"
                          : `${c.remaining} free`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── The three numbers that are jobs ───────────────────────────────── */}
      <div className="mt-5.5 grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3 border-t border-white-02 pt-5">
        <MiniTile
          icon={<CircleCheck className="size-4.5" />}
          tone="green"
          value={summary?.active}
          label="Active today"
          loading={loading}
        />
        <MiniTile
          icon={<UserPlus className="size-4.5" />}
          tone="amber"
          value={summary?.applicants}
          label="Awaiting enrolment"
          loading={loading}
          onClick={onOpenApplicants}
        />
        <MiniTile
          icon={<TriangleAlert className="size-4.5" />}
          tone="blue"
          value={summary?.unassigned}
          label={summary?.unassigned ? "Needs a class" : "All placed"}
          loading={loading}
          // The only figure that changes colour, because it is the only one
          // that is a problem rather than a count.
          emphasis={Boolean(summary?.unassigned)}
          onClick={onOpenUnassigned}
        />
      </div>
    </section>
  );
}

const TONE = {
  green: "bg-green-700/10 text-green-800",
  amber: "bg-amber-500/10 text-amber-700",
  blue: "bg-primary/10 text-primary",
} as const;

function MiniTile({
  icon,
  tone,
  value,
  label,
  loading,
  emphasis,
  onClick,
}: {
  icon: React.ReactNode;
  tone: keyof typeof TONE;
  value?: number;
  label: string;
  loading?: boolean;
  emphasis?: boolean;
  onClick?: () => void;
}) {
  const body = (
    <>
      <span
        aria-hidden
        className={cn(
          "grid size-9.5 shrink-0 place-content-center rounded-[10px]",
          TONE[tone],
        )}
      >
        {icon}
      </span>
      <span className="min-w-0">
        {loading ? (
          <Skeleton className="h-5 w-10" />
        ) : (
          <span
            className={cn(
              "block text-xl font-semibold leading-[1.1]",
              emphasis ? "text-amber-700" : "text-black-01",
            )}
          >
            {value ?? 0}
          </span>
        )}
        <span className="block truncate text-xs text-gray-05">{label}</span>
      </span>
    </>
  );

  const shell = "flex items-center gap-3 rounded-[10px] border border-white-02 px-4 py-3.5";

  // A fact is a div and a job is a button. Making all three clickable would
  // promise that "Active today" goes somewhere, and it does not.
  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className={cn(shell, "bg-white text-left hover:border-primary/30 hover:bg-white-05")}
    >
      {body}
    </button>
  ) : (
    <div className={shell}>{body}</div>
  );
}
