import {
  getTaskCategory,
  sortTasksForTodayView,
  filterTasksForToday,
  isTaskOverdue,
  condenseRecurringTasks,
  formatTaskTime,
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
});
