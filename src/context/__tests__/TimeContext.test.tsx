/**
 * Tests for TimeContext
 */

import React from "react";
import {
  render,
  screen,
  waitFor,
  act,
  fireEvent,
} from "@testing-library/react-native";
import { Text, TouchableOpacity } from "react-native";
import { TimeProvider, useTime } from "../TimeContext";

// Mock expo-secure-store
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock api module
jest.mock("../../services/api", () => ({
  __esModule: true,
  default: {
    deleteFutureCompletions: jest.fn(),
    getFutureCompletionsCount: jest.fn(),
  },
}));

import * as SecureStore from "expo-secure-store";
import api from "../../services/api";

const mockedSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;
const mockedApi = api as jest.Mocked<typeof api>;

// Test component that uses time context
const TimeConsumer: React.FC = () => {
  const {
    isTimeMachineEnabled,
    isTimeTravelActive,
    travelDate,
    enableTimeMachine,
    disableTimeMachine,
    setTravelDate,
    resetToToday,
    getFutureCompletionsCount,
    getCurrentDate,
    loading,
  } = useTime();

  return (
    <>
      <Text testID="loading">{loading ? "loading" : "ready"}</Text>
      <Text testID="enabled">{isTimeMachineEnabled ? "yes" : "no"}</Text>
      <Text testID="active">{isTimeTravelActive ? "yes" : "no"}</Text>
      <Text testID="travelDate">{travelDate?.toISOString() || "none"}</Text>
      <Text testID="currentDate">{getCurrentDate().toISOString()}</Text>
      <TouchableOpacity testID="enableBtn" onPress={enableTimeMachine}>
        <Text>Enable</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="disableBtn" onPress={disableTimeMachine}>
        <Text>Disable</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID="setDateBtn"
        onPress={() => setTravelDate(new Date("2026-04-10T12:00:00Z"))}
      >
        <Text>Set Date</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID="clearDateBtn"
        onPress={() => setTravelDate(null)}
      >
        <Text>Clear Date</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID="resetBtn"
        onPress={() => resetToToday(false).catch(() => {})}
      >
        <Text>Reset</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID="resetDeleteBtn"
        onPress={() => resetToToday(true).catch(() => {})}
      >
        <Text>Reset with Delete</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID="countBtn"
        onPress={() => getFutureCompletionsCount().catch(() => {})}
      >
        <Text>Get Count</Text>
      </TouchableOpacity>
    </>
  );
};

