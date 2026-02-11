import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import api from "../services/api";

export default function AssistantScreen({ route, navigation }) {
  const { contextMode = "values" } = route.params || {};

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
  const [editValueId, setEditValueId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [lastMentionedValueId, setLastMentionedValueId] = useState(null);

  const scrollViewRef = useRef();
  const modelScrollRef = useRef();
  const valuePositions = useRef({});

  useEffect(() => {
    initializeSession();
    loadValues();
  }, []);

  const loadValues = async () => {
    try {
      const response = await api.getValues();
      const nextValues = response.values || [];
      setValues(nextValues);
      const nextInsights = {};
      nextValues.forEach((value) => {
        if (value.insights && value.insights.length > 0) {
          nextInsights[value.id] = value.insights[0];
        }
      });
      setValueInsights(nextInsights);
    } catch (error) {
      console.error("Failed to load values:", error);
    }
  };

  const initializeSession = async () => {
    try {
      setLoading(true);
      const session = await api.createAssistantSession(contextMode);
      setSessionId(session.id);

      // Add welcome message
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

  const getWelcomeMessage = (mode) => {
    if (mode === "values") {
      return "Hello. I'm here to help you explore what matters to you right now.\n\nBefore we begin, how are things feeling for you today? Are you on course, a bit off track, or feeling adrift?";
    }
    return "Hello. I'm here to help you navigate your priorities.";
  };

  const getActiveRevision = (value) => {
    if (!value?.active_revision_id || !value.revisions) return null;
    return value.revisions.find((rev) => rev.id === value.active_revision_id);
  };

  const cleanSnippet = (text) => {
    return text
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const findValueBySnippet = (snippet) => {
    const normalized = cleanSnippet(snippet);
    if (!normalized) return null;

    return values.find((value) => {
      const activeRev = getActiveRevision(value);
      const statement = activeRev?.statement?.toLowerCase() || "";
      return statement.includes(normalized);
    });
  };

  const STOP_WORDS = new Set([
    "a",
    "about",
    "the",
    "an",
    "and",
    "or",
    "to",
    "of",
    "with",
    "that",
    "this",
    "it",
    "value",
    "values",
    "one",
    "can",
    "we",
    "i",
    "im",
    "i'm",
    "want",
    "like",
    "not",
    "really",
    "just",
    "maybe",
    "please",
  ]);

  const tokenize = (text) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token && !STOP_WORDS.has(token));

  const stripTriggers = (text, triggers) => {
    let cleaned = text;
    triggers.forEach((trigger) => {
      cleaned = cleaned.replace(new RegExp(trigger, "gi"), " ");
    });
    return cleaned;
  };

  const findBestValueMatch = (text) => {
    const keywords = new Set(tokenize(text));
    if (keywords.size === 0) return null;

    let best = null;
    let bestScore = 0;

    values.forEach((value) => {
      const activeRev = getActiveRevision(value);
      if (!activeRev?.statement) return;

      const statement = activeRev.statement.toLowerCase();
      const tokens = new Set(tokenize(statement));
      let matches = 0;

      keywords.forEach((token) => {
        if (tokens.has(token) || statement.includes(token)) {
          matches += 1;
        }
      });

      const score = matches / Math.max(tokens.size, 1);
      if (score > bestScore) {
        bestScore = score;
        best = value;
      }
    });

    if (bestScore >= 0.25) {
      return best;
    }

    return null;
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

    if (pendingAction) {
      const isYes =
        normalized === "yes" ||
        normalized.startsWith("yes ") ||
        normalized === "y";
      const isNo =
        normalized === "no" ||
        normalized.startsWith("no ") ||
        normalized === "n";

      if (isNo) {
        setPendingAction(null);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString() + "_cancel",
            role: "assistant",
            content:
              "Okay, I won't change it. Want to add another value or explore further?",
            created_at: new Date().toISOString(),
          },
        ]);
        return;
      }

      if (isYes) {
        const value = values.find((item) => item.id === pendingAction.valueId);
        if (!value) {
          setPendingAction(null);
          return;
        }

        if (pendingAction.type === "delete") {
          try {
            setSending(true);
            await api.deleteValue(value.id);
            await loadValues();
            const activeRev = getActiveRevision(value);
            const deletedText = activeRev?.statement || "that value";
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString() + "_deleted",
                role: "assistant",
                content: `Deleted "${deletedText}". Want to add another, or refine one?`,
                created_at: new Date().toISOString(),
              },
            ]);
          } catch (error) {
            console.error("Failed to delete value:", error);
            Alert.alert("Error", "Failed to delete value");
          } finally {
            setSending(false);
            setPendingAction(null);
          }
          return;
        }

        if (pendingAction.type === "edit") {
          setEditValueId(value.id);
          const activeRev = getActiveRevision(value);
          const existingStatement = activeRev?.statement || "that value";
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString() + "_edit",
              role: "assistant",
              content: `Send the new wording for "${existingStatement}", or say "discuss" to talk it through.`,
              created_at: new Date().toISOString(),
            },
          ]);
          setPendingAction(null);
          return;
        }
      }
    }

    if (editValueId) {
      if (normalized.includes("discuss")) {
        setEditValueId(null);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString() + "_discuss",
            role: "assistant",
            content:
              "Okay, let's talk it through. What's the heart of this value for you?",
            created_at: new Date().toISOString(),
          },
        ]);
        return;
      }

      const value = values.find((item) => item.id === editValueId);
      const activeRev = getActiveRevision(value);
      if (value && activeRev) {
        try {
          setSending(true);
          await api.updateValue(value.id, {
            statement: trimmed,
            weight_raw: activeRev.weight_raw,
            origin: activeRev.origin,
          });
          await loadValues();
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString() + "_updated",
              role: "assistant",
              content: `Updated that value to: "${trimmed}". Want to add another, or refine this one?`,
              created_at: new Date().toISOString(),
            },
          ]);
        } catch (error) {
          console.error("Failed to update value:", error);
          Alert.alert("Error", "Failed to update value");
        } finally {
          setSending(false);
          setEditValueId(null);
        }
        return;
      }
    }

    // Check for vague references to the last mentioned value
    const vagueEditPatterns = [
      /^(let'?s\s+)?(refine|edit|update|change|revise|reword)\s+(it|that|this)(\s+now)?$/i,
      /^(refine|edit|update|change|revise|reword)\s+$/i,
      /^(let'?s\s+)?(refine|edit|update|change)\s+(the\s+)?(last|recent)\s+one$/i,
    ];

    const vagueDeletePatterns = [
      /^(let'?s\s+)?(delete|remove|drop|get\s+rid\s+of)\s+(it|that|this)(\s+now)?$/i,
      /^(delete|remove|drop)\s+$/i,
      /^(let'?s\s+)?(delete|remove)\s+(the\s+)?(last|recent)\s+one$/i,
    ];

    if (
      vagueEditPatterns.some((pattern) => pattern.test(normalized)) &&
      lastMentionedValueId
    ) {
      const target = values.find((v) => v.id === lastMentionedValueId);
      if (target) {
        const activeRev = getActiveRevision(target);
        const statement = activeRev?.statement || "that value";
        setPendingAction({ type: "edit", valueId: target.id });
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString() + "_confirm_edit",
            role: "assistant",
            content: `You want to edit "${statement}". Should I update that one? (yes/no)`,
            created_at: new Date().toISOString(),
          },
        ]);
        return;
      }
    }

    if (
      vagueDeletePatterns.some((pattern) => pattern.test(normalized)) &&
      lastMentionedValueId
    ) {
      const target = values.find((v) => v.id === lastMentionedValueId);
      if (target) {
        const activeRev = getActiveRevision(target);
        const statement = activeRev?.statement || "that value";
        setPendingAction({ type: "delete", valueId: target.id });
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString() + "_confirm_delete",
            role: "assistant",
            content: `You want to remove "${statement}". Should I delete it? (yes/no)`,
            created_at: new Date().toISOString(),
          },
        ]);
        return;
      }
    }

    if (
      normalized.includes("edit the one about") ||
      normalized.includes("edit the one with")
    ) {
      const snippet =
        normalized.split("about")[1] || normalized.split("with")[1] || "";
      let target = findValueBySnippet(snippet);

      if (!target) {
        const cleanedSnippet = cleanSnippet(snippet);
        try {
          setSending(true);
          const match = await api.matchValue(cleanedSnippet || trimmed);
          target = values.find((item) => item.id === match?.value_id) || null;
        } catch (error) {
          console.error("Failed to match value:", error);
        } finally {
          setSending(false);
        }
      }

      if (target) {
        const activeRev = getActiveRevision(target);
        const statement = activeRev?.statement || "that value";
        setLastMentionedValueId(target.id);
        setPendingAction({ type: "edit", valueId: target.id });
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString() + "_confirm_edit",
            role: "assistant",
            content: `You want to edit "${statement}". Should I update that one? (yes/no)`,
            created_at: new Date().toISOString(),
          },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "_not_found",
          role: "assistant",
          content:
            "I couldn't find a value matching that. Try a few exact words from the statement?",
          created_at: new Date().toISOString(),
        },
      ]);
      return;
    }

    if (
      normalized.includes("remove the one about") ||
      normalized.includes("delete the one about") ||
      normalized.includes("remove the one with") ||
      normalized.includes("delete the one with")
    ) {
      const snippet =
        normalized.split("about")[1] || normalized.split("with")[1] || "";
      let target = findValueBySnippet(snippet);

      if (!target) {
        const cleanedSnippet = cleanSnippet(snippet);
        try {
          setSending(true);
          const match = await api.matchValue(cleanedSnippet || trimmed);
          target = values.find((item) => item.id === match?.value_id) || null;
        } catch (error) {
          console.error("Failed to match value:", error);
        } finally {
          setSending(false);
        }
      }

      if (target) {
        const activeRev = getActiveRevision(target);
        const statement = activeRev?.statement || "that value";
        setLastMentionedValueId(target.id);
        setPendingAction({ type: "delete", valueId: target.id });
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString() + "_confirm_delete",
            role: "assistant",
            content: `You want to remove "${statement}". Should I delete it? (yes/no)`,
            created_at: new Date().toISOString(),
          },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "_not_found",
          role: "assistant",
          content:
            "I couldn't find a value matching that. Try a few exact words from the statement?",
          created_at: new Date().toISOString(),
        },
      ]);
      return;
    }

    const editTriggers = [
      "edit",
      "update",
      "change",
      "revise",
      "reword",
      "refine",
      "not crazy about",
      "not happy with",
      "not a fan",
      "dont like",
      "don't like",
    ];
    const deleteTriggers = [
      "delete",
      "remove",
      "drop",
      "get rid of",
      "ditch",
      "eliminate",
      "dont want",
      "don't want",
    ];

    const wantsDelete = deleteTriggers.some((trigger) =>
      normalized.includes(trigger),
    );
    const wantsEdit = editTriggers.some((trigger) =>
      normalized.includes(trigger),
    );

    if (wantsDelete || wantsEdit) {
      const triggers = wantsDelete ? deleteTriggers : editTriggers;
      const cleaned = stripTriggers(normalized, triggers);
      let target =
        findBestValueMatch(cleaned) || findBestValueMatch(normalized);

      if (!target) {
        const queryForLLM = cleanSnippet(cleaned) || cleanSnippet(normalized);
        try {
          setSending(true);
          const match = await api.matchValue(queryForLLM);
          target = values.find((item) => item.id === match?.value_id) || null;
        } catch (error) {
          console.error("Failed to match value:", error);
        } finally {
          setSending(false);
        }
      }

      if (target) {
        const activeRev = getActiveRevision(target);
        const statement = activeRev?.statement || "that value";
        if (wantsDelete) {
          setLastMentionedValueId(target.id);
          setPendingAction({ type: "delete", valueId: target.id });
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString() + "_confirm_delete",
              role: "assistant",
              content: `You want to remove "${statement}". Should I delete it? (yes/no)`,
              created_at: new Date().toISOString(),
            },
          ]);
          return;
        }

        setLastMentionedValueId(target.id);
        setPendingAction({ type: "edit", valueId: target.id });
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString() + "_confirm_edit",
            role: "assistant",
            content: `You want to edit "${statement}". Should I update that one? (yes/no)`,
            created_at: new Date().toISOString(),
          },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "_not_found",
          role: "assistant",
          content:
            "I couldn't find a value matching that. Try a few exact words from the statement?",
          created_at: new Date().toISOString(),
        },
      ]);
      return;
    }

    setSending(true);

    try {
      const response = await api.sendMessage(
        sessionId,
        userMessage.content,
        "text",
      );

      const assistantMessage = {
        id: response.id || Date.now().toString() + "_assistant",
        role: "assistant",
        content: response.response,
        created_at: response.created_at || new Date().toISOString(),
        recommendation_id: response.recommendation_id,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // If there's a recommendation, fetch it
      if (response.recommendation_id) {
        await loadRecommendations();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      Alert.alert("Error", "Failed to send message");
    } finally {
      setSending(false);
    }
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
      // Track the newly created value for context
      if (result?.result_entity_id) {
        setLastMentionedValueId(result.result_entity_id);
      }
      // Remove from recommendations
      setRecommendations((prev) => prev.filter((r) => r.id !== recId));
      // Reload values to show the new one
      await loadValues();

      let insightMessage = null;
      if (result?.result_entity_id) {
        const response = await api.getValues();
        const matched = response.values?.find(
          (value) => value.id === result.result_entity_id,
        );
        if (matched?.insights?.length) {
          insightMessage = matched.insights[0].message;
        }
      }

      if (statement) {
        const savedMessage = {
          id: Date.now().toString() + "_saved",
          role: "assistant",
          content: `Saved "${statement}" as a value. Want to add another, or refine this one?`,
          created_at: new Date().toISOString(),
        };

        const nextMessages = insightMessage
          ? [
              savedMessage,
              {
                id: Date.now().toString() + "_insight",
                role: "assistant",
                content: insightMessage,
                created_at: new Date().toISOString(),
              },
            ]
          : [savedMessage];

        setMessages((prev) => [...prev, ...nextMessages]);
      }
    } catch (error) {
      console.error("Failed to accept recommendation:", error);
      const errorMessage = error.message || "Failed to add value";
      Alert.alert("Error", errorMessage);
    }
  };

  const handleRejectRecommendation = async (recId) => {
    try {
      await api.rejectRecommendation(recId, "Not quite right for me");
      // Remove from recommendations
      setRecommendations((prev) => prev.filter((r) => r.id !== recId));
    } catch (error) {
      console.error("Failed to reject recommendation:", error);
      Alert.alert("Error", "Failed to reject recommendation");
    }
  };

  const handleVoiceRecord = () => {
    // Voice recording will be implemented next
    Alert.alert("Voice Input", "Voice recording coming soon!");
  };

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

  const startEditValue = (value) => {
    setEditValueId(value.id);
    const activeRev = getActiveRevision(value);
    const existingStatement = activeRev?.statement || "that value";
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString() + "_edit",
        role: "assistant",
        content: `Got it. Send the new wording for "${existingStatement}", or say "discuss" to talk it through.`,
        created_at: new Date().toISOString(),
      },
    ]);
  };

  const confirmDeleteValue = (value) => {
    setDeleteConfirmId(value.id);
  };

  const cancelDeleteValue = () => {
    setDeleteConfirmId(null);
  };

  const performDeleteValue = async (value) => {
    try {
      setSending(true);
      await api.deleteValue(value.id);
      await loadValues();
      const activeRev = getActiveRevision(value);
      const deletedText = activeRev?.statement || "that value";
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "_deleted",
          role: "assistant",
          content: `Deleted "${deletedText}". Want to add another, or refine one?`,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error("Failed to delete value:", error);
      Alert.alert("Error", "Failed to delete value");
    } finally {
      setSending(false);
      setDeleteConfirmId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Zone 1: Meaning/Symbol Zone (Top) */}
      <View style={styles.symbolZone}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Image
          source={require("../../assets/NorthStarIcon_values.png")}
          style={styles.symbolImage}
          resizeMode="contain"
        />
        <Text style={styles.symbolLabel}>Values</Text>
      </View>

      {/* Zone 2: Living Model Zone (Middle) */}
      <ScrollView
        ref={modelScrollRef}
        style={styles.modelZone}
        contentContainerStyle={styles.modelContent}
      >
        {values.length === 0 && recommendations.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Your values will appear here as we explore them together.
            </Text>
          </View>
        )}

        {/* Show saved values */}
        {values.map((value) => {
          const activeRev = value.active_revision || getActiveRevision(value);
          if (!activeRev) return null;

          return (
            <View
              key={value.id}
              style={[
                styles.valueCard,
                value.id === highlightValueId && styles.similarHighlight,
              ]}
              onLayout={(event) => {
                valuePositions.current[value.id] = event.nativeEvent.layout.y;
              }}
            >
              <Text style={styles.valueStatement}>{activeRev.statement}</Text>
              <View style={styles.valueFooter}>
                <Text style={styles.valueOrigin}>
                  {activeRev.origin === "explored" ? "✨ Explored" : "Declared"}
                </Text>
              </View>
              <View style={styles.valueActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => startEditValue(value)}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => confirmDeleteValue(value)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
              {deleteConfirmId === value.id && (
                <View style={styles.deleteConfirm}>
                  <Text style={styles.deleteConfirmText}>
                    Delete this value?
                  </Text>
                  <View style={styles.deleteConfirmActions}>
                    <TouchableOpacity
                      style={styles.deleteConfirmButton}
                      onPress={() => performDeleteValue(value)}
                    >
                      <Text style={styles.deleteConfirmButtonText}>Delete</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelDeleteButton}
                      onPress={cancelDeleteValue}
                    >
                      <Text style={styles.cancelDeleteButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              {valueInsights[value.id] && (
                <View style={styles.insightContainer}>
                  <Text style={styles.insightText}>
                    {valueInsights[value.id].message}
                  </Text>
                  <View style={styles.insightActions}>
                    {valueInsights[value.id].similar_value_id && (
                      <TouchableOpacity
                        style={styles.insightButton}
                        onPress={() => handleReviewInsight(value.id)}
                      >
                        <Text style={styles.insightButtonText}>Review</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.insightButton}
                      onPress={() => handleKeepBoth(value.id)}
                    >
                      <Text style={styles.insightButtonText}>Keep both</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        })}

        {/* Show pending recommendations */}
        {recommendations.map((rec) => (
          <View key={rec.id} style={styles.proposedValueCard}>
            <View style={styles.proposedHeader}>
              <Text style={styles.proposedLabel}>Proposed Value</Text>
            </View>
            <Text style={styles.proposedStatement}>
              {rec.payload.statement}
            </Text>
            {rec.rationale && (
              <Text style={styles.proposedRationale}>{rec.rationale}</Text>
            )}
            <View style={styles.proposedActions}>
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={() => handleRejectRecommendation(rec.id)}
              >
                <Text style={styles.rejectButtonText}>Not Quite</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => handleAcceptRecommendation(rec.id)}
              >
                <Text style={styles.acceptButtonText}>Add This</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Zone 3: Input Zone (Bottom) */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Chat messages - compact view */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatZone}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageRow,
                message.role === "user" ? styles.userRow : styles.assistantRow,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  message.role === "user"
                    ? styles.userBubble
                    : styles.assistantBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.role === "user"
                      ? styles.userText
                      : styles.assistantText,
                  ]}
                >
                  {message.content}
                </Text>
              </View>
            </View>
          ))}
          {sending && (
            <View style={[styles.messageRow, styles.assistantRow]}>
              <View style={[styles.messageBubble, styles.assistantBubble]}>
                <ActivityIndicator size="small" color="#D4AF37" />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input bar */}
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.voiceButton}
            onPress={handleVoiceRecord}
            disabled={recording || sending}
          >
            <Text style={styles.voiceButtonText}>🎤</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your response..."
            placeholderTextColor="#999"
            multiline
            maxLength={1000}
            editable={!sending}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || sending}
          >
            <Text style={styles.sendButtonText}>→</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
  },

  // Zone 1: Symbol Zone (Top)
  symbolZone: {
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    position: "relative",
  },
  backButton: {
    position: "absolute",
    top: 60,
    left: 20,
    padding: 8,
  },
  backButtonText: {
    fontSize: 28,
    color: "#666",
  },
  symbolImage: {
    width: 64,
    height: 64,
    marginBottom: 8,
  },
  symbolLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  // Zone 2: Living Model Zone (Middle)
  modelZone: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  modelContent: {
    padding: 20,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
    color: "#999",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 280,
  },
  valueCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  similarHighlight: {
    borderWidth: 1,
    borderColor: "#D4AF37",
  },
  valueStatement: {
    fontSize: 16,
    lineHeight: 24,
    color: "#000",
    marginBottom: 8,
  },
  insightContainer: {
    marginTop: 8,
  },
  insightText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#8A8A8A",
  },
  insightActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
  },
  insightButton: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  insightButtonText: {
    fontSize: 12,
    color: "#6B6B6B",
    fontWeight: "600",
  },
  valueFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  valueOrigin: {
    fontSize: 12,
    color: "#D4AF37",
    fontWeight: "500",
  },
  valueActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 10,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#E3F2FD",
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1976D2",
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },
  deleteConfirm: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#FAFAFA",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  deleteConfirmText: {
    fontSize: 12,
    color: "#666",
  },
  deleteConfirmActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 8,
  },
  deleteConfirmButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#FDECEA",
  },
  deleteConfirmButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#C62828",
  },
  cancelDeleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#F5F5F5",
  },
  cancelDeleteButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  proposedValueCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#D4AF37",
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  proposedHeader: {
    marginBottom: 8,
  },
  proposedLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#D4AF37",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  proposedStatement: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
    lineHeight: 25,
  },
  proposedRationale: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    lineHeight: 20,
  },
  proposedActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },

  // Zone 3: Input Zone (Bottom)
  chatZone: {
    maxHeight: 200,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  chatContent: {
    padding: 12,
  },
  messageRow: {
    marginBottom: 8,
  },
  userRow: {
    alignItems: "flex-end",
  },
  assistantRow: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "85%",
    padding: 10,
    borderRadius: 12,
  },
  userBubble: {
    backgroundColor: "#E3F2FD",
    borderBottomRightRadius: 3,
  },
  assistantBubble: {
    backgroundColor: "#F5F5F5",
    borderBottomLeftRadius: 3,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 19,
  },
  userText: {
    color: "#1976D2",
  },
  assistantText: {
    color: "#333",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: 34,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  voiceButtonText: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 15,
    maxHeight: 80,
    marginRight: 8,
    color: "#000",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#D4AF37",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#E0E0E0",
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  rejectButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  acceptButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#D4AF37",
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});
