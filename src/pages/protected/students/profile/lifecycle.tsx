import { cn } from "@/lib/utils";
import type { StudentStatus } from "@/redux/services/students/students-types";

// The happy path, and only the happy path.
const PATH: { status: StudentStatus; label: string }[] = [
  { status: "APPLICANT", label: "Applicant" },
  { status: "ENROLLED", label: "Enrolled" },
  { status: "ACTIVE", label: "Active" },
];

/**
 * Where this student stands on Applicant, Enrolled, Active.
 *
 * **A student who is not on that path gets a sentence instead of a stepper.**
 * Withdrawn, graduated, transferred, suspended and rejected have no position on
 * it, and drawing one would have to invent a place for them: showing a
 * graduated student as "Active" is a lie, and showing them at step zero is a
 * different one. So the component says plainly that they sit outside it.
 */
export function Lifecycle({ status }: { status: StudentStatus }) {
  const index = PATH.findIndex((p) => p.status === status);
  const offPath = index < 0;

  if (offPath) {
    return (
      <p className="mt-3 rounded-lg bg-gray-04 px-3 py-2 text-xs text-gray-05">
        This status sits outside the normal Applicant, Enrolled, Active path.
      </p>
    );
  }

  return (
    <ol className="mt-4 flex min-w-0 items-center gap-1.5">
      {PATH.map((step, i) => {
        const done = i < index;
        const current = i === index;
        return (
          <li key={step.status} className="flex min-w-0 flex-1 items-center gap-1.5">
            <span
              className={cn(
                "grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-semibold",
                done && "bg-green-700 text-white",
                current && "bg-primary text-white",
                !done && !current && "bg-gray-04 text-gray-05",
              )}
            >
              {i + 1}
            </span>
            <span
              className={cn(
                "truncate text-xs",
                current ? "font-semibold text-black-01" : "text-gray-05",
              )}
            >
              {step.label}
            </span>
            {i < PATH.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "h-px min-w-2 flex-1",
                  done ? "bg-green-700" : "bg-gray-04",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
