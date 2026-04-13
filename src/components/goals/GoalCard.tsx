import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import type { Goal } from "../../types";
import {
  styles,
  getStatusColor,
  getStatusLabel,
} from "../../screens/styles/goalsScreenStyles";

interface GoalCardProps {
  goal: Goal;
  onPress: (goal: Goal) => void;
}

export function GoalCard({ goal, onPress }: GoalCardProps): React.ReactElement {
  const showAlignmentWarning =
    goal.is_aligned_with_priorities === false ||
    (goal.is_aligned_with_priorities === undefined &&
      goal.priorities.length === 0);

  return (
    <TouchableOpacity
      style={styles.goalCard}
      onPress={() => onPress(goal)}
      accessibilityLabel={`Goal: ${goal.title}`}
      accessibilityRole="button"
    >
      <View style={styles.goalHeader}>
        <Text style={styles.goalTitle} numberOfLines={2}>
          {goal.title}
        </Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(goal.status) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusLabel(goal.status)}</Text>
        </View>
      </View>
      {goal.description && (
        <Text style={styles.goalDescription} numberOfLines={2}>
          {goal.description}
        </Text>
      )}
      {goal.target_date && (
        <Text style={styles.targetDate}>Target: {goal.target_date}</Text>
      )}
      {showAlignmentWarning && (
        <Text style={styles.warningText}>
          ⚠️ This goal isn&apos;t linked to any priority
        </Text>
      )}
      {goal.has_incomplete_breakdown && goal.progress_cached === 0 && (
        <Text style={styles.warningText}>⚠️ No tasks defined yet</Text>
      )}
      {goal.priorities.length > 0 && (
        <View style={styles.prioritiesRow}>
          <Text style={styles.prioritiesLabel}>Priorities: </Text>
          <Text style={styles.prioritiesText} numberOfLines={1}>
            {goal.priorities.map((p) => p.title).join(", ")}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
