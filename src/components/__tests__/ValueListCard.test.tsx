/**
 * Tests for ValueListCard component
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import ValueListCard from "../values/ValueListCard";
import type { Value, ValueRevision } from "../../types";

// Mock styles - path is relative to the component being tested
jest.mock("../../screens/styles/valuesManagementStyles", () => ({
  styles: {
    valueCard: {},
    similarHighlight: {},
    valueHeader: {},
    valueStatement: {},
    insightContainer: {},
    insightText: {},
    insightActions: {},
    insightButton: {},
    insightButtonText: {},
    weightText: {},
    valueActions: {},
    editButton: {},
    editButtonText: {},
    deleteButton: {},
    deleteButtonText: {},
  },
}));

// Helper to create mock value
const createMockValue = (id: string): Value =>
  ({
    id,
    user_id: "test-user",
    active_revision_id: `${id}-rev`,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    revisions: [],
    insights: [],
  }) as Value;

// Helper to create mock revision
const createMockRevision = (
  id: string,
  statement: string,
  weightNormalized: number,
): ValueRevision =>
  ({
    id,
    value_id: "v1",
    statement,
    weight_raw: 50,
    weight_normalized: weightNormalized,
    is_active: true,
    origin: "declared" as const,
    created_at: "2024-01-01T00:00:00Z",
  }) as ValueRevision;

describe("ValueListCard", () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnReviewInsight = jest.fn();
  const mockOnKeepBoth = jest.fn();
  const mockOnLayout = jest.fn();

  const baseValue = createMockValue("v1");
  const baseRevision = createMockRevision(
    "r1",
    "I value honesty and integrity",
    25.5,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render value statement", () => {
    render(
      <ValueListCard
        value={baseValue}
        activeRevision={baseRevision}
        canDelete={true}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onReviewInsight={mockOnReviewInsight}
        onKeepBoth={mockOnKeepBoth}
      />,
    );

    expect(screen.getByText("I value honesty and integrity")).toBeTruthy();
  });

  it("should return null when no activeRevision", () => {
    const { toJSON } = render(
      <ValueListCard
        value={baseValue}
        activeRevision={null}
        canDelete={true}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onReviewInsight={mockOnReviewInsight}
        onKeepBoth={mockOnKeepBoth}
      />,
    );

    expect(toJSON()).toBeNull();
  });

  it("should display weight when provided", () => {
    render(
      <ValueListCard
        value={baseValue}
        activeRevision={baseRevision}
        canDelete={true}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onReviewInsight={mockOnReviewInsight}
        onKeepBoth={mockOnKeepBoth}
      />,
    );

    expect(screen.getByText("Weight: 25.5%")).toBeTruthy();
  });

  it("should call onEdit when edit button is pressed", () => {
    render(
      <ValueListCard
        value={baseValue}
        activeRevision={baseRevision}
        canDelete={true}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onReviewInsight={mockOnReviewInsight}
        onKeepBoth={mockOnKeepBoth}
      />,
    );

    fireEvent.press(screen.getByLabelText("Edit value"));
    expect(mockOnEdit).toHaveBeenCalledWith(baseValue);
  });

  it("should call onDelete when delete button is pressed", () => {
    render(
      <ValueListCard
        value={baseValue}
        activeRevision={baseRevision}
        canDelete={true}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onReviewInsight={mockOnReviewInsight}
        onKeepBoth={mockOnKeepBoth}
      />,
    );

    fireEvent.press(screen.getByLabelText("Delete value"));
    expect(mockOnDelete).toHaveBeenCalledWith("v1");
  });
});
