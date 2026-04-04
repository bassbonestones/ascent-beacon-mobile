import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ImageSourcePropType,
} from "react-native";
import { styles } from "../../screens/styles/prioritiesScreenStyles";
import type { Value } from "../../types";

interface CreatePriorityStep3Props {
  values: Value[];
  selectedValues: Set<string>;
  onToggleValue: (valueId: string) => void;
  onBack: () => void;
  onNext: () => void;
}

/**
 * Step 3: Link Values
 * User selects which values this priority supports
 */
export default function CreatePriorityStep3({
  values,
  selectedValues,
  onToggleValue,
  onBack,
  onNext,
}: CreatePriorityStep3Props): React.ReactElement {
  const isNextDisabled = selectedValues.size === 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepNumber}>Step 3 of 4</Text>
        <Text style={styles.title}>Link Values</Text>
        <Text style={styles.subtitle}>Which values does this support?</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.formSection}>
          <View style={styles.labelRow}>
            <Image
              source={
                require("../../../assets/NorthStarIcon_values.png") as ImageSourcePropType
              }
              style={styles.labelIcon}
              resizeMode="contain"
              accessibilityLabel="Values icon"
            />
            <Text style={styles.label}>
              Select at least one value (required)
            </Text>
          </View>

          {values.length === 0 ? (
            <Text style={styles.emptyText}>
              Create some values first in the Values module
            </Text>
          ) : (
            <View style={styles.valuesList}>
              {values.map((value) => {
                const activeRev = value.revisions?.[0];
                const isSelected = selectedValues.has(value.id);

                return (
                  <TouchableOpacity
                    key={value.id}
                    style={[
                      styles.valueItem,
                      isSelected && styles.valueItemSelected,
                    ]}
                    onPress={() => onToggleValue(value.id)}
                    accessibilityLabel={`${activeRev?.statement || "Value"}, ${isSelected ? "selected" : "not selected"}`}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected }}
                  >
                    <View style={styles.valueCheckbox}>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <View style={styles.valueContent}>
                      <Text style={styles.valueStatement}>
                        {activeRev?.statement}
                      </Text>
                      {activeRev?.weight_normalized ? (
                        <Text style={styles.valueWeight}>
                          Weight:{" "}
                          {typeof activeRev.weight_normalized === "number"
                            ? activeRev.weight_normalized.toFixed(1)
                            : parseFloat(
                                String(activeRev.weight_normalized),
                              ).toFixed(1)}
                          %
                        </Text>
                      ) : (
                        <Text style={styles.valueWeight}>Weight: --</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.formButtons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onBack}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Text style={styles.cancelButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.nextButton,
            isNextDisabled && styles.nextButtonDisabled,
          ]}
          onPress={onNext}
          disabled={isNextDisabled}
          accessibilityLabel="Next step"
          accessibilityRole="button"
          accessibilityState={{ disabled: isNextDisabled }}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
