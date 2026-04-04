import { useState } from "react";
import { Alert } from "react-native";
import api from "../services/api";
import { getActiveRevision } from "../utils/valueMatching";

/**
 * Hook for managing value CRUD operations and insights.
 */
export default function useValueActions(addAssistantMessage, loadValues) {
  const [editValueId, setEditValueId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [lastMentionedValueId, setLastMentionedValueId] = useState(null);
  const [sending, setSending] = useState(false);

  const startEditValue = (value) => {
    setEditValueId(value.id);
    const activeRev = getActiveRevision(value);
    const existingStatement = activeRev?.statement || "that value";
    addAssistantMessage(
      `Got it. Send the new wording for "${existingStatement}", or say "discuss" to talk it through.`,
      "_edit",
    );
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
      addAssistantMessage(
        `Deleted "${deletedText}". Want to add another, or refine one?`,
        "_deleted",
      );
    } catch (error) {
      console.error("Failed to delete value:", error);
      Alert.alert("Error", "Failed to delete value");
    } finally {
      setSending(false);
      setDeleteConfirmId(null);
    }
  };

  const updateValue = async (value, newStatement) => {
    const activeRev = getActiveRevision(value);
    if (!activeRev) return false;

    try {
      setSending(true);
      await api.updateValue(value.id, {
        statement: newStatement,
        weight_raw: activeRev.weight_raw,
        origin: activeRev.origin,
      });
      await loadValues();
      addAssistantMessage(
        `Updated that value to: "${newStatement}". Want to add another, or refine this one?`,
        "_updated",
      );
      return true;
    } catch (error) {
      console.error("Failed to update value:", error);
      Alert.alert("Error", "Failed to update value");
      return false;
    } finally {
      setSending(false);
      setEditValueId(null);
    }
  };

  return {
    editValueId,
    setEditValueId,
    deleteConfirmId,
    lastMentionedValueId,
    setLastMentionedValueId,
    sending,
    setSending,
    startEditValue,
    confirmDeleteValue,
    cancelDeleteValue,
    performDeleteValue,
    updateValue,
  };
}
