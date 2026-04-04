import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import ValuesManagement from "../ValuesManagement";
import type {
  Value,
  ValueRevision,
  AffectedPriorityInfo,
  ValueInsight,
  User,
  RootStackParamList,
} from "../../types";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

// Mock the useFocusEffect
jest.mock("@react-navigation/native", () => ({
  useFocusEffect: jest.fn((callback: () => void) => callback()),
}));

interface MockRevision {
  id: string;
  statement: string;
  weight_normalized: number;
}

interface MockValue {
  id: string;
  active_revision_id: string;
  revisions: MockRevision[];
}

interface MockVm {
  values: MockValue[];
  loading: boolean;
  creating: boolean;
  showExamples: boolean;
  newStatement: string;
  showWeightsModal: boolean;
  editingValueId: string | null;
  editingStatement: string;
  saving: boolean;
  valueInsights: Record<string, ValueInsight>;
  highlightValueId: string | null;
  showAffectedPrioritiesModal: boolean;
  affectedPriorities: AffectedPriorityInfo[];
  scrollViewRef: { current: null };
  valuePositions: { current: Record<string, unknown> };
  loadValues: jest.Mock;
  setShowExamples: jest.Mock;
  setNewStatement: jest.Mock;
  setShowWeightsModal: jest.Mock;
  setEditingStatement: jest.Mock;
  handleCreateValue: jest.Mock;
  handleDeleteValue: jest.Mock;
  handleStartEdit: jest.Mock;
  handleSaveEdit: jest.Mock;
  handleCancelEdit: jest.Mock;
  handleAffectedPrioritiesContinue: jest.Mock;
  handleAffectedPrioritiesReviewLinks: jest.Mock;
  handleSelectExample: jest.Mock;
  handleSaveWeights: jest.Mock;
  handleKeepBoth: jest.Mock;
  handleReviewInsight: jest.Mock;
  setShowAffectedPrioritiesModal: jest.Mock;
  setAffectedPriorities: jest.Mock;
  setPendingImpactInfo: jest.Mock;
  setLastEditedValueId: jest.Mock;
}

// Create a mock for the values management hook
const createMockVm = (overrides: Partial<MockVm> = {}): MockVm => ({
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
  getActiveRevision: (value: MockValue) =>
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
  return function MockAffectedPrioritiesModal({
    visible,
  }: {
    visible: boolean;
  }) {
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
  return function MockValueListCard({
    value,
    onEdit,
    onDelete,
  }: {
    value: MockValue;
    onEdit: (value: MockValue) => void;
    onDelete: (valueId: string) => void;
  }) {
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
  return function MockCreateValueForm({
    onCreate,
    onShowExamples,
  }: {
    onCreate: () => void;
    onShowExamples: () => void;
  }) {
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
  return function MockExamplesModal({ visible }: { visible: boolean }) {
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
  return function MockEditValueModal({ visible }: { visible: boolean }) {
    if (!visible) return null;
    return (
      <View testID="edit-value-modal">
        <Text>Edit Value</Text>
      </View>
    );
  };
});

// Create mock navigation with proper type casting for tests
const createMockNavigation =
  (): NativeStackNavigationProp<RootStackParamList> =>
    ({
      navigate: jest.fn(),
    }) as unknown as NativeStackNavigationProp<RootStackParamList>;

// Helper to create a proper mock user
const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: "user-1",
  display_name: "John",
  primary_email: "john@example.com",
  is_email_verified: true,
  created_at: new Date().toISOString(),
  ...overrides,
});

describe("ValuesManagement", () => {
  const mockUser = createMockUser();
  const mockOnLogout = jest.fn();
  const mockNavigation = createMockNavigation();

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
});
