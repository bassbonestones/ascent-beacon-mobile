import { useState, useEffect, useRef, useCallback } from "react";
import { Alert } from "react-native";
import api from "../services/api";
import { getActiveRevision } from "../utils/valueMatching";
import {
  handlePendingAction,
  handleEditMode,
  handleVagueReference,
  handleSpecificReference,
  handleTriggerMatch,
} from "../utils/messageHandlers";
import useValueActions from "./useValueActions";

const getWelcomeMessage = (mode) =>
  mode === "values"
    ? "Hello. I'm here to help you explore what matters to you right now.\n\nBefore we begin, how are things feeling for you today? Are you on course, a bit off track, or feeling adrift?"
    : "Hello. I'm here to help you navigate your priorities.";

/**
 * Hook for managing assistant chat state and message handling.
 */
export default function useAssistantChat(contextMode = "values") {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [values, setValues] = useState([]);
  const [valueInsights, setValueInsights] = useState({});
  const [highlightValueId, setHighlightValueId] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

  const scrollViewRef = useRef();
  const modelScrollRef = useRef();
  const valuePositions = useRef({});

  const addAssistantMessage = useCallback((content, suffix = "") => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString() + suffix,
        role: "assistant",
        content,
        created_at: new Date().toISOString(),
      },
    ]);
  }, []);

  const loadValues = useCallback(async () => {
    try {
      const response = await api.getValues();
      const nextValues = response.values || [];
      setValues(nextValues);
      const nextInsights = {};
      nextValues.forEach((v) => {
        if (v.insights?.length > 0) nextInsights[v.id] = v.insights[0];
      });
      setValueInsights(nextInsights);
    } catch (error) {
      console.error("Failed to load values:", error);
    }
  }, []);

  const valueActions = useValueActions(addAssistantMessage, loadValues);

  useEffect(() => {
    initializeSession();
    loadValues();
  }, []);

  const initializeSession = async () => {
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
      console.error("Failed to create session:", error);
      Alert.alert("Error", "Failed to start conversation");
    } finally {
      setLoading(false);
    }
  };

  const sendToAssistant = async (content) => {
    setSending(true);
    try {
      const response = await api.sendMessage(sessionId, content, "text");
      setMessages((prev) => [
        ...prev,
        {
          id: response.id || Date.now().toString() + "_assistant",
          role: "assistant",
          content: response.response,
          created_at: response.created_at || new Date().toISOString(),
          recommendation_id: response.recommendation_id,
        },
      ]);
      if (response.recommendation_id) await loadRecommendations();
    } catch (error) {
      console.error("Failed to send message:", error);
      Alert.alert("Error", "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || sending || !sessionId) return;
    const trimmed = inputText.trim();
    const normalized = trimmed.toLowerCase();
    const userMessage = {
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

  const loadRecommendations = async () => {
    if (!sessionId) return;
    try {
      const recs = await api.getSessionRecommendations(sessionId);
      setRecommendations(recs.filter((r) => r.status === "proposed"));
    } catch (error) {
      console.error("Failed to load recommendations:", error);
    }
  };

  const handleAcceptRecommendation = async (recId) => {
    try {
      const rec = recommendations.find((item) => item.id === recId);
      const statement = rec?.payload?.statement;
      const result = await api.acceptRecommendation(recId);
      if (result?.result_entity_id)
        valueActions.setLastMentionedValueId(result.result_entity_id);
      setRecommendations((prev) => prev.filter((r) => r.id !== recId));
      await loadValues();

      let insightMessage = null;
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
      console.error("Failed to accept recommendation:", error);
      Alert.alert("Error", error.message || "Failed to add value");
    }
  };

  const handleRejectRecommendation = async (recId) => {
    try {
      await api.rejectRecommendation(recId, "Not quite right for me");
      setRecommendations((prev) => prev.filter((r) => r.id !== recId));
    } catch (error) {
      console.error("Failed to reject recommendation:", error);
      Alert.alert("Error", "Failed to reject recommendation");
    }
  };

  const handleVoiceRecord = () =>
    Alert.alert("Voice Input", "Voice recording coming soon!");

  const handleKeepBoth = async (valueId) => {
    try {
      await api.acknowledgeValueInsight(valueId);
    } catch (error) {
      console.error("Failed to acknowledge insight:", error);
    }
    setValueInsights((prev) => {
      const next = { ...prev };
      delete next[valueId];
      return next;
    });
  };

  const handleReviewInsight = (valueId) => {
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
