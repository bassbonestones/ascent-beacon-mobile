import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import CreatePriorityReview from "../priorities/CreatePriorityReview";

// Mock styles
jest.mock("../../screens/styles/prioritiesScreenStyles", () => ({
  styles: {
    container: {},
    header: {},
    stepNumber: {},
    title: {},
    content: {},
    reviewSection: {},
    reviewLabel: {},
    reviewValue: {},
    valuesList: {},
    reviewValueItem: {},
    reviewValueText: {},
    formButtons: {},
    cancelButton: {},
    cancelButtonText: {},
    nextButton: {},
    nextButtonDisabled: {},
    nextButtonText: {},
  },
  SCOPES: [
    { value: "life", label: "Life-wide" },
    { value: "work", label: "Work" },
    { value: "personal", label: "Personal" },
  ],
}));

describe("CreatePriorityReview", () => {
  const mockOnBack = jest.fn();
  const mockOnSubmit = jest.fn();

  const sampleValues = [
    { id: "v1", revisions: [{ statement: "Family first" }] },
    { id: "v2", revisions: [{ statement: "Health matters" }] },
  ];

  const defaultProps = {
    formData: {
      title: "Test Priority",
      why_matters: "Because it matters to me",
      scope: "life",
      score: 3,
      cadence: "Weekly",
      constraints: "Time limited",
    },
    values: sampleValues,
    selectedValues: new Set(["v1"]),
    isEditMode: false,
    loading: false,
    onBack: mockOnBack,
    onSubmit: mockOnSubmit,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders Review step header", () => {
    const { getByText } = render(<CreatePriorityReview {...defaultProps} />);
    expect(getByText("Review")).toBeTruthy();
  });

  it("renders Confirm Priority title", () => {
    const { getByText } = render(<CreatePriorityReview {...defaultProps} />);
    expect(getByText("Confirm Priority")).toBeTruthy();
  });

  it("renders priority name", () => {
    const { getByText } = render(<CreatePriorityReview {...defaultProps} />);
    expect(getByText("Test Priority")).toBeTruthy();
  });

  it("shows (not set) when title is empty", () => {
    const props = {
      ...defaultProps,
      formData: { ...defaultProps.formData, title: "" },
    };
    const { getAllByText } = render(<CreatePriorityReview {...props} />);
    expect(getAllByText("(not set)").length).toBeGreaterThan(0);
  });

  it("renders why_matters value", () => {
    const { getByText } = render(<CreatePriorityReview {...defaultProps} />);
    expect(getByText("Because it matters to me")).toBeTruthy();
  });

  it("shows (not set) when why_matters is empty", () => {
    const props = {
      ...defaultProps,
      formData: { ...defaultProps.formData, why_matters: "" },
    };
    const { getAllByText } = render(<CreatePriorityReview {...props} />);
    expect(getAllByText("(not set)").length).toBeGreaterThan(0);
  });

  it("renders scope label", () => {
    const { getByText } = render(<CreatePriorityReview {...defaultProps} />);
    expect(getByText("Life-wide")).toBeTruthy();
  });

  it("renders unknown scope value as string", () => {
    const props = {
      ...defaultProps,
      formData: { ...defaultProps.formData, scope: "custom" },
    };
    const { getByText } = render(<CreatePriorityReview {...props} />);
    expect(getByText("custom")).toBeTruthy();
  });

  it("renders importance score", () => {
    const { getByText } = render(<CreatePriorityReview {...defaultProps} />);
    expect(getByText("3/5")).toBeTruthy();
  });

  it("shows (not set) when score is empty", () => {
    const props = {
      ...defaultProps,
      formData: { ...defaultProps.formData, score: null },
    };
    const { getAllByText } = render(<CreatePriorityReview {...props} />);
    expect(getAllByText("(not set)").length).toBeGreaterThan(0);
  });

  it("renders cadence when provided", () => {
    const { getByText } = render(<CreatePriorityReview {...defaultProps} />);
    expect(getByText("Weekly")).toBeTruthy();
  });

  it("does not render cadence section when empty", () => {
    const props = {
      ...defaultProps,
      formData: { ...defaultProps.formData, cadence: "" },
    };
    const { queryByText } = render(<CreatePriorityReview {...props} />);
    // Cadence label shouldn't be rendered
    const labels = props.formData.cadence ? ["Cadence"] : [];
    if (!props.formData.cadence) {
      // The Cadence section should not appear
    }
    expect(queryByText("Weekly")).toBeNull();
  });

  it("renders constraints when provided", () => {
    const { getByText } = render(<CreatePriorityReview {...defaultProps} />);
    expect(getByText("Time limited")).toBeTruthy();
  });

  it("does not render constraints section when empty", () => {
    const props = {
      ...defaultProps,
      formData: { ...defaultProps.formData, constraints: "" },
    };
    const { queryByText } = render(<CreatePriorityReview {...props} />);
    expect(queryByText("Time limited")).toBeNull();
  });

  it("renders linked values", () => {
    const { getByText } = render(<CreatePriorityReview {...defaultProps} />);
    expect(getByText("• Family first")).toBeTruthy();
  });

  it("shows no values message when none selected", () => {
    const props = { ...defaultProps, selectedValues: new Set() };
    const { getByText } = render(<CreatePriorityReview {...props} />);
    expect(getByText("No values selected")).toBeTruthy();
  });

  it("renders Back button", () => {
    const { getByText } = render(<CreatePriorityReview {...defaultProps} />);
    expect(getByText("Back")).toBeTruthy();
  });

  it("renders Create Priority button in create mode", () => {
    const { getByText } = render(<CreatePriorityReview {...defaultProps} />);
    expect(getByText("Create Priority")).toBeTruthy();
  });

  it("renders Update Priority button in edit mode", () => {
    const props = { ...defaultProps, isEditMode: true };
    const { getByText } = render(<CreatePriorityReview {...props} />);
    expect(getByText("Update Priority")).toBeTruthy();
  });

  it("shows Creating... text when loading in create mode", () => {
    const props = { ...defaultProps, loading: true };
    const { getByText } = render(<CreatePriorityReview {...props} />);
    expect(getByText("Creating...")).toBeTruthy();
  });

  it("shows Updating... text when loading in edit mode", () => {
    const props = { ...defaultProps, isEditMode: true, loading: true };
    const { getByText } = render(<CreatePriorityReview {...props} />);
    expect(getByText("Updating...")).toBeTruthy();
  });

  it("calls onBack when Back button pressed", () => {
    const { getByLabelText } = render(
      <CreatePriorityReview {...defaultProps} />,
    );
    fireEvent.press(getByLabelText("Go back"));
    expect(mockOnBack).toHaveBeenCalled();
  });

  it("calls onSubmit when Create button pressed", () => {
    const { getByLabelText } = render(
      <CreatePriorityReview {...defaultProps} />,
    );
    fireEvent.press(getByLabelText("Create priority"));
    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it("calls onSubmit when Update button pressed", () => {
    const props = { ...defaultProps, isEditMode: true };
    const { getByLabelText } = render(<CreatePriorityReview {...props} />);
    fireEvent.press(getByLabelText("Update priority"));
    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it("disables submit button when loading", () => {
    const props = { ...defaultProps, loading: true };
    const { getByLabelText } = render(<CreatePriorityReview {...props} />);
    const submitBtn = getByLabelText("Create priority");
    expect(submitBtn.props.accessibilityState?.disabled).toBe(true);
  });

  it("renders multiple linked values", () => {
    const props = { ...defaultProps, selectedValues: new Set(["v1", "v2"]) };
    const { getByText } = render(<CreatePriorityReview {...props} />);
    expect(getByText("• Family first")).toBeTruthy();
    expect(getByText("• Health matters")).toBeTruthy();
  });
});
