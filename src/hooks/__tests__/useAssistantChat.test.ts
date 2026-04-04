import { renderHook, act, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import type { AssistantSession, Value, ValueInsight } from "../../types";

// Mock api
jest.mock("../../services/api", () => ({
  __esModule: true,
  default: {
    createAssistantSession: jest.fn(),
    getValues: jest.fn(),
    sendMessage: jest.fn(),
    getSessionRecommendations: jest.fn(),
    acceptRecommendation: jest.fn(),
    rejectRecommendation: jest.fn(),
    acknowledgeValueInsight: jest.fn(),
  },
}));

// Mock message handlers
jest.mock("../../utils/messageHandlers", () => ({
  handlePendingAction: jest.fn(),
  handleEditMode: jest.fn(),
  handleVagueReference: jest.fn(),
  handleSpecificReference: jest.fn(),
  handleTriggerMatch: jest.fn(),
}));

// Mock useValueActions
jest.mock("../useValueActions", () => {
  return jest.fn(() => ({
    editValueId: null,
    setEditValueId: jest.fn(),
    deletingValueId: null,
    setDeletingValueId: jest.fn(),
    lastMentionedValueId: null,
    setLastMentionedValueId: jest.fn(),
    performDeleteValue: jest.fn(),
    updateValue: jest.fn(),
  }));
});

import useAssistantChat from "../useAssistantChat";
import api from "../../services/api";

const mockedApi = api as jest.Mocked<typeof api>;

// Helper to create mock session
const createMockSession = (
  overrides: Partial<AssistantSession> = {},
): AssistantSession => ({
  id: "session-123",
  user_id: "user-1",
  status: "active",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// Helper to create mock value
const createMockValue = (overrides: Partial<Value> = {}): Value => ({
  id: "v1",
  user_id: "user-1",
  active_revision_id: "rev-1",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  revisions: [
    {
      id: "rev-1",
      value_id: "v1",
      statement: "Test value",
      weight_raw: 1,
      weight_normalized: 100,
      is_active: true,
      origin: "declared",
      created_at: new Date().toISOString(),
    },
  ],
  insights: [],
  ...overrides,
});

describe("useAssistantChat", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});

    mockedApi.createAssistantSession.mockResolvedValue(createMockSession());
    mockedApi.getValues.mockResolvedValue({ values: [] });
    mockedApi.getSessionRecommendations.mockResolvedValue([]);
  });

  it("initializes with loading state", () => {
    const { result } = renderHook(() => useAssistantChat());
    expect(result.current.loading).toBe(true);
  });

  it("creates session on mount", async () => {
    const { result } = renderHook(() => useAssistantChat());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockedApi.createAssistantSession).toHaveBeenCalledWith("values");
    // Session is created but sessionId is not exposed
    expect(result.current.messages.length).toBeGreaterThan(0);
  });

  it("loads values on mount", async () => {
    mockedApi.getValues.mockResolvedValue({
      values: [createMockValue({ id: "v1" })],
    });

    const { result } = renderHook(() => useAssistantChat());

    await waitFor(() => {
      expect(result.current.values).toHaveLength(1);
    });
  });

  it("sets welcome message for values mode", async () => {
    const { result } = renderHook(() => useAssistantChat("values"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.messages[0].content).toContain(
      "I'm here to help you explore what matters",
    );
  });

  it("shows alert on session creation error", async () => {
    mockedApi.createAssistantSession.mockRejectedValue(
      new Error("Network error"),
    );

    renderHook(() => useAssistantChat());

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Failed to start conversation",
      );
    });
  });

  it("does not send message when input is empty", async () => {
    const { result } = renderHook(() => useAssistantChat());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.handleSendMessage();
    });

    expect(mockedApi.sendMessage).not.toHaveBeenCalled();
  });

  it("sends message to assistant", async () => {
    mockedApi.sendMessage.mockResolvedValue({
      session_id: "session-123",
      response: "Hello back!",
    });

    const { result } = renderHook(() => useAssistantChat());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setInputText("Hello");
    });

    await act(async () => {
      await result.current.handleSendMessage();
    });

    expect(mockedApi.sendMessage).toHaveBeenCalled();
  });

  it("clears input after sending message", async () => {
    mockedApi.sendMessage.mockResolvedValue({
      session_id: "session-123",
      response: "Response",
    });

    const { result } = renderHook(() => useAssistantChat());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setInputText("Test message");
    });

    await act(async () => {
      await result.current.handleSendMessage();
    });

    expect(result.current.inputText).toBe("");
  });

  it("shows voice alert when handleVoiceRecord called", async () => {
    const { result } = renderHook(() => useAssistantChat());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.handleVoiceRecord();
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "Voice Input",
      "Voice recording coming soon!",
    );
  });

  it("accepts recommendation", async () => {
    mockedApi.acceptRecommendation.mockResolvedValue(
      // @ts-expect-error - mock only returns partial data for testing
      { result_entity_id: "v1" },
    );
    mockedApi.getValues.mockResolvedValue({
      values: [createMockValue({ id: "v1" })],
    });

    const { result } = renderHook(() => useAssistantChat());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.handleAcceptRecommendation("rec-1");
    });

    expect(mockedApi.acceptRecommendation).toHaveBeenCalledWith("rec-1");
  });

  it("rejects recommendation", async () => {
    // @ts-expect-error - mock only returns partial data
    mockedApi.rejectRecommendation.mockResolvedValue({});

    const { result } = renderHook(() => useAssistantChat());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.handleRejectRecommendation("rec-1");
    });

    expect(mockedApi.rejectRecommendation).toHaveBeenCalledWith(
      "rec-1",
      "Not quite right for me",
    );
  });

  it("shows alert on reject error", async () => {
    mockedApi.rejectRecommendation.mockRejectedValue(new Error("Failed"));

    const { result } = renderHook(() => useAssistantChat());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.handleRejectRecommendation("rec-1");
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "Error",
      "Failed to reject recommendation",
    );
  });

  it("handles keep both", async () => {
    // @ts-expect-error - mock only returns partial data
    mockedApi.acknowledgeValueInsight.mockResolvedValue({});

    const { result } = renderHook(() => useAssistantChat());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.handleKeepBoth("v1");
    });

    expect(mockedApi.acknowledgeValueInsight).toHaveBeenCalledWith("v1");
  });

  it("extracts value insights from loaded values", async () => {
    const insight: ValueInsight = {
      type: "similarity",
      message: "Similar to another value",
    };
    mockedApi.getValues.mockResolvedValue({
      values: [createMockValue({ id: "v1", insights: [insight] })],
    });

    const { result } = renderHook(() => useAssistantChat());

    await waitFor(() => {
      expect(result.current.valueInsights).toEqual({
        v1: insight,
      });
    });
  });

  it("returns expected state properties", async () => {
    const { result } = renderHook(() => useAssistantChat());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current).toHaveProperty("messages");
    expect(result.current).toHaveProperty("inputText");
    expect(result.current).toHaveProperty("sending");
    expect(result.current).toHaveProperty("recording");
    expect(result.current).toHaveProperty("recommendations");
    expect(result.current).toHaveProperty("values");
    expect(result.current).toHaveProperty("handleSendMessage");
    expect(result.current).toHaveProperty("handleVoiceRecord");
    expect(result.current).toHaveProperty("handleAcceptRecommendation");
    expect(result.current).toHaveProperty("handleRejectRecommendation");
  });
});
