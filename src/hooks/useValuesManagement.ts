import { useState, useEffect, useRef, useCallback, RefObject } from "react";
import { ScrollView, Platform } from "react-native";
import api from "../services/api";
import { logError } from "../utils/logger";
import { checkOrphanedPriorities } from "../utils/priorityOrphanCheck";
import { showAlert, showAlertWithButtons } from "../utils/alert";
import type {
  Value,
  ValueRevision,
  ValueInsight,
  AffectedPriorityInfo,
  ValueEditImpactInfo,
} from "../types";
import type { WeightItem } from "./useWeightAdjustment";

/**
 * Get the active revision from a value object.
 */
export const getActiveRevision = (value: Value): ValueRevision | null => {
  if (!value.active_revision_id || !value.revisions) return null;
  return value.revisions.find((r) => r.id === value.active_revision_id) || null;
};

type NavigationType = {
  navigate: (screen: string, params?: Record<string, unknown>) => void;
};

/**
 * Return type for useValuesManagement hook.
 */
export interface UseValuesManagementReturn {
  values: Value[];
  loading: boolean;
  creating: boolean;
  showExamples: boolean;
  newStatement: string;
  showWeightsModal: boolean;
  editingValueId: string | null;
  editingStatement: string;
  saving: boolean;
  valueInsights: Record<string, ValueInsight>;
  highlightValueId: string | null;
  showAffectedPrioritiesModal: boolean;
  affectedPriorities: AffectedPriorityInfo[];
  scrollViewRef: RefObject<ScrollView | null>;
  valuePositions: RefObject<Record<string, number>>;
  setShowExamples: (show: boolean) => void;
  setNewStatement: (statement: string) => void;
  setShowWeightsModal: (show: boolean) => void;
  setEditingStatement: (statement: string) => void;
  handleCreateValue: () => Promise<void>;
  handleDeleteValue: (valueId: string) => Promise<void>;
  handleStartEdit: (value: Value) => void;
  handleSaveEdit: () => Promise<void>;
  handleCancelEdit: () => void;
  handleAffectedPrioritiesContinue: () => Promise<void>;
  handleAffectedPrioritiesReviewLinks: () => Promise<void>;
  handleSelectExample: (example: string) => void;
  handleSaveWeights: (weights: WeightItem[]) => Promise<void>;
  handleKeepBoth: (valueId: string) => Promise<void>;
  handleReviewInsight: (valueId: string) => void;
  loadValues: () => Promise<void>;
  getActiveRevision: typeof getActiveRevision;
  setShowAffectedPrioritiesModal: (show: boolean) => void;
  setAffectedPriorities: (priorities: AffectedPriorityInfo[]) => void;
  setPendingImpactInfo: () => void;
  setLastEditedValueId: () => void;
}

/**
 * Hook for managing values list state and operations.
 */
