import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import ProposedValueCard from "../assistant/ProposedValueCard";

// Mock styles
jest.mock("../assistant/assistantStyles", () => ({
  __esModule: true,
  default: {
    proposedValueCard: {},
    proposedHeader: {},
    proposedLabel: {},
    proposedStatement: {},
    proposedRationale: {},
    proposedActions: {},
    rejectButton: {},
    rejectButtonText: {},
    acceptButton: {},
    acceptButtonText: {},
  },
}));

describe("ProposedValueCard", () => {
  const mockOnAccept = jest.fn();
  const mockOnReject = jest.fn();

  const baseRecommendation = {
    id: "rec-1",
    payload: { statement: "Test value statement" },
    rationale: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders proposed value label", () => {
    const { getByText } = render(
      <ProposedValueCard
        recommendation={baseRecommendation}
        onAccept={mockOnAccept}
        onReject={mockOnReject}
      />,
    );
    expect(getByText("Proposed Value")).toBeTruthy();
  });

  it("renders value statement", () => {
    const { getByText } = render(
      <ProposedValueCard
        recommendation={baseRecommendation}
        onAccept={mockOnAccept}
        onReject={mockOnReject}
      />,
    );
    expect(getByText("Test value statement")).toBeTruthy();
  });

  it("renders rationale when provided", () => {
    const recommendation = {
      ...baseRecommendation,
      rationale: "This is why we suggest this",
    };
    const { getByText } = render(
      <ProposedValueCard
        recommendation={recommendation}
        onAccept={mockOnAccept}
        onReject={mockOnReject}
      />,
    );
    expect(getByText("This is why we suggest this")).toBeTruthy();
  });

  it("does not render rationale when not provided", () => {
    const { queryByText } = render(
      <ProposedValueCard
        recommendation={baseRecommendation}
        onAccept={mockOnAccept}
        onReject={mockOnReject}
      />,
    );
    // Check no rationale text element is rendered
    expect(queryByText("This is why")).toBeNull();
  });

  it("renders reject button with correct text", () => {
    const { getByText } = render(
      <ProposedValueCard
        recommendation={baseRecommendation}
        onAccept={mockOnAccept}
        onReject={mockOnReject}
      />,
    );
    expect(getByText("Not Quite")).toBeTruthy();
  });

  it("renders accept button with correct text", () => {
    const { getByText } = render(
      <ProposedValueCard
        recommendation={baseRecommendation}
        onAccept={mockOnAccept}
        onReject={mockOnReject}
      />,
    );
    expect(getByText("Add This")).toBeTruthy();
  });

  it("calls onReject with recommendation id when reject button pressed", () => {
    const { getByLabelText } = render(
      <ProposedValueCard
        recommendation={baseRecommendation}
        onAccept={mockOnAccept}
        onReject={mockOnReject}
      />,
    );
    fireEvent.press(getByLabelText("Reject this value"));
    expect(mockOnReject).toHaveBeenCalledWith("rec-1");
  });

  it("calls onAccept with recommendation id when accept button pressed", () => {
    const { getByLabelText } = render(
      <ProposedValueCard
        recommendation={baseRecommendation}
        onAccept={mockOnAccept}
        onReject={mockOnReject}
      />,
    );
    fireEvent.press(getByLabelText("Accept and add this value"));
    expect(mockOnAccept).toHaveBeenCalledWith("rec-1");
  });

  it("has correct accessibility label for card", () => {
    const { getByLabelText } = render(
      <ProposedValueCard
        recommendation={baseRecommendation}
        onAccept={mockOnAccept}
        onReject={mockOnReject}
      />,
    );
    expect(getByLabelText("Proposed value: Test value statement")).toBeTruthy();
  });

  it("works with different recommendation ids", () => {
    const recommendation = {
      id: "different-id-123",
      payload: { statement: "Another value" },
      rationale: null,
    };
    const { getByLabelText } = render(
      <ProposedValueCard
        recommendation={recommendation}
        onAccept={mockOnAccept}
        onReject={mockOnReject}
      />,
    );

    fireEvent.press(getByLabelText("Accept and add this value"));
    expect(mockOnAccept).toHaveBeenCalledWith("different-id-123");

    fireEvent.press(getByLabelText("Reject this value"));
    expect(mockOnReject).toHaveBeenCalledWith("different-id-123");
  });
});
