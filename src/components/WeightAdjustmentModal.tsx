import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import Slider from "@react-native-community/slider";
import useWeightAdjustment, {
  type WeightItem,
} from "../hooks/useWeightAdjustment";
import { styles } from "./styles/weightAdjustmentStyles";
import type { Value } from "../types";

interface WeightAdjustmentModalProps {
  values: Value[];
  onSave: (weights: WeightItem[]) => Promise<void>;
  onCancel: () => void;
}

export default function WeightAdjustmentModal({
  values,
  onSave,
  onCancel,
}: WeightAdjustmentModalProps): React.JSX.Element {
  const wa = useWeightAdjustment(values, onSave);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Adjust Weights</Text>
        <TouchableOpacity
          onPress={onCancel}
          style={styles.cancelButton}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
        >
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
              Math.abs(wa.totalWeight - 100) > 0.1 && styles.totalValueError,
            ]}
          >
            {wa.totalWeight.toFixed(1)}%
          </Text>
        </View>

        {wa.weights.map((item, index) => (
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
                onValueChange={(value: number) =>
                  wa.handleWeightChange(index, value)
                }
                minimumTrackTintColor="#4CAF50"
                maximumTrackTintColor="#E0E0E0"
                thumbTintColor="#4CAF50"
                step={0.1}
                accessibilityLabel={`Adjust weight for ${item.statement}`}
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

        {wa.hasZeroWeight && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              ⚠️ Actions must have at least 0.1% weight. Adjust the weights so
              each value has a meaningful emphasis.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.resetButton}
          onPress={wa.handleResetToEqual}
          accessibilityRole="button"
          accessibilityLabel="Reset to equal weights"
        >
          <Text style={styles.resetButtonText}>Reset to Equal</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (wa.saving || wa.hasZeroWeight) && styles.saveButtonDisabled,
          ]}
          onPress={wa.handleSave}
          disabled={wa.saving || wa.hasZeroWeight}
          accessibilityRole="button"
          accessibilityLabel="Save weights"
        >
          {wa.saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Weights</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
