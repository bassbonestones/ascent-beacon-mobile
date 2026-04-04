/**
 * Tests for BucketStep component
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import BucketStep from "../BucketStep";
import type { BucketItem, Buckets } from "../../../hooks/useValuesDiscovery";
import type { SelectionBucket } from "../../../types";

// Mock styles
jest.mock("../../../screens/styles/valuesDiscoveryStyles", () => ({
  styles: {
    container: {},
    header: {},
    title: {},
    subtitle: {},
    subsubtitle: {},
    content: {},
    bucketSection: {},
    bucketTitle: {},
    bucketDescription: {},
    warningBox: {},
    warningText: {},
    emptyBucket: {},
    emptyBucketText: {},
    bucketItemsContainer: {},
    bucketItem: {},
    bucketItemText: {},
    footer: {},
    backButton: {},
    backButtonText: {},
    continueButton: {},
    continueButtonText: {},
    modalOverlay: {},
    modalContent: {},
    modalTitle: {},
    modalText: {},
    modalButtons: {},
    modalButton: {},
    modalButtonCancel: {},
    modalButtonText: {},
  },
}));

// Mock the MAX_CORE_VALUES constant
jest.mock("../../../hooks/useValuesDiscovery", () => ({
  MAX_CORE_VALUES: 6,
}));

// Helper to create mock bucket item
const createMockBucketItem = (
  id: string,
  text: string,
  bucket: SelectionBucket,
): BucketItem => ({
  prompt_id: id,
  prompt: {
    id,
    prompt_text: text,
    lens: "Identity",
    weight: 1,
  },
  bucket,
});

describe("BucketStep", () => {
  const defaultBuckets: Buckets = {
    core: [createMockBucketItem("p1", "Honesty", "core")],
    important: [createMockBucketItem("p2", "Creativity", "important")],
    not_now: [createMockBucketItem("p3", "Adventure", "not_now")],
  };

  const defaultProps = {
    buckets: defaultBuckets,
    onMoveToBucket: jest.fn(),
    onBack: jest.fn(),
    onContinue: jest.fn(),
    coreCount: 1,
    canContinue: true,
    onShowCoreWarning: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders header with instructions", () => {
    render(<BucketStep {...defaultProps} />);
    expect(screen.getByText("These all matter in some way.")).toBeTruthy();
    expect(
      screen.getByText("Let's organize them by how they feel right now."),
    ).toBeTruthy();
  });

  it("renders all three bucket sections", () => {
    render(<BucketStep {...defaultProps} />);
    expect(screen.getByText("Core (right now)")).toBeTruthy();
    expect(screen.getByText("Important")).toBeTruthy();
    expect(screen.getByText("Not right now")).toBeTruthy();
  });

  it("renders bucket descriptions", () => {
    render(<BucketStep {...defaultProps} />);
    expect(
      screen.getByText("Feels central to how I want to live."),
    ).toBeTruthy();
    expect(
      screen.getByText("Matters, but not central right now."),
    ).toBeTruthy();
    expect(
      screen.getByText("Resonates, but not a focus currently."),
    ).toBeTruthy();
  });

  it("renders items in each bucket", () => {
    render(<BucketStep {...defaultProps} />);
    expect(screen.getByText("Honesty")).toBeTruthy();
    expect(screen.getByText("Creativity")).toBeTruthy();
    expect(screen.getByText("Adventure")).toBeTruthy();
  });

  it("shows empty message for empty buckets", () => {
    const emptyBuckets: Buckets = {
      core: [],
      important: [createMockBucketItem("p1", "Test", "important")],
      not_now: [],
    };
    render(<BucketStep {...defaultProps} buckets={emptyBuckets} />);
    expect(screen.getByText("Tap items below to add to Core")).toBeTruthy();
    expect(screen.getAllByText("Empty").length).toBe(1);
  });

  it("renders back and continue buttons", () => {
    render(<BucketStep {...defaultProps} />);
    expect(screen.getByLabelText("Go back to selection")).toBeTruthy();
    expect(screen.getByLabelText("Continue")).toBeTruthy();
  });

  it("calls onBack when back pressed", () => {
    const onBack = jest.fn();
    render(<BucketStep {...defaultProps} onBack={onBack} />);
    fireEvent.press(screen.getByLabelText("Go back to selection"));
    expect(onBack).toHaveBeenCalled();
  });

  it("calls onContinue when continue pressed and canContinue is true", () => {
    const onContinue = jest.fn();
    render(
      <BucketStep
        {...defaultProps}
        canContinue={true}
        onContinue={onContinue}
      />,
    );
    fireEvent.press(screen.getByLabelText("Continue"));
    expect(onContinue).toHaveBeenCalled();
  });

  it("calls onShowCoreWarning when continue pressed and canContinue is false", () => {
    const onShowCoreWarning = jest.fn();
    render(
      <BucketStep
        {...defaultProps}
        canContinue={false}
        onShowCoreWarning={onShowCoreWarning}
      />,
    );
    fireEvent.press(screen.getByLabelText("Continue"));
    expect(onShowCoreWarning).toHaveBeenCalled();
  });

  it("opens move modal when item tapped", () => {
    render(<BucketStep {...defaultProps} />);
    fireEvent.press(screen.getByLabelText("Honesty, tap to move"));
    expect(screen.getByText("Move this value?")).toBeTruthy();
    // "Honesty" appears both in bucket list and modal, verify modal opened via title
  });

  it("shows move options for core item", () => {
    render(<BucketStep {...defaultProps} />);
    fireEvent.press(screen.getByLabelText("Honesty, tap to move"));
    expect(screen.getByLabelText("Move to Important")).toBeTruthy();
    expect(screen.getByLabelText("Move to Not right now")).toBeTruthy();
  });

  it("shows move options for important item", () => {
    render(<BucketStep {...defaultProps} />);
    fireEvent.press(screen.getByLabelText("Creativity, tap to move"));
    expect(screen.getByLabelText("Make Core")).toBeTruthy();
    expect(screen.getByLabelText("Move to Not right now")).toBeTruthy();
  });

  it("shows move options for not_now item", () => {
    render(<BucketStep {...defaultProps} />);
    fireEvent.press(screen.getByLabelText("Adventure, tap to move"));
    expect(screen.getByLabelText("Make Core")).toBeTruthy();
    expect(screen.getByLabelText("Move to Important")).toBeTruthy();
  });

  it("calls onMoveToBucket when move option selected", () => {
    const onMoveToBucket = jest.fn();
    render(<BucketStep {...defaultProps} onMoveToBucket={onMoveToBucket} />);
    fireEvent.press(screen.getByLabelText("Honesty, tap to move"));
    fireEvent.press(screen.getByLabelText("Move to Important"));
    expect(onMoveToBucket).toHaveBeenCalledWith(
      defaultBuckets.core[0],
      "important",
    );
  });

  it("closes modal when cancel pressed", () => {
    render(<BucketStep {...defaultProps} />);
    fireEvent.press(screen.getByLabelText("Honesty, tap to move"));
    expect(screen.getByText("Move this value?")).toBeTruthy();
    fireEvent.press(screen.getByLabelText("Cancel"));
    // Modal should be closed - the modal content should not be visible
    expect(screen.queryByText("Move this value?")).toBeNull();
  });

  it("shows warning when coreCount exceeds MAX", () => {
    render(<BucketStep {...defaultProps} coreCount={8} />);
    expect(
      screen.getByText(
        "You've marked quite a few as Core. You'll choose 3–6 to anchor next.",
      ),
    ).toBeTruthy();
  });

  it("does not show warning when coreCount within MAX", () => {
    // When coreCount <= MAX_CORE_VALUES (6), no warning box shown
    render(<BucketStep {...defaultProps} coreCount={4} />);
    expect(screen.queryByText(/You've marked quite a few/)).toBeNull();
  });
});
