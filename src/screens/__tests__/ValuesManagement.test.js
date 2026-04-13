import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import ValuesManagement from "../ValuesManagement";

// Mock the useFocusEffect
jest.mock("@react-navigation/native", () => ({
  useFocusEffect: jest.fn((callback) => callback()),
}));

// Create a mock for the values management hook
const createMockVm = (overrides = {}) => ({
  values: [
    {
      id: "v1",
      active_revision_id: "r1",
      revisions: [{ id: "r1", statement: "Value 1", weight_normalized: 50 }],
    },
    {
      id: "v2",
      active_revision_id: "r2",
      revisions: [{ id: "r2", statement: "Value 2", weight_normalized: 30 }],
    },
    {
      id: "v3",
      active_revision_id: "r3",
      revisions: [{ id: "r3", statement: "Value 3", weight_normalized: 20 }],
    },
  ],
  loading: false,
  creating: false,
  showExamples: false,
  newStatement: "",
  showWeightsModal: false,
  editingValueId: null,
  editingStatement: "",
  saving: false,
  valueInsights: {},
  highlightValueId: null,
  showAffectedPrioritiesModal: false,
  affectedPriorities: [],
  scrollViewRef: { current: null },
  valuePositions: { current: {} },
  loadValues: jest.fn(),
  setShowExamples: jest.fn(),
  setNewStatement: jest.fn(),
  setShowWeightsModal: jest.fn(),
  setEditingStatement: jest.fn(),
  handleCreateValue: jest.fn(),
  handleDeleteValue: jest.fn(),
  handleStartEdit: jest.fn(),
  handleSaveEdit: jest.fn(),
  handleCancelEdit: jest.fn(),
  handleAffectedPrioritiesContinue: jest.fn(),
  handleAffectedPrioritiesReviewLinks: jest.fn(),
  handleSelectExample: jest.fn(),
  handleSaveWeights: jest.fn(),
  handleKeepBoth: jest.fn(),
  handleReviewInsight: jest.fn(),
  setShowAffectedPrioritiesModal: jest.fn(),
  setAffectedPriorities: jest.fn(),
  setPendingImpactInfo: jest.fn(),
  setLastEditedValueId: jest.fn(),
  ...overrides,
});

let mockVm = createMockVm();

jest.mock("../../hooks/useValuesManagement", () => ({
  __esModule: true,
  default: () => mockVm,
  getActiveRevision: (value) =>
    value.revisions?.find((r) => r.id === value.active_revision_id),
}));

// Mock the styles
jest.mock("../styles/valuesManagementStyles", () => ({
  styles: {
    container: {},
    loadingContainer: {},
    footerFullWidth: {},
    backButtonFull: {},
    backButtonFullText: {},
    header: {},
    title: {},
    logoutButton: {},
    logoutText: {},
    weightsButtonContainer: {},
    weightsButton: {},
    weightsButtonIcon: {},
    weightsButtonText: {},
    infoBox: {},
    infoTitle: {},
    infoText: {},
    content: {},
    scrollContent: {},
    valuesList: {},
    sectionTitle: {},
    guidanceBox: {},
    guidanceText: {},
  },
}));

// Mock child components
jest.mock("../../components/WeightAdjustmentModal", () => {
  const { View, Text } = require("react-native");
  return function MockWeightAdjustmentModal() {
    return (
      <View testID="weight-adjustment-modal">
        <Text>Weight Modal</Text>
      </View>
    );
  };
});

jest.mock("../../components/AffectedPrioritiesModal", () => {
  const { View, Text } = require("react-native");
  return function MockAffectedPrioritiesModal({ visible }) {
    if (!visible) return null;
    return (
      <View testID="affected-priorities-modal">
        <Text>Affected Priorities</Text>
      </View>
    );
  };
});

