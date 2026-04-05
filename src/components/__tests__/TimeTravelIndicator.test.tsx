/**
 * Tests for TimeTravelIndicator
 */

import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import { TimeTravelIndicator } from "../TimeTravelIndicator";
import { TimeProvider, useTime } from "../../context/TimeContext";

// Mock expo-secure-store
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock api
jest.mock("../../services/api", () => ({
  __esModule: true,
  default: {
    deleteFutureCompletions: jest.fn().mockResolvedValue({ deletedCount: 0 }),
  },
}));

import * as SecureStore from "expo-secure-store";

const mockedSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe("TimeTravelIndicator", () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedSecureStore.getItemAsync.mockResolvedValue(null);
  });

  it("should return null when time travel is not active", async () => {
    const { toJSON } = render(
      <TimeProvider>
        <TimeTravelIndicator onPress={mockOnPress} />
      </TimeProvider>,
    );

    await waitFor(() => {
      expect(toJSON()).toBeNull();
    });
  });

  it("should render when time travel is active", async () => {
    mockedSecureStore.getItemAsync.mockImplementation(async (key) => {
      if (key === "time_machine_enabled") return "true";
      if (key === "time_travel_date") return "2026-04-15T12:00:00.000Z";
      return null;
    });

    render(
      <TimeProvider>
        <TimeTravelIndicator onPress={mockOnPress} />
      </TimeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Viewing: Apr 15, 2026/)).toBeTruthy();
    });
  });

  it("should show clock icon", async () => {
    mockedSecureStore.getItemAsync.mockImplementation(async (key) => {
      if (key === "time_machine_enabled") return "true";
      if (key === "time_travel_date") return "2026-04-15T12:00:00.000Z";
      return null;
    });

    render(
      <TimeProvider>
        <TimeTravelIndicator onPress={mockOnPress} />
      </TimeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("⏰")).toBeTruthy();
    });
  });

  it("should call onPress when tapped", async () => {
    mockedSecureStore.getItemAsync.mockImplementation(async (key) => {
      if (key === "time_machine_enabled") return "true";
      if (key === "time_travel_date") return "2026-04-15T12:00:00.000Z";
      return null;
    });

    render(
      <TimeProvider>
        <TimeTravelIndicator onPress={mockOnPress} />
      </TimeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Viewing:/)).toBeTruthy();
    });

    fireEvent.press(screen.getByText(/Viewing:/));

    expect(mockOnPress).toHaveBeenCalled();
  });

  it("should format different months correctly", async () => {
    mockedSecureStore.getItemAsync.mockImplementation(async (key) => {
      if (key === "time_machine_enabled") return "true";
      if (key === "time_travel_date") return "2026-12-25T12:00:00.000Z";
      return null;
    });

    render(
      <TimeProvider>
        <TimeTravelIndicator onPress={mockOnPress} />
      </TimeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Viewing: Dec 25, 2026/)).toBeTruthy();
    });
  });
});
