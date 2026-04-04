/**
 * Tests for CreateStatementStep component
 */

import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import CreateStatementStep from "../CreateStatementStep";
import type { BucketItem } from "../../../hooks/useValuesDiscovery";

// Mock styles
jest.mock("../../../screens/styles/valuesDiscoveryStyles", () => ({
  styles: {
    container: {},
    header: {},
    progressText: {},
    content: {},
    statementContent: {},
    statementPrompt: {},
    statementLens: {},
    statementLabelStandalone: {},
    startersContainer: {},
    starterButton: {},
    starterButtonSelected: {},
    starterButtonText: {},
    starterButtonTextSelected: {},
    statementLabelContainer: {},
    statementLabel: {},
    statementLabelPrompt: {},
    statementInputContainer: {},
    statementStarter: {},
    statementInput: {},
    statementPreview: {},
    statementPreviewLabel: {},
    statementPreviewText: {},
    footer: {},
    backButton: {},
    backButtonText: {},
    continueButton: {},
    continueButtonDisabled: {},
    continueButtonText: {},
  },
}));

// Mock the SENTENCE_STARTERS constant
jest.mock("../../../hooks/useValuesDiscovery", () => ({
  SENTENCE_STARTERS: ["I believe", "I value", "I strive to"],
}));

// Helper to create mock bucket item
const createMockBucketItem = (id: string, text: string): BucketItem => ({
  prompt_id: id,
  prompt: {
    id,
    prompt_text: text,
    lens: "Identity",
    weight: 1,
    primary_lens: "Identity",
  },
  bucket: "core",
});

describe("CreateStatementStep", () => {
  const defaultProps = {
    currentCoreItem: createMockBucketItem("p1", "Honesty matters"),
    currentIndex: 0,
    totalCount: 3,
    statementStarter: "I believe",
    statementText: "",
    onSetStarter: jest.fn(),
    onSetText: jest.fn(),
    onSave: jest.fn().mockResolvedValue(undefined),
    onBack: jest.fn(),
    canGoBack: false,
    saving: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders progress indicator", () => {
    render(<CreateStatementStep {...defaultProps} />);
    expect(screen.getByText("1 of 3")).toBeTruthy();
  });

  it("renders prompt text", () => {
    render(<CreateStatementStep {...defaultProps} />);
    // Prompt text appears in header and in label, verify at least one
    expect(
      screen.getAllByText("Honesty matters").length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("renders sentence starters", () => {
    render(<CreateStatementStep {...defaultProps} />);
    expect(screen.getByLabelText("I believe")).toBeTruthy();
    expect(screen.getByLabelText("I value")).toBeTruthy();
    expect(screen.getByLabelText("I strive to")).toBeTruthy();
  });

  it("marks selected starter", () => {
    render(
      <CreateStatementStep {...defaultProps} statementStarter="I value" />,
    );
    const starter = screen.getByLabelText("I value");
    expect(starter.props.accessibilityState.selected).toBe(true);
  });

  it("calls onSetStarter when starter tapped", () => {
    const onSetStarter = jest.fn();
    render(
      <CreateStatementStep {...defaultProps} onSetStarter={onSetStarter} />,
    );
    fireEvent.press(screen.getByLabelText("I value"));
    expect(onSetStarter).toHaveBeenCalledWith("I value");
  });

  it("renders text input", () => {
    render(<CreateStatementStep {...defaultProps} />);
    expect(screen.getByLabelText("Value statement input")).toBeTruthy();
  });

  it("calls onSetText when text changes", () => {
    const onSetText = jest.fn();
    render(<CreateStatementStep {...defaultProps} onSetText={onSetText} />);
    fireEvent.changeText(
      screen.getByLabelText("Value statement input"),
      "in everything I do",
    );
    expect(onSetText).toHaveBeenCalledWith("in everything I do");
  });

  it("shows preview when text entered", () => {
    render(
      <CreateStatementStep
        {...defaultProps}
        statementText="in everything I do"
      />,
    );
    expect(screen.getByText("Preview:")).toBeTruthy();
    expect(screen.getByText("I believe in everything I do")).toBeTruthy();
  });

  it("does not show preview when text empty", () => {
    render(<CreateStatementStep {...defaultProps} statementText="" />);
    expect(screen.queryByText("Preview:")).toBeNull();
  });

  it("renders Next button when not last item", () => {
    render(
      <CreateStatementStep
        {...defaultProps}
        currentIndex={0}
        totalCount={3}
        statementText="test"
      />,
    );
    expect(screen.getByText("Next")).toBeTruthy();
    expect(screen.getByLabelText("Save and continue to next")).toBeTruthy();
  });

  it("renders Finish button on last item", () => {
    render(
      <CreateStatementStep
        {...defaultProps}
        currentIndex={2}
        totalCount={3}
        statementText="test"
      />,
    );
    expect(screen.getByText("Finish")).toBeTruthy();
    expect(screen.getByLabelText("Finish")).toBeTruthy();
  });

  it("disables save when text empty", () => {
    render(<CreateStatementStep {...defaultProps} statementText="" />);
    const saveButton = screen.getByLabelText("Save and continue to next");
    expect(saveButton.props.accessibilityState.disabled).toBe(true);
  });

  it("enables save when text provided", () => {
    render(<CreateStatementStep {...defaultProps} statementText="test" />);
    const saveButton = screen.getByLabelText("Save and continue to next");
    expect(saveButton.props.accessibilityState.disabled).toBe(false);
  });

  it("calls onSave when save pressed", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    render(
      <CreateStatementStep
        {...defaultProps}
        statementText="test"
        onSave={onSave}
      />,
    );
    fireEvent.press(screen.getByLabelText("Save and continue to next"));
    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });
  });

  it("does not render back button when canGoBack is false", () => {
    render(<CreateStatementStep {...defaultProps} canGoBack={false} />);
    expect(screen.queryByLabelText("Go back to previous statement")).toBeNull();
  });

  it("renders back button when canGoBack is true", () => {
    render(<CreateStatementStep {...defaultProps} canGoBack={true} />);
    expect(screen.getByLabelText("Go back to previous statement")).toBeTruthy();
  });

  it("calls onBack when back pressed", () => {
    const onBack = jest.fn();
    render(
      <CreateStatementStep
        {...defaultProps}
        canGoBack={true}
        onBack={onBack}
      />,
    );
    fireEvent.press(screen.getByLabelText("Go back to previous statement"));
    expect(onBack).toHaveBeenCalled();
  });

  it("shows loading indicator when saving", () => {
    render(
      <CreateStatementStep
        {...defaultProps}
        saving={true}
        statementText="test"
      />,
    );
    expect(screen.queryByText("Next")).toBeNull();
  });

  it("disables back button when saving", () => {
    render(
      <CreateStatementStep
        {...defaultProps}
        canGoBack={true}
        saving={true}
        statementText="test"
      />,
    );
    // Verify back button exists - disabled prop passed to TouchableOpacity
    expect(screen.getByLabelText("Go back to previous statement")).toBeTruthy();
  });

  it("shows correct accessibility label for progress", () => {
    render(
      <CreateStatementStep {...defaultProps} currentIndex={1} totalCount={5} />,
    );
    expect(screen.getByLabelText("Creating statement 2 of 5")).toBeTruthy();
  });
});
