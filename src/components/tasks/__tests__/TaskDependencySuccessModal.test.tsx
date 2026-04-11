import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { TaskDependencySuccessModal } from "../TaskDependencySuccessModal";

jest.useFakeTimers();

describe("TaskDependencySuccessModal", () => {
  it("calls onDismiss from Done", () => {
    const onDismiss = jest.fn();
    const { getByLabelText } = render(
      <TaskDependencySuccessModal
        visible
        titles={["A", "B"]}
        kind="complete_chain"
        onDismiss={onDismiss}
      />,
    );
    fireEvent.press(getByLabelText("Done"));
    expect(onDismiss).toHaveBeenCalled();
  });
});
