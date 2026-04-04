import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import WeightAdjustmentModal from "../WeightAdjustmentModal";
import type { Value } from "../../types";
import type { WeightItem } from "../../hooks/useWeightAdjustment";

// Mock the slider component
jest.mock("@react-native-community/slider", () => {
  const { View, Text } = require("react-native");
  return function MockSlider(props: {
    accessibilityLabel: string;
    value: number;
  }) {
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

// Helper to create mock value
const createMockValue = (
  id: string,
  statement: string,
  weightNormalized: number,
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

describe("WeightAdjustmentModal", () => {
  const mockValues: Value[] = [
    createMockValue("v1", "Value 1", 50),
    createMockValue("v2", "Value 2", 30),
    createMockValue("v3", "Value 3", 20),
  ];
  const mockOnSave = jest.fn().mockResolvedValue(undefined);
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
});
