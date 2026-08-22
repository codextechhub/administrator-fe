/** One of the school's roles, as the roles table renders it. */
export interface SchoolRole {
  id: number;
  key: string;
  name: string;
  status: string;
  /**
   * True for the baseline CodeX seeded. These are the "default role templates"
   * the design asks a school to confirm; everything else is a role the school
   * added itself.
   */
  is_system_role: boolean;
  /** A locked role's permissions are CodeX's to change, not the school's. */
  is_locked: boolean;
  assigned_users_count: number;
  permissions_count: number;
  branch: number | null;
}

/** One grant on a role, as the detail payload carries it. */
export interface RolePermissionRow {
  permission: string;
  granted: boolean;
}

/** A role with everything it holds. */
export interface SchoolRoleDetail extends SchoolRole {
  description: string;
  role_permissions: RolePermissionRow[];
}

/** One permission a role could be given. */
export interface CataloguePermission {
  key: string;
  /** The sentence beside the checkbox; never a raw key. */
  label: string;
  resource: string;
  action: string;
  sensitivity: string;
  /** Flows through an approval rather than taking effect on save. */
  is_restricted: boolean;
}

/** The catalogue, grouped the way the drawer groups it. */
export interface CatalogueModule {
  module: string;
  permissions: CataloguePermission[];
}

/** What creating a role of the school's own needs. */
export interface NewRole {
  key: string;
  name: string;
  description?: string;
  permission_keys?: string[];
}
