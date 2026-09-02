import { describe, expect, it } from "vitest";
import { schoolFinanceNav } from "@/components/layout/console-nav-for-school";
import { financeNav } from "@/pages/protected/finance/finance-nav";

describe("the school's finance sidebar", () => {
  const urls = (g: typeof financeNav) => g.flatMap((x) => x.items).map((i) => i.url);

  it("drops what this app does not mount", () => {
    const shown = urls(schoolFinanceNav);
    for (const gone of ["/finance/setup/entities", "/finance/setup/currencies",
                        "/finance/setup/dimensions", "/finance/payments/payouts"]) {
      expect(shown, `${gone} should not be offered`).not.toContain(gone);
    }
  });

  it("keeps what it does mount", () => {
    const shown = urls(schoolFinanceNav);
    for (const kept of ["/finance", "/finance/setup/accounts",
                        "/finance/receivables/fee-structures", "/finance/payroll"]) {
      expect(shown, `${kept} should be offered`).toContain(kept);
    }
  });

  it("actually narrows the package's nav", () => {
    expect(urls(schoolFinanceNav).length).toBeLessThan(urls(financeNav).length);
  });
});
