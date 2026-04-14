/**
 * Tests for GoalCard component
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { GoalCard } from "../GoalCard";
import type { Goal, GoalStatus } from "../../../types";

// Mock styles
jest.mock("../../../screens/styles/goalsScreenStyles", () => ({
  styles: {
    goalCard: {},
    goalHeader: {},
    goalTitle: {},
    badgeColumn: {},
    recordStateBadge: {},
    recordStateText: {},
    statusBadge: {},
    statusText: {},
    goalDescription: {},
    targetDate: {},
    warningText: {},
    prioritiesRow: {},
    prioritiesLabel: {},
    prioritiesText: {},
  },
  getStatusColor: (status: string) => {
    const colors: Record<string, string> = {
      not_started: "#888",
      in_progress: "#3B82F6",
      completed: "#10B981",
    };
    return colors[status] || "#888";
  },
  getStatusLabel: (status: string) => {
    const labels: Record<string, string> = {
      not_started: "Not Started",
      in_progress: "In Progress",
      completed: "Completed",
    };
    return labels[status] || status;
  },
  getRecordStateColor: () => "#888",
  getRecordStateLabel: (recordState: string | undefined) => {
    const state = recordState ?? "active";
    if (state === "paused") return "Paused";
    if (state === "archived") return "Archived";
    return "Active";
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
  is_aligned_with_priorities: true,
  priorities: [],
  ...overrides,
});

describe("GoalCard", () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders goal title", () => {
    const goal = createMockGoal({ title: "My Important Goal" });
    render(<GoalCard goal={goal} onPress={mockOnPress} />);
    expect(screen.getByText("My Important Goal")).toBeTruthy();
  });

  it("renders status badge with correct label", () => {
    const goal = createMockGoal({ status: "in_progress" });
    render(<GoalCard goal={goal} onPress={mockOnPress} />);
    expect(screen.getByText("In Progress")).toBeTruthy();
  });

  it("renders record state badge Active when omitted", () => {
    const goal = createMockGoal();
    render(<GoalCard goal={goal} onPress={mockOnPress} />);
    expect(screen.getByText("Active")).toBeTruthy();
    expect(
      screen.getByLabelText("Record state: Active"),
    ).toBeTruthy();
  });

  it("renders record state badge for paused and archived", () => {
    const { rerender } = render(
      <GoalCard
        goal={createMockGoal({ record_state: "paused" })}
        onPress={mockOnPress}
      />,
    );
    expect(screen.getByText("Paused")).toBeTruthy();
    rerender(
      <GoalCard
        goal={createMockGoal({ id: "g2", record_state: "archived" })}
        onPress={mockOnPress}
      />,
    );
    expect(screen.getByText("Archived")).toBeTruthy();
  });

  it("renders description when provided", () => {
    const goal = createMockGoal({ description: "This is what it's about" });
    render(<GoalCard goal={goal} onPress={mockOnPress} />);
    expect(screen.getByText("This is what it's about")).toBeTruthy();
  });

  it("does not render description when null", () => {
    const goal = createMockGoal({ description: null });
    render(<GoalCard goal={goal} onPress={mockOnPress} />);
    expect(screen.queryByText(/This is what/)).toBeNull();
  });

  it("renders target date when provided", () => {
    const goal = createMockGoal({ target_date: "2024-12-31" });
    render(<GoalCard goal={goal} onPress={mockOnPress} />);
    expect(screen.getByText("Target: 2024-12-31")).toBeTruthy();
  });

  it("does not render target date when null", () => {
    const goal = createMockGoal({ target_date: null });
    render(<GoalCard goal={goal} onPress={mockOnPress} />);
    expect(screen.queryByText(/Target:/)).toBeNull();
  });

  it("renders warning when has_incomplete_breakdown and no progress", () => {
    const goal = createMockGoal({
      has_incomplete_breakdown: true,
      progress_cached: 0,
    });
    render(<GoalCard goal={goal} onPress={mockOnPress} />);
    expect(screen.getByText("⚠️ No tasks defined yet")).toBeTruthy();
  });

  it("does not render warning when has progress", () => {
    const goal = createMockGoal({
      has_incomplete_breakdown: true,
      progress_cached: 50,
    });
    render(<GoalCard goal={goal} onPress={mockOnPress} />);
    expect(screen.queryByText(/No tasks defined/)).toBeNull();
  });

  it("renders linked priorities", () => {
    const goal = createMockGoal({
      priorities: [
        { id: "p1", title: "Health Priority" },
        { id: "p2", title: "Career Priority" },
      ] as Goal["priorities"],
    });
    render(<GoalCard goal={goal} onPress={mockOnPress} />);
    expect(screen.getByText("Priorities:")).toBeTruthy();
    expect(screen.getByText("Health Priority, Career Priority")).toBeTruthy();
  });

  it("does not render priorities section when empty", () => {
    const goal = createMockGoal({ priorities: [] });
    render(<GoalCard goal={goal} onPress={mockOnPress} />);
    expect(screen.queryByText("Priorities:")).toBeNull();
  });

  it("shows alignment warning when not linked to priorities", () => {
    const goal = createMockGoal({
      is_aligned_with_priorities: false,
      priorities: [],
    });
    render(<GoalCard goal={goal} onPress={mockOnPress} />);
    expect(
      screen.getByText("⚠️ This goal isn't linked to any priority"),
    ).toBeTruthy();
  });

  it("calls onPress with goal when pressed", () => {
    const goal = createMockGoal();
    render(<GoalCard goal={goal} onPress={mockOnPress} />);
    fireEvent.press(screen.getByLabelText("Goal: Test Goal"));
    expect(mockOnPress).toHaveBeenCalledWith(goal);
  });

  it("has correct accessibility label", () => {
    const goal = createMockGoal({ title: "My Goal" });
    render(<GoalCard goal={goal} onPress={mockOnPress} />);
    expect(screen.getByLabelText("Goal: My Goal")).toBeTruthy();
  });

  it("renders all status types correctly", () => {
    const statuses: GoalStatus[] = [
      "not_started",
      "in_progress",
      "completed",
    ];
    const expectedLabels = [
      "Not Started",
      "In Progress",
      "Completed",
      "Abandoned",
    ];

    statuses.forEach((status, index) => {
      const goal = createMockGoal({ status });
      const { unmount } = render(
        <GoalCard goal={goal} onPress={mockOnPress} />,
      );
      expect(screen.getByText(expectedLabels[index])).toBeTruthy();
      unmount();
    });
  });
});
