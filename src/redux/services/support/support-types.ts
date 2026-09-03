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

// The product areas the server will accept, owned by @/lib/support/ticket-context
// because that is where the mapping from this app's screens to them lives.
export type { ProductArea } from "@/lib/support/ticket-context";
import type { ProductArea } from "@/lib/support/ticket-context";

/**
 * The context a ticket may carry, which is a closed allowlist on the server.
 *
 * A ticket is read by staff outside the school, so a free-text context field
 * would be a place for one school's words about a named person to land in a
 * queue that was never scoped to them. Every key here is a closed vocabulary or
 * a checked shape, and the server refuses any key it does not know.
 *
 * `route_pattern` is the address with its record ids removed - "/students/:id",
 * never "/students/1042" - which is the difference between naming a screen and
 * naming a child to a stranger. See @/lib/support/ticket-context for the rules
 * and how the pattern is built.
 */
export interface TicketContext {
  product_area?: ProductArea;
  route_pattern?: string;
  /** Pre-live only: which setup step the person was working through. */
  onboarding_task_key?: string;
  /** Pre-live only: how far off go-live the school was at the time. */
  onboarding_readiness_state?: string;
}

export interface CreateTicketBody {
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  context?: TicketContext;
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
