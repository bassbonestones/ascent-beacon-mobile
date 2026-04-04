import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { styles } from "../../screens/styles/valuesDiscoveryStyles";

interface DoneStepProps {
  onGoToDashboard: () => void;
}

/**
 * Step 6: Discovery complete screen.
 */
export default function DoneStep({
  onGoToDashboard,
}: DoneStepProps): React.ReactElement {
  return (
    <View style={styles.container}>
      <View style={styles.centerContent}>
        <Text style={styles.doneTitle} accessibilityRole="header">
          ✓ Discovery Complete
        </Text>
        <Text style={styles.doneText}>
          You've identified your core values. Next, you can create specific
          value statements and link them to your daily priorities.
        </Text>
        <TouchableOpacity
          style={styles.doneButton}
          onPress={onGoToDashboard}
          accessibilityRole="button"
          accessibilityLabel="Go to Dashboard"
        >
          <Text style={styles.doneButtonText}>Go to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
