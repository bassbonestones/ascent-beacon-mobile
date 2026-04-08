import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { TaskDetailView } from "../TaskDetailView";
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

describe("TaskDetailView", () => {
  const defaultProps = {
    task: createMockTask(),
    onBack: jest.fn(),
    onComplete: jest.fn(),
    onSkip: jest.fn(),
    onReopen: jest.fn(),
    onDelete: jest.fn(),
    onEdit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseTime.mockReturnValue(createMockTimeContext());
  });

  it("renders header with title", () => {
    render(<TaskDetailView {...defaultProps} />);
    expect(screen.getByText("Task Details")).toBeTruthy();
  });

  it("renders back button", () => {
    render(<TaskDetailView {...defaultProps} />);
    expect(screen.getByLabelText("Back to tasks")).toBeTruthy();
  });

  it("calls onBack when back button is pressed", () => {
    render(<TaskDetailView {...defaultProps} />);
    fireEvent.press(screen.getByLabelText("Back to tasks"));
    expect(defaultProps.onBack).toHaveBeenCalled();
  });

  it("renders task title", () => {
    const task = createMockTask({ title: "Important Task" });
    render(<TaskDetailView {...defaultProps} task={task} />);
    expect(screen.getByText("Important Task")).toBeTruthy();
  });

  it("renders task description when present", () => {
    const task = createMockTask({ description: "Detailed description here" });
    render(<TaskDetailView {...defaultProps} task={task} />);
    expect(screen.getByText("Detailed description here")).toBeTruthy();
  });

  it("does not render description when null", () => {
    const task = createMockTask({ description: null });
    render(<TaskDetailView {...defaultProps} task={task} />);
    expect(screen.queryByText("Detailed description here")).toBeNull();
  });

  it("renders pending status", () => {
    const task = createMockTask({ status: "pending" });
    render(<TaskDetailView {...defaultProps} task={task} />);
    expect(screen.getByText("Pending")).toBeTruthy();
  });

  it("renders completed status", () => {
    const task = createMockTask({ status: "completed" });
    render(<TaskDetailView {...defaultProps} task={task} />);
    expect(screen.getByText("Completed")).toBeTruthy();
  });

  it("renders skipped status", () => {
    const task = createMockTask({ status: "skipped" });
    render(<TaskDetailView {...defaultProps} task={task} />);
    expect(screen.getByText("Skipped")).toBeTruthy();
  });

  it("renders duration in minutes", () => {
    const task = createMockTask({ duration_minutes: 45 });
    render(<TaskDetailView {...defaultProps} task={task} />);
    expect(screen.getByText("45 minutes")).toBeTruthy();
  });

  it("renders duration in hours", () => {
    const task = createMockTask({ duration_minutes: 120 });
    render(<TaskDetailView {...defaultProps} task={task} />);
    expect(screen.getByText("2 hours")).toBeTruthy();
  });

  it("renders duration in hours and minutes", () => {
    const task = createMockTask({ duration_minutes: 90 });
    render(<TaskDetailView {...defaultProps} task={task} />);
    expect(screen.getByText("1h 30m")).toBeTruthy();
  });

  it("renders lightning task label for zero duration", () => {
    const task = createMockTask({ duration_minutes: 0, is_lightning: true });
    render(<TaskDetailView {...defaultProps} task={task} />);
    expect(screen.getByText("Lightning Task (< 1 min)")).toBeTruthy();
  });

  it("renders goal title when present", () => {
    const task = createMockTask({
      goal: { id: "g-1", title: "Associated Goal", status: "in_progress" },
    });
    render(<TaskDetailView {...defaultProps} task={task} />);
    expect(screen.getByText("Associated Goal")).toBeTruthy();
    expect(screen.getByText("Goal")).toBeTruthy();
  });

  it("does not render goal section when goal is null", () => {
    const task = createMockTask({ goal: null });
    render(<TaskDetailView {...defaultProps} task={task} />);
    // "Goal" label should not appear when goal is null
    const goalLabels = screen.queryAllByText("Goal");
    expect(goalLabels.length).toBe(0);
  });

  it("renders scheduled date when present", () => {
    const task = createMockTask({ scheduled_at: "2024-06-15T10:30:00Z" });
    render(<TaskDetailView {...defaultProps} task={task} />);
    expect(screen.getByText("Scheduled")).toBeTruthy();
  });

  it("does not render scheduled date when null", () => {
    const task = createMockTask({ scheduled_at: null });
    render(<TaskDetailView {...defaultProps} task={task} />);
    expect(screen.queryByText("Scheduled")).toBeNull();
  });

  it("renders completed date when present", () => {
    const task = createMockTask({
      status: "completed",
      completed_at: "2024-06-10T14:00:00Z",
    });
    render(<TaskDetailView {...defaultProps} task={task} />);
    // Should show "Completed" as a label in meta section
    expect(screen.getAllByText("Completed").length).toBeGreaterThan(0);
  });

  it("does not render completed date when null", () => {
    const task = createMockTask({ completed_at: null });
    render(<TaskDetailView {...defaultProps} task={task} />);
    // Only status "Pending" should show, not "Completed" label
    expect(screen.getByText("Pending")).toBeTruthy();
  });

  it("renders created date", () => {
    const task = createMockTask({ created_at: "2024-01-15T00:00:00Z" });
    render(<TaskDetailView {...defaultProps} task={task} />);
    expect(screen.getByText("Created")).toBeTruthy();
  });

  describe("pending task actions", () => {
    it("shows complete button for pending tasks", () => {
      const task = createMockTask({ status: "pending" });
      render(<TaskDetailView {...defaultProps} task={task} />);
      expect(screen.getByLabelText("Complete task")).toBeTruthy();
    });

    it("shows skip button for pending tasks", () => {
      const task = createMockTask({ status: "pending" });
      render(<TaskDetailView {...defaultProps} task={task} />);
      expect(screen.getByLabelText("Skip task")).toBeTruthy();
    });

    it("calls onComplete when complete button is pressed", () => {
      const task = createMockTask({ status: "pending" });
      render(<TaskDetailView {...defaultProps} task={task} />);
      fireEvent.press(screen.getByLabelText("Complete task"));
      expect(defaultProps.onComplete).toHaveBeenCalledWith(task);
    });

    it("calls onSkip when skip button is pressed", () => {
      const task = createMockTask({ status: "pending" });
      render(<TaskDetailView {...defaultProps} task={task} />);
      fireEvent.press(screen.getByLabelText("Skip task"));
      expect(defaultProps.onSkip).toHaveBeenCalledWith(task);
    });

    it("does not show reopen button for pending tasks", () => {
      const task = createMockTask({ status: "pending" });
      render(<TaskDetailView {...defaultProps} task={task} />);
      expect(screen.queryByLabelText("Reopen task")).toBeNull();
    });
  });

  describe("completed task actions", () => {
    it("shows reopen button for completed tasks", () => {
      const task = createMockTask({ status: "completed" });
      render(<TaskDetailView {...defaultProps} task={task} />);
      expect(screen.getByLabelText("Reopen task")).toBeTruthy();
    });

    it("does not show complete button for completed tasks", () => {
      const task = createMockTask({ status: "completed" });
      render(<TaskDetailView {...defaultProps} task={task} />);
      expect(screen.queryByLabelText("Complete task")).toBeNull();
    });

    it("calls onReopen when reopen button is pressed", () => {
      const task = createMockTask({ status: "completed" });
      render(<TaskDetailView {...defaultProps} task={task} />);
      fireEvent.press(screen.getByLabelText("Reopen task"));
      expect(defaultProps.onReopen).toHaveBeenCalledWith(task);
    });
  });

  describe("skipped task actions", () => {
    it("shows reopen button for skipped tasks", () => {
      const task = createMockTask({ status: "skipped" });
      render(<TaskDetailView {...defaultProps} task={task} />);
      expect(screen.getByLabelText("Reopen task")).toBeTruthy();
    });

    it("does not show complete or skip buttons for skipped tasks", () => {
      const task = createMockTask({ status: "skipped" });
      render(<TaskDetailView {...defaultProps} task={task} />);
      expect(screen.queryByLabelText("Complete task")).toBeNull();
      expect(screen.queryByLabelText("Skip task")).toBeNull();
    });
  });

  describe("delete action", () => {
    it("always shows delete button", () => {
      const task = createMockTask();
      render(<TaskDetailView {...defaultProps} task={task} />);
      expect(screen.getByLabelText("Delete task")).toBeTruthy();
    });

    it("calls onDelete when delete button is pressed", () => {
      const task = createMockTask();
      render(<TaskDetailView {...defaultProps} task={task} />);
      fireEvent.press(screen.getByLabelText("Delete task"));
      expect(defaultProps.onDelete).toHaveBeenCalledWith(task);
    });

    it("shows delete button for completed tasks", () => {
      const task = createMockTask({ status: "completed" });
      render(<TaskDetailView {...defaultProps} task={task} />);
      expect(screen.getByLabelText("Delete task")).toBeTruthy();
    });

    it("shows delete button for skipped tasks", () => {
      const task = createMockTask({ status: "skipped" });
      render(<TaskDetailView {...defaultProps} task={task} />);
      expect(screen.getByLabelText("Delete task")).toBeTruthy();
    });
  });

  describe("edit functionality", () => {
    it("renders edit button", () => {
      render(<TaskDetailView {...defaultProps} />);
      expect(screen.getByLabelText("Edit task")).toBeTruthy();
    });

    it("calls onEdit when edit button is pressed", () => {
      render(<TaskDetailView {...defaultProps} />);
      fireEvent.press(screen.getByLabelText("Edit task"));
      expect(defaultProps.onEdit).toHaveBeenCalledWith(defaultProps.task);
    });

    it("shows edit button for pending tasks", () => {
      const task = createMockTask({ status: "pending" });
      render(<TaskDetailView {...defaultProps} task={task} />);
      expect(screen.getByText("✏️ Edit Task")).toBeTruthy();
    });

    it("shows edit button for completed tasks", () => {
      const task = createMockTask({ status: "completed" });
      render(<TaskDetailView {...defaultProps} task={task} />);
      expect(screen.getByText("✏️ Edit Task")).toBeTruthy();
    });
  });

  it("has proper button accessibility roles", () => {
    const task = createMockTask({ status: "pending" });
    render(<TaskDetailView {...defaultProps} task={task} />);
    expect(screen.getByRole("button", { name: "Back to tasks" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Edit task" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Complete task" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Skip task" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Delete task" })).toBeTruthy();
  });

  describe("recurrence details", () => {
    it("shows daily recurrence info", () => {
      const task = createMockTask({
        is_recurring: true,
        recurrence_rule: "FREQ=DAILY;INTERVAL=1",
      });
      render(<TaskDetailView {...defaultProps} task={task} />);
      expect(screen.getByText("Repeats")).toBeTruthy();
      expect(screen.getByText("Every day")).toBeTruthy();
    });

    it("shows weekly recurrence with days", () => {
      const task = createMockTask({
        is_recurring: true,
        recurrence_rule: "FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,WE,FR",
      });
      render(<TaskDetailView {...defaultProps} task={task} />);
      expect(screen.getByText("Every week")).toBeTruthy();
      expect(screen.getByText("Mon, Wed, Fri")).toBeTruthy();
    });

    it("shows recurrence with interval", () => {
      const task = createMockTask({
        is_recurring: true,
        recurrence_rule: "FREQ=DAILY;INTERVAL=2",
      });
      render(<TaskDetailView {...defaultProps} task={task} />);
      expect(screen.getByText("Every 2 days")).toBeTruthy();
    });

    it("shows anytime intraday mode", () => {
      const task = createMockTask({
        is_recurring: true,
        recurrence_rule: "FREQ=DAILY;X-INTRADAY=anytime;X-DAILYOCC=3",
      });
      render(<TaskDetailView {...defaultProps} task={task} />);
      expect(screen.getByText("3x per day")).toBeTruthy();
    });

    it("shows count end condition", () => {
      const task = createMockTask({
        is_recurring: true,
        recurrence_rule: "FREQ=DAILY;INTERVAL=1;COUNT=30",
      });
      render(<TaskDetailView {...defaultProps} task={task} />);
      expect(screen.getByText("Stops after 30 days")).toBeTruthy();
    });

    it("shows window intraday mode", () => {
      const task = createMockTask({
        is_recurring: true,
        recurrence_rule:
          "FREQ=DAILY;X-INTRADAY=window;X-WINSTART=09:00;X-WINEND=17:00",
      });
      render(<TaskDetailView {...defaultProps} task={task} />);
      expect(screen.getByText("Flexible window")).toBeTruthy();
    });

    it("shows specific times intraday mode", () => {
      const task = createMockTask({
        is_recurring: true,
        recurrence_rule:
          "FREQ=DAILY;X-INTRADAY=specific_times;X-TIMES=09:00,12:00,18:00",
      });
      render(<TaskDetailView {...defaultProps} task={task} />);
      expect(screen.getByText("3 specific times")).toBeTruthy();
    });

    it("shows interval intraday mode", () => {
      const task = createMockTask({
        is_recurring: true,
        recurrence_rule:
          "FREQ=DAILY;X-INTRADAY=interval;X-INTERVALMIN=60;X-WINSTART=08:00;X-WINEND=20:00",
      });
      render(<TaskDetailView {...defaultProps} task={task} />);
      expect(screen.getByText("Every 60 min")).toBeTruthy();
    });

    it("shows monthly recurrence", () => {
      const task = createMockTask({
        is_recurring: true,
        recurrence_rule: "FREQ=MONTHLY;INTERVAL=1",
      });
      render(<TaskDetailView {...defaultProps} task={task} />);
      expect(screen.getByText("Every month")).toBeTruthy();
    });

    it("shows yearly recurrence with interval", () => {
      const task = createMockTask({
        is_recurring: true,
        recurrence_rule: "FREQ=YEARLY;INTERVAL=2",
      });
      render(<TaskDetailView {...defaultProps} task={task} />);
      expect(screen.getByText("Every 2 years")).toBeTruthy();
    });
  });
});
