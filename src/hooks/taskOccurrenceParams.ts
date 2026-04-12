import type { Task } from "../types";
import {
  getTaskScheduledDateStr,
  parseAsUtc,
  toLocalDateString,
} from "../utils/taskSorting";

/**
 * `within_window` counts upstream rows with completed_at strictly before
 * downstream_scheduled_for. An occurrence at local 00:00:00 would exclude every
 * later same-day completion — show 0/N. Treat exact midnight like "that calendar day".
 */
export function anchorScheduledInstantForDependencyRules(d: Date): Date {
  const out = new Date(d.getTime());
  if (
    out.getHours() === 0 &&
    out.getMinutes() === 0 &&
    out.getSeconds() === 0 &&
    out.getMilliseconds() === 0
  ) {
    out.setHours(23, 59, 59, 999);
  }
  return out;
}

/**
 * Build scheduled_for / local_date for task completion or skip API calls.
 * Mirrors TasksScreen occurrence logic.
 *
 * Non-recurring tasks still need `scheduled_for` when the API evaluates
 * `within_window` dependencies — the backend anchors the window to this
 * instant; if it is omitted, count-based progress stays at 0/N.
 */
export function buildOccurrenceParams(
  task: Task,
  getCurrentDate: () => Date,
): { scheduledFor?: string; localDate?: string } {
  let scheduledFor: string | undefined;
  let localDate: string | undefined;
  if (task.is_recurring) {
    if (task.isVirtualOccurrence && task.virtualOccurrenceDate) {
      const [year, month, day] = task.virtualOccurrenceDate
        .split("-")
        .map(Number);
      const occDate = new Date(year, month - 1, day);
      if (task.scheduled_at) {
        const time = parseAsUtc(task.scheduled_at);
        occDate.setHours(
          time.getHours(),
          time.getMinutes(),
          time.getSeconds(),
          0,
        );
      }
      scheduledFor = anchorScheduledInstantForDependencyRules(
        occDate,
      ).toISOString();
      localDate = task.virtualOccurrenceDate;
    } else if (task.scheduled_at) {
      const originalTime = parseAsUtc(task.scheduled_at);
      const today = getCurrentDate();
      today.setHours(
        originalTime.getHours(),
        originalTime.getMinutes(),
        originalTime.getSeconds(),
        0,
      );
      scheduledFor = anchorScheduledInstantForDependencyRules(
        today,
      ).toISOString();
      localDate = toLocalDateString(getCurrentDate());
    } else {
      // End of local day: within_window uses completed_at < downstream_scheduled_for;
      // midnight would exclude every same-day completion (0/N progress).
      const today = getCurrentDate();
      today.setHours(23, 59, 59, 999);
      scheduledFor = today.toISOString();
      localDate = toLocalDateString(getCurrentDate());
    }
  } else if (task.scheduled_at) {
    const dateStr = getTaskScheduledDateStr(task);
    const originalTime = parseAsUtc(task.scheduled_at);
    if (dateStr) {
      const [year, month, day] = dateStr.split("-").map(Number);
      const occDate = new Date(year, month - 1, day);
      occDate.setHours(
        originalTime.getHours(),
        originalTime.getMinutes(),
        originalTime.getSeconds(),
        0,
      );
      scheduledFor = anchorScheduledInstantForDependencyRules(
        occDate,
      ).toISOString();
      localDate = dateStr;
    } else {
      const today = getCurrentDate();
      today.setHours(
        originalTime.getHours(),
        originalTime.getMinutes(),
        originalTime.getSeconds(),
        0,
      );
      scheduledFor = anchorScheduledInstantForDependencyRules(
        today,
      ).toISOString();
      localDate = toLocalDateString(getCurrentDate());
    }
  } else if (task.scheduled_date) {
    const [year, month, day] = task.scheduled_date.split("-").map(Number);
    const d = new Date(year, month - 1, day, 23, 59, 59, 999);
    scheduledFor = d.toISOString();
    localDate = task.scheduled_date;
  }
  return { scheduledFor, localDate };
}
