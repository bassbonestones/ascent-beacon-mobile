import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import PriorityListView from "../priorities/PriorityListView";

// Mock styles
jest.mock("../../screens/styles/prioritiesScreenStyles", () => ({
  styles: {
    container: {},
    content: {},
    emptyState: {},
    emptyText: {},
    emptySubText: {},
    prioritiesList: {},
    footer: {},
    backButton: {},
    backButtonText: {},
    continueButton: {},
    continueButtonText: {},
  },
}));

// Mock child components
jest.mock("../priorities/PriorityCard", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return function MockPriorityCard({ priority, onPress, isStashed }) {
    return (
      <TouchableOpacity
        testID={`priority-card-${priority.id}`}
        onPress={onPress}
      >
        <Text>{priority.active_revision?.title}</Text>
        {isStashed && <Text testID="stashed-badge">Stashed</Text>}
      </TouchableOpacity>
    );
  };
});

jest.mock("../priorities/PriorityHeader", () => {
  const { View, Text } = require("react-native");
  return function MockPriorityHeader() {
    return (
      <View testID="priority-header">
        <Text>Priorities</Text>
      </View>
    );
  };
});

describe("PriorityListView", () => {
  const defaultProps = {
    priorities: [],
    stashedPriorities: [],
    showStash: false,
    onToggleStash: jest.fn(),
    onPriorityPress: jest.fn(),
    onCreatePress: jest.fn(),
    onBackPress: jest.fn(),
  };

  const mockPriorities = [
    { id: "p1", active_revision: { title: "Priority 1" } },
    { id: "p2", active_revision: { title: "Priority 2" } },
  ];

  const mockStashedPriorities = [
    { id: "s1", active_revision: { title: "Stashed 1" } },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders priority header", () => {
    const { getByTestId } = render(<PriorityListView {...defaultProps} />);
    expect(getByTestId("priority-header")).toBeTruthy();
  });

  it("shows empty state when no priorities", () => {
    const { getByText } = render(<PriorityListView {...defaultProps} />);
    expect(getByText("No priorities yet")).toBeTruthy();
    expect(getByText("Create your first priority to get started")).toBeTruthy();
  });

  it("renders priority cards when priorities exist", () => {
    const { getByTestId } = render(
      <PriorityListView {...defaultProps} priorities={mockPriorities} />,
    );
    expect(getByTestId("priority-card-p1")).toBeTruthy();
    expect(getByTestId("priority-card-p2")).toBeTruthy();
  });

  it("calls onPriorityPress when a priority card is pressed", () => {
    const { getByTestId } = render(
      <PriorityListView {...defaultProps} priorities={mockPriorities} />,
    );
    fireEvent.press(getByTestId("priority-card-p1"));
    expect(defaultProps.onPriorityPress).toHaveBeenCalledWith(
      mockPriorities[0],
    );
  });

  it("shows stash toggle with count", () => {
    const { getByText } = render(
      <PriorityListView
        {...defaultProps}
        stashedPriorities={mockStashedPriorities}
      />,
    );
    expect(getByText("▲ Show Stash (1)")).toBeTruthy();
  });

  it("shows hide stash text when stash is shown", () => {
    const { getByText } = render(
      <PriorityListView
        {...defaultProps}
        showStash={true}
        stashedPriorities={mockStashedPriorities}
      />,
    );
    expect(getByText("▼ Hide Stash")).toBeTruthy();
  });

  it("calls onToggleStash when stash toggle is pressed", () => {
    const { getByLabelText } = render(
      <PriorityListView
        {...defaultProps}
        stashedPriorities={mockStashedPriorities}
      />,
    );
    fireEvent.press(getByLabelText("Show 1 stashed priorities"));
    expect(defaultProps.onToggleStash).toHaveBeenCalled();
  });

  it("shows stashed priorities when showStash is true", () => {
    const { getByTestId, getByText } = render(
      <PriorityListView
        {...defaultProps}
        showStash={true}
        stashedPriorities={mockStashedPriorities}
      />,
    );
    expect(getByTestId("priority-card-s1")).toBeTruthy();
    expect(getByText("Stashed 1")).toBeTruthy();
  });

  it("does not show stashed priorities when showStash is false", () => {
    const { queryByTestId } = render(
      <PriorityListView
        {...defaultProps}
        showStash={false}
        stashedPriorities={mockStashedPriorities}
      />,
    );
    expect(queryByTestId("priority-card-s1")).toBeNull();
  });

  it("renders back to dashboard button", () => {
    const { getByText } = render(<PriorityListView {...defaultProps} />);
    expect(getByText("Back to Dashboard")).toBeTruthy();
  });

  it("calls onBackPress when back button is pressed", () => {
    const { getByLabelText } = render(<PriorityListView {...defaultProps} />);
    fireEvent.press(getByLabelText("Back to Dashboard"));
    expect(defaultProps.onBackPress).toHaveBeenCalled();
  });

  it("renders create priority button", () => {
    const { getByText } = render(<PriorityListView {...defaultProps} />);
    expect(getByText("+ Create Priority")).toBeTruthy();
  });

  it("calls onCreatePress when create button is pressed", () => {
    const { getByLabelText } = render(<PriorityListView {...defaultProps} />);
    fireEvent.press(getByLabelText("Create new priority"));
    expect(defaultProps.onCreatePress).toHaveBeenCalled();
  });

  it("filters out priorities without active_revision", () => {
    const prioritiesWithNull = [
      { id: "p1", active_revision: { title: "Valid" } },
      { id: "p2", active_revision: null },
    ];
    const { queryByTestId, getByTestId } = render(
      <PriorityListView {...defaultProps} priorities={prioritiesWithNull} />,
    );
    expect(getByTestId("priority-card-p1")).toBeTruthy();
    expect(queryByTestId("priority-card-p2")).toBeNull();
  });
});
