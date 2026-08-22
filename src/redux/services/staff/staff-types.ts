/** One person on the school's staff list, as `/v1/i/me/staff/` returns them. */
export interface SchoolStaffMember {
  id: number;
  full_name: string;
  email: string;
  /** The account's lifecycle state: PENDING until the invitation is accepted. */
  status: string;
  /** The display name of the role they hold, or "" when they hold none yet. */
  role: string;
  /** "" for somebody who works across the whole school rather than one branch. */
  branch_name: string;
  invited_at: string | null;
  /** The server's own answer, so the row's button never contradicts the API. */
  can_resend: boolean;
}

/** A role this school can hand out, shipped alongside the list. */
export interface StaffRoleOption {
  value: string;
  label: string;
}

/**
 * The list response.
 *
 * `role_options` rides along with the page rather than coming from a second
 * call: the invite form has to offer the roles THIS school actually has, and a
 * form that hard-codes role keys drifts the moment a school adds one.
 */
export interface SchoolStaffList {
  success: boolean;
  message: string;
  pagination?: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    next: string | null;
    previous: string | null;
  };
  data: SchoolStaffMember[];
  role_options?: StaffRoleOption[];
}

/**
 * What an invitation needs.
 *
 * The design's form asks for an email and a role only. Both names are asked for
 * here as well, because the invitation email greets the person by name and the
 * staff list prints it: guessing "Bursar Fees" out of bursar.fees@ is a name
 * nobody chose, shown to them in the first message the platform ever sends.
 */
export interface StaffInvite {
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  /** Optional posting. Left out, the person works across the whole school. */
  branch?: string;
}
