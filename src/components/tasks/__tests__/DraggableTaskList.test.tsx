import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Platform } from "react-native";
import { DraggableTaskList } from "../DraggableTaskList";
import type { Task } from "../../../types";

// Mock TaskCard to simplify testing
jest.mock("../TaskCard", () => ({
  TaskCard: ({
    task,
    onPress,
    onComplete,
    showReorderButtons,
    onMoveUp,
    onMoveDown,
  }: any) => {
    const { View, Text, TouchableOpacity } = require("react-native");
    return (
      <View testID={`task-card-${task.id}`}>
        <Text>{task.title}</Text>
        <TouchableOpacity
          testID={`press-${task.id}`}
          onPress={() => onPress(task)}
        />
        <TouchableOpacity
          testID={`complete-${task.id}`}
          onPress={() => onComplete(task)}
        />
        {showReorderButtons && onMoveUp && (
          <TouchableOpacity testID={`move-up-${task.id}`} onPress={onMoveUp} />
        )}
        {showReorderButtons && onMoveDown && (
          <TouchableOpacity
            testID={`move-down-${task.id}`}
            onPress={onMoveDown}
          />
        )}
      </View>
    );
  },
}));

const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: `task-${Math.random().toString(36).slice(2)}`,
  title: "Test Task",
  description: null,
  status: "pending",
  duration_minutes: 30,
  scheduled_date: null,
  scheduled_at: null,
  is_recurring: false,
  recurrence_rule: null,
  notify_before_minutes: null,
  completed_at: null,
  sort_order: 0,
  goal_id: "goal-1",
  user_id: "user-1",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
  is_lightning: false,
  goal: { id: "goal-1", title: "Test Goal", status: "in_progress" },
  scheduling_mode: "anytime",
  skip_reason: null,
  ...overrides,
});

const mockTasks: Task[] = [
  createMockTask({ id: "task-1", title: "Task 1", sort_order: 0 }),
  createMockTask({ id: "task-2", title: "Task 2", sort_order: 1 }),
  createMockTask({
    id: "task-3",
    title: "Task 3",
    status: "completed",
    sort_order: null,
  }),
];

describe("DraggableTaskList", () => {
  const defaultProps = {
    tasks: mockTasks,
    allTasks: mockTasks,
    currentDate: new Date("2025-01-15"),
    loading: false,
    loadingMore: false,
    onTaskPress: jest.fn(),
    onComplete: jest.fn(),
    onReorder: jest.fn(),
    onRefresh: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders all tasks", () => {
      const { getByTestId } = render(<DraggableTaskList {...defaultProps} />);

      expect(getByTestId("task-card-task-1")).toBeTruthy();
      expect(getByTestId("task-card-task-2")).toBeTruthy();
      expect(getByTestId("task-card-task-3")).toBeTruthy();
    });

    it("renders with empty task list", () => {
      const { queryByTestId } = render(
        <DraggableTaskList {...defaultProps} tasks={[]} />,
      );

      expect(queryByTestId("task-card-task-1")).toBeNull();
    });
  });

  describe("interactions", () => {
    it("calls onTaskPress when task is pressed", () => {
      const onTaskPress = jest.fn();
      const { getByTestId } = render(
        <DraggableTaskList {...defaultProps} onTaskPress={onTaskPress} />,
      );

      fireEvent.press(getByTestId("press-task-1"));
      expect(onTaskPress).toHaveBeenCalledWith(mockTasks[0]);
    });

    it("calls onComplete when task is completed", () => {
      const onComplete = jest.fn();
      const { getByTestId } = render(
        <DraggableTaskList {...defaultProps} onComplete={onComplete} />,
      );

      fireEvent.press(getByTestId("complete-task-2"));
      expect(onComplete).toHaveBeenCalledWith(mockTasks[1]);
    });
  });

  describe("native platform (arrow buttons)", () => {
    beforeEach(() => {
      (Platform as any).OS = "ios";
    });

    afterEach(() => {
      (Platform as any).OS = "ios";
    });

    it("shows move up button for non-first pending task", () => {
      const { getByTestId } = render(<DraggableTaskList {...defaultProps} />);

      // Second task should have move up button
      expect(getByTestId("move-up-task-2")).toBeTruthy();
    });

    it("shows move down button for non-last pending task", () => {
      const { getByTestId } = render(<DraggableTaskList {...defaultProps} />);

      // First task should have move down button
      expect(getByTestId("move-down-task-1")).toBeTruthy();
    });

    it("does not show reorder buttons for completed tasks", () => {
      const { queryByTestId } = render(<DraggableTaskList {...defaultProps} />);

      expect(queryByTestId("move-up-task-3")).toBeNull();
      expect(queryByTestId("move-down-task-3")).toBeNull();
    });

    it("calls onReorder when move up is pressed", () => {
      const onReorder = jest.fn();
      const { getByTestId } = render(
        <DraggableTaskList {...defaultProps} onReorder={onReorder} />,
      );

      fireEvent.press(getByTestId("move-up-task-2"));
      expect(onReorder).toHaveBeenCalledWith(mockTasks[1], 0); // Move to position 0
    });

    it("calls onReorder when move down is pressed", () => {
      const onReorder = jest.fn();
      const { getByTestId } = render(
        <DraggableTaskList {...defaultProps} onReorder={onReorder} />,
      );

      fireEvent.press(getByTestId("move-down-task-1"));
      expect(onReorder).toHaveBeenCalledWith(mockTasks[0], 1); // Move to position 1
    });
  });

  describe("web platform", () => {
    beforeEach(() => {
      (Platform as any).OS = "web";
    });

    afterEach(() => {
      (Platform as any).OS = "ios";
    });

    it("renders tasks on web", () => {
      const { getByTestId } = render(<DraggableTaskList {...defaultProps} />);

      expect(getByTestId("task-card-task-1")).toBeTruthy();
      expect(getByTestId("task-card-task-2")).toBeTruthy();
    });

    it("does not show arrow buttons on web (uses drag instead)", () => {
      const { queryByTestId } = render(<DraggableTaskList {...defaultProps} />);

      // Web version doesn't use arrow buttons
      expect(queryByTestId("move-up-task-2")).toBeNull();
      expect(queryByTestId("move-down-task-1")).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("handles single task", () => {
      const singleTask = [createMockTask({ id: "solo", sort_order: 0 })];
      const { getByTestId, queryByTestId } = render(
        <DraggableTaskList {...defaultProps} tasks={singleTask} />,
      );

      expect(getByTestId("task-card-solo")).toBeTruthy();
      // Single task has no up/down buttons
      expect(queryByTestId("move-up-solo")).toBeNull();
      expect(queryByTestId("move-down-solo")).toBeNull();
    });

    it("handles all completed tasks", () => {
      const completedTasks = [
        createMockTask({ id: "c1", status: "completed", sort_order: null }),
        createMockTask({ id: "c2", status: "completed", sort_order: null }),
      ];
      const { getByTestId, queryByTestId } = render(
        <DraggableTaskList {...defaultProps} tasks={completedTasks} />,
      );

      expect(getByTestId("task-card-c1")).toBeTruthy();
      expect(queryByTestId("move-up-c1")).toBeNull();
      expect(queryByTestId("move-down-c1")).toBeNull();
    });

    it("renders with loading state", () => {
      const { getByTestId } = render(
        <DraggableTaskList {...defaultProps} loading={true} />,
      );

      expect(getByTestId("task-card-task-1")).toBeTruthy();
    });
  });
});
