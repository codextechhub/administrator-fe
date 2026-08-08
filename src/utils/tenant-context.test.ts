import { describe, expect, it } from "vitest";
import { bindTenantStore, getTenantSlug } from "./tenant-context";

// Unlike console-fe, this app has no impersonation fallback and no
// appendTenantQuery helper - the base query is the only consumer, and it reads
// the asserted slug through getTenantSlug().
describe("getTenantSlug", () => {
  it("reads the slug from the bound store", () => {
    bindTenantStore(() => ({ auth: { tenant: { slug: "greenfield-academy" } } }));
    expect(getTenantSlug()).toBe("greenfield-academy");
  });

  it("returns an empty string when there is no tenant yet (pre-login / legacy token)", () => {
    bindTenantStore(() => ({ auth: { tenant: null } }));
    expect(getTenantSlug()).toBe("");

    bindTenantStore(() => ({ auth: {} }));
    expect(getTenantSlug()).toBe("");

    bindTenantStore(() => ({}));
    expect(getTenantSlug()).toBe("");
  });

  it("returns an empty string for a tenant with a blank slug", () => {
    bindTenantStore(() => ({ auth: { tenant: { slug: "" } } }));
    expect(getTenantSlug()).toBe("");
  });

  it("reflects the live store rather than a value captured at bind time", () => {
    let slug = "first-school";
    bindTenantStore(() => ({ auth: { tenant: { slug } } }));
    expect(getTenantSlug()).toBe("first-school");

    slug = "second-school";
    expect(getTenantSlug()).toBe("second-school");
  });
});
