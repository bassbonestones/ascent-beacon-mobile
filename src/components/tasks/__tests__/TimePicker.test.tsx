import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { TimePicker } from "../TimePicker";

describe("TimePicker", () => {
  const defaultProps = {
    value: null,
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders with default label", () => {
      render(<TimePicker {...defaultProps} />);
      expect(screen.getByText("Scheduled Time")).toBeTruthy();
    });

    it("renders with custom label", () => {
      render(<TimePicker {...defaultProps} label="Custom Label" />);
      expect(screen.getByText("Custom Label")).toBeTruthy();
    });

    it("shows placeholder when no value", () => {
      render(<TimePicker {...defaultProps} />);
      expect(screen.getByText("Tap to set time")).toBeTruthy();
    });

    it("shows formatted time when value provided", () => {
      render(<TimePicker {...defaultProps} value="14:30" />);
      expect(screen.getByText("2:30 PM")).toBeTruthy();
    });

    it("shows clock icon", () => {
      render(<TimePicker {...defaultProps} />);
      expect(screen.getByText("🕐")).toBeTruthy();
    });
  });

  describe("modal behavior", () => {
    it("opens modal when button pressed", () => {
      render(<TimePicker {...defaultProps} />);
      fireEvent.press(screen.getByText("Tap to set time"));
      expect(screen.getByText("Select Time")).toBeTruthy();
    });

    it("closes modal when cancel pressed", () => {
      render(<TimePicker {...defaultProps} />);
      fireEvent.press(screen.getByText("Tap to set time"));
      fireEvent.press(screen.getByText("Cancel"));
      expect(screen.queryByText("Select Time")).toBeNull();
    });

    it("shows Save button", () => {
      render(<TimePicker {...defaultProps} />);
      fireEvent.press(screen.getByText("Tap to set time"));
      expect(screen.getByText("Save")).toBeTruthy();
    });
  });

  describe("time selection", () => {
    it("clears time when Clear Time pressed", () => {
      render(<TimePicker {...defaultProps} value="14:30" />);
      fireEvent.press(screen.getByText("2:30 PM"));
      fireEvent.press(screen.getByText("Clear Time"));
      expect(defaultProps.onChange).toHaveBeenCalledWith(null);
    });
  });

  describe("time formatting", () => {
    const testCases = [
      { value: "00:00", expected: "12:00 AM" },
      { value: "09:00", expected: "9:00 AM" },
      { value: "12:00", expected: "12:00 PM" },
      { value: "13:00", expected: "1:00 PM" },
      { value: "23:59", expected: "11:59 PM" },
    ];

    testCases.forEach(({ value, expected }) => {
      it(`formats ${value} as ${expected}`, () => {
        render(<TimePicker {...defaultProps} value={value} />);
        expect(screen.getByText(expected)).toBeTruthy();
      });
    });
  });

  describe("preview", () => {
    it("shows preview label when modal open", () => {
      render(<TimePicker {...defaultProps} />);
      fireEvent.press(screen.getByText("Tap to set time"));
      expect(screen.getByText("Preview:")).toBeTruthy();
    });
  });
});
