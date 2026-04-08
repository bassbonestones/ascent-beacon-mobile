/**
 * Tests for completions_by_date in generateRecurringOccurrences
 */
import {
  generateRecurringOccurrences,
  toLocalDateString,
} from "../taskSorting";
import type { Task } from "../../types";

describe("generateRecurringOccurrences with completions_by_date", () => {
  const createTask = (overrides: Partial<Task> = {}): Task => ({
    id: "test-task-1",
    user_id: "user-1",
    title: "Daily Task",
    description: null,
    duration_minutes: 30,
    status: "pending",
    scheduled_date: null,
    scheduled_at: "2026-04-07T09:00:00.000Z",
    scheduling_mode: "fixed",
    is_recurring: true,
    recurrence_rule: "FREQ=DAILY",
    recurrence_behavior: null,
    notify_before_minutes: null,
    completed_at: null,
    skip_reason: null,
    created_at: "2026-04-01T00:00:00.000Z",
    updated_at: "2026-04-01T00:00:00.000Z",
    is_lightning: false,
    goal_id: null,
    goal: null,
    sort_order: null,
    completed_for_today: false,
    completions_today: 0,
    completed_times_today: [],
    completions_by_date: {},
    skipped_for_today: false,
    skips_today: 0,
    skipped_times_today: [],
    skips_by_date: {},
    skip_reason_today: null,
    skip_reasons_by_date: {},
    ...overrides,
  });

  it("marks future occurrence as completed when in completions_by_date", () => {
    // Scenario: User time traveled to April 10, completed task, returned to April 7
    // completions_by_date should contain April 10's completion
    const task = createTask({
      completions_by_date: {
        "2026-04-10": ["2026-04-10T09:00:00.000Z"],
      },
    });

    // Today is April 7, generate 14 days of occurrences (April 7 - April 21)
    const startDate = new Date(2026, 3, 7); // April 7, 2026
    const result = generateRecurringOccurrences([task], startDate, 14, 0);

    // Find April 10's occurrence
    const april10Occ = result.find(
      (t) =>
        t.virtualOccurrenceDate === "2026-04-10" ||
        (t.scheduled_at &&
          toLocalDateString(new Date(t.scheduled_at)) === "2026-04-10"),
    );

    expect(april10Occ).toBeDefined();
    expect(april10Occ?.status).toBe("completed");
    expect(april10Occ?.completed_for_today).toBe(true);
  });

  it("marks occurrence as pending when not in completions_by_date", () => {
    const task = createTask({
      completions_by_date: {
        "2026-04-10": ["2026-04-10T09:00:00.000Z"],
      },
    });

    const startDate = new Date(2026, 3, 7);
    const result = generateRecurringOccurrences([task], startDate, 14, 0);

    // April 11 should be pending (not in completions_by_date)
    const april11Occ = result.find(
      (t) =>
        t.virtualOccurrenceDate === "2026-04-11" ||
        (t.scheduled_at &&
          toLocalDateString(new Date(t.scheduled_at)) === "2026-04-11"),
    );

    expect(april11Occ).toBeDefined();
    expect(april11Occ?.status).toBe("pending");
  });

  it("handles multiple completions on different dates", () => {
    const task = createTask({
      completions_by_date: {
        "2026-04-08": ["2026-04-08T09:00:00.000Z"],
        "2026-04-10": ["2026-04-10T09:00:00.000Z"],
        "2026-04-12": ["2026-04-12T09:00:00.000Z"],
      },
    });

    const startDate = new Date(2026, 3, 7);
    const result = generateRecurringOccurrences([task], startDate, 14, 0);

    const getOccForDate = (dateStr: string) =>
      result.find(
        (t) =>
          t.virtualOccurrenceDate === dateStr ||
          (t.scheduled_at &&
            toLocalDateString(new Date(t.scheduled_at)) === dateStr),
      );

    expect(getOccForDate("2026-04-08")?.status).toBe("completed");
    expect(getOccForDate("2026-04-09")?.status).toBe("pending");
    expect(getOccForDate("2026-04-10")?.status).toBe("completed");
    expect(getOccForDate("2026-04-11")?.status).toBe("pending");
    expect(getOccForDate("2026-04-12")?.status).toBe("completed");
  });
});
