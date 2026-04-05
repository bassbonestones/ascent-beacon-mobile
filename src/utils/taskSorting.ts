import type { Task } from "../types";

/**
 * Task category for sorting and grouping in Today view.
 */
export type TaskCategory = "overdue" | "timed" | "todo";

/**
 * Parsed window information from recurrence_rule.
 */
export interface TaskWindow {
  start: string; // "HH:MM"
  end: string; // "HH:MM"
  intradayMode: string; // "window" or "interval"
}

/**
 * Extract window information from a recurrence_rule string.
 * Returns null if no window is defined.
 */
export function getTaskWindow(
  recurrenceRule: string | null,
): TaskWindow | null {
  if (!recurrenceRule) return null;

  const parts = recurrenceRule.split(";").reduce(
    (acc, part) => {
      const [key, value] = part.split("=");
      if (key && value) acc[key] = value;
      return acc;
    },
    {} as Record<string, string>,
  );

  const intradayMode = parts["X-INTRADAY"];
  const windowStart = parts["X-WINSTART"];
  const windowEnd = parts["X-WINEND"];

  // Only return window for "window" or "interval" intraday modes
  if (
    (intradayMode === "window" || intradayMode === "interval") &&
    windowStart &&
    windowEnd
  ) {
    return {
      start: windowStart,
      end: windowEnd,
      intradayMode,
    };
  }

  return null;
}

/**
 * Check if a task has a flexible time window (not a specific scheduled time).
 */
export function hasFlexibleWindow(task: Task): boolean {
  return getTaskWindow(task.recurrence_rule) !== null && !task.scheduled_at;
}

/**
 * Get the effective start time for sorting purposes.
 * For scheduled tasks, returns scheduled_at.
 * For window tasks, returns the window start time as a Date for today.
 */
export function getEffectiveStartTime(
  task: Task,
  today: Date = new Date(),
): Date | null {
  if (task.scheduled_at) {
    return new Date(task.scheduled_at);
  }

  const window = getTaskWindow(task.recurrence_rule);
  if (window) {
    const [hours, minutes] = window.start.split(":").map(Number);
    const effectiveDate = new Date(today);
    effectiveDate.setHours(hours, minutes, 0, 0);
    return effectiveDate;
  }

  return null;
}

/**
 * Determine a task's category for Today view display.
 */
export function getTaskCategory(
  task: Task,
  now: Date = new Date(),
): TaskCategory {
  if (task.status !== "pending") {
    // Only pending tasks appear in Today view
    return "todo";
  }

  if (task.scheduled_at) {
    const scheduledDate = new Date(task.scheduled_at);
    if (scheduledDate < now) {
      return "overdue";
    }
    return "timed";
  }

  // Check for flexible window tasks
  if (hasFlexibleWindow(task)) {
    return "timed";
  }

  return "todo";
}

/**
 * Group tasks by category for Today view.
 */
export function groupTasksByCategory(
  tasks: Task[],
  now: Date = new Date(),
): { overdue: Task[]; timed: Task[]; todo: Task[] } {
  const result = {
    overdue: [] as Task[],
    timed: [] as Task[],
    todo: [] as Task[],
  };

  for (const task of tasks) {
    if (task.status !== "pending") continue;

    const category = getTaskCategory(task, now);
    result[category].push(task);
  }

  // Sort each category
  result.overdue.sort((a, b) => {
    // Oldest overdue first
    const aTime = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
    const bTime = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;
    return aTime - bTime;
  });

  result.timed.sort((a, b) => {
    // Earliest time first (use effective start time for window tasks)
    const aEffective = getEffectiveStartTime(a, now);
    const bEffective = getEffectiveStartTime(b, now);
    const aTime = aEffective ? aEffective.getTime() : Infinity;
    const bTime = bEffective ? bEffective.getTime() : Infinity;
    return aTime - bTime;
  });

  result.todo.sort((a, b) => {
    // By creation date, newest first (most recently added)
    const aTime = new Date(a.created_at).getTime();
    const bTime = new Date(b.created_at).getTime();
    return bTime - aTime;
  });

  return result;
}

/**
 * Sort tasks for Today view: overdue → timed → todo.
 */
export function sortTasksForTodayView(
  tasks: Task[],
  now: Date = new Date(),
): Task[] {
  const grouped = groupTasksByCategory(tasks, now);
  return [...grouped.overdue, ...grouped.timed, ...grouped.todo];
}

/**
 * Check if a task is scheduled for today.
 */
