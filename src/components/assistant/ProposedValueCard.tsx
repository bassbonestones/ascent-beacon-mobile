import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import styles from "./assistantStyles";
import type { AssistantRecommendation } from "../../types";

interface ProposedValueCardProps {
  recommendation: AssistantRecommendation;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

/**
 * Displays a proposed value recommendation with accept/reject actions.
 */
export default function ProposedValueCard({
  recommendation,
  onAccept,
  onReject,
}: ProposedValueCardProps): React.JSX.Element {
  // Cast payload for value recommendations
  const payload = recommendation.payload as { statement?: string };
  const statement = payload.statement || recommendation.title;

  return (
    <View
      style={styles.proposedValueCard}
      accessibilityRole="button"
      accessibilityLabel={`Proposed value: ${statement}`}
    >
      <View style={styles.proposedHeader}>
        <Text style={styles.proposedLabel}>Proposed Value</Text>
      </View>
      <Text style={styles.proposedStatement}>{statement}</Text>
      {recommendation.description && (
        <Text style={styles.proposedRationale}>
          {recommendation.description}
        </Text>
      )}
      <View style={styles.proposedActions}>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => onReject(recommendation.id)}
          accessibilityRole="button"
          accessibilityLabel="Reject this value"
        >
          <Text style={styles.rejectButtonText}>Not Quite</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => onAccept(recommendation.id)}
          accessibilityRole="button"
          accessibilityLabel="Accept and add this value"
        >
          <Text style={styles.acceptButtonText}>Add This</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
