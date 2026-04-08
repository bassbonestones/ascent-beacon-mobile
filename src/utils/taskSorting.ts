import type { Task } from "../types";

/**
 * Convert a Date to local YYYY-MM-DD string.
 * Using toISOString().split("T")[0] gives UTC date which is wrong after local midnight.
 */
export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get the scheduled date string (YYYY-MM-DD) from a task.
 * Uses virtualOccurrenceDate for virtual occurrences, scheduled_date for date-only tasks,
 * parses scheduled_at for timed tasks. Returns null if the task is unscheduled.
 */
export function getTaskScheduledDateStr(task: Task): string | null {
  // For virtual occurrences, use virtualOccurrenceDate (not the original task's scheduled_date)
  // The original task's scheduled_date is the recurrence START date, not this occurrence's date
  if (task.isVirtualOccurrence && task.virtualOccurrenceDate) {
    return task.virtualOccurrenceDate;
  }
  // Date-only tasks: use scheduled_date directly
  if (task.scheduled_date) {
    return task.scheduled_date;
  }
  // Timed tasks: parse scheduled_at
  if (task.scheduled_at) {
    return toLocalDateString(parseAsUtc(task.scheduled_at));
  }
  // Unscheduled
  return null;
}

/**
 * Check if a task is scheduled for a specific date (YYYY-MM-DD).
 */
export function isTaskScheduledForDate(task: Task, dateStr: string): boolean {
  const taskDateStr = getTaskScheduledDateStr(task);
  return taskDateStr === dateStr;
}

/**
 * Check if a task is scheduled (has any date set).
 */
