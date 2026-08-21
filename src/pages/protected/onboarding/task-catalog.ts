import {
  BookOpenCheck,
  GraduationCap,
  ShieldCheck,
  School,
  Upload,
  UserRoundCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { TaskKey } from "@/redux/services/onboarding/onboarding-types";
import { P, type PermissionCode } from "@/permissions";
import { routesPath } from "@/routes/routesPath";

/**
 * The presentation half of a checklist step.
 *
 * The step itself - whether it exists for this school, what it is called and
 * whether it is required - comes from the server and is never decided here. What
 * lives here is only what the API has no field for: an icon, a sentence of
 * explanation, and where the work actually happens when it does not happen on
 * this screen.
 */
export interface TaskMeta {
  icon: LucideIcon;
  /** One line under the title, in the school's own terms. */
  description: string;
  /**
   * True when no backend can check this step, so it completes on the school's
   * word. Says so on the card rather than dressing it up as verified.
   */
  attested?: boolean;
  /**
   * Where this work is really done, for the steps whose surface is closed to a
   * school that has not gone live. This is not a nicety: the module a card
   * would link to answers 403 TENANT_NOT_LIVE until go-live, so a button would
   * be a promise the platform breaks.
   */
  closedNote?: string;
  /**
   * A screen in this app that actually does the step's work.
   *
   * Only set where the surface is genuinely open to a pending school. A route
   * here and a `closedNote` are mutually exclusive by construction: one says
   * "here is the form", the other says "there is no form yet".
   */
  route?: string;
  /** Label for the button that opens `route`. */
  openLabel?: string;
  /**
   * The key a reader needs before the link is worth offering.
   *
   * Without it the button is hidden rather than shown and refused: a branch
   * admin can read the school profile but a reader who cannot is better served
   * by no button than by a 403.
   */
  openPermission?: PermissionCode;
}

const CATALOG: Record<string, TaskMeta> = {
  FIRST_ADMIN: {
    icon: UserRoundCheck,
    description:
      "We check that your school has an active administrator who can sign in and holds the School Admin role.",
  },
  ROLE_BASELINE: {
    icon: ShieldCheck,
    description:
      "We check that your School Admin role was created with its permissions attached.",
  },
  SCHOOL_METADATA: {
    icon: School,
    description:
      "Your school's name, code, ownership type, term structure and currency. CodeX fills most of this in when it creates the school.",
    route: routesPath.PROTECTED.ONBOARDING.PROFILE,
    openLabel: "Open profile",
    openPermission: P.VIEW_SCHOOL_PROFILE,
  },
  SET_OF_BOOKS: {
    icon: BookOpenCheck,
    description:
      "The finance ledger your school trades on. CodeX provisions it when the school is created.",
    closedNote:
      "There is no form for this one. If your books never arrived, it is a support matter.",
  },
  ACADEMIC_STRUCTURE: {
    icon: GraduationCap,
    description:
      "Your sessions and terms, your levels and programmes, and the classes under them.",
    attested: true,
    closedNote:
      "Academic structure has its own module, which opens when your school goes live.",
  },
  INITIAL_DATA: {
    icon: Upload,
    description:
      "Students, staff and parents, loaded through the data import engine. An import that finished with rejected rows does not complete this step.",
    closedNote:
      "Data import opens when your school goes live. You can skip this step for now.",
  },
  STAFF_INVITATIONS: {
    icon: UsersRound,
    description: "Anyone at your school with an account beyond you.",
    closedNote:
      "Staff invitations open when your school goes live. You can skip this step for now.",
  },
};

/**
 * Copy for a step, falling back to something honest for a key this build has
 * never heard of.
 *
 * The catalog is a server constant: a step added there ships before this file
 * knows about it, and the school must still see a usable card rather than an
 * empty one or a crash.
 */
export function taskMeta(key: TaskKey): TaskMeta {
  return (
    CATALOG[key] ?? {
      icon: School,
      description: "One of the steps CodeX needs before your school can go live.",
    }
  );
}
