import { useState, useEffect, useRef, useCallback, RefObject } from "react";
import { ScrollView } from "react-native";
import api from "../services/api";
import { logError } from "../utils/logger";
import { showAlert } from "../utils/alert";
import { getActiveRevision } from "../utils/valueMatching";
import {
  handlePendingAction,
  handleEditMode,
  handleVagueReference,
  handleSpecificReference,
  handleTriggerMatch,
} from "../utils/messageHandlers";
import useValueActions from "./useValueActions";
import type { Value, ValueInsight, AssistantRecommendation } from "../types";

export type ContextMode = "values" | "priorities";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  recommendation_id?: string;
}

interface PendingAction {
  type: "edit" | "delete";
  valueId: string;
}

const getWelcomeMessage = (mode: ContextMode): string =>
  mode === "values"
    ? "Hello. I'm here to help you explore what matters to you right now.\n\nBefore we begin, how are things feeling for you today? Are you on course, a bit off track, or feeling adrift?"
    : "Hello. I'm here to help you navigate your priorities.";

/**
 * Return type for useAssistantChat hook.
 */
export interface UseAssistantChatReturn {
  loading: boolean;
  sending: boolean;
  recording: boolean;
  messages: Message[];
  inputText: string;
  values: Value[];
  recommendations: AssistantRecommendation[];
  valueInsights: Record<string, ValueInsight>;
  highlightValueId: string | null;
  deleteConfirmId: string | null;
  setInputText: (text: string) => void;
  scrollViewRef: RefObject<ScrollView | null>;
  modelScrollRef: RefObject<ScrollView | null>;
  valuePositions: RefObject<Record<string, number>>;
  handleSendMessage: () => Promise<void>;
  handleVoiceRecord: () => void;
  handleAcceptRecommendation: (recId: string) => Promise<void>;
  handleRejectRecommendation: (recId: string) => Promise<void>;
  handleKeepBoth: (valueId: string) => Promise<void>;
  handleReviewInsight: (valueId: string) => void;
  startEditValue: (value: Value) => void;
  confirmDeleteValue: (value: Value) => void;
  cancelDeleteValue: () => void;
  performDeleteValue: (value: Value) => Promise<void>;
  getActiveRevision: typeof getActiveRevision;
}

/**
 * Hook for managing assistant chat state and message handling.
 */
