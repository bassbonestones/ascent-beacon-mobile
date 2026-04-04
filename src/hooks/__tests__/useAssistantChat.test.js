import { renderHook, act, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

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

describe("useAssistantChat", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});

    api.createAssistantSession.mockResolvedValue({ id: "session-123" });
    api.getValues.mockResolvedValue({ values: [] });
    api.getSessionRecommendations.mockResolvedValue([]);
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

    expect(api.createAssistantSession).toHaveBeenCalledWith("values");
    // Session is created but sessionId is not exposed
    expect(result.current.messages.length).toBeGreaterThan(0);
  });

  it("loads values on mount", async () => {
    api.getValues.mockResolvedValue({
      values: [{ id: "v1", insights: [] }],
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
    api.createAssistantSession.mockRejectedValue(new Error("Network error"));

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

    expect(api.sendMessage).not.toHaveBeenCalled();
  });

  it("sends message to assistant", async () => {
    api.sendMessage.mockResolvedValue({
      id: "msg-1",
      response: "Hello back!",
      created_at: new Date().toISOString(),
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

    expect(api.sendMessage).toHaveBeenCalled();
  });

  it("clears input after sending message", async () => {
    api.sendMessage.mockResolvedValue({
      id: "msg-1",
      response: "Response",
      created_at: new Date().toISOString(),
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
    api.acceptRecommendation.mockResolvedValue({
      result_entity_id: "v1",
    });
    api.getValues.mockResolvedValue({
      values: [{ id: "v1", insights: [] }],
    });

    const { result } = renderHook(() => useAssistantChat());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.handleAcceptRecommendation("rec-1");
    });

    expect(api.acceptRecommendation).toHaveBeenCalledWith("rec-1");
  });

  it("rejects recommendation", async () => {
    api.rejectRecommendation.mockResolvedValue({});

    const { result } = renderHook(() => useAssistantChat());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.handleRejectRecommendation("rec-1");
    });

    expect(api.rejectRecommendation).toHaveBeenCalledWith(
      "rec-1",
      "Not quite right for me",
    );
  });

  it("shows alert on reject error", async () => {
    api.rejectRecommendation.mockRejectedValue(new Error("Failed"));

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
    api.acknowledgeValueInsight.mockResolvedValue({});

    const { result } = renderHook(() => useAssistantChat());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.handleKeepBoth("v1");
    });

    expect(api.acknowledgeValueInsight).toHaveBeenCalledWith("v1");
  });

  it("extracts value insights from loaded values", async () => {
    api.getValues.mockResolvedValue({
      values: [
        {
          id: "v1",
          insights: [{ message: "Similar to another value" }],
        },
      ],
    });

    const { result } = renderHook(() => useAssistantChat());

    await waitFor(() => {
      expect(result.current.valueInsights).toEqual({
        v1: { message: "Similar to another value" },
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
