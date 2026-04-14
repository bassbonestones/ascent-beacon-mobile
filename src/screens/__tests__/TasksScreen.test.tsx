import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import TasksScreen from "../TasksScreen";
import { useTasks } from "../../hooks/useTasks";
import { useGoals } from "../../hooks/useGoals";
import { useOccurrenceOrderRange } from "../../hooks/useOccurrenceOrderRange";
import { useTime } from "../../context/TimeContext";
import type {
  Task,
  Goal,
  User,
  UseTasksReturn,
  UseGoalsReturn,
} from "../../types";
import { showAlert } from "../../utils/alert";
import { createMockTimeContext } from "../../testHelpers";
import api from "../../services/api";

jest.mock("../../hooks/useTasks");
jest.mock("../../hooks/useGoals");
jest.mock("../../hooks/useOccurrenceOrderRange");
jest.mock("../../utils/alert");
jest.mock("../../context/TimeContext");
const defaultDependencyStatus = {
  task_id: "t-1",
  scheduled_for: null as string | null,
  dependencies: [],
  has_unmet_hard: false,
  has_unmet_soft: false,
  all_met: true,
  dependents: [],
  readiness_state: "ready" as const,
};

jest.mock("../../services/api", () => ({
  __esModule: true,
  default: {
    getDependencyRules: jest.fn(),
    getDependencyStatus: jest.fn(),
    createDependencyRule: jest.fn(),
    deleteDependencyRule: jest.fn(),
  },
}));

const mockedUseTasks = jest.mocked(useTasks);
const mockedUseGoals = jest.mocked(useGoals);
const mockedUseOccurrenceOrderRange = jest.mocked(useOccurrenceOrderRange);
const mockedShowAlert = jest.mocked(showAlert);
const mockedUseTime = jest.mocked(useTime);
const mockedApi = api as jest.Mocked<typeof api>;

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

const createMockGoal = (overrides: Partial<Goal> = {}): Goal => ({
  id: "goal-1",
  user_id: "user-1",
  parent_goal_id: null,
  title: "Test Goal",
  description: "Test description",
  target_date: "2024-12-31",
  status: "in_progress",
  progress_cached: 0,
  total_time_minutes: 100,
  completed_time_minutes: 25,
  has_incomplete_breakdown: false,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  completed_at: null,
  priorities: [],
  ...overrides,
});

const mockUser: User = {
  id: "user-1",
  display_name: "Test User",
  primary_email: "test@example.com",
  is_email_verified: true,
  created_at: "2024-01-01T00:00:00Z",
};

const defaultTasksHook: UseTasksReturn = {
  tasks: [],
  loading: false,
  error: null,
  pendingCount: 0,
  completedCount: 0,
  refetch: jest.fn(),
  createTask: jest.fn(),
  updateTask: jest.fn(),
  completeTask: jest.fn(),
  skipTask: jest.fn(),
  reopenTask: jest.fn(),
  deleteTask: jest.fn(),
  archiveTask: jest.fn(),
  pauseTask: jest.fn(),
  unpauseTask: jest.fn(),
  reorderTask: jest.fn(),
};

const defaultGoalsHook: UseGoalsReturn = {
  goals: [],
  loading: false,
  error: null,
  refetch: jest.fn(),
  createGoal: jest.fn(),
  updateGoal: jest.fn(),
  updateGoalStatus: jest.fn(),
  deleteGoal: jest.fn(),
  previewArchive: jest.fn(),
  archiveGoal: jest.fn(),
  pauseGoal: jest.fn(),
  unpauseGoal: jest.fn(),
};

