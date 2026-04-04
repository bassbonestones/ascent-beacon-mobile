import { useState, useEffect } from "react";
import api from "../services/api";
import { logError } from "../utils/logger";
import { showAlert, showAlertWithButtons } from "../utils/alert";
import type { Priority, PriorityRevision } from "../types";

type NavigationType = {
  goBack: () => void;
};

/**
 * Return type for useValuePriorityLinks hook.
 */
export interface UseValuePriorityLinksReturn {
  loading: boolean;
  saving: boolean;
  priorities: Priority[];
  linkedPriorityIds: Set<string>;
  changedPriorityIds: Set<string>;
  togglePriorityLink: (priorityId: string) => void;
  handleSave: () => Promise<void>;
}

/**
 * Hook for managing value-priority link editing.
 */
export default function useValuePriorityLinks(
  valueId: string,
  navigation: NavigationType,
): UseValuePriorityLinksReturn {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [linkedPriorityIds, setLinkedPriorityIds] = useState<Set<string>>(
    new Set(),
  );
  const [changedPriorityIds, setChangedPriorityIds] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async (): Promise<void> => {
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
      logError("Failed to load data:", error);
      showAlert("Error", "Failed to load priorities");
    } finally {
      setLoading(false);
    }
  };

  const togglePriorityLink = (priorityId: string): void => {
    const newLinked = new Set(linkedPriorityIds);
    const newChanged = new Set(changedPriorityIds);
    if (newLinked.has(priorityId)) newLinked.delete(priorityId);
    else newLinked.add(priorityId);
    newChanged.add(priorityId);
    setLinkedPriorityIds(newLinked);
    setChangedPriorityIds(newChanged);
  };

  const handleSave = async (): Promise<void> => {
    if (changedPriorityIds.size === 0) {
      navigation.goBack();
      return;
    }
    try {
      setSaving(true);
      for (const priorityId of changedPriorityIds) {
        const priority = priorities.find((p) => p.id === priorityId);
        if (!priority?.active_revision) continue;
        const activeRev = priority.active_revision as PriorityRevision;
        const currentValueIds = new Set(
          (activeRev.value_links || []).map((link) => link.value_id),
        );

        if (linkedPriorityIds.has(priorityId)) currentValueIds.add(valueId);
        else currentValueIds.delete(valueId);

        if (currentValueIds.size === 0 && activeRev.is_anchored) {
          showAlertWithButtons(
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
          cadence: activeRev.cadence || undefined,
          constraints: activeRev.constraints || undefined,
          value_ids: Array.from(currentValueIds),
        });
      }
      showAlert("Success", "Priority links updated");
      navigation.goBack();
    } catch (error) {
      logError("Failed to save links:", error);
      const errorObj = error as Error;
      if (errorObj.message?.includes("ORPHANED_ANCHORED_PRIORITY")) {
        showAlertWithButtons(
          "Cannot Save",
          "One or more anchored priorities would be left without values.",
          [{ text: "OK" }],
        );
      } else showAlert("Error", "Failed to update links");
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
