import React from "react";
import PropTypes from "prop-types";
import { View, Text, TouchableOpacity } from "react-native";
import { styles } from "../../screens/styles/valuesManagementStyles";

/**
 * Value card displaying statement, weight, insights, and action buttons.
 */
export default function ValueListCard({
  value,
  activeRevision,
  insight,
  isHighlighted,
  canDelete,
  onEdit,
  onDelete,
  onReviewInsight,
  onKeepBoth,
  onLayout,
}) {
  if (!activeRevision) return null;

  return (
    <View
      style={[styles.valueCard, isHighlighted && styles.similarHighlight]}
      onLayout={onLayout}
      accessibilityRole="button"
      accessibilityLabel={`Value: ${activeRevision.statement}`}
    >
      <View style={styles.valueHeader}>
        <Text style={styles.valueStatement}>{activeRevision.statement}</Text>
      </View>

      {insight && (
        <View style={styles.insightContainer}>
          <Text style={styles.insightText}>{insight.message}</Text>
          <View style={styles.insightActions}>
            {insight.similar_value_id && (
              <TouchableOpacity
                style={styles.insightButton}
                onPress={() => onReviewInsight(value.id)}
                accessibilityRole="button"
                accessibilityLabel="Review similar value"
              >
                <Text style={styles.insightButtonText}>Review</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.insightButton}
              onPress={() => onKeepBoth(value.id)}
              accessibilityRole="button"
              accessibilityLabel="Keep both values"
            >
              <Text style={styles.insightButtonText}>Keep both</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {activeRevision.weight_normalized != null && (
        <Text style={styles.weightText}>
          Weight: {parseFloat(activeRevision.weight_normalized).toFixed(1)}%
        </Text>
      )}
      <View style={styles.valueActions}>
        <TouchableOpacity
          onPress={() => onEdit(value)}
          style={styles.editButton}
          accessibilityRole="button"
          accessibilityLabel="Edit value"
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        {canDelete && (
          <TouchableOpacity
            onPress={() => onDelete(value.id)}
            style={styles.deleteButton}
            accessibilityRole="button"
            accessibilityLabel="Delete value"
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

ValueListCard.propTypes = {
  value: PropTypes.object.isRequired,
  activeRevision: PropTypes.shape({
    statement: PropTypes.string,
    weight_normalized: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
    ]),
  }),
  insight: PropTypes.object,
  isHighlighted: PropTypes.bool,
  canDelete: PropTypes.bool,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onReviewInsight: PropTypes.func,
  onKeepBoth: PropTypes.func,
  onLayout: PropTypes.func,
};
