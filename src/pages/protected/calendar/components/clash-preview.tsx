import { AlertTriangle, Loader2 } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import type { ClashWarning } from "@/redux/services/calendar/calendar-types";

/**
 * What this would clash with, said while the form is still open.
 *
 * A clash discovered afterwards reaches the school as a toast about Mr Eze,
 * over a grid it has already changed. The server can answer from the draft
 * before the write, so the answer belongs where the decision is made.
 *
 * **The server answers, not this component.** It calls the preview endpoint,
 * which runs the same clash function the write runs. Working it out here would
 * be a second implementation of rules that span the whole tenant and redact the
 * other side of a clash the reader may not see, and it would drift from the
 * real engine the first time either changed.
 *
 * **A clash still saves. It just has to be meant.** The module's standing rule
 * is that a clash is a warning and not a refusal - a school building a grid
 * over several sittings needs to save a state it knows is wrong, and publishing
 * is where the refusal lives. So this does not block the save; it makes the
 * school say out loud that it knows. The tick is the whole difference between
 * a mistake and a decision.
 */

export function ClashPreview({
  warnings,
  refusal,
  asking,
  acknowledged,
  onAcknowledge,
  confirmLabel,
}: {
  warnings: ClashWarning[];
  refusal?: string | null;
  asking: boolean;
  acknowledged: boolean;
  onAcknowledge: (next: boolean) => void;
  /** What the reader is agreeing to, in this form's words. */
  confirmLabel: string;
}) {
  if (refusal) {
    return (
      <div
        role="alert"
        className="mt-4 rounded-lg border border-error-text/30 bg-error-text/5 px-3 py-2.5"
      >
        <p className="flex items-center gap-1.5 text-xs font-medium text-error-text">
          <AlertTriangle className="size-3.5 shrink-0" />
          This cannot be saved
        </p>
        {/* No tick offered. The server will not accept this however firmly the
            reader agrees to it, and a control that implied otherwise would be
            a lie about what the button does. */}
        <p className="mt-1 text-xs text-gray-06 text-pretty">{refusal}</p>
      </div>
    );
  }

  if (asking && warnings.length === 0) {
    return (
      <p className="mt-4 flex items-center gap-1.5 text-xs text-gray-05">
        <Loader2 className="size-3.5 animate-spin" />
        Checking for clashes…
      </p>
    );
  }

  if (warnings.length === 0) return null;

  return (
    <div
      role="alert"
      className="mt-4 rounded-lg border border-yellow-01/50 bg-yellow-01/5 px-3 py-2.5"
    >
      <p className="flex items-center gap-1.5 text-xs font-medium text-yellow-02">
        <AlertTriangle className="size-3.5 shrink-0" />
        {warnings.length === 1
          ? "This clashes with something"
          : `This clashes with ${warnings.length} things`}
      </p>
      <ul className="mt-1.5 grid gap-1">
        {warnings.map((warning, index) => (
          <li
            key={`${warning.code}-${index}`}
            className="text-xs text-gray-06 text-pretty"
          >
            {warning.detail}
          </li>
        ))}
      </ul>
      <label className="mt-2.5 flex cursor-pointer items-start gap-2 border-t border-yellow-01/40 pt-2.5">
        <Checkbox
          checked={acknowledged}
          onCheckedChange={(next) => onAcknowledge(next === true)}
          className="mt-0.5"
        />
        <span className="text-xs text-gray-06 text-pretty">{confirmLabel}</span>
      </label>
    </div>
  );
}
