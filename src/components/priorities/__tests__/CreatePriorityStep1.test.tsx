import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import CreatePriorityStep1 from "../CreatePriorityStep1";
import type {
  PriorityFormData,
  ValidationFeedback,
} from "../../../hooks/usePriorityForm";

// Mock styles
jest.mock("../../../screens/styles/prioritiesScreenStyles", () => ({
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

// Test-specific interface with only the fields Step 1 uses
interface TestProps {
  formData: { title: string };
  onNameChange: (name: string) => void;
  validating?: boolean;
  validationFeedback: { name: string[] };
  onCancel: () => void;
  onNext: () => void;
}

// Helper to render with partial form data (Step 1 only uses title)
const renderStep1 = (props: TestProps) => {
  const fullFormData: PriorityFormData = {
    title: props.formData.title,
    why_matters: "",
    score: 3,
    scope: "ongoing",
    cadence: "",
    constraints: "",
    value_ids: [],
  };
  const fullFeedback: ValidationFeedback = {
    name: props.validationFeedback.name,
    why: [],
  };
  return render(
    <CreatePriorityStep1
      formData={fullFormData}
      onNameChange={props.onNameChange}
      validating={props.validating}
      validationFeedback={fullFeedback}
      onCancel={props.onCancel}
      onNext={props.onNext}
    />,
  );
};

describe("CreatePriorityStep1", () => {
  const defaultProps: TestProps = {
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
    const { getByText } = renderStep1(defaultProps);
    expect(getByText("Step 1 of 4")).toBeOnTheScreen();
    expect(getByText("Priority Name")).toBeOnTheScreen();
    expect(getByText("Be specific, not generic")).toBeOnTheScreen();
  });

  it("renders label and helper text", () => {
    const { getByText } = renderStep1(defaultProps);
    expect(getByText("What is this priority?")).toBeOnTheScreen();
    expect(getByText(/Be specific about WHAT/)).toBeOnTheScreen();
  });

  it("renders good examples", () => {
    const { getByText } = renderStep1(defaultProps);
    expect(getByText("✓ Restoring physical health after burnout")).toBeOnTheScreen();
    expect(getByText("✓ Being emotionally present for my child")).toBeOnTheScreen();
    expect(
      getByText("✓ Quality time with family and close friends"),
    ).toBeOnTheScreen();
  });

  it("renders bad examples", () => {
    const { getByText } = renderStep1(defaultProps);
    expect(getByText("✗ Health")).toBeOnTheScreen();
    expect(getByText("✗ Family")).toBeOnTheScreen();
    expect(getByText("✗ Work")).toBeOnTheScreen();
  });

  it("renders text input", () => {
    const { getByPlaceholderText } = renderStep1(defaultProps);
    expect(getByPlaceholderText("Enter priority name...")).toBeOnTheScreen();
  });

  it("displays current title value", () => {
    const { getByLabelText } = renderStep1({
      ...defaultProps,
      formData: { title: "My priority" },
    });
    const input = getByLabelText("Priority name input");
    expect(input.props.value).toBe("My priority");
  });

  it("calls onNameChange when input changes", () => {
    const { getByLabelText } = renderStep1(defaultProps);
    fireEvent.changeText(getByLabelText("Priority name input"), "New name");
    expect(defaultProps.onNameChange).toHaveBeenCalledWith("New name");
  });

  it("shows validation loading indicator", () => {
    const { getByLabelText } = renderStep1({
      ...defaultProps,
      validating: true,
    });
    expect(getByLabelText("Validating input")).toBeOnTheScreen();
  });

  it("shows validation feedback when present", () => {
    const { getByText } = renderStep1({
      ...defaultProps,
      validationFeedback: { name: ["Too generic", "Be more specific"] },
    });
    expect(getByText("• Too generic")).toBeOnTheScreen();
    expect(getByText("• Be more specific")).toBeOnTheScreen();
  });

  it("renders Cancel button", () => {
    const { getByText } = renderStep1(defaultProps);
    expect(getByText("Cancel")).toBeOnTheScreen();
  });

  it("calls onCancel when Cancel is pressed", () => {
    const { getByLabelText } = renderStep1(defaultProps);
    fireEvent.press(getByLabelText("Cancel"));
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it("renders Next button", () => {
    const { getByText } = renderStep1(defaultProps);
    expect(getByText("Next")).toBeOnTheScreen();
  });

  it("disables Next when title is empty", () => {
    const { getByLabelText } = renderStep1({
      ...defaultProps,
      formData: { title: "" },
    });
    const nextButton = getByLabelText("Next step");
    expect(nextButton.props.accessibilityState?.disabled).toBe(true);
  });

  it("disables Next when validation feedback has errors", () => {
    const { getByLabelText } = renderStep1({
      ...defaultProps,
      formData: { title: "Something" },
      validationFeedback: { name: ["Error"] },
    });
    const nextButton = getByLabelText("Next step");
    expect(nextButton.props.accessibilityState?.disabled).toBe(true);
  });

  it("enables Next when title is valid and no errors", () => {
    const { getByLabelText } = renderStep1({
      ...defaultProps,
      formData: { title: "Valid priority name" },
      validationFeedback: { name: [] },
    });
    const nextButton = getByLabelText("Next step");
    expect(nextButton.props.accessibilityState?.disabled).toBe(false);
  });

  it("calls onNext when Next is pressed", () => {
    const { getByLabelText } = renderStep1({
      ...defaultProps,
      formData: { title: "Valid name" },
    });
    fireEvent.press(getByLabelText("Next step"));
    expect(defaultProps.onNext).toHaveBeenCalled();
  });
});
