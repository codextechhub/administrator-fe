// Support desk shapes, limited to what a school that is still onboarding can
// use. Filing a ticket is open to a PENDING school; reading the desk (lists,
// threads, attachments) is not, and opens at go-live.

export type TicketCategory =
  | "BUG"
  | "SUPPORT"
  | "HELP"
  | "ACCOUNT"
  | "BILLING"
  | "OTHER";

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

/**
 * The context a ticket may carry, which is a closed allowlist on the server.
 *
 * A ticket is read by staff outside the school, so a free-text context field
 * would be a place for one school's words about a named person to land in a
 * queue that was never scoped to them. These three are constants.
 */
export interface OnboardingTicketContext {
  product_area: "Onboarding";
  onboarding_task_key?: string;
  onboarding_readiness_state?: string;
}

export interface CreateTicketBody {
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  context?: OnboardingTicketContext;
}

export interface Ticket {
  id: number;
  /** The reference the school quotes back to support, e.g. "TK-000123". */
  ticket_number: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: string;
  created_at: string;
}
