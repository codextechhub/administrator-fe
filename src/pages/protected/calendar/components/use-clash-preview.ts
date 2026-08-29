import { useEffect, useRef, useState } from "react";

import type { ClashWarning } from "@/redux/services/calendar/calendar-types";

// The asking half of the clash preview, split from the box that renders it.
// Same reason every draft type in this module sits beside its drawer rather
// than inside it: react-refresh only works when a file exports components
// alone, and a hook worth reading on its own should not need a component tree
// to be understood.

/**
 * How long the form must sit still before asking.
 *
 * Every keystroke in a picker would otherwise be a request. Long enough that
 * choosing a teacher and then a room asks once, short enough that the answer is
 * there before a reader's hand reaches the button.
 */
const SETTLE_MS = 350;

export function useClashPreview<T>({
  values,
  ready,
  ask,
}: {
  /** The draft. Serialised, so the effect re-runs on a real change only. */
  values: T;
  /** False while the draft is too incomplete to be worth asking about. */
  ready: boolean;
  ask: (values: T) => Promise<{ refusal?: string | null; warnings: ClashWarning[] }>;
}) {
  const [warnings, setWarnings] = useState<ClashWarning[]>([]);
  const [refusal, setRefusal] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const askRef = useRef(ask);
  askRef.current = ask;

  const key = ready ? JSON.stringify(values) : "";

  useEffect(() => {
    if (!key) {
      setWarnings([]);
      setRefusal(null);
      return;
    }
    let live = true;
    setAsking(true);
    const timer = window.setTimeout(async () => {
      try {
        const answer = await askRef.current(JSON.parse(key) as T);
        if (!live) return;
        setWarnings(answer.warnings ?? []);
        setRefusal(answer.refusal ?? null);
      } catch {
        // A preview that cannot be fetched must not stop the school working.
        // The write still reports the clash afterwards, which is where this
        // screen was before the preview existed.
        if (live) {
          setWarnings([]);
          setRefusal(null);
        }
      } finally {
        if (live) setAsking(false);
      }
    }, SETTLE_MS);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [key]);

  // The tick is about THIS draft. Change the room and the acknowledgement is
  // no longer about anything the reader agreed to.
  useEffect(() => {
    setAcknowledged(false);
  }, [key]);

  return {
    warnings,
    refusal,
    asking,
    acknowledged,
    setAcknowledged,
    /** True when there is something to accept and it has not been accepted. */
    blocked: warnings.length > 0 && !acknowledged,
    reset: () => {
      setWarnings([]);
      setRefusal(null);
      setAcknowledged(false);
    },
  };
}