export function isTaskScheduled(task: Task): boolean {
  return !!(task.scheduled_date || task.scheduled_at);
}

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

  // Only return window for "window" intraday mode (flexible time window)
  // Interval mode generates specific times, so it shouldn't show as a window
  if (intradayMode === "window" && windowStart && windowEnd) {
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
    return parseAsUtc(task.scheduled_at);
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

  // Check explicit isOverdue flag (set on virtual occurrences for past dates)
  if (task.isOverdue) {
    return "overdue";
  }

  const nowDateStr = toLocalDateString(now);

  // For virtual occurrences, use virtualOccurrenceDate (not the original task's scheduled_date)
  // The original task's scheduled_date is the recurrence START date, not this occurrence's date
  if (task.isVirtualOccurrence && task.virtualOccurrenceDate) {
    if (task.virtualOccurrenceDate < nowDateStr) {
      return "overdue";
    }
    // Has a date, so goes in timed section
    return "timed";
  }

  // Date-only tasks: use scheduled_date
  if (task.scheduled_date) {
    if (task.scheduled_date < nowDateStr) {
      return "overdue";
    }
    return "timed"; // date_only tasks scheduled for today or future go in timed section
  }

  // Timed tasks: use scheduled_at
  if (task.scheduled_at) {
    const scheduledDate = parseAsUtc(task.scheduled_at);

    // Compare timestamps for timed tasks
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
    // Get the effective date for sorting
    const getOverdueDate = (task: Task): string => {
      if (task.virtualOccurrenceDate) return task.virtualOccurrenceDate;
      if (task.scheduled_date) return task.scheduled_date;
      if (task.scheduled_at)
        return toLocalDateString(parseAsUtc(task.scheduled_at));
      return "9999-99-99"; // Unscheduled at the end
    };

    const aDate = getOverdueDate(a);
    const bDate = getOverdueDate(b);

    // First, sort by date (oldest first)
    if (aDate !== bDate) {
      return aDate.localeCompare(bDate);
    }

    // Same date: timed tasks before untimed (scheduled_at means timed)
    const aHasTime = !!a.scheduled_at;
    const bHasTime = !!b.scheduled_at;

    if (aHasTime && !bHasTime) return -1;
    if (!aHasTime && bHasTime) return 1;

    // Both timed: sort by time (earliest first)
    if (aHasTime && bHasTime) {
      const aTime = a.scheduled_at ? parseAsUtc(a.scheduled_at).getTime() : 0;
      const bTime = b.scheduled_at ? parseAsUtc(b.scheduled_at).getTime() : 0;
      return aTime - bTime;
    }

    // Both untimed: by creation date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
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
  // Anytime tasks never appear in Today view - they have their own tab
  if (task.scheduling_mode === "anytime") {
    return false;
  }

  // Recurring tasks that are completed for today should not appear
  // BUT: virtual occurrences should NOT be filtered here - they have their own status
  if (
    task.is_recurring &&
    task.completed_for_today &&
    !task.isVirtualOccurrence
  ) {
    return false;
  }

  const todayStr = toLocalDateString(today);

  // For virtual occurrences, use virtualOccurrenceDate (not the original task's scheduled_date)
  // The original task's scheduled_date is the recurrence START date, not this occurrence's date
  if (task.isVirtualOccurrence && task.virtualOccurrenceDate) {
    // Task is for today if scheduled for today OR overdue (scheduled before today)
    return task.virtualOccurrenceDate <= todayStr;
  }

  // Date-only tasks: use scheduled_date
  if (task.scheduled_date) {
    // Task is for today if scheduled for today OR overdue (scheduled before today)
    return task.scheduled_date <= todayStr;
  }

  // Timed tasks: use scheduled_at
  if (task.scheduled_at) {
    const scheduledDate = parseAsUtc(task.scheduled_at);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    // Task is for today if scheduled today OR overdue (scheduled before today)
    return scheduledDate <= todayEnd;
  }

  // Unscheduled tasks (not anytime) appear in Today view
  return true;
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
 * Parse a datetime string, treating it as UTC if no timezone is specified.
 * Backend may return datetime with "+00:00" offset or without timezone suffix.
 */
export function parseAsUtc(dateString: string): Date {
  // If no timezone indicator, append Z to treat as UTC
  if (
    !dateString.includes("Z") &&
    !dateString.includes("+") &&
    !dateString.includes("-", 10)
  ) {
    return new Date(dateString + "Z");
  }
  return new Date(dateString);
}

/**
 * Get timezone abbreviation for display (e.g., "EST", "PST").
 * Falls back to offset format (e.g., "GMT-5") if abbreviation unavailable.
 * @param date - Date object to get timezone for
 * @param overrideTimezone - Optional IANA timezone to use instead of local
 */
export function getTimezoneAbbreviation(
  date: Date = new Date(),
  overrideTimezone?: string,
): string {
  try {
    // Use Intl to get timezone name in specified timezone
    const options: Intl.DateTimeFormatOptions = {
      timeZoneName: "short",
      ...(overrideTimezone && { timeZone: overrideTimezone }),
    };
    const timeString = date.toLocaleTimeString("en-US", options);
    const match = timeString.match(/\s([A-Z]{2,5}|UTC[+-]?\d*)$/i);
    if (match) {
      return match[1];
    }
  } catch {
    // Fall through to fallback
  }
  // Fallback: calculate GMT offset from date's local timezone
  const offset = -date.getTimezoneOffset();
  const hours = Math.floor(Math.abs(offset) / 60);
  const sign = offset >= 0 ? "+" : "-";
  return `GMT${sign}${hours}`;
}

/**
 * Get time components in a specific timezone.
 * @param date - UTC Date object
 * @param timezone - IANA timezone identifier
 */
function getTimeInTimezone(
  date: Date,
  timezone: string,
): { hours: number; minutes: number; seconds: number; ms: number } {
  try {
    // Parse the date in the target timezone
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const hours = parseInt(
      parts.find((p) => p.type === "hour")?.value || "0",
      10,
    );
    const minutes = parseInt(
      parts.find((p) => p.type === "minute")?.value || "0",
      10,
    );
    const seconds = parseInt(
      parts.find((p) => p.type === "second")?.value || "0",
      10,
    );
    return { hours, minutes, seconds, ms: date.getMilliseconds() };
  } catch {
    // Fallback to local time
    return {
      hours: date.getHours(),
      minutes: date.getMinutes(),
      seconds: date.getSeconds(),
      ms: date.getMilliseconds(),
    };
  }
}

/**
 * Format time for display (e.g., "9:00 AM EST").
 * Uses manual formatting to avoid Hermes/React Native Intl issues.
 * @param scheduledAt - ISO datetime string
 * @param schedulingMode - If 'date_only', returns null (no time to show)
 * @param showTimezone - Whether to include timezone abbreviation (default: true)
 * @param overrideTimezone - Optional IANA timezone to display time in
 */
export function formatTaskTime(
  scheduledAt: string | null,
  schedulingMode?: string | null,
  showTimezone: boolean = true,
  overrideTimezone?: string,
): string | null {
  if (!scheduledAt) return null;
  // 'date_only' means the user only set a date, not a specific time
  if (schedulingMode === "date_only") return null;

  const date = parseAsUtc(scheduledAt);

  // Get time components in the target timezone
  const { hours, minutes, seconds, ms } = overrideTimezone
    ? getTimeInTimezone(date, overrideTimezone)
    : {
        hours: date.getHours(),
        minutes: date.getMinutes(),
        seconds: date.getSeconds(),
        ms: date.getMilliseconds(),
      };

  // Heuristic: if time is exactly midnight and no scheduling_mode is set,
  // this is likely a date-only task (created before scheduling_mode was added)
  // Very few people schedule tasks at exactly 12:00:00.000 AM
  if (
    !schedulingMode &&
    hours === 0 &&
    minutes === 0 &&
    seconds === 0 &&
    ms === 0
  ) {
    return null;
  }

  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const displayMinute = minutes.toString().padStart(2, "0");

  const timeStr = `${displayHour}:${displayMinute} ${ampm}`;
  if (showTimezone) {
    return `${timeStr} ${getTimezoneAbbreviation(date, overrideTimezone)}`;
  }
  return timeStr;
}

/**
 * Check if a task is overdue.
 */
export function isTaskOverdue(task: Task, now: Date = new Date()): boolean {
  // If explicitly set on virtual occurrence, use that value
  if (task.isOverdue !== undefined) {
    return task.isOverdue;
  }

  // Not overdue if not pending
  if (task.status !== "pending") {
    return false;
  }

  // Phase 4g: Habitual recurring tasks are never overdue - they auto-skip
  // Only essential recurring tasks show as overdue
  if (task.is_recurring && task.recurrence_behavior === "habitual") {
    return false;
  }

  // Recurring tasks that are completed or skipped for today are not overdue
  if (
    task.is_recurring &&
    (task.completed_for_today || task.skipped_for_today)
  ) {
    return false;
  }

  const nowDateStr = toLocalDateString(now);

  // For virtual occurrences, use virtualOccurrenceDate (not the original task's scheduled_date)
  // The original task's scheduled_date is the recurrence START date, not this occurrence's date
  if (task.isVirtualOccurrence && task.virtualOccurrenceDate) {
    return task.virtualOccurrenceDate < nowDateStr;
  }

  // Date-only tasks: compare against scheduled_date
  if (task.scheduled_date) {
    return task.scheduled_date < nowDateStr;
  }

  // Timed tasks: compare against scheduled_at
  if (task.scheduled_at) {
    const scheduledDate = parseAsUtc(task.scheduled_at);
    return scheduledDate < now;
  }

  // Unscheduled tasks are not overdue
  return false;
}

/**
 * Group tasks by date for Upcoming view.
 * Returns map of date string (YYYY-MM-DD) to tasks.
 */
export function groupTasksByDate(tasks: Task[]): Map<string, Task[]> {
  const groups = new Map<string, Task[]>();

  for (const task of tasks) {
    let dateKey: string;

    // For virtual occurrences, always use virtualOccurrenceDate
    // (they inherit scheduled_date from the original task, which would be wrong)
    if (task.isVirtualOccurrence && task.virtualOccurrenceDate) {
      dateKey = task.virtualOccurrenceDate;
    } else if (task.scheduled_date) {
      // Check scheduled_date for date-only tasks
      dateKey = task.scheduled_date;
    } else if (task.scheduled_at) {
      // Timed tasks: extract date from scheduled_at
      const date = parseAsUtc(task.scheduled_at);
      dateKey = toLocalDateString(date);
    } else if (task.virtualOccurrenceDate) {
      // Virtual occurrences without scheduling use virtualOccurrenceDate
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

  // Sort tasks within each date group:
  // 1. Timed tasks first (by time), then date-only tasks (by creation date)
  for (const [, groupTasks] of groups) {
    groupTasks.sort((a, b) => {
      // Helper to check if a task has a specific time set
      const hasSpecificTime = (task: Task): boolean => {
        if (task.scheduling_mode === "date_only") return false;
        if (!task.scheduled_at) return false;
        // Heuristic: midnight with no scheduling_mode = likely date-only (legacy)
        if (!task.scheduling_mode) {
          const date = parseAsUtc(task.scheduled_at);
          if (
            date.getHours() === 0 &&
            date.getMinutes() === 0 &&
            date.getSeconds() === 0 &&
            date.getMilliseconds() === 0
          ) {
            return false;
          }
        }
        return true;
      };

      const aHasTime = hasSpecificTime(a);
      const bHasTime = hasSpecificTime(b);

      // Timed tasks come before date-only tasks
      if (aHasTime && !bHasTime) return -1;
      if (!aHasTime && bHasTime) return 1;

      // Both have times: sort by scheduled time
      if (aHasTime && bHasTime) {
        const aTime = parseAsUtc(a.scheduled_at!).getTime();
        const bTime = parseAsUtc(b.scheduled_at!).getTime();
        return aTime - bTime;
      }

      // Neither has time: sort by creation date (newest first)
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  }

  return groups;
}

/**
 * Format date for section header (e.g., "TODAY - THU, APR 7", "TOMORROW - FRI, APR 8", "Mon, Apr 7").
 * @param dateKey - Date string in YYYY-MM-DD format
 * @param today - Reference date for today/tomorrow calculation
 * @param isOverdue - If true and date is before today, format as "OVERDUE - MON, APR 5"
 */
export function formatDateHeader(
  dateKey: string,
  today: Date = new Date(),
  isOverdue: boolean = false,
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

  // Format: "Mon, Apr 7" or "MON, APR 7" (uppercase for today/tomorrow/overdue)
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
  const dateStr = `${dayNames[date.getDay()]}, ${monthNames[date.getMonth()]} ${date.getDate()}`;

  if (date >= todayStart && date < tomorrowStart) {
    return `TODAY - ${dateStr.toUpperCase()}`;
  }
  if (date >= tomorrowStart && date < dayAfterTomorrow) {
    return `TOMORROW - ${dateStr.toUpperCase()}`;
  }

  // Overdue dates (before today) get OVERDUE prefix
  if (isOverdue && date < todayStart) {
    return `OVERDUE - ${dateStr.toUpperCase()}`;
  }

  return dateStr;
}

/**
 * Filter tasks for upcoming view (today and future tasks).
 */
export function filterTasksForUpcoming(
  tasks: Task[],
  today: Date = new Date(),
): Task[] {
  const todayDateStr = toLocalDateString(today);

  return tasks.filter((task) => {
    // Anytime tasks never appear in Upcoming view - they have their own tab
    if (task.scheduling_mode === "anytime") {
      return false;
    }

    // For virtual occurrences, use virtualOccurrenceDate (not the original task's scheduled_date)
    // The original task's scheduled_date is the recurrence START date, not this occurrence's date
    if (task.isVirtualOccurrence && task.virtualOccurrenceDate) {
      return task.virtualOccurrenceDate >= todayDateStr;
    }

    // Check scheduled_date first (date-only tasks)
    if (task.scheduled_date) {
      return task.scheduled_date >= todayDateStr;
    }

    // Check scheduled_at - compare LOCAL dates to avoid timezone issues
    if (task.scheduled_at) {
      const scheduledDate = parseAsUtc(task.scheduled_at);
      const scheduledDateStr = toLocalDateString(scheduledDate);
      return scheduledDateStr >= todayDateStr;
    }

    // For virtual occurrences without scheduled_at, check virtualOccurrenceDate
    if (task.virtualOccurrenceDate) {
      return task.virtualOccurrenceDate >= todayDateStr;
    }

    // Unscheduled tasks don't appear in Upcoming (they're in Today only)
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
 * Intraday mode type.
 */
type IntradayMode =
  | "single"
  | "anytime"
  | "specific_times"
  | "interval"
  | "window";

/**
 * Parsed RRULE with intraday extensions.
 */
interface ParsedRRule {
  freq: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  interval: number;
  byDay: string[] | null;
  // End conditions
  count: number | null; // Total number of recurrences (null = no limit)
  until: string | null; // End date in YYYYMMDD format (null = no limit)
  // Intraday extensions
  intradayMode: IntradayMode;
  specificTimes: string[]; // For specific_times mode
  intervalMinutes: number; // For interval mode
  windowStart: string; // For interval/window modes
  windowEnd: string;
  dailyOccurrences: number; // For anytime mode
}

/**
 * Parse an RRULE string into its components including intraday extensions.
 */
function parseRRule(rrule: string): ParsedRRule {
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
    // End conditions
    count: parts.COUNT ? parseInt(parts.COUNT, 10) : null,
    until: parts.UNTIL || null,
    // Intraday extensions
    intradayMode: (parts["X-INTRADAY"] as IntradayMode) || "single",
    specificTimes: parts["X-TIMES"] ? parts["X-TIMES"].split(",") : [],
    intervalMinutes: parseInt(parts["X-INTERVALMIN"] || "30", 10),
    windowStart: parts["X-WINSTART"] || "09:00",
    windowEnd: parts["X-WINEND"] || "21:00",
    // Default to 0 (unlimited) - only limit if explicitly set
    dailyOccurrences: parts["X-DAILYOCC"]
      ? parseInt(parts["X-DAILYOCC"], 10)
      : 0,
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
 * Generate past occurrences going backward from a base date.
 * Used to find missed/overdue recurring task occurrences.
 */
function getPastOccurrences(
  rrule: string,
  baseDate: Date,
  count: number,
  downToDate: Date,
): Date[] {
  const { freq, interval, byDay } = parseRRule(rrule);
  const occurrences: Date[] = [];
  const current = new Date(baseDate);

  // Start from the day before baseDate
  current.setDate(current.getDate() - 1);
  current.setHours(
    baseDate.getHours(),
    baseDate.getMinutes(),
    baseDate.getSeconds(),
    0,
  );

  while (occurrences.length < count && current >= downToDate) {
    let isValidDay = true;

    if (freq === "DAILY") {
      isValidDay = true;
    } else if (freq === "WEEKLY") {
      if (byDay && byDay.length > 0) {
        const currentDayNum = current.getDay();
        isValidDay = byDay.some(
          (day) => dayAbbrevToNumber(day) === currentDayNum,
        );
      }
    } else if (freq === "MONTHLY") {
      isValidDay = current.getDate() === baseDate.getDate();
    } else if (freq === "YEARLY") {
      isValidDay =
        current.getMonth() === baseDate.getMonth() &&
        current.getDate() === baseDate.getDate();
    }

    if (isValidDay) {
      occurrences.push(new Date(current));
    }

    // Move to previous day
    current.setDate(current.getDate() - 1);
  }

  // Apply interval filtering for DAILY (every N days)
  if (freq === "DAILY" && interval > 1) {
    const filtered = occurrences.filter((occ, idx) => idx % interval === 0);
    return filtered.slice(0, count);
  }

  return occurrences;
}

/**
 * Generate times for interval mode (every X minutes between start and end).
 * Returns array of "HH:MM" strings.
 */
function generateIntervalTimes(
  windowStart: string,
  windowEnd: string,
  intervalMinutes: number,
  maxOccurrences?: number,
): string[] {
  const [startH, startM] = windowStart.split(":").map(Number);
  const [endH, endM] = windowEnd.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  const times: string[] = [];
  let currentMinutes = startMinutes;

  while (currentMinutes <= endMinutes) {
    if (maxOccurrences && times.length >= maxOccurrences) break;

    const h = Math.floor(currentMinutes / 60);
    const m = currentMinutes % 60;
    times.push(
      `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`,
    );
    currentMinutes += intervalMinutes;
  }

  return times;
}

/**
 * Generate intraday occurrences for a single day.
 * Returns array of { time: string | null, suffix: string } for each occurrence.
 */
function getIntradayOccurrences(
  parsed: ParsedRRule,
): { time: string | null; suffix: string }[] {
  switch (parsed.intradayMode) {
    case "single":
      // Single time mode: one occurrence with no suffix
      return [{ time: null, suffix: "" }];

    case "anytime":
      // X times per day with no specific time
      // Default to 1 if not specified
      const numOccurrences =
        parsed.dailyOccurrences > 0 ? parsed.dailyOccurrences : 1;
      return Array.from({ length: numOccurrences }, (_, i) => ({
        time: null,
        suffix: `__occ${i + 1}`,
      }));

    case "specific_times":
      // One occurrence per specified time
      if (parsed.specificTimes.length === 0) {
        return [{ time: null, suffix: "" }];
      }
      return parsed.specificTimes.map((time) => ({
        time,
        suffix: `__${time.replace(":", "")}`,
      }));

    case "interval":
      // Generate times from window and interval
      const intervalTimes = generateIntervalTimes(
        parsed.windowStart,
        parsed.windowEnd,
        parsed.intervalMinutes,
        parsed.dailyOccurrences > 0 ? parsed.dailyOccurrences : undefined,
      );
      if (intervalTimes.length === 0) {
        return [{ time: null, suffix: "" }];
      }
      return intervalTimes.map((time) => ({
        time,
        suffix: `__${time.replace(":", "")}`,
      }));

    case "window":
      // Flexible window: one occurrence with no specific time
      return [{ time: null, suffix: "" }];

    default:
      return [{ time: null, suffix: "" }];
  }
}

/**
 * Generate future occurrences of recurring tasks for the Upcoming view.
 * Creates virtual task copies with unique IDs and an occurrence date.
 * Handles intraday modes (multiple times per day, specific times, intervals).
 *
 * @param tasks - Array of tasks to process
 * @param startDate - Start date (typically today)
 * @param daysAhead - How many days ahead to generate (default: 14)
 * @param daysBack - How many days back to generate for missed occurrences (default: 7)
 * @returns Array of tasks including virtual recurring occurrences
 */
export function generateRecurringOccurrences(
  tasks: Task[],
  startDate: Date = new Date(),
  daysAhead: number = 14,
  daysBack: number = 7,
): Task[] {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + daysAhead);
  endDate.setHours(23, 59, 59, 999);

  // Calculate start of past range for overdue detection
  const pastStartDate = new Date(startDate);
  pastStartDate.setDate(pastStartDate.getDate() - daysBack);
  pastStartDate.setHours(0, 0, 0, 0);

  // Get today's date string for comparison
  const todayStr = toLocalDateString(startDate);

  const result: Task[] = [];

  for (const task of tasks) {
    if (!task.is_recurring || !task.recurrence_rule) {
      // Non-recurring tasks pass through unchanged
      result.push(task);
      continue;
    }

    // Check if this recurring task has a future start date
    // If scheduled_at is in the future, don't generate occurrences before that date
    let taskStartDate: Date | null = null;
    let taskStartDateStr: string | null = null;
    if (task.scheduled_at) {
      taskStartDate = parseAsUtc(task.scheduled_at);
      taskStartDateStr = toLocalDateString(taskStartDate);
    }

    // Parse the RRULE including intraday extensions
    const parsed = parseRRule(task.recurrence_rule);

    // Get intraday occurrences for this task
    const intradayOccs = getIntradayOccurrences(parsed);

    // Calculate effective end date based on UNTIL
    let effectiveEndDate = endDate;
    if (parsed.until) {
      // Parse UNTIL date (format: YYYYMMDD or YYYYMMDDTHHMMSSZ)
      const untilStr = parsed.until.replace(/T.*$/, ""); // Strip time part
      const year = parseInt(untilStr.slice(0, 4), 10);
      const month = parseInt(untilStr.slice(4, 6), 10) - 1;
      const day = parseInt(untilStr.slice(6, 8), 10);
      const untilDate = new Date(year, month, day, 23, 59, 59, 999);
      if (untilDate < effectiveEndDate) {
        effectiveEndDate = untilDate;
      }
    }

    // Track how many days we've generated (for COUNT limit)
    // For intraday modes, COUNT means "number of days", not individual occurrences
    let daysGenerated = 0;
    const maxDays = parsed.count; // null means no limit

    // Check if today is within the recurrence limit
    const todayWithinLimit = maxDays === null || daysGenerated < maxDays;
    const todayWithinUntil = startDate <= effectiveEndDate;

    // Track how many occurrences have been completed today
    // (used to mark virtual occurrences as complete)
    const completionsToday = task.completions_today || 0;
    // For interval/specific_times modes, use actual completion times for matching
    const completedTimesSet = new Set(
      (task.completed_times_today || []).map((t) => {
        // Parse as UTC (backend returns without Z suffix), then get LOCAL hours
        const d = parseAsUtc(t);
        return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
      }),
    );

    // Track skipped times for matching
    const skippedTimesSet = new Set(
      (task.skipped_times_today || []).map((t) => {
        const d = parseAsUtc(t);
        return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
      }),
    );
    const skipsToday = task.skips_today || 0;

    // Check if today is a valid day for this recurrence rule
    // For WEEKLY with BYDAY, only show on matching days
    const todayDayOfWeek = startDate.getDay(); // 0=Sun, 1=Mon, etc.
    let todayMatchesRule = true;
    if (parsed.freq === "WEEKLY" && parsed.byDay && parsed.byDay.length > 0) {
      const validDays = parsed.byDay.map(dayAbbrevToNumber);
      todayMatchesRule = validDays.includes(todayDayOfWeek);
    }

    // Check if today is on or after the task's start date
    const todayAfterStart = !taskStartDateStr || todayStr >= taskStartDateStr;

    // For the original task, we need to add occurrences for TODAY
    // (but only if it's a multi-occurrence mode AND within limits AND matches rule AND after start)
    if (
      todayWithinLimit &&
      todayWithinUntil &&
      todayMatchesRule &&
      todayAfterStart
    ) {
      if (intradayOccs.length > 1 || intradayOccs[0].time !== null) {
        // Multi-occurrence mode: create virtual tasks for today
        const todayDateStr = toLocalDateString(startDate);
        let occIndex = 0;
        let skipIndex = 0;
        for (const occ of intradayOccs) {
          let scheduledAt: string | null = null;
          if (occ.time) {
            const [h, m] = occ.time.split(":").map(Number);
            const occDate = new Date(startDate);
            occDate.setHours(h, m, 0, 0);
            scheduledAt = occDate.toISOString();
          }
          // Mark occurrence as completed if its time is in completed_times_today
          // For timed occurrences, match by time; for anytime mode, use index fallback
          let isCompleted = false;
          let completedAt: string | null = null;
          let isSkipped = false;
          if (occ.time && completedTimesSet.size > 0) {
            // Match by time (HH:MM)
            isCompleted = completedTimesSet.has(occ.time);
            // Find the actual completion time from completed_times_today
            if (isCompleted && task.completed_times_today) {
              const matchingTime = task.completed_times_today.find((t) => {
                const d = parseAsUtc(t);
                const timeStr = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
                return timeStr === occ.time;
              });
              completedAt = matchingTime || scheduledAt;
            }
          } else {
            // Fallback for anytime mode: use index-based counting
            isCompleted = occIndex < completionsToday;
            // For anytime mode, use scheduled time or current time
            if (isCompleted) {
              completedAt = scheduledAt || startDate.toISOString();
            }
          }

          // Check if this occurrence is skipped (only if not completed)
          if (!isCompleted) {
            if (occ.time && skippedTimesSet.size > 0) {
              isSkipped = skippedTimesSet.has(occ.time);
            } else {
              // Fallback for anytime mode: use index-based counting for skips
              isSkipped = skipIndex < skipsToday;
              if (isSkipped) skipIndex++;
            }
          }

          // Determine status: completed > skipped > pending
          let status: "completed" | "skipped" | "pending" = "pending";
          if (isCompleted) {
            status = "completed";
          } else if (isSkipped) {
            status = "skipped";
          }

          // For multi-per-day tasks, track occurrence index and generate label
          const totalOccurrences = intradayOccs.length;
          const occurrenceLabel =
            totalOccurrences > 1
              ? `(${occIndex + 1} of ${totalOccurrences})`
              : undefined;

          const virtualTask: Task = {
            ...task,
            id: `${task.id}__${todayDateStr}${occ.suffix}`,
            scheduled_at: scheduledAt,
            status: status,
            completed_at: completedAt,
            completed_for_today: isCompleted,
            skipped_for_today: isSkipped,
            skip_reason: isSkipped ? (task.skip_reason_today ?? null) : null,
            isVirtualOccurrence: true,
            virtualOccurrenceDate: todayDateStr,
            originalTaskId: task.id,
            occurrenceIndex: occIndex,
            occurrenceLabel: occurrenceLabel,
          };
          result.push(virtualTask);
          occIndex++;
        }
        daysGenerated++;
      } else {
        // Single occurrence mode: create a virtual task for today with correct status
        // based on completed_for_today or skipped_for_today
        const todayStr = toLocalDateString(startDate);
        const isCompleted = completionsToday > 0 || task.completed_for_today;
        const skipsToday = task.skips_today || 0;
        const isSkipped = skipsToday > 0 || task.skipped_for_today;

        // Determine status: completed > skipped > pending
        let status: "completed" | "skipped" | "pending" = "pending";
        if (isCompleted) {
          status = "completed";
        } else if (isSkipped) {
          status = "skipped";
        }

        const virtualTask: Task = {
          ...task,
          id: `${task.id}__${todayStr}`,
          status: status,
          completed_for_today: isCompleted,
          skipped_for_today: isSkipped,
          // Copy skip reason for today
          skip_reason: isSkipped ? (task.skip_reason_today ?? null) : null,
          isVirtualOccurrence: true,
          virtualOccurrenceDate: todayStr,
          originalTaskId: task.id,
        };
        result.push(virtualTask);
        daysGenerated++;
      }
    }

    // Generate PAST occurrences for overdue detection (only if daysBack > 0)
    // This creates virtual occurrences for missed days that the user can catch up on
    // Phase 4g: Skip past occurrences for habitual tasks - they are auto-skipped silently
    // Only essential tasks should show as overdue (requiring user action)
    if (daysBack > 0 && task.recurrence_behavior !== "habitual") {
      // Determine the effective start date for past occurrence generation
      // Use scheduled_at if set, otherwise fall back to created_at
      // This prevents generating past occurrences for dates before the task existed
      let effectiveStartDate: Date | null = taskStartDate;
      let effectiveStartDateStr: string | null = taskStartDateStr;

      if (!effectiveStartDate && task.created_at) {
        effectiveStartDate = parseAsUtc(task.created_at);
        effectiveStartDateStr = toLocalDateString(effectiveStartDate);
      }

      // Only generate past occurrences if the effective start date is before today
      const shouldGeneratePast =
        effectiveStartDateStr && effectiveStartDateStr < todayStr;

      if (shouldGeneratePast && effectiveStartDate) {
        // Determine how far back to look
        // Limit to task effective start date
        let pastLimitDate = pastStartDate;
        if (effectiveStartDate > pastStartDate) {
          pastLimitDate = new Date(effectiveStartDate);
          pastLimitDate.setHours(0, 0, 0, 0);
        }

        const pastDays = getPastOccurrences(
          task.recurrence_rule,
          new Date(startDate),
          daysBack * intradayOccs.length,
          pastLimitDate,
        );

        for (const dayDate of pastDays) {
          const dayStr = toLocalDateString(dayDate);

          // Skip if this day is before the task's effective start date
          if (effectiveStartDateStr && dayStr < effectiveStartDateStr) {
            continue;
          }

          // Check if there are completions for this past date
          const completionsForDay = task.completions_by_date?.[dayStr] || [];
          const completionsCountForDay = completionsForDay.length;

          // Check if there are skips for this past date
          const skipsForDay = task.skips_by_date?.[dayStr] || [];
          const skipsCountForDay = skipsForDay.length;

          // Build completed times set for matching timed occurrences
          const completedTimesForDaySet = new Set(
            completionsForDay.map((t) => {
              const d = parseAsUtc(t);
              return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
            }),
          );

          // Create virtual tasks for each intraday occurrence
          let occIndex = 0;
          for (const occ of intradayOccs) {
            let scheduledAt: string | null = null;
            if (occ.time) {
              const [h, m] = occ.time.split(":").map(Number);
              const occDate = new Date(dayDate);
              occDate.setHours(h, m, 0, 0);
              scheduledAt = occDate.toISOString();
            } else if (task.scheduled_at && parsed.intradayMode === "single") {
              const originalTime = parseAsUtc(task.scheduled_at);
              const occDate = new Date(dayDate);
              occDate.setHours(
                originalTime.getHours(),
                originalTime.getMinutes(),
                originalTime.getSeconds(),
                0,
              );
              scheduledAt = occDate.toISOString();
            }

            // Determine if this occurrence is completed
            let isCompleted = false;
            let completedAt: string | null = null;
            if (occ.time && completedTimesForDaySet.size > 0) {
              isCompleted = completedTimesForDaySet.has(occ.time);
              if (isCompleted) {
                const matchingTime = completionsForDay.find((t) => {
                  const d = parseAsUtc(t);
                  const timeStr = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
                  return timeStr === occ.time;
                });
                completedAt = matchingTime || scheduledAt;
              }
            } else {
              isCompleted = occIndex < completionsCountForDay;
              if (isCompleted && completionsForDay[occIndex]) {
                completedAt = completionsForDay[occIndex];
              }
            }

            // Determine if this occurrence is skipped
            const isSkipped = !isCompleted && skipsCountForDay > 0;

            // Past incomplete occurrences are OVERDUE
            const isOverdue = !isCompleted && !isSkipped;

            // Determine status: completed > skipped > pending (overdue shows as pending)
            let status: "completed" | "skipped" | "pending" = "pending";
            if (isCompleted) {
              status = "completed";
            } else if (isSkipped) {
              status = "skipped";
            }

            const virtualTask: Task = {
              ...task,
              id: `${task.id}__${dayStr}${occ.suffix}`,
              scheduled_at: scheduledAt,
              status: status,
              completed_at: completedAt,
              completed_for_today: isCompleted,
              skipped_for_today: isSkipped,
              skip_reason: isSkipped
                ? (task.skip_reasons_by_date?.[dayStr] ?? null)
                : null,
              isVirtualOccurrence: true,
              virtualOccurrenceDate: dayStr,
              originalTaskId: task.id,
              isOverdue: isOverdue, // Mark as overdue for UI highlighting
            };
            result.push(virtualTask);
            occIndex++;
          }
        }
      }
    }

    // For recurring tasks, use today (or task start date if later) as the base for future days
    // If the task has a future start date, use that instead of today
    // Compare by date string (not timestamp) to avoid time-of-day issues
    let baseDate: Date;
    if (taskStartDateStr && taskStartDateStr > todayStr) {
      // Task starts in the future - use task start date as base (minus 1 day since getNextOccurrences adds 1)
      baseDate = new Date(taskStartDate!);
      baseDate.setDate(baseDate.getDate() - 1);
    } else {
      // Task already started - use today as base
      baseDate = new Date(startDate);
    }
    baseDate.setHours(0, 0, 0, 0);

    // Generate future day occurrences
    const futureDays = getNextOccurrences(
      task.recurrence_rule,
      baseDate,
      daysAhead * intradayOccs.length, // Account for multiple per day
      effectiveEndDate,
    );

    for (const dayDate of futureDays) {
      // Check if we've exceeded the COUNT limit
      if (maxDays !== null && daysGenerated >= maxDays) {
        break;
      }

      const dayStr = toLocalDateString(dayDate);

      // Skip if this day is before the task's start date
      if (taskStartDateStr && dayStr < taskStartDateStr) {
        continue;
      }

      // Check if there are completions for this future date
      const completionsForDay = task.completions_by_date?.[dayStr] || [];
      const completionsCountForDay = completionsForDay.length;

      // Check if there are skips for this future date
      const skipsForDay = task.skips_by_date?.[dayStr] || [];
      const skipsCountForDay = skipsForDay.length;
      const skipReasonForDay = task.skip_reasons_by_date?.[dayStr] || null;

      // Build a set of completed times for this day (for timed occurrences)
      const completedTimesForDaySet = new Set(
        completionsForDay.map((t) => {
          const d = parseAsUtc(t);
          return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
        }),
      );

      // Create virtual tasks for each intraday occurrence
      let occIndex = 0;
      for (const occ of intradayOccs) {
        let scheduledAt: string | null = null;
        if (occ.time) {
          const [h, m] = occ.time.split(":").map(Number);
          const occDate = new Date(dayDate);
          occDate.setHours(h, m, 0, 0);
          scheduledAt = occDate.toISOString();
        } else if (task.scheduled_at && parsed.intradayMode === "single") {
          // For single mode with original scheduled time, preserve the time
          const originalTime = parseAsUtc(task.scheduled_at);
          dayDate.setHours(
            originalTime.getHours(),
            originalTime.getMinutes(),
            originalTime.getSeconds(),
            0,
          );
          scheduledAt = dayDate.toISOString();
        }

        // Determine if this occurrence is completed
        let isCompleted = false;
        let completedAt: string | null = null;
        if (occ.time && completedTimesForDaySet.size > 0) {
          // For timed occurrences, match by time
          isCompleted = completedTimesForDaySet.has(occ.time);
          if (isCompleted) {
            const matchingTime = completionsForDay.find((t) => {
              const d = parseAsUtc(t);
              const timeStr = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
              return timeStr === occ.time;
            });
            completedAt = matchingTime || scheduledAt;
          }
        } else {
          // For anytime mode, use index-based counting
          isCompleted = occIndex < completionsCountForDay;
          if (isCompleted && completionsForDay[occIndex]) {
            completedAt = completionsForDay[occIndex];
          }
        }

        // Determine if this occurrence is skipped (only checked if not completed)
        const isSkipped = !isCompleted && skipsCountForDay > 0;

        // Determine status: completed > skipped > pending
        let status: "completed" | "skipped" | "pending" = "pending";
        if (isCompleted) {
          status = "completed";
        } else if (isSkipped) {
          status = "skipped";
        }

        const virtualTask: Task = {
          ...task,
          id: `${task.id}__${dayStr}${occ.suffix}`,
          scheduled_at: scheduledAt,
          status: status,
          completed_at: completedAt,
          completed_for_today: isCompleted, // Mark as done for this day
          skipped_for_today: isSkipped,
          skip_reason: isSkipped ? skipReasonForDay : null,
          isVirtualOccurrence: true,
          virtualOccurrenceDate: dayStr,
          originalTaskId: task.id,
        };
        result.push(virtualTask);
        occIndex++;
      }
      daysGenerated++;
    }
  }

  return result;
}
