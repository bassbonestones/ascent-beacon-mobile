import { useState, useEffect } from "react";
import { Alert } from "react-native";

/**
 * Hook for managing weight adjustment state and operations.
 */
export default function useWeightAdjustment(values, onSave) {
  const [weights, setWeights] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const initialWeights = values.map((value) => {
      const activeRev = value.revisions?.find(
        (r) => r.id === value.active_revision_id,
      );
      return {
        valueId: value.id,
        statement: activeRev?.statement || "",
        weight: parseFloat(activeRev?.weight_normalized || 0),
      };
    });
    setWeights(initialWeights);
  }, [values]);

  const handleWeightChange = (index, newWeight) => {
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

  const handleResetToEqual = () => {
    const equalWeight = 100 / weights.length;
    setWeights(weights.map((w) => ({ ...w, weight: equalWeight })));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(weights);
    } catch (error) {
      Alert.alert("Error", "Failed to save weights");
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
