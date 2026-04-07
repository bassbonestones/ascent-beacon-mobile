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
    getPermanentOrder: jest.fn(),
    clearOccurrenceOrderFrom: jest.fn(),
  },
}));

import api from "../../services/api";
const mockedApi = api as jest.Mocked<typeof api>;

// Helper to create mock task
const createMockTask = (
  id: string,
  title: string,
  isRecurring: boolean = false,
): Task => ({
  id,
  user_id: "user-1",
  goal_id: "goal-1",
  title,
  description: null,
  duration_minutes: 30,
  status: "pending",
  scheduled_date: "2024-01-15",
  scheduled_at: null,
  is_recurring: isRecurring,
  recurrence_rule: isRecurring ? "daily" : null,
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
  // Non-recurring tasks - Save Permanent should NOT show
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

  // Recurring tasks - Save Permanent SHOULD show
  const recurringItems: ReorderItem[] = [
    {
      task: createMockTask("r1", "Recurring Task 1", true),
      occurrenceIndex: 0,
      key: "r1-0",
    },
    {
      task: createMockTask("r2", "Recurring Task 2", true),
      occurrenceIndex: 0,
      key: "r2-0",
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
    // Use recurring items so Save Permanent shows
    render(
      <ReorderTasksScreen
        navigation={mockNavigation}
        route={createMockRoute(recurringItems)}
      />,
    );

    expect(screen.getByText("Cancel")).toBeTruthy();
    expect(screen.getByText("Save for Today")).toBeTruthy();
    expect(screen.getByText("Save Permanent")).toBeTruthy();
  });

  it("hides Save Permanent when less than 2 recurring tasks", () => {
    // Use non-recurring items - Save Permanent should NOT show
    render(
      <ReorderTasksScreen
        navigation={mockNavigation}
        route={createMockRoute(mockItems)}
      />,
    );

    expect(screen.getByText("Cancel")).toBeTruthy();
    expect(screen.getByText("Save for Today")).toBeTruthy();
    expect(screen.queryByText("Save Permanent")).toBeNull();
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
        route={createMockRoute(recurringItems)}
      />,
    );

    // Press Save Permanent to open modal
    fireEvent.press(screen.getByText("Save Permanent"));

    // Wait for modal to appear and press "Permanent Only"
    await waitFor(() => {
      expect(screen.getByText("Permanent Only")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Permanent Only"));

    await waitFor(() => {
      expect(mockedApi.reorderOccurrences).toHaveBeenCalledWith({
        date: "2024-01-15",
        occurrences: [
          { task_id: "r1", occurrence_index: 0 },
          { task_id: "r2", occurrence_index: 0 },
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

  it("renders Revert button in header", () => {
    render(
      <ReorderTasksScreen
        navigation={mockNavigation}
        route={createMockRoute(mockItems)}
      />,
    );

    expect(screen.getByText("Revert")).toBeTruthy();
  });

  it("shows error when reverting with no permanent order", async () => {
    mockedApi.getPermanentOrder.mockResolvedValueOnce([]);

    render(
      <ReorderTasksScreen
        navigation={mockNavigation}
        route={createMockRoute(mockItems)}
      />,
    );

    fireEvent.press(screen.getByText("Revert"));

    await waitFor(() => {
      expect(
        screen.getByText("No permanent preferences saved yet"),
      ).toBeTruthy();
    });
  });

  it("reorders items when reverting to permanent order", async () => {
    // Setup: mockItems are in order t1, t2
    // Permanent order says t2 should come first
    mockedApi.getPermanentOrder.mockResolvedValueOnce([
      { task_id: "t2", occurrence_index: 0, sequence_number: 1 },
      { task_id: "t1", occurrence_index: 0, sequence_number: 2 },
    ]);

    render(
      <ReorderTasksScreen
        navigation={mockNavigation}
        route={createMockRoute(mockItems)}
      />,
    );

    // Before revert: Task 1, Task 2
    const initialTexts = screen
      .getAllByText(/Task \d/)
      .map((el) => el.children[0]);
    expect(initialTexts[0]).toBe("Task 1");
    expect(initialTexts[1]).toBe("Task 2");

    fireEvent.press(screen.getByText("Revert"));

    // After revert: Task 2, Task 1
    await waitFor(() => {
      const reorderedTexts = screen
        .getAllByText(/Task \d/)
        .map((el) => el.children[0]);
      expect(reorderedTexts[0]).toBe("Task 2");
      expect(reorderedTexts[1]).toBe("Task 1");
    });
  });

  it("shows confirmation modal when Override All is selected", async () => {
    render(
      <ReorderTasksScreen
        navigation={mockNavigation}
        route={createMockRoute(recurringItems)}
      />,
    );

    // Press Save Permanent to open first modal
    fireEvent.press(screen.getByText("Save Permanent"));

    // Wait for modal and press "Override All Future"
    await waitFor(() => {
      expect(screen.getByText("Override All Future")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Override All Future"));

    // Should show confirmation modal
    await waitFor(() => {
      expect(screen.getByText("Confirm Override")).toBeTruthy();
      expect(
        screen.getByText(/delete all daily overrides from today onward/),
      ).toBeTruthy();
    });
  });

  it("clears overrides and saves when Override All is confirmed", async () => {
    mockedApi.clearOccurrenceOrderFrom.mockResolvedValueOnce(undefined);

    render(
      <ReorderTasksScreen
        navigation={mockNavigation}
        route={createMockRoute(recurringItems)}
      />,
    );

    // Open first modal
    fireEvent.press(screen.getByText("Save Permanent"));
    await waitFor(() => {
      expect(screen.getByText("Override All Future")).toBeTruthy();
    });

    // Click Override All Future
    fireEvent.press(screen.getByText("Override All Future"));

    // Wait for confirmation modal
    await waitFor(() => {
      expect(screen.getByText("Confirm Override")).toBeTruthy();
    });

    // Confirm the override - find the Override All button in confirmation modal
    const overrideButtons = screen.getAllByText("Override All");
    fireEvent.press(overrideButtons[overrideButtons.length - 1]);

    // Should call clearOccurrenceOrderFrom and then reorderOccurrences
    await waitFor(() => {
      expect(mockedApi.clearOccurrenceOrderFrom).toHaveBeenCalledWith(
        "2024-01-15",
      );
      expect(mockedApi.reorderOccurrences).toHaveBeenCalledWith({
        date: "2024-01-15",
        occurrences: [
          { task_id: "r1", occurrence_index: 0 },
          { task_id: "r2", occurrence_index: 0 },
        ],
        save_mode: "permanent",
      });
    });

    expect(mockGoBack).toHaveBeenCalled();
  });

  it("closes modal when Cancel is pressed", async () => {
    render(
      <ReorderTasksScreen
        navigation={mockNavigation}
        route={createMockRoute(recurringItems)}
      />,
    );

    // Open modal
    fireEvent.press(screen.getByText("Save Permanent"));
    await waitFor(() => {
      expect(screen.getByText("Save Permanent Preferences")).toBeTruthy();
    });

    // Press Cancel in modal
    const cancelButtons = screen.getAllByText("Cancel");
    // Find the Cancel in the modal (last one)
    fireEvent.press(cancelButtons[cancelButtons.length - 1]);

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByText("Save Permanent Preferences")).toBeNull();
    });

    // API should not be called
    expect(mockedApi.reorderOccurrences).not.toHaveBeenCalled();
  });
});
