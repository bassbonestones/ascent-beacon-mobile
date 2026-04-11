import type { Task } from "../types";
import { parseAsUtc, toLocalDateString } from "../utils/taskSorting";

/**
 * Build scheduled_for / local_date for task completion or skip API calls.
 * Mirrors TasksScreen occurrence logic.
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
      scheduledFor = occDate.toISOString();
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
      scheduledFor = today.toISOString();
      localDate = toLocalDateString(getCurrentDate());
    } else {
      const today = getCurrentDate();
      today.setHours(0, 0, 0, 0);
      scheduledFor = today.toISOString();
      localDate = toLocalDateString(getCurrentDate());
    }
  }
  return { scheduledFor, localDate };
}
