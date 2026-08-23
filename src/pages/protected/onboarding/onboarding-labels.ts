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

/**
 * Permission module slugs, in the words a school uses.
 *
 * The catalogue groups by the registry's own module slug ("finance",
 * "config"), which is a developer's name for the bucket. A school reading its
 * own role sees the heading, so the heading has to be theirs. An unknown slug
 * falls through to itself rather than being hidden: a module added on the
 * backend must still show its permissions, even before this table knows what
 * to call it.
 */
export const MODULE_LABEL: Record<string, string> = {
  academics: "Academics",
  communication: "Messages and notices",
  config: "Settings",
  exports: "Exports and reports",
  finance: "Finance",
  import: "Data import",
  onboarding: "Onboarding",
  payments: "Payments",
  platform: "Accounts and audit",
  procurement: "Procurement",
  school: "School and people",
  tickets: "Support tickets",
  todo: "Tasks",
  workflow: "Approvals",
};

/**
 * Import dataset slugs, in the words a school uses.
 *
 * The server names datasets for the engine that loads them ("branches",
 * "bank_statements"). A school picking one reads this instead. Unknown slugs
 * fall through to a tidied version of the slug rather than being hidden: the
 * server decides what a school may upload, and a dataset added there must still
 * be offered here before this table has heard of it.
 */
const DATASET_LABEL: Record<string, string> = {
  branches: "Branches",
  bank_statements: "Bank statements",
};

const DATASET_BLURB: Record<string, string> = {
  branches: "Your campuses, and the administrator who runs each one.",
  bank_statements: "Transactions from your bank, for reconciling payments.",
};

/**
 * A dataset's name, or a readable fallback for one this build predates.
 *
 * Takes an optional slug on purpose. These helpers are handed server data, and
 * a field the server does not send yet must render as a dash rather than crash
 * the screen - which is exactly what happened the first time this ran against
 * real uploads, because the batch list did not expose `dataset_type` at all.
 */
export function datasetLabel(slug?: string | null): string {
  if (!slug) return "-";
  return (
    DATASET_LABEL[slug] ??
    slug.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())
  );
}

/** One line on what a dataset holds, or "" when this build cannot say. */
export function datasetBlurb(slug?: string | null): string {
  if (!slug) return "";
  return DATASET_BLURB[slug] ?? "";
}
