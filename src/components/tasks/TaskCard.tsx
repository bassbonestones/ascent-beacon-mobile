import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import type { Task } from "../../types";
import { styles } from "../../screens/styles/tasksScreenStyles";

interface TaskCardProps {
  task: Task;
  onPress: (task: Task) => void;
  onComplete: (task: Task) => void;
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case "pending":
      return "#3B82F6";
    case "completed":
      return "#10B981";
    case "skipped":
      return "#6B7280";
    default:
      return "#374151";
  }
};

const formatDuration = (minutes: number): string => {
  if (minutes === 0) return "";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

export function TaskCard({
  task,
  onPress,
  onComplete,
}: TaskCardProps): React.ReactElement {
  const isCompleted = task.status === "completed";
  const isPending = task.status === "pending";

  return (
    <TouchableOpacity
      style={styles.taskCard}
      onPress={() => onPress(task)}
      accessibilityLabel={`Task: ${task.title}`}
      accessibilityRole="button"
    >
      <View style={styles.taskHeader}>
        <View style={styles.taskTitleContainer}>
          <Text
            style={[styles.taskTitle, isCompleted && styles.taskTitleCompleted]}
            numberOfLines={2}
          >
            {task.title}
          </Text>
          {task.goal && (
            <Text style={styles.taskGoal} numberOfLines={1}>
              {task.goal.title}
            </Text>
          )}
          {!task.goal && (
            <Text
              style={[styles.taskGoal, styles.unalignedText]}
              numberOfLines={1}
            >
              ⊘ Unaligned
            </Text>
          )}
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(task.status) },
          ]}
        >
          <Text style={styles.statusText}>
            {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
          </Text>
        </View>

        {isPending && (
          <TouchableOpacity
            style={styles.checkButton}
            onPress={() => onComplete(task)}
            accessibilityLabel={`Complete task: ${task.title}`}
            accessibilityRole="button"
          >
            <View style={styles.checkCircle}>
              <Text style={styles.checkMark}></Text>
            </View>
          </TouchableOpacity>
        )}

        {isCompleted && (
          <View style={[styles.checkCircle, styles.checkCircleCompleted]}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
        )}
      </View>

      <View style={styles.taskMeta}>
        {task.is_lightning && (
          <View style={styles.lightningBadge}>
            <Text style={styles.lightningText}>⚡ Quick</Text>
          </View>
        )}
        {task.is_recurring && (
          <View style={styles.recurringBadge}>
            <Text style={styles.recurringText}>🔄 Recurring</Text>
          </View>
        )}
        {!task.is_lightning && task.duration_minutes > 0 && (
          <Text style={styles.taskDuration}>
            🕐 {formatDuration(task.duration_minutes)}
          </Text>
        )}
        {task.scheduled_at && (
          <Text style={styles.taskScheduled}>
            📅 {new Date(task.scheduled_at).toLocaleDateString()}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
