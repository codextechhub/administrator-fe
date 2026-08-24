"use client";
import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { HomeIcon, TeamMgtIcon } from "@/assets/navbar-svg";
import { NavMain } from "./nav-main";
import { routesPath } from "@/routes/routesPath";
import { useLocation } from "react-router";
import { BookOpen, DollarSign, Headset, ListChecks, Rocket, Settings } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
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

export function AppSidebar({
  onboarding = false,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  /**
   * Reduce the nav to what a school that has not gone live can actually reach.
   *
   * Overview, People, Academics and Finance are ABSENT rather than greyed out
   * or padlocked: the server refuses every one of those surfaces to a PENDING
   * tenant, and a disabled row is a promise the school can see but not use. They
   * appear at go-live, when the routes behind them start answering.
   */
  onboarding?: boolean;
}) {
  const location = useLocation().pathname;

  const { hasPermission, hasAnyPermission, hasAllPermissions } =
    usePermissions();

  const school = useAppSelector(selectSchool);
  const user = useAppSelector(selectUser);

  const schoolName =
    school?.name ?? user?.school_name ?? "";
  // The raw school.logo is an auth-gated /media/ URL a browser <img> can't load;
  // the hook fetches it with the token and returns a renderable blob: URL.
  const logoBlobUrl = useSchoolLogo();
  const roleLabel = humanizeRole(user?.role);

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

  // The onboarding nav, gated like every other group. A branch admin holds
  // `onboarding.progress.view` and nothing else, so they get the Control Room
  // and no Go-Live: a nav item that answers 403 is a door drawn on a wall.
  const onboardingNav: NavItem[] = [
    {
      title: "Control Room",
      url: routesPath.PROTECTED.ONBOARDING.INDEX,
      icon: ListChecks,
      // Every onboarding screen except Go-Live and Help is a step opened FROM
      // the control room, so the control room is where the reader still is.
      // An exact-path match unlit the item the moment they opened a step,
      // leaving the whole sidebar dark and no answer to "where am I?".
      isActive:
        location.startsWith(routesPath.PROTECTED.ONBOARDING.INDEX) &&
        !location.startsWith(routesPath.PROTECTED.ONBOARDING.GO_LIVE) &&
        !location.startsWith(routesPath.PROTECTED.ONBOARDING.HELP),
      childActive: false,
      permission: P.VIEW_ONBOARDING,
    },
    {
      title: "Go-Live",
      url: routesPath.PROTECTED.ONBOARDING.GO_LIVE,
      icon: Rocket,
      isActive: location.startsWith(routesPath.PROTECTED.ONBOARDING.GO_LIVE),
      childActive: false,
      permission: P.VIEW_GO_LIVE_REQUESTS,
    },
  ].filter(canSee);

  const helpNav: NavItem[] = [
    {
      title: "Help",
      url: routesPath.PROTECTED.ONBOARDING.HELP,
      icon: Headset,
      isActive: location.startsWith(routesPath.PROTECTED.ONBOARDING.HELP),
      childActive: false,
    },
  ];

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
        {/* h-15 with no padding, matching the page header exactly. The school
            block and the page title sit on ONE line with one continuous rule
            under both, which is how the design draws the top of the app; a
            taller block here puts a step in that line. */}
        <SidebarHeader className="h-15 justify-center border-b border-white-02 bg-white p-0 px-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground h-11 hover:bg-transparent cursor-pointer mx-auto justify-center overflow-hidden"
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
          {onboarding ? (
            <>
              {onboardingNav.length > 0 && (
                <NavMain items={onboardingNav} groupTitle="Onboarding" />
              )}
            </>
          ) : (
            <>
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
            </>
          )}
          {/* Outside the branch on purpose. Help used to render only while a
              school was onboarding, so the one route to support disappeared at
              go-live - the exact moment a school is most likely to need it. */}
          <NavMain items={helpNav} groupTitle="Help" />
        </SidebarContent>
        <SidebarRail />
      </Sidebar>

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
