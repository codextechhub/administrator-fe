import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check, SkipForward, TriangleAlert } from "lucide-react";
import type {
  GoLiveStatus,
  ReadinessState,
  TaskStatus,
} from "@/redux/services/onboarding/onboarding-types";
import {
  GO_LIVE_LABEL,
  READINESS_LABEL,
  TASK_STATUS_LABEL,
} from "../onboarding-labels";

// ─────────────────────────────────────────────────────────────────────────────
// The onboarding status vocabulary, in one place.
//
// Every chip below is an existing `Badge` variant - nothing new is invented -
// and the mapping is the contract's, so the same state cannot read green on one
// screen and yellow on another.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A step's status.
 *
 * "Not started" deliberately renders as plain muted text rather than a chip. A
 * step nothing has happened to yet is not a state worth a badge, and dropping it
 * leaves exactly one gray chip on the screen - Skipped - which is the one the
 * school actually needs to pick out at a glance.
 */
export function TaskStatusChip({ status }: { status: TaskStatus }) {
  if (status === "NOT_STARTED") {
    return <span className="text-xs text-gray-05">Not started</span>;
  }
  if (status === "DONE") {
    return (
      <Badge variant="success" className="text-xs">
        <Check className="size-3" />
        {TASK_STATUS_LABEL.DONE}
      </Badge>
    );
  }
  if (status === "SKIPPED") {
    return (
      <Badge variant="inactive" className="text-xs">
        <SkipForward className="size-3" />
        {TASK_STATUS_LABEL.SKIPPED}
      </Badge>
    );
  }
  return (
    <Badge variant="pending" className="text-xs">
      {TASK_STATUS_LABEL.IN_PROGRESS}
    </Badge>
  );
}

/**
 * Readiness. `Live` is the one place the solid primary badge is used in this
 * module, which is what makes it read as an end state rather than another
 * status.
 */
export function ReadinessChip({
  state,
  className,
}: {
  state: ReadinessState;
  className?: string;
}) {
  const variant =
    state === "READY"
      ? "success"
      : state === "PENDING_APPROVAL"
        ? "pending"
        : state === "LIVE"
          ? "default"
          : "inactive";
  return (
    <Badge variant={variant} className={cn("text-xs", className)}>
      {READINESS_LABEL[state]}
    </Badge>
  );
}

/**
 * A go-live request's outcome.
 *
 * Rejected and Failed are both red and they are deliberately not the same red.
 * A person turning a request down and the activation itself breaking are
 * different events with different things to do about them, and a failed
 * activation shown as a rejection tells a school it was turned down when in
 * fact the platform broke.
 */
export function GoLiveStatusChip({ status }: { status: GoLiveStatus }) {
  if (status === "FAILED") {
    return (
      <Badge variant="red" className="text-xs">
        <TriangleAlert className="size-3" />
        {GO_LIVE_LABEL.FAILED}
      </Badge>
    );
  }
  const variant =
    status === "PENDING"
      ? "pending"
      : status === "APPROVED"
        ? "success"
        : status === "ACTIVATED"
          ? "default"
          : "rejected";
  return (
    <Badge variant={variant} className="text-xs">
      {GO_LIVE_LABEL[status]}
    </Badge>
  );
}
