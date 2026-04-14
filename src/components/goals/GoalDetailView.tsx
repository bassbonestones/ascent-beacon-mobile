import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import type { Goal } from "../../types";
import {
  styles,
  getStatusColor,
  getStatusLabel,
} from "../../screens/styles/goalsScreenStyles";

interface GoalDetailViewProps {
  goal: Goal;
  onBack: () => void;
  onDelete: (goal: Goal) => void;
  onArchive?: (goal: Goal) => void;
  onPause?: (goal: Goal) => void;
  onUnpause?: (goal: Goal) => void;
}

export function GoalDetailView({
  goal,
  onBack,
  onDelete,
  onArchive = () => {},
  onPause = () => {},
  onUnpause = () => {},
}: GoalDetailViewProps): React.ReactElement {
  const stateLabel = goal.record_state ? goal.record_state.toUpperCase() : "ACTIVE";
  const isArchived = goal.record_state === "archived";
  const isPaused = goal.record_state === "paused";

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

        <View style={styles.detailSection}>
          <Text style={styles.detailLabel}>Record State</Text>
          <Text style={styles.detailText}>{stateLabel}</Text>
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
          <Text style={styles.detailLabel}>Visibility Controls</Text>
          <View style={styles.statusButtons}>
            <TouchableOpacity
              style={styles.statusButton}
              onPress={() => onArchive(goal)}
              accessibilityLabel="Archive goal"
              accessibilityRole="button"
              disabled={isArchived}
            >
              <Text
                style={[
                  styles.statusButtonText,
                  isArchived && styles.disabledActionText,
                ]}
              >
                Archive (Stop Tracking)
              </Text>
            </TouchableOpacity>
            {!isArchived && !isPaused && (
              <TouchableOpacity
                style={styles.statusButton}
                onPress={() => onPause(goal)}
                accessibilityLabel="Pause goal"
                accessibilityRole="button"
              >
                <Text style={styles.statusButtonText}>Pause</Text>
              </TouchableOpacity>
            )}
            {isPaused && (
              <TouchableOpacity
                style={styles.statusButton}
                onPress={() => onUnpause(goal)}
                accessibilityLabel="Unpause goal"
                accessibilityRole="button"
              >
                <Text style={styles.statusButtonText}>Unpause</Text>
              </TouchableOpacity>
            )}
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
