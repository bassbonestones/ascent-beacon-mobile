import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import CreatePriorityStep3 from "../priorities/CreatePriorityStep3";
import type { Value } from "../../types";

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
    labelRow: {},
    labelIcon: {},
    label: {},
    emptyText: {},
    valuesList: {},
    valueItem: {},
    valueItemSelected: {},
    valueCheckbox: {},
    checkmark: {},
    valueContent: {},
    valueStatement: {},
    valueWeight: {},
    formButtons: {},
    cancelButton: {},
    cancelButtonText: {},
    nextButton: {},
    nextButtonDisabled: {},
    nextButtonText: {},
  },
}));

// Test mock values - only include fields actually used in rendering
const createMockValue = (
  id: string,
  statement: string,
  weightNormalized: number | null,
): Value =>
  ({
    id,
    user_id: "test-user",
    active_revision_id: `${id}-rev`,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    revisions: [
      {
        id: `${id}-rev`,
        value_id: id,
        statement,
        weight_raw: 50,
        weight_normalized: weightNormalized,
        is_active: true,
        origin: "declared" as const,
        created_at: "2024-01-01T00:00:00Z",
      },
    ],
    insights: [],
  }) as Value;

describe("CreatePriorityStep3", () => {
  const mockOnToggleValue = jest.fn();
  const mockOnBack = jest.fn();
  const mockOnNext = jest.fn();

  const sampleValues: Value[] = [
    createMockValue("v1", "Family first", 30.5),
    createMockValue("v2", "Health matters", 25),
    createMockValue("v3", "Career growth", null),
  ];

  const defaultProps = {
    values: sampleValues,
    selectedValues: new Set<string>(),
    onToggleValue: mockOnToggleValue,
    onBack: mockOnBack,
    onNext: mockOnNext,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders step number", () => {
    const { getByText } = render(<CreatePriorityStep3 {...defaultProps} />);
    expect(getByText("Step 3 of 4")).toBeTruthy();
  });

  it("renders title", () => {
    const { getByText } = render(<CreatePriorityStep3 {...defaultProps} />);
    expect(getByText("Link Values")).toBeTruthy();
  });

  it("renders subtitle", () => {
    const { getByText } = render(<CreatePriorityStep3 {...defaultProps} />);
    expect(getByText("Which values does this support?")).toBeTruthy();
  });

  it("renders value list", () => {
    const { getByText } = render(<CreatePriorityStep3 {...defaultProps} />);
    expect(getByText("Family first")).toBeTruthy();
    expect(getByText("Health matters")).toBeTruthy();
    expect(getByText("Career growth")).toBeTruthy();
  });

  it("renders weight for values with normalized weight", () => {
    const { getByText } = render(<CreatePriorityStep3 {...defaultProps} />);
    expect(getByText("Weight: 30.5%")).toBeTruthy();
    expect(getByText("Weight: 25.0%")).toBeTruthy();
  });

  it("renders placeholder weight for values without normalized weight", () => {
    const { getByText } = render(<CreatePriorityStep3 {...defaultProps} />);
    expect(getByText("Weight: --")).toBeTruthy();
  });

  it("shows empty message when no values", () => {
    const props = { ...defaultProps, values: [] };
    const { getByText } = render(<CreatePriorityStep3 {...props} />);
    expect(
      getByText("Create some values first in the Values module"),
    ).toBeTruthy();
  });

  it("calls onToggleValue when value pressed", () => {
    const { getByText } = render(<CreatePriorityStep3 {...defaultProps} />);
    fireEvent.press(getByText("Family first"));
    expect(mockOnToggleValue).toHaveBeenCalledWith("v1");
  });

  it("shows checkmark for selected values", () => {
    const props = { ...defaultProps, selectedValues: new Set(["v1", "v2"]) };
    const { getAllByText } = render(<CreatePriorityStep3 {...props} />);
    const checkmarks = getAllByText("✓");
    expect(checkmarks.length).toBe(2);
  });

  it("has correct accessibility role for value items", () => {
    const { getByLabelText } = render(
      <CreatePriorityStep3 {...defaultProps} />,
    );
    const item = getByLabelText("Family first, not selected");
    expect(item.props.accessibilityRole).toBe("checkbox");
  });

  it("has correct accessibility state for selected item", () => {
    const props = { ...defaultProps, selectedValues: new Set(["v1"]) };
    const { getByLabelText } = render(<CreatePriorityStep3 {...props} />);
    const item = getByLabelText("Family first, selected");
    expect(item.props.accessibilityState?.checked).toBe(true);
  });

  it("renders Back button", () => {
    const { getByText } = render(<CreatePriorityStep3 {...defaultProps} />);
    expect(getByText("Back")).toBeTruthy();
  });

  it("renders Next button", () => {
    const { getByText } = render(<CreatePriorityStep3 {...defaultProps} />);
    expect(getByText("Next")).toBeTruthy();
  });

  it("calls onBack when Back button pressed", () => {
    const { getByLabelText } = render(
      <CreatePriorityStep3 {...defaultProps} />,
    );
    fireEvent.press(getByLabelText("Go back"));
    expect(mockOnBack).toHaveBeenCalled();
  });

  it("disables Next button when no values selected", () => {
    const { getByLabelText } = render(
      <CreatePriorityStep3 {...defaultProps} />,
    );
    const nextBtn = getByLabelText("Next step");
    expect(nextBtn.props.accessibilityState?.disabled).toBe(true);
  });

  it("enables Next button when values selected", () => {
    const props = { ...defaultProps, selectedValues: new Set(["v1"]) };
    const { getByLabelText } = render(<CreatePriorityStep3 {...props} />);
    const nextBtn = getByLabelText("Next step");
    expect(nextBtn.props.accessibilityState?.disabled).toBe(false);
  });

  it("calls onNext when Next button pressed", () => {
    const props = { ...defaultProps, selectedValues: new Set(["v1"]) };
    const { getByLabelText } = render(<CreatePriorityStep3 {...props} />);
    fireEvent.press(getByLabelText("Next step"));
    expect(mockOnNext).toHaveBeenCalled();
  });

  it("renders values icon image", () => {
    const { UNSAFE_getByType } = render(
      <CreatePriorityStep3 {...defaultProps} />,
    );
    const { Image } = require("react-native");
    expect(UNSAFE_getByType(Image)).toBeTruthy();
  });
});