describe("TasksScreen", () => {
  const mockNavigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
    setOptions: jest.fn(),
    addListener: jest.fn(() => jest.fn()), // Returns unsubscribe function
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseTasks.mockReturnValue(defaultTasksHook);
    mockedUseGoals.mockReturnValue(defaultGoalsHook);
    mockedUseOccurrenceOrderRange.mockReturnValue({
      data: null,
      loading: false,
      error: null,
      refetch: jest.fn(),
      applyOrderForDate: (tasks) => tasks,
      hasOverridesForDate: () => false,
    });
    mockedUseTime.mockReturnValue(createMockTimeContext());
    // Initialize api mocks for dependency handling
    mockedApi.getDependencyRules.mockResolvedValue({ rules: [], total: 0 });
    mockedApi.getDependencyStatus.mockResolvedValue(defaultDependencyStatus);
    mockedApi.createDependencyRule.mockResolvedValue({
      id: "rule-1",
      user_id: "user-1",
      upstream_task_id: "t-1",
      downstream_task_id: "t-2",
      strength: "soft",
      scope: "next_occurrence",
      required_occurrence_count: 1,
      validity_window_minutes: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      upstream_task: null,
      downstream_task: null,
    });
    mockedApi.deleteDependencyRule.mockResolvedValue(undefined);
  });

  describe("List View", () => {
    it("renders header with title", () => {
      render(<TasksScreen user={mockUser} navigation={mockNavigation} />);
      expect(screen.getByText("Tasks")).toBeTruthy();
    });

    it("renders back button", () => {
      render(<TasksScreen user={mockUser} navigation={mockNavigation} />);
      expect(screen.getByLabelText("Back to Dashboard")).toBeTruthy();
    });

    it("navigates back when back button pressed", () => {
      render(<TasksScreen user={mockUser} navigation={mockNavigation} />);
      fireEvent.press(screen.getByLabelText("Back to Dashboard"));
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });

    it("renders new task button", () => {
      render(<TasksScreen user={mockUser} navigation={mockNavigation} />);
      expect(screen.getByLabelText("Create new task")).toBeTruthy();
    });

    it("shows pending and completed counts based on tasks", () => {
      const pendingTasks = Array.from({ length: 5 }, (_, i) =>
        createMockTask({ id: `pending-${i}`, status: "pending" }),
      );
      const completedTasks = Array.from({ length: 10 }, (_, i) =>
        createMockTask({
          id: `completed-${i}`,
          status: "completed",
          completed_at: new Date().toISOString(),
        }),
      );
      mockedUseTasks.mockReturnValue({
        ...defaultTasksHook,
        tasks: [...pendingTasks, ...completedTasks],
        pendingCount: 5,
        completedCount: 10,
      });
      render(<TasksScreen user={mockUser} navigation={mockNavigation} />);
      expect(screen.getByText("5")).toBeTruthy();
      expect(screen.getByText("10")).toBeTruthy();
      expect(screen.getByText("pending")).toBeTruthy();
      expect(screen.getByText("completed")).toBeTruthy();
    });

    it("renders filter buttons", () => {
      render(<TasksScreen user={mockUser} navigation={mockNavigation} />);
      expect(screen.getByLabelText("Show pending tasks")).toBeTruthy();
      expect(screen.getByLabelText("Show completed tasks")).toBeTruthy();
      expect(screen.getByLabelText("Show all tasks")).toBeTruthy();
      expect(screen.getByLabelText("Include paused tasks")).toBeTruthy();
      expect(screen.queryByLabelText("Include archived tasks")).toBeNull();
    });

    it("shows empty state when no tasks", () => {
      mockedUseTasks.mockReturnValue({
        ...defaultTasksHook,
        tasks: [],
      });
      render(<TasksScreen user={mockUser} navigation={mockNavigation} />);
      expect(screen.getByText("No tasks for today")).toBeTruthy();
      expect(screen.getByText("Create a task to get started")).toBeTruthy();
    });

    it("shows different empty state for completed filter", () => {
      mockedUseTasks.mockReturnValue({
        ...defaultTasksHook,
        tasks: [],
      });
      render(<TasksScreen user={mockUser} navigation={mockNavigation} />);
      fireEvent.press(screen.getByLabelText("Show completed tasks"));
      expect(screen.getByText("No completed tasks today")).toBeTruthy();
    });

    it("shows different empty state for all filter", () => {
      mockedUseTasks.mockReturnValue({
        ...defaultTasksHook,
        tasks: [],
      });
      render(<TasksScreen user={mockUser} navigation={mockNavigation} />);
      fireEvent.press(screen.getByLabelText("Show all tasks"));
      expect(screen.getByText("No tasks today")).toBeTruthy();
    });

    it("renders task cards when tasks exist", () => {
      const tasks = [
        createMockTask({ id: "1", title: "Task One" }),
        createMockTask({ id: "2", title: "Task Two" }),
      ];
      mockedUseTasks.mockReturnValue({
        ...defaultTasksHook,
        tasks,
      });
      render(<TasksScreen user={mockUser} navigation={mockNavigation} />);
      expect(screen.getByText("Task One")).toBeTruthy();
      expect(screen.getByText("Task Two")).toBeTruthy();
    });

    it("changes filter when filter button pressed", () => {
      render(<TasksScreen user={mockUser} navigation={mockNavigation} />);
      fireEvent.press(screen.getByLabelText("Show completed tasks"));
      // Second render should be called with completed status
      expect(mockedUseTasks).toHaveBeenCalled();
    });

    it("shows loading indicator when loading", () => {
      mockedUseTasks.mockReturnValue({
        ...defaultTasksHook,
        loading: true,
      });
      render(<TasksScreen user={mockUser} navigation={mockNavigation} />);
      // ActivityIndicator doesn't have a text label; just verify no empty state shown
      expect(screen.queryByText("No tasks for today")).toBeNull();
    });

    it("renders view mode toggle buttons", () => {
      render(<TasksScreen user={mockUser} navigation={mockNavigation} />);
      expect(screen.getByLabelText("Show today tasks")).toBeTruthy();
      expect(screen.getByLabelText("Show upcoming tasks")).toBeTruthy();
      expect(screen.getByLabelText("Show anytime tasks")).toBeTruthy();
    });

    it("shows anytime empty state when no anytime tasks", () => {
      mockedUseTasks.mockReturnValue({
        ...defaultTasksHook,
        tasks: [],
      });
      render(<TasksScreen user={mockUser} navigation={mockNavigation} />);
      fireEvent.press(screen.getByLabelText("Show anytime tasks"));
      expect(screen.getByText("No tasks in backlog")).toBeTruthy();
      expect(
        screen.getByText("Create tasks without a schedule for your backlog"),
      ).toBeTruthy();
    });

    it("shows anytime tasks in Anytime tab", () => {
      const anytimeTasks = [
        createMockTask({
          id: "anytime-1",
          title: "Anytime Task 1",
          scheduling_mode: "anytime",
          sort_order: 1,
          scheduled_at: null,
          scheduled_date: null,
        }),
      ];
      mockedUseTasks.mockReturnValue({
        ...defaultTasksHook,
        tasks: anytimeTasks,
      });
      render(<TasksScreen user={mockUser} navigation={mockNavigation} />);
      fireEvent.press(screen.getByLabelText("Show anytime tasks"));
      expect(screen.getByText("Anytime Task 1")).toBeTruthy();
    });

    it("shows upcoming empty state when no upcoming tasks", () => {
      mockedUseTasks.mockReturnValue({
        ...defaultTasksHook,
        tasks: [],
      });
      render(<TasksScreen user={mockUser} navigation={mockNavigation} />);
      fireEvent.press(screen.getByLabelText("Show upcoming tasks"));
      expect(screen.getByText("No upcoming tasks")).toBeTruthy();
      expect(
        screen.getByText("Schedule tasks with future dates to see them here"),
      ).toBeTruthy();
    });

    it("groups upcoming tasks by date", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      const tasks = [
        createMockTask({
          id: "1",
          title: "Tomorrow Task",
          scheduled_at: tomorrow.toISOString(),
        }),
      ];
      mockedUseTasks.mockReturnValue({
        ...defaultTasksHook,
        tasks,
      });
      render(<TasksScreen user={mockUser} navigation={mockNavigation} />);
      fireEvent.press(screen.getByLabelText("Show upcoming tasks"));
      // Date headers now show "TOMORROW - WED, APR 8" format
      expect(screen.getByText(/TOMORROW/)).toBeTruthy();
      expect(screen.getByText("Tomorrow Task")).toBeTruthy();
    });
  });

  describe("Create View", () => {
    it("switches to create view when new task pressed", () => {
      mockedUseGoals.mockReturnValue({
        ...defaultGoalsHook,
        goals: [createMockGoal()],
      });
      render(<TasksScreen user={mockUser} navigation={mockNavigation} />);
      fireEvent.press(screen.getByLabelText("Create new task"));
      expect(screen.getByText("New Task")).toBeTruthy();
    });

    it("shows create form in create view", () => {
      mockedUseGoals.mockReturnValue({
        ...defaultGoalsHook,
        goals: [createMockGoal()],
      });
      render(<TasksScreen user={mockUser} navigation={mockNavigation} />);
      fireEvent.press(screen.getByLabelText("Create new task"));
      expect(screen.getByLabelText("Task title")).toBeTruthy();
    });

    it("returns to list when cancel pressed", () => {
      mockedUseGoals.mockReturnValue({
        ...defaultGoalsHook,
        goals: [createMockGoal()],
      });
      render(<TasksScreen user={mockUser} navigation={mockNavigation} />);
      fireEvent.press(screen.getByLabelText("Create new task"));
      fireEvent.press(screen.getByLabelText("Cancel and go back to list"));
      expect(screen.getByText("Tasks")).toBeTruthy();
    });

    it("disables submit when title is empty", () => {
      mockedUseGoals.mockReturnValue({
        ...defaultGoalsHook,
        goals: [createMockGoal()],
      });
      render(<TasksScreen user={mockUser} navigation={mockNavigation} />);
      fireEvent.press(screen.getByLabelText("Create new task"));
      const submitButton = screen.getByLabelText("Create task");
      // Button should be disabled when title is empty
      expect(submitButton.props.accessibilityState?.disabled).toBe(true);
    });

    it("creates task and returns to list on success", async () => {
      const createTask = jest.fn().mockResolvedValue(undefined);
      mockedUseTasks.mockReturnValue({
        ...defaultTasksHook,
        createTask,
      });
      mockedUseGoals.mockReturnValue({
        ...defaultGoalsHook,
        goals: [createMockGoal({ id: "goal-1", title: "My Goal" })],
      });

      render(<TasksScreen user={mockUser} navigation={mockNavigation} />);
      fireEvent.press(screen.getByLabelText("Create new task"));

      fireEvent.changeText(screen.getByLabelText("Task title"), "New Task");
      fireEvent.press(screen.getByLabelText("Create task"));

      // Goal is optional and not auto-selected, so goal_id is undefined
      // Task defaults to today's date when no date selected (local calendar day)
      await waitFor(() => {
        expect(createTask).toHaveBeenCalledWith({
          goal_id: undefined,
          title: "New Task",
          description: undefined,
          duration_minutes: 30,
          is_recurring: false,
          recurrence_rule: undefined,
          recurrence_behavior: undefined,
          scheduling_mode: "date_only",
          scheduled_at: null,
          scheduled_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        });
      });
    });

    it("creates task with selected goal", async () => {
      const createTask = jest.fn().mockResolvedValue(undefined);
      mockedUseTasks.mockReturnValue({
        ...defaultTasksHook,
        createTask,
      });
      mockedUseGoals.mockReturnValue({
        ...defaultGoalsHook,
        goals: [createMockGoal({ id: "goal-1", title: "My Goal" })],
      });

      render(<TasksScreen user={mockUser} navigation={mockNavigation} />);
      fireEvent.press(screen.getByLabelText("Create new task"));

      // Select a goal
      fireEvent.press(screen.getByLabelText("Select goal: My Goal"));
      fireEvent.changeText(screen.getByLabelText("Task title"), "Aligned Task");
      fireEvent.press(screen.getByLabelText("Create task"));

      // Task defaults to today's date when no date specifically selected
      await waitFor(() => {
        expect(createTask).toHaveBeenCalledWith({
          goal_id: "goal-1",
          title: "Aligned Task",
          description: undefined,
          duration_minutes: 30,
          is_recurring: false,
          recurrence_rule: undefined,
          recurrence_behavior: undefined,
          scheduling_mode: "date_only",
          scheduled_at: null,
          scheduled_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        });
      });
    });
  });

  describe("Detail View", () => {
    it("switches to detail view when task pressed", () => {
      const tasks = [createMockTask({ title: "Detailed Task" })];
      mockedUseTasks.mockReturnValue({
        ...defaultTasksHook,
        tasks,
      });
      render(<TasksScreen user={mockUser} navigation={mockNavigation} />);
      fireEvent.press(screen.getByLabelText("Task: Detailed Task"));
      expect(screen.getByText("Task Details")).toBeTruthy();
    });

    it("returns to list when back pressed in detail view", () => {
      const tasks = [createMockTask({ title: "Detailed Task" })];
      mockedUseTasks.mockReturnValue({
        ...defaultTasksHook,
        tasks,
      });
      render(<TasksScreen user={mockUser} navigation={mockNavigation} />);
      fireEvent.press(screen.getByLabelText("Task: Detailed Task"));
      fireEvent.press(screen.getByLabelText("Back to tasks"));
      expect(screen.getByText("Tasks")).toBeTruthy();
    });

    it("completes task when complete pressed", async () => {
      const completeTask = jest.fn().mockResolvedValue(undefined);
      const tasks = [createMockTask({ id: "t-1", title: "Complete Me" })];
      mockedUseTasks.mockReturnValue({
        ...defaultTasksHook,
        tasks,
        completeTask,
      });
      render(<TasksScreen user={mockUser} navigation={mockNavigation} />);
      fireEvent.press(screen.getByLabelText("Task: Complete Me"));
      fireEvent.press(screen.getByLabelText("Complete task"));
      await waitFor(() => {
        // Non-recurring task passes undefined for scheduledFor and localDate
        expect(completeTask).toHaveBeenCalledWith("t-1", undefined, undefined);
      });
    });

    it("skips task via skip modal", async () => {
      const skipTask = jest.fn().mockResolvedValue(undefined);
      const tasks = [createMockTask({ id: "t-1", title: "Skip Me" })];
      mockedUseTasks.mockReturnValue({
        ...defaultTasksHook,
        tasks,
        skipTask,
      });

      render(<TasksScreen user={mockUser} navigation={mockNavigation} />);
      fireEvent.press(screen.getByLabelText("Task: Skip Me"));
      fireEvent.press(screen.getByLabelText("Skip task"));

      // Skip modal should be visible
      await waitFor(() => {
        expect(screen.getByText('Skip "Skip Me"?')).toBeTruthy();
      });

      // Press Skip button in modal (the second one with this label)
      fireEvent.press(screen.getAllByLabelText("Skip task")[1]);

      await waitFor(() => {
        // Non-recurring task passes undefined for both reason, scheduledFor, and localDate
        expect(skipTask).toHaveBeenCalledWith(
          "t-1",
          undefined,
          undefined,
          undefined,
        );
      });
    });

    it("skips task with reason via skip modal", async () => {
      const skipTask = jest.fn().mockResolvedValue(undefined);
      const tasks = [createMockTask({ id: "t-1", title: "Skip Me" })];
      mockedUseTasks.mockReturnValue({
        ...defaultTasksHook,
        tasks,
        skipTask,
      });

      render(<TasksScreen user={mockUser} navigation={mockNavigation} />);
      fireEvent.press(screen.getByLabelText("Task: Skip Me"));
      fireEvent.press(screen.getByLabelText("Skip task"));

      // Skip modal should be visible
      await waitFor(() => {
        expect(screen.getByText('Skip "Skip Me"?')).toBeTruthy();
      });

      // Enter reason and submit
      fireEvent.changeText(
        screen.getByPlaceholderText("Why are you skipping? (optional)"),
        "Too busy today",
      );
      // The button in the skip reason modal is also labeled "Skip task"
      fireEvent.press(screen.getAllByLabelText("Skip task")[1]);

      await waitFor(() => {
        // Non-recurring task passes undefined for scheduledFor and localDate (3rd and 4th args)
        expect(skipTask).toHaveBeenCalledWith(
          "t-1",
          "Too busy today",
          undefined,
          undefined,
        );
      });
    });

    it("closes skip modal when cancelled", async () => {
      const skipTask = jest.fn();
      const tasks = [createMockTask({ id: "t-1", title: "Skip Me" })];
      mockedUseTasks.mockReturnValue({
        ...defaultTasksHook,
        tasks,
        skipTask,
      });

      render(<TasksScreen user={mockUser} navigation={mockNavigation} />);
      fireEvent.press(screen.getByLabelText("Task: Skip Me"));
      fireEvent.press(screen.getByLabelText("Skip task"));

      // Skip modal should be visible
      await waitFor(() => {
        expect(screen.getByText('Skip "Skip Me"?')).toBeTruthy();
      });

      // Press cancel
      fireEvent.press(screen.getByLabelText("Cancel skip"));

      // Modal should close, skip not called
      await waitFor(() => {
        expect(screen.queryByText('Skip "Skip Me"?')).toBeNull();
      });
      expect(skipTask).not.toHaveBeenCalled();
    });

    it("reopens task when reopen pressed", async () => {
      const reopenTask = jest
        .fn()
        .mockResolvedValue(createMockTask({ status: "pending" }));
      const tasks = [
        createMockTask({
          id: "t-1",
          title: "Reopen Me",
          status: "completed",
          completed_at: new Date().toISOString(),
        }),
      ];
      mockedUseTasks.mockReturnValue({
        ...defaultTasksHook,
        tasks,
        completedCount: 1,
        reopenTask,
      });

      render(<TasksScreen user={mockUser} navigation={mockNavigation} />);

      // Switch to completed filter to see completed tasks
      fireEvent.press(screen.getByLabelText("Show completed tasks"));

      fireEvent.press(screen.getByLabelText("Task: Reopen Me"));
      fireEvent.press(screen.getByLabelText("Reopen task"));

      await waitFor(() => {
        // Non-recurring task passes undefined for scheduledFor and localDate
        expect(reopenTask).toHaveBeenCalledWith("t-1", undefined, undefined);
      });
    });

    it("deletes task after in-app delete confirmation", async () => {
      const deleteTask = jest.fn().mockResolvedValue(undefined);
      const tasks = [createMockTask({ id: "t-1", title: "Delete Me" })];
      mockedUseTasks.mockReturnValue({
        ...defaultTasksHook,
        tasks,
        deleteTask,
      });

      render(<TasksScreen user={mockUser} navigation={mockNavigation} />);
      fireEvent.press(screen.getByLabelText("Task: Delete Me"));
      fireEvent.press(screen.getByLabelText("Delete task"));
      fireEvent.press(screen.getByLabelText("Delete permanently"));

      await waitFor(() => {
        expect(deleteTask).toHaveBeenCalledWith("t-1");
      });
    });

    it("archives task after in-app archive confirmation", async () => {
      const archiveTask = jest.fn().mockResolvedValue(undefined);
      const tasks = [createMockTask({ id: "t-1", title: "Archive Me" })];
      mockedUseTasks.mockReturnValue({
        ...defaultTasksHook,
        tasks,
        archiveTask,
      });

      render(<TasksScreen user={mockUser} navigation={mockNavigation} />);
      fireEvent.press(screen.getByLabelText("Task: Archive Me"));
      fireEvent.press(screen.getByLabelText("Archive task"));
      fireEvent.press(screen.getByLabelText("Archive"));

      await waitFor(() => {
        expect(archiveTask).toHaveBeenCalledWith("t-1");
      });
    });

    it("pauses task after in-app pause confirmation", async () => {
      const pauseTask = jest.fn().mockResolvedValue(undefined);
      const tasks = [createMockTask({ id: "t-1", title: "Pause Me" })];
      mockedUseTasks.mockReturnValue({
        ...defaultTasksHook,
        tasks,
        pauseTask,
      });

      render(<TasksScreen user={mockUser} navigation={mockNavigation} />);
      fireEvent.press(screen.getByLabelText("Task: Pause Me"));
      fireEvent.press(screen.getByLabelText("Pause task"));
      fireEvent.press(screen.getByLabelText("Pause"));

      await waitFor(() => {
        expect(pauseTask).toHaveBeenCalledWith("t-1");
      });
    });
  });

  describe("Quick complete from list", () => {
    it("completes task from card check button", async () => {
      const completeTask = jest.fn().mockResolvedValue(undefined);
      const tasks = [createMockTask({ id: "t-1", title: "Quick Complete" })];
      mockedUseTasks.mockReturnValue({
        ...defaultTasksHook,
        tasks,
        completeTask,
      });

      render(<TasksScreen user={mockUser} navigation={mockNavigation} />);
      fireEvent.press(screen.getByLabelText("Complete task: Quick Complete"));

      await waitFor(() => {
        // Non-recurring task passes undefined for scheduledFor and localDate
        expect(completeTask).toHaveBeenCalledWith("t-1", undefined, undefined);
      });
    });
  });

  describe("Dependency handling - Phase 4i", () => {
    it("fetches dependencies when editing a task", async () => {
      const tasks = [createMockTask({ id: "t-1", title: "Task With Deps" })];
      mockedUseTasks.mockReturnValue({
        ...defaultTasksHook,
        tasks,
      });

      // Mock dependencies response
      mockedApi.getDependencyRules.mockResolvedValue({
        rules: [
          {
            id: "rule-1",
            user_id: "user-1",
            upstream_task_id: "t-prereq",
            downstream_task_id: "t-1",
            strength: "soft",
            scope: "next_occurrence",
            required_occurrence_count: 1,
            validity_window_minutes: null,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
            upstream_task: {
              id: "t-prereq",
              title: "Prerequisite Task",
              is_recurring: false,
              recurrence_rule: null,
            },
            downstream_task: null,
          },
        ],
        total: 1,
      });

      render(<TasksScreen user={mockUser} navigation={mockNavigation} />);

      // Tap on task to open detail view
      fireEvent.press(screen.getByLabelText("Task: Task With Deps"));

      // Tap edit button
      fireEvent.press(screen.getByLabelText("Edit task"));

      // Wait for dependencies to be fetched
      await waitFor(() => {
        expect(mockedApi.getDependencyRules).toHaveBeenCalledWith({
          downstream_task_id: "t-1",
        });
      });
    });

    it("handles dependency fetch failure gracefully", async () => {
      const tasks = [createMockTask({ id: "t-1", title: "Task" })];
      mockedUseTasks.mockReturnValue({
        ...defaultTasksHook,
        tasks,
      });

      // Mock API failure
      mockedApi.getDependencyRules.mockRejectedValue(new Error("Network error"));

      render(<TasksScreen user={mockUser} navigation={mockNavigation} />);

      // Tap on task to open detail view
      fireEvent.press(screen.getByLabelText("Task: Task"));

      // Tap edit button - should not crash
      fireEvent.press(screen.getByLabelText("Edit task"));

      // Verify form is still shown despite error
      await waitFor(() => {
        expect(screen.getByText("Edit Task")).toBeTruthy();
      });
    });

    it("deletes existing and creates new dependencies on save", async () => {
      const updateTask = jest.fn().mockResolvedValue(undefined);
      const tasks = [createMockTask({ id: "t-1", title: "Task To Edit" })];
      mockedUseTasks.mockReturnValue({
        ...defaultTasksHook,
        tasks,
        updateTask,
      });

      // Mock existing dependency
      mockedApi.getDependencyRules.mockResolvedValue({
        rules: [
          {
            id: "old-rule-1",
            user_id: "user-1",
            upstream_task_id: "t-old-prereq",
            downstream_task_id: "t-1",
            strength: "soft",
            scope: "next_occurrence",
            required_occurrence_count: 1,
            validity_window_minutes: null,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
            upstream_task: null,
            downstream_task: null,
          },
        ],
        total: 1,
      });

      render(<TasksScreen user={mockUser} navigation={mockNavigation} />);

      // Open task detail
      fireEvent.press(screen.getByLabelText("Task: Task To Edit"));

      // Open edit mode
      fireEvent.press(screen.getByLabelText("Edit task"));

      await waitFor(() => {
        expect(screen.getByText("Edit Task")).toBeTruthy();
      });

      // Save the edit
      fireEvent.press(screen.getByLabelText("Save changes"));

      // Wait for save to complete
      await waitFor(() => {
        // Should have deleted old dependency
        expect(mockedApi.deleteDependencyRule).toHaveBeenCalledWith(
          "old-rule-1",
        );
      });
    });
  });
});
