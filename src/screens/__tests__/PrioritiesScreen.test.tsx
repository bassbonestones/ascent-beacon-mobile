import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import PrioritiesScreen from "../PrioritiesScreen";
import api from "../../services/api";
import type { Priority, Value, User, RootStackParamList } from "../../types";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

// Mock API
jest.mock("../../services/api", () => ({
  __esModule: true,
  default: {
    getPriorities: jest.fn(),
    getValues: jest.fn(),
    getStashedPriorities: jest.fn(),
    stashPriority: jest.fn(),
    createPriority: jest.fn(),
    createPriorityRevision: jest.fn(),
  },
}));

const mockedApi = api as jest.Mocked<typeof api>;

interface FormData {
  title: string;
  why_matters: string;
  score: number;
  scope: string;
  cadence: string | null;
  constraints: string | null;
}

interface MockFormHook {
  formData: FormData;
  setFormData: jest.Mock;
  validationFeedback: { text: string; isValid: boolean };
  validationRules: unknown[];
  ruleExamples: unknown[];
  validating: boolean;
  selectedValues: Set<string>;
  handleNameChange: jest.Mock;
  handleWhyChange: jest.Mock;
  toggleValue: jest.Mock;
  resetForm: jest.Mock;
  loadFromPriority: jest.Mock;
  clearValidationTimeout: jest.Mock;
}

// Mock usePriorityForm hook
const mockFormHook: MockFormHook = {
  formData: {
    title: "",
    why_matters: "",
    score: 3,
    scope: "ongoing",
    cadence: null,
    constraints: null,
  },
  setFormData: jest.fn(),
  validationFeedback: { text: "", isValid: false },
  validationRules: [],
  ruleExamples: [],
  validating: false,
  selectedValues: new Set<string>(),
  handleNameChange: jest.fn(),
  handleWhyChange: jest.fn(),
  toggleValue: jest.fn(),
  resetForm: jest.fn(),
  loadFromPriority: jest.fn(),
  clearValidationTimeout: jest.fn(),
};

jest.mock("../../hooks/usePriorityForm", () => () => mockFormHook);

// Mock styles
jest.mock("../styles/prioritiesScreenStyles", () => ({
  styles: { container: {} },
}));

interface MockPriority {
  id: string;
  is_stashed: boolean;
  active_revision: { title: string; value_links: unknown[] } | null;
}

interface MockValue {
  id: string;
  active_revision_id: string;
  revisions: Array<{ id: string; statement: string }>;
}

