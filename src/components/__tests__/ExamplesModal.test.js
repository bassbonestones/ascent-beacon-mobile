import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import ExamplesModal from "../priorities/ExamplesModal";

// Mock styles
jest.mock("../../screens/styles/prioritiesScreenStyles", () => ({
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

describe("ExamplesModal", () => {
  const mockOnClose = jest.fn();

  const sampleRuleExamples = {
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
    expect(getByText("Examples for Each Rule")).toBeTruthy();
  });

  it("renders close button with X", () => {
    const { getByText } = render(
      <ExamplesModal
        visible={true}
        ruleExamples={sampleRuleExamples}
        onClose={mockOnClose}
      />,
    );
    expect(getByText("✕")).toBeTruthy();
  });

  it("renders close button at bottom", () => {
    const { getByText } = render(
      <ExamplesModal
        visible={true}
        ruleExamples={sampleRuleExamples}
        onClose={mockOnClose}
      />,
    );
    expect(getByText("Close")).toBeTruthy();
  });

  it("renders rule titles from examples", () => {
    const { getByText } = render(
      <ExamplesModal
        visible={true}
        ruleExamples={sampleRuleExamples}
        onClose={mockOnClose}
      />,
    );
    expect(getByText("Personal Rule")).toBeTruthy();
    expect(getByText("Concrete Rule")).toBeTruthy();
  });

  it("renders good examples", () => {
    const { getByText } = render(
      <ExamplesModal
        visible={true}
        ruleExamples={sampleRuleExamples}
        onClose={mockOnClose}
      />,
    );
    expect(getByText('"Good example 1"')).toBeTruthy();
    expect(getByText('"Good example 2"')).toBeTruthy();
  });

  it("renders bad examples", () => {
    const { getByText } = render(
      <ExamplesModal
        visible={true}
        ruleExamples={sampleRuleExamples}
        onClose={mockOnClose}
      />,
    );
    expect(getByText('"Bad example 1"')).toBeTruthy();
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
    const emptyExamples = {
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
    expect(getByText("Personal Rule")).toBeTruthy();
    // No example text should be rendered
    expect(queryByText(/".*"/)).toBeNull();
  });

  it("handles multiple rules", () => {
    const manyRules = {
      rule1: { rule_title: "Rule One", good_examples: ["A"], bad_examples: [] },
      rule2: { rule_title: "Rule Two", good_examples: [], bad_examples: ["B"] },
      rule3: {
        rule_title: "Rule Three",
        good_examples: ["C"],
        bad_examples: ["D"],
      },
    };
    const { getByText } = render(
      <ExamplesModal
        visible={true}
        ruleExamples={manyRules}
        onClose={mockOnClose}
      />,
    );
    expect(getByText("Rule One")).toBeTruthy();
    expect(getByText("Rule Two")).toBeTruthy();
    expect(getByText("Rule Three")).toBeTruthy();
  });
});
