import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { styles } from "../../screens/styles/valuesDiscoveryStyles";
import type { Value } from "../../types";

interface ViewValuesStepProps {
  values: Value[];
  onGoToDashboard: () => void;
}

/**
 * Step 5: View existing values (when user already has values).
 */
export default function ViewValuesStep({
  values,
  onGoToDashboard,
}: ViewValuesStepProps): React.ReactElement {
  const getStatement = (value: Value): string => {
    return value.active_revision?.statement || "";
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Your Core Values
        </Text>
        <Text style={styles.subtitle}>
          {values.length} {values.length === 1 ? "value" : "values"} guiding
          your priorities
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.reviewContent}
      >
        {values.map((value, idx) => (
          <View
            key={value.id}
            style={styles.reviewItem}
            accessibilityLabel={`Value ${idx + 1}: ${getStatement(value)}`}
          >
            <Text style={styles.reviewNumber}>{idx + 1}</Text>
            <Text style={styles.reviewText}>{getStatement(value)}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={onGoToDashboard}
          accessibilityRole="button"
          accessibilityLabel="Back to dashboard"
        >
          <Text style={styles.continueButtonText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
