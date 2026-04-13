/**
 * Tests for GoalDetailView component
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { GoalDetailView } from "../GoalDetailView";
import type { Goal, GoalStatus } from "../../../types";

// Mock styles
jest.mock("../../../screens/styles/goalsScreenStyles", () => ({
  styles: {
    container: {},
    header: {},
    backButton: {},
    headerTitle: {},
    deleteButton: {},
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
  },
  getStatusColor: (status: string) => {
    const colors: Record<string, string> = {
      not_started: "#888",
      in_progress: "#3B82F6",
      completed: "#10B981",
      abandoned: "#EF4444",
    };
    return colors[status] || "#888";
  },
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
  completed_at: null,
  total_time_minutes: 0,
  completed_time_minutes: 0,
  priorities: [],
  ...overrides,
});

describe("GoalDetailView", () => {
  const mockOnBack = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnStatusChange = jest.fn();
  const mockOnPause = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders goal title", () => {
    const goal = createMockGoal({ title: "My Goal Title" });
    render(
      <GoalDetailView
        goal={goal}
        onBack={mockOnBack}
        onDelete={mockOnDelete}
        onStatusChange={mockOnStatusChange}
        onPause={mockOnPause}
      />,
    );
    expect(screen.getByText("My Goal Title")).toBeTruthy();
  });

  it("renders header with back and delete buttons", () => {
    const goal = createMockGoal();
    render(
      <GoalDetailView
        goal={goal}
        onBack={mockOnBack}
        onDelete={mockOnDelete}
        onStatusChange={mockOnStatusChange}
      />,
    );
    expect(screen.getByText("← Goals")).toBeTruthy();
    expect(screen.getByText("Goal Detail")).toBeTruthy();
    expect(screen.getByText("Delete")).toBeTruthy();
  });

  it("calls onBack when back button pressed", () => {
    const goal = createMockGoal();
    render(
      <GoalDetailView
        goal={goal}
        onBack={mockOnBack}
        onDelete={mockOnDelete}
        onStatusChange={mockOnStatusChange}
      />,
    );
    fireEvent.press(screen.getByLabelText("Back to goals list"));
    expect(mockOnBack).toHaveBeenCalled();
  });

  it("calls onDelete when delete button pressed", () => {
    const goal = createMockGoal();
    render(
      <GoalDetailView
        goal={goal}
        onBack={mockOnBack}
        onDelete={mockOnDelete}
        onStatusChange={mockOnStatusChange}
      />,
    );
    fireEvent.press(screen.getByLabelText("Delete goal"));
    expect(mockOnDelete).toHaveBeenCalledWith(goal);
  });

  it("renders status badge with label", () => {
    const goal = createMockGoal({ status: "in_progress" });
    render(
      <GoalDetailView
        goal={goal}
        onBack={mockOnBack}
        onDelete={mockOnDelete}
        onStatusChange={mockOnStatusChange}
      />,
    );
    // "In Progress" appears both in badge and status button - verify at least 2 instances
    expect(screen.getAllByText("In Progress").length).toBeGreaterThanOrEqual(2);
  });

  it("renders description when provided", () => {
    const goal = createMockGoal({ description: "This is the description" });
    render(
      <GoalDetailView
        goal={goal}
        onBack={mockOnBack}
        onDelete={mockOnDelete}
        onStatusChange={mockOnStatusChange}
      />,
    );
    expect(screen.getByText("Description")).toBeTruthy();
    expect(screen.getByText("This is the description")).toBeTruthy();
  });

  it("does not render description section when null", () => {
    const goal = createMockGoal({ description: null });
    render(
      <GoalDetailView
        goal={goal}
        onBack={mockOnBack}
        onDelete={mockOnDelete}
        onStatusChange={mockOnStatusChange}
      />,
    );
    expect(screen.queryByText("Description")).toBeNull();
  });

  it("renders target date when provided", () => {
    const goal = createMockGoal({ target_date: "2024-06-30" });
    render(
      <GoalDetailView
        goal={goal}
        onBack={mockOnBack}
        onDelete={mockOnDelete}
        onStatusChange={mockOnStatusChange}
      />,
    );
    expect(screen.getByText("Target Date")).toBeTruthy();
    expect(screen.getByText("2024-06-30")).toBeTruthy();
  });

  it("does not render target date when null", () => {
    const goal = createMockGoal({ target_date: null });
    render(
      <GoalDetailView
        goal={goal}
        onBack={mockOnBack}
        onDelete={mockOnDelete}
        onStatusChange={mockOnStatusChange}
      />,
    );
    expect(screen.queryByText("Target Date")).toBeNull();
  });

  it("renders linked priorities", () => {
    const goal = createMockGoal({
      priorities: [
        { id: "p1", title: "Fitness" },
        { id: "p2", title: "Health" },
      ] as Goal["priorities"],
    });
    render(
      <GoalDetailView
        goal={goal}
        onBack={mockOnBack}
        onDelete={mockOnDelete}
        onStatusChange={mockOnStatusChange}
      />,
    );
    expect(screen.getByText("Linked Priorities")).toBeTruthy();
    expect(screen.getByText("• Fitness")).toBeTruthy();
    expect(screen.getByText("• Health")).toBeTruthy();
  });

  it("does not render priorities section when empty", () => {
    const goal = createMockGoal({ priorities: [] });
    render(
      <GoalDetailView
        goal={goal}
        onBack={mockOnBack}
        onDelete={mockOnDelete}
        onStatusChange={mockOnStatusChange}
      />,
    );
    expect(screen.queryByText("Linked Priorities")).toBeNull();
  });

  it("renders all status change buttons", () => {
    const goal = createMockGoal();
    render(
      <GoalDetailView
        goal={goal}
        onBack={mockOnBack}
        onDelete={mockOnDelete}
        onStatusChange={mockOnStatusChange}
      />,
    );
    expect(screen.getByText("Change Status")).toBeTruthy();
    expect(screen.getByLabelText("Set status to Not Started")).toBeTruthy();
    expect(screen.getByLabelText("Set status to In Progress")).toBeTruthy();
    expect(screen.getByLabelText("Set status to Completed")).toBeTruthy();
    expect(screen.getByLabelText("Set status to Abandoned")).toBeTruthy();
  });

  it("calls onStatusChange when status button pressed", () => {
    const goal = createMockGoal({ status: "not_started" });
    render(
      <GoalDetailView
        goal={goal}
        onBack={mockOnBack}
        onDelete={mockOnDelete}
        onStatusChange={mockOnStatusChange}
      />,
    );
    fireEvent.press(screen.getByLabelText("Set status to In Progress"));
    expect(mockOnStatusChange).toHaveBeenCalledWith(goal, "in_progress");
  });

  it("renders warning when has_incomplete_breakdown", () => {
    const goal = createMockGoal({ has_incomplete_breakdown: true });
    render(
      <GoalDetailView
        goal={goal}
        onBack={mockOnBack}
        onDelete={mockOnDelete}
        onStatusChange={mockOnStatusChange}
      />,
    );
    expect(
      screen.getByText(
        "⚠️ Progress may be inaccurate — this goal doesn't have tasks defined yet.",
      ),
    ).toBeTruthy();
  });

  it("does not render warning when breakdown is complete", () => {
    const goal = createMockGoal({ has_incomplete_breakdown: false });
    render(
      <GoalDetailView
        goal={goal}
        onBack={mockOnBack}
        onDelete={mockOnDelete}
        onStatusChange={mockOnStatusChange}
        onPause={mockOnPause}
      />,
    );
    expect(screen.queryByText(/Progress may be inaccurate/)).toBeNull();
  });

  it("shows pause action for active goals", () => {
    const goal = createMockGoal({ record_state: "active" });
    render(
      <GoalDetailView
        goal={goal}
        onBack={mockOnBack}
        onDelete={mockOnDelete}
        onStatusChange={mockOnStatusChange}
        onPause={mockOnPause}
      />,
    );
    fireEvent.press(screen.getByLabelText("Pause goal"));
    expect(mockOnPause).toHaveBeenCalledWith(goal);
  });
});
