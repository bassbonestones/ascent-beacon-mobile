import React from "react";
import { View, Text, TouchableOpacity, LayoutChangeEvent } from "react-native";
import styles from "./assistantStyles";
import type { Value, ValueRevision, ValueInsight } from "../../types";

interface ValueCardProps {
  value?: Value;
  activeRevision?: ValueRevision | null;
  isHighlighted?: boolean;
  isDeleting?: boolean;
  insight?: ValueInsight | null;
  onEdit: (value: Value) => void;
  onDelete: (value: Value) => void;
  onConfirmDelete: (value: Value) => void;
  onCancelDelete: () => void;
  onReviewInsight?: (valueId: string) => void;
  onKeepBoth?: (valueId: string) => void;
  onLayout?: (event: LayoutChangeEvent) => void;
}

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
}: ValueCardProps): React.JSX.Element | null {
  if (!activeRevision || !value) return null;

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
          {activeRevision.origin === "discovered" ? "✨ Explored" : "Declared"}
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
            {insight.similar_value_id && onReviewInsight && (
              <TouchableOpacity
                style={styles.insightButton}
                onPress={() => onReviewInsight(value.id)}
                accessibilityRole="button"
                accessibilityLabel="Review similar value"
              >
                <Text style={styles.insightButtonText}>Review</Text>
              </TouchableOpacity>
            )}
            {onKeepBoth && (
              <TouchableOpacity
                style={styles.insightButton}
                onPress={() => onKeepBoth(value.id)}
                accessibilityRole="button"
                accessibilityLabel="Keep both values"
              >
                <Text style={styles.insightButtonText}>Keep both</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}
