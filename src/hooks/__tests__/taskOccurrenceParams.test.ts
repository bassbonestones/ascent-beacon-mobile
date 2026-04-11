import { buildOccurrenceParams } from "../taskOccurrenceParams";
import type { Task } from "../../types";

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

  it("returns empty for non-recurring", () => {
    const task = { is_recurring: false } as Task;
    const p = buildOccurrenceParams(task, () => fixed);
    expect(p.scheduledFor).toBeUndefined();
    expect(p.localDate).toBeUndefined();
  });
});
