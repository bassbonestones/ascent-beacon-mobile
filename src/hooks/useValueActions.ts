import { useState } from "react";
import { Alert } from "react-native";
import api from "../services/api";
import { logError } from "../utils/logger";
import { getActiveRevision } from "../utils/valueMatching";
import type { Value, ValueRevision } from "../types";

/**
 * Return type for useValueActions hook.
 */
export interface UseValueActionsReturn {
  editValueId: string | null;
  setEditValueId: (id: string | null) => void;
  deleteConfirmId: string | null;
  lastMentionedValueId: string | null;
  setLastMentionedValueId: (id: string | null) => void;
  sending: boolean;
  setSending: (sending: boolean) => void;
  startEditValue: (value: Value) => void;
  confirmDeleteValue: (value: Value) => void;
  cancelDeleteValue: () => void;
  performDeleteValue: (value: Value) => Promise<void>;
  updateValue: (value: Value, newStatement: string) => Promise<boolean>;
}

/**
 * Hook for managing value CRUD operations and insights.
 */
export default function useValueActions(
  addAssistantMessage: (content: string, suffix?: string) => void,
  loadValues: () => Promise<void>,
): UseValueActionsReturn {
  const [editValueId, setEditValueId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [lastMentionedValueId, setLastMentionedValueId] = useState<
    string | null
  >(null);
  const [sending, setSending] = useState(false);

  const startEditValue = (value: Value): void => {
    setEditValueId(value.id);
    const activeRev = getActiveRevision(value);
    const existingStatement = activeRev?.statement || "that value";
    addAssistantMessage(
      `Got it. Send the new wording for "${existingStatement}", or say "discuss" to talk it through.`,
      "_edit",
    );
  };

  const confirmDeleteValue = (value: Value): void => {
    setDeleteConfirmId(value.id);
  };

  const cancelDeleteValue = (): void => {
    setDeleteConfirmId(null);
  };

  const performDeleteValue = async (value: Value): Promise<void> => {
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
      logError("Failed to delete value:", error);
      Alert.alert("Error", "Failed to delete value");
    } finally {
      setSending(false);
      setDeleteConfirmId(null);
    }
  };

  const updateValue = async (
    value: Value,
    newStatement: string,
  ): Promise<boolean> => {
    const activeRev = getActiveRevision(value) as ValueRevision | null;
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
      logError("Failed to update value:", error);
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