export default function useAssistantChat(
  contextMode: ContextMode = "values",
): UseAssistantChatReturn {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recommendations, setRecommendations] = useState<
    AssistantRecommendation[]
  >([]);
  const [values, setValues] = useState<Value[]>([]);
  const [valueInsights, setValueInsights] = useState<
    Record<string, ValueInsight>
  >({});
  const [highlightValueId, setHighlightValueId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );

  const scrollViewRef = useRef<ScrollView | null>(null);
  const modelScrollRef = useRef<ScrollView | null>(null);
  const valuePositions = useRef<Record<string, number>>({});

  const addAssistantMessage = useCallback(
    (content: string, suffix: string = ""): void => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + suffix,
          role: "assistant",
          content,
          created_at: new Date().toISOString(),
        },
      ]);
    },
    [],
  );

  const loadValues = useCallback(async (): Promise<void> => {
    try {
      const response = await api.getValues();
      const nextValues = response.values || [];
      setValues(nextValues);
      const nextInsights: Record<string, ValueInsight> = {};
      nextValues.forEach((v) => {
        if (v.insights?.length > 0) nextInsights[v.id] = v.insights[0];
      });
      setValueInsights(nextInsights);
    } catch (error) {
      logError("Failed to load values:", error);
    }
  }, []);

  const valueActions = useValueActions(addAssistantMessage, loadValues);

  useEffect(() => {
    initializeSession();
    loadValues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeSession = async (): Promise<void> => {
    try {
      setLoading(true);
      const session = await api.createAssistantSession(contextMode);
      setSessionId(session.id);
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: getWelcomeMessage(contextMode),
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      logError("Failed to create session:", error);
      showAlert("Error", "Failed to start conversation");
    } finally {
      setLoading(false);
    }
  };

  const sendToAssistant = async (content: string): Promise<void> => {
    setSending(true);
    try {
      const response = await api.sendMessage(sessionId!, content, "text");
      setMessages((prev) => [
        ...prev,
        {
          id: response.session_id || Date.now().toString() + "_assistant",
          role: "assistant",
          content: response.response,
          created_at: new Date().toISOString(),
        },
      ]);
      await loadRecommendations();
    } catch (error) {
      logError("Failed to send message:", error);
      showAlert("Error", "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = async (): Promise<void> => {
    if (!inputText.trim() || sending || !sessionId) return;
    const trimmed = inputText.trim();
    const normalized = trimmed.toLowerCase();
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmed,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");

    const ctx = {
      normalized,
      trimmed,
      values,
      pendingAction,
      setPendingAction,
      editValueId: valueActions.editValueId,
      setEditValueId: valueActions.setEditValueId,
      lastMentionedValueId: valueActions.lastMentionedValueId,
      setLastMentionedValueId: valueActions.setLastMentionedValueId,
      setSending,
      performDeleteValue: valueActions.performDeleteValue,
      updateValue: valueActions.updateValue,
      addAssistantMessage,
    };

    if (pendingAction && (await handlePendingAction(ctx))) return;
    if (valueActions.editValueId && (await handleEditMode(ctx))) return;
    if (handleVagueReference(ctx)) return;
    if (await handleSpecificReference(ctx)) return;
    if (await handleTriggerMatch(ctx)) return;
    await sendToAssistant(trimmed);
  };

  const loadRecommendations = async (): Promise<void> => {
    if (!sessionId) return;
    try {
      const recs = await api.getSessionRecommendations(sessionId);
      setRecommendations(recs.filter((r) => r.status === "pending"));
    } catch (error) {
      logError("Failed to load recommendations:", error);
    }
  };

  const handleAcceptRecommendation = async (recId: string): Promise<void> => {
    try {
      const rec = recommendations.find((item) => item.id === recId);
      const payload = rec?.payload as { statement?: string } | undefined;
      const statement = payload?.statement;
      const result = (await api.acceptRecommendation(recId)) as {
        result_entity_id?: string;
      };
      if (result?.result_entity_id)
        valueActions.setLastMentionedValueId(result.result_entity_id);
      setRecommendations((prev) => prev.filter((r) => r.id !== recId));
      await loadValues();

      let insightMessage: string | null = null;
      if (result?.result_entity_id) {
        const response = await api.getValues();
        const matched = response.values?.find(
          (v) => v.id === result.result_entity_id,
        );
        if (matched?.insights?.length)
          insightMessage = matched.insights[0].message;
      }
      if (statement) {
        addAssistantMessage(
          `Saved "${statement}" as a value. Want to add another, or refine this one?`,
          "_saved",
        );
        if (insightMessage) addAssistantMessage(insightMessage, "_insight");
      }
    } catch (error) {
      logError("Failed to accept recommendation:", error);
      showAlert("Error", (error as Error).message || "Failed to add value");
    }
  };

  const handleRejectRecommendation = async (recId: string): Promise<void> => {
    try {
      await api.rejectRecommendation(recId, "Not quite right for me");
      setRecommendations((prev) => prev.filter((r) => r.id !== recId));
    } catch (error) {
      logError("Failed to reject recommendation:", error);
      showAlert("Error", "Failed to reject recommendation");
    }
  };

  const handleVoiceRecord = (): void =>
    showAlert("Voice Input", "Voice recording coming soon!");

  const handleKeepBoth = async (valueId: string): Promise<void> => {
    try {
      await api.acknowledgeValueInsight(valueId);
    } catch (error) {
      logError("Failed to acknowledge insight:", error);
    }
    setValueInsights((prev) => {
      const next = { ...prev };
      delete next[valueId];
      return next;
    });
  };

  const handleReviewInsight = (valueId: string): void => {
    const insight = valueInsights[valueId];
    if (!insight?.similar_value_id) return;
    const targetY = valuePositions.current[insight.similar_value_id];
    if (typeof targetY === "number") {
      modelScrollRef.current?.scrollTo({
        y: Math.max(targetY - 12, 0),
        animated: true,
      });
    }

    setHighlightValueId(insight.similar_value_id);
    setTimeout(() => setHighlightValueId(null), 1200);
  };

  return {
    // State
    loading,
    sending: sending || valueActions.sending,
    recording,
    messages,
    inputText,
    values,
    recommendations,
    valueInsights,
    highlightValueId,
    deleteConfirmId: valueActions.deleteConfirmId,

    // Setters
    setInputText,

    // Refs
    scrollViewRef,
    modelScrollRef,
    valuePositions,

    // Handlers
    handleSendMessage,
    handleVoiceRecord,
    handleAcceptRecommendation,
    handleRejectRecommendation,
    handleKeepBoth,
    handleReviewInsight,
    startEditValue: valueActions.startEditValue,
    confirmDeleteValue: valueActions.confirmDeleteValue,
    cancelDeleteValue: valueActions.cancelDeleteValue,
    performDeleteValue: valueActions.performDeleteValue,

    // Utilities
    getActiveRevision,
  };
}
