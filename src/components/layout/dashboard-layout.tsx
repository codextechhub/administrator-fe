import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "../app-sidebar";
import { ChevronLeft, LifeBuoy, Loader2, LogOut, Undo2, UsersRound } from "lucide-react";
import { useState } from "react";
import { useLogout } from "@/hooks/use-logout";
import useToggleModal from "@/hooks/use-toggle";
import PromptModal from "@/components/modal/prompt-modal";
import { Outlet, useMatches, useNavigate } from "react-router";
import { useSessionTimeout } from "@/hooks/use-session-timeout";
import { useTokenRefresh } from "@/hooks/use-token-refresh";
import { SessionTimeoutModal } from "@/components/session-timeout-modal";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import {
  selectActorPermissions,
  selectImpersonation,
  selectTenantIsPending,
  selectUser,
} from "@/redux/features/auth/auth-slice";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { NotLiveNotice } from "@/pages/protected/onboarding/components/not-live-notice";
import { OnboardingStatusStrip } from "@/pages/protected/onboarding/components/onboarding-status-strip";
import { AppSearch } from "./app-search";
import { NotificationsBell } from "@/components/custom/notifications-bell";
import { ProxySessionBanner } from "@/components/proxy-session-banner";
import { ProxyUserDialog } from "@/components/proxy-user-dialog";
import { P, resolvePermissionKey } from "@/permissions";
import { routesPath } from "@/routes/routesPath";
import { exitProxySession } from "@/utils/proxy-session";

// Per-screen header config, declared on the route rather than passed as props.
// The layout is now an eager LAYOUT ROUTE (see routes/protected/index.tsx), so
// it renders once above the lazy page chunks and can't receive props from the
// page it wraps - the route's `handle` is react-router's channel for exactly
// this kind of static, route-owned metadata.
export type DashboardHandle = {
  /** Header title. Falls back to a generic greeting when omitted. */
  title?: string;
  /** Show the back affordance (defaults to history-back). */
  hasBack?: boolean;
  /**
   * Render the shell a school that has not gone live actually gets: the reduced
   * sidebar, the pending status strip, and NO branch switcher.
   *
   * The switcher goes for a reason of its own, not because branches are missing.
   * Onboarding belongs to the school as a whole rather than to one site, so
   * there is nothing to switch and nothing to scope - the same recede rule the
   * contract applies to branch, applied for a different reason.
   */
  onboarding?: boolean;
};

