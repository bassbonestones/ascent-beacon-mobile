import { useState, useEffect, useRef, useCallback } from "react";
import { Alert } from "react-native";
import api from "../services/api";

/**
 * Get the active revision from a value object.
 */
export const getActiveRevision = (value) => {
  if (!value.active_revision_id || !value.revisions) return null;
  return value.revisions.find((r) => r.id === value.active_revision_id);
};

/**
 * Hook for managing values list state and operations.
 */
export default function useValuesManagement(navigation) {
  const [values, setValues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [newStatement, setNewStatement] = useState("");
  const [showWeightsModal, setShowWeightsModal] = useState(false);
  const [editingValueId, setEditingValueId] = useState(null);
  const [editingStatement, setEditingStatement] = useState("");
  const [saving, setSaving] = useState(false);
  const [valueInsights, setValueInsights] = useState({});
  const [highlightValueId, setHighlightValueId] = useState(null);
  const [showAffectedPrioritiesModal, setShowAffectedPrioritiesModal] =
    useState(false);
  const [affectedPriorities, setAffectedPriorities] = useState([]);
  const [pendingImpactInfo, setPendingImpactInfo] = useState(null);
  const [lastEditedValueId, setLastEditedValueId] = useState(null);

  const scrollViewRef = useRef(null);
  const valuePositions = useRef({});

  const loadValues = useCallback(async () => {
    try {
      setLoading(true);
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
      Alert.alert("Error", "Failed to load values");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadValues();
  }, [loadValues]);

  const handleCreateValue = async () => {
    if (!newStatement.trim()) {
      Alert.alert("Required", "Please enter a value statement");
      return;
    }
    if (values.length >= 6) {
      Alert.alert("Limit Reached", "You can have a maximum of 6 values");
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
    } catch (error) {
      console.error("Failed to create value:", error);
      Alert.alert("Error", "Failed to create value");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteValue = async (valueId) => {
    if (values.length <= 3) {
      Alert.alert("Minimum Required", "You must have at least 3 values");
      return;
    }
    Alert.alert(
      "Delete Value",
      "Are you sure? This will remove this value and rebalance your weights.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.deleteValue(valueId);
              await loadValues();
            } catch (error) {
              console.error("Failed to delete value:", error);
              Alert.alert("Error", "Failed to delete value");
            }
          },
        },
      ],
    );
  };

  const handleStartEdit = (value) => {
    const activeRev = getActiveRevision(value);
    if (activeRev) {
      setEditingValueId(value.id);
      setEditingStatement(activeRev.statement);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingStatement.trim()) {
      Alert.alert("Required", "Please enter a value statement");
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

      if (updated?.impact_info?.affected_priorities_count > 0) {
        setLastEditedValueId(value.id);
        setEditingValueId(null);
        setEditingStatement("");
        setAffectedPriorities(updated.impact_info.affected_priorities);
        setPendingImpactInfo(updated.impact_info);
        setShowAffectedPrioritiesModal(true);
        return;
      }

      await checkOrphanedPriorities();

      if (updated?.impact_info?.weight_verification_recommended) {
        setEditingValueId(null);
        setEditingStatement("");
        Alert.alert(
          "Value Updated",
          "Your value has been updated. Would you like to verify your weights on the slider?",
          [
            {
              text: "Not now",
              onPress: async () => {
                await loadValues();
                Alert.alert("Success", "Value updated");
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
      Alert.alert("Success", "Value updated");
    } catch (error) {
      console.error("Failed to update value:", error);
      Alert.alert("Error", "Failed to update value");
    } finally {
      setSaving(false);
    }
  };

  const checkOrphanedPriorities = async () => {
    await new Promise((res) => setTimeout(res, 300));
    const allPriorities = await api.getPriorities();
    const orphaned = [];
    for (const priority of allPriorities.priorities || []) {
      if (priority.active_revision) {
        for (let attempt = 0; attempt < 5; attempt++) {
          try {
            const status = await api.checkPriorityStatus(priority.id);
            if (status?.linked_values?.length === 0) {
              orphaned.push(priority);
              break;
            }
          } catch (e) {
            /* ignore */
          }
          await new Promise((res) => setTimeout(res, 200));
        }
      }
    }
    if (orphaned.length > 0) {
      for (const orphan of orphaned) {
        await new Promise((resolve) => {
          Alert.alert(
            `No Values Linked: ${orphan.active_revision.title}`,
            `The priority "${orphan.active_revision.title}" has no linked values. Would you like to stash or delete it?`,
            [
              {
                text: "Stash",
                onPress: async () => {
                  try {
                    await api.stashPriority(orphan.id, true);
                  } catch (e) {
                    Alert.alert("Error", "Failed to stash priority");
                  }
                  resolve();
                },
              },
              {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                  try {
                    await api.deletePriority(orphan.id);
                  } catch (e) {
                    Alert.alert("Error", "Failed to delete priority");
                  }
                  resolve();
                },
              },
              { text: "Cancel", style: "cancel", onPress: () => resolve() },
            ],
          );
        });
      }
      await loadValues();
      Alert.alert("Updated", "Orphaned priorities handled.");
      setEditingValueId(null);
      setEditingStatement("");
    }
  };

  const handleCancelEdit = () => {
    setEditingValueId(null);
    setEditingStatement("");
  };

  const handleAffectedPrioritiesContinue = async () => {
    setShowAffectedPrioritiesModal(false);
    setAffectedPriorities([]);
    setLastEditedValueId(null);
    if (pendingImpactInfo?.weight_verification_recommended) {
      Alert.alert(
        "Weight Review",
        "Would you like to verify your weights on the slider?",
        [
          {
            text: "Not now",
            onPress: async () => {
              await loadValues();
              Alert.alert("Success", "Value updated");
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
      Alert.alert("Success", "Value updated");
    }
    setPendingImpactInfo(null);
  };

  const handleAffectedPrioritiesReviewLinks = async () => {
    setShowAffectedPrioritiesModal(false);
    setAffectedPriorities([]);
    setPendingImpactInfo(null);
    await loadValues();
    Alert.alert("Success", "Value updated");
    if (navigation && lastEditedValueId) {
      const value = values.find((v) => v.id === lastEditedValueId);
      const activeRev = value ? getActiveRevision(value) : null;
      navigation.navigate("ValuePriorityLinks", {
        valueId: lastEditedValueId,
        valueStatement: activeRev?.statement || "(edited value)",
      });
      setLastEditedValueId(null);
    } else {
      Alert.alert(
        "Info",
        "Please navigate to the Priorities screen to review the connections.",
      );
    }
  };

  const handleSelectExample = (example) => {
    setNewStatement(example);
    setShowExamples(false);
  };

  const handleSaveWeights = async (weights) => {
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
      Alert.alert("Success", "Weights updated successfully");
    } catch (error) {
      console.error("Failed to update weights:", error);
      throw error;
    }
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
