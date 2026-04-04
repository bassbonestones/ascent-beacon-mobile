import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import CreatePriorityStep2 from "../priorities/CreatePriorityStep2";

// Mock styles
jest.mock("../../screens/styles/prioritiesScreenStyles", () => ({
  styles: {
    container: {},
    header: {},
    stepNumber: {},
    title: {},
    subtitle: {},
    content: {},
    formSection: {},
    label: {},
    rulesBox: {},
    rulesTitle: {},
    ruleItem: {},
    ruleItemPassed: {},
    ruleCheck: {},
    ruleText: {},
    input: {},
    largeInput: {},
    feedbackBox: {},
    feedbackText: {},
    examplesButton: {},
    examplesButtonText: {},
    formButtons: {},
    cancelButton: {},
    cancelButtonText: {},
    nextButton: {},
    nextButtonDisabled: {},
    nextButtonText: {},
  },
}));

describe("CreatePriorityStep2", () => {
  const mockOnWhyChange = jest.fn();
  const mockOnShowExamples = jest.fn();
  const mockOnBack = jest.fn();
  const mockOnNext = jest.fn();

  const defaultProps = {
    formData: { why_matters: "" },
    onWhyChange: mockOnWhyChange,
    validating: false,
    validationFeedback: { why: [] },
    validationRules: {
      personal: false,
      meaning_based: false,
      implies_protection: false,
      concrete: false,
    },
    ruleExamples: {},
    onShowExamples: mockOnShowExamples,
    onBack: mockOnBack,
    onNext: mockOnNext,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders step number", () => {
    const { getByText } = render(<CreatePriorityStep2 {...defaultProps} />);
    expect(getByText("Step 2 of 4")).toBeTruthy();
  });

  it("renders title", () => {
    const { getByText } = render(<CreatePriorityStep2 {...defaultProps} />);
    expect(getByText("Why This Matters")).toBeTruthy();
  });

  it("renders subtitle", () => {
    const { getByText } = render(<CreatePriorityStep2 {...defaultProps} />);
    expect(getByText("Explain the meaning, not obligation")).toBeTruthy();
  });

  it("renders input with placeholder", () => {
    const { getByPlaceholderText } = render(
      <CreatePriorityStep2 {...defaultProps} />,
    );
    expect(getByPlaceholderText("Because I...")).toBeTruthy();
  });

  it("displays current why_matters value", () => {
    const props = {
      ...defaultProps,
      formData: { why_matters: "It matters because..." },
    };
    const { getByLabelText } = render(<CreatePriorityStep2 {...props} />);
    const input = getByLabelText("Why this matters input");
    expect(input.props.value).toBe("It matters because...");
  });

  it("calls onWhyChange when input changes", () => {
    const { getByLabelText } = render(
      <CreatePriorityStep2 {...defaultProps} />,
    );
    fireEvent.changeText(getByLabelText("Why this matters input"), "New text");
    expect(mockOnWhyChange).toHaveBeenCalledWith("New text");
  });

  it("renders all validation rules", () => {
    const { getByText } = render(<CreatePriorityStep2 {...defaultProps} />);
    expect(getByText("Personal - about you, not abstract ideas")).toBeTruthy();
    expect(getByText("Meaning-based - not obligation or guilt")).toBeTruthy();
    expect(
      getByText("Implies protection - why it needs protecting"),
    ).toBeTruthy();
    expect(getByText("Concrete - guides your decisions")).toBeTruthy();
  });

  it("shows unchecked indicators for unmet rules", () => {
    const { getAllByText } = render(<CreatePriorityStep2 {...defaultProps} />);
    const unchecked = getAllByText("○");
    expect(unchecked.length).toBe(4);
  });

  it("shows checked indicator for passed rules", () => {
    const props = {
      ...defaultProps,
      validationRules: {
        personal: true,
        meaning_based: true,
        implies_protection: false,
        concrete: false,
      },
    };
    const { getAllByText } = render(<CreatePriorityStep2 {...props} />);
    const checked = getAllByText("✓");
    expect(checked.length).toBe(2);
  });

  it("shows loading indicator when validating", () => {
    const props = { ...defaultProps, validating: true };
    const { getByLabelText } = render(<CreatePriorityStep2 {...props} />);
    expect(getByLabelText("Validating input")).toBeTruthy();
  });

  it("renders validation feedback messages", () => {
    const props = {
      ...defaultProps,
      validationFeedback: { why: ["Feedback 1", "Feedback 2"] },
    };
    const { getByText } = render(<CreatePriorityStep2 {...props} />);
    expect(getByText("• Feedback 1")).toBeTruthy();
    expect(getByText("• Feedback 2")).toBeTruthy();
  });

  it("shows examples button when feedback and examples exist", () => {
    const props = {
      ...defaultProps,
      validationFeedback: { why: ["Some feedback"] },
      ruleExamples: {
        personal: {
          rule_title: "Personal",
          good_examples: [],
          bad_examples: [],
        },
      },
    };
    const { getByLabelText } = render(<CreatePriorityStep2 {...props} />);
    expect(getByLabelText("See examples")).toBeTruthy();
  });

  it("calls onShowExamples when examples button pressed", () => {
    const props = {
      ...defaultProps,
      validationFeedback: { why: ["Some feedback"] },
      ruleExamples: {
        personal: {
          rule_title: "Personal",
          good_examples: [],
          bad_examples: [],
        },
      },
    };
    const { getByLabelText } = render(<CreatePriorityStep2 {...props} />);
    fireEvent.press(getByLabelText("See examples"));
    expect(mockOnShowExamples).toHaveBeenCalled();
  });

  it("renders Back button", () => {
    const { getByText } = render(<CreatePriorityStep2 {...defaultProps} />);
    expect(getByText("Back")).toBeTruthy();
  });

  it("renders Next button", () => {
    const { getByText } = render(<CreatePriorityStep2 {...defaultProps} />);
    expect(getByText("Next")).toBeTruthy();
  });

  it("calls onBack when Back button pressed", () => {
    const { getByLabelText } = render(
      <CreatePriorityStep2 {...defaultProps} />,
    );
    fireEvent.press(getByLabelText("Go back"));
    expect(mockOnBack).toHaveBeenCalled();
  });

  it("disables Next button when why_matters is empty", () => {
    const { getByLabelText } = render(
      <CreatePriorityStep2 {...defaultProps} />,
    );
    const nextBtn = getByLabelText("Next step");
    expect(nextBtn.props.accessibilityState?.disabled).toBe(true);
  });

  it("disables Next button when validation feedback has errors", () => {
    const props = {
      ...defaultProps,
      formData: { why_matters: "Something" },
      validationFeedback: { why: ["Error message"] },
    };
    const { getByLabelText } = render(<CreatePriorityStep2 {...props} />);
    const nextBtn = getByLabelText("Next step");
    expect(nextBtn.props.accessibilityState?.disabled).toBe(true);
  });

  it("enables Next button when valid input with no errors", () => {
    const props = {
      ...defaultProps,
      formData: { why_matters: "Valid explanation" },
      validationFeedback: { why: [] },
    };
    const { getByLabelText } = render(<CreatePriorityStep2 {...props} />);
    const nextBtn = getByLabelText("Next step");
    expect(nextBtn.props.accessibilityState?.disabled).toBe(false);
  });

  it("calls onNext when Next button pressed", () => {
    const props = {
      ...defaultProps,
      formData: { why_matters: "Valid explanation" },
    };
    const { getByLabelText } = render(<CreatePriorityStep2 {...props} />);
    fireEvent.press(getByLabelText("Next step"));
    expect(mockOnNext).toHaveBeenCalled();
  });
});
