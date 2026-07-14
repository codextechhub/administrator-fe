export interface Auth {
  access?: string
  refresh?: string
  session_id?: number
  user?: User | null
  permissions?: string[]
  school?: SchoolInfo | null
  tenant?: TenantInfo | null
}

// The caller's asserted tenant, from the login / me payload. Every tenant-owned
// request carries ?tenant=<slug>; the slug must match this.
export interface TenantInfo {
  slug: string
  name: string
}

export interface User {
  id: number
  uid: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  phone: string
  gender: string
  user_type: string
  role: string
  status: string
  school_id: number | null
  school_name: string | null
  branch_id: number | null
  branch_name: string | null
  created_at: string
  updated_at: string
  // FLS-strippable admin-metadata fields — absent from the payload for school
  // users who lack `platform.team.view`; the backend lists them in
  // `_stripped_fields` instead (see @/utils/fls). Optional so consumers must
  // guard rather than assume presence.
  password_changed_at?: string | null
  last_login_at?: string
  invited_by_id?: number | null
  invited_by_name?: string | null
}

// Nested school-identity object the backend attaches to the login / me / activation
// payloads for school users. `null` for CX_STAFF (or any user without a school FK);
// `logo` is `null` when no branding logo has been uploaded.
export interface SchoolInfo {
  id: number
  name: string
  slug: string
  logo: string | null
}
