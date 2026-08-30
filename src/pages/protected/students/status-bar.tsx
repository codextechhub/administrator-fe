import { Skeleton } from "@/components/ui/skeleton";
import type { StudentStatus } from "@/redux/services/students/students-types";

// The roll split as one bar rather than as six more tiles.
//
// Six equal tiles gave every figure the same weight, so nothing led. One bar
// says the same thing and says which parts are large, and each segment is a
// filter - the fastest route to "show me the suspended ones" is to click the
// suspended part of the picture that told you there were any.
const COLOUR: Partial<Record<StudentStatus, string>> = {
  ACTIVE: "bg-green-700",
  ENROLLED: "bg-lime-600",
  APPLICANT: "bg-primary",
  SUSPENDED: "bg-red-500",
  GRADUATED: "bg-gray-400",
  TRANSFERRED: "bg-gray-400",
  WITHDRAWN: "bg-gray-400",
  REJECTED: "bg-gray-400",
};

export function StatusBar({
  rows,
  total,
  loading,
  onPick,
}: {
  rows: { status: StudentStatus; label: string; count: number }[];
  total: number;
  loading?: boolean;
  onPick: (status: StudentStatus) => void;
}) {
  // A status with nobody in it is not a fact worth a segment or a legend entry.
  const present = rows.filter((r) => r.count > 0);
  const denominator = Math.max(1, total);

  return (
    <section className="min-w-0 rounded-xl border border-white-02 bg-white p-4">
      <p className="text-xs font-medium text-gray-05">The roll, by status</p>

      {loading ? (
        <Skeleton className="mt-3 h-2.5 w-full rounded-full" />
      ) : present.length === 0 ? (
        <p className="mt-3 text-sm text-gray-05">No students yet.</p>
      ) : (
        <>
          <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-gray-04">
            {present.map((r) => (
              <div
                key={r.status}
                className={COLOUR[r.status] ?? "bg-gray-400"}
                style={{ width: `${(r.count / denominator) * 100}%` }}
              />
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {present.map((r) => (
              <button
                key={r.status}
                type="button"
                onClick={() => onPick(r.status)}
                className="inline-flex items-center gap-1.5 text-xs text-gray-05 hover:text-black-01"
              >
                <span
                  aria-hidden
                  className={`size-2 rounded-full ${COLOUR[r.status] ?? "bg-gray-400"}`}
                />
                {r.label}
                <span className="font-semibold text-black-01">{r.count}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
