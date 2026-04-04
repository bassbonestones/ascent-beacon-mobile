import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import AssistantScreen from "../AssistantScreen";
import type { Value, ValueRevision } from "../../types";

// Mock the hook
interface MockChat {
  loading: boolean;
  sending: boolean;
  recording: boolean;
  messages: Array<{ id: string; text: string }>;
  inputText: string;
  values: Array<{ id: string; active_revision?: { statement: string } }>;
  recommendations: Array<{ id: string }>;
  valueInsights: Record<string, unknown>;
  highlightValueId: string | null;
  deleteConfirmId: string | null;
  setInputText: jest.Mock;
  scrollViewRef: { current: null };
  modelScrollRef: { current: null };
  valuePositions: { current: Record<string, unknown> };
  handleSendMessage: jest.Mock;
  handleVoiceRecord: jest.Mock;
  handleAcceptRecommendation: jest.Mock;
  handleRejectRecommendation: jest.Mock;
  handleKeepBoth: jest.Mock;
  handleReviewInsight: jest.Mock;
  startEditValue: jest.Mock;
  confirmDeleteValue: jest.Mock;
  cancelDeleteValue: jest.Mock;
  performDeleteValue: jest.Mock;
}

const mockChat: MockChat = {
  loading: false,
  sending: false,
  recording: false,
  messages: [],
  inputText: "",
  values: [],
  recommendations: [],
  valueInsights: {},
  highlightValueId: null,
  deleteConfirmId: null,
  setInputText: jest.fn(),
  scrollViewRef: { current: null },
  modelScrollRef: { current: null },
  valuePositions: { current: {} },
  handleSendMessage: jest.fn(),
  handleVoiceRecord: jest.fn(),
  handleAcceptRecommendation: jest.fn(),
  handleRejectRecommendation: jest.fn(),
  handleKeepBoth: jest.fn(),
  handleReviewInsight: jest.fn(),
  startEditValue: jest.fn(),
  confirmDeleteValue: jest.fn(),
  cancelDeleteValue: jest.fn(),
  performDeleteValue: jest.fn(),
};

jest.mock("../../hooks/useAssistantChat", () => () => mockChat);

// Mock styles
jest.mock("../styles/assistantScreenStyles", () => ({
  styles: {
    container: {},
    loadingContainer: {},
    modelZone: {},
    modelContent: {},
    emptyState: {},
    emptyText: {},
    chatZone: {},
    chatContent: {},
  },
}));

// Mock valueMatching utility
jest.mock("../../utils/valueMatching", () => ({
  getActiveRevision: (value: {
    revisions?: Array<{ id: string }>;
    active_revision_id?: string;
  }) => value.revisions?.find((r) => r.id === value.active_revision_id),
}));

// Mock components
jest.mock("../../components/assistant/SymbolHeader", () => {
  const { View, Text, TouchableOpacity } = require("react-native");
  return function MockSymbolHeader({
    label,
    onBack,
  }: {
    label: string;
    onBack: () => void;
  }) {
    return (
      <View testID="symbol-header">
        <Text>{label}</Text>
        <TouchableOpacity testID="back-btn" onPress={onBack}>
          <Text>Back</Text>
        </TouchableOpacity>
      </View>
    );
  };
});

jest.mock("../../components/assistant/ValueCard", () => {
  const { View, Text } = require("react-native");
  return function MockValueCard({
    value,
  }: {
    value: { id: string; active_revision?: { statement: string } };
  }) {
    return (
      <View testID={`value-card-${value.id}`}>
        <Text>{value.active_revision?.statement}</Text>
      </View>
    );
  };
});

jest.mock("../../components/assistant/ProposedValueCard", () => {
  const { View, Text } = require("react-native");
  return function MockProposedValueCard({
    recommendation,
  }: {
    recommendation: { id: string };
  }) {
    return (
      <View testID={`rec-card-${recommendation.id}`}>
        <Text>Recommendation</Text>
      </View>
    );
  };
});

