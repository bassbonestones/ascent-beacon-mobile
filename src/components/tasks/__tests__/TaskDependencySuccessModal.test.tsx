import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import {
  TaskDependencySuccessModal,
  aggregateSuccessTitles,
} from "../TaskDependencySuccessModal";

jest.useFakeTimers();

describe("aggregateSuccessTitles", () => {
  it("merges consecutive duplicates into a count", () => {
    expect(aggregateSuccessTitles(["a", "a", "b"])).toEqual([
      { title: "a", count: 2 },
      { title: "b", count: 1 },
    ]);
  });

  it("leaves distinct titles unchanged", () => {
    expect(aggregateSuccessTitles(["a", "b"])).toEqual([
      { title: "a", count: 1 },
      { title: "b", count: 1 },
    ]);
  });
});

describe("TaskDependencySuccessModal", () => {
  it("shows (×n) when the same task was completed multiple times", () => {
    const { getByText } = render(
      <TaskDependencySuccessModal
        visible
        titles={["Water", "Water", "Gym"]}
        kind="complete_chain"
        onDismiss={jest.fn()}
      />,
    );
    expect(getByText(/1\. Water/)).toBeTruthy();
    expect(getByText("(×2)")).toBeTruthy();
    expect(getByText(/2\. Gym/)).toBeTruthy();
  });

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
