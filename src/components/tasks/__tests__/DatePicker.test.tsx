import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { DatePicker } from "../DatePicker";

describe("DatePicker", () => {
  const defaultProps = {
    value: null,
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders with default label", () => {
      render(<DatePicker {...defaultProps} />);
      expect(screen.getByText("End Date")).toBeTruthy();
    });

    it("renders with custom label", () => {
      render(<DatePicker {...defaultProps} label="Custom Label" />);
      expect(screen.getByText("Custom Label")).toBeTruthy();
    });

    it("shows placeholder when no value", () => {
      render(<DatePicker {...defaultProps} />);
      expect(screen.getByText("Tap to set date")).toBeTruthy();
    });

    it("shows formatted date when value provided", () => {
      render(<DatePicker {...defaultProps} value="2026-04-15" />);
      expect(screen.getByText("April 15, 2026")).toBeTruthy();
    });

    it("shows calendar icon", () => {
      render(<DatePicker {...defaultProps} />);
      expect(screen.getByText("📅")).toBeTruthy();
    });
  });

  describe("modal behavior", () => {
    it("opens modal when button pressed", () => {
      render(<DatePicker {...defaultProps} />);
      fireEvent.press(screen.getByText("Tap to set date"));
      expect(screen.getByText("Select Date")).toBeTruthy();
    });

    it("closes modal when cancel pressed", () => {
      render(<DatePicker {...defaultProps} />);
      fireEvent.press(screen.getByText("Tap to set date"));
      fireEvent.press(screen.getByText("Cancel"));
      expect(screen.queryByText("Select Date")).toBeNull();
    });

    it("shows Save button", () => {
      render(<DatePicker {...defaultProps} />);
      fireEvent.press(screen.getByText("Tap to set date"));
      expect(screen.getByText("Save")).toBeTruthy();
    });
  });

  describe("date selection", () => {
    it("clears date when Clear Date pressed", () => {
      render(<DatePicker {...defaultProps} value="2026-04-15" />);
      fireEvent.press(screen.getByText("April 15, 2026"));
      fireEvent.press(screen.getByText("Clear Date"));
      expect(defaultProps.onChange).toHaveBeenCalledWith(null);
    });
  });

  describe("date formatting", () => {
    const testCases = [
      { value: "2026-01-01", expected: "January 1, 2026" },
      { value: "2026-02-14", expected: "February 14, 2026" },
      { value: "2026-12-31", expected: "December 31, 2026" },
    ];

    testCases.forEach(({ value, expected }) => {
      it(`formats ${value} as ${expected}`, () => {
        render(<DatePicker {...defaultProps} value={value} />);
        expect(screen.getByText(expected)).toBeTruthy();
      });
    });
  });
});
