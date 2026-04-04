import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import PrioritiesScreen from "../PrioritiesScreen";
import api from "../../services/api";

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

// Mock usePriorityForm hook
const mockFormHook = {
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
  selectedValues: new Set(),
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

// Mock child components
jest.mock("../../components/priorities/PriorityListView", () => {
  const { View, Text, TouchableOpacity } = require("react-native");
  return function MockListView({
    onPriorityPress,
    onCreatePress,
    onBackPress,
    priorities,
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
  return function MockDetailView({ onBack, onEdit, onStashToggle }) {
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
  return function MockStep1({ onCancel, onNext }) {
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
  return function MockStep2({ onBack, onNext }) {
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
  return function MockStep3({ onBack, onNext }) {
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
  return function MockStep4({ onBack, onNext }) {
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
  return function MockReview({ onBack, onSubmit }) {
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
  return function MockExamplesModal({ visible }) {
    if (!visible) return null;
    return (
      <View testID="examples-modal">
        <Text>Examples</Text>
      </View>
    );
  };
});

jest.spyOn(Alert, "alert").mockImplementation(() => {});

describe("PrioritiesScreen", () => {
  const mockUser = { display_name: "John" };
  const mockNavigation = { navigate: jest.fn() };

  const mockPriorities = [
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

  const mockValues = [
    {
      id: "v1",
      active_revision_id: "r1",
      revisions: [{ id: "r1", statement: "Value 1" }],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    api.getPriorities.mockResolvedValue({ priorities: mockPriorities });
    api.getValues.mockResolvedValue({ values: mockValues });
    api.getStashedPriorities.mockResolvedValue({ priorities: [] });
  });

  it("shows loading indicator initially", () => {
    api.getPriorities.mockImplementation(() => new Promise(() => {}));
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
    api.getPriorities.mockRejectedValueOnce(new Error("Load failed"));
    render(<PrioritiesScreen user={mockUser} navigation={mockNavigation} />);
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Failed to load priorities",
      );
    });
  });

  it("navigates to dashboard when back is pressed", async () => {
    const { getByTestId } = render(
      <PrioritiesScreen user={mockUser} navigation={mockNavigation} />,
    );
    await waitFor(() => getByTestId("list-view"));
    fireEvent.press(getByTestId("back-btn"));
    expect(mockNavigation.navigate).toHaveBeenCalledWith("Dashboard");
  });

  it("shows detail view when priority is pressed", async () => {
    const { getByTestId, queryByTestId } = render(
      <PrioritiesScreen user={mockUser} navigation={mockNavigation} />,
    );
    await waitFor(() => getByTestId("list-view"));
    fireEvent.press(getByTestId("priority-p1"));
    expect(getByTestId("detail-view")).toBeTruthy();
    expect(queryByTestId("list-view")).toBeNull();
  });

  it("goes back to list from detail view", async () => {
    const { getByTestId, queryByTestId } = render(
      <PrioritiesScreen user={mockUser} navigation={mockNavigation} />,
    );
    await waitFor(() => getByTestId("list-view"));
    fireEvent.press(getByTestId("priority-p1"));
    expect(getByTestId("detail-view")).toBeTruthy();
    fireEvent.press(getByTestId("detail-back"));
    expect(getByTestId("list-view")).toBeTruthy();
    expect(queryByTestId("detail-view")).toBeNull();
  });

  it("shows step1 when create is pressed", async () => {
    const { getByTestId, queryByTestId } = render(
      <PrioritiesScreen user={mockUser} navigation={mockNavigation} />,
    );
    await waitFor(() => getByTestId("list-view"));
    fireEvent.press(getByTestId("create-btn"));
    expect(getByTestId("step1")).toBeTruthy();
    expect(queryByTestId("list-view")).toBeNull();
  });

  it("navigates through creation steps", async () => {
    const { getByTestId, queryByTestId } = render(
      <PrioritiesScreen user={mockUser} navigation={mockNavigation} />,
    );
    await waitFor(() => getByTestId("list-view"));
    fireEvent.press(getByTestId("create-btn"));

    expect(getByTestId("step1")).toBeTruthy();
    fireEvent.press(getByTestId("step1-next"));

    expect(getByTestId("step2")).toBeTruthy();
    fireEvent.press(getByTestId("step2-next"));

    expect(getByTestId("step3")).toBeTruthy();
    fireEvent.press(getByTestId("step3-next"));

    expect(getByTestId("step4")).toBeTruthy();
    fireEvent.press(getByTestId("step4-next"));

    expect(getByTestId("review")).toBeTruthy();
  });

  it("goes back through steps", async () => {
    const { getByTestId } = render(
      <PrioritiesScreen user={mockUser} navigation={mockNavigation} />,
    );
    await waitFor(() => getByTestId("list-view"));
    fireEvent.press(getByTestId("create-btn"));

    // Go to step2, then back
    fireEvent.press(getByTestId("step1-next"));
    expect(getByTestId("step2")).toBeTruthy();
    fireEvent.press(getByTestId("step2-back"));
    expect(getByTestId("step1")).toBeTruthy();
  });

  it("cancels creation and returns to list", async () => {
    const { getByTestId } = render(
      <PrioritiesScreen user={mockUser} navigation={mockNavigation} />,
    );
    await waitFor(() => getByTestId("list-view"));
    fireEvent.press(getByTestId("create-btn"));
    fireEvent.press(getByTestId("step1-cancel"));
    expect(getByTestId("list-view")).toBeTruthy();
  });

  it("shows step1 when edit is pressed from detail", async () => {
    const { getByTestId } = render(
      <PrioritiesScreen user={mockUser} navigation={mockNavigation} />,
    );
    await waitFor(() => getByTestId("list-view"));
    fireEvent.press(getByTestId("priority-p1"));
    fireEvent.press(getByTestId("detail-edit"));
    expect(getByTestId("step1")).toBeTruthy();
  });
});
