import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import {
  selectSessionLens,
  setSessionLens,
} from "@/redux/features/academics/lens-slice";
import { useGetSessionsQuery } from "@/redux/services/academics/academics-api";
import type { AcademicSession } from "@/redux/services/academics/academics-types";

// ─────────────────────────────────────────────────────────────────────────────
// The session lens.
//
// It LABELS, it does not filter. Nothing in the academic structure ties a class
// or a subject to a year, so changing the year changes the heading on the tree
// and which session the detail screen opens - and nothing else. The backend
// says the same thing in StructureTreeView's docstring. Stated here because a
// reader would reasonably assume otherwise and "fix" it into a filter.
//
// Defaults to the ACTIVE year, not the first row: a school with a draft year
// for next term should still land on the one it is running.
//
// It RECEDES at one session, the way the branch pill recedes at one branch. A
// picker with a single option is not a choice - it is a label pretending to be
// a control, and a reader who taps it learns nothing. The screens still know
// which year they are in; they just do not ask.
// ─────────────────────────────────────────────────────────────────────────────

export function useSessionLens() {
  const dispatch = useAppDispatch();
  const lens = useAppSelector(selectSessionLens);

  const { data, isLoading } = useGetSessionsQuery();
  const sessions = useMemo<AcademicSession[]>(() => data?.data ?? [], [data]);

  const active = useMemo(
    () => sessions.find((s) => s.status === "ACTIVE") ?? sessions[0] ?? null,
    [sessions],
  );

  // Adopt the active year once, and re-adopt if the lens points at a year that
  // has since been deleted - otherwise the pill names a session nobody can open.
  useEffect(() => {
    if (!sessions.length) return;
    const stillThere = lens.id != null && sessions.some((s) => s.id === lens.id);
    if (stillThere) return;
    dispatch(active ? setSessionLens({ id: active.id, name: active.name }) : setSessionLens(null));
  }, [dispatch, sessions, lens.id, active]);

  const current = sessions.find((s) => s.id === lens.id) ?? active;

  return {
    /**
     * Only worth showing when there is something to switch BETWEEN.
     *
     * Nothing to name before the first year is written, and nothing to choose
     * when there is exactly one.
     */
    applies: sessions.length > 1,
    sessions,
    current,
    label: current?.name ?? "No session yet",
    isLoading,
    setSession: (s: AcademicSession) =>
      dispatch(setSessionLens({ id: s.id, name: s.name })),
  };
}
