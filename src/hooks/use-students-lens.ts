import { useBranchLens } from "@/hooks/use-branch-lens";
import { useSessionLens } from "@/hooks/use-session-lens";

/**
 * The lens every People screen reads through: WHICH BRANCH.
 *
 * Shaped like useAcademicsLens so the two read the same at a call site:
 *
 *     useGetStudentsQuery({ ...lens, search, page })
 *
 * and a screen has to go out of its way to drop it. That mattered: `?branch=`
 * was wired on the students list, the summary, the unplaced list, the guardian
 * directory and the class seat counts, and then only two of the five People
 * screens passed it. The directory narrowed and the guardian list beside it did
 * not, which is the same screen contradicting itself one click apart.
 *
 * ── The session, and the one thing it cannot answer ─────────────────────────
 *
 * The ROLL is per-year and so is the CLASS. Lagoon View had 85 students in
 * 2026/2027 and has 73 in 2027/2028, and a child in SSS1 A last year is in
 * SSS2 A this one. Those are facts about students that only a year can answer,
 * which is why this lens carries one.
 *
 * What a year cannot answer is STATUS. `Student.status` is a single current
 * column, and guardians and documents carry no year at all. So under a session
 * lens the roll and the classes are historical while the chips beside them are
 * current - and the screens say so rather than implying the module knows who
 * was suspended in 2026. The server flags it back as `status_is_current`.
 *
 * An earlier version of this file argued the asymmetry meant no year control at
 * all. That was wrong: it threw away the two things a year CAN answer to avoid
 * mis-stating the one it cannot, when the fix was to label the one.
 */

export function useStudentsLens() {
  const branchLens = useBranchLens();
  const sessionLens = useSessionLens();

  // "all" is the pill's word for every branch; the API wants the key absent,
  // and a single-branch school has no branch dimension in its responses at all.
  const branch =
    branchLens.applies && branchLens.branch !== "all"
      ? (branchLens.branch as number)
      : undefined;

  // Left OFF while the year list is still loading, so the first request does
  // not answer about the server's default year and then refetch - which shows
  // the wrong roll for one frame.
  const session = sessionLens.current?.id;

  return {
    /** Spread into any People list query. */
    lens: { branch, session },
    session,
    sessionName: sessionLens.current?.name ?? null,
    /** False before a year exists, or when there is only one. */
    multiSession: sessionLens.applies,
    /**
     * True while a year other than the school's current one is being read.
     *
     * The screens use it to say that the chips are current where the roll is
     * not - see the header note on the directory.
     */
    pastYear:
      Boolean(sessionLens.current) &&
      sessionLens.current?.status !== "ACTIVE",
    branch,
    /** False at a single-branch school - render no branch control, and say nothing about branches. */
    multiBranch: branchLens.applies,
    /** "All branches", or the branch's name. For a screen that names what it is showing. */
    label: branchLens.label,
    /** True while a single branch is being read, so a screen can say which. */
    narrowed: branch !== undefined,
    isLoading: branchLens.isLoading || sessionLens.isLoading,
  };
}
