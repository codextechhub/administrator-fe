"use client";
import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { HomeIcon, LogoutIcon, TeamMgtIcon } from "@/assets/navbar-svg";
import { NavMain } from "./nav-main";
import { routesPath } from "@/routes/routesPath";
import { useLocation } from "react-router";
import PromptModal from "./modal/prompt-modal";
import useToggleModal from "@/hooks/use-toggle";
import { BookOpen, DollarSign, Settings } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { useLogout } from "@/hooks/use-logout";
import { P, type PermissionCode } from "@/permissions";
import { useAppSelector } from "@/redux/store";
import { selectSchool, selectUser } from "@/redux/features/auth/auth-slice";
import { useSchoolLogo } from "@/hooks/use-school-logo";

// A nav item may declare a permission (single code or a list). When absent the
// item always renders. `permissionMode` decides whether a list requires ANY
// (default) or ALL of the listed codes.
type NavPermission = PermissionCode | PermissionCode[] | null | undefined;

interface NavItem {
  title: string;
  url: string;
  icon?: React.ElementType;
  isActive: boolean;
  childActive: boolean;
  permission?: NavPermission;
  permissionMode?: "any" | "all";
  items?: { title: string; url: string; isActive: boolean }[];
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation().pathname;

  const { hasPermission, hasAnyPermission, hasAllPermissions } =
    usePermissions();
  const { handleLogout, isLoggingOut } = useLogout();

  const school = useAppSelector(selectSchool);
  const user = useAppSelector(selectUser);

  const schoolName =
    school?.name ?? user?.school_name ?? "";
  // The raw school.logo is an auth-gated /media/ URL a browser <img> can't load;
  // the hook fetches it with the token and returns a renderable blob: URL.
  const logoBlobUrl = useSchoolLogo();
  const roleLabel = humanizeRole(user?.user_type ?? user?.role);

  const { isOpen: openLogout, toggleClick: toggleLogout } =
    useToggleModal(false); // logout modal

  // A nav item is visible when it declares no permission, or when the current
  // user satisfies the declared permission(s) per the item's mode.
  const canSee = (item: NavItem): boolean => {
    const permission = item.permission;
    if (permission === null || permission === undefined) return true;
    const codes = Array.isArray(permission) ? permission : [permission];
    if (codes.length === 1) return hasPermission(codes[0]);
    return item.permissionMode === "all"
      ? hasAllPermissions(...codes)
      : hasAnyPermission(...codes);
  };

