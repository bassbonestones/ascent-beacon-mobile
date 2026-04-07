/**
 * Tests for ReorderTasksScreen
 */

import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import ReorderTasksScreen from "../ReorderTasksScreen";
import type { Task, ReorderItem, RootStackParamList } from "../../types";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

// Mock the draggable library
jest.mock("react-native-draggable-flatlist", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: ({
      data,
      renderItem,
      keyExtractor,
    }: {
      data: any[];
      renderItem: ({
        item,
        drag,
      }: {
        item: any;
        drag: () => void;
      }) => React.ReactElement;
      keyExtractor: (item: any) => string;
    }) => (
      <View testID="draggable-list">
        {data.map((item) => (
          <React.Fragment key={keyExtractor(item)}>
            {renderItem({ item, drag: () => {} })}
          </React.Fragment>
        ))}
      </View>
    ),
    ScaleDecorator: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
  };
});

// Mock API
jest.mock("../../services/api", () => ({
  __esModule: true,
  default: {
    reorderOccurrences: jest.fn(),
  },
}));

import api from "../../services/api";
const mockedApi = api as jest.Mocked<typeof api>;

// Helper to create mock task
const createMockTask = (id: string, title: string): Task => ({
  id,
  user_id: "user-1",
  goal_id: "goal-1",
  title,
  description: null,
  duration_minutes: 30,
  status: "pending",
  scheduled_date: "2024-01-15",
  scheduled_at: null,
  is_recurring: false,
  recurrence_rule: null,
  notify_before_minutes: null,
  completed_at: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  is_lightning: false,
  goal: { id: "goal-1", title: "Test Goal", status: "not_started" },
  scheduling_mode: "date_only",
  skip_reason: null,
  sort_order: null,
});

// Mock navigation
const mockGoBack = jest.fn();
const mockNavigation = {
  goBack: mockGoBack,
} as any;

// Create mock route with items
const createMockRoute = (items: ReorderItem[]) => ({
  params: {
    date: "2024-01-15",
    dateDisplay: "Today - Mon Jan 15",
    items,
  },
  key: "ReorderTasks",
  name: "ReorderTasks" as const,
});

describe("ReorderTasksScreen", () => {
  const mockItems: ReorderItem[] = [
    {
      task: createMockTask("t1", "Task 1"),
      occurrenceIndex: 0,
      key: "t1-0",
    },
    {
      task: createMockTask("t2", "Task 2"),
      occurrenceIndex: 0,
      key: "t2-0",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockedApi.reorderOccurrences.mockResolvedValue({
      message: "Saved 2 occurrence preferences",
      save_mode: "today",
      date: "2024-01-15",
      count: 2,
    });
  });

  it("renders the header with date display", () => {
    render(
      <ReorderTasksScreen
        navigation={mockNavigation}
        route={createMockRoute(mockItems)}
      />,
    );

    expect(screen.getByText(/Reorder tasks for/)).toBeTruthy();
    expect(screen.getByText(/Today - Mon Jan 15/)).toBeTruthy();
  });

  it("renders all task items", () => {
    render(
      <ReorderTasksScreen
        navigation={mockNavigation}
        route={createMockRoute(mockItems)}
      />,
    );

    expect(screen.getByText("Task 1")).toBeTruthy();
    expect(screen.getByText("Task 2")).toBeTruthy();
  });

  it("renders cancel and save buttons", () => {
    render(
      <ReorderTasksScreen
        navigation={mockNavigation}
        route={createMockRoute(mockItems)}
      />,
    );

    expect(screen.getByText("Cancel")).toBeTruthy();
    expect(screen.getByText("Save for Today")).toBeTruthy();
    expect(screen.getByText("Save Permanent")).toBeTruthy();
  });

  it("navigates back when cancel is pressed", () => {
    render(
      <ReorderTasksScreen
        navigation={mockNavigation}
        route={createMockRoute(mockItems)}
      />,
    );

    fireEvent.press(screen.getByText("Cancel"));
    expect(mockGoBack).toHaveBeenCalled();
  });

  it("calls API with today when Save for Today is pressed", async () => {
    render(
      <ReorderTasksScreen
        navigation={mockNavigation}
        route={createMockRoute(mockItems)}
      />,
    );

    fireEvent.press(screen.getByText("Save for Today"));

    await waitFor(() => {
      expect(mockedApi.reorderOccurrences).toHaveBeenCalledWith({
        date: "2024-01-15",
        occurrences: [
          { task_id: "t1", occurrence_index: 0 },
          { task_id: "t2", occurrence_index: 0 },
        ],
        save_mode: "today",
      });
    });

    expect(mockGoBack).toHaveBeenCalled();
  });

  it("calls API with permanent when Save Permanent is pressed", async () => {
    render(
      <ReorderTasksScreen
        navigation={mockNavigation}
        route={createMockRoute(mockItems)}
      />,
    );

    fireEvent.press(screen.getByText("Save Permanent"));

    await waitFor(() => {
      expect(mockedApi.reorderOccurrences).toHaveBeenCalledWith({
        date: "2024-01-15",
        occurrences: [
          { task_id: "t1", occurrence_index: 0 },
          { task_id: "t2", occurrence_index: 0 },
        ],
        save_mode: "permanent",
      });
    });

    expect(mockGoBack).toHaveBeenCalled();
  });

  it("shows error message when API fails", async () => {
    mockedApi.reorderOccurrences.mockRejectedValueOnce(
      new Error("Network error"),
    );

    render(
      <ReorderTasksScreen
        navigation={mockNavigation}
        route={createMockRoute(mockItems)}
      />,
    );

    fireEvent.press(screen.getByText("Save for Today"));

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeTruthy();
    });

    // Should not navigate back on error
    expect(mockGoBack).not.toHaveBeenCalled();
  });

  it("shows occurrence label when present", () => {
    const itemsWithLabels: ReorderItem[] = [
      {
        task: createMockTask("t1", "Task 1"),
        occurrenceIndex: 0,
        occurrenceLabel: "(1 of 3)",
        key: "t1-0",
      },
      {
        task: createMockTask("t1", "Task 1"),
        occurrenceIndex: 1,
        occurrenceLabel: "(2 of 3)",
        key: "t1-1",
      },
    ];

    render(
      <ReorderTasksScreen
        navigation={mockNavigation}
        route={createMockRoute(itemsWithLabels)}
      />,
    );

    expect(screen.getByText("(1 of 3)")).toBeTruthy();
    expect(screen.getByText("(2 of 3)")).toBeTruthy();
  });

  it("disables save buttons while saving", async () => {
    // Make the API slow
    mockedApi.reorderOccurrences.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000)),
    );

    render(
      <ReorderTasksScreen
        navigation={mockNavigation}
        route={createMockRoute(mockItems)}
      />,
    );

    fireEvent.press(screen.getByText("Save for Today"));

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByTestId("save-loading")).toBeTruthy();
    });
  });
});
