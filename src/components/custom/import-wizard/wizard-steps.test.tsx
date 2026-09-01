import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/redux/services/dashboard/import-api", () => ({
  useGetImportJobsQuery: () => ({ data: { data: [{ id: 42 }] } }),
  useGetImportJobQuery: () => ({
    data: {
      data: {
        id: 42,
        status: "succeeded",
        progress_percent: 100,
        processed_rows: 3,
        succeeded_rows: 3,
        failed_rows: 0,
        skipped_rows: 0,
        total_rows: 3,
      },
    },
  }),
}));

import { ImportProgressStep } from "./wizard-steps";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("ImportProgressStep", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.useRealTimers();
  });

  it("hands the discovered async job id to the completion callback", async () => {
    const onComplete = vi.fn();
    await act(async () => {
      root.render(
        <ImportProgressStep batchId={7} jobId={null} onComplete={onComplete} />,
      );
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(801);
    });

    expect(onComplete).toHaveBeenCalledOnce();
    expect(onComplete).toHaveBeenCalledWith(42);
  });
});
