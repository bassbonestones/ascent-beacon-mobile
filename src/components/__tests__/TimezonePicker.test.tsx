/**
 * Tests for TimezonePicker component.
 */
import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import { TimezonePicker } from "../TimezonePicker";
import { TIMEZONES } from "../../utils/timezoneData";

// Mock timezoneData to provide consistent device timezone
jest.mock("../../utils/timezoneData", () => ({
  ...jest.requireActual("../../utils/timezoneData"),
  getDeviceTimezone: () => "America/New_York",
}));

describe("TimezonePicker", () => {
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders title", () => {
    render(
      <TimezonePicker
        selectedTimezone={null}
        onSelect={mockOnSelect}
        testID="tz-picker"
      />,
    );
    expect(screen.getByText("Timezone")).toBeTruthy();
  });

  it("renders Device Default option", () => {
    render(
      <TimezonePicker
        selectedTimezone={null}
        onSelect={mockOnSelect}
        testID="tz-picker"
      />,
    );
    expect(screen.getByText("Device Default")).toBeTruthy();
    // Device default should show the timezone (appears multiple times because it's also in the list)
    expect(
      screen.getAllByText("America/New_York").length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("renders timezone options from TIMEZONES list", () => {
    render(
      <TimezonePicker
        selectedTimezone={null}
        onSelect={mockOnSelect}
        testID="tz-picker"
      />,
    );
    // Check a few expected timezones
    expect(screen.getByText("UTC+0 UTC")).toBeTruthy();
    expect(screen.getByText("UTC-5 Eastern")).toBeTruthy();
    expect(screen.getByText("UTC+9 Tokyo")).toBeTruthy();
  });

  it("highlights Device Default when selectedTimezone is null", () => {
    render(
      <TimezonePicker
        selectedTimezone={null}
        onSelect={mockOnSelect}
        testID="tz-picker"
      />,
    );
    // Checkmark should be visible for device default
    expect(screen.getByTestId("tz-picker-device-default-check")).toBeTruthy();
  });

  it("highlights selected timezone option", () => {
    render(
      <TimezonePicker
        selectedTimezone="America/New_York"
        onSelect={mockOnSelect}
        testID="tz-picker"
      />,
    );
    // Checkmark should be visible for America/New_York
    expect(screen.getByTestId("tz-picker-America/New_York-check")).toBeTruthy();
    // Device default should NOT have checkmark
    expect(screen.queryByTestId("tz-picker-device-default-check")).toBeFalsy();
  });

  it("calls onSelect with null when Device Default is pressed", () => {
    render(
      <TimezonePicker
        selectedTimezone="Europe/London"
        onSelect={mockOnSelect}
        testID="tz-picker"
      />,
    );
    fireEvent.press(screen.getByTestId("tz-picker-device-default"));
    expect(mockOnSelect).toHaveBeenCalledWith(null);
  });

  it("calls onSelect with timezone id when option is pressed", () => {
    render(
      <TimezonePicker
        selectedTimezone={null}
        onSelect={mockOnSelect}
        testID="tz-picker"
      />,
    );
    fireEvent.press(screen.getByText("UTC+9 Tokyo"));
    expect(mockOnSelect).toHaveBeenCalledWith("Asia/Tokyo");
  });

  it("renders all timezones from the list", () => {
    render(
      <TimezonePicker
        selectedTimezone={null}
        onSelect={mockOnSelect}
        testID="tz-picker"
      />,
    );
    // All timezones should be present
    TIMEZONES.forEach((tz) => {
      expect(screen.getByTestId(`tz-picker-${tz.id}`)).toBeTruthy();
    });
  });

  it("has correct accessibility roles", () => {
    render(
      <TimezonePicker
        selectedTimezone={null}
        onSelect={mockOnSelect}
        testID="tz-picker"
      />,
    );
    // Device default should have radio role and checked state
    const deviceDefault = screen.getByTestId("tz-picker-device-default");
    expect(deviceDefault.props.accessibilityRole).toBe("radio");
    expect(deviceDefault.props.accessibilityState.checked).toBe(true);
  });
});
