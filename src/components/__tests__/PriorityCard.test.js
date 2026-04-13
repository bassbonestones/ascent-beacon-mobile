/**
 * Tests for PriorityCard component
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import PriorityCard from "../priorities/PriorityCard";

// Mock styles
jest.mock("../../screens/styles/prioritiesScreenStyles", () => ({
  styles: {
    priorityCard: {},
    priorityCardAnchored: {},
    priorityCardContent: {},
    priorityHeader: {},
    priorityTitle: {},
    anchoredBadge: {},
    priorityWhy: {},
    priorityMeta: {},
    priorityScope: {},
    priorityScore: {},
  },
}));

describe("PriorityCard", () => {
  const mockOnPress = jest.fn();

  const basePriority = {
    id: "p1",
    active_revision: {
      id: "r1",
      title: "Test Priority",
      why_matters: "This matters because...",
      scope: "ongoing",
      score: 4,
      is_anchored: false,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render priority title", () => {
    render(<PriorityCard priority={basePriority} onPress={mockOnPress} />);

    expect(screen.getByText("Test Priority")).toBeTruthy();
  });

  it("should render why_matters description", () => {
    render(<PriorityCard priority={basePriority} onPress={mockOnPress} />);

    expect(screen.getByText("This matters because...")).toBeTruthy();
  });

  it("should render scope", () => {
    render(<PriorityCard priority={basePriority} onPress={mockOnPress} />);

    expect(screen.getByText("ongoing")).toBeTruthy();
  });

  it("should render importance score", () => {
    render(<PriorityCard priority={basePriority} onPress={mockOnPress} />);

    expect(screen.getByText("Importance: 4/5")).toBeTruthy();
  });

  it("should call onPress when pressed", () => {
    render(<PriorityCard priority={basePriority} onPress={mockOnPress} />);

    fireEvent.press(screen.getByText("Test Priority"));

    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it("should show anchored badge when is_anchored is true", () => {
    const anchoredPriority = {
      ...basePriority,
      active_revision: {
        ...basePriority.active_revision,
        is_anchored: true,
      },
    };

    render(<PriorityCard priority={anchoredPriority} onPress={mockOnPress} />);

    expect(screen.getByText("🔒 Anchored")).toBeTruthy();
  });

  it("should show stashed badge when isStashed is true", () => {
    render(
      <PriorityCard
        priority={basePriority}
        onPress={mockOnPress}
        isStashed={true}
      />,
    );

    expect(screen.getByText("Stashed")).toBeTruthy();
  });

  it("should not show score/meta when stashed", () => {
    render(
      <PriorityCard
        priority={basePriority}
        onPress={mockOnPress}
        isStashed={true}
      />,
    );

    expect(screen.queryByText("Importance: 4/5")).toBeNull();
  });

  it("should return null when no active_revision", () => {
    const noRevisionPriority = { id: "p1", active_revision: null };

    const { toJSON } = render(
      <PriorityCard priority={noRevisionPriority} onPress={mockOnPress} />,
    );

    expect(toJSON()).toBeNull();
  });

  it("should show 'Untitled' when no title", () => {
    const noTitlePriority = {
      ...basePriority,
      active_revision: {
        ...basePriority.active_revision,
        title: null,
      },
    };

    render(<PriorityCard priority={noTitlePriority} onPress={mockOnPress} />);

    expect(screen.getByText("Untitled")).toBeTruthy();
  });

  it("should show default description when why_matters is empty", () => {
    const noDescPriority = {
      ...basePriority,
      active_revision: {
        ...basePriority.active_revision,
        why_matters: "",
      },
    };

    render(<PriorityCard priority={noDescPriority} onPress={mockOnPress} />);

    expect(screen.getByText("No description provided")).toBeTruthy();
  });

  it("should default score to 3 when not provided", () => {
    const noScorePriority = {
      ...basePriority,
      active_revision: {
        ...basePriority.active_revision,
        score: undefined,
      },
    };

    render(<PriorityCard priority={noScorePriority} onPress={mockOnPress} />);

    expect(screen.getByText("Importance: 3/5")).toBeTruthy();
  });
});
