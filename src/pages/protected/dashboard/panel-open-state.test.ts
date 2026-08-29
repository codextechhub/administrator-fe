import { describe, expect, it } from "vitest";
import { initialPanelState, panelOpenReducer, type PanelState } from "./panel-open-state";

// Replay a sequence of actions from the initial state, mirroring how the panel
// dispatches them across renders.
const run = (...actions: Parameters<typeof panelOpenReducer>[1][]): PanelState =>
  actions.reduce(panelOpenReducer, initialPanelState());

describe("panelOpenReducer", () => {
  it("starts closed with no data yet", () => {
    expect(initialPanelState()).toEqual({ expanded: false, sawBlocking: false });
    // A first frame with nothing broken keeps it closed.
    expect(run({ type: "data", hasBlocking: false })).toEqual({ expanded: false, sawBlocking: false });
  });

  it("opens itself when the first blocking row arrives after an empty first render", () => {
    const state = run({ type: "data", hasBlocking: false }, { type: "data", hasBlocking: true });
    expect(state.expanded).toBe(true);
    expect(state.sawBlocking).toBe(true);
  });

  it("does not re-open after the reader collapses and a poll returns the same blocking row", () => {
    const state = run(
      { type: "data", hasBlocking: true }, // blocking arrives -> auto-open
      { type: "close" }, // reader minimizes
      { type: "data", hasBlocking: true }, // refetch/poll returns the same blocking row
      { type: "data", hasBlocking: true }, // and again
    );
    expect(state.expanded).toBe(false);
  });

  it("re-opens when blocking clears and then returns as a fresh problem", () => {
    const state = run(
      { type: "data", hasBlocking: true }, // blocking arrives -> auto-open
      { type: "close" }, // reader minimizes
      { type: "data", hasBlocking: false }, // blocking clears (falling edge)
      { type: "data", hasBlocking: true }, // a new incident (rising edge) re-opens
    );
    expect(state.expanded).toBe(true);
  });

  it("stays put on an explicit Maximize even while no blocking is present", () => {
    const state = run({ type: "data", hasBlocking: false }, { type: "open" }, { type: "data", hasBlocking: false });
    expect(state.expanded).toBe(true);
  });

  it("leaves an already-open panel open when the same blocking row keeps arriving", () => {
    const state = run(
      { type: "data", hasBlocking: true },
      { type: "data", hasBlocking: true },
      { type: "data", hasBlocking: true },
    );
    expect(state.expanded).toBe(true);
  });

  it("never treats a persisting blocking row as a new rising edge", () => {
    // The reader collapses, blocking persists across many polls: it must remain
    // collapsed the whole time, never springing back on any single poll.
    let state = run({ type: "data", hasBlocking: true }, { type: "close" });
    for (let i = 0; i < 10; i += 1) {
      state = panelOpenReducer(state, { type: "data", hasBlocking: true });
      expect(state.expanded).toBe(false);
    }
  });
});
