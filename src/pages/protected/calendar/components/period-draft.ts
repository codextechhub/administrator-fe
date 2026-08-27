import type {
  DayOfWeek,
  Period,
  PeriodType,
} from "@/redux/services/calendar/calendar-types";

// The period form's shape. Split from the drawer for the same reason as the
// other two: a screen builds a draft without importing a form.

export interface PeriodDraft {
  label: string;
  start_time: string;
  end_time: string;
  period_type: PeriodType;
  /** Null means every teaching day, which is the common case. */
  day_of_week: DayOfWeek | null;
  /** Null is school-wide. -1 means "one branch" with none named yet. */
  branch: number | null;
  is_active: boolean;
}

export function blankPeriod(branch: number | "all"): PeriodDraft {
  return {
    label: "",
    start_time: "",
    end_time: "",
    period_type: "LESSON",
    day_of_week: null,
    branch: typeof branch === "number" ? branch : null,
    is_active: true,
  };
}

export function periodDraftFrom(period: Period): PeriodDraft {
  return {
    label: period.label,
    // The API sends HH:MM:SS; a time input takes HH:MM and rejects the rest.
    start_time: (period.start_time ?? "").slice(0, 5),
    end_time: (period.end_time ?? "").slice(0, 5),
    period_type: period.period_type,
    day_of_week: period.day_of_week,
    branch: period.branch ?? null,
    is_active: period.is_active,
  };
}
