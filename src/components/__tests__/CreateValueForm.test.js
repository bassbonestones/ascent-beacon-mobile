import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import CreateValueForm from "../values/CreateValueForm";

// Mock styles
jest.mock("../../screens/styles/valuesManagementStyles", () => ({
  styles: {
    createSection: {},
    sectionTitle: {},
    input: {},
    examplesLink: {},
    examplesLinkText: {},
    createButton: {},
    createButtonDisabled: {},
    createButtonText: {},
    hint: {},
    backButtonStyled: {},
  },
}));

describe("CreateValueForm", () => {
  const defaultProps = {
    valuesCount: 0,
    newStatement: "",
    onChangeText: jest.fn(),
    onCreate: jest.fn(),
    onShowExamples: jest.fn(),
    onNavigateToDashboard: jest.fn(),
    isCreating: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders 'Create Your First Value' title when no values exist", () => {
    const { getByText } = render(
      <CreateValueForm {...defaultProps} valuesCount={0} />,
    );
    expect(getByText("Create Your First Value")).toBeTruthy();
  });

  it("renders 'Add Another Value' title when values exist", () => {
    const { getByText } = render(
      <CreateValueForm {...defaultProps} valuesCount={2} />,
    );
    expect(getByText("Add Another Value")).toBeTruthy();
  });

  it("renders text input with placeholder", () => {
    const { getByPlaceholderText } = render(
      <CreateValueForm {...defaultProps} />,
    );
    expect(getByPlaceholderText("I choose to...")).toBeTruthy();
  });

  it("calls onChangeText when input changes", () => {
    const { getByPlaceholderText } = render(
      <CreateValueForm {...defaultProps} />,
    );
    fireEvent.changeText(getByPlaceholderText("I choose to..."), "Be kind");
    expect(defaultProps.onChangeText).toHaveBeenCalledWith("Be kind");
  });

  it("displays current newStatement value", () => {
    const { getByPlaceholderText } = render(
      <CreateValueForm {...defaultProps} newStatement="My value" />,
    );
    const input = getByPlaceholderText("I choose to...");
    expect(input.props.value).toBe("My value");
  });

  it("renders See examples link", () => {
    const { getByText } = render(<CreateValueForm {...defaultProps} />);
    expect(getByText("See examples")).toBeTruthy();
  });

  it("calls onShowExamples when examples link is pressed", () => {
    const { getByLabelText } = render(<CreateValueForm {...defaultProps} />);
    fireEvent.press(getByLabelText("See example values"));
    expect(defaultProps.onShowExamples).toHaveBeenCalled();
  });

  it("renders 'Create Value' button for first value", () => {
    const { getByText } = render(
      <CreateValueForm {...defaultProps} valuesCount={0} />,
    );
    expect(getByText("Create Value")).toBeTruthy();
  });

  it("renders 'Add Value' button for subsequent values", () => {
    const { getByText } = render(
      <CreateValueForm {...defaultProps} valuesCount={2} />,
    );
    expect(getByText("Add Value")).toBeTruthy();
  });

  it("disables create button when newStatement is empty", () => {
    const { getByLabelText } = render(
      <CreateValueForm {...defaultProps} newStatement="" />,
    );
    const button = getByLabelText("Create value");
    expect(button.props.accessibilityState?.disabled).toBe(true);
  });

  it("disables create button when isCreating is true", () => {
    const { getByLabelText } = render(
      <CreateValueForm
        {...defaultProps}
        newStatement="Test"
        isCreating={true}
      />,
    );
    const button = getByLabelText("Create value");
    expect(button.props.accessibilityState?.disabled).toBe(true);
  });

  it("enables create button with valid statement", () => {
    const { getByLabelText } = render(
      <CreateValueForm {...defaultProps} newStatement="Valid statement" />,
    );
    const button = getByLabelText("Create value");
    expect(button.props.accessibilityState?.disabled).toBe(false);
  });

  it("calls onCreate when create button is pressed", () => {
    const { getByText } = render(
      <CreateValueForm {...defaultProps} newStatement="My value" />,
    );
    fireEvent.press(getByText("Create Value"));
    expect(defaultProps.onCreate).toHaveBeenCalled();
  });

  it("shows hint text when has minimum values and can add more", () => {
    const { getByText } = render(
      <CreateValueForm {...defaultProps} valuesCount={4} />,
    );
    expect(getByText(/You have 4 values/)).toBeTruthy();
    expect(getByText(/You can add up to 2 more/)).toBeTruthy();
  });

  it("does not show hint when less than minimum values", () => {
    const { queryByText } = render(
      <CreateValueForm {...defaultProps} valuesCount={2} />,
    );
    expect(queryByText(/You have 2 values/)).toBeNull();
  });

  it("renders back to dashboard button", () => {
    const { getByLabelText } = render(<CreateValueForm {...defaultProps} />);
    expect(getByLabelText("Back to dashboard")).toBeTruthy();
  });

  it("calls onNavigateToDashboard when back button is pressed", () => {
    const { getByLabelText } = render(<CreateValueForm {...defaultProps} />);
    fireEvent.press(getByLabelText("Back to dashboard"));
    expect(defaultProps.onNavigateToDashboard).toHaveBeenCalled();
  });

  it("shows loading indicator when isCreating", () => {
    const { queryByText, getByLabelText } = render(
      <CreateValueForm
        {...defaultProps}
        newStatement="Test"
        isCreating={true}
      />,
    );
    // Button text should be replaced with activity indicator
    expect(queryByText("Create Value")).toBeNull();
  });
});
