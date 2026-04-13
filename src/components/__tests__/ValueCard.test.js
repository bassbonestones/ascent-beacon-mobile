import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import ValueCard from "../assistant/ValueCard";

// Mock styles
jest.mock("../assistant/assistantStyles", () => ({
  __esModule: true,
  default: {
    valueCard: {},
    similarHighlight: {},
    valueStatement: {},
    valueFooter: {},
    valueOrigin: {},
    valueActions: {},
    editButton: {},
    editButtonText: {},
    deleteButton: {},
    deleteButtonText: {},
    deleteConfirm: {},
    deleteConfirmText: {},
    deleteConfirmActions: {},
    deleteConfirmButton: {},
    deleteConfirmButtonText: {},
    cancelDeleteButton: {},
    cancelDeleteButtonText: {},
    insightContainer: {},
    insightText: {},
    insightActions: {},
    insightButton: {},
    insightButtonText: {},
  },
}));

describe("ValueCard", () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnConfirmDelete = jest.fn();
  const mockOnCancelDelete = jest.fn();
  const mockOnReviewInsight = jest.fn();
  const mockOnKeepBoth = jest.fn();
  const mockOnLayout = jest.fn();

  const baseValue = {
    id: "value-1",
    name: "Test Value",
  };

  const baseActiveRevision = {
    statement: "I value honesty",
    origin: "declared",
  };

  const defaultProps = {
    value: baseValue,
    activeRevision: baseActiveRevision,
    isHighlighted: false,
    isDeleting: false,
    insight: null,
    onEdit: mockOnEdit,
    onDelete: mockOnDelete,
    onConfirmDelete: mockOnConfirmDelete,
    onCancelDelete: mockOnCancelDelete,
    onReviewInsight: mockOnReviewInsight,
    onKeepBoth: mockOnKeepBoth,
    onLayout: mockOnLayout,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders null when activeRevision is null", () => {
    const { toJSON } = render(
      <ValueCard {...defaultProps} activeRevision={null} />,
    );
    expect(toJSON()).toBeNull();
  });

  it("renders value statement", () => {
    const { getByText } = render(<ValueCard {...defaultProps} />);
    expect(getByText("I value honesty")).toBeTruthy();
  });

  it("renders declared origin correctly", () => {
    const { getByText } = render(<ValueCard {...defaultProps} />);
    expect(getByText("Declared")).toBeTruthy();
  });

  it("renders explored origin correctly", () => {
    const exploredRevision = { ...baseActiveRevision, origin: "explored" };
    const { getByText } = render(
      <ValueCard {...defaultProps} activeRevision={exploredRevision} />,
    );
    expect(getByText("✨ Explored")).toBeTruthy();
  });

  it("renders edit button", () => {
    const { getByText } = render(<ValueCard {...defaultProps} />);
    expect(getByText("Edit")).toBeTruthy();
  });

  it("renders delete button", () => {
    const { getByText } = render(<ValueCard {...defaultProps} />);
    expect(getByText("Delete")).toBeTruthy();
  });

  it("calls onEdit with value when edit button pressed", () => {
    const { getByLabelText } = render(<ValueCard {...defaultProps} />);
    fireEvent.press(getByLabelText("Edit value"));
    expect(mockOnEdit).toHaveBeenCalledWith(baseValue);
  });

  it("calls onDelete with value when delete button pressed", () => {
    const { getByLabelText } = render(<ValueCard {...defaultProps} />);
    fireEvent.press(getByLabelText("Delete value"));
    expect(mockOnDelete).toHaveBeenCalledWith(baseValue);
  });

  it("shows delete confirmation when isDeleting is true", () => {
    const { getByText } = render(
      <ValueCard {...defaultProps} isDeleting={true} />,
    );
    expect(getByText("Delete this value?")).toBeTruthy();
  });

  it("has confirm delete button when isDeleting", () => {
    const { getByLabelText } = render(
      <ValueCard {...defaultProps} isDeleting={true} />,
    );
    expect(getByLabelText("Confirm delete")).toBeTruthy();
  });

  it("has cancel delete button when isDeleting", () => {
    const { getByLabelText } = render(
      <ValueCard {...defaultProps} isDeleting={true} />,
    );
    expect(getByLabelText("Cancel delete")).toBeTruthy();
  });

  it("calls onConfirmDelete with value when confirm pressed", () => {
    const { getByLabelText } = render(
      <ValueCard {...defaultProps} isDeleting={true} />,
    );
    fireEvent.press(getByLabelText("Confirm delete"));
    expect(mockOnConfirmDelete).toHaveBeenCalledWith(baseValue);
  });

  it("calls onCancelDelete when cancel pressed", () => {
    const { getByLabelText } = render(
      <ValueCard {...defaultProps} isDeleting={true} />,
    );
    fireEvent.press(getByLabelText("Cancel delete"));
    expect(mockOnCancelDelete).toHaveBeenCalled();
  });

  it("does not show delete confirmation when isDeleting is false", () => {
    const { queryByText } = render(
      <ValueCard {...defaultProps} isDeleting={false} />,
    );
    expect(queryByText("Delete this value?")).toBeNull();
  });

  it("renders insight when provided", () => {
    const insight = {
      message: "This value seems similar to another",
      similar_value_id: "other-value",
    };
    const { getByText } = render(
      <ValueCard {...defaultProps} insight={insight} />,
    );
    expect(getByText("This value seems similar to another")).toBeTruthy();
  });

  it("renders review button when insight has similar_value_id", () => {
    const insight = {
      message: "Similar value found",
      similar_value_id: "other-value",
    };
    const { getByLabelText } = render(
      <ValueCard {...defaultProps} insight={insight} />,
    );
    expect(getByLabelText("Review similar value")).toBeTruthy();
  });

  it("renders keep both button when insight provided", () => {
    const insight = {
      message: "Similar value found",
      similar_value_id: "other-value",
    };
    const { getByLabelText } = render(
      <ValueCard {...defaultProps} insight={insight} />,
    );
    expect(getByLabelText("Keep both values")).toBeTruthy();
  });

  it("calls onReviewInsight with value id when review pressed", () => {
    const insight = {
      message: "Similar value found",
      similar_value_id: "other-value",
    };
    const { getByLabelText } = render(
      <ValueCard {...defaultProps} insight={insight} />,
    );
    fireEvent.press(getByLabelText("Review similar value"));
    expect(mockOnReviewInsight).toHaveBeenCalledWith("value-1");
  });

  it("calls onKeepBoth with value id when keep both pressed", () => {
    const insight = {
      message: "Similar value found",
      similar_value_id: "other-value",
    };
    const { getByLabelText } = render(
      <ValueCard {...defaultProps} insight={insight} />,
    );
    fireEvent.press(getByLabelText("Keep both values"));
    expect(mockOnKeepBoth).toHaveBeenCalledWith("value-1");
  });

  it("does not render review button when insight has no similar_value_id", () => {
    const insight = {
      message: "Some insight",
      similar_value_id: null,
    };
    const { queryByLabelText } = render(
      <ValueCard {...defaultProps} insight={insight} />,
    );
    expect(queryByLabelText("Review similar value")).toBeNull();
  });

  it("has correct accessibility label for card", () => {
    const { getByLabelText } = render(<ValueCard {...defaultProps} />);
    expect(getByLabelText("Value: I value honesty")).toBeTruthy();
  });
});
