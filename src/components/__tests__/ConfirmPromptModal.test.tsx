import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { ConfirmPromptModal } from "../ConfirmPromptModal";

describe("ConfirmPromptModal", () => {
  it("renders prompt and default button labels", () => {
    render(
      <ConfirmPromptModal
        visible
        prompt="Are you sure?"
        onConfirm={jest.fn()}
      />,
    );
    expect(screen.getByText("Are you sure?")).toBeTruthy();
    expect(screen.getByLabelText("Confirm")).toBeTruthy();
    expect(screen.getByLabelText("Cancel")).toBeTruthy();
  });

  it("renders optional title and custom button text", () => {
    render(
      <ConfirmPromptModal
        visible
        title="Heads up"
        prompt="Proceed?"
        confirmButtonText="Do it"
        cancelButtonText="Never mind"
        onConfirm={jest.fn()}
      />,
    );
    expect(screen.getByText("Heads up")).toBeTruthy();
    expect(screen.getByLabelText("Do it")).toBeTruthy();
    expect(screen.getByLabelText("Never mind")).toBeTruthy();
  });

  it("calls onConfirm when confirm is pressed", () => {
    const onConfirm = jest.fn();
    render(
      <ConfirmPromptModal visible prompt="X" onConfirm={onConfirm} />,
    );
    fireEvent.press(screen.getByLabelText("Confirm"));
    expect(onConfirm).toHaveBeenCalled();
  });

  it("calls onCancel when cancel is pressed", () => {
    const onCancel = jest.fn();
    render(
      <ConfirmPromptModal
        visible
        prompt="X"
        onConfirm={jest.fn()}
        onCancel={onCancel}
      />,
    );
    fireEvent.press(screen.getByLabelText("Cancel"));
    expect(onCancel).toHaveBeenCalled();
  });
});
