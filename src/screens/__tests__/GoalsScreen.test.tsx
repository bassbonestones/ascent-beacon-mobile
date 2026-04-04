/**
 * Tests for GoalsScreen
 */

import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import { Alert } from "react-native";
import GoalsScreen from "../GoalsScreen";
import type { User, Goal, RootStackParamList, GoalStatus } from "../../types";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

// Mock styles
jest.mock("../styles/goalsScreenStyles", () => ({
  styles: {
    container: {},
    header: {},
    headerTitle: {},
    addButton: {},
    addButtonText: {},
    filterRow: {},
    filterToggle: {},
    filterToggleActive: {},
    filterToggleText: {},
    filterToggleTextActive: {},
    loader: {},
    emptyState: {},
    emptyStateTitle: {},
    emptyStateText: {},
    listContent: {},
    backButton: {},
    formContainer: {},
    label: {},
    input: {},
    textArea: {},
    submitButton: {},
    submitButtonDisabled: {},
    submitButtonText: {},
    goalCard: {},
    goalHeader: {},
    goalTitle: {},
    statusBadge: {},
    statusText: {},
    goalDescription: {},
    targetDate: {},
    warningText: {},
    prioritiesRow: {},
    prioritiesLabel: {},
    prioritiesText: {},
    detailContainer: {},
    detailTitle: {},
    statusBadgeLarge: {},
    statusTextLarge: {},
    detailSection: {},
    detailLabel: {},
    detailText: {},
    priorityItem: {},
    statusButtons: {},
    statusButton: {},
    statusButtonActive: {},
    statusButtonText: {},
    warningBox: {},
    warningBoxText: {},
    deleteButton: {},
  },
  getStatusColor: (status: string) => "#888",
  getStatusLabel: (status: string) => {
    const labels: Record<string, string> = {
      not_started: "Not Started",
      in_progress: "In Progress",
      completed: "Completed",
      abandoned: "Abandoned",
    };
    return labels[status] || status;
  },
}));

// Mock useGoals hook
const mockCreateGoal = jest.fn();
const mockUpdateGoalStatus = jest.fn();
const mockDeleteGoal = jest.fn();
const mockRefetch = jest.fn();

