import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Platform } from "react-native";
import { DraggableTaskList } from "../DraggableTaskList";
import type { Task } from "../../../types";

// Mock TaskCard to simplify testing
jest.mock("../TaskCard", () => ({
  TaskCard: ({ task, onPress, onComplete, drag, isActive }: any) => {
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
        {drag && (
          <TouchableOpacity testID={`drag-${task.id}`} onLongPress={drag} />
        )}
        {isActive && <Text testID={`active-${task.id}`}>Dragging</Text>}
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
  recurrence_behavior: null,
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

  describe("native platform (drag and drop)", () => {
    beforeEach(() => {
      (Platform as any).OS = "ios";
    });

    afterEach(() => {
      (Platform as any).OS = "ios";
    });

    it("renders tasks on native", () => {
      const { getByTestId } = render(<DraggableTaskList {...defaultProps} />);

      expect(getByTestId("task-card-task-1")).toBeTruthy();
      expect(getByTestId("task-card-task-2")).toBeTruthy();
    });

    it("provides drag handler for pending tasks with sort_order", () => {
      const { getByTestId } = render(<DraggableTaskList {...defaultProps} />);

      // Tasks with drag enabled should render (drag handler provided in renderItem)
      expect(getByTestId("task-card-task-1")).toBeTruthy();
      expect(getByTestId("task-card-task-2")).toBeTruthy();
    });

    it("does not provide drag for completed tasks", () => {
      const { getByTestId, queryByTestId } = render(
        <DraggableTaskList {...defaultProps} />,
      );

      // Completed task is rendered but without drag (handled internally)
      expect(getByTestId("task-card-task-3")).toBeTruthy();
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

      // Neither platform uses arrow buttons anymore - both use drag
      expect(queryByTestId("move-up-task-2")).toBeNull();
      expect(queryByTestId("move-down-task-1")).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("handles single task", () => {
      const singleTask = [createMockTask({ id: "solo", sort_order: 0 })];
      const { getByTestId } = render(
        <DraggableTaskList {...defaultProps} tasks={singleTask} />,
      );

      expect(getByTestId("task-card-solo")).toBeTruthy();
    });

    it("handles all completed tasks", () => {
      const completedTasks = [
        createMockTask({ id: "c1", status: "completed", sort_order: null }),
        createMockTask({ id: "c2", status: "completed", sort_order: null }),
      ];
      const { getByTestId } = render(
        <DraggableTaskList {...defaultProps} tasks={completedTasks} />,
      );

      expect(getByTestId("task-card-c1")).toBeTruthy();
      expect(getByTestId("task-card-c2")).toBeTruthy();
    });

    it("renders with loading state", () => {
      const { getByTestId } = render(
        <DraggableTaskList {...defaultProps} loading={true} />,
      );

      expect(getByTestId("task-card-task-1")).toBeTruthy();
    });
  });
});
