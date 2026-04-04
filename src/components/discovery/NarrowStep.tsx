import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { styles } from "../../screens/styles/valuesDiscoveryStyles";
import type { BucketItem } from "../../hooks/useValuesDiscovery";
import { MIN_CORE_VALUES } from "../../hooks/useValuesDiscovery";

interface NarrowStepProps {
  coreItems: BucketItem[];
  narrowedCore: Set<string>;
  onToggle: (promptId: string) => void;
  onBack: () => void;
  onContinue: () => void;
  maxSelectable: number;
}

/**
 * Step 2.5: Narrow down core values when there are >6.
 */
export default function NarrowStep({
  coreItems,
  narrowedCore,
  onToggle,
  onBack,
  onContinue,
  maxSelectable,
}: NarrowStepProps): React.ReactElement {
  const selectedCount = narrowedCore.size;
  const canContinue =
    selectedCount >= MIN_CORE_VALUES && selectedCount <= maxSelectable;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Choose {MIN_CORE_VALUES}–{maxSelectable} to anchor
        </Text>
        <Text style={styles.subtitle}>
          Select the values most central to you right now
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.gridContent}
      >
        <View style={styles.grid}>
          {coreItems.map((item) => {
            const isSelected = narrowedCore.has(item.prompt_id);
            return (
              <TouchableOpacity
                key={item.prompt_id}
                style={[styles.gridItem, isSelected && styles.gridItemSelected]}
                onPress={() => onToggle(item.prompt_id)}
                accessibilityRole="button"
                accessibilityLabel={item.prompt.prompt_text}
                accessibilityState={{ selected: isSelected }}
              >
                <Text
                  style={[
                    styles.gridItemText,
                    isSelected && styles.gridItemTextSelected,
                  ]}
                >
                  {item.prompt.prompt_text}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back to bucketing"
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.footerRight}>
          <Text style={styles.selectionCount}>
            Selected: {selectedCount} of {MIN_CORE_VALUES}-{maxSelectable}
          </Text>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !canContinue && styles.continueButtonDisabled,
            ]}
            onPress={onContinue}
            disabled={!canContinue}
            accessibilityRole="button"
            accessibilityLabel="Continue to review"
            accessibilityState={{ disabled: !canContinue }}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
