/**
 * Shapes returned by /v1/onboarding/ (backend: apps/schools/vs_onboarding).
 *
 * Every one of these is the SERVER's vocabulary, verbatim. The checklist is not
 * a constant on this side: which steps a school has, what they are called and
 * whether they are required all come down the wire, so a school that does not
 * have a step never sees a slot where it would have been.
 */

/** Where the school stands against the go-live gate. */
export type ReadinessState =
  | "NOT_READY"
  | "READY"
  | "PENDING_APPROVAL"
  | "LIVE";

export type TaskStatus = "NOT_STARTED" | "IN_PROGRESS" | "DONE" | "SKIPPED";

export type GoLiveStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "ACTIVATED"
  | "FAILED";

/**
 * A catalog key. Typed as a union of the keys the backend ships today PLUS a
 * bare string: the catalog is a server constant and a step added there must
 * render (with fallback copy) rather than crash a control room that predates it.
 */
export type TaskKey =
  | "DEFAULT_ROLES"
  | "SCHOOL_METADATA"
  | "ACADEMIC_STRUCTURE"
  | "INITIAL_DATA"
  | "STAFF_INVITATIONS"
  | (string & {});

export interface OnboardingTask {
  key: TaskKey;
  title: string;
  is_required: boolean;
  status: TaskStatus;
  completed_at: string | null;
}

export interface OnboardingCounts {
  done: number;
  skipped: number;
  remaining: number;
  total: number;
}

/**
 * The 90-day onboarding window.
 *
 * `applies` is false for any school that is not PENDING - a live school is not
 * "expiring in 2 days", it is not expiring - and then every date is null.
 */
export interface OnboardingExpiry {
  applies: boolean;
  pending_since: string | null;
  expires_at: string | null;
  days_remaining: number | null;
  warning_sent: boolean;
  warning_sent_at: string | null;
  expiry_days: number;
  warning_days: number;
}

export interface OnboardingState {
  readiness_state: ReadinessState;
  go_live_at: string | null;
  last_validation_at: string | null;
  tasks: OnboardingTask[];
  counts: OnboardingCounts;
  go_live_blocked: boolean;
  /** Catalog keys of the required steps that are not DONE. */
  blocking_tasks: TaskKey[];
  expiry: OnboardingExpiry;
}

export interface GoLiveRequest {
  id: number;
  tenant_slug: string;
  school_name: string;
  status: GoLiveStatus;
  preferred_go_live_at: string;
  note: string;
  acknowledged: boolean;
  requested_by_name: string;
  reviewed_by_name: string;
  reviewed_at: string | null;
  rejection_reason: string;
  /** Correlation id for an activation that broke. Never a human reason. */
  failure_reference: string;
  created_at: string;
}

/** The platform envelope: `{ success, message, data }`. */
export interface Envelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Pagination {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  next: string | null;
  previous: string | null;
}

export interface PaginatedEnvelope<T> {
  success: boolean;
  message: string;
  pagination: Pagination;
  data: T[];
}
