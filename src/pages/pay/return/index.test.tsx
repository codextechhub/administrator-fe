import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const params = vi.fn();
vi.mock("react-router", () => ({ useSearchParams: () => [params()] }));

const { default: PaymentReturn } = await import("./index");

function render(query: string) {
  params.mockReturnValue(new URLSearchParams(query));
  return renderToStaticMarkup(<PaymentReturn />);
}

describe("the payment return page", () => {
  // Landing here means the provider finished with the browser, not that money
  // moved. The receipt is booked by the webhook. Claiming success on a redirect
  // is how a declined card ends up believed.
  it("never claims the payment succeeded", () => {
    const html = render("reference=CXP-1");

    expect(html).not.toMatch(/payment (was )?successful/i);
    expect(html).not.toMatch(/paid successfully/i);
    expect(html).toContain("confirming your payment");
  });

  it("shows the reference the payer can quote", () => {
    expect(render("reference=CXP-12609011")).toContain("CXP-12609011");
  });

  it("accepts the provider's other reference parameter", () => {
    expect(render("trxref=CXP-99")).toContain("CXP-99");
  });

  it("still renders when the provider sends no reference at all", () => {
    const html = render("");

    expect(html).toContain("Thank you");
    expect(html).not.toContain("Payment reference");
  });
});
