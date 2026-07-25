import type { ProxyTargetIdentity } from "@/redux/features/auth/auth-types";

/** A user this admin may proxy — an active member of their own school. */
export type ProxyTarget = ProxyTargetIdentity;

/** The backend's paginated envelope (see core/pagination.py XVSPagination). */
export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    next: string | null;
    previous: string | null;
  };
  data: T[];
}

/** One deduped read-trail row: a path the proxying admin viewed. */
export interface ProxyAccessEntry {
  path: string;
  count: number;
  first_at: string;
  last_at: string;
}

/** A proxy session row as returned by start / end / list. */
export interface ProxySession {
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
