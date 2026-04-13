import React from "react";
import PropTypes from "prop-types";
import { View, Text, TouchableOpacity } from "react-native";
import styles from "./assistantStyles";

/**
 * Displays a proposed value recommendation with accept/reject actions.
 */
export default function ProposedValueCard({
  recommendation,
  onAccept,
  onReject,
}) {
  return (
    <View
      style={styles.proposedValueCard}
      accessibilityRole="button"
      accessibilityLabel={`Proposed value: ${recommendation.payload.statement}`}
    >
      <View style={styles.proposedHeader}>
        <Text style={styles.proposedLabel}>Proposed Value</Text>
      </View>
      <Text style={styles.proposedStatement}>
        {recommendation.payload.statement}
      </Text>
      {recommendation.rationale && (
        <Text style={styles.proposedRationale}>{recommendation.rationale}</Text>
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

ProposedValueCard.propTypes = {
  recommendation: PropTypes.shape({
    id: PropTypes.string.isRequired,
    payload: PropTypes.shape({
      statement: PropTypes.string.isRequired,
    }).isRequired,
    rationale: PropTypes.string,
  }).isRequired,
  onAccept: PropTypes.func.isRequired,
  onReject: PropTypes.func.isRequired,
};
