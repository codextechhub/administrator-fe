// What the derivation must keep true, not what it happens to produce today.
//
// These tests do NOT pin the number of finance screens or the wording of any
// one of them: @xvs/finance adding a screen or renaming one must not turn a
// test red, because picking those up without an edit here is the entire reason
// the actions are derived.

import { describe, expect, it } from "vitest";
import {
  schoolFinanceNav,
  schoolProcurementNav,
} from "@/components/layout/console-nav-for-school";
import { FINANCE_MOUNTED_PATHS } from "@/routes/protected/finance-routes";
import { PROCUREMENT_MOUNTED_PATHS } from "@/routes/protected/procurement-routes";
import { consoleActions, consoleActionId, EXTRA_ALIASES } from "./console-actions";
import { CONSOLE_ACTIONS } from "./registry";
import type { ConsoleNavGroup } from "@/components/finance-ui/console-nav";

const NAV_URLS = [...schoolFinanceNav, ...schoolProcurementNav]
  .flatMap((group) => group.items)
  .map((item) => item.url);

describe("actions derived from a console nav", () => {
  it("offers every screen the sidebar offers, and no others", () => {
    // The whole point: one list, two readers. A screen in the sidebar that the
    // search box has never heard of is the state this replaced.
    const destinations = CONSOLE_ACTIONS.map((action) =>
      "to" in action.run ? action.run.to : "",
    );
    expect(destinations.sort()).toEqual([...NAV_URLS].sort());
  });

  it("can only reach screens the router mounts", () => {
    for (const action of CONSOLE_ACTIONS) {
      if (!("to" in action.run)) continue;
      const mounted =
        FINANCE_MOUNTED_PATHS.has(action.run.to) ||
        PROCUREMENT_MOUNTED_PATHS.has(action.run.to);
      expect(mounted, action.run.to).toBe(true);
    }
  });

  it("leads every label with a verb the matcher expands", () => {
    // A bare "Payroll" is reached by typing "payroll" and nothing else. With the
    // verb in front, "open payroll", "show payroll" and "list payroll" all land.
    for (const action of CONSOLE_ACTIONS) {
      expect(action.label, action.id).toMatch(/^View /);
    }
  });

  it("gates every action on a backend key prefix", () => {
    // A console action with no gate would offer the finance dashboard to a
    // class teacher who holds not one finance key.
    for (const action of CONSOLE_ACTIONS) {
      expect(action.gate, action.id).toHaveProperty("module");
    }
  });

  it("writes no alias for a screen the consoles do not offer", () => {
    // The table is keyed by url, and a typo in a key is silent: the alias
    // simply never applies and "suppliers" quietly stops finding Vendors.
    const offered = new Set(NAV_URLS);
    for (const url of Object.keys(EXTRA_ALIASES)) {
      expect(offered.has(url), url).toBe(true);
    }
  });

  it("keys ids off the url, so a rename upstream keeps a user's ranking", () => {
    expect(consoleActionId("/finance/receivables/invoices")).toBe(
      "finance-receivables-invoices",
    );
    expect(consoleActionId("/procurement")).toBe("procurement");
  });
});

describe("titles that appear in both consoles", () => {
  const NAV: ConsoleNavGroup[] = [
    { items: [{ title: "Dashboard", url: "/a" }] },
    { label: "Admin", items: [{ title: "Settings", url: "/a/settings" }] },
  ];
  const OTHER: ConsoleNavGroup[] = [
    { items: [{ title: "Dashboard", url: "/b" }] },
    { label: "Admin", items: [{ title: "Reports", url: "/b/reports" }] },
  ];
  const built = consoleActions([
    { nav: NAV, section: "Finance", name: "Alpha", modulePrefix: "alpha." },
    { nav: OTHER, section: "Procurement", name: "Beta", modulePrefix: "beta." },
  ]);
  const labelOf = (url: string) =>
    built.find((action) => "to" in action.run && action.run.to === url)?.label;

  it("names the console, so two rows are not both 'View Dashboard'", () => {
    expect(labelOf("/a")).toBe("View Alpha Dashboard");
    expect(labelOf("/b")).toBe("View Beta Dashboard");
  });

  it("leaves a title that appears once alone", () => {
    expect(labelOf("/a/settings")).toBe("View Settings");
    expect(labelOf("/b/reports")).toBe("View Reports");
  });

  it("keeps the bare title as an alias of a disambiguated row", () => {
    const dashboard = built.find((action) => action.id === "a");
    expect(dashboard?.aliases).toContain("Dashboard");
  });

  it("takes the group heading as the row's detail line", () => {
    expect(built.find((a) => a.id === "a-settings")?.group).toBe("Admin");
    // A group with no heading is the console's own pinned row.
    expect(built.find((a) => a.id === "a")?.group).toBe("Alpha");
  });

  it("falls back to the console's own prefix when an item declares none", () => {
    expect(built.find((a) => a.id === "a")?.gate).toEqual({ module: ["alpha."] });
  });
});
