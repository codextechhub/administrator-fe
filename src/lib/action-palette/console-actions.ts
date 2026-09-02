// Finance and Procurement palette actions, derived from their sidebars.
//
// ── Why derived rather than typed out ────────────────────────────────────────
//
// These two areas are fifty-odd screens, and none of them are this app's to
// name: they ship inside @xvs/finance and move on a version bump. A typed copy
// is a second list to keep in step with the first, and the drift is silent in
// both directions. When the package renames "Customers / Payers" to "Payers"
// and adds a Write-offs screen, a typed registry goes on offering a name that
// no longer exists and never offers the one that does - and nobody finds out
// until a bursar types "write off", gets nothing, and concludes the search box
// does not know about finance.
//
// `schoolFinanceNav` / `schoolProcurementNav` are the right source rather than
// the package's raw `financeNav` / `procurementNav`: they are already filtered
// through the router's mounted paths (see console-nav-for-school.ts), so an
// action cannot exist for a screen this app does not serve. That is the same
// guarantee registry.test.ts checks by hand for the typed entries, except here
// it holds by construction.
//
// ── What the nav does not carry ──────────────────────────────────────────────
//
// A nav item is read in place, under its group heading, by somebody who is
// already looking at it. A palette row is read on its own, by somebody who
// typed a guess and is deciding whether this is the thing they meant. So two
// things are added on the way through:
//
//   - a verb in front of the title, because the matcher expands a leading verb
//     through its synonym groups (VERB_GROUPS in match.ts). "View Payroll" is
//     reached by "open payroll", "show payroll" and "list payroll"; a bare
//     "Payroll" is reached by none of them.
//   - aliases for the words a school types that the package's own title does
//     not contain. Nobody at Corona Secondary types "goods receipt note" as
//     "Goods Receipts", and half of them type "suppliers" for Vendors.

import type { ConsoleNavGroup } from "@/components/finance-ui/console-nav";
import type { ActionDef, ActionSection } from "./types";

export interface ConsoleSource {
  /** Already narrowed to what this app mounts. */
  nav: ConsoleNavGroup[];
  section: ActionSection;
  /** The console's own name, used to tell two "Dashboard"s apart. */
  name: string;
  /**
   * Backend key prefix gating the console as a whole, for the handful of items
   * that declare no prefixes of their own (the dashboards, and Approvals).
   *
   * `null` would be wrong for those: the sidebar only draws the door to an area
   * when the reader holds SOME key inside it (`hasModuleAccess("finance.")` in
   * app-sidebar.tsx), and a palette that ignored that would offer a finance
   * dashboard to a class teacher who holds not one finance key.
   */
  modulePrefix: string;
}

/**
 * Words a school types that the package's titles do not contain.
 *
 * Keyed by url, not by title. A title is the package's wording and can be
 * reworded upstream at any time; the url only changes when the screen actually
 * moves, which is the one case where an alias SHOULD be re-examined.
 *
 * These are match keys and are never rendered, which is why plain-English
 * guesses ("who we owe", "chase unpaid fees") belong here and not on screen.
 */
