import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import CustomTable from "./custom-table";

// The loading state is a *shape* promise: while a list loads the user should
// see the table that is about to arrive (ghost rows under the real header),
// not a spinner. These lock the geometry - ghost row count and, critically,
// ghost column count derived from the real column definitions, so the ghosts
// line up under the headers instead of drifting.

const HEADERS = ["S/N", "Student", "Class", "Guardian", "Status", "Action"];

function renderLoading(props: Record<string, unknown> = {}) {
  const html = renderToStaticMarkup(
    <CustomTable tableHeaderList={HEADERS} loading tableBodyList={[]} {...props} />,
  );
  return new DOMParser().parseFromString(html, "text/html");
}

describe("CustomTable loading skeleton", () => {
  it("renders six ghost rows", () => {
    const doc = renderLoading();
    expect(doc.querySelectorAll('tr[aria-hidden="true"]')).toHaveLength(6);
  });

  it("gives every ghost row one cell per column definition", () => {
    const doc = renderLoading();
    const ghostRows = Array.from(doc.querySelectorAll('tr[aria-hidden="true"]'));
    for (const row of ghostRows) {
      expect(row.querySelectorAll("td")).toHaveLength(HEADERS.length);
    }
  });

  it("tracks the column count when the definitions change", () => {
    const short = ["Name", "Status"];
    const html = renderToStaticMarkup(
      <CustomTable tableHeaderList={short} loading tableBodyList={[]} />,
    );
    const doc = new DOMParser().parseFromString(html, "text/html");
    const row = doc.querySelector('tr[aria-hidden="true"]');
    expect(row?.querySelectorAll("td")).toHaveLength(short.length);
  });

  it("keeps the header row real so the ghosts have columns to align under", () => {
    const doc = renderLoading();
    const heads = doc.querySelectorAll("th");
    expect(Array.from(heads).map((h) => h.textContent)).toEqual(HEADERS);
  });

  it("shows no spinner", () => {
    const doc = renderLoading();
    expect(doc.querySelector(".loader")).toBeNull();
  });

  it("announces loading once for the surface, not once per ghost row", () => {
    const doc = renderLoading();
    const live = doc.querySelectorAll('[role="status"]');
    expect(live).toHaveLength(1);
    expect(live[0].className).toContain("sr-only");
  });

  it("keeps loadingText working as the accessible announcement", () => {
    const doc = renderLoading({ loadingText: "Fetching students…" });
    expect(doc.querySelector('[role="status"]')?.textContent).toBe(
      "Fetching students…",
    );
  });

  it("falls back to a generic announcement when loadingText is absent", () => {
    const doc = renderLoading();
    expect(doc.querySelector('[role="status"]')?.textContent).toBe("Loading…");
  });

  it("uses stable, deterministic ghost widths across renders", () => {
    const first = renderToStaticMarkup(
      <CustomTable tableHeaderList={HEADERS} loading tableBodyList={[]} />,
    );
    const second = renderToStaticMarkup(
      <CustomTable tableHeaderList={HEADERS} loading tableBodyList={[]} />,
    );
    expect(first).toBe(second);
  });

  it("still renders the empty state when not loading", () => {
    const html = renderToStaticMarkup(
      <CustomTable tableHeaderList={HEADERS} tableBodyList={[]} />,
    );
    expect(html).toContain("No available data.");
    expect(html).not.toContain('aria-hidden="true"');
  });
});
