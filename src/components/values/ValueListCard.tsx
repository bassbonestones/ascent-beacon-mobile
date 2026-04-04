import React from "react";
import { View, Text, TouchableOpacity, LayoutChangeEvent } from "react-native";
import { styles } from "../../screens/styles/valuesManagementStyles";
import type { Value, ValueRevision, ValueInsight } from "../../types";

interface ValueListCardProps {
  value: Value;
  activeRevision?: ValueRevision | null;
  insight?: ValueInsight | null;
  isHighlighted?: boolean;
  canDelete?: boolean;
  onEdit: (value: Value) => void;
  onDelete: (valueId: string) => void;
  onReviewInsight?: (valueId: string) => void;
  onKeepBoth?: (valueId: string) => void;
  onLayout?: (event: LayoutChangeEvent) => void;
}

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
}: ValueListCardProps): React.JSX.Element | null {
  if (!activeRevision) return null;

  return (
    <View
      style={[styles.valueCard, isHighlighted && styles.similarHighlight]}
      onLayout={onLayout}
      accessibilityLabel={`Value: ${activeRevision.statement}`}
    >
      <View style={styles.valueHeader}>
        <Text style={styles.valueStatement}>{activeRevision.statement}</Text>
      </View>

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
      {activeRevision.weight_normalized != null && (
        <Text style={styles.weightText}>
          Weight:{" "}
          {parseFloat(String(activeRevision.weight_normalized)).toFixed(1)}%
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
