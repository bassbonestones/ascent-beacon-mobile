import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import type { Goal, GoalStatus } from "../../types";
import {
  styles,
  getStatusColor,
  getStatusLabel,
} from "../../screens/styles/goalsScreenStyles";

interface GoalDetailViewProps {
  goal: Goal;
  onBack: () => void;
  onDelete: (goal: Goal) => void;
  onStatusChange: (goal: Goal, status: GoalStatus) => void;
}

const STATUSES: GoalStatus[] = [
  "not_started",
  "in_progress",
  "completed",
  "abandoned",
];

export function GoalDetailView({
  goal,
  onBack,
  onDelete,
  onStatusChange,
}: GoalDetailViewProps): React.ReactElement {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          accessibilityLabel="Back to goals list"
          accessibilityRole="button"
        >
          <Text style={styles.backButtonText}>← Goals</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Goal Detail</Text>
        <TouchableOpacity
          onPress={() => onDelete(goal)}
          accessibilityLabel="Delete goal"
          accessibilityRole="button"
        >
          <Text style={styles.deleteButton}>Delete</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.detailContainer}>
        <Text style={styles.detailTitle}>{goal.title}</Text>

        <View
          style={[
            styles.statusBadgeLarge,
            { backgroundColor: getStatusColor(goal.status) },
          ]}
        >
          <Text style={styles.statusTextLarge}>
            {getStatusLabel(goal.status)}
          </Text>
        </View>

        {goal.description && (
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Description</Text>
            <Text style={styles.detailText}>{goal.description}</Text>
          </View>
        )}

        {goal.target_date && (
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Target Date</Text>
            <Text style={styles.detailText}>{goal.target_date}</Text>
          </View>
        )}

        {goal.priorities.length > 0 && (
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Linked Priorities</Text>
            {goal.priorities.map((p) => (
              <Text key={p.id} style={styles.priorityItem}>
                • {p.title}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.detailSection}>
          <Text style={styles.detailLabel}>Change Status</Text>
          <View style={styles.statusButtons}>
            {STATUSES.map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusButton,
                  goal.status === status && styles.statusButtonActive,
                  { borderColor: getStatusColor(status) },
                ]}
                onPress={() => onStatusChange(goal, status)}
                accessibilityLabel={`Set status to ${getStatusLabel(status)}`}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.statusButtonText,
                    goal.status === status && { color: getStatusColor(status) },
                  ]}
                >
                  {getStatusLabel(status)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {goal.has_incomplete_breakdown && (
          <View style={styles.warningBox}>
            <Text style={styles.warningBoxText}>
              ⚠️ Progress may be inaccurate — this goal doesn't have tasks
              defined yet.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
