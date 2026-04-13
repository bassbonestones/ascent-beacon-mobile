import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import CreatePriorityStep4 from "../priorities/CreatePriorityStep4";

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
    { value: "life", label: "Life-wide" },
    { value: "work", label: "Work" },
    { value: "personal", label: "Personal" },
  ],
  SCORE_OPTIONS: [
    { value: 1, label: "1 - Low" },
    { value: 5, label: "5 - Medium" },
    { value: 10, label: "10 - Highest" },
  ],
}));

describe("CreatePriorityStep4", () => {
  const mockOnFormDataChange = jest.fn();
  const mockOnBack = jest.fn();
  const mockOnNext = jest.fn();

  const defaultProps = {
    formData: {
      scope: "life",
      score: 5,
      cadence: "",
      constraints: "",
    },
    onFormDataChange: mockOnFormDataChange,
    onBack: mockOnBack,
    onNext: mockOnNext,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders step number", () => {
    const { getByText } = render(<CreatePriorityStep4 {...defaultProps} />);
    expect(getByText("Step 4 of 4")).toBeTruthy();
  });

  it("renders title", () => {
    const { getByText } = render(<CreatePriorityStep4 {...defaultProps} />);
    expect(getByText("Scope & Details")).toBeTruthy();
  });

  it("renders subtitle", () => {
    const { getByText } = render(<CreatePriorityStep4 {...defaultProps} />);
    expect(getByText("Optional: Add context about this priority")).toBeTruthy();
  });

  it("renders scope picker with current value", () => {
    const { getByText } = render(<CreatePriorityStep4 {...defaultProps} />);
    expect(getByText("Life-wide")).toBeTruthy();
  });

  it("renders importance picker with current value", () => {
    const { getByText } = render(<CreatePriorityStep4 {...defaultProps} />);
    expect(getByText("5 - Medium")).toBeTruthy();
  });

  it("renders cadence input", () => {
    const { getByLabelText } = render(
      <CreatePriorityStep4 {...defaultProps} />,
    );
    expect(getByLabelText("Cadence input")).toBeTruthy();
  });

  it("renders constraints input", () => {
    const { getByLabelText } = render(
      <CreatePriorityStep4 {...defaultProps} />,
    );
    expect(getByLabelText("Constraints input")).toBeTruthy();
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
    expect(getByText("Back")).toBeTruthy();
  });

  it("renders Review button", () => {
    const { getByText } = render(<CreatePriorityStep4 {...defaultProps} />);
    expect(getByText("Review")).toBeTruthy();
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
    expect(getByText("Select Scope")).toBeTruthy();
  });

  it("shows scope options in modal", () => {
    const { getByText, getByLabelText } = render(
      <CreatePriorityStep4 {...defaultProps} />,
    );
    fireEvent.press(getByLabelText(/Scope:/));
    expect(getByLabelText("Life-wide")).toBeTruthy();
    expect(getByLabelText("Work")).toBeTruthy();
    expect(getByLabelText("Personal")).toBeTruthy();
  });

  it("opens score modal when importance button pressed", () => {
    const { getByText, getByLabelText } = render(
      <CreatePriorityStep4 {...defaultProps} />,
    );
    fireEvent.press(getByLabelText(/Importance:/));
    expect(getByText("Select Importance")).toBeTruthy();
  });
});
