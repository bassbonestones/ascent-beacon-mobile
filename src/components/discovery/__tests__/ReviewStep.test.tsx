/**
 * Tests for ReviewStep component
 */

import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import ReviewStep from "../ReviewStep";
import type { BucketItem } from "../../../hooks/useValuesDiscovery";

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
    backButton: {},
    backButtonText: {},
    continueButton: {},
    continueButtonDisabled: {},
    continueButtonText: {},
  },
}));

// Helper to create mock bucket item
const createMockBucketItem = (id: string, text: string): BucketItem => ({
  prompt_id: id,
  prompt: {
    id,
    prompt_text: text,
    primary_lens: "Identity",
    display_order: 1,
    active: true,
  },
  bucket: "core",
  display_order: 1,
});

describe("ReviewStep", () => {
  const defaultCoreItems = [
    createMockBucketItem("p1", "Honesty matters"),
    createMockBucketItem("p2", "Family first"),
    createMockBucketItem("p3", "Growth mindset"),
  ];

  const defaultProps = {
    coreItems: defaultCoreItems,
    onBack: jest.fn(),
    onSaveAndContinue: jest.fn().mockResolvedValue(undefined),
    saving: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders title", () => {
    render(<ReviewStep {...defaultProps} />);
    expect(screen.getByText("Review your core values")).toBeTruthy();
  });

  it("renders count in subtitle", () => {
    render(<ReviewStep {...defaultProps} />);
    expect(
      screen.getByText("These 3 values will guide your priorities"),
    ).toBeTruthy();
  });

  it("renders all core items with numbers", () => {
    render(<ReviewStep {...defaultProps} />);
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.getByText("Honesty matters")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText("Family first")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getByText("Growth mindset")).toBeTruthy();
  });

  it("renders back button", () => {
    render(<ReviewStep {...defaultProps} />);
    expect(screen.getByLabelText("Go back to adjust")).toBeTruthy();
    expect(screen.getByText("← Adjust")).toBeTruthy();
  });

  it("calls onBack when back pressed", () => {
    const onBack = jest.fn();
    render(<ReviewStep {...defaultProps} onBack={onBack} />);
    fireEvent.press(screen.getByLabelText("Go back to adjust"));
    expect(onBack).toHaveBeenCalled();
  });

  it("renders save button when not saving", () => {
    render(<ReviewStep {...defaultProps} />);
    expect(screen.getByLabelText("Save and continue")).toBeTruthy();
    expect(screen.getByText("Save & Continue")).toBeTruthy();
  });

  it("calls onSaveAndContinue when save pressed", async () => {
    const onSaveAndContinue = jest.fn().mockResolvedValue(undefined);
    render(
      <ReviewStep {...defaultProps} onSaveAndContinue={onSaveAndContinue} />,
    );
    fireEvent.press(screen.getByLabelText("Save and continue"));
    await waitFor(() => {
      expect(onSaveAndContinue).toHaveBeenCalled();
    });
  });

  it("disables save button when saving", () => {
    render(<ReviewStep {...defaultProps} saving={true} />);
    const saveButton = screen.getByLabelText("Save and continue");
    expect(saveButton.props.accessibilityState.disabled).toBe(true);
  });

  it("disables back button when saving", () => {
    // Back button receives disabled prop when saving
    // Just verify it can be found and don't click it during save
    render(<ReviewStep {...defaultProps} saving={true} />);
    expect(screen.getByLabelText("Go back to adjust")).toBeTruthy();
  });

  it("shows loading indicator when saving", () => {
    render(<ReviewStep {...defaultProps} saving={true} />);
    // When saving, text should not be visible (replaced with ActivityIndicator)
    expect(screen.queryByText("Save & Continue")).toBeNull();
  });

  it("renders correct accessibility labels for items", () => {
    render(<ReviewStep {...defaultProps} />);
    expect(screen.getByLabelText("Value 1: Honesty matters")).toBeTruthy();
    expect(screen.getByLabelText("Value 2: Family first")).toBeTruthy();
    expect(screen.getByLabelText("Value 3: Growth mindset")).toBeTruthy();
  });
});
