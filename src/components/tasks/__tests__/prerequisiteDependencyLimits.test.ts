import type { Task } from "../../../types";
import {
  implicitRequiredCountAllOccurrencesRecurring,
  maxRequiredCompletionsForNextOccurrence,
  maxRequiredCompletionsForWithinWindow,
} from "../prerequisiteDependencyLimits";

function task(overrides: Partial<Task> & { recurrence_rule?: string | null }): Task {
  return {
    id: "t1",
    title: "T",
    goal_id: "g1",
    status: "pending",
    duration_minutes: 30,
    is_recurring: true,
    recurrence_rule: "FREQ=DAILY",
    ...overrides,
  } as Task;
}

describe("prerequisiteDependencyLimits", () => {
  it("maxRequiredCompletionsForNextOccurrence uses intraday count for daily", () => {
    const t = task({
      recurrence_rule:
        "FREQ=DAILY;X-INTRADAY=specific_times;X-TIMES=08:00,12:00,18:00",
    });
    expect(maxRequiredCompletionsForNextOccurrence(t)).toBe(3);
  });

  it("maxRequiredCompletionsForNextOccurrence is 1 for weekly", () => {
    const t = task({ recurrence_rule: "FREQ=WEEKLY;BYDAY=MO" });
    expect(maxRequiredCompletionsForNextOccurrence(t)).toBe(1);
  });

  it("implicitRequiredCountAllOccurrencesRecurring matches daily slots", () => {
    const t = task({
      recurrence_rule: "FREQ=DAILY;X-INTRADAY=anytime;X-DAILYOCC=2",
    });
    expect(implicitRequiredCountAllOccurrencesRecurring(t)).toBe(2);
  });

  it("maxRequiredCompletionsForWithinWindow scales daily slots by window days", () => {
    const t = task({
      recurrence_rule:
        "FREQ=DAILY;X-INTRADAY=specific_times;X-TIMES=09:00,21:00",
    });
    expect(maxRequiredCompletionsForWithinWindow(t, 1440)).toBe(2);
    expect(maxRequiredCompletionsForWithinWindow(t, 2880)).toBe(4);
  });

  it("maxRequiredCompletionsForWithinWindow uses default interval when window null", () => {
    const t = task({ recurrence_rule: "FREQ=WEEKLY" });
    expect(maxRequiredCompletionsForWithinWindow(t, null)).toBe(1);
  });
});
