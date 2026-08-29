import { AlertCircle } from "lucide-react";

import type { Problem } from "./form-problems";

/**
 * What is still missing, listed above the save button.
 *
 * The per-field messages are the real answer, but in a drawer that scrolls they
 * can all be off screen at the moment the reader presses save. This sits where
 * the press happened and names each one, so the answer is never somewhere the
 * reader has to go looking for it.
 *
 * `role="alert"` because it appears in response to a press: a reader not
 * looking at the drawer is told the save did not happen and why.
 */
export function ProblemSummary({ problems }: { problems: Problem[] }) {
  if (!problems.length) return null;

  return (
    <div
      role="alert"
      className="mx-5 mb-3 rounded-lg border border-error-text/30 bg-error-text/5 px-3 py-2.5"
    >
      <p className="flex items-center gap-1.5 text-xs font-medium text-error-text">
        <AlertCircle className="size-3.5 shrink-0" />
        {problems.length === 1
          ? "One thing to fix before saving:"
          : `${problems.length} things to fix before saving:`}
      </p>
      <ul className="mt-1 grid gap-0.5 pl-5 text-xs text-gray-06">
        {problems.map((problem) => (
          <li key={problem.field} className="list-disc text-pretty">
            {problem.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
