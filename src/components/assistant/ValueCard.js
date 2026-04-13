import React from "react";
import PropTypes from "prop-types";
import { View, Text, TouchableOpacity } from "react-native";
import styles from "./assistantStyles";

/**
 * Displays a saved value with edit/delete actions and optional insights.
 */
export default function ValueCard({
  value,
  activeRevision,
  isHighlighted,
  isDeleting,
  insight,
  onEdit,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
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
      <Text style={styles.valueStatement}>{activeRevision.statement}</Text>
      <View style={styles.valueFooter}>
        <Text style={styles.valueOrigin}>
          {activeRevision.origin === "explored" ? "✨ Explored" : "Declared"}
        </Text>
      </View>
      <View style={styles.valueActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => onEdit(value)}
          accessibilityRole="button"
          accessibilityLabel="Edit value"
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(value)}
          accessibilityRole="button"
          accessibilityLabel="Delete value"
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>

      {isDeleting && (
        <View style={styles.deleteConfirm}>
          <Text style={styles.deleteConfirmText}>Delete this value?</Text>
          <View style={styles.deleteConfirmActions}>
            <TouchableOpacity
              style={styles.deleteConfirmButton}
              onPress={() => onConfirmDelete(value)}
              accessibilityRole="button"
              accessibilityLabel="Confirm delete"
            >
              <Text style={styles.deleteConfirmButtonText}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelDeleteButton}
              onPress={onCancelDelete}
              accessibilityRole="button"
              accessibilityLabel="Cancel delete"
            >
              <Text style={styles.cancelDeleteButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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
    </View>
  );
}

ValueCard.propTypes = {
  value: PropTypes.object,
  activeRevision: PropTypes.shape({
    statement: PropTypes.string,
    origin: PropTypes.string,
  }),
  isHighlighted: PropTypes.bool,
  isDeleting: PropTypes.bool,
  insight: PropTypes.object,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onConfirmDelete: PropTypes.func.isRequired,
  onCancelDelete: PropTypes.func.isRequired,
  onReviewInsight: PropTypes.func,
  onKeepBoth: PropTypes.func,
  onLayout: PropTypes.func,
};
