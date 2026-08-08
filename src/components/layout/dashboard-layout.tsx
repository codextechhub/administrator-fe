import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { AppSidebar } from "../app-sidebar";
import { svgIcons } from "@/assets/svg";
import { ChevronLeft, Loader2, Undo2, UsersRound } from "lucide-react";
import { useState } from "react";
import { Outlet, useMatches, useNavigate } from "react-router";
import { useSessionTimeout } from "@/hooks/use-session-timeout";
import { useTokenRefresh } from "@/hooks/use-token-refresh";
import { SessionTimeoutModal } from "@/components/session-timeout-modal";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import {
  selectActorPermissions,
  selectImpersonation,
  selectUser,
} from "@/redux/features/auth/auth-slice";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "../ui/combobox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { ProxySessionBanner } from "@/components/proxy-session-banner";
import { ProxyUserDialog } from "@/components/proxy-user-dialog";
import { P, resolvePermissionKey } from "@/permissions";
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
};

export default function DashboardLayout() {
  const navigate = useNavigate();

  // Deepest matched route wins, so a nested screen can override its parent's
  // header without the parent knowing about it.
  const matches = useMatches();
  const { title, hasBack = false } = matches.reduce<DashboardHandle>(
    (acc, m) => ({ ...acc, ...((m.handle as DashboardHandle | undefined) ?? {}) }),
    {},
  );
  const dispatch = useAppDispatch();

  useTokenRefresh();
  const { open, secondsLeft, isExpired, onContinue, onLogout, goToLogin } =
    useSessionTimeout();

  const user = useAppSelector(selectUser);
  const fullName =
    user?.full_name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
  const roleLabel = humanizeRole(user?.user_type || user?.role);
  const avatarFallback = initials(fullName);
  const selectedBranch = user?.branch_name;

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

  const branchOptions = [
    { label: "All Branches", value: "all" },
    { label: "Primary - Ikeja", value: "primary-ikeja" },
    { label: "Secondary - Ikeja", value: "secondary-ikeja" },
    { label: "Secondary - Lekki", value: "secondary-lekki" },
  ];
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
        <AppSidebar />
        <SidebarInset className="bg-white-05 min-w-0 w-auto">
          {/* Banner + header pin together: two independently sticky bars at
              top-0 would overlap as soon as the page scrolls. */}
          <div className="sticky top-0 z-10 shrink-0">
          <ProxySessionBanner />
          <header className="flex justify-between h-15 px-3 lg:px-10 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 bg-white border border-l-0 border-white-02">
            <div className="inline-flex items-center gap-2">
              {/* Phone: the sidebar is offcanvas below md, so without a trigger
                  the nav is unreachable on mobile. */}
              <SidebarTrigger className="md:hidden size-8" />
              {hasBack && (
                <>
                  <figure
                    onClick={() => navigate(-1)}
                    className="uppercase font-light text-gray-01 text-sm inline-flex items-center cursor-pointer"
                  >
                    <ChevronLeft className="text-inherit size-5 mr-1" />
                    Back
                  </figure>
                  <Separator
                    orientation="vertical"
                    className="rotate-10 w-[1.2px] bg-black-01 data-[orientation=vertical]:h-7"
                  />
                </>
              )}

              <h6 className="text-base uppercase font-semibold text-black-01">
                {title || "Welcome back!!"}
              </h6>
            </div>

            <Combobox items={branchOptions}>
              <ComboboxInput
                showTrigger={false}
                placeholder={selectedBranch || "Switch branch"}
                className="border-primary ring-0!"
              />
              <ComboboxContent>
                <ComboboxEmpty>No items found.</ComboboxEmpty>
                <ComboboxList>
                  {(framework) => (
                    <ComboboxItem key={framework.value} value={framework}>
                      {framework.label}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>

            <div className="gap-x-3 inline-flex items-center">
              <button
                type="button"
                className="size-8.5 rounded-full relative bg-gray-04 grid place-content-center"
              >
                {svgIcons.notificationBell}
              </button>

              <Separator
                orientation="vertical"
                className=" data-[orientation=vertical]:h-7"
              />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Open account menu"
                    // min-w-0 + the truncating spans keep a long name from
                    // widening the header past a 390px viewport.
                    className="inline-flex min-w-0 items-center gap-x-3 rounded-full py-1 pl-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    <Avatar className="shrink-0">
                      <AvatarImage src={"/image/avatar2.png"} />
                      <AvatarFallback>{avatarFallback}</AvatarFallback>
                    </Avatar>

                    {/* The identity block is desktop-only: on a phone the
                        avatar alone opens the same menu, and the banner already
                        names the proxied user. */}
                    <div className="hidden min-w-0 sm:grid text-left text-sm leading-tight">
                      <span className="truncate font-medium">{fullName}</span>
                      <span className="text-muted-foreground truncate text-xs">
                        {roleLabel}
                      </span>
                    </div>
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
                        {impersonation ? "View as someone else" : "View as user"}
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
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          </div>

          {canProxy && (
            <ProxyUserDialog
              open={proxyDialogOpen}
              onOpenChange={setProxyDialogOpen}
            />
          )}
          {/* grid-cols-1 (minmax(0,1fr)) zeroes the track's min-content floor so a
              page's <main> can never be stretched past the viewport by wide
              nowrap content (tables) - each page's own overflow-x-auto then
              clips it. Ported from console-fe; do not remove (CLAUDE.md
              §Responsive). */}
          <div className="grid grid-cols-1 min-w-0 flex-1 pt-0">
            <Outlet />
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
