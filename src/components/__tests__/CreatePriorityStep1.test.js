import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import CreatePriorityStep1 from "../priorities/CreatePriorityStep1";

// Mock styles
jest.mock("../../screens/styles/prioritiesScreenStyles", () => ({
  styles: {
    container: {},
    header: {},
    stepNumber: {},
    title: {},
    subtitle: {},
    content: {},
    formSection: {},
    label: {},
    helperText: {},
    example: {},
    badExample: {},
    input: {},
    feedbackBox: {},
    feedbackText: {},
    formButtons: {},
    cancelButton: {},
    cancelButtonText: {},
    nextButton: {},
    nextButtonDisabled: {},
    nextButtonText: {},
  },
}));

describe("CreatePriorityStep1", () => {
  const defaultProps = {
    formData: { title: "" },
    onNameChange: jest.fn(),
    validating: false,
    validationFeedback: { name: [] },
    onCancel: jest.fn(),
    onNext: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders step header", () => {
    const { getByText } = render(<CreatePriorityStep1 {...defaultProps} />);
    expect(getByText("Step 1 of 4")).toBeTruthy();
    expect(getByText("Priority Name")).toBeTruthy();
    expect(getByText("Be specific, not generic")).toBeTruthy();
  });

  it("renders label and helper text", () => {
    const { getByText } = render(<CreatePriorityStep1 {...defaultProps} />);
    expect(getByText("What is this priority?")).toBeTruthy();
    expect(getByText(/Be specific about WHAT/)).toBeTruthy();
  });

  it("renders good examples", () => {
    const { getByText } = render(<CreatePriorityStep1 {...defaultProps} />);
    expect(getByText("✓ Restoring physical health after burnout")).toBeTruthy();
    expect(getByText("✓ Being emotionally present for my child")).toBeTruthy();
    expect(
      getByText("✓ Quality time with family and close friends"),
    ).toBeTruthy();
  });

  it("renders bad examples", () => {
    const { getByText } = render(<CreatePriorityStep1 {...defaultProps} />);
    expect(getByText("✗ Health")).toBeTruthy();
    expect(getByText("✗ Family")).toBeTruthy();
    expect(getByText("✗ Work")).toBeTruthy();
  });

  it("renders text input", () => {
    const { getByPlaceholderText } = render(
      <CreatePriorityStep1 {...defaultProps} />,
    );
    expect(getByPlaceholderText("Enter priority name...")).toBeTruthy();
  });

  it("displays current title value", () => {
    const { getByLabelText } = render(
      <CreatePriorityStep1
        {...defaultProps}
        formData={{ title: "My priority" }}
      />,
    );
    const input = getByLabelText("Priority name input");
    expect(input.props.value).toBe("My priority");
  });

  it("calls onNameChange when input changes", () => {
    const { getByLabelText } = render(
      <CreatePriorityStep1 {...defaultProps} />,
    );
    fireEvent.changeText(getByLabelText("Priority name input"), "New name");
    expect(defaultProps.onNameChange).toHaveBeenCalledWith("New name");
  });

  it("shows validation loading indicator", () => {
    const { getByLabelText } = render(
      <CreatePriorityStep1 {...defaultProps} validating={true} />,
    );
    expect(getByLabelText("Validating input")).toBeTruthy();
  });

  it("shows validation feedback when present", () => {
    const { getByText } = render(
      <CreatePriorityStep1
        {...defaultProps}
        validationFeedback={{ name: ["Too generic", "Be more specific"] }}
      />,
    );
    expect(getByText("• Too generic")).toBeTruthy();
    expect(getByText("• Be more specific")).toBeTruthy();
  });

  it("renders Cancel button", () => {
    const { getByText } = render(<CreatePriorityStep1 {...defaultProps} />);
    expect(getByText("Cancel")).toBeTruthy();
  });

  it("calls onCancel when Cancel is pressed", () => {
    const { getByLabelText } = render(
      <CreatePriorityStep1 {...defaultProps} />,
    );
    fireEvent.press(getByLabelText("Cancel"));
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it("renders Next button", () => {
    const { getByText } = render(<CreatePriorityStep1 {...defaultProps} />);
    expect(getByText("Next")).toBeTruthy();
  });

  it("disables Next when title is empty", () => {
    const { getByLabelText } = render(
      <CreatePriorityStep1 {...defaultProps} formData={{ title: "" }} />,
    );
    const nextButton = getByLabelText("Next step");
    expect(nextButton.props.accessibilityState?.disabled).toBe(true);
  });

  it("disables Next when validation feedback has errors", () => {
    const { getByLabelText } = render(
      <CreatePriorityStep1
        {...defaultProps}
        formData={{ title: "Something" }}
        validationFeedback={{ name: ["Error"] }}
      />,
    );
    const nextButton = getByLabelText("Next step");
    expect(nextButton.props.accessibilityState?.disabled).toBe(true);
  });

  it("enables Next when title is valid and no errors", () => {
    const { getByLabelText } = render(
      <CreatePriorityStep1
        {...defaultProps}
        formData={{ title: "Valid priority name" }}
        validationFeedback={{ name: [] }}
      />,
    );
    const nextButton = getByLabelText("Next step");
    expect(nextButton.props.accessibilityState?.disabled).toBe(false);
  });

  it("calls onNext when Next is pressed", () => {
    const { getByLabelText } = render(
      <CreatePriorityStep1
        {...defaultProps}
        formData={{ title: "Valid name" }}
      />,
    );
    fireEvent.press(getByLabelText("Next step"));
    expect(defaultProps.onNext).toHaveBeenCalled();
  });
});
