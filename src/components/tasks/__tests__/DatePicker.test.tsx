import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { DatePicker } from "../DatePicker";

// Mock react-native-calendars
jest.mock("react-native-calendars", () => ({
  Calendar: ({
    onDayPress,
    markedDates,
  }: {
    onDayPress: (day: { dateString: string }) => void;
    markedDates: Record<string, { selected: boolean }>;
  }) => {
    const React = require("react");
    const { View, Text, TouchableOpacity } = require("react-native");
    return (
      <View testID="mock-calendar">
        <TouchableOpacity
          testID="day-2026-04-15"
          onPress={() => onDayPress({ dateString: "2026-04-15" })}
        >
          <Text>15</Text>
        </TouchableOpacity>
        {Object.keys(markedDates || {}).map((date) => (
          <Text key={date} testID={`marked-${date}`}>
            {date}
          </Text>
        ))}
      </View>
    );
  },
}));

describe("DatePicker", () => {
  const defaultProps = {
    value: null,
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders with custom label", () => {
      render(<DatePicker {...defaultProps} label="Custom Label" />);
      expect(screen.getByText("Custom Label")).toBeTruthy();
    });

    it("shows default placeholder when no value", () => {
      render(<DatePicker {...defaultProps} />);
      expect(screen.getByText("Tap to set date")).toBeTruthy();
    });

    it("shows custom placeholder when provided", () => {
      render(<DatePicker {...defaultProps} placeholder="Today" />);
      expect(screen.getByText("Today")).toBeTruthy();
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

    it("shows calendar in modal", () => {
      render(<DatePicker {...defaultProps} />);
      fireEvent.press(screen.getByText("Tap to set date"));
      expect(screen.getByTestId("mock-calendar")).toBeTruthy();
    });
  });

  describe("date selection", () => {
    it("calls onChange when a day is selected", () => {
      render(<DatePicker {...defaultProps} />);
      fireEvent.press(screen.getByText("Tap to set date"));
      fireEvent.press(screen.getByTestId("day-2026-04-15"));
      expect(defaultProps.onChange).toHaveBeenCalledWith("2026-04-15");
    });

    it("closes modal after day selection", () => {
      render(<DatePicker {...defaultProps} />);
      fireEvent.press(screen.getByText("Tap to set date"));
      fireEvent.press(screen.getByTestId("day-2026-04-15"));
      expect(screen.queryByText("Select Date")).toBeNull();
    });

    it("clears date when Clear Date pressed", () => {
      render(<DatePicker {...defaultProps} value="2026-04-15" />);
      fireEvent.press(screen.getByText("April 15, 2026"));
      fireEvent.press(screen.getByText("Clear Date"));
      expect(defaultProps.onChange).toHaveBeenCalledWith(null);
    });

    it("does not show Clear Date button when no value", () => {
      render(<DatePicker {...defaultProps} />);
      fireEvent.press(screen.getByText("Tap to set date"));
      expect(screen.queryByText("Clear Date")).toBeNull();
    });

    it("shows marked date in calendar", () => {
      render(<DatePicker {...defaultProps} value="2026-04-15" />);
      fireEvent.press(screen.getByText("April 15, 2026"));
      expect(screen.getByTestId("marked-2026-04-15")).toBeTruthy();
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
