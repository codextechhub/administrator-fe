import { describe, expect, it, vi } from "vitest";
import { handleStaleChunkPreloadError } from "./stale-chunk";

describe("handleStaleChunkPreloadError", () => {
  it("preserves the original import failure while offline", () => {
    const event = new Event("vite:preloadError", { cancelable: true });
    const reload = vi.fn(() => true);

    handleStaleChunkPreloadError(event, false, reload);

    expect(reload).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it("swallows the import failure when an online recovery reload starts", () => {
    const event = new Event("vite:preloadError", { cancelable: true });

    handleStaleChunkPreloadError(event, true, () => true);

    expect(event.defaultPrevented).toBe(true);
  });

  it("preserves the import failure when the reload-loop guard declines", () => {
    const event = new Event("vite:preloadError", { cancelable: true });

    handleStaleChunkPreloadError(event, true, () => false);

    expect(event.defaultPrevented).toBe(false);
  });
});