export function isTaskForToday(task: Task, today: Date = new Date()): boolean {
  // Recurring tasks that are completed for today should not appear
  if (task.is_recurring && task.completed_for_today) {
    return false;
  }

  if (!task.scheduled_at) {
    // Unscheduled tasks always appear in Today view
    return true;
  }

  const scheduledDate = new Date(task.scheduled_at);
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  // Task is for today if scheduled today OR overdue (scheduled before today)
  return scheduledDate <= todayEnd;
}

/**
 * Filter tasks to only show today's tasks.
 */
export function filterTasksForToday(
  tasks: Task[],
  today: Date = new Date(),
): Task[] {
  return tasks.filter((task) => isTaskForToday(task, today));
}

/**
 * Format time for display (e.g., "9:00 AM").
 */
export function formatTaskTime(scheduledAt: string | null): string | null {
  if (!scheduledAt) return null;

  const date = new Date(scheduledAt);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/**
 * Check if a task is overdue.
 */
export function isTaskOverdue(task: Task, now: Date = new Date()): boolean {
  if (task.status !== "pending" || !task.scheduled_at) {
    return false;
  }
  return new Date(task.scheduled_at) < now;
}

/**
 * Group tasks by date for Upcoming view.
 * Returns map of date string (YYYY-MM-DD) to tasks.
 */
export function groupTasksByDate(tasks: Task[]): Map<string, Task[]> {
  const groups = new Map<string, Task[]>();

  for (const task of tasks) {
    let dateKey: string;
    if (task.scheduled_at) {
      const date = new Date(task.scheduled_at);
      dateKey = date.toISOString().split("T")[0];
    } else if (task.virtualOccurrenceDate) {
      // Virtual occurrences without scheduled_at use virtualOccurrenceDate
      dateKey = task.virtualOccurrenceDate;
    } else {
      // Unscheduled tasks go under "No Date"
      dateKey = "no-date";
    }

    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(task);
  }

  return groups;
}

/**
 * Format date for section header (e.g., "Today", "Tomorrow", "Mon, Apr 7").
 */
export function formatDateHeader(
  dateKey: string,
  today: Date = new Date(),
): string {
  if (dateKey === "no-date") {
    return "No Date";
  }

  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);

  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const dayAfterTomorrow = new Date(todayStart);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  if (date >= todayStart && date < tomorrowStart) {
    return "Today";
  }
  if (date >= tomorrowStart && date < dayAfterTomorrow) {
    return "Tomorrow";
  }

  // Format: "Mon, Apr 7"
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${dayNames[date.getDay()]}, ${monthNames[date.getMonth()]} ${date.getDate()}`;
}

/**
 * Filter tasks for upcoming view (future tasks only, not today).
 */
export function filterTasksForUpcoming(
  tasks: Task[],
  today: Date = new Date(),
): Task[] {
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);
  const todayDateStr = today.toISOString().split("T")[0];

  return tasks.filter((task) => {
    // Check scheduled_at first
    if (task.scheduled_at) {
      return new Date(task.scheduled_at) > todayEnd;
    }

    // For virtual occurrences without scheduled_at, check virtualOccurrenceDate
    if (task.virtualOccurrenceDate) {
      return task.virtualOccurrenceDate > todayDateStr;
    }

    // Unscheduled tasks don't appear in Upcoming (they're in Today)
    return false;
  });
}

/**
 * Condense recurring tasks - show only first occurrence.
 * Returns tasks with condensed recurring tasks grouped.
 */
export function condenseRecurringTasks(tasks: Task[]): Task[] {
  // Separate recurring and non-recurring
  const nonRecurring: Task[] = [];
  const recurringByTitle: Map<string, Task[]> = new Map();

  for (const task of tasks) {
    if (task.is_recurring) {
      const key = `${task.goal_id || "no-goal"}-${task.title}`;
      if (!recurringByTitle.has(key)) {
        recurringByTitle.set(key, []);
      }
      recurringByTitle.get(key)!.push(task);
    } else {
      nonRecurring.push(task);
    }
  }

  // For recurring tasks, only keep the first (sorted by scheduled_at)
  const condensed: Task[] = [];
  for (const [, taskGroup] of recurringByTitle) {
    taskGroup.sort((a, b) => {
      const aTime = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
      const bTime = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;
      return aTime - bTime;
    });
    // Add first occurrence
    condensed.push(taskGroup[0]);
  }

  return [...nonRecurring, ...condensed];
}

/**
 * Parse an RRULE string into its components.
 */
function parseRRule(rrule: string): {
  freq: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  interval: number;
  byDay: string[] | null;
} {
  const parts = rrule.split(";").reduce(
    (acc, part) => {
      const [key, value] = part.split("=");
      if (key && value) acc[key] = value;
      return acc;
    },
    {} as Record<string, string>,
  );

  return {
    freq: (parts.FREQ as "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY") || "DAILY",
    interval: parseInt(parts.INTERVAL || "1", 10),
    byDay: parts.BYDAY ? parts.BYDAY.split(",") : null,
  };
}

/**
 * Convert day abbreviation to day of week number (0 = Sunday).
 */
function dayAbbrevToNumber(abbrev: string): number {
  const dayMap: Record<string, number> = {
    SU: 0,
    MO: 1,
    TU: 2,
    WE: 3,
    TH: 4,
    FR: 5,
    SA: 6,
  };
  return dayMap[abbrev] ?? 1;
}

/**
 * Get the next N occurrences of a recurring task based on its RRULE.
 * Returns dates starting AFTER the baseDate.
 */
function getNextOccurrences(
  rrule: string,
  baseDate: Date,
  count: number,
  upToDate: Date,
): Date[] {
  const { freq, interval, byDay } = parseRRule(rrule);
  const occurrences: Date[] = [];
  const current = new Date(baseDate);

  // Start from the day after baseDate
  current.setDate(current.getDate() + 1);
  current.setHours(
    baseDate.getHours(),
    baseDate.getMinutes(),
    baseDate.getSeconds(),
    0,
  );

  while (occurrences.length < count && current <= upToDate) {
    let isValidDay = true;

    if (freq === "DAILY") {
      // Daily: check every day (or every N days)
      isValidDay = true;
    } else if (freq === "WEEKLY") {
      if (byDay && byDay.length > 0) {
        // Check if current day is in the byDay list
        const currentDayNum = current.getDay();
        isValidDay = byDay.some(
          (day) => dayAbbrevToNumber(day) === currentDayNum,
        );
      }
    } else if (freq === "MONTHLY") {
      // Monthly: same day of month
      isValidDay = current.getDate() === baseDate.getDate();
    } else if (freq === "YEARLY") {
      // Yearly: same month and day
      isValidDay =
        current.getMonth() === baseDate.getMonth() &&
        current.getDate() === baseDate.getDate();
    }

    if (isValidDay) {
      occurrences.push(new Date(current));
    }

    // Move to next day (simple approach that works for all frequencies)
    current.setDate(current.getDate() + 1);
  }

  // Apply interval filtering for DAILY (every N days)
  if (freq === "DAILY" && interval > 1) {
    const filtered = occurrences.filter((occ, idx) => idx % interval === 0);
    return filtered.slice(0, count);
  }

  return occurrences;
}

/**
 * Generate future occurrences of recurring tasks for the Upcoming view.
 * Creates virtual task copies with unique IDs and an occurrence date.
 *
 * @param tasks - Array of tasks to process
 * @param startDate - Start date (typically today)
 * @param daysAhead - How many days ahead to generate (default: 14)
 * @returns Array of tasks including virtual recurring occurrences
 */
export function generateRecurringOccurrences(
  tasks: Task[],
  startDate: Date = new Date(),
  daysAhead: number = 14,
): Task[] {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + daysAhead);
  endDate.setHours(23, 59, 59, 999);

  const result: Task[] = [];

  for (const task of tasks) {
    if (!task.is_recurring || !task.recurrence_rule) {
      // Non-recurring tasks pass through unchanged
      result.push(task);
      continue;
    }

    // Add the original task
    result.push(task);

    // For recurring tasks without scheduled_at, use today as the base date
    // This allows unscheduled recurring tasks to show in upcoming
    const baseDate = task.scheduled_at
      ? new Date(task.scheduled_at)
      : new Date(startDate);

    // If no scheduled time, use start of day
    if (!task.scheduled_at) {
      baseDate.setHours(0, 0, 0, 0);
    }

    // Generate future occurrences
    const futureOccurrences = getNextOccurrences(
      task.recurrence_rule,
      baseDate,
      daysAhead, // max occurrences to generate
      endDate,
    );

    // Check if original task has a specific time (not just a date)
    const originalHasTime = task.scheduled_at !== null;

    for (const occDate of futureOccurrences) {
      // Create a virtual copy with a unique ID
      // Only set scheduled_at if the original task had a specific time
      const virtualTask: Task = {
        ...task,
        id: `${task.id}__${occDate.toISOString().split("T")[0]}`,
        scheduled_at: originalHasTime ? occDate.toISOString() : null,
        completed_for_today: false, // Future occurrences are not completed
        isVirtualOccurrence: true,
        virtualOccurrenceDate: occDate.toISOString().split("T")[0],
        originalTaskId: task.id,
      };
      result.push(virtualTask);
    }
  }

  return result;
}
