import type {
  GoLiveStatus,
  ReadinessState,
  TaskStatus,
} from "@/redux/services/onboarding/onboarding-types";

// The onboarding status vocabulary in words, kept apart from the chips that
// render it: a label is also needed where there is no chip - the ticket context
// block, a toast, an aria-label - and reading it from the same table is what
// stops the same state being called two different things.

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  DONE: "Done",
  SKIPPED: "Skipped",
};

export const READINESS_LABEL: Record<ReadinessState, string> = {
  NOT_READY: "Not ready",
  READY: "Ready",
  PENDING_APPROVAL: "Pending approval",
  LIVE: "Live",
};

export const GO_LIVE_LABEL: Record<GoLiveStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  ACTIVATED: "Activated",
  FAILED: "Activation failed",
};
