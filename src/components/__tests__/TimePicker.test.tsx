import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { TimePicker } from "../TimePicker";

describe("TimePicker", () => {
  const mockOnTimeChange = jest.fn();

  beforeEach(() => {
    mockOnTimeChange.mockClear();
  });

  it("renders current hour and minute", () => {
    const { getByText } = render(
      <TimePicker hour={14} minute={30} onTimeChange={mockOnTimeChange} />,
    );

    expect(getByText("02")).toBeTruthy(); // 14 in 12-hour format
    expect(getByText("30")).toBeTruthy();
    expect(getByText("PM")).toBeTruthy();
  });

  it("renders AM for morning hours", () => {
    const { getByText } = render(
      <TimePicker hour={9} minute={0} onTimeChange={mockOnTimeChange} />,
    );

    expect(getByText("09")).toBeTruthy();
    expect(getByText("AM")).toBeTruthy();
  });

  it("shows 12 for noon", () => {
    const { getByText } = render(
      <TimePicker hour={12} minute={0} onTimeChange={mockOnTimeChange} />,
    );

    expect(getByText("12")).toBeTruthy();
    expect(getByText("PM")).toBeTruthy();
  });

  it("shows 12 for midnight", () => {
    const { getByText } = render(
      <TimePicker hour={0} minute={0} onTimeChange={mockOnTimeChange} />,
    );

    expect(getByText("12")).toBeTruthy();
    expect(getByText("AM")).toBeTruthy();
  });

  it("calls onTimeChange when hour is increased", () => {
    const { getByLabelText } = render(
      <TimePicker hour={10} minute={30} onTimeChange={mockOnTimeChange} />,
    );

    fireEvent.press(getByLabelText("Increase hour"));

    expect(mockOnTimeChange).toHaveBeenCalledWith(11, 30);
  });

  it("calls onTimeChange when hour is decreased", () => {
    const { getByLabelText } = render(
      <TimePicker hour={10} minute={30} onTimeChange={mockOnTimeChange} />,
    );

    fireEvent.press(getByLabelText("Decrease hour"));

    expect(mockOnTimeChange).toHaveBeenCalledWith(9, 30);
  });

  it("wraps hour from 23 to 0 when increased", () => {
    const { getByLabelText } = render(
      <TimePicker hour={23} minute={0} onTimeChange={mockOnTimeChange} />,
    );

    fireEvent.press(getByLabelText("Increase hour"));

    expect(mockOnTimeChange).toHaveBeenCalledWith(0, 0);
  });

  it("wraps hour from 0 to 23 when decreased", () => {
    const { getByLabelText } = render(
      <TimePicker hour={0} minute={0} onTimeChange={mockOnTimeChange} />,
    );

    fireEvent.press(getByLabelText("Decrease hour"));

    expect(mockOnTimeChange).toHaveBeenCalledWith(23, 0);
  });

  it("increases minutes by 15", () => {
    const { getByLabelText } = render(
      <TimePicker hour={10} minute={0} onTimeChange={mockOnTimeChange} />,
    );

    fireEvent.press(getByLabelText("Increase minutes"));

    expect(mockOnTimeChange).toHaveBeenCalledWith(10, 15);
  });

  it("decreases minutes by 15", () => {
    const { getByLabelText } = render(
      <TimePicker hour={10} minute={30} onTimeChange={mockOnTimeChange} />,
    );

    fireEvent.press(getByLabelText("Decrease minutes"));

    expect(mockOnTimeChange).toHaveBeenCalledWith(10, 15);
  });

  it("wraps minutes and increments hour when going over 60", () => {
    const { getByLabelText } = render(
      <TimePicker hour={10} minute={50} onTimeChange={mockOnTimeChange} />,
    );

    fireEvent.press(getByLabelText("Increase minutes"));

    expect(mockOnTimeChange).toHaveBeenCalledWith(11, 5);
  });

  it("wraps minutes and decrements hour when going under 0", () => {
    const { getByLabelText } = render(
      <TimePicker hour={10} minute={10} onTimeChange={mockOnTimeChange} />,
    );

    fireEvent.press(getByLabelText("Decrease minutes"));

    expect(mockOnTimeChange).toHaveBeenCalledWith(9, 55);
  });

  it("toggles from AM to PM", () => {
    const { getByLabelText } = render(
      <TimePicker hour={9} minute={0} onTimeChange={mockOnTimeChange} />,
    );

    fireEvent.press(getByLabelText("Toggle AM/PM"));

    expect(mockOnTimeChange).toHaveBeenCalledWith(21, 0);
  });

  it("toggles from PM to AM", () => {
    const { getByLabelText } = render(
      <TimePicker hour={14} minute={30} onTimeChange={mockOnTimeChange} />,
    );

    fireEvent.press(getByLabelText("Toggle AM/PM"));

    expect(mockOnTimeChange).toHaveBeenCalledWith(2, 30);
  });

  it("sets quick time to 6 AM", () => {
    const { getByText } = render(
      <TimePicker hour={12} minute={0} onTimeChange={mockOnTimeChange} />,
    );

    fireEvent.press(getByText("6 AM"));

    expect(mockOnTimeChange).toHaveBeenCalledWith(6, 0);
  });

  it("sets quick time to 12 PM", () => {
    const { getByText } = render(
      <TimePicker hour={8} minute={0} onTimeChange={mockOnTimeChange} />,
    );

    fireEvent.press(getByText("12 PM"));

    expect(mockOnTimeChange).toHaveBeenCalledWith(12, 0);
  });

  it("sets quick time to 6 PM", () => {
    const { getByText } = render(
      <TimePicker hour={8} minute={0} onTimeChange={mockOnTimeChange} />,
    );

    fireEvent.press(getByText("6 PM"));

    expect(mockOnTimeChange).toHaveBeenCalledWith(18, 0);
  });

  it("sets quick time to 9 PM", () => {
    const { getByText } = render(
      <TimePicker hour={8} minute={0} onTimeChange={mockOnTimeChange} />,
    );

    fireEvent.press(getByText("9 PM"));

    expect(mockOnTimeChange).toHaveBeenCalledWith(21, 0);
  });
});
