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
  validity_window_minutes: null,
};

const withinWindowBlocker = {
  ...blocker,
  scope: "within_window" as const,
  validity_window_minutes: 1,
};

const withinWindowNoMinutes = {
  ...blocker,
  scope: "within_window" as const,
  validity_window_minutes: null as number | null,
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

  it("shows configured rolling window in progress line", () => {
    const { getByText } = render(
      <TaskDependencyHardModal
        visible
        taskTitle="Gym"
        blockers={[withinWindowBlocker]}
        onCompletePrereqs={jest.fn()}
        onOverride={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    expect(
      getByText(/2 of 4 completed in the last 1 minute/),
    ).toBeTruthy();
  });

  it("omits window suffix when within_window but validity minutes missing", () => {
    const { getByText, queryByText } = render(
      <TaskDependencyHardModal
        visible
        taskTitle="Gym"
        blockers={[withinWindowNoMinutes]}
        onCompletePrereqs={jest.fn()}
        onOverride={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    expect(getByText(/2 of 4 completed/)).toBeTruthy();
    expect(queryByText(/in the last/)).toBeNull();
  });
});