describe("TimeContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedSecureStore.getItemAsync.mockResolvedValue(null);
    mockedSecureStore.setItemAsync.mockResolvedValue();
    mockedSecureStore.deleteItemAsync.mockResolvedValue();
    mockedApi.deleteFutureCompletions.mockResolvedValue({ deletedCount: 0 });
    mockedApi.getFutureCompletionsCount.mockResolvedValue({ count: 0 });
  });

  describe("useTime hook", () => {
    it("should throw error when used outside TimeProvider", () => {
      const consoleError = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        render(<TimeConsumer />);
      }).toThrow("useTime must be used within a TimeProvider");

      consoleError.mockRestore();
    });
  });

  describe("TimeProvider", () => {
    it("should provide loading state initially and then ready", async () => {
      render(
        <TimeProvider>
          <TimeConsumer />
        </TimeProvider>,
      );

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByTestId("loading").props.children).toBe("ready");
      });
    });

    it("should have time machine disabled by default", async () => {
      render(
        <TimeProvider>
          <TimeConsumer />
        </TimeProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading").props.children).toBe("ready");
      });

      expect(screen.getByTestId("enabled").props.children).toBe("no");
      expect(screen.getByTestId("active").props.children).toBe("no");
      expect(screen.getByTestId("travelDate").props.children).toBe("none");
    });

    it("should enable time machine when enableTimeMachine is called", async () => {
      render(
        <TimeProvider>
          <TimeConsumer />
        </TimeProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading").props.children).toBe("ready");
      });

      await act(async () => {
        fireEvent.press(screen.getByTestId("enableBtn"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("enabled").props.children).toBe("yes");
      });

      expect(mockedSecureStore.setItemAsync).toHaveBeenCalledWith(
        "time_machine_enabled",
        "true",
      );
    });

    it("should disable time machine when disableTimeMachine is called", async () => {
      render(
        <TimeProvider>
          <TimeConsumer />
        </TimeProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading").props.children).toBe("ready");
      });

      // First enable
      await act(async () => {
        fireEvent.press(screen.getByTestId("enableBtn"));
      });

      // Then disable
      await act(async () => {
        fireEvent.press(screen.getByTestId("disableBtn"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("enabled").props.children).toBe("no");
      });

      expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith(
        "time_machine_enabled",
      );
    });

    it("should set travel date when setTravelDate is called", async () => {
      render(
        <TimeProvider>
          <TimeConsumer />
        </TimeProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading").props.children).toBe("ready");
      });

      await act(async () => {
        fireEvent.press(screen.getByTestId("setDateBtn"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("active").props.children).toBe("yes");
      });

      expect(screen.getByTestId("travelDate").props.children).toContain(
        "2026-04-10",
      );
      expect(mockedSecureStore.setItemAsync).toHaveBeenCalledWith(
        "time_travel_date",
        expect.stringContaining("2026-04-10"),
      );
    });

    it("should clear travel date when setTravelDate(null) is called", async () => {
      render(
        <TimeProvider>
          <TimeConsumer />
        </TimeProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading").props.children).toBe("ready");
      });

      // First set a date
      await act(async () => {
        fireEvent.press(screen.getByTestId("setDateBtn"));
      });

      // Then clear it
      await act(async () => {
        fireEvent.press(screen.getByTestId("clearDateBtn"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("active").props.children).toBe("no");
      });

      expect(screen.getByTestId("travelDate").props.children).toBe("none");
    });

    it("should return travel date from getCurrentDate when active", async () => {
      render(
        <TimeProvider>
          <TimeConsumer />
        </TimeProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading").props.children).toBe("ready");
      });

      await act(async () => {
        fireEvent.press(screen.getByTestId("setDateBtn"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("currentDate").props.children).toContain(
          "2026-04-10",
        );
      });
    });

    it("should load persisted state on mount", async () => {
      mockedSecureStore.getItemAsync.mockImplementation(async (key) => {
        if (key === "time_machine_enabled") return "true";
        if (key === "time_travel_date") return "2026-04-15T12:00:00.000Z";
        return null;
      });

      render(
        <TimeProvider>
          <TimeConsumer />
        </TimeProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading").props.children).toBe("ready");
      });

      expect(screen.getByTestId("enabled").props.children).toBe("yes");
      expect(screen.getByTestId("active").props.children).toBe("yes");
      expect(screen.getByTestId("travelDate").props.children).toContain(
        "2026-04-15",
      );
    });

    it("should clear date without calling API when resetToToday is called with deleteCompletions=false", async () => {
      render(
        <TimeProvider>
          <TimeConsumer />
        </TimeProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading").props.children).toBe("ready");
      });

      // First set a date
      await act(async () => {
        fireEvent.press(screen.getByTestId("setDateBtn"));
      });

      // Then reset without deleting
      await act(async () => {
        fireEvent.press(screen.getByTestId("resetBtn"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("active").props.children).toBe("no");
      });

      // Should NOT call deleteFutureCompletions when deleteCompletions is false
      expect(mockedApi.deleteFutureCompletions).not.toHaveBeenCalled();
      expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith(
        "time_travel_date",
      );
    });

    it("should call API and clear date when resetToToday is called with deleteCompletions=true", async () => {
      mockedApi.deleteFutureCompletions.mockResolvedValue({ deletedCount: 5 });

      render(
        <TimeProvider>
          <TimeConsumer />
        </TimeProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading").props.children).toBe("ready");
      });

      // First set a date
      await act(async () => {
        fireEvent.press(screen.getByTestId("setDateBtn"));
      });

      // Then reset with deleting
      await act(async () => {
        fireEvent.press(screen.getByTestId("resetDeleteBtn"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("active").props.children).toBe("no");
      });

      expect(mockedApi.deleteFutureCompletions).toHaveBeenCalled();
      expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith(
        "time_travel_date",
      );
    });
  });
});
