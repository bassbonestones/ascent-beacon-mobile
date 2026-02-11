import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import Slider from "@react-native-community/slider";

export default function WeightAdjustmentModal({ values, onSave, onCancel }) {
  const [weights, setWeights] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Initialize weights from active revisions
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

    // Calculate remaining weight to distribute
    const remaining = 100 - newWeight;

    // Get sum of other current weights for proportional distribution
    const otherIndices = updatedWeights
      .map((_, i) => i)
      .filter((i) => i !== index);
    const otherSum = otherIndices.reduce(
      (sum, i) => sum + weights[i].weight,
      0,
    );

    // Redistribute proportionally
    if (otherSum > 0) {
      otherIndices.forEach((i) => {
        const proportion = weights[i].weight / otherSum;
        updatedWeights[i].weight = remaining * proportion;
      });
    } else {
      // Equal distribution if others are zero
      const equalWeight = remaining / otherIndices.length;
      otherIndices.forEach((i) => {
        updatedWeights[i].weight = equalWeight;
      });
    }

    setWeights(updatedWeights);
  };

  const handleResetToEqual = () => {
    const equalWeight = 100 / weights.length;
    setWeights(
      weights.map((w) => ({
        ...w,
        weight: equalWeight,
      })),
    );
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Adjust Weights</Text>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Weights represent your current emphasis given limited time and
            energy. They must always sum to 100%.
          </Text>
        </View>

        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text
            style={[
              styles.totalValue,
              Math.abs(totalWeight - 100) > 0.1 && styles.totalValueError,
            ]}
          >
            {totalWeight.toFixed(1)}%
          </Text>
        </View>

        {weights.map((item, index) => (
          <View key={item.valueId} style={styles.weightItem}>
            <Text style={styles.statementText} numberOfLines={2}>
              {item.statement}
            </Text>

            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                value={item.weight}
                onValueChange={(value) => handleWeightChange(index, value)}
                minimumTrackTintColor="#4CAF50"
                maximumTrackTintColor="#E0E0E0"
                thumbTintColor="#4CAF50"
                step={0.1}
              />
              <Text
                style={[
                  styles.weightValue,
                  item.weight < 0.1 && styles.weightValueZero,
                ]}
              >
                {item.weight.toFixed(1)}%
              </Text>
            </View>
          </View>
        ))}

        {hasZeroWeight && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              ⚠️ Actions must have at least 0.1% weight. Adjust the weights so
              each value has a meaningful emphasis.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleResetToEqual}
        >
          <Text style={styles.resetButtonText}>Reset to Equal</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (saving || hasZeroWeight) && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={saving || hasZeroWeight}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Weights</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  infoBox: {
    backgroundColor: "#E8F5E9",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#1B5E20",
  },
  totalBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  totalValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  totalValueError: {
    color: "#F44336",
  },
  weightItem: {
    marginBottom: 24,
  },
  statementText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#000",
    marginBottom: 12,
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  weightValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4CAF50",
    width: 70,
    textAlign: "right",
    minHeight: 20,
  },
  weightValueZero: {
    color: "#D32F2F",
  },
  warningBox: {
    backgroundColor: "#FFEBEE",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#D32F2F",
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#B71C1C",
    fontWeight: "500",
  },
  resetButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#007AFF",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  resetButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#C8E6C9",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