export const EXTRA_ALIASES: Record<string, string[]> = {
  "/finance": ["money", "bursary", "accounts"],
  "/finance/setup/accounts": ["coa", "ledger accounts", "account codes"],
  "/finance/ledger": ["journals", "postings", "double entry"],
  "/finance/setup/periods": ["open period", "close period", "financial year"],
  "/finance/setup/tax-codes": ["vat", "wht"],
  "/finance/setup/cost-centers": ["cost centres"],
  "/finance/receivables/customers": ["payers", "who owes us"],
  "/finance/receivables/invoices": ["bills", "school fees", "fee invoices"],
  "/finance/receivables/receipts": ["record payment", "allocate payment", "money received"],
  "/finance/receivables/credit-notes": ["debit notes", "adjustments"],
  "/finance/receivables/refunds": ["write off", "write-offs"],
  "/finance/receivables/payment-plans": ["instalments", "installments", "pay in parts"],
  "/finance/receivables/concessions": ["discounts", "waivers", "scholarships", "bursaries"],
  "/finance/receivables/dunning": ["reminders", "chase unpaid fees", "overdue"],
  "/finance/receivables/fee-structures": ["fees", "tuition", "fee schedule"],
  "/finance/banking": ["banks", "cash accounts"],
  "/finance/bank-reconciliation": ["reconcile", "bank statement"],
  "/finance/expenses/claims": ["reimbursements", "staff expenses"],
  "/finance/expenses/petty-cash": ["float", "cash box"],
  "/finance/payroll": ["salaries", "wages", "staff pay", "payslips"],
  "/finance/budgets/budgets": ["forecast", "planning"],
  "/finance/budgets/assets": ["depreciation", "equipment register"],
  "/finance/budgets/tax": ["remittance", "paye"],
  "/finance/collections": ["gateway", "online payments", "card payments"],
  "/finance/collections/virtual-accounts": ["dedicated accounts", "transfer accounts"],
  "/finance/reports/trial-balance": ["tb"],
  "/finance/reports/income-statement": ["profit and loss", "p&l", "surplus"],
  "/finance/reports/balance-sheet": ["financial position"],
  "/finance/audit": ["who changed what", "finance history"],
  "/procurement": ["purchasing", "buying", "supply"],
  "/procurement/requisitions": ["purchase requests", "ask to buy"],
  "/procurement/purchase-orders": ["po", "pos", "orders"],
  "/procurement/goods-receipts": ["grn", "deliveries", "received goods"],
  "/procurement/vendor-invoices": ["supplier bills", "what we owe"],
  "/procurement/vendor-payments": ["pay a supplier", "supplier payments"],
  "/procurement/approvals": ["awaiting me", "sign off", "authorise"],
  "/procurement/vendors/vendors": ["suppliers"],
  "/procurement/vendors/catalog": ["price list", "catalogue"],
  "/procurement/sourcing/rfqs": ["request for quote", "tender"],
  "/procurement/sourcing/quotations": ["quotes", "bids"],
  "/procurement/contracts": ["agreements"],
  "/procurement/inventory/items": ["stock", "store", "supplies"],
  "/procurement/inventory/movements": ["stock in", "stock out", "issues"],
  "/procurement/inventory/locations": ["stores", "warehouses"],
  "/procurement/analytics/ap-aging": ["ageing", "how old are our bills"],
  "/procurement/analytics/grir": ["goods received not invoiced"],
  "/procurement/analytics/spend": ["what we spend", "spend analysis"],
  "/procurement/analytics/performance": ["supplier performance", "vendor scorecard"],
};

/**
 * A url as a palette id: "/finance/receivables/invoices" ->
 * "finance-receivables-invoices".
 *
 * Off the url rather than the title because an id is popularity storage's key
 * and must survive a rewording upstream - see the note on ActionDef.id. A
 * title changes when somebody prefers a different word; a url changes only when
 * the screen genuinely moves, and a moved screen has earned a fresh ranking.
 */
export const consoleActionId = (url: string): string =>
  url.split("?")[0].split("/").filter(Boolean).join("-");

interface FlatItem {
  title: string;
  url: string;
  prefixes?: string[];
  group: string;
  source: ConsoleSource;
}

function flatten(sources: ConsoleSource[]): FlatItem[] {
  const out: FlatItem[] = [];
  for (const source of sources) {
    for (const group of source.nav) {
      for (const item of group.items) {
        // A parent with children does not navigate - you click a child. Neither
        // console uses that shape today, but the type allows it and a palette
        // row that goes nowhere is worse than a missing one.
        if (item.children?.length) {
          for (const child of item.children) {
            out.push({ ...child, group: group.label ?? source.name, source });
          }
          continue;
        }
        out.push({
          title: item.title,
          url: item.url,
          prefixes: item.prefixes,
          group: group.label ?? source.name,
          source,
        });
      }
    }
  }
  return out;
}

/**
 * Build palette actions for every screen the given consoles offer.
 *
 * Both consoles are built in one call so a title that appears in both can be
 * told apart. Finance and Procurement each have a "Dashboard" and a "Settings",
 * and two rows reading "View Settings" are two rows nobody can choose between -
 * so those, and only those, are prefixed with the console's name.
 */
export function consoleActions(sources: ConsoleSource[]): ActionDef[] {
  const items = flatten(sources);

  const titleCounts = new Map<string, number>();
  for (const item of items) {
    const key = item.title.toLowerCase();
    titleCounts.set(key, (titleCounts.get(key) ?? 0) + 1);
  }

  return items.map((item) => {
    const ambiguous = (titleCounts.get(item.title.toLowerCase()) ?? 0) > 1;
    const name = ambiguous ? `${item.source.name} ${item.title}` : item.title;
    const label = `View ${name}`;
    const aliases = (EXTRA_ALIASES[item.url] ?? []).filter(
      (alias) => alias.toLowerCase() !== label.toLowerCase(),
    );

    return {
      id: consoleActionId(item.url),
      label,
      // A duplicated title is ambiguous in the label, so the bare title becomes
      // an alias: somebody typing "settings" still reaches both rows, and the
      // console name in each label is what tells them apart.
      aliases: ambiguous ? [item.title, ...aliases] : aliases,
      section: item.source.section,
      group: item.group,
      kind: "view",
      gate: {
        module: item.prefixes?.length ? item.prefixes : [item.source.modulePrefix],
      },
      run: { to: item.url },
    } satisfies ActionDef;
  });
}
