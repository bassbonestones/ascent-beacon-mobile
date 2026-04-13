import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import CreatePriorityReview from "../CreatePriorityReview";
import type { Value } from "../../../types";

// Mock styles
jest.mock("../../../screens/styles/prioritiesScreenStyles", () => ({
  styles: {
    container: {},
    header: {},
    stepNumber: {},
    title: {},
    content: {},
    reviewSection: {},
    reviewLabel: {},
    reviewValue: {},
    valuesList: {},
    reviewValueItem: {},
    reviewValueText: {},
    formButtons: {},
    cancelButton: {},
    cancelButtonText: {},
    nextButton: {},
    nextButtonDisabled: {},
    nextButtonText: {},
  },
  SCOPES: [
    { value: "life", label: "Life-wide" },
    { value: "work", label: "Work" },
    { value: "personal", label: "Personal" },
  ],
}));

// Test-specific interface allowing null score for edge case testing
interface TestFormData {
  title: string;
  why_matters: string;
  scope: string;
  score: number | null;
  cadence: string;
  constraints: string;
}

interface TestProps {
  formData: TestFormData;
  values: Partial<Value>[];
  selectedValues: Set<string>;
  isEditMode?: boolean;
  loading?: boolean;
  onBack: () => void;
  onSubmit: () => void;
}

// Helper to render with test props (allows null score for runtime edge case testing)
const renderReview = (props: TestProps) => {
  // @ts-expect-error - Testing runtime behavior with potentially null formData.score
  return render(<CreatePriorityReview {...props} />);
};

describe("CreatePriorityReview", () => {
  const mockOnBack = jest.fn();
  const mockOnSubmit = jest.fn();

  const sampleValues: Partial<Value>[] = [
    { id: "v1", revisions: [{ statement: "Family first" }] as any },
    { id: "v2", revisions: [{ statement: "Health matters" }] as any },
  ];

  const defaultProps: TestProps = {
    formData: {
      title: "Test Priority",
      why_matters: "Because it matters to me",
      scope: "life",
      score: 3,
      cadence: "Weekly",
      constraints: "Time limited",
    },
    values: sampleValues,
    selectedValues: new Set(["v1"]),
    isEditMode: false,
    loading: false,
    onBack: mockOnBack,
    onSubmit: mockOnSubmit,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders Review step header", () => {
    const { getByText } = renderReview(defaultProps);
    expect(getByText("Review")).toBeOnTheScreen();
  });

  it("renders Confirm Priority title", () => {
    const { getByText } = renderReview(defaultProps);
    expect(getByText("Confirm Priority")).toBeOnTheScreen();
  });

  it("renders priority name", () => {
    const { getByText } = renderReview(defaultProps);
    expect(getByText("Test Priority")).toBeOnTheScreen();
  });

  it("shows (not set) when title is empty", () => {
    const props = {
      ...defaultProps,
      formData: { ...defaultProps.formData, title: "" },
    };
    const { getAllByText } = renderReview(props);
    expect(getAllByText("(not set)").length).toBeGreaterThan(0);
  });

  it("renders why_matters value", () => {
    const { getByText } = renderReview(defaultProps);
    expect(getByText("Because it matters to me")).toBeOnTheScreen();
  });

  it("shows (not set) when why_matters is empty", () => {
    const props = {
      ...defaultProps,
      formData: { ...defaultProps.formData, why_matters: "" },
    };
    const { getAllByText } = renderReview(props);
    expect(getAllByText("(not set)").length).toBeGreaterThan(0);
  });

  it("renders scope label", () => {
    const { getByText } = renderReview(defaultProps);
    expect(getByText("Life-wide")).toBeOnTheScreen();
  });

  it("renders unknown scope value as string", () => {
    const props = {
      ...defaultProps,
      formData: { ...defaultProps.formData, scope: "custom" },
    };
    const { getByText } = renderReview(props);
    expect(getByText("custom")).toBeOnTheScreen();
  });

  it("renders importance score", () => {
    const { getByText } = renderReview(defaultProps);
    expect(getByText("3/5")).toBeOnTheScreen();
  });

  it("shows (not set) when score is empty", () => {
    const props = {
      ...defaultProps,
      formData: { ...defaultProps.formData, score: null },
    };
    const { getAllByText } = renderReview(props);
    expect(getAllByText("(not set)").length).toBeGreaterThan(0);
  });

  it("renders cadence when provided", () => {
    const { getByText } = renderReview(defaultProps);
    expect(getByText("Weekly")).toBeOnTheScreen();
  });

  it("does not render cadence section when empty", () => {
    const props = {
      ...defaultProps,
      formData: { ...defaultProps.formData, cadence: "" },
    };
    const { queryByText } = renderReview(props);
    expect(queryByText("Weekly")).toBeNull();
  });

  it("renders constraints when provided", () => {
    const { getByText } = renderReview(defaultProps);
    expect(getByText("Time limited")).toBeOnTheScreen();
  });

  it("does not render constraints section when empty", () => {
    const props = {
      ...defaultProps,
      formData: { ...defaultProps.formData, constraints: "" },
    };
    const { queryByText } = renderReview(props);
    expect(queryByText("Time limited")).toBeNull();
  });

  it("renders linked values", () => {
    const { getByText } = renderReview(defaultProps);
    expect(getByText("• Family first")).toBeOnTheScreen();
  });

  it("shows no values message when none selected", () => {
    const props = { ...defaultProps, selectedValues: new Set<string>() };
    const { getByText } = renderReview(props);
    expect(getByText("No values selected")).toBeOnTheScreen();
  });

  it("renders Back button", () => {
    const { getByText } = renderReview(defaultProps);
    expect(getByText("Back")).toBeOnTheScreen();
  });

  it("renders Create Priority button in create mode", () => {
    const { getByText } = renderReview(defaultProps);
    expect(getByText("Create Priority")).toBeOnTheScreen();
  });

  it("renders Update Priority button in edit mode", () => {
    const props = { ...defaultProps, isEditMode: true };
    const { getByText } = renderReview(props);
    expect(getByText("Update Priority")).toBeOnTheScreen();
  });

  it("shows Creating... text when loading in create mode", () => {
    const props = { ...defaultProps, loading: true };
    const { getByText } = renderReview(props);
    expect(getByText("Creating...")).toBeOnTheScreen();
  });

  it("shows Updating... text when loading in edit mode", () => {
    const props = { ...defaultProps, isEditMode: true, loading: true };
    const { getByText } = renderReview(props);
    expect(getByText("Updating...")).toBeOnTheScreen();
  });
});
