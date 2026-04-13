import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import WeightAdjustmentModal from "../WeightAdjustmentModal";

// Mock the slider component
jest.mock("@react-native-community/slider", () => {
  const { View, Text } = require("react-native");
  return function MockSlider(props) {
    return (
      <View testID={`slider-${props.accessibilityLabel}`}>
        <Text>{props.value}</Text>
      </View>
    );
  };
});

// Mock the styles
jest.mock("../styles/weightAdjustmentStyles", () => ({
  styles: {
    container: {},
    header: {},
    title: {},
    cancelButton: {},
    cancelText: {},
    content: {},
    scrollContent: {},
    infoBox: {},
    infoText: {},
    totalBox: {},
    totalLabel: {},
    totalValue: {},
    totalValueError: {},
    weightItem: {},
    statementText: {},
    sliderContainer: {},
    slider: {},
    weightValue: {},
    weightValueZero: {},
    warningBox: {},
    warningText: {},
    resetButton: {},
    resetButtonText: {},
    footer: {},
    saveButton: {},
    saveButtonDisabled: {},
    saveButtonText: {},
  },
}));

describe("WeightAdjustmentModal", () => {
  const mockValues = [
    {
      id: "v1",
      active_revision_id: "r1",
      revisions: [{ id: "r1", statement: "Value 1", weight_normalized: 50 }],
    },
    {
      id: "v2",
      active_revision_id: "r2",
      revisions: [{ id: "r2", statement: "Value 2", weight_normalized: 30 }],
    },
    {
      id: "v3",
      active_revision_id: "r3",
      revisions: [{ id: "r3", statement: "Value 3", weight_normalized: 20 }],
    },
  ];
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the modal with header", () => {
    const { getByText } = render(
      <WeightAdjustmentModal
        values={mockValues}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />,
    );

    expect(getByText("Adjust Weights")).toBeTruthy();
    expect(getByText("Cancel")).toBeTruthy();
  });

  it("displays all values with their statements", () => {
    const { getByText } = render(
      <WeightAdjustmentModal
        values={mockValues}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />,
    );

    expect(getByText("Value 1")).toBeTruthy();
    expect(getByText("Value 2")).toBeTruthy();
    expect(getByText("Value 3")).toBeTruthy();
  });

  it("shows total weight", () => {
    const { getByText } = render(
      <WeightAdjustmentModal
        values={mockValues}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />,
    );

    expect(getByText("Total:")).toBeTruthy();
    expect(getByText("100.0%")).toBeTruthy();
  });

  it("calls onCancel when cancel button is pressed", () => {
    const { getByText } = render(
      <WeightAdjustmentModal
        values={mockValues}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />,
    );

    fireEvent.press(getByText("Cancel"));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it("has Reset to Equal button", () => {
    const { getByText } = render(
      <WeightAdjustmentModal
        values={mockValues}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />,
    );

    expect(getByText("Reset to Equal")).toBeTruthy();
  });

  it("has Save Weights button", () => {
    const { getByText } = render(
      <WeightAdjustmentModal
        values={mockValues}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />,
    );

    expect(getByText("Save Weights")).toBeTruthy();
  });

  it("calls onSave when save button is pressed", async () => {
    mockOnSave.mockResolvedValueOnce();
    const { getByText } = render(
      <WeightAdjustmentModal
        values={mockValues}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />,
    );

    fireEvent.press(getByText("Save Weights"));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
    });
  });

  it("shows info text about weights", () => {
    const { getByText } = render(
      <WeightAdjustmentModal
        values={mockValues}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />,
    );

    expect(getByText(/Weights represent your current emphasis/)).toBeTruthy();
  });

  it("renders weight percentages for each value", () => {
    const { getByText } = render(
      <WeightAdjustmentModal
        values={mockValues}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />,
    );

    expect(getByText("50.0%")).toBeTruthy();
    expect(getByText("30.0%")).toBeTruthy();
    expect(getByText("20.0%")).toBeTruthy();
  });
});
