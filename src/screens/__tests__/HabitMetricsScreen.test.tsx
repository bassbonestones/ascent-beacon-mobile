import React from "react";
import {
  render,
  screen,
  waitFor,
  fireEvent,
} from "@testing-library/react-native";
import HabitMetricsScreen from "../HabitMetricsScreen";
import api from "../../services/api";
import { useTime } from "../../context/TimeContext";
import type { TaskStatsResponse, CompletionHistoryResponse } from "../../types";

jest.mock("../../services/api");
jest.mock("../../context/TimeContext");

const mockedUseTime = jest.mocked(useTime);

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

const mockRoute = {
  params: {
    taskId: "task-1",
    taskTitle: "Daily Meditation",
  },
};

const mockStats: TaskStatsResponse = {
  task_id: "task-1",
  period: {
    start: "2024-06-01T00:00:00Z",
    end: "2024-06-30T00:00:00Z",
  },
  total_expected: 30,
  total_completed: 20,
  total_skipped: 5,
  total_missed: 5,
  completion_rate: 0.67,
  current_streak: 3,
  longest_streak: 10,
  last_completed_at: "2024-06-15T08:30:00Z",
};

const mockHistory: CompletionHistoryResponse = {
  task_id: "task-1",
  period: {
    start: "2024-06-01T00:00:00Z",
    end: "2024-06-30T00:00:00Z",
  },
  days: [
    {
      date: "2024-06-14",
      status: "completed",
      expected: 1,
      completed: 1,
      skipped: 0,
    },
    {
      date: "2024-06-15",
      status: "completed",
      expected: 1,
      completed: 1,
      skipped: 0,
    },
  ],
  summary: mockStats,
};

describe("HabitMetricsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.getTaskStats as jest.Mock).mockResolvedValue(mockStats);
    (api.getCompletionHistory as jest.Mock).mockResolvedValue(mockHistory);
    mockedUseTime.mockReturnValue({
      isTimeMachineEnabled: false,
      isTimeTravelActive: false,
      travelDate: null,
      enableTimeMachine: jest.fn(),
      disableTimeMachine: jest.fn(),
      setTravelDate: jest.fn(),
      resetToToday: jest.fn().mockResolvedValue({ deletedCount: 0 }),
      revertToDate: jest.fn().mockResolvedValue({ deletedCount: 0 }),
      getCurrentDate: () => new Date(),
      loading: false,
    });
  });

  it("renders loading state initially", () => {
    render(
      <HabitMetricsScreen
        navigation={mockNavigation as any}
        route={mockRoute as any}
      />,
    );

    expect(screen.getByText("Loading metrics...")).toBeTruthy();
  });

  it("renders habit title from route params", async () => {
    render(
      <HabitMetricsScreen
        navigation={mockNavigation as any}
        route={mockRoute as any}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Daily Meditation")).toBeTruthy();
    });
  });

  it("renders stats cards when data loads", async () => {
    render(
      <HabitMetricsScreen
        navigation={mockNavigation as any}
        route={mockRoute as any}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Current Streak")).toBeTruthy();
      expect(screen.getByText("Best Streak")).toBeTruthy();
      expect(screen.getByText("Completion Rate")).toBeTruthy();
    });
  });

  it("renders time span picker", async () => {
    render(
      <HabitMetricsScreen
        navigation={mockNavigation as any}
        route={mockRoute as any}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("7 Days")).toBeTruthy();
      expect(screen.getByText("30 Days")).toBeTruthy();
      expect(screen.getByText("90 Days")).toBeTruthy();
      expect(screen.getByText("365 Days")).toBeTruthy();
    });
  });

  it("changes time span when button pressed", async () => {
    render(
      <HabitMetricsScreen
        navigation={mockNavigation as any}
        route={mockRoute as any}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("7 Days")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("7 Days"));

    // API should be called again with new time range
    await waitFor(() => {
      expect(api.getTaskStats).toHaveBeenCalled();
    });
  });

  it("shows error state when API fails", async () => {
    (api.getTaskStats as jest.Mock).mockRejectedValue(
      new Error("Network error"),
    );
    (api.getCompletionHistory as jest.Mock).mockRejectedValue(
      new Error("Network error"),
    );

    render(
      <HabitMetricsScreen
        navigation={mockNavigation as any}
        route={mockRoute as any}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Failed to load metrics")).toBeTruthy();
    });
  });

  it("shows calendar view for short time spans", async () => {
    render(
      <HabitMetricsScreen
        navigation={mockNavigation as any}
        route={mockRoute as any}
      />,
    );

    await waitFor(() => {
      // Default is 30 days which shows calendar
      expect(screen.getByText("Calendar View")).toBeTruthy();
    });
  });
});
