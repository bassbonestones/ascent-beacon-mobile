import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { TaskDependencyOverrideModal } from "../TaskDependencyOverrideModal";

const blocker = {
  rule_id: "r1",
  upstream_task: {
    id: "u1",
    title: "Gate",
    is_recurring: false,
    recurrence_rule: null,
  },
  strength: "hard" as const,
  scope: "next_occurrence" as const,
  required_count: 1,
  completed_count: 0,
  is_met: false,
};

describe("TaskDependencyOverrideModal", () => {
  it("updates reason and confirms", () => {
    const onReason = jest.fn();
    const onConfirm = jest.fn();
    const onBack = jest.fn();
    const { getByLabelText } = render(
      <TaskDependencyOverrideModal
        visible
        taskTitle="T"
        blockers={[blocker]}
        reason=""
        onReasonChange={onReason}
        onConfirm={onConfirm}
        onBack={onBack}
      />,
    );
    fireEvent.changeText(getByLabelText("Override reason"), "Because");
    expect(onReason).toHaveBeenCalledWith("Because");
    fireEvent.press(getByLabelText("Confirm override and complete current"));
    expect(onConfirm).toHaveBeenCalled();
    fireEvent.press(getByLabelText("Go back"));
    expect(onBack).toHaveBeenCalled();
  });
});
