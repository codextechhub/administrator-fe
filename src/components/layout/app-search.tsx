import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";
import { P, type PermissionCode } from "@/permissions";
import { routesPath } from "@/routes/routesPath";

/**
 * The header search: a command palette over the screens this person can reach.
 *
 * **It navigates. It does not search the school.** There is no search endpoint
 * in the backend - not closed, absent - so a box that promised to find a student
 * by name would be a lie in the most prominent place on the page. Jumping to a
 * screen is the honest half of that promise, it is useful on day one, and it is
 * the shell a real search drops into when there is something to call.
 *
 * Entries are gated on the same permission keys as the sidebar, so the palette
 * never offers a door the nav has already hidden.
 */
interface Destination {
  label: string;
  hint: string;
  path: string;
  permission?: PermissionCode;
  /** Only reachable before go-live, or only after. */
  when?: "pending" | "live";
}

const DESTINATIONS: Destination[] = [
  {
    label: "Control Room",
    hint: "Your onboarding checklist",
    path: routesPath.PROTECTED.ONBOARDING.INDEX,
    permission: P.VIEW_ONBOARDING,
    when: "pending",
  },
  {
    label: "School Profile",
    hint: "Ownership, term structure, currency, logo",
    path: routesPath.PROTECTED.ONBOARDING.PROFILE,
    permission: P.VIEW_SCHOOL_PROFILE,
    when: "pending",
  },
  {
    label: "Go-Live",
    hint: "Request go-live and its history",
    path: routesPath.PROTECTED.ONBOARDING.GO_LIVE,
    permission: P.VIEW_GO_LIVE_REQUESTS,
    when: "pending",
  },
  {
    label: "Get Help",
    hint: "Raise an issue with CodeX",
    path: routesPath.PROTECTED.ONBOARDING.HELP,
    when: "pending",
  },
  {
    label: "Dashboard",
    hint: "School overview",
    path: routesPath.PROTECTED.OVERVIEW.INDEX,
    permission: P.VIEW_SCHOOL_DASHBOARD,
    when: "live",
  },
  {
    label: "Branches",
    hint: "Campuses and sites",
    path: routesPath.PROTECTED.BRANCHES.INDEX,
    permission: P.BROWSE_BRANCHES,
    when: "live",
  },
  {
    label: "Students",
    hint: "The student roster",
    path: routesPath.PROTECTED.STUDENTS.INDEX,
    permission: P.BROWSE_STUDENTS,
    when: "live",
  },
  {
    label: "Teachers",
    hint: "Teaching staff",
    path: routesPath.PROTECTED.TEACHERS.INDEX,
    permission: P.BROWSE_TEACHERS,
    when: "live",
  },
  {
    label: "Administrators",
    hint: "School administrator accounts",
    path: routesPath.PROTECTED.ADMINISTRATORS.INDEX,
    permission: P.BROWSE_ADMINISTRATORS,
    when: "live",
  },
  {
    label: "Academic Session",
    hint: "Sessions and terms",
    path: routesPath.PROTECTED.ACADEMIC.SESSION,
    permission: P.BROWSE_SESSIONS,
    when: "live",
  },
  {
    label: "Academic Calendar",
    hint: "Calendar and events",
    path: routesPath.PROTECTED.ACADEMIC.CALENDER,
    permission: P.BROWSE_CALENDAR,
    when: "live",
  },
  {
    label: "Classes",
    hint: "Classes and their rosters",
    path: routesPath.PROTECTED.CLASSES.INDEX,
    permission: P.BROWSE_CLASSES,
    when: "live",
  },
];

/** ⌘E on a Mac, Ctrl+E elsewhere - the shortcut the design prints in the box. */
function useSearchShortcut(onOpen: () => void) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "e") return;
      if (!event.metaKey && !event.ctrlKey) return;
      event.preventDefault();
      onOpen();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onOpen]);
}

export function AppSearch({
  schoolIsPending,
  className,
}: {
  schoolIsPending: boolean;
  className?: string;
}) {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [open, setOpen] = useState(false);
  useSearchShortcut(() => setOpen(true));

  const destinations = useMemo(
    () =>
      DESTINATIONS.filter((entry) => {
        // A pending school reaches onboarding and nothing else, so offering it
        // Students here would send it straight to the "opens at go-live" wall.
        if (entry.when === "pending" && !schoolIsPending) return false;
        if (entry.when === "live" && schoolIsPending) return false;
        return !entry.permission || hasPermission(entry.permission);
      }),
    [hasPermission, schoolIsPending],
  );

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* The trigger is the design's search box. Below lg it collapses to the
          icon alone: a 560px field cannot sit between a title and three
          controls on a 390px screen without one of them leaving. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search"
        className={cn(
          "group relative flex h-9 items-center rounded-full border border-white-02 bg-white text-gray-05 transition-colors hover:border-primary/40 lg:h-11 lg:w-full lg:max-w-140",
          "size-9 justify-center lg:justify-start lg:px-11",
          className,
        )}
      >
        <Search className="size-4.5 lg:absolute lg:left-4" />
        <span className="hidden lg:inline text-sm">Search the school</span>
        <span className="hidden lg:inline-flex absolute right-2.5 h-6 items-center gap-0.5 rounded-sm border border-white-02 bg-gray-03 px-2 font-mont text-xs font-medium text-gray-05">
          ⌘ E
        </span>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search"
        description="Jump to a screen"
      >
        <CommandInput placeholder="Jump to a screen…" />
        <CommandList>
          {/* Said out loud, because the box looks like it should find people. */}
          <CommandEmpty>
            Nothing matches. This searches screens, not records.
          </CommandEmpty>
          <CommandGroup heading="Go to">
            {destinations.map((entry) => (
              <CommandItem
                key={entry.path}
                value={`${entry.label} ${entry.hint}`}
                onSelect={() => go(entry.path)}
              >
                <span className="font-medium text-black-01">{entry.label}</span>
                <span className="ml-auto text-xs text-gray-05">
                  {entry.hint}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
