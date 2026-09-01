export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}

export interface LoginSession {
  id: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    role?: string;
  };
  school: { id: string; name: string; slug: string } | null;
  ip_address: string | null;
  user_agent: string;
  device_label: string;
  last_seen_at: string;
  is_active: boolean;
  ended_at: string | null;
  end_reason: string;
  created_at: string;
}

export interface AuthAttempt {
  id: string;
  email_entered: string;
  user: { id: string; email: string; first_name: string; last_name: string; full_name: string } | null;
  school: { id: string; name: string; slug: string } | null;
  ip_address: string | null;
  user_agent: string;
  result: "SUCCESS" | "FAIL" | "BLOCKED";
  failure_code: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AccountLockout {
  id: string;
  user: { id: string; email: string; first_name: string; last_name: string; full_name: string };
  locked_until: string | null;
  locked_reason: string;
  failure_count: number;
  last_failure_at: string | null;
  last_failure_ip: string | null;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface PasswordReset {
  id: number;
  user: { id: string; email: string; full_name: string; first_name: string; last_name: string };
  // This list crosses tenants, so a row has to say which school it belongs to:
  // revoking is irreversible for whoever holds the link, and two schools can
  // easily have accounts under similar names.
  tenant_id: number;
  tenant_slug: string;
  tenant_name: string;
  requested_by: "SELF" | "ADMIN";
  requested_ip: string | null;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface MyPasswordReset {
  id: number;
  requested_by: "SELF" | "ADMIN";
  requested_ip: string | null;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface ImpersonationSession {
  id: number;
  staff_user: number;
  staff_email: string;
  staff_type_label: string;
  tenant: number;
  tenant_name: string;
  tenant_slug: string;
  target_user: number;
  target_email: string;
  target_type_label: string;
  justification: string;
  status: "ACTIVE" | "ENDED" | "EXPIRED";
  started_at: string;
  ends_at: string | null;
  ended_at: string | null;
  last_activity_at: string;
  access_log: ProxyAccessEntry[];
  created_at: string;
  updated_at: string;
}

/** One deduped read-trail row: a path the proxier viewed during the session. */
export interface ProxyAccessEntry {
  path: string;
  count: number;
  first_at: string;
  last_at: string;
}

export interface ProxyTarget {
  id: number;
  email: string;
  full_name: string;
  tenant_kind: string;
  role: string;
  tenant_slug: string;
  tenant_name: string;
  school_name: string | null;
}
