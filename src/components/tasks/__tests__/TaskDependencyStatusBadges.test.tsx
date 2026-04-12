import React from "react";
import { render } from "@testing-library/react-native";
import {
  TaskDependencyStatusBadges,
  dependencyStatusAccessibilityLabel,
} from "../TaskDependencyStatusBadges";
import type { Task } from "../../../types";

function baseTask(over: Partial<Task> = {}): Task {
  return {
    id: "t1",
    goal_id: "g1",
    title: "T",
    duration_minutes: 15,
    status: "pending",
    ...over,
  } as Task;
}

describe("dependencyStatusAccessibilityLabel", () => {
  it("returns null when dependency_summary is absent", () => {
    expect(dependencyStatusAccessibilityLabel(baseTask())).toBeNull();
  });

  it("describes unmet hard prerequisites", () => {
    const t = baseTask({
      dependency_summary: {
        readiness_state: "blocked",
        has_unmet_hard: true,
        has_unmet_soft: false,
      },
    });
    expect(dependencyStatusAccessibilityLabel(t)).toContain("Required");
  });

  it("describes unmet soft prerequisites", () => {
    const t = baseTask({
      dependency_summary: {
        readiness_state: "ready",
        has_unmet_hard: false,
        has_unmet_soft: true,
      },
    });
    expect(dependencyStatusAccessibilityLabel(t)).toContain("Recommended");
  });

  it("describes fully met prerequisites", () => {
    const t = baseTask({
      dependency_summary: {
        readiness_state: "ready",
        has_unmet_hard: false,
        has_unmet_soft: false,
      },
    });
    expect(dependencyStatusAccessibilityLabel(t)).toBe("Prerequisites met");
  });
});

describe("TaskDependencyStatusBadges", () => {
  it("renders nothing without dependency_summary", () => {
    const { toJSON } = render(<TaskDependencyStatusBadges task={baseTask()} />);
    expect(toJSON()).toBeNull();
  });

  it("renders required + soft copy when both unmet", () => {
    const { getByText } = render(
      <TaskDependencyStatusBadges
        task={baseTask({
          dependency_summary: {
            readiness_state: "blocked",
            has_unmet_hard: true,
            has_unmet_soft: true,
          },
        })}
      />,
    );
    expect(getByText("Required first")).toBeTruthy();
    expect(getByText("Soft prereqs pending")).toBeTruthy();
  });

  it("renders recommended first when only soft unmet", () => {
    const { getByText, queryByText } = render(
      <TaskDependencyStatusBadges
        task={baseTask({
          dependency_summary: {
            readiness_state: "ready",
            has_unmet_hard: false,
            has_unmet_soft: true,
          },
        })}
      />,
    );
    expect(getByText("Recommended first")).toBeTruthy();
    expect(queryByText("Soft prereqs pending")).toBeNull();
  });

  it("renders prereqs met chip when nothing unmet", () => {
    const { getByText } = render(
      <TaskDependencyStatusBadges
        task={baseTask({
          dependency_summary: {
            readiness_state: "ready",
            has_unmet_hard: false,
            has_unmet_soft: false,
          },
        })}
      />,
    );
    expect(getByText("Prereqs met")).toBeTruthy();
  });
});
