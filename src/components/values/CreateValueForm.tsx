import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { styles } from "../../screens/styles/valuesManagementStyles";

interface CreateValueFormProps {
  valuesCount: number;
  newStatement: string;
  onChangeText: (text: string) => void;
  onCreate: () => void;
  onShowExamples: () => void;
  onNavigateToDashboard: () => void;
  isCreating: boolean;
}

/**
 * Form for creating a new value with input, examples link, and submit button.
 */
export default function CreateValueForm({
  valuesCount,
  newStatement,
  onChangeText,
  onCreate,
  onShowExamples,
  onNavigateToDashboard,
  isCreating,
}: CreateValueFormProps): React.ReactElement {
  const isFirstValue = valuesCount === 0;
  const hasMinimumValues = valuesCount >= 3;
  const canAddMore = valuesCount < 6;
  const remainingSlots = 6 - valuesCount;

  return (
    <View style={styles.createSection}>
      <Text style={styles.sectionTitle}>
        {isFirstValue ? "Create Your First Value" : "Add Another Value"}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="I choose to..."
        placeholderTextColor="#999"
        value={newStatement}
        onChangeText={onChangeText}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        accessibilityLabel="Value statement input"
        accessibilityHint="Enter a statement describing what you value"
      />

      <TouchableOpacity
        onPress={onShowExamples}
        style={styles.examplesLink}
        accessibilityRole="button"
        accessibilityLabel="See example values"
      >
        <Text style={styles.examplesLinkText}>See examples</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.createButton,
          (!newStatement.trim() || isCreating) && styles.createButtonDisabled,
        ]}
        onPress={onCreate}
        disabled={!newStatement.trim() || isCreating}
        accessibilityRole="button"
        accessibilityLabel={isFirstValue ? "Create value" : "Add value"}
      >
        {isCreating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.createButtonText}>
            {isFirstValue ? "Create Value" : "Add Value"}
          </Text>
        )}
      </TouchableOpacity>

      {hasMinimumValues && canAddMore && (
        <Text style={styles.hint}>
          You have {valuesCount} values. You can add up to {remainingSlots}{" "}
          more.
        </Text>
      )}

      <TouchableOpacity
        style={styles.backButtonStyled}
        onPress={onNavigateToDashboard}
        accessibilityRole="button"
        accessibilityLabel="Back to dashboard"
      >
        <Text style={styles.backButtonStyledText}>Back to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}
