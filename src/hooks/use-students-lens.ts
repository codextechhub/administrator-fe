import { useBranchLens } from "@/hooks/use-branch-lens";

// ─────────────────────────────────────────────────────────────────────────────
// The lens every People screen reads through: WHICH BRANCH.
//
// Shaped like useAcademicsLens so the two read the same at a call site:
//
//     useGetStudentsQuery({ ...lens, search, page })
//
// and a screen has to go out of its way to drop it. That mattered: `?branch=`
// was wired on the students list, the summary, the unplaced list, the guardian
// directory and the class seat counts, and then only two of the five People
// screens passed it. The directory narrowed and the guardian list beside it did
// not, which is the same screen contradicting itself one click apart.
//
// ── Why there is no session here, unlike academics ──────────────────────────
//
// Academics carries a year because its rows BELONG to one: a level, a class and
// a subject offering are all per-session, so reading last year back is what the
// year control is for.
//
// A person is not per-session. `Student.status` is one current column, and
// guardians and documents carry no year at all - only the class placement is
// recorded per year, on ClassEnrolment. A year filter here would return a
// register that is one fifth historical and four fifths current, with nothing
// on screen separating the two: last year's SSS3 listing a child correctly from
// their enrolment row, with today's Graduated chip beside their name.
//
// The historical question is answered where it can be answered honestly - the
// class register reads its own class's year, and the profile carries the class
// trail. See section 2.0 of docs/students-design-phases.md.
// ─────────────────────────────────────────────────────────────────────────────

export function useStudentsLens() {
  const branchLens = useBranchLens();

  // "all" is the pill's word for every branch; the API wants the key absent,
  // and a single-branch school has no branch dimension in its responses at all.
  const branch =
    branchLens.applies && branchLens.branch !== "all"
      ? (branchLens.branch as number)
      : undefined;

  return {
    /** Spread into any People list query. */
    lens: { branch },
    branch,
    /** False at a single-branch school - render no branch control, and say nothing about branches. */
    multiBranch: branchLens.applies,
    /** "All branches", or the branch's name. For a screen that names what it is showing. */
    label: branchLens.label,
    /** True while a single branch is being read, so a screen can say which. */
    narrowed: branch !== undefined,
    isLoading: branchLens.isLoading,
  };
}
