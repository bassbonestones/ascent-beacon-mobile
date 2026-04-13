import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import CreatePriorityStep4 from "../CreatePriorityStep4";
import type { PriorityFormData } from "../../../hooks/usePriorityForm";

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
    pickerButton: {},
    pickerButtonText: {},
    input: {},
    formButtons: {},
    cancelButton: {},
    cancelButtonText: {},
    nextButton: {},
    nextButtonText: {},
    modalOverlay: {},
    modalContent: {},
    modalTitle: {},
    modalOption: {},
    modalOptionText: {},
    modalCloseButton: {},
    modalCloseButtonText: {},
  },
  SCOPES: [
    { label: "Ongoing (no end point)", value: "ongoing" },
    { label: "In Progress (working toward completion)", value: "in_progress" },
    { label: "Habitual (repeated, sustained)", value: "habitual" },
    {
      label: "Seasonal (activated during specific windows)",
      value: "seasonal",
    },
  ],
  SCORE_OPTIONS: [
    { label: "1 - Minor", value: 1 },
    { label: "2 - Somewhat Important", value: 2 },
    { label: "3 - Important", value: 3 },
    { label: "4 - Very Important", value: 4 },
    { label: "5 - Critical", value: 5 },
  ],
}));

describe("CreatePriorityStep4", () => {
  const mockOnFormDataChange = jest.fn();
  const mockOnBack = jest.fn();
  const mockOnNext = jest.fn();

  const defaultFormData: PriorityFormData = {
    title: "Test Priority",
    why_matters: "Test why",
    scope: "ongoing",
    score: 5,
    cadence: "",
    constraints: "",
    value_ids: [],
  };

  const defaultProps = {
    formData: defaultFormData,
    onFormDataChange: mockOnFormDataChange,
    onBack: mockOnBack,
    onNext: mockOnNext,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders step number", () => {
    const { getByText } = render(<CreatePriorityStep4 {...defaultProps} />);
    expect(getByText("Step 4 of 4")).toBeOnTheScreen();
  });

  it("renders Scope & Details title", () => {
    const { getByText } = render(<CreatePriorityStep4 {...defaultProps} />);
    expect(getByText("Scope & Details")).toBeOnTheScreen();
  });

  it("renders subtitle", () => {
    const { getByText } = render(<CreatePriorityStep4 {...defaultProps} />);
    expect(getByText("Optional: Add context about this priority")).toBeOnTheScreen();
  });

  it("renders scope picker with current value", () => {
    const { getByText } = render(<CreatePriorityStep4 {...defaultProps} />);
    expect(getByText("Ongoing (no end point)")).toBeOnTheScreen();
  });

  it("renders importance picker with current value", () => {
    const { getByText } = render(<CreatePriorityStep4 {...defaultProps} />);
    expect(getByText("5 - Critical")).toBeOnTheScreen();
  });

  it("renders cadence input", () => {
    const { getByLabelText } = render(
      <CreatePriorityStep4 {...defaultProps} />,
    );
    expect(getByLabelText("Cadence input")).toBeOnTheScreen();
  });

  it("renders constraints input", () => {
    const { getByLabelText } = render(
      <CreatePriorityStep4 {...defaultProps} />,
    );
    expect(getByLabelText("Constraints input")).toBeOnTheScreen();
  });

  it("displays cadence value from formData", () => {
    const props = {
      ...defaultProps,
      formData: { ...defaultProps.formData, cadence: "Weekly" },
    };
    const { getByLabelText } = render(<CreatePriorityStep4 {...props} />);
    const input = getByLabelText("Cadence input");
    expect(input.props.value).toBe("Weekly");
  });

  it("displays constraints value from formData", () => {
    const props = {
      ...defaultProps,
      formData: { ...defaultProps.formData, constraints: "2 hours max" },
    };
    const { getByLabelText } = render(<CreatePriorityStep4 {...props} />);
    const input = getByLabelText("Constraints input");
    expect(input.props.value).toBe("2 hours max");
  });

  it("calls onFormDataChange when cadence changes", () => {
    const { getByLabelText } = render(
      <CreatePriorityStep4 {...defaultProps} />,
    );
    fireEvent.changeText(getByLabelText("Cadence input"), "Daily");
    expect(mockOnFormDataChange).toHaveBeenCalled();
  });

  it("calls onFormDataChange when constraints changes", () => {
    const { getByLabelText } = render(
      <CreatePriorityStep4 {...defaultProps} />,
    );
    fireEvent.changeText(getByLabelText("Constraints input"), "Limited time");
    expect(mockOnFormDataChange).toHaveBeenCalled();
  });

  it("renders Back button", () => {
    const { getByText } = render(<CreatePriorityStep4 {...defaultProps} />);
    expect(getByText("Back")).toBeOnTheScreen();
  });

  it("renders Review button", () => {
    const { getByText } = render(<CreatePriorityStep4 {...defaultProps} />);
    expect(getByText("Review")).toBeOnTheScreen();
  });

  it("calls onBack when Back button pressed", () => {
    const { getByLabelText } = render(
      <CreatePriorityStep4 {...defaultProps} />,
    );
    fireEvent.press(getByLabelText("Go back"));
    expect(mockOnBack).toHaveBeenCalled();
  });

  it("calls onNext when Review button pressed", () => {
    const { getByLabelText } = render(
      <CreatePriorityStep4 {...defaultProps} />,
    );
    fireEvent.press(getByLabelText("Review priority"));
    expect(mockOnNext).toHaveBeenCalled();
  });

  it("opens scope modal when scope button pressed", () => {
    const { getByText, getByLabelText } = render(
      <CreatePriorityStep4 {...defaultProps} />,
    );
    fireEvent.press(getByLabelText(/Scope:/));
    expect(getByText("Select Scope")).toBeOnTheScreen();
  });

  it("shows scope options in modal", () => {
    const { getByLabelText } = render(
      <CreatePriorityStep4 {...defaultProps} />,
    );
    fireEvent.press(getByLabelText(/Scope:/));
    expect(getByLabelText("Ongoing (no end point)")).toBeOnTheScreen();
    expect(
      getByLabelText("In Progress (working toward completion)"),
    ).toBeOnTheScreen();
    expect(getByLabelText("Habitual (repeated, sustained)")).toBeOnTheScreen();
  });

  it("opens score modal when importance button pressed", () => {
    const { getByText, getByLabelText } = render(
      <CreatePriorityStep4 {...defaultProps} />,
    );
    fireEvent.press(getByLabelText(/Importance:/));
    expect(getByText("Select Importance")).toBeOnTheScreen();
  });
});
