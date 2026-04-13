import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import EditValueModal from "../EditValueModal";

// Mock styles
jest.mock("../../../screens/styles/valuesManagementStyles", () => ({
  styles: {
    editModalContainer: {},
    modalHeader: {},
    modalTitle: {},
    modalCloseButton: {},
    modalCloseText: {},
    modalContent: {},
    editModalContent: {},
    editInput: {},
    editSaveButton: {},
    editSaveButtonDisabled: {},
    editSaveButtonText: {},
  },
}));

interface EditValueModalProps {
  visible: boolean;
  statement: string;
  onChangeStatement: (statement: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

describe("EditValueModal", () => {
  const defaultProps: EditValueModalProps = {
    visible: true,
    statement: "Test statement",
    onChangeStatement: jest.fn(),
    onSave: jest.fn(),
    onCancel: jest.fn(),
    isSaving: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders modal with title", () => {
    const { getByText } = render(<EditValueModal {...defaultProps} />);
    expect(getByText("Edit Value")).toBeOnTheScreen();
  });

  it("renders cancel button", () => {
    const { getByText } = render(<EditValueModal {...defaultProps} />);
    expect(getByText("Cancel")).toBeOnTheScreen();
  });

  it("calls onCancel when cancel button is pressed", () => {
    const { getByLabelText } = render(<EditValueModal {...defaultProps} />);
    fireEvent.press(getByLabelText("Cancel editing"));
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it("renders text input with current statement", () => {
    const { getByLabelText } = render(<EditValueModal {...defaultProps} />);
    const input = getByLabelText("Edit value statement");
    expect(input.props.value).toBe("Test statement");
  });

  it("calls onChangeStatement when input changes", () => {
    const { getByLabelText } = render(<EditValueModal {...defaultProps} />);
    fireEvent.changeText(getByLabelText("Edit value statement"), "Updated");
    expect(defaultProps.onChangeStatement).toHaveBeenCalledWith("Updated");
  });

  it("renders Save Changes button", () => {
    const { getByText } = render(<EditValueModal {...defaultProps} />);
    expect(getByText("Save Changes")).toBeOnTheScreen();
  });

  it("calls onSave when save button is pressed", () => {
    const { getByLabelText } = render(<EditValueModal {...defaultProps} />);
    fireEvent.press(getByLabelText("Save changes"));
    expect(defaultProps.onSave).toHaveBeenCalled();
  });

  it("disables save button when isSaving is true", () => {
    const { getByLabelText } = render(
      <EditValueModal {...defaultProps} isSaving={true} />,
    );
    const button = getByLabelText("Save changes");
    expect(button.props.accessibilityState?.disabled).toBe(true);
  });

  it("disables save button when statement is empty", () => {
    const { getByLabelText } = render(
      <EditValueModal {...defaultProps} statement="" />,
    );
    const button = getByLabelText("Save changes");
    expect(button.props.accessibilityState?.disabled).toBe(true);
  });

  it("shows loading indicator when isSaving", () => {
    const { queryByText } = render(
      <EditValueModal {...defaultProps} isSaving={true} />,
    );
    expect(queryByText("Save Changes")).toBeNull();
  });

  it("renders placeholder text", () => {
    const { getByPlaceholderText } = render(
      <EditValueModal {...defaultProps} statement="" />,
    );
    expect(getByPlaceholderText("Edit your value statement...")).toBeOnTheScreen();
  });
});