  const data: Record<string, NavItem[]> = {
    overview: [
      {
        title: "Dashboard",
        url: routesPath.PROTECTED.OVERVIEW.INDEX,
        icon: HomeIcon,
        isActive: location.startsWith(routesPath.PROTECTED.OVERVIEW.INDEX),
        childActive: false,
        permission: P.VIEW_SCHOOL_DASHBOARD,
        items: [],
      },
      {
        title: "Branches",
        url: routesPath.PROTECTED.BRANCHES.INDEX,
        icon: TeamMgtIcon,
        isActive: location.startsWith(routesPath.PROTECTED.BRANCHES.INDEX),
        childActive: false,
        permission: P.BROWSE_BRANCHES,
      },
    ],
    people: [
      {
        title: "Students",
        url: routesPath.PROTECTED.STUDENTS.INDEX,
        icon: TeamMgtIcon,
        isActive: location.startsWith(routesPath.PROTECTED.STUDENTS.INDEX),
        childActive: false,
        permission: P.BROWSE_STUDENTS,
      },
      {
        title: "Teachers",
        url: routesPath.PROTECTED.TEACHERS.INDEX,
        icon: TeamMgtIcon,
        isActive: location.startsWith(routesPath.PROTECTED.TEACHERS.INDEX),
        childActive: false,
        permission: P.BROWSE_TEACHERS,
      },
      {
        title: "Administrators",
        url: routesPath.PROTECTED.ADMINISTRATORS.INDEX,
        icon: TeamMgtIcon,
        isActive: location.startsWith(
          routesPath.PROTECTED.ADMINISTRATORS.INDEX,
        ),
        childActive: false,
        permission: P.BROWSE_ADMINISTRATORS,
      },
    ],
    academics: [
      {
        title: "Academic Management",
        url: "#",
        icon: BookOpen,
        isActive: location.includes(routesPath.PROTECTED.ACADEMIC.INDEX),
        childActive: location.includes(routesPath.PROTECTED.ACADEMIC.INDEX),
        // Group is visible when the user can browse either sessions or the
        // calendar; individual children are gated below via `subPermission`.
        permission: [P.BROWSE_SESSIONS, P.BROWSE_CALENDAR],
        permissionMode: "any",
        items: [
          {
            title: "Academic Session",
            url: routesPath.PROTECTED.ACADEMIC.SESSION,
            isActive: location.includes(routesPath.PROTECTED.ACADEMIC.SESSION),
          },
          {
            title: "Academic Calender",
            url: routesPath.PROTECTED.ACADEMIC.CALENDER,
            isActive: location.includes(routesPath.PROTECTED.ACADEMIC.CALENDER),
          },
        ].filter((sub) =>
          sub.title === "Academic Session"
            ? hasPermission(P.BROWSE_SESSIONS)
            : hasPermission(P.BROWSE_CALENDAR),
        ),
      },
      {
        title: "Classes",
        url: routesPath.PROTECTED.CLASSES.INDEX,
        icon: TeamMgtIcon,
        isActive: location.startsWith(routesPath.PROTECTED.CLASSES.INDEX),
        childActive: false,
        permission: P.BROWSE_CLASSES,
      },
    ],
    finance: [
      {
        title: "Finance",
        url: "#",
        icon: DollarSign,
        isActive: location.startsWith("#"),
        childActive: false,
        permission: P.VIEW_FEES,
      },
      {
        title: "Settings",
        url: "#",
        icon: Settings,
        isActive: location.startsWith("#"),
        childActive: false,
        permission: P.VIEW_SETTINGS,
      },
    ],
  };

  // Filter each group's items by permission. A group whose items are all
  // filtered out is dropped entirely (its label disappears with it).
  const overview = data.overview.filter(canSee);
  const people = data.people.filter(canSee);
  const academics = data.academics.filter(canSee);
  const finance = data.finance.filter(canSee);

  const { state } = useSidebar();
  return (
    <>
      <Sidebar className="bg-white" collapsible="icon" {...props}>
        <SidebarHeader className="bg-white border-b">
          <SidebarMenu>
            <SidebarMenuItem className="mt-2">
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-transparent cursor-pointer mx-auto justify-center overflow-hidden"
                tooltip={schoolName}
              >
                <div className={cn("size-fit ")}>
                  <img
                    src={logoBlobUrl ?? "/image/logo.png"}
                    alt="school logo"
                    className="size-7.5"
                  />
                </div>
                {state !== "collapsed" && (
                  <div className="max-w-45">
                    <h4 className="text-sm font-semibold text-gray-01 font-mont truncate">
                      {schoolName}
                    </h4>
                    <p className="text-xs text-gray-06 truncate">
                      {roleLabel}
                    </p>
                  </div>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="bg-white pt-3">
          {overview.length > 0 && (
            <NavMain items={overview} groupTitle="Overview" />
          )}
          {people.length > 0 && (
            <NavMain items={people} groupTitle="People" />
          )}
          {academics.length > 0 && (
            <NavMain items={academics} groupTitle="Academics" />
          )}
          {finance.length > 0 && (
            <NavMain items={finance} groupTitle="Finance" />
          )}
        </SidebarContent>
        <SidebarFooter className="bg-white ">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                className="h-10 mx-auto mb-10 text-destructive hover:bg-destructive/5 hover:text-destructive"
                tooltip="Logout"
                onClick={toggleLogout}
              >
                <LogoutIcon />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

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
    </>
  );
}

// Turn a backend role token ("SCHOOL_ADMIN", "branch_admin") into a display
// label ("School Admin"). Falls back to an empty string when nothing is set.
function humanizeRole(value?: string | null): string {
  if (!value) return "";
  return value
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
