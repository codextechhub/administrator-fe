/**
 * PermissionGate - conditionally renders UI based on the user's permissions.
 * Import permission codes from @/permissions and use P.* constants.
 *
 * Hide entirely (default):
 *   <PermissionGate permission={P.ENROLL_STUDENT}>
 *     <Button>Enroll Student</Button>
 *   </PermissionGate>
 *
 * Render a fallback instead:
 *   <PermissionGate permission={P.MODIFY_STUDENT} fallback={<p>Read-only</p>}>
 *     <Button>Edit Student</Button>
 *   </PermissionGate>
 *
 * Array - any one (default):
 *   <PermissionGate permission={[P.ENROLL_STUDENT, P.MODIFY_STUDENT]}>
 *     <Button>Save</Button>
 *   </PermissionGate>
 *
 * Withhold for a reason other than permission (e.g. the year being read is
 * archived and the server refuses every write into it):
 *   <PermissionGate permission={P.CREATE_CLASS} disabled={readOnlyYear}>
 *     <Button>Add class</Button>
 *   </PermissionGate>
 *
 * Array - must have all:
 *   <PermissionGate permission={[P.BROWSE_STUDENTS, P.MODIFY_STUDENT]} mode="all">
 *     <Button>Edit</Button>
 *   </PermissionGate>
 */
import { type PermissionCode } from "@/permissions";
import { usePermissions } from "@/hooks/use-permissions";

interface Props {
  permission: PermissionCode | PermissionCode[];
  mode?: "any" | "all";
  /**
   * Withhold the children even when the permission is held.
   *
   * For state, not for rights: the caller MAY do this, but not right now and
   * not here. Same treatment as a missing permission, because the reader does
   * not need to know which of the two stopped it.
   */
  disabled?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export default function PermissionGate({ permission, mode = "any", disabled = false, fallback = null, children }: Props) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  const codes = Array.isArray(permission) ? permission : [permission];

  const allowed =
    disabled
      ? false
      : codes.length === 1
        ? hasPermission(codes[0])
        : mode === "all"
          ? hasAllPermissions(...codes)
          : hasAnyPermission(...codes);

  return allowed ? <>{children}</> : <>{fallback}</>;
}
