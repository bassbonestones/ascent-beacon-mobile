import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import ExamplesModal from "../ExamplesModal";

// Mock styles
jest.mock("../../../screens/styles/prioritiesScreenStyles", () => ({
  styles: {
    modalOverlay: {},
    modalContent: {},
    modalHeader: {},
    modalTitle: {},
    modalCloseX: {},
    examplesContainer: {},
    ruleExampleCard: {},
    ruleExampleTitle: {},
    exampleSection: {},
    exampleLabel: {},
    goodExample: {},
    badExample: {},
    modalCloseButton: {},
    modalCloseButtonText: {},
  },
}));

interface RuleExample {
  rule_title: string;
  good_examples: string[];
  bad_examples: string[];
}

interface ExamplesModalProps {
  visible: boolean;
  ruleExamples: Record<string, RuleExample>;
  onClose: () => void;
}

describe("ExamplesModal", () => {
  const mockOnClose = jest.fn();

  const sampleRuleExamples: Record<string, RuleExample> = {
    personal: {
      rule_title: "Personal Rule",
      good_examples: ["Good example 1", "Good example 2"],
      bad_examples: ["Bad example 1"],
    },
    concrete: {
      rule_title: "Concrete Rule",
      good_examples: ["Another good example"],
      bad_examples: ["Another bad example"],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders modal title", () => {
    const { getByText } = render(
      <ExamplesModal
        visible={true}
        ruleExamples={sampleRuleExamples}
        onClose={mockOnClose}
      />,
    );
    expect(getByText("Examples for Each Rule")).toBeOnTheScreen();
  });

  it("renders close button with X", () => {
    const { getByText } = render(
      <ExamplesModal
        visible={true}
        ruleExamples={sampleRuleExamples}
        onClose={mockOnClose}
      />,
    );
    expect(getByText("✕")).toBeOnTheScreen();
  });

  it("renders close button at bottom", () => {
    const { getByText } = render(
      <ExamplesModal
        visible={true}
        ruleExamples={sampleRuleExamples}
        onClose={mockOnClose}
      />,
    );
    expect(getByText("Close")).toBeOnTheScreen();
  });

  it("renders rule titles from examples", () => {
    const { getByText } = render(
      <ExamplesModal
        visible={true}
        ruleExamples={sampleRuleExamples}
        onClose={mockOnClose}
      />,
    );
    expect(getByText("Personal Rule")).toBeOnTheScreen();
    expect(getByText("Concrete Rule")).toBeOnTheScreen();
  });

  it("renders good examples", () => {
    const { getByText } = render(
      <ExamplesModal
        visible={true}
        ruleExamples={sampleRuleExamples}
        onClose={mockOnClose}
      />,
    );
    expect(getByText('"Good example 1"')).toBeOnTheScreen();
    expect(getByText('"Good example 2"')).toBeOnTheScreen();
  });

  it("renders bad examples", () => {
    const { getByText } = render(
      <ExamplesModal
        visible={true}
        ruleExamples={sampleRuleExamples}
        onClose={mockOnClose}
      />,
    );
    expect(getByText('"Bad example 1"')).toBeOnTheScreen();
  });

  it("calls onClose when X button pressed", () => {
    const { getByText } = render(
      <ExamplesModal
        visible={true}
        ruleExamples={sampleRuleExamples}
        onClose={mockOnClose}
      />,
    );
    fireEvent.press(getByText("✕"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("calls onClose when Close button pressed", () => {
    const { getByText } = render(
      <ExamplesModal
        visible={true}
        ruleExamples={sampleRuleExamples}
        onClose={mockOnClose}
      />,
    );
    fireEvent.press(getByText("Close"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("renders empty state when no examples", () => {
    const emptyExamples: Record<string, RuleExample> = {
      personal: {
        rule_title: "Personal Rule",
        good_examples: [],
        bad_examples: [],
      },
    };
    const { getByText, queryByText } = render(
      <ExamplesModal
        visible={true}
        ruleExamples={emptyExamples}
        onClose={mockOnClose}
      />,
    );
    expect(getByText("Personal Rule")).toBeOnTheScreen();
  });
});