jest.mock("../../components/assistant/ChatMessage", () => {
  const { View, Text } = require("react-native");
  return function MockChatMessage({
    message,
  }: {
    message: { id: string; text: string };
  }) {
    return (
      <View testID={`msg-${message.id}`}>
        <Text>{message.text}</Text>
      </View>
    );
  };
});

jest.mock("../../components/assistant/InputBar", () => {
  const { View, TouchableOpacity, Text, TextInput } = require("react-native");
  return function MockInputBar({
    inputText,
    onInputChange,
    onSend,
  }: {
    inputText: string;
    onInputChange: (text: string) => void;
    onSend: () => void;
  }) {
    return (
      <View testID="input-bar">
        <TextInput
          testID="input"
          value={inputText}
          onChangeText={onInputChange}
        />
        <TouchableOpacity testID="send-btn" onPress={onSend}>
          <Text>Send</Text>
        </TouchableOpacity>
      </View>
    );
  };
});

interface RouteParams {
  params?: { contextMode?: string };
  key: string;
  name: "Assistant";
}

interface Navigation {
  goBack: jest.Mock;
}

describe("AssistantScreen", () => {
  // Use type assertion for test mocks - the component only uses params.contextMode
  const mockRoute = {
    params: { contextMode: "values" },
    key: "Assistant-1",
    name: "Assistant" as const,
  };
  const mockNavigation = { goBack: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    mockChat.loading = false;
    mockChat.values = [];
    mockChat.recommendations = [];
    mockChat.messages = [];
  });

  it("shows loading indicator when loading", () => {
    mockChat.loading = true;
    const { getByLabelText } = render(
      // @ts-expect-error - using minimal mock props for testing
      <AssistantScreen route={mockRoute} navigation={mockNavigation} />,
    );
    expect(getByLabelText("Loading assistant")).toBeTruthy();
  });

  it("renders symbol header", () => {
    const { getByTestId } = render(
      // @ts-expect-error - using minimal mock props for testing
      <AssistantScreen route={mockRoute} navigation={mockNavigation} />,
    );
    expect(getByTestId("symbol-header")).toBeTruthy();
  });

  it("calls navigation.goBack when back is pressed", () => {
    const { getByTestId } = render(
      // @ts-expect-error - using minimal mock props for testing
      <AssistantScreen route={mockRoute} navigation={mockNavigation} />,
    );
    fireEvent.press(getByTestId("back-btn"));
    expect(mockNavigation.goBack).toHaveBeenCalled();
  });

  it("shows empty state when no values or recommendations", () => {
    const { getByText } = render(
      // @ts-expect-error - using minimal mock props for testing
      <AssistantScreen route={mockRoute} navigation={mockNavigation} />,
    );
    expect(
      getByText("Your values will appear here as we explore them together."),
    ).toBeTruthy();
  });

  it("renders value cards when values exist", () => {
    mockChat.values = [
      { id: "v1", active_revision: { statement: "Value 1" } },
      { id: "v2", active_revision: { statement: "Value 2" } },
    ];
    const { getByTestId } = render(
      // @ts-expect-error - using minimal mock props for testing
      <AssistantScreen route={mockRoute} navigation={mockNavigation} />,
    );
    expect(getByTestId("value-card-v1")).toBeTruthy();
    expect(getByTestId("value-card-v2")).toBeTruthy();
  });

  it("renders input bar", () => {
    const { getByTestId } = render(
      // @ts-expect-error - using minimal mock props for testing
      <AssistantScreen route={mockRoute} navigation={mockNavigation} />,
    );
    expect(getByTestId("input-bar")).toBeTruthy();
  });

  it("uses default contextMode when not provided", () => {
    const routeNoParams = {
      params: undefined,
      key: "Assistant-2",
      name: "Assistant" as const,
    };
    const { getByTestId } = render(
      // @ts-expect-error - using minimal mock props for testing
      <AssistantScreen route={routeNoParams} navigation={mockNavigation} />,
    );
    expect(getByTestId("symbol-header")).toBeTruthy();
  });
});
