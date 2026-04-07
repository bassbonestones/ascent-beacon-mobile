/**
 * Tests for OptionModal component
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { OptionModal } from "../OptionModal";

describe("OptionModal", () => {
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders title and message when visible", () => {
    render(
      <OptionModal
        visible={true}
        title="Test Title"
        message="Test message"
        buttons={[]}
        onDismiss={mockOnDismiss}
      />,
    );

    expect(screen.getByText("Test Title")).toBeTruthy();
    expect(screen.getByText("Test message")).toBeTruthy();
  });

  it("does not render when not visible", () => {
    render(
      <OptionModal
        visible={false}
        title="Test Title"
        message="Test message"
        buttons={[]}
        onDismiss={mockOnDismiss}
      />,
    );

    expect(screen.queryByText("Test Title")).toBeNull();
  });

  it("renders all buttons", () => {
    render(
      <OptionModal
        visible={true}
        title="Test"
        buttons={[
          { label: "Cancel", onPress: jest.fn(), style: "cancel" },
          { label: "Confirm", onPress: jest.fn(), style: "primary" },
          { label: "Delete", onPress: jest.fn(), style: "destructive" },
        ]}
        onDismiss={mockOnDismiss}
      />,
    );

    expect(screen.getByText("Cancel")).toBeTruthy();
    expect(screen.getByText("Confirm")).toBeTruthy();
    expect(screen.getByText("Delete")).toBeTruthy();
  });

  it("calls button onPress when pressed", () => {
    const mockConfirm = jest.fn();

    render(
      <OptionModal
        visible={true}
        title="Test"
        buttons={[{ label: "Confirm", onPress: mockConfirm, style: "primary" }]}
        onDismiss={mockOnDismiss}
      />,
    );

    fireEvent.press(screen.getByText("Confirm"));

    expect(mockConfirm).toHaveBeenCalled();
  });

  it("calls onDismiss when backdrop is pressed", () => {
    render(
      <OptionModal
        visible={true}
        title="Test"
        buttons={[]}
        onDismiss={mockOnDismiss}
      />,
    );

    fireEvent.press(screen.getByTestId("option-modal-overlay"));

    expect(mockOnDismiss).toHaveBeenCalled();
  });

  it("renders without message", () => {
    render(
      <OptionModal
        visible={true}
        title="Title Only"
        buttons={[{ label: "OK", onPress: jest.fn() }]}
        onDismiss={mockOnDismiss}
      />,
    );

    expect(screen.getByText("Title Only")).toBeTruthy();
    expect(screen.getByText("OK")).toBeTruthy();
  });

  it("renders buttons with default style when not specified", () => {
    const mockPress = jest.fn();

    render(
      <OptionModal
        visible={true}
        title="Test"
        buttons={[{ label: "Default", onPress: mockPress }]}
        onDismiss={mockOnDismiss}
      />,
    );

    const button = screen.getByText("Default");
    expect(button).toBeTruthy();

    fireEvent.press(button);
    expect(mockPress).toHaveBeenCalled();
  });
});