jest.mock("../../components/values/ValueListCard", () => {
  const { View, Text, TouchableOpacity } = require("react-native");
  return function MockValueListCard({ value, onEdit, onDelete }) {
    return (
      <View testID={`value-card-${value.id}`}>
        <Text>{value.revisions[0].statement}</Text>
        <TouchableOpacity
          testID={`edit-${value.id}`}
          onPress={() => onEdit(value)}
        >
          <Text>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID={`delete-${value.id}`}
          onPress={() => onDelete(value.id)}
        >
          <Text>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  };
});

jest.mock("../../components/values/CreateValueForm", () => {
  const { View, Text, TouchableOpacity } = require("react-native");
  return function MockCreateValueForm({ onCreate, onShowExamples }) {
    return (
      <View testID="create-value-form">
        <TouchableOpacity testID="create-btn" onPress={onCreate}>
          <Text>Create</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="examples-btn" onPress={onShowExamples}>
          <Text>Examples</Text>
        </TouchableOpacity>
      </View>
    );
  };
});

jest.mock("../../components/values/ExamplesModal", () => {
  const { View, Text } = require("react-native");
  return function MockExamplesModal({ visible }) {
    if (!visible) return null;
    return (
      <View testID="examples-modal">
        <Text>Examples</Text>
      </View>
    );
  };
});

jest.mock("../../components/values/EditValueModal", () => {
  const { View, Text } = require("react-native");
  return function MockEditValueModal({ visible }) {
    if (!visible) return null;
    return (
      <View testID="edit-value-modal">
        <Text>Edit Value</Text>
      </View>
    );
  };
});

describe("ValuesManagement", () => {
  const mockUser = { display_name: "John" };
  const mockOnLogout = jest.fn();
  const mockNavigation = { navigate: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    mockVm = createMockVm();
  });

  it("shows loading indicator when loading", () => {
    mockVm = createMockVm({ loading: true });
    const { getByLabelText } = render(
      <ValuesManagement
        user={mockUser}
        onLogout={mockOnLogout}
        navigation={mockNavigation}
      />,
    );
    expect(getByLabelText("Loading values")).toBeTruthy();
  });

  it("renders header with title", () => {
    const { getByText } = render(
      <ValuesManagement
        user={mockUser}
        onLogout={mockOnLogout}
        navigation={mockNavigation}
      />,
    );
    expect(getByText("Your Values")).toBeTruthy();
  });

  it("renders back to dashboard button", () => {
    const { getByText } = render(
      <ValuesManagement
        user={mockUser}
        onLogout={mockOnLogout}
        navigation={mockNavigation}
      />,
    );
    expect(getByText("Back to Dashboard")).toBeTruthy();
  });

  it("navigates to dashboard when back button is pressed", () => {
    const { getByText } = render(
      <ValuesManagement
        user={mockUser}
        onLogout={mockOnLogout}
        navigation={mockNavigation}
      />,
    );
    fireEvent.press(getByText("Back to Dashboard"));
    expect(mockNavigation.navigate).toHaveBeenCalledWith("Dashboard");
  });

  it("calls onLogout when logout button is pressed", () => {
    const { getByText } = render(
      <ValuesManagement
        user={mockUser}
        onLogout={mockOnLogout}
        navigation={mockNavigation}
      />,
    );
    fireEvent.press(getByText("Logout"));
    expect(mockOnLogout).toHaveBeenCalled();
  });

  it("renders adjust weights button when has 3+ values", () => {
    const { getByText } = render(
      <ValuesManagement
        user={mockUser}
        onLogout={mockOnLogout}
        navigation={mockNavigation}
      />,
    );
    expect(getByText("Adjust Weights")).toBeTruthy();
  });

  it("calls setShowWeightsModal when adjust weights is pressed", () => {
    const { getByLabelText } = render(
      <ValuesManagement
        user={mockUser}
        onLogout={mockOnLogout}
        navigation={mockNavigation}
      />,
    );
    fireEvent.press(getByLabelText("Adjust value weights"));
    expect(mockVm.setShowWeightsModal).toHaveBeenCalledWith(true);
  });

  it("shows values count in section title", () => {
    const { getByText } = render(
      <ValuesManagement
        user={mockUser}
        onLogout={mockOnLogout}
        navigation={mockNavigation}
      />,
    );
    expect(getByText("Your Values (3/6)")).toBeTruthy();
  });

  it("renders all value cards", () => {
    const { getByTestId } = render(
      <ValuesManagement
        user={mockUser}
        onLogout={mockOnLogout}
        navigation={mockNavigation}
      />,
    );
    expect(getByTestId("value-card-v1")).toBeTruthy();
    expect(getByTestId("value-card-v2")).toBeTruthy();
    expect(getByTestId("value-card-v3")).toBeTruthy();
  });

  it("renders create value form when under 6 values", () => {
    const { getByTestId } = render(
      <ValuesManagement
        user={mockUser}
        onLogout={mockOnLogout}
        navigation={mockNavigation}
      />,
    );
    expect(getByTestId("create-value-form")).toBeTruthy();
  });

  it("does not render create form when at 6 values", () => {
    mockVm = createMockVm({
      values: [
        {
          id: "v1",
          active_revision_id: "r1",
          revisions: [{ id: "r1", statement: "V1" }],
        },
        {
          id: "v2",
          active_revision_id: "r2",
          revisions: [{ id: "r2", statement: "V2" }],
        },
        {
          id: "v3",
          active_revision_id: "r3",
          revisions: [{ id: "r3", statement: "V3" }],
        },
        {
          id: "v4",
          active_revision_id: "r4",
          revisions: [{ id: "r4", statement: "V4" }],
        },
        {
          id: "v5",
          active_revision_id: "r5",
          revisions: [{ id: "r5", statement: "V5" }],
        },
        {
          id: "v6",
          active_revision_id: "r6",
          revisions: [{ id: "r6", statement: "V6" }],
        },
      ],
    });
    const { queryByTestId } = render(
      <ValuesManagement
        user={mockUser}
        onLogout={mockOnLogout}
        navigation={mockNavigation}
      />,
    );
    expect(queryByTestId("create-value-form")).toBeNull();
  });

  it("shows info box when no values exist", () => {
    mockVm = createMockVm({ values: [] });
    const { getByText } = render(
      <ValuesManagement
        user={mockUser}
        onLogout={mockOnLogout}
        navigation={mockNavigation}
      />,
    );
    expect(getByText("Why values?")).toBeTruthy();
  });

  it("shows guidance when less than 3 values", () => {
    mockVm = createMockVm({
      values: [
        {
          id: "v1",
          active_revision_id: "r1",
          revisions: [{ id: "r1", statement: "V1", weight_normalized: 50 }],
        },
      ],
    });
    const { getByText } = render(
      <ValuesManagement
        user={mockUser}
        onLogout={mockOnLogout}
        navigation={mockNavigation}
      />,
    );
    expect(getByText(/Add at least 2 more values to continue/)).toBeTruthy();
  });

  it("calls handleStartEdit when edit is pressed on a value", () => {
    const { getByTestId } = render(
      <ValuesManagement
        user={mockUser}
        onLogout={mockOnLogout}
        navigation={mockNavigation}
      />,
    );
    fireEvent.press(getByTestId("edit-v1"));
    expect(mockVm.handleStartEdit).toHaveBeenCalled();
  });

  it("calls handleDeleteValue when delete is pressed on a value", () => {
    const { getByTestId } = render(
      <ValuesManagement
        user={mockUser}
        onLogout={mockOnLogout}
        navigation={mockNavigation}
      />,
    );
    fireEvent.press(getByTestId("delete-v1"));
    expect(mockVm.handleDeleteValue).toHaveBeenCalledWith("v1");
  });
});
