/**
 * Tests for ValueListCard component
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import ValueListCard from "../values/ValueListCard";

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

describe("ValueListCard", () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnReviewInsight = jest.fn();
  const mockOnKeepBoth = jest.fn();
  const mockOnLayout = jest.fn();

  const baseValue = { id: "v1" };
  const baseRevision = {
    id: "r1",
    statement: "I value honesty and integrity",
    weight_normalized: 25.5,
  };

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

    fireEvent.press(screen.getByText("Edit"));

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

    fireEvent.press(screen.getByText("Delete"));

    expect(mockOnDelete).toHaveBeenCalledWith("v1");
  });

  it("should not render delete button when canDelete is false", () => {
    render(
      <ValueListCard
        value={baseValue}
        activeRevision={baseRevision}
        canDelete={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onReviewInsight={mockOnReviewInsight}
        onKeepBoth={mockOnKeepBoth}
      />,
    );

    expect(screen.queryByText("Delete")).toBeNull();
  });

  it("should render insight when provided", () => {
    const insight = {
      message: "This value is similar to another",
      similar_value_id: "v2",
    };

    render(
      <ValueListCard
        value={baseValue}
        activeRevision={baseRevision}
        insight={insight}
        canDelete={true}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onReviewInsight={mockOnReviewInsight}
        onKeepBoth={mockOnKeepBoth}
      />,
    );

    expect(screen.getByText("This value is similar to another")).toBeTruthy();
  });

  it("should render Review button when insight has similar_value_id", () => {
    const insight = {
      message: "Similar value found",
      similar_value_id: "v2",
    };

    render(
      <ValueListCard
        value={baseValue}
        activeRevision={baseRevision}
        insight={insight}
        canDelete={true}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onReviewInsight={mockOnReviewInsight}
        onKeepBoth={mockOnKeepBoth}
      />,
    );

    expect(screen.getByText("Review")).toBeTruthy();
  });

  it("should call onReviewInsight when Review button is pressed", () => {
    const insight = {
      message: "Similar value found",
      similar_value_id: "v2",
    };

    render(
      <ValueListCard
        value={baseValue}
        activeRevision={baseRevision}
        insight={insight}
        canDelete={true}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onReviewInsight={mockOnReviewInsight}
        onKeepBoth={mockOnKeepBoth}
      />,
    );

    fireEvent.press(screen.getByText("Review"));

    expect(mockOnReviewInsight).toHaveBeenCalledWith("v1");
  });

  it("should call onKeepBoth when Keep both button is pressed", () => {
    const insight = {
      message: "Similar value found",
      similar_value_id: "v2",
    };

    render(
      <ValueListCard
        value={baseValue}
        activeRevision={baseRevision}
        insight={insight}
        canDelete={true}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onReviewInsight={mockOnReviewInsight}
        onKeepBoth={mockOnKeepBoth}
      />,
    );

    fireEvent.press(screen.getByText("Keep both"));

    expect(mockOnKeepBoth).toHaveBeenCalledWith("v1");
  });

  it("should have accessibility labels", () => {
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

    expect(
      screen.getByLabelText("Value: I value honesty and integrity"),
    ).toBeTruthy();
    expect(screen.getByLabelText("Edit value")).toBeTruthy();
    expect(screen.getByLabelText("Delete value")).toBeTruthy();
  });
});
