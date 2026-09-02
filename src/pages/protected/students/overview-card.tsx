import { Skeleton } from "@/components/ui/skeleton";
import { Panel } from "@/components/custom/surface";
import { cn } from "@/lib/utils";
import type {
  StudentStatus,
  StudentSummary,
} from "@/redux/services/students/students-types";

import type { QueueRow } from "./work-queue";

// ─────────────────────────────────────────────────────────────────────────────
// The directory's header: what the school IS on the left, what needs a person
// on the right.
//
// The right half used to be Nearest capacity - the four fullest classes, with a
// bar each. Three of those four rows read "4 free", "9 free", "1 free", which
// are non-events, and the one row that mattered sat among them at the same
// weight. The bars added nothing: at 26/30 and 31/40 they all look nearly full,
// so a reader ends up reading the digits anyway.
//
// It is now a queue of decisions, each one a named record and a verb. The three
// mini-tiles that sat under a rule here - Active today, Awaiting enrolment,
// Needs a class - are gone with it: the moment the queue names Emeka Obi, a
// tile reading "1 Needs a class" is the same fact with the name taken out.
// Removing them is what pays for the queue in vertical space.
//
// Capacity as a whole belongs to Classes & Transfers, which is in the nav with
// a badge on it. What survives here is the one capacity fact that was doing
// work: a class over its limit, shown as the thing blocking a placement.
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
  queue,
  overflow,
  settledLine,
  onPickStatus,
  onAct,
  onOpenApplicants,
}: {
  summary?: StudentSummary;
  loading?: boolean;
  queue: QueueRow[];
  /** Rows past the cap, offered as "N more waiting". */
  overflow: number;
  /** What an empty queue should say instead of nothing. */
  settledLine?: string;
  onPickStatus: (status: StudentStatus) => void;
  onAct: (row: QueueRow) => void;
  onOpenApplicants: () => void;
}) {
  const present = (summary?.by_status ?? []).filter((r) => r.count > 0);
  const total = Math.max(1, summary?.total ?? 0);

  return (
    <Panel as="section" className="min-w-0 px-6 py-5.5">
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
                  aria-label={`Filter to ${row.label}`}
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

        {/* ── What needs a person today ───────────────────────────────────── */}
        <div className="min-w-0 flex-[1_1_320px]">
          <ColumnLabel>Needs you today</ColumnLabel>
          {loading ? (
            <div className="mt-3.5 grid gap-2.5">
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
            </div>
          ) : queue.length === 0 ? (
            // An empty queue is confirmation, not a panel that failed to load,
            // so it says what was last cleared rather than just "nothing".
            <div className="mt-3.5">
              <p className="text-[13px] text-black-01">
                Nothing needs attention.
              </p>
              <p className="mt-1 text-xs text-pretty text-gray-05">
                {settledLine ??
                  "Every student on the roll has a class and no application is waiting."}
              </p>
            </div>
          ) : (
            <ul className="mt-3.5 flex flex-col gap-2">
              {queue.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => onAct(row)}
                    // The verb and the subject, spoken together. The visible row
                    // reads as three parts side by side, which a screen reader
                    // would otherwise announce as an unlabelled button followed
                    // by a bare "Place".
                    aria-label={`${row.actionLabel}: ${row.title}`}
                    className="group flex w-full min-w-0 items-center gap-2.5 rounded-lg border border-white-02 bg-white px-3 py-2 text-left hover:border-primary/30 hover:bg-white-05"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "grid size-5.5 shrink-0 place-content-center rounded-md text-[11px] font-bold",
                        row.tone === "alert"
                          ? "bg-amber-500/15 text-amber-700"
                          : "bg-primary/10 text-primary",
                      )}
                    >
                      {row.marker}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-black-01">
                        {row.title}
                      </span>
                      <span className="block truncate text-[11.5px] text-gray-05">
                        {row.detail}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-primary group-hover:underline">
                      {row.actionLabel}
                    </span>
                  </button>
                </li>
              ))}
              {overflow > 0 && (
                <li>
                  <button
                    type="button"
                    onClick={onOpenApplicants}
                    className="text-xs text-gray-05 underline-offset-2 hover:text-black-01 hover:underline"
                  >
                    {overflow} more waiting
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
    </Panel>
  );
}
