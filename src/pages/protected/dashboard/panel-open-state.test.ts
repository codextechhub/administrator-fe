import { describe, expect, it } from "vitest";
import { initialPanelState, panelOpenReducer, type PanelState } from "./panel-open-state";

// Replay a sequence of actions from the initial state, mirroring how the panel
// dispatches them across renders.
const run = (...actions: Parameters<typeof panelOpenReducer>[1][]): PanelState =>
  actions.reduce(panelOpenReducer, initialPanelState());

describe("panelOpenReducer", () => {
  it("starts closed with no data yet", () => {
    expect(initialPanelState()).toEqual({ expanded: false, sawRed: false });
    // A first frame with nothing broken keeps it closed.
    expect(run({ type: "data", hasRed: false })).toEqual({ expanded: false, sawRed: false });
  });

  it("opens itself when the first red row arrives after an empty first render", () => {
    const state = run({ type: "data", hasRed: false }, { type: "data", hasRed: true });
    expect(state.expanded).toBe(true);
    expect(state.sawRed).toBe(true);
  });

  it("does not re-open after the reader collapses and a poll returns the same red row", () => {
    const state = run(
      { type: "data", hasRed: true }, // red arrives -> auto-open
      { type: "close" }, // reader minimizes
      { type: "data", hasRed: true }, // refetch/poll returns the same red row
      { type: "data", hasRed: true }, // and again
    );
    expect(state.expanded).toBe(false);
  });

  it("re-opens when red clears and then returns as a fresh problem", () => {
    const state = run(
      { type: "data", hasRed: true }, // red arrives -> auto-open
      { type: "close" }, // reader minimizes
      { type: "data", hasRed: false }, // red clears (falling edge)
      { type: "data", hasRed: true }, // a new incident (rising edge) re-opens
    );
    expect(state.expanded).toBe(true);
  });

  it("stays put on an explicit Maximize even while no red is present", () => {
    const state = run({ type: "data", hasRed: false }, { type: "open" }, { type: "data", hasRed: false });
    expect(state.expanded).toBe(true);
  });

  it("leaves an already-open panel open when the same red row keeps arriving", () => {
    const state = run(
      { type: "data", hasRed: true },
      { type: "data", hasRed: true },
      { type: "data", hasRed: true },
    );
    expect(state.expanded).toBe(true);
  });

  it("never treats a persisting red row as a new rising edge", () => {
    // The reader collapses, red persists across many polls: it must remain
    // collapsed the whole time, never springing back on any single poll.
    let state = run({ type: "data", hasRed: true }, { type: "close" });
    for (let i = 0; i < 10; i += 1) {
      state = panelOpenReducer(state, { type: "data", hasRed: true });
      expect(state.expanded).toBe(false);
    }
  });
});
