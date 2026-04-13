/**
 * Tests for SymbolHeader component
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import SymbolHeader from "../assistant/SymbolHeader";

// Mock the styles
jest.mock("../assistant/assistantStyles", () => ({
  default: {
    symbolZone: {},
    backButton: {},
    backButtonText: {},
    symbolImage: {},
    symbolLabel: {},
  },
}));

describe("SymbolHeader", () => {
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the label", () => {
    render(<SymbolHeader label="VALUES" onBack={mockOnBack} />);

    expect(screen.getByText("VALUES")).toBeTruthy();
  });

  it("should render back button with arrow", () => {
    render(<SymbolHeader label="VALUES" onBack={mockOnBack} />);

    expect(screen.getByText("←")).toBeTruthy();
  });

  it("should call onBack when back button is pressed", () => {
    render(<SymbolHeader label="VALUES" onBack={mockOnBack} />);

    fireEvent.press(screen.getByLabelText("Go back"));

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it("should have accessibility label on back button", () => {
    render(<SymbolHeader label="VALUES" onBack={mockOnBack} />);

    expect(screen.getByLabelText("Go back")).toBeTruthy();
  });

  it("should have accessibility label on icon image", () => {
    render(<SymbolHeader label="PRIORITIES" onBack={mockOnBack} />);

    expect(screen.getByLabelText("PRIORITIES icon")).toBeTruthy();
  });
});
