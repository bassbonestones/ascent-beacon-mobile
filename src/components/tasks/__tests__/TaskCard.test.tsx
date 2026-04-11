import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { TaskCard } from "../TaskCard";
import type { Task } from "../../../types";
import { useTime } from "../../../context/TimeContext";
import { createMockTimeContext } from "../../../testHelpers";

// Mock the TimeContext
jest.mock("../../../context/TimeContext");
const mockedUseTime = jest.mocked(useTime);

const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: "task-1",
  user_id: "user-1",
  goal_id: "goal-1",
  title: "Test Task",
  description: "Test description",
  duration_minutes: 30,
  status: "pending",
  scheduled_date: null,
  scheduled_at: null,
  is_recurring: false,
  recurrence_rule: null,
  recurrence_behavior: null,
  notify_before_minutes: null,
  completed_at: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  is_lightning: false,
  goal: { id: "goal-1", title: "Test Goal", status: "in_progress" },
  scheduling_mode: null,
  skip_reason: null,
  sort_order: null,
  ...overrides,
});

describe("TaskCard", () => {
  const mockOnPress = jest.fn();
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseTime.mockReturnValue(createMockTimeContext());
  });

  it("renders task title", () => {
    const task = createMockTask({ title: "My Important Task" });
    render(
      <TaskCard
        task={task}
        onPress={mockOnPress}
        onComplete={mockOnComplete}
      />,
    );
    expect(screen.getByText("My Important Task")).toBeTruthy();
  });

  it("renders goal title when goal is present", () => {
    const task = createMockTask({
      goal: { id: "goal-1", title: "Associated Goal", status: "in_progress" },
    });
    render(
      <TaskCard
        task={task}
        onPress={mockOnPress}
        onComplete={mockOnComplete}
      />,
    );
    expect(screen.getByText("Associated Goal")).toBeTruthy();
  });

  it("does not render goal title when goal is null", () => {
    const task = createMockTask({ goal: null });
    render(
      <TaskCard
        task={task}
        onPress={mockOnPress}
        onComplete={mockOnComplete}
      />,
    );
    expect(screen.queryByText("Test Goal")).toBeNull();
  });

  it("renders pending status badge", () => {
    const task = createMockTask({ status: "pending" });
    render(
      <TaskCard
        task={task}
        onPress={mockOnPress}
        onComplete={mockOnComplete}
      />,
    );
    expect(screen.getByText("Pending")).toBeTruthy();
  });

  it("renders completed status badge", () => {
    const task = createMockTask({ status: "completed" });
    render(
      <TaskCard
        task={task}
        onPress={mockOnPress}
        onComplete={mockOnComplete}
      />,
    );
    expect(screen.getByText("Completed")).toBeTruthy();
  });

  it("renders skipped status badge", () => {
    const task = createMockTask({ status: "skipped" });
    render(
      <TaskCard
        task={task}
        onPress={mockOnPress}
        onComplete={mockOnComplete}
      />,
    );
    expect(screen.getByText("Skipped")).toBeTruthy();
  });

  it("shows check button for pending tasks", () => {
    const task = createMockTask({ status: "pending" });
    render(
      <TaskCard
        task={task}
        onPress={mockOnPress}
        onComplete={mockOnComplete}
      />,
    );
    expect(screen.getByLabelText(`Complete task: ${task.title}`)).toBeTruthy();
  });

  it("does not show check button for completed tasks", () => {
    const task = createMockTask({ status: "completed" });
    render(
      <TaskCard
        task={task}
        onPress={mockOnPress}
        onComplete={mockOnComplete}
      />,
    );
    expect(screen.queryByLabelText(`Complete task: ${task.title}`)).toBeNull();
  });

  it("shows checkmark for completed tasks", () => {
    const task = createMockTask({ status: "completed" });
    render(
      <TaskCard
        task={task}
        onPress={mockOnPress}
        onComplete={mockOnComplete}
      />,
    );
    expect(screen.getByText("✓")).toBeTruthy();
  });

  it("shows lightning badge for lightning tasks", () => {
    const task = createMockTask({ is_lightning: true, duration_minutes: 0 });
    render(
      <TaskCard
        task={task}
        onPress={mockOnPress}
        onComplete={mockOnComplete}
      />,
    );
    expect(screen.getByText("⚡ Quick")).toBeTruthy();
  });

  it("shows anytime badge for anytime tasks", () => {
    const task = createMockTask({
      scheduling_mode: "anytime",
      scheduled_at: null,
      sort_order: 1,
    });
    render(
      <TaskCard
        task={task}
        onPress={mockOnPress}
        onComplete={mockOnComplete}
      />,
    );
    expect(screen.getByText("📋 Anytime")).toBeTruthy();
  });

  it("shows duration for non-lightning tasks", () => {
    const task = createMockTask({ is_lightning: false, duration_minutes: 30 });
    render(
      <TaskCard
        task={task}
        onPress={mockOnPress}
        onComplete={mockOnComplete}
      />,
    );
    expect(screen.getByText("⏱️ 30m")).toBeTruthy();
  });

  it("formats duration with hours", () => {
    const task = createMockTask({ is_lightning: false, duration_minutes: 90 });
    render(
      <TaskCard
        task={task}
        onPress={mockOnPress}
        onComplete={mockOnComplete}
      />,
    );
    expect(screen.getByText("⏱️ 1h 30m")).toBeTruthy();
  });

  it("formats duration with exact hours", () => {
    const task = createMockTask({ is_lightning: false, duration_minutes: 120 });
    render(
      <TaskCard
        task={task}
        onPress={mockOnPress}
        onComplete={mockOnComplete}
      />,
    );
    expect(screen.getByText("⏱️ 2h")).toBeTruthy();
  });

  it("does not show duration for zero minutes non-lightning tasks", () => {
    const task = createMockTask({ is_lightning: false, duration_minutes: 0 });
    render(
      <TaskCard
        task={task}
        onPress={mockOnPress}
        onComplete={mockOnComplete}
      />,
    );
    expect(screen.queryByText(/⏱️/)).toBeNull();
  });

  it("shows scheduled time when scheduled", () => {
    const task = createMockTask({ scheduled_at: "2024-06-15T10:00:00Z" });
    render(
      <TaskCard
        task={task}
        onPress={mockOnPress}
        onComplete={mockOnComplete}
      />,
    );
    // Shows time like "10:00 AM" or similar format
    expect(screen.getByText(/🕐/)).toBeTruthy();
  });

  it("does not show scheduled time when not scheduled", () => {
    const task = createMockTask({ scheduled_at: null, recurrence_rule: null });
    render(
      <TaskCard
        task={task}
        onPress={mockOnPress}
        onComplete={mockOnComplete}
      />,
    );
    // No time display for unscheduled tasks without window
    expect(screen.queryByText(/🕐 \d/)).toBeNull();
  });

  it("shows flexible window when task has window but no scheduled_at", () => {
    const task = createMockTask({
      scheduled_at: null,
      recurrence_rule:
        "FREQ=DAILY;X-INTRADAY=window;X-WINSTART=09:00;X-WINEND=17:00",
    });
    render(
      <TaskCard
        task={task}
        onPress={mockOnPress}
        onComplete={mockOnComplete}
      />,
    );
    // Shows window range like "9:00 AM - 5:00 PM"
    expect(screen.getByText(/🕐.*9:00 AM.*5:00 PM/)).toBeTruthy();
  });

  it("calls onPress when card is pressed", () => {
    const task = createMockTask();
    render(
      <TaskCard
        task={task}
        onPress={mockOnPress}
        onComplete={mockOnComplete}
      />,
    );
    fireEvent.press(screen.getByLabelText(`Task: ${task.title}`));
    expect(mockOnPress).toHaveBeenCalledWith(task);
  });

  it("calls onComplete when check button is pressed", () => {
    const task = createMockTask({ status: "pending" });
    render(
      <TaskCard
        task={task}
        onPress={mockOnPress}
        onComplete={mockOnComplete}
      />,
    );
    fireEvent.press(screen.getByLabelText(`Complete task: ${task.title}`));
    expect(mockOnComplete).toHaveBeenCalledWith(task);
  });

  it("has correct accessibility label", () => {
    const task = createMockTask({ title: "Accessible Task" });
    render(
      <TaskCard
        task={task}
        onPress={mockOnPress}
        onComplete={mockOnComplete}
      />,
    );
    expect(screen.getByLabelText("Task: Accessible Task")).toBeTruthy();
  });

  it("has button accessibility role", () => {
    const task = createMockTask();
    render(
      <TaskCard
        task={task}
        onPress={mockOnPress}
        onComplete={mockOnComplete}
      />,
    );
    expect(screen.getByRole("button", { name: /Task:/ })).toBeTruthy();
  });

  describe("reorder buttons", () => {
    it("shows reorder buttons when showReorderButtons is true", () => {
      const task = createMockTask({
        scheduling_mode: "anytime",
        sort_order: 1,
      });
      const mockOnMoveUp = jest.fn();
      const mockOnMoveDown = jest.fn();

      render(
        <TaskCard
          task={task}
          onPress={mockOnPress}
          onComplete={mockOnComplete}
          showReorderButtons={true}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
        />,
      );

      expect(screen.getByLabelText(`Move ${task.title} up`)).toBeTruthy();
      expect(screen.getByLabelText(`Move ${task.title} down`)).toBeTruthy();
    });

    it("does not show reorder buttons by default", () => {
      const task = createMockTask();

      render(
        <TaskCard
          task={task}
          onPress={mockOnPress}
          onComplete={mockOnComplete}
        />,
      );

      expect(screen.queryByLabelText(`Move ${task.title} up`)).toBeNull();
      expect(screen.queryByLabelText(`Move ${task.title} down`)).toBeNull();
    });

    it("calls onMoveUp when up button is pressed", () => {
      const task = createMockTask({
        scheduling_mode: "anytime",
        sort_order: 2,
      });
      const mockOnMoveUp = jest.fn();
      const mockOnMoveDown = jest.fn();

      render(
        <TaskCard
          task={task}
          onPress={mockOnPress}
          onComplete={mockOnComplete}
          showReorderButtons={true}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
        />,
      );

      fireEvent.press(screen.getByLabelText(`Move ${task.title} up`));
      expect(mockOnMoveUp).toHaveBeenCalled();
    });

    it("calls onMoveDown when down button is pressed", () => {
      const task = createMockTask({
        scheduling_mode: "anytime",
        sort_order: 1,
      });
      const mockOnMoveUp = jest.fn();
      const mockOnMoveDown = jest.fn();

      render(
        <TaskCard
          task={task}
          onPress={mockOnPress}
          onComplete={mockOnComplete}
          showReorderButtons={true}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
        />,
      );

      fireEvent.press(screen.getByLabelText(`Move ${task.title} down`));
      expect(mockOnMoveDown).toHaveBeenCalled();
    });
  });

  it("shows readiness glyph from dependency_summary", () => {
    const task = createMockTask({
      dependency_summary: {
        readiness_state: "blocked",
        has_unmet_hard: true,
        has_unmet_soft: false,
      },
    });
    render(
      <TaskCard
        task={task}
        onPress={mockOnPress}
        onComplete={mockOnComplete}
      />,
    );
    expect(screen.getByText("○")).toBeTruthy();
  });

  it("shows dependency advisory text when dependency_summary includes it", () => {
    const advisory =
      "Usually follows: Water · Skipped today";
    const task = createMockTask({
      dependency_summary: {
        readiness_state: "advisory",
        has_unmet_hard: false,
        has_unmet_soft: true,
        advisory_text: advisory,
      },
    });
    render(
      <TaskCard
        task={task}
        onPress={mockOnPress}
        onComplete={mockOnComplete}
      />,
    );
    expect(screen.getByText(advisory)).toBeTruthy();
  });
});
