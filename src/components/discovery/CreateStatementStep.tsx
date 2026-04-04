import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { styles } from "../../screens/styles/valuesDiscoveryStyles";
import type { BucketItem } from "../../hooks/useValuesDiscovery";
import { SENTENCE_STARTERS } from "../../hooks/useValuesDiscovery";

interface CreateStatementStepProps {
  currentCoreItem: BucketItem;
  currentIndex: number;
  totalCount: number;
  statementStarter: string;
  statementText: string;
  onSetStarter: (starter: string) => void;
  onSetText: (text: string) => void;
  onSave: () => Promise<void>;
  onBack: () => void;
  canGoBack: boolean;
  saving: boolean;
}

/**
 * Step 4: Create value statements for each core value.
 */
export default function CreateStatementStep({
  currentCoreItem,
  currentIndex,
  totalCount,
  statementStarter,
  statementText,
  onSetStarter,
  onSetText,
  onSave,
  onBack,
  canGoBack,
  saving,
}: CreateStatementStepProps): React.ReactElement {
  const canSave = statementText.trim().length > 0 && !saving;
  const isLastItem = currentIndex === totalCount - 1;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text
          style={styles.progressText}
          accessibilityLabel={`Creating statement ${currentIndex + 1} of ${totalCount}`}
        >
          {currentIndex + 1} of {totalCount}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.statementContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Prompt text */}
        <Text style={styles.statementPrompt} accessibilityRole="header">
          {currentCoreItem.prompt.prompt_text}
        </Text>

        {/* Lens reminder */}
        <Text style={styles.statementLens}>
          {currentCoreItem.prompt.primary_lens}
        </Text>

        {/* Sentence starters */}
        <Text style={styles.statementLabelStandalone}>
          Choose a way to begin:
        </Text>
        <View style={styles.startersContainer}>
          {SENTENCE_STARTERS.map((starter) => {
            const isSelected = statementStarter === starter;
            return (
              <TouchableOpacity
                key={starter}
                style={[
                  styles.starterButton,
                  isSelected && styles.starterButtonSelected,
                ]}
                onPress={() => onSetStarter(starter)}
                accessibilityRole="button"
                accessibilityLabel={starter}
                accessibilityState={{ selected: isSelected }}
              >
                <Text
                  style={[
                    styles.starterButtonText,
                    isSelected && styles.starterButtonTextSelected,
                  ]}
                >
                  {starter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Text input */}
        <View style={styles.statementLabelContainer}>
          <Text style={styles.statementLabel}>
            Complete your statement about{" "}
          </Text>
          <Text style={styles.statementLabelPrompt}>
            {currentCoreItem.prompt.prompt_text}
          </Text>
        </View>
        <View style={styles.statementInputContainer}>
          <Text style={styles.statementStarter}>{statementStarter}</Text>
          <TextInput
            style={styles.statementInput}
            value={statementText}
            onChangeText={onSetText}
            placeholder="write your value statement..."
            placeholderTextColor="#A0A0A0"
            multiline={true}
            numberOfLines={2}
            maxLength={200}
            autoFocus={true}
            accessibilityLabel="Value statement input"
          />
        </View>

        {/* Preview */}
        {statementText.length > 0 && (
          <View style={styles.statementPreview}>
            <Text style={styles.statementPreviewLabel}>Preview:</Text>
            <Text style={styles.statementPreviewText}>
              {statementStarter} {statementText}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {canGoBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Go back to previous statement"
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.continueButton,
            !canSave && styles.continueButtonDisabled,
          ]}
          onPress={onSave}
          disabled={!canSave}
          accessibilityRole="button"
          accessibilityLabel={
            isLastItem ? "Finish" : "Save and continue to next"
          }
          accessibilityState={{ disabled: !canSave }}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.continueButtonText}>
              {isLastItem ? "Finish" : "Next"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
