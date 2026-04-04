import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import type { Task, TaskStatus } from "../../types";
import { styles } from "../../screens/styles/tasksScreenStyles";

interface TaskDetailViewProps {
  task: Task;
  onBack: () => void;
  onComplete: (task: Task) => void;
  onSkip: (task: Task) => void;
  onReopen: (task: Task) => void;
  onDelete: (task: Task) => void;
}

const getStatusLabel = (status: TaskStatus): string => {
  switch (status) {
    case "pending":
      return "Pending";
    case "completed":
      return "Completed";
    case "skipped":
      return "Skipped";
    default:
      return status;
  }
};

const getStatusColor = (status: TaskStatus): string => {
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
  if (minutes === 0) return "Lightning Task (< 1 min)";
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
  return `${hours}h ${mins}m`;
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const getRecurrenceDescription = (rrule: string | null): string => {
  if (!rrule) return "Not set";

  const parts = rrule.split(";").reduce(
    (acc, part) => {
      const [key, value] = part.split("=");
      if (key && value) acc[key] = value;
      return acc;
    },
    {} as Record<string, string>,
  );

  const freq = parts.FREQ || "DAILY";
  const interval = parseInt(parts.INTERVAL || "1", 10);

  const freqLabels: Record<string, string[]> = {
    DAILY: ["day", "days"],
    WEEKLY: ["week", "weeks"],
    MONTHLY: ["month", "months"],
    YEARLY: ["year", "years"],
  };

  const [singular, plural] = freqLabels[freq] || ["time", "times"];
  let desc =
    interval === 1 ? `Every ${singular}` : `Every ${interval} ${plural}`;

  if (parts.BYDAY) {
    const dayMap: Record<string, string> = {
      MO: "Mon",
      TU: "Tue",
      WE: "Wed",
      TH: "Thu",
      FR: "Fri",
      SA: "Sat",
      SU: "Sun",
    };
    const days = parts.BYDAY.split(",")
      .map((d) => dayMap[d] || d)
      .join(", ");
    desc += ` on ${days}`;
  }

  return desc;
};

export function TaskDetailView({
  task,
  onBack,
  onComplete,
  onSkip,
  onReopen,
  onDelete,
}: TaskDetailViewProps): React.ReactElement {
  const isPending = task.status === "pending";
  const isCompleted = task.status === "completed";
  const isSkipped = task.status === "skipped";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          accessibilityLabel="Back to tasks"
          accessibilityRole="button"
        >
          <Text style={styles.backButtonText}>← Tasks</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Details</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.detailContainer}>
        <Text style={styles.detailTitle}>{task.title}</Text>

        {task.description && (
          <Text style={styles.detailDescription}>{task.description}</Text>
        )}

        <View style={styles.detailMeta}>
          <View style={styles.detailMetaRow}>
            <Text style={styles.detailMetaLabel}>Status</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(task.status) },
              ]}
            >
              <Text style={styles.statusText}>
                {getStatusLabel(task.status)}
              </Text>
            </View>
          </View>

          <View style={styles.detailMetaRow}>
            <Text style={styles.detailMetaLabel}>Duration</Text>
            <Text style={styles.detailMetaValue}>
              {formatDuration(task.duration_minutes)}
            </Text>
          </View>

          {task.goal && (
            <View style={styles.detailMetaRow}>
              <Text style={styles.detailMetaLabel}>Goal</Text>
              <Text style={styles.detailMetaValue}>{task.goal.title}</Text>
            </View>
          )}

          {task.is_recurring && (
            <View style={styles.detailMetaRow}>
              <Text style={styles.detailMetaLabel}>Recurrence</Text>
              <Text style={styles.detailMetaValue}>
                {getRecurrenceDescription(task.recurrence_rule)}
              </Text>
            </View>
          )}

          {task.is_recurring && task.scheduling_mode && (
            <View style={styles.detailMetaRow}>
              <Text style={styles.detailMetaLabel}>Time Mode</Text>
              <Text style={styles.detailMetaValue}>
                {task.scheduling_mode === "floating"
                  ? "🌍 Time-of-day"
                  : "📍 Fixed time"}
              </Text>
            </View>
          )}

          {task.scheduled_at && (
            <View style={styles.detailMetaRow}>
              <Text style={styles.detailMetaLabel}>Scheduled</Text>
              <Text style={styles.detailMetaValue}>
                {formatDateTime(task.scheduled_at)}
              </Text>
            </View>
          )}

          {task.completed_at && (
            <View style={styles.detailMetaRow}>
              <Text style={styles.detailMetaLabel}>Completed</Text>
              <Text style={styles.detailMetaValue}>
                {formatDateTime(task.completed_at)}
              </Text>
            </View>
          )}

          {isSkipped && task.skip_reason && (
            <View style={styles.detailMetaRow}>
              <Text style={styles.detailMetaLabel}>Skip Reason</Text>
              <Text style={styles.detailMetaValue}>{task.skip_reason}</Text>
            </View>
          )}

          <View style={styles.detailMetaRow}>
            <Text style={styles.detailMetaLabel}>Created</Text>
            <Text style={styles.detailMetaValue}>
              {formatDate(task.created_at)}
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          {isPending && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.completeButton]}
                onPress={() => onComplete(task)}
                accessibilityLabel="Complete task"
                accessibilityRole="button"
              >
                <Text style={styles.actionButtonText}>✓ Complete Task</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.skipButton]}
                onPress={() => onSkip(task)}
                accessibilityLabel="Skip task"
                accessibilityRole="button"
              >
                <Text style={styles.actionButtonText}>Skip Task</Text>
              </TouchableOpacity>
            </>
          )}

          {(isCompleted || isSkipped) && (
            <TouchableOpacity
              style={[styles.actionButton, styles.reopenButton]}
              onPress={() => onReopen(task)}
              accessibilityLabel="Reopen task"
              accessibilityRole="button"
            >
              <Text style={styles.actionButtonText}>↩ Reopen Task</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => onDelete(task)}
            accessibilityLabel="Delete task"
            accessibilityRole="button"
          >
            <Text style={styles.deleteButtonText}>Delete Task</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
