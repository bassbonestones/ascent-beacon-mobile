/**
 * Tests for SymbolHeader component
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import SymbolHeader from "../SymbolHeader";

// Mock the styles
jest.mock("../assistantStyles", () => ({
  default: {
    symbolZone: {},
    backButton: {},
    backButtonText: {},
    symbolImage: {},
    symbolLabel: {},
  },
}));

interface SymbolHeaderProps {
  label: string;
  onBack: () => void;
}

describe("SymbolHeader", () => {
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the configured label text", () => {
    render(<SymbolHeader label="VALUES" onBack={mockOnBack} />);

    expect(screen.getByText("VALUES")).toBeOnTheScreen();
  });

  it("should render back button with arrow", () => {
    render(<SymbolHeader label="VALUES" onBack={mockOnBack} />);

    expect(screen.getByText("←")).toBeOnTheScreen();
  });

  it("should call onBack when back button is pressed", () => {
    render(<SymbolHeader label="VALUES" onBack={mockOnBack} />);

    fireEvent.press(screen.getByLabelText("Go back"));

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it("should have accessibility label on back button", () => {
    render(<SymbolHeader label="VALUES" onBack={mockOnBack} />);

    expect(screen.getByLabelText("Go back")).toBeOnTheScreen();
  });

  it("should have accessibility label on icon image", () => {
    render(<SymbolHeader label="PRIORITIES" onBack={mockOnBack} />);

    expect(screen.getByLabelText("PRIORITIES icon")).toBeOnTheScreen();
  });
});
