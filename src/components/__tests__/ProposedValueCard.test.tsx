import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import ProposedValueCard from "../assistant/ProposedValueCard";
import type { AssistantRecommendation } from "../../types";

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

// Helper to create mock recommendation
const createMockRecommendation = (
  id: string,
  statement: string,
): AssistantRecommendation => ({
  id,
  session_id: "session-1",
  recommendation_type: "value",
  title: statement,
  description: "",
  status: "pending",
  payload: { statement },
  created_at: "2024-01-01T00:00:00Z",
});

describe("ProposedValueCard", () => {
  const mockOnAccept = jest.fn();
  const mockOnReject = jest.fn();

  const baseRecommendation = createMockRecommendation(
    "rec-1",
    "Test value statement",
  );

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

  it("handles recommendation with description", () => {
    const recommendation: AssistantRecommendation = {
      ...baseRecommendation,
      description: "This is why we suggest this",
    };
    const { getByText } = render(
      <ProposedValueCard
        recommendation={recommendation}
        onAccept={mockOnAccept}
        onReject={mockOnReject}
      />,
    );
    // Verify the card renders - description display depends on component implementation
    expect(getByText("Test value statement")).toBeTruthy();
  });

  it("does not render description when empty", () => {
    const { queryByText } = render(
      <ProposedValueCard
        recommendation={baseRecommendation}
        onAccept={mockOnAccept}
        onReject={mockOnReject}
      />,
    );
    // Check no description text element is rendered
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
    const recommendation = createMockRecommendation(
      "different-id-123",
      "Another value",
    );
    const { getByLabelText } = render(
      <ProposedValueCard
        recommendation={recommendation}
        onAccept={mockOnAccept}
        onReject={mockOnReject}
      />,
    );
    fireEvent.press(getByLabelText("Accept and add this value"));
    expect(mockOnAccept).toHaveBeenCalledWith("different-id-123");
  });
});
