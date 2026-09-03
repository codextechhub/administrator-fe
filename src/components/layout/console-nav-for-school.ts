/**
 * The finance and procurement sidebars, narrowed to what this app mounts.
 *
 * The nav configs come from @xvs/finance and list every screen the package
 * ships, because the console mounts all of them. This app deliberately does not
 * (see finance-routes.tsx: a school keeps one set of books, bills in naira, and
 * has no use for the payment gateway's own payouts). Without this filter the
 * sidebar offers those links and they land on the 404 page.
 *
 * Filtered against the ROUTES rather than a second list of exclusions. A
 * hand-kept list drifts the first time somebody mounts a screen and forgets the
 * nav, and that failure reads as a broken product rather than a missing edit.
 */
import type { ConsoleNavGroup } from "@/components/finance-ui/console-nav";
import { financeNav } from "@/pages/protected/finance/finance-nav";
import { procurementNav } from "@/pages/protected/procurement/procurement-nav";
import { FINANCE_MOUNTED_PATHS } from "@/routes/protected/finance-routes";
import { PROCUREMENT_MOUNTED_PATHS } from "@/routes/protected/procurement-routes";

const narrow = (
  groups: ConsoleNavGroup[],
  mounted: ReadonlySet<string>,
): ConsoleNavGroup[] =>
  groups
    .map((group) => ({ ...group, items: group.items.filter((i) => mounted.has(i.url)) }))
    // A group whose every item is unmounted would otherwise render as a
    // heading with nothing under it.
    .filter((group) => group.items.length > 0);

export const schoolFinanceNav = narrow(financeNav, FINANCE_MOUNTED_PATHS);
export const schoolProcurementNav = narrow(procurementNav, PROCUREMENT_MOUNTED_PATHS);
