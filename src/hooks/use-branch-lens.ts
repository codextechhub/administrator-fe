import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { selectUser } from "@/redux/features/auth/auth-slice";
import {
  type BranchLens,
  selectBranchLens,
  setBranchLens,
} from "@/redux/features/academics/lens-slice";
import { useGetMyBranchesQuery } from "@/redux/services/branches/branches-api";

/**
 * The branch lens, and the two rules that make it safe.
 *
 * **It recedes at a single-branch school.** One option is not a choice, it is
 * noise, and the API already drops every branch-shaped field for such a school.
 * `applies` is false there and the pill does not render at all - absent, not
 * disabled.
 *
 * **A branch-tied admin cannot widen it.** Someone whose account carries a
 * branch sees school-wide rows plus their own branch and nothing else. The
 * server enforces that (`scope_to_visible_branches`), so a widened lens would
 * not leak anything - it would just render a filter that quietly does nothing,
 * which is worse than not offering it. So the lens is pinned to their branch
 * and the menu is replaced by a plain label.
 */

export function useBranchLens() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const lens = useAppSelector(selectBranchLens);

  const { data, isLoading } = useGetMyBranchesQuery();
  const branches = useMemo(() => data?.data ?? [], [data]);

  const tiedBranchId = user?.branch_id ?? null;
  const applies = branches.length > 1;

  // Pin a tied user's lens to their own branch. Done here rather than in the
  // slice's initial state because the branch list arrives after the store does.
  useEffect(() => {
    if (tiedBranchId != null && lens !== tiedBranchId) {
      dispatch(setBranchLens(tiedBranchId));
    }
  }, [dispatch, tiedBranchId, lens]);

  const branch: BranchLens = tiedBranchId ?? lens;

  const label =
    branch === "all"
      ? "All branches"
      : branches.find((b) => b.id === branch)?.name ??
        user?.branch_name ??
        "This branch";

  return {
    /** False at a single-branch school: render nothing at all. */
    applies,
    /** True when the account is tied to one branch and cannot widen. */
    isTied: tiedBranchId != null,
    branch,
    label,
    branches,
    isLoading,
    setBranch: (next: BranchLens) => dispatch(setBranchLens(next)),
  };
}
