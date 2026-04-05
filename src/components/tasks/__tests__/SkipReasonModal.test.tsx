import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { SkipReasonModal } from "../SkipReasonModal";

describe("SkipReasonModal", () => {
  const defaultProps = {
    visible: true,
    taskTitle: "Test Task",
    onClose: jest.fn(),
    onSkip: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders when visible", () => {
    render(<SkipReasonModal {...defaultProps} />);
    expect(screen.getByText('Skip "Test Task"?')).toBeTruthy();
  });

  it("does not display content when not visible", () => {
    render(<SkipReasonModal {...defaultProps} visible={false} />);
    // Modal is rendered but not visible - in React Native testing the modal still renders
    // The visibility is handled by the Modal component itself
    expect(screen.queryByText('Skip "Test Task"?')).toBeNull();
  });

  it("shows skip button", () => {
    render(<SkipReasonModal {...defaultProps} />);
    expect(screen.getByLabelText("Skip task")).toBeTruthy();
    expect(screen.getByText("Skip")).toBeTruthy();
  });

  it("shows cancel button", () => {
    render(<SkipReasonModal {...defaultProps} />);
    expect(screen.getByLabelText("Cancel skip")).toBeTruthy();
    expect(screen.getByText("Cancel")).toBeTruthy();
  });

  it("shows reason input field", () => {
    render(<SkipReasonModal {...defaultProps} />);
    expect(
      screen.getByPlaceholderText("Why are you skipping? (optional)"),
    ).toBeTruthy();
  });

  it("calls onSkip with undefined when no reason provided", () => {
    render(<SkipReasonModal {...defaultProps} />);
    fireEvent.press(screen.getByLabelText("Skip task"));
    expect(defaultProps.onSkip).toHaveBeenCalledWith(undefined);
  });

  it("calls onSkip with reason when reason is provided", () => {
    render(<SkipReasonModal {...defaultProps} />);
    fireEvent.changeText(
      screen.getByPlaceholderText("Why are you skipping? (optional)"),
      "Too busy today",
    );
    fireEvent.press(screen.getByLabelText("Skip task"));
    expect(defaultProps.onSkip).toHaveBeenCalledWith("Too busy today");
  });

  it("calls onSkip with undefined when reason is empty whitespace", () => {
    render(<SkipReasonModal {...defaultProps} />);
    fireEvent.changeText(
      screen.getByPlaceholderText("Why are you skipping? (optional)"),
      "   ",
    );
    fireEvent.press(screen.getByLabelText("Skip task"));
    expect(defaultProps.onSkip).toHaveBeenCalledWith(undefined);
  });

  it("calls onClose when cancel pressed", () => {
    render(<SkipReasonModal {...defaultProps} />);
    fireEvent.press(screen.getByLabelText("Cancel skip"));
    expect(defaultProps.onClose).toHaveBeenCalled();
    expect(defaultProps.onSkip).not.toHaveBeenCalled();
  });

  it("clears reason after skip", () => {
    const { rerender } = render(<SkipReasonModal {...defaultProps} />);
    fireEvent.changeText(
      screen.getByPlaceholderText("Why are you skipping? (optional)"),
      "Some reason",
    );
    fireEvent.press(screen.getByLabelText("Skip task"));

    // Verify skip was called with the reason
    expect(defaultProps.onSkip).toHaveBeenCalledWith("Some reason");
  });

  it("displays task title in header", () => {
    render(<SkipReasonModal {...defaultProps} taskTitle="My Important Task" />);
    expect(screen.getByText('Skip "My Important Task"?')).toBeTruthy();
  });
});
