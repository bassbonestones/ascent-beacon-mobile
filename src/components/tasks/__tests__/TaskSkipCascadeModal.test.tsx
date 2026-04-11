import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { TaskSkipCascadeModal } from "../TaskSkipCascadeModal";

const affected = [
  {
    task_id: "d1",
    task_title: "Medication",
    rule_id: "r1",
    strength: "hard",
    affected_occurrences: 3,
  },
];

describe("TaskSkipCascadeModal", () => {
  it("invokes keep pending and cascade", () => {
    const onKeep = jest.fn();
    const onCascade = jest.fn();
    const { getByLabelText } = render(
      <TaskSkipCascadeModal
        visible
        taskTitle="Pills"
        affected={affected}
        onKeepPending={onKeep}
        onCascadeSkip={onCascade}
        onCancel={jest.fn()}
      />,
    );
    fireEvent.press(getByLabelText("Keep affected pending"));
    expect(onKeep).toHaveBeenCalled();
    fireEvent.press(getByLabelText("Skip affected tasks too"));
    expect(onCascade).toHaveBeenCalled();
  });
});
