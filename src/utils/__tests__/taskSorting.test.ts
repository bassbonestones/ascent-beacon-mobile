import {
  getTaskCategory,
  sortTasksForTodayView,
  filterTasksForToday,
  filterTasksForUpcoming,
  groupTasksByDate,
  formatDateHeader,
  isTaskOverdue,
  condenseRecurringTasks,
  formatTaskTime,
  generateRecurringOccurrences,
  getTaskWindow,
  hasFlexibleWindow,
  getEffectiveStartTime,
  toLocalDateString,
} from "../taskSorting";
import type { Task } from "../../types";

const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: "task-1",
  user_id: "user-1",
  goal_id: "goal-1",
  title: "Test Task",
  description: null,
  duration_minutes: 30,
  status: "pending",
  scheduled_date: null,
  scheduled_at: null,
  is_recurring: false,
  recurrence_rule: null,
  recurrence_behavior: null,
  notify_before_minutes: null,
  completed_at: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  is_lightning: false,
  goal: null,
  scheduling_mode: null,
  skip_reason: null,
  sort_order: null,
  ...overrides,
});

describe("taskSorting", () => {
  const now = new Date("2024-06-15T12:00:00Z");

  // Helper to get tomorrow's date in YYYYMMDD format (for UNTIL tests)
  const getTomorrowDateStr = (): string => {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const day = String(tomorrow.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
  };

  describe("toLocalDateString", () => {
    it("returns local date string in YYYY-MM-DD format", () => {
      // Create a date that is April 6th in local time
      const localDate = new Date(2026, 3, 6, 20, 30, 0); // April 6, 2026 8:30 PM local
      expect(toLocalDateString(localDate)).toBe("2026-04-06");
    });

    it("handles dates near midnight correctly (avoids UTC conversion bug)", () => {
      // This tests the critical bug: at 8:30 PM CDT (UTC-5), toISOString() would
      // return the next day's date (April 7) because it's already 1:30 AM UTC
      // toLocalDateString should always return the LOCAL date
      const lateNight = new Date(2026, 3, 6, 23, 59, 59); // April 6, 2026 11:59 PM local
      expect(toLocalDateString(lateNight)).toBe("2026-04-06");
    });

    it("pads single-digit months and days", () => {
      const earlyDate = new Date(2026, 0, 5); // Jan 5, 2026
      expect(toLocalDateString(earlyDate)).toBe("2026-01-05");
    });
  });

  describe("getTaskCategory", () => {
    it("returns todo for unscheduled pending tasks", () => {
      const task = createMockTask({ scheduled_at: null, status: "pending" });
      expect(getTaskCategory(task, now)).toBe("todo");
    });

    it("returns overdue for past-scheduled pending tasks", () => {
      const task = createMockTask({
        scheduled_at: "2024-06-14T10:00:00Z",
        status: "pending",
      });
      expect(getTaskCategory(task, now)).toBe("overdue");
    });

    it("returns timed for future-scheduled pending tasks", () => {
      const task = createMockTask({
        scheduled_at: "2024-06-15T14:00:00Z",
        status: "pending",
      });
      expect(getTaskCategory(task, now)).toBe("timed");
    });

    it("returns todo for completed tasks", () => {
      const task = createMockTask({ status: "completed" });
      expect(getTaskCategory(task, now)).toBe("todo");
    });

    it("uses virtualOccurrenceDate for virtual occurrences instead of original scheduled_date", () => {
      // Virtual occurrence for today (June 15) but original task started April 1
      const task = createMockTask({
        id: "recurring-task__2024-06-15",
        scheduled_date: "2024-04-01", // Original recurrence start date
        isVirtualOccurrence: true,
        virtualOccurrenceDate: "2024-06-15", // Today's occurrence
        is_recurring: true,
        status: "pending",
      });
      // Should be "timed" (today) not "overdue"
      const todayNoon = new Date(2024, 5, 15, 12, 0, 0, 0);
      expect(getTaskCategory(task, todayNoon)).toBe("timed");
    });

    it("marks virtual occurrence as overdue when virtualOccurrenceDate is in the past", () => {
      const task = createMockTask({
        id: "recurring-task__2024-06-14",
        scheduled_date: "2024-04-01", // Original recurrence start date
        isVirtualOccurrence: true,
        virtualOccurrenceDate: "2024-06-14", // Yesterday's occurrence
        is_recurring: true,
        status: "pending",
      });
      const todayNoon = new Date(2024, 5, 15, 12, 0, 0, 0);
      expect(getTaskCategory(task, todayNoon)).toBe("overdue");
    });
  });

  describe("sortTasksForTodayView", () => {
    it("sorts overdue first, then timed, then todo", () => {
      const tasks = [
        createMockTask({
          id: "todo",
          scheduled_at: null,
          status: "pending",
        }),
        createMockTask({
          id: "timed",
          scheduled_at: "2024-06-15T14:00:00Z",
          status: "pending",
        }),
        createMockTask({
          id: "overdue",
          scheduled_at: "2024-06-14T10:00:00Z",
          status: "pending",
        }),
      ];

      const sorted = sortTasksForTodayView(tasks, now);
      expect(sorted.map((t) => t.id)).toEqual(["overdue", "timed", "todo"]);
    });

    it("excludes non-pending tasks", () => {
      const tasks = [
        createMockTask({ id: "pending", status: "pending" }),
        createMockTask({ id: "completed", status: "completed" }),
        createMockTask({ id: "skipped", status: "skipped" }),
      ];

      const sorted = sortTasksForTodayView(tasks, now);
      expect(sorted.length).toBe(1);
      expect(sorted[0].id).toBe("pending");
    });
  });

  describe("filterTasksForToday", () => {
    it("includes unscheduled tasks", () => {
      const tasks = [createMockTask({ scheduled_at: null })];
      const filtered = filterTasksForToday(tasks, now);
      expect(filtered.length).toBe(1);
    });

    it("includes tasks scheduled for today", () => {
      const tasks = [createMockTask({ scheduled_at: "2024-06-15T09:00:00Z" })];
      const filtered = filterTasksForToday(tasks, now);
      expect(filtered.length).toBe(1);
    });

    it("includes overdue tasks", () => {
      const tasks = [createMockTask({ scheduled_at: "2024-06-14T09:00:00Z" })];
      const filtered = filterTasksForToday(tasks, now);
      expect(filtered.length).toBe(1);
    });

    it("excludes future tasks", () => {
      const tasks = [createMockTask({ scheduled_at: "2024-06-16T09:00:00Z" })];
      const filtered = filterTasksForToday(tasks, now);
      expect(filtered.length).toBe(0);
    });

    it("excludes anytime tasks", () => {
      const tasks = [
        createMockTask({
          id: "anytime-task",
          scheduling_mode: "anytime",
          scheduled_at: null,
          scheduled_date: null,
          sort_order: 1,
        }),
        createMockTask({
          id: "regular-unscheduled",
          scheduling_mode: null,
          scheduled_at: null,
        }),
      ];
      const filtered = filterTasksForToday(tasks, now);
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe("regular-unscheduled");
    });

    it("excludes recurring tasks that are completed for today", () => {
      const tasks = [
        createMockTask({
          id: "recurring-completed",
          is_recurring: true,
          completed_for_today: true,
          scheduled_at: "2024-06-15T09:00:00Z",
        }),
        createMockTask({
          id: "recurring-pending",
          is_recurring: true,
          completed_for_today: false,
          scheduled_at: "2024-06-15T10:00:00Z",
        }),
        createMockTask({
          id: "one-time",
          is_recurring: false,
          scheduled_at: "2024-06-15T11:00:00Z",
        }),
      ];
      const filtered = filterTasksForToday(tasks, now);
      expect(filtered.length).toBe(2);
      expect(filtered.map((t) => t.id)).toEqual([
        "recurring-pending",
        "one-time",
      ]);
    });
  });

  describe("isTaskOverdue", () => {
    it("returns false for unscheduled tasks", () => {
      const task = createMockTask({ scheduled_at: null });
      expect(isTaskOverdue(task, now)).toBe(false);
    });

    it("returns false for completed tasks", () => {
      const task = createMockTask({
        scheduled_at: "2024-06-14T09:00:00Z",
        status: "completed",
      });
      expect(isTaskOverdue(task, now)).toBe(false);
    });

    it("returns true for past-scheduled pending tasks", () => {
      const task = createMockTask({
        scheduled_at: "2024-06-14T09:00:00Z",
        status: "pending",
      });
      expect(isTaskOverdue(task, now)).toBe(true);
    });

    it("returns false for future-scheduled pending tasks", () => {
      const task = createMockTask({
        scheduled_at: "2024-06-15T14:00:00Z",
        status: "pending",
      });
      expect(isTaskOverdue(task, now)).toBe(false);
    });

    it("returns false for date_only task when same day is not over", () => {
      // Task scheduled for today (June 15) as date_only
      // Date-only tasks use scheduled_date (YYYY-MM-DD), not scheduled_at
      const task = createMockTask({
        scheduled_date: "2024-06-15",
        scheduled_at: null,
        scheduling_mode: "date_only",
        status: "pending",
      });
      // Current time is noon on June 15 local - should NOT be overdue
      const noonLocal = new Date(2024, 5, 15, 12, 0, 0, 0);
      expect(isTaskOverdue(task, noonLocal)).toBe(false);
    });

    it("returns true for date_only task when day has passed", () => {
      // Task scheduled for yesterday (June 14) as date_only
      // Date-only tasks use scheduled_date (YYYY-MM-DD), not scheduled_at
      const task = createMockTask({
        scheduled_date: "2024-06-14",
        scheduled_at: null,
        scheduling_mode: "date_only",
        status: "pending",
      });
      // Current time is June 15 - should be overdue (whole day passed)
      const todayNoonLocal = new Date(2024, 5, 15, 12, 0, 0, 0);
      expect(isTaskOverdue(task, todayNoonLocal)).toBe(true);
    });

    it("returns true for timed task earlier today", () => {
      // Task scheduled for 9 AM today local, current time is noon - overdue
      const nineAmLocal = new Date(2024, 5, 15, 9, 0, 0, 0);
      const task = createMockTask({
        scheduled_at: nineAmLocal.toISOString(),
        scheduling_mode: "fixed",
        status: "pending",
      });
      const noonLocal = new Date(2024, 5, 15, 12, 0, 0, 0);
      expect(isTaskOverdue(task, noonLocal)).toBe(true);
    });

    it("uses virtualOccurrenceDate for virtual occurrences instead of original scheduled_date", () => {
      // Virtual occurrence for today (June 15) but original task started April 1
      const task = createMockTask({
        id: "recurring-task__2024-06-15",
        scheduled_date: "2024-04-01", // Original recurrence start date
        isVirtualOccurrence: true,
        virtualOccurrenceDate: "2024-06-15", // Today's occurrence
        is_recurring: true,
        status: "pending",
      });
      // Should NOT be overdue since virtualOccurrenceDate is today
      const todayNoon = new Date(2024, 5, 15, 12, 0, 0, 0);
      expect(isTaskOverdue(task, todayNoon)).toBe(false);
    });

    it("marks virtual occurrence as overdue when virtualOccurrenceDate is before today", () => {
      // Virtual occurrence for yesterday (June 14)
      const task = createMockTask({
        id: "recurring-task__2024-06-14",
        scheduled_date: "2024-04-01", // Original recurrence start date
        isVirtualOccurrence: true,
        virtualOccurrenceDate: "2024-06-14", // Yesterday's occurrence
        is_recurring: true,
        status: "pending",
      });
      // Should be overdue since virtualOccurrenceDate is yesterday
      const todayNoon = new Date(2024, 5, 15, 12, 0, 0, 0);
      expect(isTaskOverdue(task, todayNoon)).toBe(true);
    });
  });

  describe("condenseRecurringTasks", () => {
    it("keeps non-recurring tasks unchanged", () => {
      const tasks = [
        createMockTask({ id: "t1", is_recurring: false }),
        createMockTask({ id: "t2", is_recurring: false }),
      ];

      const condensed = condenseRecurringTasks(tasks);
      expect(condensed.length).toBe(2);
    });

    it("condenses recurring tasks with same title to first occurrence", () => {
      const tasks = [
        createMockTask({
          id: "t1",
          title: "Daily standup",
          is_recurring: true,
          scheduled_at: "2024-06-15T09:00:00Z",
        }),
        createMockTask({
          id: "t2",
          title: "Daily standup",
          is_recurring: true,
          scheduled_at: "2024-06-16T09:00:00Z",
        }),
      ];

      const condensed = condenseRecurringTasks(tasks);
      expect(condensed.length).toBe(1);
      expect(condensed[0].id).toBe("t1");
    });

    it("keeps recurring tasks with different titles separate", () => {
      const tasks = [
        createMockTask({
          id: "t1",
          title: "Morning workout",
          is_recurring: true,
        }),
        createMockTask({
          id: "t2",
          title: "Evening review",
          is_recurring: true,
        }),
      ];

      const condensed = condenseRecurringTasks(tasks);
      expect(condensed.length).toBe(2);
    });
  });

  describe("formatTaskTime", () => {
    it("returns null for null input", () => {
      expect(formatTaskTime(null)).toBeNull();
    });

    it("formats time string correctly", () => {
      const result = formatTaskTime("2024-06-15T14:30:00Z");
      expect(result).toBeTruthy();
      // The exact format depends on locale, but it should contain the time
      expect(typeof result).toBe("string");
    });

    it("returns null for date_only scheduling mode", () => {
      const result = formatTaskTime("2024-06-15T00:00:00Z", "date_only");
      expect(result).toBeNull();
    });

    it("includes timezone abbreviation by default", () => {
      const result = formatTaskTime("2024-06-15T14:30:00Z");
      expect(result).toBeTruthy();
      // Should include some timezone indicator
      expect(result).toMatch(/[A-Z]{2,5}|GMT[+-]\d+/);
    });

    it("excludes timezone when showTimezone is false", () => {
      const result = formatTaskTime("2024-06-15T14:30:00Z", undefined, false);
      expect(result).toBeTruthy();
      // Should be just time without timezone
      expect(result).toMatch(/^\d{1,2}:\d{2} [AP]M$/);
    });

    it("respects timezone override for UTC", () => {
      // 14:30 UTC should display as 2:30 PM UTC
      const result = formatTaskTime(
        "2024-06-15T14:30:00Z",
        undefined,
        true,
        "UTC",
      );
      expect(result).toContain("2:30 PM");
      expect(result).toMatch(/UTC/i);
    });

    it("respects timezone override for different timezone", () => {
      // 14:30 UTC = 10:30 AM in New York (EDT, UTC-4 in summer)
      // or 09:30 AM (EST, UTC-5 in winter)
      const result = formatTaskTime(
        "2024-06-15T14:30:00Z",
        undefined,
        true,
        "America/New_York",
      );
      expect(result).toBeTruthy();
      // Time should be adjusted for Eastern timezone
      // In June it's EDT (UTC-4), so 14:30 UTC = 10:30 AM EDT
      expect(result).toMatch(/10:30 AM|11:30 AM/); // Could be 10:30 or 11:30 depending on DST
    });

    it("respects timezone override for Tokyo", () => {
      // 14:30 UTC = 23:30 in Tokyo (JST, UTC+9)
      const result = formatTaskTime(
        "2024-06-15T14:30:00Z",
        undefined,
        true,
        "Asia/Tokyo",
      );
      expect(result).toBeTruthy();
      expect(result).toMatch(/11:30 PM/);
    });
  });

  describe("filterTasksForUpcoming", () => {
    it("excludes unscheduled tasks", () => {
      const tasks = [createMockTask({ scheduled_at: null })];
      const filtered = filterTasksForUpcoming(tasks, now);
      expect(filtered.length).toBe(0);
    });

    it("includes tasks scheduled for today", () => {
      const tasks = [createMockTask({ scheduled_at: "2024-06-15T14:00:00Z" })];
      const filtered = filterTasksForUpcoming(tasks, now);
      expect(filtered.length).toBe(1);
    });

    it("excludes overdue tasks", () => {
      const tasks = [createMockTask({ scheduled_at: "2024-06-14T09:00:00Z" })];
      const filtered = filterTasksForUpcoming(tasks, now);
      expect(filtered.length).toBe(0);
    });

    it("includes future tasks", () => {
      const tasks = [createMockTask({ scheduled_at: "2024-06-16T09:00:00Z" })];
      const filtered = filterTasksForUpcoming(tasks, now);
      expect(filtered.length).toBe(1);
    });

    it("excludes anytime tasks", () => {
      const tasks = [
        createMockTask({
          id: "anytime-task",
          scheduling_mode: "anytime",
          scheduled_at: null,
          scheduled_date: null,
          sort_order: 1,
        }),
        createMockTask({
          id: "scheduled-task",
          scheduling_mode: "fixed",
          scheduled_at: "2024-06-16T09:00:00Z",
        }),
      ];
      const filtered = filterTasksForUpcoming(tasks, now);
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe("scheduled-task");
    });

    it("includes virtual occurrences with future virtualOccurrenceDate", () => {
      const tasks = [
        createMockTask({
          id: "virtual-future",
          scheduled_at: null,
          isVirtualOccurrence: true,
          virtualOccurrenceDate: "2024-06-16", // tomorrow
        }),
      ];
      const filtered = filterTasksForUpcoming(tasks, now);
      expect(filtered.length).toBe(1);
    });

    it("includes virtual occurrences with today's virtualOccurrenceDate", () => {
      const tasks = [
        createMockTask({
          id: "virtual-today",
          scheduled_at: null,
          isVirtualOccurrence: true,
          virtualOccurrenceDate: "2024-06-15", // today
        }),
      ];
      const filtered = filterTasksForUpcoming(tasks, now);
      expect(filtered.length).toBe(1);
    });
  });

  describe("groupTasksByDate", () => {
    it("groups tasks by their scheduled date", () => {
      const tasks = [
        createMockTask({
          id: "t1",
          scheduled_at: "2024-06-16T09:00:00Z",
        }),
        createMockTask({
          id: "t2",
          scheduled_at: "2024-06-16T14:00:00Z",
        }),
        createMockTask({
          id: "t3",
          scheduled_at: "2024-06-17T10:00:00Z",
        }),
      ];

      const grouped = groupTasksByDate(tasks);
      expect(grouped.size).toBe(2);
      expect(grouped.get("2024-06-16")?.length).toBe(2);
      expect(grouped.get("2024-06-17")?.length).toBe(1);
    });

    it("puts unscheduled tasks under no-date key", () => {
      const tasks = [createMockTask({ scheduled_at: null })];
      const grouped = groupTasksByDate(tasks);
      expect(grouped.get("no-date")?.length).toBe(1);
    });

    it("uses virtualOccurrenceDate for virtual tasks without scheduled_at", () => {
      const tasks = [
        createMockTask({
          id: "virtual-1",
          scheduled_at: null,
          isVirtualOccurrence: true,
          virtualOccurrenceDate: "2024-06-18",
        }),
        createMockTask({
          id: "virtual-2",
          scheduled_at: null,
          isVirtualOccurrence: true,
          virtualOccurrenceDate: "2024-06-18",
        }),
      ];

      const grouped = groupTasksByDate(tasks);
      expect(grouped.get("2024-06-18")?.length).toBe(2);
      expect(grouped.has("no-date")).toBe(false);
    });
  });

  describe("formatDateHeader", () => {
    it("returns Today with day and date for current date", () => {
      expect(formatDateHeader("2024-06-15", now)).toBe("TODAY - SAT, JUN 15");
    });

    it("returns Tomorrow with day and date for next day", () => {
      expect(formatDateHeader("2024-06-16", now)).toBe(
        "TOMORROW - SUN, JUN 16",
      );
    });

    it("returns formatted date for further dates", () => {
      const result = formatDateHeader("2024-06-20", now);
      expect(result).toContain("Jun");
      expect(result).toContain("20");
    });

    it("returns No Date for no-date key", () => {
      expect(formatDateHeader("no-date", now)).toBe("No Date");
    });
  });

  describe("generateRecurringOccurrences", () => {
    it("passes through non-recurring tasks unchanged", () => {
      const task = createMockTask({
        id: "task-1",
        scheduled_at: "2024-06-16T10:00:00Z",
        is_recurring: false,
      });

      const result = generateRecurringOccurrences([task], now, 7, 0);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("task-1");
      expect(result[0].isVirtualOccurrence).toBeUndefined();
    });

    it("generates daily recurring occurrences", () => {
      const task = createMockTask({
        id: "daily-task",
        scheduled_at: "2024-06-15T09:00:00Z",
        is_recurring: true,
        recurrence_rule: "FREQ=DAILY",
      });

      const result = generateRecurringOccurrences([task], now, 7, 0);

      // Today virtual + 7 future occurrences = 8 total
      expect(result.length).toBe(8);

      // All should be virtual occurrences (including today)
      const virtualOccurrences = result.filter((t) => t.isVirtualOccurrence);
      expect(virtualOccurrences.length).toBe(8);
      expect(virtualOccurrences[0].originalTaskId).toBe("daily-task");
      expect(virtualOccurrences[0].virtualOccurrenceDate).toBeTruthy();
    });

    it("generates weekly recurring occurrences on specified days", () => {
      const task = createMockTask({
        id: "weekly-task",
        scheduled_at: "2024-06-15T09:00:00Z", // Saturday
        is_recurring: true,
        recurrence_rule: "FREQ=WEEKLY;BYDAY=MO,WE,FR",
      });

      // Generate for 14 days to capture at least 2 weeks
      const result = generateRecurringOccurrences([task], now, 14, 0);

      const virtualOccurrences = result.filter((t) => t.isVirtualOccurrence);
      expect(virtualOccurrences.length).toBeGreaterThan(0);

      // All virtual occurrences should be on Mon, Wed, or Fri
      for (const occ of virtualOccurrences) {
        const date = new Date(occ.scheduled_at!);
        const day = date.getDay();
        expect([1, 3, 5]).toContain(day); // Mon=1, Wed=3, Fri=5
      }
    });

    it("virtual occurrences have unique IDs", () => {
      const task = createMockTask({
        id: "daily-task",
        scheduled_at: "2024-06-15T09:00:00Z",
        is_recurring: true,
        recurrence_rule: "FREQ=DAILY",
      });

      const result = generateRecurringOccurrences([task], now, 7, 0);
      const ids = result.map((t) => t.id);
      const uniqueIds = [...new Set(ids)];

      expect(ids.length).toBe(uniqueIds.length);
    });

    it("preserves task properties in virtual occurrences", () => {
      const task = createMockTask({
        id: "daily-task",
        title: "Daily Standup",
        goal_id: "goal-123",
        duration_minutes: 15,
        scheduled_at: "2024-06-15T09:00:00Z",
        is_recurring: true,
        recurrence_rule: "FREQ=DAILY",
      });

      const result = generateRecurringOccurrences([task], now, 3, 0);
      const virtual = result.find((t) => t.isVirtualOccurrence);

      expect(virtual).toBeDefined();
      expect(virtual!.title).toBe("Daily Standup");
      expect(virtual!.goal_id).toBe("goal-123");
      expect(virtual!.duration_minutes).toBe(15);
      expect(virtual!.is_recurring).toBe(true);
    });

    it("skips tasks without recurrence_rule", () => {
      const taskNoRule = createMockTask({
        id: "no-rule",
        is_recurring: true,
        recurrence_rule: null,
        scheduled_at: "2024-06-15T09:00:00Z",
      });

      const result = generateRecurringOccurrences([taskNoRule], now, 7, 0);

      // Only the original task should be returned, no virtual occurrences
      expect(result).toHaveLength(1);
      expect(result[0].isVirtualOccurrence).toBeUndefined();
    });

    it("generates occurrences for recurring tasks without scheduled_at", () => {
      const taskNoSchedule = createMockTask({
        id: "no-schedule",
        is_recurring: true,
        recurrence_rule: "FREQ=DAILY",
        scheduled_at: null,
      });

      const result = generateRecurringOccurrences([taskNoSchedule], now, 7, 0);

      // Should have original + virtual occurrences for future days
      expect(result.length).toBeGreaterThan(1);

      const virtualOccurrences = result.filter((t) => t.isVirtualOccurrence);
      expect(virtualOccurrences.length).toBeGreaterThan(0);
      expect(virtualOccurrences[0].originalTaskId).toBe("no-schedule");
      // Virtual occurrences from unscheduled tasks should NOT have scheduled_at
      // (to avoid showing "12:00 AM" in the UI)
      expect(virtualOccurrences[0].scheduled_at).toBeNull();
      // But they should have virtualOccurrenceDate for grouping
      expect(virtualOccurrences[0].virtualOccurrenceDate).toBeTruthy();
    });

    it("preserves scheduled_at time for virtual occurrences when original has time", () => {
      const task = createMockTask({
        id: "scheduled-task",
        is_recurring: true,
        recurrence_rule: "FREQ=DAILY",
        scheduled_at: "2024-06-15T14:30:00Z",
      });

      const result = generateRecurringOccurrences([task], now, 7, 0);
      const virtualOccurrences = result.filter((t) => t.isVirtualOccurrence);

      expect(virtualOccurrences.length).toBeGreaterThan(0);
      // Virtual occurrences from scheduled tasks SHOULD have scheduled_at
      expect(virtualOccurrences[0].scheduled_at).not.toBeNull();
      // And the time should be preserved (14:30)
      const scheduledTime = new Date(virtualOccurrences[0].scheduled_at!);
      expect(scheduledTime.getUTCHours()).toBe(14);
      expect(scheduledTime.getUTCMinutes()).toBe(30);
    });

    it("generates X occurrences per day for anytime mode", () => {
      const task = createMockTask({
        id: "anytime-task",
        is_recurring: true,
        recurrence_rule: "FREQ=DAILY;X-INTRADAY=anytime;X-DAILYOCC=3",
        scheduled_at: null,
      });

      const result = generateRecurringOccurrences([task], now, 3, 0);

      // Should have 3 occurrences for today + 3 for each of 3 future days = 12 total
      const virtualOccurrences = result.filter((t) => t.isVirtualOccurrence);
      // Today: 3 occurrences + 3 future days * 3 = 12
      expect(virtualOccurrences.length).toBe(12);

      // Check IDs have occurrence suffix
      const todayStr = toLocalDateString(now);
      const todayOccs = virtualOccurrences.filter(
        (t) => t.virtualOccurrenceDate === todayStr,
      );
      expect(todayOccs.length).toBe(3);
      expect(todayOccs[0].id).toContain("__occ1");
      expect(todayOccs[1].id).toContain("__occ2");
      expect(todayOccs[2].id).toContain("__occ3");

      // Should have no scheduled_at (anytime mode)
      expect(todayOccs.every((t) => t.scheduled_at === null)).toBe(true);
    });

    it("marks X occurrences as completed based on completions_today", () => {
      const task = createMockTask({
        id: "anytime-task",
        is_recurring: true,
        recurrence_rule: "FREQ=DAILY;X-INTRADAY=anytime;X-DAILYOCC=3",
        scheduled_at: null,
        completions_today: 2, // 2 of 3 completed
      });

      const result = generateRecurringOccurrences([task], now, 0, 0); // Only today, no past

      const virtualOccurrences = result.filter((t) => t.isVirtualOccurrence);
      expect(virtualOccurrences.length).toBe(3);

      // First 2 should be completed, last 1 should be pending
      expect(virtualOccurrences[0].status).toBe("completed");
      expect(virtualOccurrences[0].completed_for_today).toBe(true);
      expect(virtualOccurrences[1].status).toBe("completed");
      expect(virtualOccurrences[1].completed_for_today).toBe(true);
      expect(virtualOccurrences[2].status).toBe("pending");
      expect(virtualOccurrences[2].completed_for_today).toBe(false);
    });

    it("generates occurrences for each specific time", () => {
      const task = createMockTask({
        id: "specific-times-task",
        is_recurring: true,
        recurrence_rule:
          "FREQ=DAILY;X-INTRADAY=specific_times;X-TIMES=09:00,14:00,18:00",
        scheduled_at: null,
      });

      const result = generateRecurringOccurrences([task], now, 2, 0);

      const virtualOccurrences = result.filter((t) => t.isVirtualOccurrence);
      // Today: 3 times + 2 future days * 3 = 9
      expect(virtualOccurrences.length).toBe(9);

      // Check specific times are in scheduled_at
      const todayStr = toLocalDateString(now);
      const todayOccs = virtualOccurrences.filter(
        (t) => t.virtualOccurrenceDate === todayStr,
      );
      expect(todayOccs.length).toBe(3);

      // Check IDs have time suffix
      expect(todayOccs[0].id).toContain("__0900");
      expect(todayOccs[1].id).toContain("__1400");
      expect(todayOccs[2].id).toContain("__1800");

      // Check scheduled_at has correct times
      expect(todayOccs[0].scheduled_at).not.toBeNull();
      const time1 = new Date(todayOccs[0].scheduled_at!);
      expect(time1.getHours()).toBe(9);
      expect(time1.getMinutes()).toBe(0);
    });

    it("generates interval occurrences from window", () => {
      const task = createMockTask({
        id: "interval-task",
        is_recurring: true,
        recurrence_rule:
          "FREQ=DAILY;X-INTRADAY=interval;X-INTERVALMIN=60;X-WINSTART=09:00;X-WINEND=12:00",
        scheduled_at: null,
      });

      const result = generateRecurringOccurrences([task], now, 1, 0);

      const virtualOccurrences = result.filter((t) => t.isVirtualOccurrence);
      // Interval of 60 mins from 9-12 = 9:00, 10:00, 11:00, 12:00 = 4 times per day
      // Today: 4 + 1 future day * 4 = 8
      expect(virtualOccurrences.length).toBe(8);

      const todayStr = now.toISOString().split("T")[0];
      const todayOccs = virtualOccurrences.filter(
        (t) => t.virtualOccurrenceDate === todayStr,
      );
      expect(todayOccs.length).toBe(4);

      // Check times
      expect(todayOccs[0].id).toContain("__0900");
      expect(todayOccs[1].id).toContain("__1000");
      expect(todayOccs[2].id).toContain("__1100");
      expect(todayOccs[3].id).toContain("__1200");

      // All should have scheduled_at
      expect(todayOccs.every((t) => t.scheduled_at !== null)).toBe(true);
    });

    it("respects max daily occurrences for interval mode", () => {
      const task = createMockTask({
        id: "interval-limited-task",
        is_recurring: true,
        recurrence_rule:
          "FREQ=DAILY;X-INTRADAY=interval;X-INTERVALMIN=30;X-WINSTART=09:00;X-WINEND=17:00;X-DAILYOCC=3",
        scheduled_at: null,
      });

      const result = generateRecurringOccurrences([task], now, 1, 0);

      const todayStr = toLocalDateString(now);
      const todayOccs = result.filter(
        (t) => t.isVirtualOccurrence && t.virtualOccurrenceDate === todayStr,
      );
      // Limited to 3 even though window could fit many more
      expect(todayOccs.length).toBe(3);
    });

    it("window mode creates one occurrence with no specific time", () => {
      const task = createMockTask({
        id: "window-task",
        is_recurring: true,
        recurrence_rule:
          "FREQ=DAILY;X-INTRADAY=window;X-WINSTART=09:00;X-WINEND=17:00",
        scheduled_at: null,
      });

      const result = generateRecurringOccurrences([task], now, 2, 0);

      // Window mode: single occurrence per day
      // Today + 2 future = 3 virtual occurrences
      const virtualOccurrences = result.filter((t) => t.isVirtualOccurrence);
      expect(virtualOccurrences.length).toBe(3);

      // Total should be 3 (all virtual)
      expect(result.length).toBe(3);

      // No specific scheduled_at (flexible window)
      expect(virtualOccurrences.every((t) => t.scheduled_at === null)).toBe(
        true,
      );
    });

    it("respects COUNT limit for X times/day mode", () => {
      const task = createMockTask({
        id: "count-limited-task",
        is_recurring: true,
        // 2 times per day, but only for 2 days (COUNT=2 means 2 days here)
        recurrence_rule: "FREQ=DAILY;X-INTRADAY=anytime;X-DAILYOCC=2;COUNT=2",
        scheduled_at: null,
      });

      const result = generateRecurringOccurrences([task], now, 14, 0);

      // Should have: 2 occurrences for today + 2 occurrences for tomorrow = 4 total
      const virtualOccurrences = result.filter((t) => t.isVirtualOccurrence);
      expect(virtualOccurrences.length).toBe(4);

      // Get unique days
      const uniqueDays = new Set(
        virtualOccurrences.map((t) => t.virtualOccurrenceDate),
      );
      expect(uniqueDays.size).toBe(2); // Only 2 days
    });

    it("respects UNTIL date limit", () => {
      const task = createMockTask({
        id: "until-limited-task",
        is_recurring: true,
        // Goes until tomorrow (YYYYMMDD format)
        recurrence_rule: `FREQ=DAILY;X-INTRADAY=anytime;X-DAILYOCC=2;UNTIL=${getTomorrowDateStr()}`,
        scheduled_at: null,
      });

      const result = generateRecurringOccurrences([task], now, 14, 0);

      // Should have: 2 occurrences for today + 2 occurrences for tomorrow = 4 total
      const virtualOccurrences = result.filter((t) => t.isVirtualOccurrence);
      expect(virtualOccurrences.length).toBe(4);

      // Get unique days
      const uniqueDays = new Set(
        virtualOccurrences.map((t) => t.virtualOccurrenceDate),
      );
      expect(uniqueDays.size).toBe(2); // Only today and tomorrow
    });
  });

  describe("getTaskWindow", () => {
    it("returns null for null recurrence_rule", () => {
      expect(getTaskWindow(null)).toBeNull();
    });

    it("returns null for rrule without window", () => {
      expect(getTaskWindow("FREQ=DAILY")).toBeNull();
    });

    it("returns null for single intraday mode", () => {
      expect(getTaskWindow("FREQ=DAILY;X-INTRADAY=single")).toBeNull();
    });

    it("returns window for window intraday mode", () => {
      const result = getTaskWindow(
        "FREQ=DAILY;X-INTRADAY=window;X-WINSTART=09:00;X-WINEND=17:00",
      );
      expect(result).toEqual({
        start: "09:00",
        end: "17:00",
        intradayMode: "window",
      });
    });

    it("returns null for interval intraday mode (interval generates specific times)", () => {
      const result = getTaskWindow(
        "FREQ=DAILY;X-INTRADAY=interval;X-WINSTART=08:00;X-WINEND=12:00;X-INTERVALMIN=30",
      );
      // Interval mode now generates specific times, not a flexible window
      expect(result).toBeNull();
    });
  });

  describe("hasFlexibleWindow", () => {
    it("returns false for task without recurrence_rule", () => {
      const task = createMockTask({ recurrence_rule: null });
      expect(hasFlexibleWindow(task)).toBe(false);
    });

    it("returns false for task with scheduled_at", () => {
      const task = createMockTask({
        scheduled_at: "2024-06-15T09:00:00Z",
        recurrence_rule:
          "FREQ=DAILY;X-INTRADAY=window;X-WINSTART=09:00;X-WINEND=17:00",
      });
      expect(hasFlexibleWindow(task)).toBe(false);
    });

    it("returns true for task with window and no scheduled_at", () => {
      const task = createMockTask({
        scheduled_at: null,
        recurrence_rule:
          "FREQ=DAILY;X-INTRADAY=window;X-WINSTART=09:00;X-WINEND=17:00",
      });
      expect(hasFlexibleWindow(task)).toBe(true);
    });
  });

  describe("getEffectiveStartTime", () => {
    it("returns scheduled_at as Date for scheduled tasks", () => {
      const task = createMockTask({
        scheduled_at: "2024-06-15T14:30:00Z",
      });
      const result = getEffectiveStartTime(task, now);
      expect(result).toEqual(new Date("2024-06-15T14:30:00Z"));
    });

    it("returns window start time for flexible window tasks", () => {
      const task = createMockTask({
        scheduled_at: null,
        recurrence_rule:
          "FREQ=DAILY;X-INTRADAY=window;X-WINSTART=09:00;X-WINEND=17:00",
      });
      const result = getEffectiveStartTime(task, now);
      expect(result?.getHours()).toBe(9);
      expect(result?.getMinutes()).toBe(0);
    });

    it("returns null for task without scheduled_at or window", () => {
      const task = createMockTask({
        scheduled_at: null,
        recurrence_rule: null,
      });
      expect(getEffectiveStartTime(task, now)).toBeNull();
    });
  });

  describe("getTaskCategory with flexible window", () => {
    it("returns timed for task with flexible window", () => {
      const task = createMockTask({
        scheduled_at: null,
        status: "pending",
        recurrence_rule:
          "FREQ=DAILY;X-INTRADAY=window;X-WINSTART=09:00;X-WINEND=17:00",
      });
      expect(getTaskCategory(task, now)).toBe("timed");
    });
  });
});
