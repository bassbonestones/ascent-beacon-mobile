/**
 * Tests for ViewValuesStep component
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import ViewValuesStep from "../ViewValuesStep";
import type { Value } from "../../../types";

// Mock styles
jest.mock("../../../screens/styles/valuesDiscoveryStyles", () => ({
  styles: {
    container: {},
    header: {},
    title: {},
    subtitle: {},
    content: {},
    reviewContent: {},
    reviewItem: {},
    reviewNumber: {},
    reviewText: {},
    footer: {},
    continueButton: {},
    continueButtonText: {},
  },
}));

// Helper to create mock value
const createMockValue = (id: string, statement: string): Value => ({
  id,
  user_id: "user-1",
  active_revision_id: `rev-${id}`,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  revisions: [],
  insights: [],
  active_revision: {
    id: `rev-${id}`,
    value_id: id,
    statement,
    weight_raw: 100,
    weight_normalized: 33,
    is_active: true,
    origin: "declared",
    created_at: "2024-01-01T00:00:00Z",
  },
});

describe("ViewValuesStep", () => {
  const mockOnGoToDashboard = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders title", () => {
    render(
      <ViewValuesStep values={[]} onGoToDashboard={mockOnGoToDashboard} />,
    );
    expect(screen.getByText("Your Core Values")).toBeTruthy();
  });

  it("renders singular count for one value", () => {
    const values = [createMockValue("v1", "Integrity")];
    render(
      <ViewValuesStep values={values} onGoToDashboard={mockOnGoToDashboard} />,
    );
    expect(screen.getByText("1 value guiding your priorities")).toBeTruthy();
  });

  it("renders plural count for multiple values", () => {
    const values = [
      createMockValue("v1", "Integrity"),
      createMockValue("v2", "Family"),
    ];
    render(
      <ViewValuesStep values={values} onGoToDashboard={mockOnGoToDashboard} />,
    );
    expect(screen.getByText("2 values guiding your priorities")).toBeTruthy();
  });

  it("renders each value statement", () => {
    const values = [
      createMockValue("v1", "Integrity in everything"),
      createMockValue("v2", "Family first"),
    ];
    render(
      <ViewValuesStep values={values} onGoToDashboard={mockOnGoToDashboard} />,
    );
    expect(screen.getByText("Integrity in everything")).toBeTruthy();
    expect(screen.getByText("Family first")).toBeTruthy();
  });

  it("renders value numbers", () => {
    const values = [
      createMockValue("v1", "Value 1"),
      createMockValue("v2", "Value 2"),
    ];
    render(
      <ViewValuesStep values={values} onGoToDashboard={mockOnGoToDashboard} />,
    );
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
  });

  it("renders back to dashboard button", () => {
    render(
      <ViewValuesStep values={[]} onGoToDashboard={mockOnGoToDashboard} />,
    );
    expect(screen.getByLabelText("Back to dashboard")).toBeTruthy();
  });

  it("calls onGoToDashboard when button pressed", () => {
    render(
      <ViewValuesStep values={[]} onGoToDashboard={mockOnGoToDashboard} />,
    );
    fireEvent.press(screen.getByLabelText("Back to dashboard"));
    expect(mockOnGoToDashboard).toHaveBeenCalled();
  });

  it("handles value without active revision", () => {
    const values = [
      {
        ...createMockValue("v1", "Test"),
        active_revision: null,
      } as unknown as Value,
    ];
    render(
      <ViewValuesStep values={values} onGoToDashboard={mockOnGoToDashboard} />,
    );
    // Should render empty string for statement
    expect(screen.getByText("1")).toBeTruthy();
  });
});
