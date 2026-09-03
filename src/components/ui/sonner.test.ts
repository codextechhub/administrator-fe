import { describe, expect, it } from "vitest";
import {
  getNotificationDuration,
  getToastDuration,
  getWorkspaceToastCenter,
  MAX_NOTIFICATION_DURATION_MS,
  MIN_NOTIFICATION_DURATION_MS,
} from "./sonner";

describe("workspace toast positioning", () => {
  it("centers over the expanded dashboard inset", () => {
    expect(getWorkspaceToastCenter("expanded")).toBe("calc(50% + 8rem)");
  });

  it("tracks the collapsed sidebar width", () => {
    expect(getWorkspaceToastCenter("collapsed")).toBe("calc(50% + 1.5rem)");
  });
});

describe("notification display duration", () => {
  it("uses the minimum duration for short messages", () => {
    expect(getNotificationDuration("Saved.")).toBe(MIN_NOTIFICATION_DURATION_MS);
  });

  it("increases the duration as the title and description get longer", () => {
    expect(
      getNotificationDuration("Import finished.", {
        description: "Review the imported records and resolve any rows that need attention.",
      }),
    ).toBe(6_000);
  });

  it("caps long messages at the maximum duration", () => {
    expect(getNotificationDuration("A".repeat(500))).toBe(MAX_NOTIFICATION_DURATION_MS);
  });

  it("lets an error go once it has been read", () => {
    // Severity is not a reason to stay. An error the user can only acknowledge
    // is still only an error to read, and errors that waited forever piled up
    // until nobody read any of them.
    expect(
      getToastDuration({
        title: "The server could not save your changes.",
        type: "error",
      }),
    ).toBe(MIN_NOTIFICATION_DURATION_MS);
  });

  it("gives a long error the reading time its own text earns", () => {
    expect(
      getToastDuration({
        title: "We could not save your changes.",
        description:
          "The session expired while the form was open, so nothing was written. Sign in again and your entries will still be here.",
        type: "error",
      }),
    ).toBe(MAX_NOTIFICATION_DURATION_MS);
  });

  it("keeps notifications with user actions visible", () => {
    expect(
      getToastDuration({
        title: "Import complete.",
        type: "success",
        action: { label: "Review", onClick: () => undefined },
      }),
    ).toBe(Infinity);
  });

  it("keeps an error that offers a way out", () => {
    // The button is the question, and a question that withdraws itself while
    // you are reading it is worse than no question at all.
    expect(
      getToastDuration({
        title: "Could not save.",
        type: "error",
        action: { label: "Retry", onClick: () => undefined },
      }),
    ).toBe(Infinity);
  });

  it("keeps an error with a cancel just as long", () => {
    expect(
      getToastDuration({
        title: "Upload interrupted.",
        type: "error",
        cancel: { label: "Dismiss", onClick: () => undefined },
      }),
    ).toBe(Infinity);
  });
});
