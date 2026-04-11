import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { TaskDependencyHardModal } from "../TaskDependencyHardModal";

const blocker = {
  rule_id: "r1",
  upstream_task: {
    id: "u1",
    title: "Water",
    is_recurring: false,
    recurrence_rule: null,
  },
  strength: "hard" as const,
  scope: "next_occurrence" as const,
  required_count: 4,
  completed_count: 2,
  is_met: false,
};

describe("TaskDependencyHardModal", () => {
  it("renders blockers and actions", () => {
    const onPrereq = jest.fn();
    const onOverride = jest.fn();
    const onCancel = jest.fn();
    const { getByText, getByLabelText } = render(
      <TaskDependencyHardModal
        visible
        taskTitle="Gym"
        blockers={[blocker]}
        onCompletePrereqs={onPrereq}
        onOverride={onOverride}
        onCancel={onCancel}
      />,
    );
    expect(getByText(/Requires/)).toBeTruthy();
    expect(getByText("Water")).toBeTruthy();
    fireEvent.press(getByLabelText("Complete prerequisites"));
    expect(onPrereq).toHaveBeenCalled();
    fireEvent.press(getByLabelText("Override and complete current"));
    expect(onOverride).toHaveBeenCalled();
  });
});
