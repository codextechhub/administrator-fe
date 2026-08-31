"use client";
import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { HomeIcon, TeamMgtIcon } from "@/assets/navbar-svg";
import { NavAccordionProvider, NavMain } from "./nav-main";
import { routesPath } from "@/routes/routesPath";
import { Link, useLocation } from "react-router";
import {
  BookOpen,
  CalendarClock,
  CalendarRange,
  ArrowLeftRight,
  ListChecks,
  Rocket,
  UserPlus,
  Users,
} from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { P, type PermissionCode } from "@/permissions";
import { useAppSelector } from "@/redux/store";
import { selectSchool, selectUser } from "@/redux/features/auth/auth-slice";
import { useSchoolLogo } from "@/hooks/use-school-logo";
import { LensRail } from "./layout/lens-pills";
import { SchoolMark } from "./school-mark";

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
      // Every onboarding screen except Go-Live is a step opened FROM the
      // control room, so the control room is where the reader still is. An
      // exact-path match unlit the item the moment they opened a step, leaving
      // the whole sidebar dark and no answer to "where am I?".
      isActive:
        location.startsWith(routesPath.PROTECTED.ONBOARDING.INDEX) &&
        !location.startsWith(routesPath.PROTECTED.ONBOARDING.GO_LIVE),
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
        // Student Management. Only the directory is listed today: the profile
        // hangs off it and needs no door of its own, and Applicants, Guardians,
        // Classes & Transfers and Promotion join this list in the phases that
        // build them. A nav item that 404s is a door drawn on a wall.
        //
        // The design puts live counts on Applicants and "No class". Those
        // belong on the items they describe, so they arrive with those screens
        // rather than being parked on the directory now.
        title: "Students",
        url: routesPath.PROTECTED.STUDENTS.INDEX,
        icon: Users,
        // Every student screen lives under /students, so a bare startsWith
        // lights this item up on Applicants too and two rows look selected at
        // once. The directory owns the prefix EXCEPT where a sibling item owns
        // a deeper path of its own.
        isActive:
          location.startsWith(routesPath.PROTECTED.STUDENTS.INDEX) &&
          !location.startsWith(routesPath.PROTECTED.STUDENTS.APPLICANTS),
        childActive: false,
        permission: P.BROWSE_STUDENTS,
      },
      {
        title: "Applicants",
        url: routesPath.PROTECTED.STUDENTS.APPLICANTS,
        icon: UserPlus,
        isActive: location.startsWith(routesPath.PROTECTED.STUDENTS.APPLICANTS),
        childActive: false,
        permission: P.BROWSE_STUDENTS,
      },
      {
        // Placing children, and reading a register. Its own door because the
        // unplaced list is a worklist somebody is asked to empty, not a view
        // of the directory.
        title: "Classes & Transfers",
        url: routesPath.PROTECTED.STUDENTS.ASSIGN,
        icon: ArrowLeftRight,
        isActive: location.startsWith(routesPath.PROTECTED.STUDENTS.ASSIGN),
        childActive: false,
        permission: P.ASSIGN_CLASS,
      },
    ],
    academics: [
      {
        // Academic Structure is the module: the overview and everything that
        // hangs off it. Submenus appear as their screens land - a nav item that
        // 404s is a door drawn on a wall, so Departments, Programmes, Subjects
        // and Assignments join this list in the phases that build them.
        title: "Academic Structure",
        url: "#",
        icon: BookOpen,
        isActive: location.startsWith(
          routesPath.PROTECTED.ACADEMIC_STRUCTURE.INDEX,
        ),
        childActive: location.startsWith(
          routesPath.PROTECTED.ACADEMIC_STRUCTURE.INDEX,
        ),
        // The group opens for anyone who can read any part of the structure;
        // each child is gated on its own key below.
        permission: [P.BROWSE_STRUCTURE, P.BROWSE_SESSIONS, P.BROWSE_CLASSES],
        permissionMode: "any",
        items: (
          [
            {
              title: "Overview",
              url: routesPath.PROTECTED.ACADEMIC_STRUCTURE.INDEX,
              // Exact match: every child below starts with this path, so
              // `includes` would light Overview on all of them.
              isActive:
                location === routesPath.PROTECTED.ACADEMIC_STRUCTURE.INDEX,
              perm: P.BROWSE_STRUCTURE,
            },
            {
              title: "Sessions & Terms",
              url: routesPath.PROTECTED.ACADEMIC_STRUCTURE.SESSIONS,
              isActive: location.startsWith(
                routesPath.PROTECTED.ACADEMIC_STRUCTURE.SESSIONS,
              ),
              perm: P.BROWSE_SESSIONS,
            },
            {
              title: "Departments",
              url: routesPath.PROTECTED.ACADEMIC_STRUCTURE.DEPARTMENTS,
              isActive: location.startsWith(
                routesPath.PROTECTED.ACADEMIC_STRUCTURE.DEPARTMENTS,
              ),
              perm: P.BROWSE_STRUCTURE,
            },
            {
              title: "Programmes & Levels",
              url: routesPath.PROTECTED.ACADEMIC_STRUCTURE.PROGRAMS,
              isActive: location.startsWith(
                routesPath.PROTECTED.ACADEMIC_STRUCTURE.PROGRAMS,
              ),
              perm: P.BROWSE_STRUCTURE,
            },
            {
              title: "Classes & Arms",
              url: routesPath.PROTECTED.ACADEMIC_STRUCTURE.CLASSES,
              isActive: location.startsWith(
                routesPath.PROTECTED.ACADEMIC_STRUCTURE.CLASSES,
              ),
              perm: P.BROWSE_CLASSES,
            },
            {
              title: "Subjects",
              url: routesPath.PROTECTED.ACADEMIC_STRUCTURE.SUBJECTS,
              isActive: location.startsWith(
                routesPath.PROTECTED.ACADEMIC_STRUCTURE.SUBJECTS,
              ),
              perm: P.BROWSE_SUBJECTS,
            },
            {
              title: "Assignments",
              url: routesPath.PROTECTED.ACADEMIC_STRUCTURE.ASSIGNMENTS,
              isActive: location.startsWith(
                routesPath.PROTECTED.ACADEMIC_STRUCTURE.ASSIGNMENTS,
              ),
              // Gated on classes, not structure: this screen is about who
              // teaches a class and who is in it.
              perm: P.BROWSE_CLASSES,
            },
          ] as { title: string; url: string; isActive: boolean; perm: PermissionCode }[]
        )
          .filter((sub) => hasPermission(sub.perm))
          // `perm` is this file's gate, not part of the NavItem shape.
          .map((sub) => ({ title: sub.title, url: sub.url, isActive: sub.isActive })),
      },
      {
        // Its own module now, not a child of academics management. The design
        // splits it into two siblings - what a school DATES, and what runs
        // inside those dates - and they are gated on different backend keys, so
        // a reader may hold one and not the other.
        //
        // Timetables joins this list as its screens land, following the same
        // rule the group above records: a nav item that 404s is a door drawn on
        // a wall.
        title: "Calendar",
        url: "#",
        icon: CalendarRange,
        isActive: location.startsWith(
          routesPath.PROTECTED.ACADEMIC_CALENDAR.INDEX,
        ),
        childActive: location.startsWith(
          routesPath.PROTECTED.ACADEMIC_CALENDAR.INDEX,
        ),
        permission: P.BROWSE_CALENDAR,
        items: [
          {
            title: "Overview",
            url: routesPath.PROTECTED.ACADEMIC_CALENDAR.INDEX,
            // Exact match: both children below start with this path, so
            // `startsWith` would light Overview on all three.
            isActive:
              location === routesPath.PROTECTED.ACADEMIC_CALENDAR.INDEX,
          },
          {
            title: "Events",
            url: routesPath.PROTECTED.ACADEMIC_CALENDAR.EVENTS,
            isActive: location.startsWith(
              routesPath.PROTECTED.ACADEMIC_CALENDAR.EVENTS,
            ),
          },
          {
            title: "Term view",
            url: routesPath.PROTECTED.ACADEMIC_CALENDAR.TERM_VIEW,
            isActive: location.startsWith(
              routesPath.PROTECTED.ACADEMIC_CALENDAR.TERM_VIEW,
            ),
          },
        ],
      },
      {
        // The calendar's sibling, and gated on its own key: a reader may hold
        // `academics.calendar.view` and not `academics.timetable.view`, in
        // which case this group is ABSENT rather than greyed out.
        //
        // Class timetables, Teacher timetables and Exam scheduling join this
        // list in the phases that build them.
        title: "Timetables",
        url: "#",
        icon: CalendarClock,
        isActive: location.startsWith("/timetables"),
        childActive: location.startsWith("/timetables"),
        permission: P.BROWSE_TIMETABLES,
        items: [
          {
            title: "Rooms",
            url: routesPath.PROTECTED.TIMETABLES.ROOMS,
            isActive: location.startsWith(routesPath.PROTECTED.TIMETABLES.ROOMS),
          },
          {
            title: "Bell schedule",
            url: routesPath.PROTECTED.TIMETABLES.BELL_SCHEDULE,
            isActive: location.startsWith(
              routesPath.PROTECTED.TIMETABLES.BELL_SCHEDULE,
            ),
          },
          {
            title: "Class timetables",
            url: routesPath.PROTECTED.TIMETABLES.CLASSES,
            isActive: location.startsWith(
              routesPath.PROTECTED.TIMETABLES.CLASSES,
            ),
          },
          {
            title: "Teacher timetables",
            url: routesPath.PROTECTED.TIMETABLES.TEACHERS,
            isActive: location.startsWith(
              routesPath.PROTECTED.TIMETABLES.TEACHERS,
            ),
          },
          {
            title: "Exam scheduling",
            url: routesPath.PROTECTED.TIMETABLES.EXAMS,
            isActive: location.startsWith(
              routesPath.PROTECTED.TIMETABLES.EXAMS,
            ),
          },
        ],
      },
    ],
  };

  // Filter each group's items by permission. A group whose items are all
  // filtered out is dropped entirely (its label disappears with it).
  const overview = data.overview.filter(canSee);
  const people = data.people.filter(canSee);
  const academics = data.academics.filter(canSee);

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
              {/* The mark alone, the way the console shows its own. The name
                  and the role used to sit beside it in a block wide enough to
                  need its own truncation; the name is now one hover away and
                  the role is on the account menu, where a reader looks for it.

                  Collapsed to the icon rail there is no width for the name to
                  turn into, so it stays a plain logo there. */}
              <Link
                to={routesPath.PROTECTED.OVERVIEW.INDEX}
                aria-label={schoolName ? `${schoolName} - go to dashboard` : "Go to dashboard"}
                className="mx-auto flex h-11 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <SchoolMark
                  logo={logoBlobUrl}
                  name={schoolName}
                  slug={school?.slug}
                  animate={state !== "collapsed"}
                />
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        {/* One expandable group open at a time, across every group rather than
            within each - see nav-main. */}
        <SidebarContent className="bg-white pt-3">
          <NavAccordionProvider>
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
            </>
          )}
          </NavAccordionProvider>
        </SidebarContent>

        {/* The branch and session lenses, pinned under the nav so they stay put
            while it scrolls. Absent for a school with one branch and one year -
            see lens-pills. Hidden during onboarding for the same reason the
            nav is reduced there: the school has one thing to do. */}
        {!onboarding && <SidebarFooter className="bg-white p-0">
          <LensRail collapsed={state === "collapsed"} />
        </SidebarFooter>}

        <SidebarRail />
      </Sidebar>

    </>
  );
}