jest.mock("../../hooks/useGoals", () => ({
  useGoals: jest.fn(() => ({
    goals: [],
    loading: false,
    error: null,
    refetch: mockRefetch,
    createGoal: mockCreateGoal,
    updateGoalStatus: mockUpdateGoalStatus,
    deleteGoal: mockDeleteGoal,
  })),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useGoals } = require("../../hooks/useGoals");

// Mock Alert
jest.spyOn(Alert, "alert");

// Helper to create mock user
const createMockUser = (): User => ({
  id: "user-1",
  display_name: "Test User",
  primary_email: "test@example.com",
  is_email_verified: true,
  created_at: "2024-01-01T00:00:00Z",
});

// Helper to create mock navigation
const createMockNavigation =
  (): NativeStackNavigationProp<RootStackParamList> =>
    ({
      navigate: jest.fn(),
    }) as unknown as NativeStackNavigationProp<RootStackParamList>;

// Helper to create mock goal
const createMockGoal = (overrides: Partial<Goal> = {}): Goal => ({
  id: "goal-1",
  user_id: "user-1",
  title: "Test Goal",
  description: null,
  status: "not_started" as GoalStatus,
  target_date: null,
  progress_cached: 0,
  has_incomplete_breakdown: false,
  parent_goal_id: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  priorities: [],
  children: [],
  ...overrides,
});

describe("GoalsScreen", () => {
  const mockUser = createMockUser();
  const mockNavigation = createMockNavigation();

  beforeEach(() => {
    jest.clearAllMocks();
    (useGoals as jest.Mock).mockReturnValue({
      goals: [],
      loading: false,
      error: null,
      refetch: mockRefetch,
      createGoal: mockCreateGoal,
      updateGoalStatus: mockUpdateGoalStatus,
      deleteGoal: mockDeleteGoal,
    });
  });

  describe("List View", () => {
    it("renders header with title", () => {
      render(<GoalsScreen user={mockUser} navigation={mockNavigation} />);
      expect(screen.getByText("Goals")).toBeTruthy();
    });

    it("renders new goal button", () => {
      render(<GoalsScreen user={mockUser} navigation={mockNavigation} />);
      expect(screen.getByLabelText("Create new goal")).toBeTruthy();
    });

    it("renders show completed toggle", () => {
      render(<GoalsScreen user={mockUser} navigation={mockNavigation} />);
      expect(screen.getByText("Show Completed")).toBeTruthy();
    });

    it("shows empty state when no goals", () => {
      render(<GoalsScreen user={mockUser} navigation={mockNavigation} />);
      expect(screen.getByText("No goals yet")).toBeTruthy();
      expect(
        screen.getByText(
          "Create your first goal to start tracking your progress",
        ),
      ).toBeTruthy();
    });

    it("shows loading indicator when loading", () => {
      (useGoals as jest.Mock).mockReturnValue({
        goals: [],
        loading: true,
        error: null,
        refetch: mockRefetch,
        createGoal: mockCreateGoal,
        updateGoalStatus: mockUpdateGoalStatus,
        deleteGoal: mockDeleteGoal,
      });

      render(<GoalsScreen user={mockUser} navigation={mockNavigation} />);
      // When loading, empty state should not be shown
      expect(screen.queryByText("No goals yet")).toBeNull();
    });

    it("renders goal cards when goals exist", () => {
      const goals = [
        createMockGoal({ id: "g1", title: "Goal 1" }),
        createMockGoal({ id: "g2", title: "Goal 2" }),
      ];
      (useGoals as jest.Mock).mockReturnValue({
        goals,
        loading: false,
        error: null,
        refetch: mockRefetch,
        createGoal: mockCreateGoal,
        updateGoalStatus: mockUpdateGoalStatus,
        deleteGoal: mockDeleteGoal,
      });

      render(<GoalsScreen user={mockUser} navigation={mockNavigation} />);
      expect(screen.getByText("Goal 1")).toBeTruthy();
      expect(screen.getByText("Goal 2")).toBeTruthy();
    });

    it("navigates to create view when new goal button pressed", () => {
      render(<GoalsScreen user={mockUser} navigation={mockNavigation} />);
      fireEvent.press(screen.getByLabelText("Create new goal"));
      expect(screen.getByText("New Goal")).toBeTruthy();
    });

    it("toggles show completed filter", () => {
      render(<GoalsScreen user={mockUser} navigation={mockNavigation} />);

      // Initially showing "Show Completed"
      expect(screen.getByText("Show Completed")).toBeTruthy();

      // Toggle to show completed
      fireEvent.press(screen.getByLabelText("Show completed goals"));
      expect(screen.getByText("✓ Showing Completed")).toBeTruthy();
    });

    it("navigates to detail view when goal pressed", () => {
      const goal = createMockGoal({ title: "My Goal" });
      (useGoals as jest.Mock).mockReturnValue({
        goals: [goal],
        loading: false,
        error: null,
        refetch: mockRefetch,
        createGoal: mockCreateGoal,
        updateGoalStatus: mockUpdateGoalStatus,
        deleteGoal: mockDeleteGoal,
      });

      render(<GoalsScreen user={mockUser} navigation={mockNavigation} />);
      fireEvent.press(screen.getByLabelText("Goal: My Goal"));
      expect(screen.getByText("Goal Detail")).toBeTruthy();
    });
  });

  describe("Create View", () => {
    beforeEach(() => {
      render(<GoalsScreen user={mockUser} navigation={mockNavigation} />);
      fireEvent.press(screen.getByLabelText("Create new goal"));
    });

    it("renders create form", () => {
      expect(screen.getByText("New Goal")).toBeTruthy();
      expect(screen.getByText("Title *")).toBeTruthy();
      expect(screen.getByText("Description (optional)")).toBeTruthy();
      expect(screen.getByLabelText("Create goal")).toBeTruthy();
    });

    it("has disabled create button when title is empty", () => {
      // The create button should be disabled when title is empty
      const createButton = screen.getByLabelText("Create goal");
      expect(
        createButton.props.accessibilityState?.disabled ||
          createButton.props.disabled,
      ).toBeTruthy();
    });

    it("calls createGoal with title and description", async () => {
      fireEvent.changeText(screen.getByLabelText("Goal title"), "My New Goal");
      fireEvent.changeText(
        screen.getByLabelText("Goal description"),
        "Description here",
      );
      fireEvent.press(screen.getByLabelText("Create goal"));

      await waitFor(() => {
        expect(mockCreateGoal).toHaveBeenCalledWith({
          title: "My New Goal",
          description: "Description here",
        });
      });
    });

    it("calls createGoal with undefined description when empty", async () => {
      fireEvent.changeText(screen.getByLabelText("Goal title"), "My New Goal");
      fireEvent.press(screen.getByLabelText("Create goal"));

      await waitFor(() => {
        expect(mockCreateGoal).toHaveBeenCalledWith({
          title: "My New Goal",
          description: undefined,
        });
      });
    });

    it("goes back to list when back button pressed", () => {
      fireEvent.press(screen.getByLabelText("Cancel and go back"));
      expect(screen.getByText("Goals")).toBeTruthy();
      expect(screen.queryByText("New Goal")).toBeNull();
    });
  });

  describe("Detail View", () => {
    const goal = createMockGoal({
      title: "Detail Goal",
      status: "not_started",
    });

    beforeEach(() => {
      (useGoals as jest.Mock).mockReturnValue({
        goals: [goal],
        loading: false,
        error: null,
        refetch: mockRefetch,
        createGoal: mockCreateGoal,
        updateGoalStatus: mockUpdateGoalStatus,
        deleteGoal: mockDeleteGoal,
      });

      render(<GoalsScreen user={mockUser} navigation={mockNavigation} />);
      fireEvent.press(screen.getByLabelText("Goal: Detail Goal"));
    });

    it("renders detail view with goal title", () => {
      expect(screen.getByText("Goal Detail")).toBeTruthy();
      expect(screen.getByText("Detail Goal")).toBeTruthy();
    });

    it("goes back to list when back button pressed", () => {
      fireEvent.press(screen.getByLabelText("Go back to goals list"));
      expect(screen.getByText("Goals")).toBeTruthy();
      expect(screen.queryByText("Goal Detail")).toBeNull();
    });

    it("calls updateGoalStatus when status changed", async () => {
      fireEvent.press(screen.getByLabelText("Set status to In Progress"));

      await waitFor(() => {
        expect(mockUpdateGoalStatus).toHaveBeenCalledWith(
          goal.id,
          "in_progress",
        );
      });
    });

    it("shows delete confirmation when delete pressed", () => {
      fireEvent.press(screen.getByLabelText("Delete goal"));
      expect(Alert.alert).toHaveBeenCalledWith(
        "Delete Goal",
        'Are you sure you want to delete "Detail Goal"?',
        expect.arrayContaining([
          expect.objectContaining({ text: "Cancel" }),
          expect.objectContaining({ text: "Delete" }),
        ]),
      );
    });

    it("calls deleteGoal when delete confirmed", async () => {
      fireEvent.press(screen.getByLabelText("Delete goal"));

      // Find and call the delete callback
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const deleteButton = alertCall[2].find(
        (btn: { text: string }) => btn.text === "Delete",
      );
      await deleteButton.onPress();

      await waitFor(() => {
        expect(mockDeleteGoal).toHaveBeenCalledWith(goal.id);
      });
    });
  });
});
