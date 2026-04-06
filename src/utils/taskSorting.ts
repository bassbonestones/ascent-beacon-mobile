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
 * @param showTimezone - Whether to include timezone abbreviation (default: true)
 */
export function formatTaskTime(
  scheduledAt: string | null,
  showTimezone: boolean = true,
): string | null {
  if (!scheduledAt) return null;

  const date = parseAsUtc(scheduledAt);
  const hours = date.getHours(); // Local hours (0-23)
  const minutes = date.getMinutes();
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
  if (task.status !== "pending" || !task.scheduled_at) {
    return false;
  }
  return parseAsUtc(task.scheduled_at) < now;
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
      return parseAsUtc(task.scheduled_at) > todayEnd;
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

  const result: Task[] = [];

  for (const task of tasks) {
    if (!task.is_recurring || !task.recurrence_rule) {
      // Non-recurring tasks pass through unchanged
      result.push(task);
      continue;
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

    // For the original task, we need to add occurrences for TODAY
    // (but only if it's a multi-occurrence mode AND within limits)
    if (todayWithinLimit && todayWithinUntil) {
      if (intradayOccs.length > 1 || intradayOccs[0].time !== null) {
        // Multi-occurrence mode: create virtual tasks for today
        const todayStr = startDate.toISOString().split("T")[0];
        let occIndex = 0;
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
          const virtualTask: Task = {
            ...task,
            id: `${task.id}__${todayStr}${occ.suffix}`,
            scheduled_at: scheduledAt,
            status: isCompleted ? "completed" : "pending",
            completed_at: completedAt,
            completed_for_today: isCompleted,
            isVirtualOccurrence: true,
            virtualOccurrenceDate: todayStr,
            originalTaskId: task.id,
          };
          result.push(virtualTask);
          occIndex++;
        }
        daysGenerated++;
      } else {
        // Single occurrence mode: add original task as-is
        result.push(task);
        daysGenerated++;
      }
    }

    // For recurring tasks, use today as the base date for generating future days
    const baseDate = new Date(startDate);
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

      const dayStr = dayDate.toISOString().split("T")[0];

      // Create virtual tasks for each intraday occurrence
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

        const virtualTask: Task = {
          ...task,
          id: `${task.id}__${dayStr}${occ.suffix}`,
          scheduled_at: scheduledAt,
          completed_for_today: false,
          isVirtualOccurrence: true,
          virtualOccurrenceDate: dayStr,
          originalTaskId: task.id,
        };
        result.push(virtualTask);
      }
      daysGenerated++;
    }
  }

  return result;
}
