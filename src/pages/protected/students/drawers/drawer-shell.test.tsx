import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { Field } from "./drawer-shell";

/**
 * A wrapping <label> looks equivalent to htmlFor and is not. The accessible
 * name is computed from the label's text, and a control embedded inside it
 * contributes its own content - so a <select> wrapped in a label announced as
 * "Gender Select a gender Female Male", reading the whole option list back as
 * the name of the field. It also made the form untestable by label, which is
 * how it was noticed.
 */
function parse(markup: string) {
  return new DOMParser().parseFromString(markup, "text/html");
}

describe("Field", () => {
  it("ties the label to the control rather than wrapping it", () => {
    const doc = parse(
      renderToStaticMarkup(
        <Field label="Gender">
          <select>
            <option value="">Select a gender</option>
            <option value="FEMALE">Female</option>
          </select>
        </Field>,
      ),
    );
    const label = doc.querySelector("label");
    const select = doc.querySelector("select");
    expect(label?.textContent).toBe("Gender");
    expect(label?.querySelector("select")).toBeNull();
    expect(label?.getAttribute("for")).toBeTruthy();
    expect(select?.getAttribute("id")).toBe(label?.getAttribute("for"));
  });

  it("describes the control with its hint instead of naming it", () => {
    const doc = parse(
      renderToStaticMarkup(
        <Field label="Admission number" hint="Leave blank to issue one later.">
          <input />
        </Field>,
      ),
    );
    const input = doc.querySelector("input");
    const describedBy = input?.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(doc.getElementById(describedBy as string)?.textContent).toBe(
      "Leave blank to issue one later.",
    );
  });

  it("marks a field with an error as invalid, and prefers it over the hint", () => {
    const doc = parse(
      renderToStaticMarkup(
        <Field label="First name" hint="As it appears on the birth certificate." error="A first name is required.">
          <input />
        </Field>,
      ),
    );
    const input = doc.querySelector("input");
    expect(input?.getAttribute("aria-invalid")).toBe("true");
    const describedBy = input?.getAttribute("aria-describedby") as string;
    expect(doc.getElementById(describedBy)?.textContent).toBe(
      "A first name is required.",
    );
  });
});
