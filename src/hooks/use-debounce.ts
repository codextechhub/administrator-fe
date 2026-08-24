import { useEffect, useState } from "react";

/**
 * A value that settles before anyone acts on it.
 *
 * Used for search boxes that hit the server: without it every keystroke is a
 * request, and the answers can arrive out of order so the list ends up showing
 * the results for "Adae" while the box reads "Adaeze".
 */
export function useDebounce<T>(value: T, delay = 400): T {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return settled;
}
