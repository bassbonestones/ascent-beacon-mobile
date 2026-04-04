/**
 * Tests for SelectStep component
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import SelectStep from "../SelectStep";
import type { DiscoveryPrompt } from "../../../types";

// Mock styles
jest.mock("../../../screens/styles/valuesDiscoveryStyles", () => ({
  styles: {
    container: {},
    header: {},
    title: {},
    subtitle: {},
    progressDots: {},
    progressDot: {},
    progressDotActive: {},
    progressDotComplete: {},
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
    continueButtonText: {},
  },
}));

// Mock the LENSES constant
jest.mock("../../../hooks/useValuesDiscovery", () => ({
  LENSES: ["Identity", "Growth", "Relationships", "Purpose"],
}));

// Helper to create mock prompt
const createMockPrompt = (id: string, text: string): DiscoveryPrompt => ({
  id,
  prompt_text: text,
  lens: "Identity",
  weight: 1,
});

describe("SelectStep", () => {
  const defaultProps = {
    currentLensIndex: 0,
    currentPage: 1,
    totalPages: 5,
    visiblePrompts: [
      createMockPrompt("p1", "I value honesty"),
      createMockPrompt("p2", "I value creativity"),
    ],
    selections: new Set<string>(),
    onToggle: jest.fn(),
    onBack: jest.fn(),
    onContinue: jest.fn(),
    canGoBack: false,
    isLastPage: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders current lens title", () => {
    render(<SelectStep {...defaultProps} />);
    expect(screen.getByText("Identity")).toBeTruthy();
  });

  it("renders instruction text", () => {
    render(<SelectStep {...defaultProps} />);
    expect(
      screen.getByText("Tap anything that resonates. No limit."),
    ).toBeTruthy();
  });

  it("renders all prompts", () => {
    render(<SelectStep {...defaultProps} />);
    expect(screen.getByText("I value honesty")).toBeTruthy();
    expect(screen.getByText("I value creativity")).toBeTruthy();
  });

  it("renders selection count", () => {
    render(<SelectStep {...defaultProps} />);
    expect(screen.getByText("Selected: 0")).toBeTruthy();
  });

  it("updates selection count when selections change", () => {
    const selections = new Set(["p1", "p2"]);
    render(<SelectStep {...defaultProps} selections={selections} />);
    expect(screen.getByText("Selected: 2")).toBeTruthy();
  });

  it("calls onToggle when prompt tapped", () => {
    const onToggle = jest.fn();
    render(<SelectStep {...defaultProps} onToggle={onToggle} />);
    fireEvent.press(screen.getByLabelText("I value honesty"));
    expect(onToggle).toHaveBeenCalledWith("p1");
  });

  it("marks selected prompts", () => {
    const selections = new Set(["p1"]);
    render(<SelectStep {...defaultProps} selections={selections} />);
    const selectedPrompt = screen.getByLabelText("I value honesty");
    expect(selectedPrompt.props.accessibilityState.selected).toBe(true);
  });

  it("renders Next button when not last page", () => {
    render(<SelectStep {...defaultProps} isLastPage={false} />);
    expect(screen.getByLabelText("Next page")).toBeTruthy();
    expect(screen.getByText("Next")).toBeTruthy();
  });

  it("renders Continue button on last page", () => {
    render(<SelectStep {...defaultProps} isLastPage={true} />);
    expect(screen.getByLabelText("Continue to bucketing")).toBeTruthy();
    expect(screen.getByText("Continue")).toBeTruthy();
  });

  it("calls onContinue when continue/next pressed", () => {
    const onContinue = jest.fn();
    render(<SelectStep {...defaultProps} onContinue={onContinue} />);
    fireEvent.press(screen.getByLabelText("Next page"));
    expect(onContinue).toHaveBeenCalled();
  });

  it("does not render back button when canGoBack is false", () => {
    render(<SelectStep {...defaultProps} canGoBack={false} />);
    expect(screen.queryByLabelText("Go back")).toBeNull();
  });

  it("renders back button when canGoBack is true", () => {
    render(<SelectStep {...defaultProps} canGoBack={true} />);
    expect(screen.getByLabelText("Go back")).toBeTruthy();
  });

  it("calls onBack when back button pressed", () => {
    const onBack = jest.fn();
    render(<SelectStep {...defaultProps} canGoBack={true} onBack={onBack} />);
    fireEvent.press(screen.getByLabelText("Go back"));
    expect(onBack).toHaveBeenCalled();
  });

  it("renders progress dots for each lens", () => {
    render(<SelectStep {...defaultProps} />);
    expect(screen.getByLabelText("Lens 1 of 4")).toBeTruthy();
  });

  it("renders different lens title for different index", () => {
    render(<SelectStep {...defaultProps} currentLensIndex={2} />);
    expect(screen.getByText("Relationships")).toBeTruthy();
  });
});
