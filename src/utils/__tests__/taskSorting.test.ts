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
  scheduled_at: null,
  is_recurring: false,
  recurrence_rule: null,
  notify_before_minutes: null,
  completed_at: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  is_lightning: false,
  goal: null,
  scheduling_mode: null,
  skip_reason: null,
  ...overrides,
});

describe("taskSorting", () => {
  const now = new Date("2024-06-15T12:00:00Z");

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
  });

  describe("filterTasksForUpcoming", () => {
    it("excludes unscheduled tasks", () => {
      const tasks = [createMockTask({ scheduled_at: null })];
      const filtered = filterTasksForUpcoming(tasks, now);
      expect(filtered.length).toBe(0);
    });

    it("excludes tasks scheduled for today", () => {
      const tasks = [createMockTask({ scheduled_at: "2024-06-15T14:00:00Z" })];
      const filtered = filterTasksForUpcoming(tasks, now);
      expect(filtered.length).toBe(0);
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

    it("excludes virtual occurrences with today's virtualOccurrenceDate", () => {
      const tasks = [
        createMockTask({
          id: "virtual-today",
          scheduled_at: null,
          isVirtualOccurrence: true,
          virtualOccurrenceDate: "2024-06-15", // today
        }),
      ];
      const filtered = filterTasksForUpcoming(tasks, now);
      expect(filtered.length).toBe(0);
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
    it("returns Today for current date", () => {
      expect(formatDateHeader("2024-06-15", now)).toBe("Today");
    });

    it("returns Tomorrow for next day", () => {
      expect(formatDateHeader("2024-06-16", now)).toBe("Tomorrow");
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

      const result = generateRecurringOccurrences([task], now, 7);

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

      const result = generateRecurringOccurrences([task], now, 7);

      // Original + 7 future occurrences
      expect(result.length).toBeGreaterThan(1);
      expect(result[0].id).toBe("daily-task");
      expect(result[0].isVirtualOccurrence).toBeUndefined();

      // Check virtual occurrences
      const virtualOccurrences = result.filter((t) => t.isVirtualOccurrence);
      expect(virtualOccurrences.length).toBeGreaterThan(0);
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
      const result = generateRecurringOccurrences([task], now, 14);

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

      const result = generateRecurringOccurrences([task], now, 7);
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

      const result = generateRecurringOccurrences([task], now, 3);
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

      const result = generateRecurringOccurrences([taskNoRule], now, 7);

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

      const result = generateRecurringOccurrences([taskNoSchedule], now, 7);

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

      const result = generateRecurringOccurrences([task], now, 7);
      const virtualOccurrences = result.filter((t) => t.isVirtualOccurrence);

      expect(virtualOccurrences.length).toBeGreaterThan(0);
      // Virtual occurrences from scheduled tasks SHOULD have scheduled_at
      expect(virtualOccurrences[0].scheduled_at).not.toBeNull();
      // And the time should be preserved (14:30)
      const scheduledTime = new Date(virtualOccurrences[0].scheduled_at!);
      expect(scheduledTime.getUTCHours()).toBe(14);
      expect(scheduledTime.getUTCMinutes()).toBe(30);
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

    it("returns window for interval intraday mode", () => {
      const result = getTaskWindow(
        "FREQ=DAILY;X-INTRADAY=interval;X-WINSTART=08:00;X-WINEND=12:00;X-INTERVALMIN=30",
      );
      expect(result).toEqual({
        start: "08:00",
        end: "12:00",
        intradayMode: "interval",
      });
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
