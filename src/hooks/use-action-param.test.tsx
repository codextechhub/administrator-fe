// The landing side of the palette's `do` actions.
//
// The interesting case is not "does it fire" - it is what happens when a screen
// reads a deep-link filter AND a palette action in the same commit, which is
// the race consumed-params.ts exists to settle. Declaration order matters to
// that bug, so it gets a case each way round.

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useActionParam } from "./use-action-param";
import { useFilterParam } from "./use-filter-param";

let container: HTMLDivElement;
let root: Root;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

function Probe({ onOpen }: { onOpen: () => void }) {
  const location = useLocation();
  useActionParam("new", onOpen);
  return <output>{location.search}</output>;
}

function TabThenAction({
  onOpen,
  onTab,
}: {
  onOpen: () => void;
  onTab: (value: string) => void;
}) {
  const location = useLocation();
  useFilterParam("tab", ["team", "mine"] as const, onTab);
  useActionParam("new", onOpen);
  return <output>{location.search}</output>;
}

function ActionThenTab({
  onOpen,
  onTab,
}: {
  onOpen: () => void;
  onTab: (value: string) => void;
}) {
  const location = useLocation();
  useActionParam("new", onOpen);
  useFilterParam("tab", ["team", "mine"] as const, onTab);
  return <output>{location.search}</output>;
}

function mount(node: React.ReactNode, at: string) {
  act(() => {
    root.render(<MemoryRouter initialEntries={[at]}>{node}</MemoryRouter>);
  });
}

const search = () => container.querySelector("output")?.textContent ?? "";

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("useActionParam", () => {
  it("opens the flow the address asked for, then clears the address", () => {
    // Otherwise a refresh, or the back button, reopens a create drawer the
    // person already closed.
    const onOpen = vi.fn();
    mount(<Probe onOpen={onOpen} />, "/academic-calendar/events?action=new");

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(search()).toBe("");
  });

  it("fires once, not once per render", () => {
    const onOpen = vi.fn();
    mount(<Probe onOpen={onOpen} />, "/academic-calendar/events?action=new");
    // A fresh inline callback each render is the normal call-site shape.
    mount(<Probe onOpen={onOpen} />, "/academic-calendar/events?action=new");

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("ignores an action it does not answer", () => {
    const onOpen = vi.fn();
    mount(<Probe onOpen={onOpen} />, "/academic-calendar/events?action=export");

    expect(onOpen).not.toHaveBeenCalled();
    // And leaves it alone rather than eating a param meant for somebody else.
    expect(search()).toBe("?action=export");
  });

  it("does nothing at all when there is no action", () => {
    const onOpen = vi.fn();
    mount(<Probe onOpen={onOpen} />, "/academic-calendar/events");

    expect(onOpen).not.toHaveBeenCalled();
    expect(search()).toBe("");
  });

  it("strips both keys when a screen lands with a filter as well", () => {
    // Each hook writes in the same commit and neither sees the other's write:
    // react-router hands the updater the params from the last render. Without
    // the shared registry each would put the other's key back, and whichever
    // ran first would lose its strip.
    const onOpen = vi.fn();
    const onTab = vi.fn();
    mount(<TabThenAction onOpen={onOpen} onTab={onTab} />, "/x?tab=team&action=new");

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onTab).toHaveBeenCalledWith("team");
    expect(search()).toBe("");
  });

  it("strips both keys whichever hook is declared first", () => {
    const onOpen = vi.fn();
    const onTab = vi.fn();
    mount(<ActionThenTab onOpen={onOpen} onTab={onTab} />, "/x?tab=mine&action=new");

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onTab).toHaveBeenCalledWith("mine");
    expect(search()).toBe("");
  });

  it("consumes the instruction even when the screen refuses it", () => {
    // Every call site guards the callback with the same permission that wraps
    // its Add button, so a reader who may not create gets the list screen and
    // no drawer. The param still goes: it was answered, with a no.
    const openDrawer = vi.fn();
    const mayCreate = false;
    mount(
      <Probe onOpen={() => { if (mayCreate) openDrawer(); }} />,
      "/academic-structure/subjects?action=new",
    );

    expect(openDrawer).not.toHaveBeenCalled();
    expect(search()).toBe("");
  });
});
