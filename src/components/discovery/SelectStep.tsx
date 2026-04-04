import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { styles } from "../../screens/styles/valuesDiscoveryStyles";
import type { DiscoveryPrompt } from "../../types";
import { LENSES } from "../../hooks/useValuesDiscovery";

interface SelectStepProps {
  currentLensIndex: number;
  currentPage: number;
  totalPages: number;
  visiblePrompts: DiscoveryPrompt[];
  selections: Set<string>;
  onToggle: (promptId: string) => void;
  onBack: () => void;
  onContinue: () => void;
  canGoBack: boolean;
  isLastPage: boolean;
}

/**
 * Step 1: Select prompts that resonate organized by lens.
 */
export default function SelectStep({
  currentLensIndex,
  currentPage,
  totalPages,
  visiblePrompts,
  selections,
  onToggle,
  onBack,
  onContinue,
  canGoBack,
  isLastPage,
}: SelectStepProps): React.ReactElement {
  const currentLens = LENSES[currentLensIndex];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text
          style={styles.title}
          accessibilityRole="header"
          accessibilityLabel={currentLens}
        >
          {currentLens}
        </Text>
        <Text style={styles.subtitle}>
          Tap anything that resonates. No limit.
        </Text>
        <View
          style={styles.progressDots}
          accessibilityLabel={`Lens ${currentLensIndex + 1} of ${LENSES.length}`}
        >
          {LENSES.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.progressDot,
                idx === currentLensIndex && styles.progressDotActive,
                idx < currentLensIndex && styles.progressDotComplete,
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.gridContent}
      >
        <View style={styles.grid}>
          {visiblePrompts.map((prompt) => {
            const isSelected = selections.has(prompt.id);
            return (
              <TouchableOpacity
                key={prompt.id}
                style={[styles.gridItem, isSelected && styles.gridItemSelected]}
                onPress={() => onToggle(prompt.id)}
                accessibilityRole="button"
                accessibilityLabel={prompt.prompt_text}
                accessibilityState={{ selected: isSelected }}
              >
                <Text
                  style={[
                    styles.gridItemText,
                    isSelected && styles.gridItemTextSelected,
                  ]}
                >
                  {prompt.prompt_text}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {canGoBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        )}
        <View style={styles.footerRight}>
          <Text style={styles.selectionCount}>Selected: {selections.size}</Text>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={onContinue}
            accessibilityRole="button"
            accessibilityLabel={
              isLastPage ? "Continue to bucketing" : "Next page"
            }
          >
            <Text style={styles.continueButtonText}>
              {isLastPage ? "Continue" : "Next"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
