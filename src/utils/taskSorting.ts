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

  if (task.scheduled_at) {
    const scheduledDate = parseAsUtc(task.scheduled_at);
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
  // BUT: virtual occurrences should NOT be filtered here - they have their own status
  if (
    task.is_recurring &&
    task.completed_for_today &&
    !task.isVirtualOccurrence
  ) {
    return false;
  }

  if (!task.scheduled_at) {
    // Unscheduled tasks always appear in Today view
    return true;
  }

  const scheduledDate = parseAsUtc(task.scheduled_at);
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
 */
export function getTimezoneAbbreviation(date: Date = new Date()): string {
  // Try to get timezone abbreviation from toLocaleTimeString
  const timeString = date.toLocaleTimeString("en-US", {
    timeZoneName: "short",
  });
  const match = timeString.match(/\s([A-Z]{2,4})$/);
  if (match) {
    return match[1];
  }
  // Fallback: calculate GMT offset
  const offset = -date.getTimezoneOffset();
  const hours = Math.floor(Math.abs(offset) / 60);
  const sign = offset >= 0 ? "+" : "-";
  return `GMT${sign}${hours}`;
}

/**
 * Format time for display (e.g., "9:00 AM EST").
 * Uses manual formatting to avoid Hermes/React Native Intl issues.
 * @param scheduledAt - ISO datetime string
 * @param schedulingMode - If 'date_only', returns null (no time to show)
 * @param showTimezone - Whether to include timezone abbreviation (default: true)
 */
export function formatTaskTime(
  scheduledAt: string | null,
  schedulingMode?: string | null,
  showTimezone: boolean = true,
): string | null {
  if (!scheduledAt) return null;
  // 'date_only' means the user only set a date, not a specific time
  if (schedulingMode === "date_only") return null;

  const date = parseAsUtc(scheduledAt);
  const hours = date.getHours(); // Local hours (0-23)
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const ms = date.getMilliseconds();

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
    return `${timeStr} ${getTimezoneAbbreviation(date)}`;
  }
  return timeStr;
}

/**
 * Check if a task is overdue.
 */
export function isTaskOverdue(task: Task, now: Date = new Date()): boolean {
  // Not overdue if not pending
  if (task.status !== "pending" || !task.scheduled_at) {
    return false;
  }
  // Recurring tasks that are completed or skipped for today are not overdue
  if (
    task.is_recurring &&
    (task.completed_for_today || task.skipped_for_today)
  ) {
    return false;
  }

  const scheduledDate = parseAsUtc(task.scheduled_at);

  // For date_only tasks, compare against end of day (not the midnight timestamp)
  // A date-only task for today is NOT overdue until the day is over
  if (task.scheduling_mode === "date_only") {
    const endOfScheduledDay = new Date(scheduledDate);
    endOfScheduledDay.setHours(23, 59, 59, 999);
    return now > endOfScheduledDay;
  }

  // For timed tasks, compare against the scheduled time
  return scheduledDate < now;
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
      const date = parseAsUtc(task.scheduled_at);
      dateKey = toLocalDateString(date);
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
 * Filter tasks for upcoming view (today and future tasks).
 */
export function filterTasksForUpcoming(
  tasks: Task[],
  today: Date = new Date(),
): Task[] {
  const todayDateStr = toLocalDateString(today);

  return tasks.filter((task) => {
    // Check scheduled_at first - compare LOCAL dates to avoid timezone issues
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

    // For recurring tasks, use today (or task start date if later) as the base for future days
    // If the task has a future start date, use that instead of today
    let baseDate: Date;
    if (taskStartDate && taskStartDate > startDate) {
      // Task starts in the future - use task start date as base (minus 1 day since getNextOccurrences adds 1)
      baseDate = new Date(taskStartDate);
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
