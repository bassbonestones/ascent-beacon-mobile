import { useState, useEffect } from "react";
import { showAlert } from "../utils/alert";
import type { Value, ValueRevision } from "../types";

/**
 * Weight item for adjustment.
 */
export interface WeightItem {
  valueId: string;
  statement: string;
  weight: number;
}

/**
 * Return type for useWeightAdjustment hook.
 */
export interface UseWeightAdjustmentReturn {
  weights: WeightItem[];
  saving: boolean;
  totalWeight: number;
  hasZeroWeight: boolean;
  handleWeightChange: (index: number, newWeight: number) => void;
  handleResetToEqual: () => void;
  handleSave: () => Promise<void>;
}

/**
 * Hook for managing weight adjustment state and operations.
 */
export default function useWeightAdjustment(
  values: Value[],
  onSave: (weights: WeightItem[]) => Promise<void>,
): UseWeightAdjustmentReturn {
  const [weights, setWeights] = useState<WeightItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const initialWeights = values.map((value) => {
      const activeRev = value.revisions?.find(
        (r: ValueRevision) => r.id === value.active_revision_id,
      );
      return {
        valueId: value.id,
        statement: activeRev?.statement || "",
        weight: parseFloat(String(activeRev?.weight_normalized || 0)),
      };
    });
    setWeights(initialWeights);
  }, [values]);

  const handleWeightChange = (index: number, newWeight: number): void => {
    const updatedWeights = [...weights];
    updatedWeights[index].weight = newWeight;
    const remaining = 100 - newWeight;
    const otherIndices = updatedWeights
      .map((_, i) => i)
      .filter((i) => i !== index);
    const otherSum = otherIndices.reduce(
      (sum, i) => sum + weights[i].weight,
      0,
    );

    if (otherSum > 0) {
      otherIndices.forEach((i) => {
        const proportion = weights[i].weight / otherSum;
        updatedWeights[i].weight = remaining * proportion;
      });
    } else {
      const equalWeight = remaining / otherIndices.length;
      otherIndices.forEach((i) => {
        updatedWeights[i].weight = equalWeight;
      });
    }
    setWeights(updatedWeights);
  };

  const handleResetToEqual = (): void => {
    const equalWeight = 100 / weights.length;
    setWeights(weights.map((w) => ({ ...w, weight: equalWeight })));
  };

  const handleSave = async (): Promise<void> => {
    try {
      setSaving(true);
      await onSave(weights);
    } catch (error) {
      showAlert("Error", "Failed to save weights");
    } finally {
      setSaving(false);
    }
  };

  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  const hasZeroWeight = weights.some((w) => w.weight < 0.1);

  return {
    weights,
    saving,
    totalWeight,
    hasZeroWeight,
    handleWeightChange,
    handleResetToEqual,
    handleSave,
  };
}
