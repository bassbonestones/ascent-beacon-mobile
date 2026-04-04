import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import TermsModal from "../TermsModal";

interface TermsModalProps {
  visible: boolean;
  onClose: () => void;
}

describe("TermsModal", () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it("renders correctly when visible", () => {
    render(<TermsModal visible={true} onClose={mockOnClose} />);

    expect(screen.getByText("Terms & Conditions")).toBeTruthy();
    expect(screen.getByText("Done")).toBeTruthy();
    expect(
      screen.getByText("What Ascent Beacon: Priority Lock Is"),
    ).toBeTruthy();
  });

  it("calls onClose when Done button is pressed", () => {
    render(<TermsModal visible={true} onClose={mockOnClose} />);

    const doneButton = screen.getByText("Done");
    fireEvent.press(doneButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("displays all required sections", () => {
    render(<TermsModal visible={true} onClose={mockOnClose} />);

    expect(screen.getByText("What Problem This Solves")).toBeTruthy();
    expect(screen.getByText("What We Promise")).toBeTruthy();
    expect(screen.getByText("What We Refuse to Do")).toBeTruthy();
    expect(screen.getByText("Your Data & Privacy")).toBeTruthy();
  });
});
