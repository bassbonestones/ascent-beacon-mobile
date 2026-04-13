import type { Task } from "../../types";
import {
  countIntradayOccurrenceSlotsPerDay,
  defaultRecurrenceIntervalMinutesFromRRule,
} from "../../utils/taskSorting";

/**
 * Max ``required_occurrence_count`` for ``next_occurrence``: slots in one upstream period bucket (daily intraday count, else 1).
 */
export function maxRequiredCompletionsForNextOccurrence(upstream: Task): number {
  if (!upstream.is_recurring) {
    return 1;
  }
  const r = (upstream.recurrence_rule || "").toUpperCase();
  if (r.includes("FREQ=DAILY")) {
    return countIntradayOccurrenceSlotsPerDay(upstream.recurrence_rule);
  }
  return 1;
}

/**
 * Max ``required_occurrence_count`` for ``within_window``: completions that could fit in the window given upstream cadence.
 */
export function maxRequiredCompletionsForWithinWindow(
  upstream: Task,
  validityWindowMinutes: number | null,
): number {
  if (!upstream.is_recurring) {
    return 1;
  }
  const windowM =
    validityWindowMinutes ??
    defaultRecurrenceIntervalMinutesFromRRule(upstream.recurrence_rule);
  const r = (upstream.recurrence_rule || "").toUpperCase();
  if (r.includes("FREQ=DAILY")) {
    const slotsPerDay = countIntradayOccurrenceSlotsPerDay(
      upstream.recurrence_rule,
    );
    const fractionalDays = Math.max(windowM / 1440, Number.EPSILON);
    return Math.max(1, Math.ceil(fractionalDays * slotsPerDay));
  }
  if (r.includes("FREQ=WEEKLY")) {
    return Math.max(1, Math.ceil(windowM / 10080));
  }
  if (r.includes("FREQ=MONTHLY")) {
    return Math.max(1, Math.ceil(windowM / 43200));
  }
  if (r.includes("FREQ=YEARLY")) {
    return Math.max(1, Math.ceil(windowM / 525600));
  }
  if (r.includes("FREQ=HOURLY")) {
    return Math.max(1, Math.ceil(windowM / 60));
  }
  const interval = defaultRecurrenceIntervalMinutesFromRRule(
    upstream.recurrence_rule,
  );
  return Math.max(1, Math.ceil(windowM / Math.max(1, interval)));
}

/** For ``all_occurrences`` + recurring upstream: implicit required count = all slots in one upstream day bucket. */
export function implicitRequiredCountAllOccurrencesRecurring(
  upstream: Task,
): number {
  return maxRequiredCompletionsForNextOccurrence(upstream);
}
