/**
 * Tests for NarrowStep component
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import NarrowStep from "../NarrowStep";
import type { BucketItem } from "../../../hooks/useValuesDiscovery";

// Mock styles
jest.mock("../../../screens/styles/valuesDiscoveryStyles", () => ({
  styles: {
    container: {},
    header: {},
    title: {},
    subtitle: {},
    content: {},
    gridContent: {},
    grid: {},
    gridItem: {},
    gridItemSelected: {},
    gridItemText: {},
    gridItemTextSelected: {},
    footer: {},
    backButton: {},
    backButtonText: {},
    footerRight: {},
    selectionCount: {},
    continueButton: {},
    continueButtonDisabled: {},
    continueButtonText: {},
  },
}));

// Mock the MIN_CORE_VALUES constant
jest.mock("../../../hooks/useValuesDiscovery", () => ({
  MIN_CORE_VALUES: 3,
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

describe("NarrowStep", () => {
  const defaultCoreItems = [
    createMockBucketItem("p1", "Honesty matters"),
    createMockBucketItem("p2", "Family first"),
    createMockBucketItem("p3", "Growth mindset"),
    createMockBucketItem("p4", "Be creative"),
    createMockBucketItem("p5", "Help others"),
    createMockBucketItem("p6", "Stay curious"),
    createMockBucketItem("p7", "Work hard"),
  ];

  const defaultProps = {
    coreItems: defaultCoreItems,
    narrowedCore: new Set<string>(),
    onToggle: jest.fn(),
    onBack: jest.fn(),
    onContinue: jest.fn(),
    maxSelectable: 6,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders title with range", () => {
    render(<NarrowStep {...defaultProps} />);
    expect(screen.getByText("Choose 3–6 to anchor")).toBeTruthy();
  });

  it("renders instruction subtitle", () => {
    render(<NarrowStep {...defaultProps} />);
    expect(
      screen.getByText("Select the values most central to you right now"),
    ).toBeTruthy();
  });

  it("renders all core items", () => {
    render(<NarrowStep {...defaultProps} />);
    expect(screen.getByText("Honesty matters")).toBeTruthy();
    expect(screen.getByText("Family first")).toBeTruthy();
    expect(screen.getByText("Growth mindset")).toBeTruthy();
  });

  it("displays selection count", () => {
    const selections = new Set(["p1", "p2", "p3"]);
    render(<NarrowStep {...defaultProps} narrowedCore={selections} />);
    expect(screen.getByText("Selected: 3 of 3-6")).toBeTruthy();
  });

  it("calls onToggle when item tapped", () => {
    const onToggle = jest.fn();
    render(<NarrowStep {...defaultProps} onToggle={onToggle} />);
    fireEvent.press(screen.getByLabelText("Honesty matters"));
    expect(onToggle).toHaveBeenCalledWith("p1");
  });

  it("marks selected items", () => {
    const selections = new Set(["p1"]);
    render(<NarrowStep {...defaultProps} narrowedCore={selections} />);
    const item = screen.getByLabelText("Honesty matters");
    expect(item.props.accessibilityState.selected).toBe(true);
  });

  it("disables continue when selection below minimum", () => {
    const selections = new Set(["p1", "p2"]); // Only 2, need 3
    render(<NarrowStep {...defaultProps} narrowedCore={selections} />);
    const continueButton = screen.getByLabelText("Continue to review");
    expect(continueButton.props.accessibilityState.disabled).toBe(true);
  });

  it("enables continue when selection within range", () => {
    const selections = new Set(["p1", "p2", "p3"]); // Exactly 3
    render(<NarrowStep {...defaultProps} narrowedCore={selections} />);
    const continueButton = screen.getByLabelText("Continue to review");
    expect(continueButton.props.accessibilityState.disabled).toBe(false);
  });

  it("calls onContinue when continue pressed", () => {
    const selections = new Set(["p1", "p2", "p3"]);
    const onContinue = jest.fn();
    render(
      <NarrowStep
        {...defaultProps}
        narrowedCore={selections}
        onContinue={onContinue}
      />,
    );
    fireEvent.press(screen.getByLabelText("Continue to review"));
    expect(onContinue).toHaveBeenCalled();
  });

  it("renders back button", () => {
    render(<NarrowStep {...defaultProps} />);
    expect(screen.getByLabelText("Go back to bucketing")).toBeTruthy();
  });

  it("calls onBack when back pressed", () => {
    const onBack = jest.fn();
    render(<NarrowStep {...defaultProps} onBack={onBack} />);
    fireEvent.press(screen.getByLabelText("Go back to bucketing"));
    expect(onBack).toHaveBeenCalled();
  });
});
