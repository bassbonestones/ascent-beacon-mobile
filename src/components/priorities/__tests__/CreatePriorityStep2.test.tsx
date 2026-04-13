import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import CreatePriorityStep2 from "../CreatePriorityStep2";
import type {
  PriorityFormData,
  ValidationFeedback,
  ValidationRules,
} from "../../../hooks/usePriorityForm";

// Mock styles
jest.mock("../../../screens/styles/prioritiesScreenStyles", () => ({
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

interface RuleExample {
  rule_title: string;
  good_examples: string[];
  bad_examples: string[];
}

// Test-specific props - only includes fields Step 2 uses
interface TestProps {
  formData: { why_matters: string };
  onWhyChange: (why: string) => void;
  validating?: boolean;
  validationFeedback: { why: string[] };
  validationRules: ValidationRules;
  ruleExamples: Record<string, RuleExample>;
  onShowExamples: () => void;
  onBack: () => void;
  onNext: () => void;
}

// Helper to render with proper full form data
const renderStep2 = (props: TestProps) => {
  const fullFormData: PriorityFormData = {
    title: "Test Priority",
    why_matters: props.formData.why_matters,
    score: 3,
    scope: "ongoing",
    cadence: "",
    constraints: "",
    value_ids: [],
  };
  const fullFeedback: ValidationFeedback = {
    name: [],
    why: props.validationFeedback.why,
  };
  return render(
    <CreatePriorityStep2
      formData={fullFormData}
      onWhyChange={props.onWhyChange}
      validating={props.validating}
      validationFeedback={fullFeedback}
      validationRules={props.validationRules}
      ruleExamples={props.ruleExamples}
      onShowExamples={props.onShowExamples}
      onBack={props.onBack}
      onNext={props.onNext}
    />,
  );
};

describe("CreatePriorityStep2", () => {
  const mockOnWhyChange = jest.fn();
  const mockOnShowExamples = jest.fn();
  const mockOnBack = jest.fn();
  const mockOnNext = jest.fn();

  const defaultProps: TestProps = {
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
    const { getByText } = renderStep2(defaultProps);
    expect(getByText("Step 2 of 4")).toBeOnTheScreen();
  });

  it("renders title", () => {
    const { getByText } = renderStep2(defaultProps);
    expect(getByText("Why This Matters")).toBeOnTheScreen();
  });

  it("renders subtitle", () => {
    const { getByText } = renderStep2(defaultProps);
    expect(getByText("Explain the meaning, not obligation")).toBeOnTheScreen();
  });

  it("renders input with placeholder", () => {
    const { getByPlaceholderText } = renderStep2(defaultProps);
    expect(getByPlaceholderText("Because I...")).toBeOnTheScreen();
  });

  it("displays current why_matters value", () => {
    const props = {
      ...defaultProps,
      formData: { why_matters: "It matters because..." },
    };
    const { getByLabelText } = renderStep2(props);
    const input = getByLabelText("Why this matters input");
    expect(input.props.value).toBe("It matters because...");
  });

  it("calls onWhyChange when input changes", () => {
    const { getByLabelText } = renderStep2(defaultProps);
    fireEvent.changeText(getByLabelText("Why this matters input"), "New text");
    expect(mockOnWhyChange).toHaveBeenCalledWith("New text");
  });

  it("renders all validation rules", () => {
    const { getByText } = renderStep2(defaultProps);
    expect(getByText("Personal - about you, not abstract ideas")).toBeOnTheScreen();
    expect(getByText("Meaning-based - not obligation or guilt")).toBeOnTheScreen();
    expect(
      getByText("Implies protection - why it needs protecting"),
    ).toBeOnTheScreen();
    expect(getByText("Concrete - guides your decisions")).toBeOnTheScreen();
  });

  it("shows unchecked indicators for unmet rules", () => {
    const { getAllByText } = renderStep2(defaultProps);
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
    const { getAllByText } = renderStep2(props);
    const checked = getAllByText("✓");
    expect(checked.length).toBe(2);
  });

  it("shows loading indicator when validating", () => {
    const props = { ...defaultProps, validating: true };
    const { getByLabelText } = renderStep2(props);
    expect(getByLabelText("Validating input")).toBeOnTheScreen();
  });

  it("renders validation feedback messages", () => {
    const props = {
      ...defaultProps,
      validationFeedback: { why: ["Feedback 1", "Feedback 2"] },
    };
    const { getByText } = renderStep2(props);
    expect(getByText("• Feedback 1")).toBeOnTheScreen();
    expect(getByText("• Feedback 2")).toBeOnTheScreen();
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
    const { getByLabelText } = renderStep2(props);
    expect(getByLabelText("See examples")).toBeOnTheScreen();
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
    const { getByLabelText } = renderStep2(props);
    fireEvent.press(getByLabelText("See examples"));
    expect(mockOnShowExamples).toHaveBeenCalled();
  });

  it("renders Back button", () => {
    const { getByText } = renderStep2(defaultProps);
    expect(getByText("Back")).toBeOnTheScreen();
  });

  it("renders Next button", () => {
    const { getByText } = renderStep2(defaultProps);
    expect(getByText("Next")).toBeOnTheScreen();
  });

  it("calls onBack when Back button pressed", () => {
    const { getByLabelText } = renderStep2(defaultProps);
    fireEvent.press(getByLabelText("Go back"));
    expect(mockOnBack).toHaveBeenCalled();
  });
});
