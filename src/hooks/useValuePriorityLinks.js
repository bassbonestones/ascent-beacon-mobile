import { useState, useEffect } from "react";
import { Alert } from "react-native";
import api from "../services/api";

/**
 * Hook for managing value-priority link editing.
 */
export default function useValuePriorityLinks(valueId, navigation) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [priorities, setPriorities] = useState([]);
  const [linkedPriorityIds, setLinkedPriorityIds] = useState(new Set());
  const [changedPriorityIds, setChangedPriorityIds] = useState(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prioritiesData, linkedData] = await Promise.all([
        api.getPriorities(),
        api.getLinkedPriorities(valueId),
      ]);
      setPriorities(prioritiesData.priorities || []);
      const linked = new Set((linkedData || []).map((p) => p.priority_id));
      setLinkedPriorityIds(linked);
    } catch (error) {
      console.error("Failed to load data:", error);
      Alert.alert("Error", "Failed to load priorities");
    } finally {
      setLoading(false);
    }
  };

  const togglePriorityLink = (priorityId) => {
    const newLinked = new Set(linkedPriorityIds);
    const newChanged = new Set(changedPriorityIds);
    if (newLinked.has(priorityId)) newLinked.delete(priorityId);
    else newLinked.add(priorityId);
    newChanged.add(priorityId);
    setLinkedPriorityIds(newLinked);
    setChangedPriorityIds(newChanged);
  };

  const handleSave = async () => {
    if (changedPriorityIds.size === 0) {
      navigation.goBack();
      return;
    }
    try {
      setSaving(true);
      for (const priorityId of changedPriorityIds) {
        const priority = priorities.find((p) => p.id === priorityId);
        if (!priority?.active_revision) continue;
        const activeRev = priority.active_revision;
        const currentValueIds = new Set(
          (activeRev.value_links || []).map((link) => link.value_id),
        );

        if (linkedPriorityIds.has(priorityId)) currentValueIds.add(valueId);
        else currentValueIds.delete(valueId);

        if (currentValueIds.size === 0 && activeRev.is_anchored) {
          Alert.alert(
            "Cannot Remove Link",
            `"${activeRev.title}" is anchored and requires at least one linked value.`,
            [{ text: "OK" }],
          );
          continue;
        }

        await api.createPriorityRevision(priorityId, {
          title: activeRev.title,
          why_matters: activeRev.why_matters,
          score: activeRev.score,
          scope: activeRev.scope,
          cadence: activeRev.cadence || null,
          constraints: activeRev.constraints || null,
          value_ids: Array.from(currentValueIds),
        });
      }
      Alert.alert("Success", "Priority links updated");
      navigation.goBack();
    } catch (error) {
      console.error("Failed to save links:", error);
      if (error.message?.includes("ORPHANED_ANCHORED_PRIORITY")) {
        Alert.alert(
          "Cannot Save",
          "One or more anchored priorities would be left without values.",
          [{ text: "OK" }],
        );
      } else Alert.alert("Error", "Failed to update links");
    } finally {
      setSaving(false);
    }
  };

  return {
    loading,
    saving,
    priorities,
    linkedPriorityIds,
    changedPriorityIds,
    togglePriorityLink,
    handleSave,
  };
}
