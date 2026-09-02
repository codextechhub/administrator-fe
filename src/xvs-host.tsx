// This app's implementation of @xvs/finance's host contract.
//
// The package declares HostContract and asserts against it, so if anything
// here drifts - a missing member, a renamed field - the build fails rather
// than a bursar meeting an empty branch dropdown. See the package's host.ts.
//
// Each member is a thing both products have but reach differently: the console
// asks its tenant-admin services, this app asks its own.
//

import { useEffect, type ComponentType } from "react";
// The REAL contract types, from the package. Previously copied locally,
// which meant this app satisfied a copy and the compile-time assertion
// checked nothing here.
import type {
  HostAvatarProps, HostBranch, HostPerson, HostQueryResult, HostExportProps,
} from "@xvs/finance/host";
import { ExportButton } from "@/components/custom/export-button";
import { returnInitial } from "@/utils/helpers";

import { useGetMyBranchesQuery } from "@/redux/services/branches/branches-api";
import { useGetSchoolStaffQuery } from "@/redux/services/staff/staff-api";
import { useSchoolLogo } from "@/hooks/use-school-logo";


/** Every branch this caller may see. The server scopes it by their grants. */
export function useBranches(): HostQueryResult<HostBranch> {
  const { data, isLoading, isError } = useGetMyBranchesQuery();
  return { data: data?.data, isLoading, isError };
}

/** Everyone this caller may name on an approval. */
export function useDirectory(): HostQueryResult<HostPerson> {
  const { data, isLoading, isError } = useGetSchoolStaffQuery();
  // full_name, email, role and status line up with HostPerson already; `id`
  // does not, because this app's staff row numbers people and the contract
  // names them with a string. Mapped rather than widened: an id that is
  // sometimes a number and sometimes a string is how a Map lookup starts
  // silently missing.
  const rows = data?.data.map((s) => ({
    id: String(s.id), full_name: s.full_name, email: s.email,
    role: s.role, status: s.status,
  }));
  return { data: rows, isLoading, isError };
}

/** The school's own logo, not the platform's. */
export const AppLogo: ComponentType<{ animate?: boolean; className?: string }> = ({ className }) => {
  const logo = useSchoolLogo();
  return logo
    ? <img src={logo} alt="" className={className} />
    : <span className={className} aria-hidden="true" />;
};

/** Scroll the sidebar so the active item is visible.
 *
 *  This app's sidebar is short enough that it does not scroll, so there is
 *  nothing to reveal. Declared rather than omitted because the contract
 *  requires it, and a no-op is the honest implementation.
 */

// The school app has its own export affordance already, and it is the right one
// to use: it reads THIS app's permission codes (BROWSE_EXPORT_CATALOGUE and
// RUN_EXPORT) and refuses while the tenant is still pending. The console's
// version reads console codes that do not exist here.
//
// Adapted rather than widened. ExportButton requires `params` and takes no
// booleans; the contract makes params optional and allows them. The gap is
// closed here, in the host, which is what the host module is for. The props the
// school button has no concept of - entity, variant, disabledReason - are
// dropped deliberately: a school runs one set of books, so `entity` is
// meaningless, and the rest are console styling.
export function QuickExportButton({ screen, params, label }: HostExportProps) {
  const scalars: Record<string, string | number | undefined> = {};
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v === undefined) continue;
    scalars[k] = typeof v === "boolean" ? String(v) : v;
  }
  return <ExportButton screen={screen} params={scalars} label={label} />;
}

// This app has no staff-photo service, so the avatar is initials only. That is
// a complete answer rather than a stub: the package asks for an avatar, not for
// a photograph, and a school that later adds photos changes this one function.
export function UserAvatar({ name, className }: HostAvatarProps) {
  return (
    <span
      className={
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full " +
        "bg-primary/10 text-xs font-semibold text-primary " + (className ?? "")
      }
      aria-hidden="true"
    >
      {returnInitial(name || "U")}
    </span>
  );
}

// A school runs one set of books and cannot see another school's, so there is
// no roll-call to show. Rendering nothing is the whole answer, and it is
// declared rather than omitted because the contract requires the member: the
// package places this section on Setup -> Entities, which this app does not
// even mount.
export function PlatformLedgerInventory() {
  return null;
}

// The school app has no dashboard-title mechanism of its own yet, so the title
// goes to the browser tab. Deliberately not a no-op: a screen that asked to be
// named and is not named anywhere reads as a bug the first time somebody looks
// for it, and the tab is where a title is least surprising.
export function useDashboardTitle(title: string) {
  useEffect(() => {
    if (!title) return;
    const previous = document.title;
    document.title = title;
    return () => { document.title = previous; };
  }, [title]);
}