// Mock child components
jest.mock("../../components/priorities/PriorityListView", () => {
  const { View, Text, TouchableOpacity } = require("react-native");
  return function MockListView({
    onPriorityPress,
    onCreatePress,
    onBackPress,
    priorities,
  }: {
    onPriorityPress: (p: MockPriority) => void;
    onCreatePress: () => void;
    onBackPress: () => void;
    priorities: MockPriority[];
  }) {
    return (
      <View testID="list-view">
        <Text>Priority List</Text>
        {priorities.map((p) => (
          <TouchableOpacity
            key={p.id}
            testID={`priority-${p.id}`}
            onPress={() => onPriorityPress(p)}
          >
            <Text>{p.active_revision?.title}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity testID="create-btn" onPress={onCreatePress}>
          <Text>Create</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="back-btn" onPress={onBackPress}>
          <Text>Back</Text>
        </TouchableOpacity>
      </View>
    );
  };
});

jest.mock("../../components/priorities/PriorityDetailView", () => {
  const { View, Text, TouchableOpacity } = require("react-native");
  return function MockDetailView({
    onBack,
    onEdit,
    onStashToggle,
  }: {
    onBack: () => void;
    onEdit: () => void;
    onStashToggle: () => void;
  }) {
    return (
      <View testID="detail-view">
        <Text>Priority Detail</Text>
        <TouchableOpacity testID="detail-back" onPress={onBack}>
          <Text>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="detail-edit" onPress={onEdit}>
          <Text>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="detail-stash" onPress={onStashToggle}>
          <Text>Stash</Text>
        </TouchableOpacity>
      </View>
    );
  };
});

jest.mock("../../components/priorities/CreatePriorityStep1", () => {
  const { View, Text, TouchableOpacity } = require("react-native");
  return function MockStep1({
    onCancel,
    onNext,
  }: {
    onCancel: () => void;
    onNext: () => void;
  }) {
    return (
      <View testID="step1">
        <Text>Step 1: Name</Text>
        <TouchableOpacity testID="step1-cancel" onPress={onCancel}>
          <Text>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="step1-next" onPress={onNext}>
          <Text>Next</Text>
        </TouchableOpacity>
      </View>
    );
  };
});

jest.mock("../../components/priorities/CreatePriorityStep2", () => {
  const { View, Text, TouchableOpacity } = require("react-native");
  return function MockStep2({
    onBack,
    onNext,
  }: {
    onBack: () => void;
    onNext: () => void;
  }) {
    return (
      <View testID="step2">
        <TouchableOpacity testID="step2-back" onPress={onBack}>
          <Text>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="step2-next" onPress={onNext}>
          <Text>Next</Text>
        </TouchableOpacity>
      </View>
    );
  };
});

jest.mock("../../components/priorities/CreatePriorityStep3", () => {
  const { View, Text, TouchableOpacity } = require("react-native");
  return function MockStep3({
    onBack,
    onNext,
  }: {
    onBack: () => void;
    onNext: () => void;
  }) {
    return (
      <View testID="step3">
        <TouchableOpacity testID="step3-back" onPress={onBack}>
          <Text>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="step3-next" onPress={onNext}>
          <Text>Next</Text>
        </TouchableOpacity>
      </View>
    );
  };
});

jest.mock("../../components/priorities/CreatePriorityStep4", () => {
  const { View, Text, TouchableOpacity } = require("react-native");
  return function MockStep4({
    onBack,
    onNext,
  }: {
    onBack: () => void;
    onNext: () => void;
  }) {
    return (
      <View testID="step4">
        <TouchableOpacity testID="step4-back" onPress={onBack}>
          <Text>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="step4-next" onPress={onNext}>
          <Text>Next</Text>
        </TouchableOpacity>
      </View>
    );
  };
});

jest.mock("../../components/priorities/CreatePriorityReview", () => {
  const { View, Text, TouchableOpacity } = require("react-native");
  return function MockReview({
    onBack,
    onSubmit,
  }: {
    onBack: () => void;
    onSubmit: () => void;
  }) {
    return (
      <View testID="review">
        <TouchableOpacity testID="review-back" onPress={onBack}>
          <Text>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="review-submit" onPress={onSubmit}>
          <Text>Submit</Text>
        </TouchableOpacity>
      </View>
    );
  };
});

jest.mock("../../components/priorities/ExamplesModal", () => {
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

jest.spyOn(Alert, "alert").mockImplementation(() => {});

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

describe("PrioritiesScreen", () => {
  const mockUser = createMockUser();
  const mockNavigation = createMockNavigation();

  const mockPriorities: MockPriority[] = [
    {
      id: "p1",
      is_stashed: false,
      active_revision: { title: "Priority 1", value_links: [] },
    },
    {
      id: "p2",
      is_stashed: false,
      active_revision: { title: "Priority 2", value_links: [] },
    },
  ];

  const mockValues: MockValue[] = [
    {
      id: "v1",
      active_revision_id: "r1",
      revisions: [{ id: "r1", statement: "Value 1" }],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockedApi.getPriorities.mockResolvedValue({
      priorities: mockPriorities,
    } as any);
    mockedApi.getValues.mockResolvedValue({ values: mockValues } as any);
    mockedApi.getStashedPriorities.mockResolvedValue({ priorities: [] } as any);
    mockedApi.stashPriority.mockResolvedValue({ id: "p1" } as any);
  });

  it("shows loading indicator initially", () => {
    mockedApi.getPriorities.mockImplementation(() => new Promise(() => {}));
    const { getByLabelText } = render(
      <PrioritiesScreen user={mockUser} navigation={mockNavigation} />,
    );
    expect(getByLabelText("Loading")).toBeTruthy();
  });

  it("renders list view after loading", async () => {
    const { getByTestId } = render(
      <PrioritiesScreen user={mockUser} navigation={mockNavigation} />,
    );
    await waitFor(() => {
      expect(getByTestId("list-view")).toBeTruthy();
    });
  });

  it("shows alert on data load error", async () => {
    mockedApi.getPriorities.mockRejectedValueOnce(new Error("Load failed"));
    render(<PrioritiesScreen user={mockUser} navigation={mockNavigation} />);
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalled();
    });
  });

  it("navigates to detail view when priority pressed", async () => {
    const { getByTestId } = render(
      <PrioritiesScreen user={mockUser} navigation={mockNavigation} />,
    );
    await waitFor(() => {
      expect(getByTestId("list-view")).toBeTruthy();
    });
    fireEvent.press(getByTestId("priority-p1"));
    await waitFor(() => {
      expect(getByTestId("detail-view")).toBeTruthy();
    });
  });

  it("navigates to step1 when create pressed", async () => {
    const { getByTestId } = render(
      <PrioritiesScreen user={mockUser} navigation={mockNavigation} />,
    );
    await waitFor(() => {
      expect(getByTestId("list-view")).toBeTruthy();
    });
    fireEvent.press(getByTestId("create-btn"));
    await waitFor(() => {
      expect(getByTestId("step1")).toBeTruthy();
    });
  });

  it("navigates back to home when back pressed on list", async () => {
    const { getByTestId } = render(
      <PrioritiesScreen user={mockUser} navigation={mockNavigation} />,
    );
    await waitFor(() => {
      expect(getByTestId("list-view")).toBeTruthy();
    });
    fireEvent.press(getByTestId("back-btn"));
    expect(mockNavigation.navigate).toHaveBeenCalledWith("Dashboard");
  });

  it("navigates back to list from detail", async () => {
    const { getByTestId } = render(
      <PrioritiesScreen user={mockUser} navigation={mockNavigation} />,
    );
    await waitFor(() => {
      expect(getByTestId("list-view")).toBeTruthy();
    });
    fireEvent.press(getByTestId("priority-p1"));
    await waitFor(() => {
      expect(getByTestId("detail-view")).toBeTruthy();
    });
    fireEvent.press(getByTestId("detail-back"));
    await waitFor(() => {
      expect(getByTestId("list-view")).toBeTruthy();
    });
  });

  it("navigates to edit mode from detail", async () => {
    const { getByTestId } = render(
      <PrioritiesScreen user={mockUser} navigation={mockNavigation} />,
    );
    await waitFor(() => {
      expect(getByTestId("list-view")).toBeTruthy();
    });
    fireEvent.press(getByTestId("priority-p1"));
    await waitFor(() => {
      expect(getByTestId("detail-view")).toBeTruthy();
    });
    fireEvent.press(getByTestId("detail-edit"));
    await waitFor(() => {
      expect(getByTestId("step1")).toBeTruthy();
    });
  });

  it("handles stash toggle", async () => {
    const { getByTestId } = render(
      <PrioritiesScreen user={mockUser} navigation={mockNavigation} />,
    );
    await waitFor(() => {
      expect(getByTestId("list-view")).toBeTruthy();
    });
    fireEvent.press(getByTestId("priority-p1"));
    await waitFor(() => {
      expect(getByTestId("detail-view")).toBeTruthy();
    });
    fireEvent.press(getByTestId("detail-stash"));
    await waitFor(() => {
      expect(mockedApi.stashPriority).toHaveBeenCalled();
    });
  });

  it("progresses through create wizard steps", async () => {
    const { getByTestId } = render(
      <PrioritiesScreen user={mockUser} navigation={mockNavigation} />,
    );
    await waitFor(() => {
      expect(getByTestId("list-view")).toBeTruthy();
    });

    // Start create flow
    fireEvent.press(getByTestId("create-btn"));
    await waitFor(() => {
      expect(getByTestId("step1")).toBeTruthy();
    });

    // Go to step 2
    fireEvent.press(getByTestId("step1-next"));
    await waitFor(() => {
      expect(getByTestId("step2")).toBeTruthy();
    });

    // Go back to step 1
    fireEvent.press(getByTestId("step2-back"));
    await waitFor(() => {
      expect(getByTestId("step1")).toBeTruthy();
    });

    // Cancel and return to list
    fireEvent.press(getByTestId("step1-cancel"));
    await waitFor(() => {
      expect(getByTestId("list-view")).toBeTruthy();
    });
  });
});
