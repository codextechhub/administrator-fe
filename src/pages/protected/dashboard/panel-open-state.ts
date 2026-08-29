// Open-state decision for the "Action needed" panel, kept pure so the one piece
// of logic with real edges can be unit-tested without a running component.
//
// Two facts have to hold at once, and they pull against each other:
//   1. The panel must open itself the moment something is actually broken (a
//      red-severity row). On a phone there is no hover, so a collapsed header is
//      the only thing between the reader and an unseen blocker.
//   2. It must never fight the reader. The screen refetches on focus and polls
//      every two minutes, so the same blocking row arrives over and over. A reader
//      who put the panel away must stay put away.
//
// The reconciliation is to auto-open on the RISING EDGE of blocking only - the frame
// where a blocking row first appears - not on every frame where one is present. A poll that
// keeps returning the same blocking row is not new information and changes nothing; a
// blocking row that cleared and came back is a fresh problem and opens the panel
// again. `sawBlocking` is the single bit that remembers which of those we are in.
//
// The payload arrives after the first render, so this cannot live in a useState
// initializer: the first frame has no data. The caller feeds each data frame in
// as a `data` action once the rows are known.

export interface PanelState {
  /** Pinned-open state: set by auto-open, or by the reader's Maximize/Minimize. */
  expanded: boolean;
  /**
   * Whether the previous data frame carried a blocking row. Auto-open keys off the
   * transition into red, so this is what makes a repeated poll a no-op.
   */
  sawBlocking: boolean;
}

export type PanelAction =
  | { type: "data"; hasBlocking: boolean }
  | { type: "open" }
  | { type: "close" };

export function initialPanelState(): PanelState {
  // Closed until a blocking row proves otherwise - the first render has no payload.
  return { expanded: false, sawBlocking: false };
}

export function panelOpenReducer(state: PanelState, action: PanelAction): PanelState {
  switch (action.type) {
    case "data": {
      // Rising edge only: open when a blocking row appears where there was none. A blocking row
      // already seen on the previous frame is left alone, so a refetch or the
      // 2-minute poll never re-opens a panel the reader has since collapsed.
      const risingEdge = action.hasBlocking && !state.sawBlocking;
      return {
        expanded: risingEdge ? true : state.expanded,
        sawBlocking: action.hasBlocking,
      };
    }
    case "open":
      return { ...state, expanded: true };
    case "close":
      // The reader's explicit Minimize. `sawBlocking` is untouched, so the current
      // blocking episode cannot re-open the panel - only a new episode can.
      return { ...state, expanded: false };
    default:
      return state;
  }
}
