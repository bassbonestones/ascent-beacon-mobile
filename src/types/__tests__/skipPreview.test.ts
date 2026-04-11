import {
  isSkipTaskPreviewResponse,
  rowsForSkipCascadeModal,
} from "../index";
import type { Task, SkipTaskPreviewResponse } from "../index";

describe("isSkipTaskPreviewResponse", () => {
  it("detects preview", () => {
    const p: SkipTaskPreviewResponse = {
      status: "has_dependents",
      affected_downstream: [],
    };
    expect(isSkipTaskPreviewResponse(p)).toBe(true);
  });

  it("rejects task-shaped object", () => {
    const t = {
      id: "1",
      user_id: "u",
      title: "x",
      status: "pending" as const,
      duration_minutes: 0,
      created_at: "",
      updated_at: "",
      is_lightning: false,
    } as Task;
    expect(isSkipTaskPreviewResponse(t)).toBe(false);
  });
});

describe("rowsForSkipCascadeModal", () => {
  it("returns empty when preview is null", () => {
    expect(rowsForSkipCascadeModal(null)).toEqual([]);
  });

  it("prefers transitive topo list when present", () => {
    const preview: SkipTaskPreviewResponse = {
      status: "has_dependents",
      affected_downstream: [
        {
          task_id: "b",
          task_title: "Only B",
          rule_id: "r1",
          strength: "hard",
          affected_occurrences: 1,
        },
      ],
      transitive_hard_dependents_toposort: [
        { task_id: "b", task_title: "B", affected_occurrences: 2 },
        { task_id: "c", task_title: "C", affected_occurrences: 1 },
      ],
    };
    expect(rowsForSkipCascadeModal(preview)).toEqual([
      {
        task_id: "b",
        task_title: "B",
        rule_id: "b",
        strength: "hard",
        affected_occurrences: 2,
      },
      {
        task_id: "c",
        task_title: "C",
        rule_id: "c",
        strength: "hard",
        affected_occurrences: 1,
      },
    ]);
  });

  it("falls back to affected_downstream when topo is absent", () => {
    const preview: SkipTaskPreviewResponse = {
      status: "has_dependents",
      affected_downstream: [
        {
          task_id: "d1",
          task_title: "Down",
          rule_id: "r1",
          strength: "hard",
          affected_occurrences: 3,
        },
      ],
    };
    expect(rowsForSkipCascadeModal(preview)).toEqual(preview.affected_downstream);
  });
});
