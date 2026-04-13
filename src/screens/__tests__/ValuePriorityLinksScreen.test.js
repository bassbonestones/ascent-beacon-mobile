import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import ValuePriorityLinksScreen from "../ValuePriorityLinksScreen";

// Mock the hook
jest.mock("../../hooks/useValuePriorityLinks", () => {
  return jest.fn();
});

// Mock styles
jest.mock("../styles/valuePriorityLinksStyles", () => ({
  styles: {
    container: {},
    loadingContainer: {},
    header: {},
    title: {},
    closeButton: {},
    closeButtonText: {},
    valueInfo: {},
    valueLabel: {},
    valueStatement: {},
    content: {},
    sectionTitle: {},
    emptyState: {},
    emptyText: {},
    emptySubText: {},
    priorityCard: {},
    priorityCardChanged: {},
    priorityInfo: {},
    priorityHeader: {},
    priorityTitle: {},
    anchoredBadge: {},
    priorityDescription: {},
    footer: {},
    saveButton: {},
    saveButtonDisabled: {},
    saveButtonText: {},
  },
}));

const useValuePriorityLinks = require("../../hooks/useValuePriorityLinks");

describe("ValuePriorityLinksScreen", () => {
  const mockNavigation = {
    goBack: jest.fn(),
  };

  const mockRoute = {
    params: {
      valueId: "v1",
      valueStatement: "I value family",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading indicator while loading", () => {
    useValuePriorityLinks.mockReturnValue({
      loading: true,
      priorities: [],
      linkedPriorityIds: new Set(),
      changedPriorityIds: new Set(),
      togglePriorityLink: jest.fn(),
      saveChanges: jest.fn(),
      hasChanges: false,
      saving: false,
    });

    const { getByLabelText } = render(
      <ValuePriorityLinksScreen
        route={mockRoute}
        navigation={mockNavigation}
      />,
    );
    expect(getByLabelText("Loading priorities")).toBeTruthy();
  });

  it("renders header title", () => {
    useValuePriorityLinks.mockReturnValue({
      loading: false,
      priorities: [],
      linkedPriorityIds: new Set(),
      changedPriorityIds: new Set(),
      togglePriorityLink: jest.fn(),
      saveChanges: jest.fn(),
      hasChanges: false,
      saving: false,
    });

    const { getByText } = render(
      <ValuePriorityLinksScreen
        route={mockRoute}
        navigation={mockNavigation}
      />,
    );
    expect(getByText("Review Links")).toBeTruthy();
  });

  it("renders edited value statement", () => {
    useValuePriorityLinks.mockReturnValue({
      loading: false,
      priorities: [],
      linkedPriorityIds: new Set(),
      changedPriorityIds: new Set(),
      togglePriorityLink: jest.fn(),
      saveChanges: jest.fn(),
      hasChanges: false,
      saving: false,
    });

    const { getByText } = render(
      <ValuePriorityLinksScreen
        route={mockRoute}
        navigation={mockNavigation}
      />,
    );
    expect(getByText("I value family")).toBeTruthy();
  });

  it("calls navigation.goBack when cancel pressed", () => {
    useValuePriorityLinks.mockReturnValue({
      loading: false,
      priorities: [],
      linkedPriorityIds: new Set(),
      changedPriorityIds: new Set(),
      togglePriorityLink: jest.fn(),
      saveChanges: jest.fn(),
      hasChanges: false,
      saving: false,
    });

    const { getByLabelText } = render(
      <ValuePriorityLinksScreen
        route={mockRoute}
        navigation={mockNavigation}
      />,
    );
    fireEvent.press(getByLabelText("Cancel and go back"));
    expect(mockNavigation.goBack).toHaveBeenCalled();
  });

  it("renders empty state when no priorities", () => {
    useValuePriorityLinks.mockReturnValue({
      loading: false,
      priorities: [],
      linkedPriorityIds: new Set(),
      changedPriorityIds: new Set(),
      togglePriorityLink: jest.fn(),
      saveChanges: jest.fn(),
      hasChanges: false,
      saving: false,
    });

    const { getByText } = render(
      <ValuePriorityLinksScreen
        route={mockRoute}
        navigation={mockNavigation}
      />,
    );
    expect(getByText("No priorities yet")).toBeTruthy();
    expect(
      getByText("Create priorities first to link them to values"),
    ).toBeTruthy();
  });

  it("renders priority list", () => {
    const mockPriorities = [
      {
        id: "p1",
        active_revision: {
          title: "Health",
          why_matters: "Because health matters",
          is_anchored: false,
        },
      },
      {
        id: "p2",
        active_revision: {
          title: "Family Time",
          why_matters: "Quality time with loved ones",
          is_anchored: true,
        },
      },
    ];

    useValuePriorityLinks.mockReturnValue({
      loading: false,
      priorities: mockPriorities,
      linkedPriorityIds: new Set(["p1"]),
      changedPriorityIds: new Set(),
      togglePriorityLink: jest.fn(),
      saveChanges: jest.fn(),
      hasChanges: false,
      saving: false,
    });

    const { getByText } = render(
      <ValuePriorityLinksScreen
        route={mockRoute}
        navigation={mockNavigation}
      />,
    );
    expect(getByText("Health")).toBeTruthy();
    expect(getByText("Family Time")).toBeTruthy();
  });

  it("shows anchored badge for anchored priorities", () => {
    const mockPriorities = [
      {
        id: "p1",
        active_revision: {
          title: "Health",
          why_matters: "Because health matters",
          is_anchored: true,
        },
      },
    ];

    useValuePriorityLinks.mockReturnValue({
      loading: false,
      priorities: mockPriorities,
      linkedPriorityIds: new Set(),
      changedPriorityIds: new Set(),
      togglePriorityLink: jest.fn(),
      saveChanges: jest.fn(),
      hasChanges: false,
      saving: false,
    });

    const { getByText } = render(
      <ValuePriorityLinksScreen
        route={mockRoute}
        navigation={mockNavigation}
      />,
    );
    expect(getByText("🔒 Anchored")).toBeTruthy();
  });

  it("calls togglePriorityLink when switch toggled", () => {
    const mockToggle = jest.fn();
    const mockPriorities = [
      {
        id: "p1",
        active_revision: {
          title: "Health",
          why_matters: "Because health matters",
          is_anchored: false,
        },
      },
    ];

    useValuePriorityLinks.mockReturnValue({
      loading: false,
      priorities: mockPriorities,
      linkedPriorityIds: new Set(),
      changedPriorityIds: new Set(),
      togglePriorityLink: mockToggle,
      saveChanges: jest.fn(),
      hasChanges: false,
      saving: false,
    });

    const { getByLabelText } = render(
      <ValuePriorityLinksScreen
        route={mockRoute}
        navigation={mockNavigation}
      />,
    );
    fireEvent(getByLabelText("Toggle link for Health"), "valueChange", true);
    expect(mockToggle).toHaveBeenCalledWith("p1");
  });

  it("skips priorities without active_revision", () => {
    const mockPriorities = [
      { id: "p1", active_revision: null },
      {
        id: "p2",
        active_revision: {
          title: "Visible",
          why_matters: "This one shows",
          is_anchored: false,
        },
      },
    ];

    useValuePriorityLinks.mockReturnValue({
      loading: false,
      priorities: mockPriorities,
      linkedPriorityIds: new Set(),
      changedPriorityIds: new Set(),
      togglePriorityLink: jest.fn(),
      saveChanges: jest.fn(),
      hasChanges: false,
      saving: false,
    });

    const { getByText, queryByText } = render(
      <ValuePriorityLinksScreen
        route={mockRoute}
        navigation={mockNavigation}
      />,
    );
    expect(getByText("Visible")).toBeTruthy();
    // p1 doesn't have a title to render
  });
});
