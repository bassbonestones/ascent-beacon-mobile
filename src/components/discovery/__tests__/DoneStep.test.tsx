/**
 * Tests for DoneStep component
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import DoneStep from "../DoneStep";

// Mock styles
jest.mock("../../../screens/styles/valuesDiscoveryStyles", () => ({
  styles: {
    container: {},
    centerContent: {},
    doneTitle: {},
    doneText: {},
    doneButton: {},
    doneButtonText: {},
  },
}));

describe("DoneStep", () => {
  const mockOnGoToDashboard = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders discovery complete title", () => {
    render(<DoneStep onGoToDashboard={mockOnGoToDashboard} />);
    expect(screen.getByText("✓ Discovery Complete")).toBeTruthy();
  });

  it("renders completion message", () => {
    render(<DoneStep onGoToDashboard={mockOnGoToDashboard} />);
    expect(screen.getByText(/You've identified your core values/)).toBeTruthy();
  });

  it("renders go to dashboard button", () => {
    render(<DoneStep onGoToDashboard={mockOnGoToDashboard} />);
    expect(screen.getByLabelText("Go to Dashboard")).toBeTruthy();
  });

  it("calls onGoToDashboard when button pressed", () => {
    render(<DoneStep onGoToDashboard={mockOnGoToDashboard} />);
    fireEvent.press(screen.getByLabelText("Go to Dashboard"));
    expect(mockOnGoToDashboard).toHaveBeenCalled();
  });
});