export default function useValuesManagement(
  navigation?: NavigationType,
): UseValuesManagementReturn {
  const [values, setValues] = useState<Value[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [newStatement, setNewStatement] = useState("");
  const [showWeightsModal, setShowWeightsModal] = useState(false);
  const [editingValueId, setEditingValueId] = useState<string | null>(null);
  const [editingStatement, setEditingStatement] = useState("");
  const [saving, setSaving] = useState(false);
  const [valueInsights, setValueInsights] = useState<
    Record<string, ValueInsight>
  >({});
  const [highlightValueId, setHighlightValueId] = useState<string | null>(null);
  const [showAffectedPrioritiesModal, setShowAffectedPrioritiesModal] =
    useState(false);
  const [affectedPriorities, setAffectedPriorities] = useState<
    AffectedPriorityInfo[]
  >([]);
  const [pendingImpactInfo, setPendingImpactInfo] =
    useState<ValueEditImpactInfo | null>(null);
  const [lastEditedValueId, setLastEditedValueId] = useState<string | null>(
    null,
  );

  const scrollViewRef = useRef<ScrollView | null>(null);
  const valuePositions = useRef<Record<string, number>>({});

  const loadValues = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
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
      showAlert("Error", "Failed to load values");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadValues();
  }, [loadValues]);

  const handleCreateValue = async (): Promise<void> => {
    if (!newStatement.trim()) {
      showAlert("Required", "Please enter a value statement");
      return;
    }
    if (values.length >= 6) {
      showAlert("Limit Reached", "You can have a maximum of 6 values");
      return;
    }
    try {
      setCreating(true);
      const created = await api.createValue({
        statement: newStatement.trim(),
        weight_raw: 1,
        origin: "declared",
      });
      if (created?.insights?.length) {
        setValueInsights((prev) => ({
          ...prev,
          [created.id]: created.insights[0],
        }));
      }
      setNewStatement("");
      await loadValues();

      // Show nudge to link priorities
      showAlertWithButtons(
        "Value Created!",
        "Would you like to link this value to your priorities now?",
        [
          { text: "Later", style: "cancel" },
          {
            text: "Go to Priorities",
            onPress: () => navigation?.navigate("Priorities"),
          },
        ],
      );
    } catch (error) {
      logError("Failed to create value:", error);
      showAlert("Error", "Failed to create value");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteValue = async (valueId: string): Promise<void> => {
    if (values.length <= 3) {
      showAlert("Minimum Required", "You must have at least 3 values");
      return;
    }

    // Check for linked priorities first
    let linkedPriorities: AffectedPriorityInfo[] = [];
    try {
      linkedPriorities = await api.getLinkedPriorities(valueId);
    } catch {
      // Continue with delete even if check fails
    }

    const hasLinkedPriorities = linkedPriorities.length > 0;
    const priorityNames = linkedPriorities
      .map((p) => `• ${p.title}`)
      .join("\n");

    const title = hasLinkedPriorities
      ? "Value Has Linked Priorities"
      : "Delete Value";

    const message = hasLinkedPriorities
      ? `This value is linked to ${linkedPriorities.length} priority(ies):\n\n${priorityNames}\n\nDeleting will unlink these priorities. Continue?`
      : "Are you sure? This will remove this value and rebalance your weights.";

    const doDelete = async () => {
      try {
        await api.deleteValue(valueId, hasLinkedPriorities);
        await loadValues();
      } catch (error) {
        logError("Failed to delete value:", error);
        showAlert("Error", "Failed to delete value");
      }
    };

    if (Platform.OS === "web") {
      // Use window.confirm on web since showAlertWithButtons may have limitations
      if (window.confirm(`${title}\n\n${message}`)) {
        await doDelete();
      }
    } else {
      showAlertWithButtons(title, message, [
        { text: "Cancel", style: "cancel" },
        {
          text: hasLinkedPriorities ? "Delete & Unlink" : "Delete",
          style: "destructive",
          onPress: doDelete,
        },
      ]);
    }
  };

  const handleStartEdit = (value: Value): void => {
    const activeRev = getActiveRevision(value);
    if (activeRev) {
      setEditingValueId(value.id);
      setEditingStatement(activeRev.statement);
    }
  };

  const handleSaveEdit = async (): Promise<void> => {
    if (!editingStatement.trim()) {
      showAlert("Required", "Please enter a value statement");
      return;
    }
    try {
      setSaving(true);
      const value = values.find((v) => v.id === editingValueId);
      if (!value) return;
      const activeRev = getActiveRevision(value);
      if (!activeRev) return;

      const updated = await api.updateValue(value.id, {
        statement: editingStatement.trim(),
        weight_raw: activeRev.weight_raw,
        origin: activeRev.origin,
      });

      if (updated?.insights?.length) {
        setValueInsights((prev) => ({
          ...prev,
          [updated.id]: updated.insights[0],
        }));
      }

      if (
        updated?.impact_info?.affected_priorities_count &&
        updated.impact_info.affected_priorities_count > 0
      ) {
        setLastEditedValueId(value.id);
        setEditingValueId(null);
        setEditingStatement("");
        setAffectedPriorities(updated.impact_info.affected_priorities);
        setPendingImpactInfo(updated.impact_info);
        setShowAffectedPrioritiesModal(true);
        return;
      }

      await checkOrphanedPriorities(loadValues);

      if (updated?.impact_info?.weight_verification_recommended) {
        setEditingValueId(null);
        setEditingStatement("");
        showAlertWithButtons(
          "Value Updated",
          "Your value has been updated. Would you like to verify your weights on the slider?",
          [
            {
              text: "Not now",
              onPress: async () => {
                await loadValues();
                showAlert("Success", "Value updated");
              },
            },
            {
              text: "Review Weights",
              onPress: async () => {
                await loadValues();
                setShowWeightsModal(true);
              },
            },
          ],
        );
        return;
      }

      setEditingValueId(null);
      setEditingStatement("");
      await loadValues();
      showAlert("Success", "Value updated");
    } catch (error) {
      logError("Failed to update value:", error);
      showAlert("Error", "Failed to update value");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = (): void => {
    setEditingValueId(null);
    setEditingStatement("");
  };

  const handleAffectedPrioritiesContinue = async (): Promise<void> => {
    setShowAffectedPrioritiesModal(false);
    setAffectedPriorities([]);
    setLastEditedValueId(null);
    if (pendingImpactInfo?.weight_verification_recommended) {
      showAlertWithButtons(
        "Weight Review",
        "Would you like to verify your weights on the slider?",
        [
          {
            text: "Not now",
            onPress: async () => {
              await loadValues();
              showAlert("Success", "Value updated");
            },
          },
          {
            text: "Review Weights",
            onPress: async () => {
              await loadValues();
              setShowWeightsModal(true);
            },
          },
        ],
      );
    } else {
      await loadValues();
      showAlert("Success", "Value updated");
    }
    setPendingImpactInfo(null);
  };

  const handleAffectedPrioritiesReviewLinks = async (): Promise<void> => {
    setShowAffectedPrioritiesModal(false);
    setAffectedPriorities([]);
    setPendingImpactInfo(null);
    await loadValues();
    showAlert("Success", "Value updated");
    if (navigation && lastEditedValueId) {
      const value = values.find((v) => v.id === lastEditedValueId);
      const activeRev = value ? getActiveRevision(value) : null;
      navigation.navigate("ValuePriorityLinks", {
        valueId: lastEditedValueId,
        valueStatement: activeRev?.statement || "(edited value)",
      });
      setLastEditedValueId(null);
    } else {
      showAlert(
        "Info",
        "Please navigate to the Priorities screen to review the connections.",
      );
    }
  };

  const handleSelectExample = (example: string): void => {
    setNewStatement(example);
    setShowExamples(false);
  };

  const handleSaveWeights = async (weights: WeightItem[]): Promise<void> => {
    try {
      for (const item of weights) {
        const value = values.find((v) => v.id === item.valueId);
        if (!value) continue;
        const activeRev = getActiveRevision(value);
        if (!activeRev) continue;
        await api.updateValue(value.id, {
          statement: activeRev.statement,
          weight_raw: item.weight,
          origin: activeRev.origin,
        });
      }
      await loadValues();
      setShowWeightsModal(false);
      showAlert("Success", "Weights updated successfully");
    } catch (error) {
      logError("Failed to update weights:", error);
      throw error;
    }
  };

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
      scrollViewRef.current?.scrollTo({
        y: Math.max(targetY - 12, 0),
        animated: true,
      });
    }
    setHighlightValueId(insight.similar_value_id);
    setTimeout(() => setHighlightValueId(null), 1200);
  };

  return {
    values,
    loading,
    creating,
    showExamples,
    newStatement,
    showWeightsModal,
    editingValueId,
    editingStatement,
    saving,
    valueInsights,
    highlightValueId,
    showAffectedPrioritiesModal,
    affectedPriorities,
    scrollViewRef,
    valuePositions,
    setShowExamples,
    setNewStatement,
    setShowWeightsModal,
    setEditingStatement,
    handleCreateValue,
    handleDeleteValue,
    handleStartEdit,
    handleSaveEdit,
    handleCancelEdit,
    handleAffectedPrioritiesContinue,
    handleAffectedPrioritiesReviewLinks,
    handleSelectExample,
    handleSaveWeights,
    handleKeepBoth,
    handleReviewInsight,
    loadValues,
    getActiveRevision,
    setShowAffectedPrioritiesModal,
    setAffectedPriorities,
    setPendingImpactInfo: () => setPendingImpactInfo(null),
    setLastEditedValueId: () => setLastEditedValueId(null),
  };
}
