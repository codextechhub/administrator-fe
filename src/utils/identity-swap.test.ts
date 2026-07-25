import { afterEach, describe, expect, it } from "vitest";
import {
  isIdentitySwapInProgress,
  resetIdentitySwapForTests,
  runWithIdentitySwap,
} from "./identity-swap";

afterEach(resetIdentitySwapForTests);

describe("runWithIdentitySwap", () => {
  it("is lowered before any swap runs", () => {
    expect(isIdentitySwapInProgress()).toBe(false);
  });

  it("raises the gate for the duration of the work", async () => {
    let observed = false;
    await runWithIdentitySwap(async () => {
      observed = isIdentitySwapInProgress();
    });
    expect(observed).toBe(true);
    expect(isIdentitySwapInProgress()).toBe(false);
  });

  it("returns the work's value", async () => {
    await expect(runWithIdentitySwap(async () => "done")).resolves.toBe("done");
  });

  // A leaked gate would silently blackhole every request in the app, so the
  // failure path matters more than the happy one.
  it("lowers the gate when the work throws, and rethrows", async () => {
    await expect(
      runWithIdentitySwap(async () => {
        throw new Error("hydration failed");
      }),
    ).rejects.toThrow("hydration failed");
    expect(isIdentitySwapInProgress()).toBe(false);
  });

  // An aborted start restores the actor inside the still-running outer swap:
  // the inner completion must not open the gate early.
  it("stays raised until the outermost nested swap finishes", async () => {
    let afterInner = false;
    await runWithIdentitySwap(async () => {
      await runWithIdentitySwap(async () => {});
      afterInner = isIdentitySwapInProgress();
    });
    expect(afterInner).toBe(true);
    expect(isIdentitySwapInProgress()).toBe(false);
  });

  it("stays raised while concurrent swaps overlap", async () => {
    let release: () => void = () => {};
    const blocker = new Promise<void>((resolve) => {
      release = resolve;
    });
    const slow = runWithIdentitySwap(() => blocker);
    await runWithIdentitySwap(async () => {});
    expect(isIdentitySwapInProgress()).toBe(true);
    release();
    await slow;
    expect(isIdentitySwapInProgress()).toBe(false);
  });
});
