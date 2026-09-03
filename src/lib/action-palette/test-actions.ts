/**
 * Test-only fixture registry.
 *
 * The engine tests deliberately do NOT read the real ./registry: they check the
 * matching rules, not the vocabulary, and a test that fails because someone
 * reworded an action label is a test that will be deleted. These fixtures cover
 * the shapes the rules care about (multi-word labels, aliases, hyphenatable
 * initials, verb-led labels, command runs) and nothing else.
 */

import { P } from "@/permissions";
import type { ActionDef } from "./types";

export const TEST_ACTIONS: ActionDef[] = [
  {
    id: "view-home",
    label: "View home",
    aliases: ["dashboard", "home"],
    section: "Overview",
    group: "Overview",
    kind: "view",
    gate: null,
    run: { to: "/overview" },
  },
  {
    id: "view-students",
    label: "View students",
    aliases: ["student roster", "pupils"],
    section: "People",
    group: "Students",
    kind: "view",
    gate: { perm: P.BROWSE_STUDENTS },
    run: { to: "/students" },
  },
  {
    id: "view-my-profile",
    label: "View my profile",
    aliases: ["my account"],
    section: "Account",
    group: "Account",
    kind: "view",
    gate: null,
    run: { to: "/profile" },
  },
  {
    id: "enroll-student",
    label: "Enroll student",
    aliases: ["new student", "admit student"],
    section: "People",
    group: "Students",
    kind: "do",
    gate: { perm: P.ENROLL_STUDENT },
    run: { to: "/students?action=new" },
  },
  {
    id: "view-fee-invoices",
    label: "View fee invoices",
    aliases: ["invoices", "bills"],
    section: "Finance",
    group: "Fees",
    kind: "view",
    gate: { any: [P.VIEW_FEES] },
    run: { to: "/finance/invoices" },
  },
  {
    id: "record-fee-payment",
    label: "Record fee payment",
    aliases: ["new payment"],
    section: "Finance",
    group: "Fees",
    kind: "do",
    gate: { all: [P.VIEW_FEES] },
    run: { to: "/finance/payments?action=new" },
  },
  {
    id: "view-academic-calendar",
    label: "View academic calendar",
    aliases: ["calendar"],
    section: "Academics",
    group: "Academic session",
    kind: "view",
    gate: { module: ["academics."] },
    run: { to: "/academics/calendar" },
  },
  {
    id: "proxy-user",
    label: "Proxy user",
    aliases: ["view as another user", "impersonate"],
    section: "Account",
    group: "Account",
    kind: "do",
    gate: null,
    run: { command: "proxy" },
  },
  {
    id: "logout",
    label: "Logout",
    aliases: ["sign out", "log out"],
    section: "Account",
    group: "Account",
    kind: "do",
    gate: null,
    run: { command: "logout" },
  },
];

export function testAction(id: string): ActionDef {
  const found = TEST_ACTIONS.find((a) => a.id === id);
  if (!found) throw new Error(`no test action ${id}`);
  return found;
}
