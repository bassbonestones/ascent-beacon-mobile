import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { TaskDependencySoftModal } from "../TaskDependencySoftModal";

const blocker = {
  rule_id: "r1",
  upstream_task: {
    id: "u1",
    title: "Review",
    is_recurring: false,
    recurrence_rule: null,
  },
  strength: "soft" as const,
  scope: "next_occurrence" as const,
  required_count: 1,
  completed_count: 0,
  is_met: false,
};

describe("TaskDependencySoftModal", () => {
  it("primary action completes anyway", () => {
    const onAnyway = jest.fn();
    const { getByLabelText } = render(
      <TaskDependencySoftModal
        visible
        taskTitle="Deep work"
        blockers={[blocker]}
        onCompletePrereqs={jest.fn()}
        onCompleteAnyway={onAnyway}
        onCancel={jest.fn()}
      />,
    );
    fireEvent.press(getByLabelText("Complete anyway"));
    expect(onAnyway).toHaveBeenCalled();
  });
});