export default function DashboardLayout() {
  const navigate = useNavigate();

  // Deepest matched route wins, so a nested screen can override its parent's
  // header without the parent knowing about it.
  const matches = useMatches();
  const { title, hasBack = false, onboarding: onboardingRoute = false } = matches.reduce<DashboardHandle>(
    (acc, m) => ({ ...acc, ...((m.handle as DashboardHandle | undefined) ?? {}) }),
    {},
  );
  const dispatch = useAppDispatch();

  // A school that has not gone live may reach onboarding and nothing else. The
  // server enforces this and answers 403 TENANT_NOT_LIVE - but only to a screen
  // that asks it something, and most of this app's pages do not yet make a
  // request at all, so they would render as though they worked. The tenant
  // status arrives with the session, so the question is answered here before
  // the page paints and without a round trip.
  const tenantIsPending = useAppSelector(selectTenantIsPending);

  // The shell follows the school, not the route. A pending school gets the
  // reduced sidebar everywhere - including on a page it is not allowed to open,
  // where a full sidebar would offer it eleven more doors that are also shut.
  // A LIVE school gets the whole app back even on the control room, which after
  // go-live is a read-only record rather than home base.
  const onboarding = tenantIsPending;
  const pageIsClosed = tenantIsPending && !onboardingRoute;

  useTokenRefresh();
  const { handleLogout, isLoggingOut } = useLogout();
  const { isOpen: openLogout, toggleClick: toggleLogout } = useToggleModal(false);

  const { open, secondsLeft, isExpired, onContinue, onLogout, goToLogin } =
    useSessionTimeout();

  const user = useAppSelector(selectUser);
  const fullName =
    user?.full_name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
  const roleLabel = humanizeRole(user?.role);
  const avatarFallback = initials(fullName);

  // The bell badge. A failed count shows no badge, which is what zero shows
  // anyway, so this never needs an error state of its own.
  // Proxy ("view as another user"). The capability is checked against the
  // ORIGINAL actor's grants: while a session is active `permissions` holds the
  // TARGET's keys, so gating on those would hide the exit from the very admin
  // who needs it.
  const impersonation = useAppSelector(selectImpersonation);
  const actorPermissions = useAppSelector(selectActorPermissions);
  const canProxy = actorPermissions.includes(
    resolvePermissionKey(P.START_PROXY_SESSION)
  );
  const [proxyDialogOpen, setProxyDialogOpen] = useState(false);
  const [isExitingProxy, setIsExitingProxy] = useState(false);

  const exitProxy = async () => {
    if (!impersonation || isExitingProxy) return;
    setIsExitingProxy(true);
    await exitProxySession({ dispatch, navigate }, impersonation);
    setIsExitingProxy(false);
  };

  return (
    <>
      <SessionTimeoutModal
        open={open}
        secondsLeft={secondsLeft}
        isExpired={isExpired}
        onContinue={onContinue}
        onLogout={onLogout}
        goToLogin={goToLogin}
      />
      <SidebarProvider>
        <AppSidebar onboarding={onboarding} />
        <SidebarInset className="bg-white-05 min-w-0 w-auto">
          {/* Banner + header pin together: two independently sticky bars at
              top-0 would overlap as soon as the page scrolls. */}
          <div className="sticky top-0 z-10 shrink-0">
          <ProxySessionBanner />
          <header className="flex h-15 shrink-0 items-center gap-3 px-3 lg:gap-4 lg:px-5 bg-white border border-l-0 border-white-02">
            {/* Left: the toggle, the back affordance and the page title. flex-0
                so the search takes the slack rather than the title. */}
            <div className="inline-flex min-w-0 flex-[0_1_auto] items-center gap-2.5">
              <SidebarTrigger className="size-7 rounded-full border border-white-02 text-gray-06 hover:text-primary" />
              {hasBack && (
                <>
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="uppercase font-light text-gray-01 text-sm inline-flex items-center cursor-pointer"
                  >
                    <ChevronLeft className="text-inherit size-5 mr-1" />
                    Back
                  </button>
                  <Separator
                    orientation="vertical"
                    className="rotate-10 w-[1.2px] bg-black-01 data-[orientation=vertical]:h-7"
                  />
                </>
              )}

              <h6 className="min-w-0 truncate text-base uppercase font-semibold text-black-01">
                {title || "Welcome back!!"}
              </h6>
            </div>

            {/* Centre: navigate-only search. It jumps to a screen; there is no
                search endpoint to find records with. See AppSearch. */}
            <div className="flex flex-1 justify-end lg:justify-center min-w-0">
              <AppSearch schoolIsPending={tenantIsPending} />
            </div>

            <div className="inline-flex shrink-0 items-center gap-2.5">
              <NotificationsBell />

              {/* Support sits beside the bell in the design, and during
                  onboarding it is the one route to CodeX a school actually has. */}
              {onboardingRoute && (
                <button
                  type="button"
                  aria-label="Get help"
                  title="Raise an issue with CodeX"
                  onClick={() => navigate(routesPath.PROTECTED.ONBOARDING.HELP)}
                  className="size-8.5 rounded-full bg-gray-04 grid place-content-center text-gray-01 hover:bg-pry-01 hover:text-primary"
                >
                  <LifeBuoy className="size-4.5" />
                </button>
              )}

              <Separator
                orientation="vertical"
                className="data-[orientation=vertical]:h-7"
              />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Open account menu"
                    className="grid size-9 shrink-0 place-content-center rounded-full bg-pry-01 font-mont text-[13px] font-semibold text-primary outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    {avatarFallback}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="flex flex-col">
                    <span className="truncate font-medium text-black-01">
                      {fullName}
                    </span>
                    <span className="truncate text-xs font-normal text-muted-foreground">
                      {user?.email || roleLabel}
                    </span>
                  </DropdownMenuLabel>
                  {canProxy && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setProxyDialogOpen(true)}>
                        <UsersRound className="size-4" />
                        {impersonation ? "Proxy as someone else" : "Proxy user"}
                      </DropdownMenuItem>
                      {impersonation && (
                        <DropdownMenuItem
                          disabled={isExitingProxy}
                          onClick={exitProxy}
                        >
                          {isExitingProxy ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Undo2 className="size-4" />
                          )}
                          Exit proxy
                        </DropdownMenuItem>
                      )}
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={toggleLogout}>
                    <LogOut className="size-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          </div>

          {/* Deliberately below the sticky block, not inside it: the strip plus
              the expiry warning can run to three lines on a phone, and pinning
              all of that would eat the fold on every onboarding screen. */}
          {onboardingRoute && <OnboardingStatusStrip />}

          {canProxy && (
            <ProxyUserDialog
              open={proxyDialogOpen}
              onOpenChange={setProxyDialogOpen}
            />
          )}

          <PromptModal
            isOpen={openLogout}
            onClose={toggleLogout}
            onConfirm={handleLogout}
            title="Log Out?"
            description="Are you sure you want to log out of your account?"
            containerClass="min-h-[320px] lg:w-[390px]"
            srcClass="size-25"
            src="/image/caution.png"
            onConfirmText="Log Out"
            canCancel
            loading={isLoggingOut}
            onConfirmClass="bg-error-01 text-white shadow-xs hover:bg-error-01/90 focus-visible:ring-error-01/20"
          />
          {/* grid-cols-1 (minmax(0,1fr)) zeroes the track's min-content floor so a
              page's <main> can never be stretched past the viewport by wide
              nowrap content (tables) - each page's own overflow-x-auto then
              clips it. Ported from console-fe; do not remove (CLAUDE.md
              §Responsive). */}
          <div className="grid grid-cols-1 min-w-0 flex-1 pt-0">
            {pageIsClosed ? <NotLiveNotice /> : <Outlet />}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}

// Turn a backend role token ("SCHOOL_ADMIN", "branch_admin") into a display
// label ("School Admin"). Empty string when nothing is set.
function humanizeRole(value?: string | null): string {
  if (!value) return "";
  return value
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Derive up to two uppercase initials from a full name for the avatar fallback.
function initials(name?: string | null): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}
