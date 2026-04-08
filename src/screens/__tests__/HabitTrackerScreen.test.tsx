import React from "react";
import { render, screen, waitFor } from "@testing-library/react-native";
import HabitTrackerScreen from "../HabitTrackerScreen";
import api from "../../services/api";
import { useTime } from "../../context/TimeContext";
import type {
  User,
  Task,
  TaskListResponse,
  TaskStatsResponse,
} from "../../types";
import { createMockTimeContext } from "../../testHelpers";

jest.mock("../../services/api");
jest.mock("../../context/TimeContext");

const mockedUseTime = jest.mocked(useTime);

const mockUser: User = {
  id: "user-1",
  display_name: "Test User",
  primary_email: "test@example.com",
  is_email_verified: true,
  created_at: "2024-01-01T00:00:00Z",
};

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: "task-1",
  user_id: "user-1",
  goal_id: null,
  title: "Daily Meditation",
  description: null,
  duration_minutes: 15,
  status: "pending",
  scheduled_date: null,
  scheduled_at: "2024-06-15T08:00:00Z",
  is_recurring: true,
  recurrence_rule: "FREQ=DAILY",
  recurrence_behavior: null,
  notify_before_minutes: null,
  completed_at: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  is_lightning: false,
  goal: null,
  scheduling_mode: "floating",
  skip_reason: null,
  sort_order: null,
  ...overrides,
});

const mockTaskListResponse: TaskListResponse = {
  tasks: [],
  total: 0,
  pending_count: 0,
  completed_count: 0,
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

describe("HabitTrackerScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.getTasks as jest.Mock).mockResolvedValue(mockTaskListResponse);
    mockedUseTime.mockReturnValue(createMockTimeContext());
  });

  it("renders loading state initially", () => {
    render(
      <HabitTrackerScreen user={mockUser} navigation={mockNavigation as any} />,
    );

    expect(screen.getByText("Loading habits...")).toBeTruthy();
  });

  it("renders empty state when no habits", async () => {
    (api.getTasks as jest.Mock).mockResolvedValue({
      ...mockTaskListResponse,
      tasks: [],
    });

    render(
      <HabitTrackerScreen user={mockUser} navigation={mockNavigation as any} />,
    );

    await waitFor(() => {
      expect(screen.getByText("No Habits Yet")).toBeTruthy();
    });
  });

  it("renders habits when available", async () => {
    const recurringTask = createMockTask({
      id: "habit-1",
      title: "Morning Workout",
      is_recurring: true,
    });

    (api.getTasks as jest.Mock).mockResolvedValue({
      ...mockTaskListResponse,
      tasks: [recurringTask],
    });

    (api.getTaskStats as jest.Mock).mockResolvedValue(mockStats);

    render(
      <HabitTrackerScreen user={mockUser} navigation={mockNavigation as any} />,
    );

    await waitFor(() => {
      expect(screen.getByText("Morning Workout")).toBeTruthy();
    });
  });

  it("filters out non-recurring tasks", async () => {
    const nonRecurringTask = createMockTask({
      id: "task-1",
      title: "One-time Task",
      is_recurring: false,
    });

    (api.getTasks as jest.Mock).mockResolvedValue({
      ...mockTaskListResponse,
      tasks: [nonRecurringTask],
    });

    render(
      <HabitTrackerScreen user={mockUser} navigation={mockNavigation as any} />,
    );

    await waitFor(() => {
      // Should show empty state since no recurring tasks
      expect(screen.getByText("No Habits Yet")).toBeTruthy();
    });
  });
});
