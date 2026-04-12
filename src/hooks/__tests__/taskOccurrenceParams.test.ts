import {
  anchorScheduledInstantForDependencyRules,
  buildOccurrenceParams,
} from "../taskOccurrenceParams";
import type { Task } from "../../types";

describe("anchorScheduledInstantForDependencyRules", () => {
  it("shifts local midnight to end of that calendar day", () => {
    const d = new Date(2026, 3, 10, 0, 0, 0, 0);
    const a = anchorScheduledInstantForDependencyRules(d);
    expect(a.getFullYear()).toBe(2026);
    expect(a.getMonth()).toBe(3);
    expect(a.getDate()).toBe(10);
    expect(a.getHours()).toBe(23);
    expect(a.getMinutes()).toBe(59);
    expect(a.getSeconds()).toBe(59);
  });

  it("leaves non-midnight instants unchanged", () => {
    const d = new Date(2026, 3, 10, 18, 30, 0, 0);
    const a = anchorScheduledInstantForDependencyRules(d);
    expect(a.getTime()).toBe(d.getTime());
  });
});

describe("buildOccurrenceParams", () => {
  const fixed = new Date(2026, 3, 10, 12, 0, 0);

  it("builds params for virtual occurrence", () => {
    const task = {
      is_recurring: true,
      isVirtualOccurrence: true,
      virtualOccurrenceDate: "2026-04-09",
      scheduled_at: "2026-01-01T14:30:00.000Z",
    } as Task;
    const p = buildOccurrenceParams(task, () => fixed);
    expect(p.localDate).toBe("2026-04-09");
    expect(p.scheduledFor).toBeDefined();
  });

  it("builds params for recurring non-virtual with scheduled_at", () => {
    const task = {
      is_recurring: true,
      scheduled_at: "2026-01-01T08:15:00.000Z",
    } as Task;
    const p = buildOccurrenceParams(task, () => fixed);
    expect(p.localDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(p.scheduledFor).toBeDefined();
  });

  it("returns empty for unscheduled non-recurring", () => {
    const task = { is_recurring: false } as Task;
    const p = buildOccurrenceParams(task, () => fixed);
    expect(p.scheduledFor).toBeUndefined();
    expect(p.localDate).toBeUndefined();
  });

  it("builds params for non-recurring date-only task", () => {
    const task = {
      is_recurring: false,
      scheduled_date: "2026-04-10",
    } as Task;
    const p = buildOccurrenceParams(task, () => fixed);
    expect(p.localDate).toBe("2026-04-10");
    expect(p.scheduledFor).toBe(
      new Date(2026, 3, 10, 23, 59, 59, 999).toISOString(),
    );
  });

  it("builds params for non-recurring timed task", () => {
    const task = {
      is_recurring: false,
      scheduled_date: "2026-04-10",
      scheduled_at: "2026-01-01T15:30:00.000Z",
    } as Task;
    const p = buildOccurrenceParams(task, () => fixed);
    expect(p.localDate).toBe("2026-04-10");
    expect(p.scheduledFor).toBeDefined();
  });
});
