import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import PriorityDetailView from "../PriorityDetailView";
import type { Priority, Value } from "../../../types";

// Mock styles
jest.mock("../../../screens/styles/prioritiesScreenStyles", () => ({
  styles: {
    container: {},
    header: {},
    title: {},
    content: {},
    detailSection: {},
    detailLabel: {},
    detailValue: {},
    linkedValues: {},
    linkedValueItem: {},
    linkedValueName: {},
    buttonRow: {},
    primaryButton: {},
    primaryButtonText: {},
    secondaryButton: {},
    secondaryButtonText: {},
    dangerButton: {},
    dangerButtonText: {},
    anchoredBadge: {},
    anchoredText: {},
    stashedBadge: {},
    stashedText: {},
    scoreSection: {},
    scoreLabel: {},
    scoreValue: {},
  },
}));

const createMockPriority = (overrides = {}): Priority =>
  ({
    id: "priority-1",
    user_id: "user-1",
    is_stashed: false,
    active_revision_id: "rev-1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    active_revision: {
      id: "rev-1",
      priority_id: "priority-1",
      title: "Test Priority",
      description: "Test description",
      score: 3,
      is_anchored: false,
      created_at: "2024-01-01T00:00:00Z",
    },
    ...overrides,
  }) as unknown as Priority;

const mockValues: Value[] = [
  {
    id: "value-1",
    user_id: "user-1",
    active_revision_id: "vrev-1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    revisions: [],
    insights: [],
    active_revision: {
      id: "vrev-1",
      value_id: "value-1",
      title: "Test Value",
      description: "Test value description",
      is_active: true,
      created_at: "2024-01-01T00:00:00Z",
    },
  } as unknown as Value,
];

describe("PriorityDetailView", () => {
  const defaultProps = {
    priority: createMockPriority(),
    values: mockValues,
    linkedValueIds: ["value-1"],
    onStashToggle: jest.fn(),
    onBack: jest.fn(),
    onEdit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders priority title", () => {
    render(<PriorityDetailView {...defaultProps} />);
    expect(screen.getByText("Test Priority")).toBeOnTheScreen();
  });

  it("returns null when no active revision", () => {
    const priority = createMockPriority({ active_revision: null });
    const { toJSON } = render(
      <PriorityDetailView {...defaultProps} priority={priority} />,
    );
    expect(toJSON()).toBeNull();
  });

  it("renders priority details header", () => {
    render(<PriorityDetailView {...defaultProps} />);
    expect(screen.getByText("Priority Details")).toBeOnTheScreen();
  });

  it("shows importance score", () => {
    render(<PriorityDetailView {...defaultProps} />);
    expect(screen.getByText("3/5")).toBeOnTheScreen();
  });

  it("calls onStashToggle when stash button pressed", () => {
    render(<PriorityDetailView {...defaultProps} />);
    fireEvent.press(screen.getByLabelText("Stash priority"));
    expect(defaultProps.onStashToggle).toHaveBeenCalled();
  });

  it("shows anchored message for anchored priorities", () => {
    const anchoredPriority = createMockPriority({
      active_revision: {
        ...defaultProps.priority.active_revision!,
        is_anchored: true,
      },
    });
    render(
      <PriorityDetailView {...defaultProps} priority={anchoredPriority} />,
    );
    expect(screen.getByText("🔒 This priority is anchored")).toBeOnTheScreen();
  });

  it("shows unstash label for stashed priorities", () => {
    const stashedPriority = createMockPriority({ is_stashed: true });
    render(<PriorityDetailView {...defaultProps} priority={stashedPriority} />);
    expect(screen.getByLabelText("Unstash priority")).toBeOnTheScreen();
  });
});
