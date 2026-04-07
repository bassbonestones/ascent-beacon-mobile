import React from "react";
import { View, Text, Pressable, Platform } from "react-native";
import type { Task } from "../../types";
import { styles } from "../../screens/styles/tasksScreenStyles";
import {
  isTaskOverdue,
  formatTaskTime,
  getTaskWindow,
} from "../../utils/taskSorting";

/**
 * Format a date for overdue display (e.g., "Apr 7" or "April 7, 2026" if different year).
 */
const formatOverdueDate = (
  dateStr: string,
  today: Date = new Date(),
): string => {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  if (date.getFullYear() !== today.getFullYear()) {
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }
  return `${months[date.getMonth()]} ${date.getDate()}`;
};

interface TaskCardProps {
  task: Task;
  onPress: (task: Task) => void;
  onComplete: (task: Task) => void;
  currentDate?: Date; // For time travel support - defaults to now
}

const getStatusColor = (status: string, isOverdue: boolean): string => {
  if (isOverdue) return "#EF4444"; // Red for overdue
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

/**
 * Format a time string (HH:MM) to 12-hour format.
 */
const formatTime12h = (time: string): string => {
  const [hour, minute] = time.split(":");
  const h = parseInt(hour, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayHour}:${minute} ${ampm}`;
};

export function TaskCard({
  task,
  onPress,
  onComplete,
  currentDate = new Date(),
}: TaskCardProps): React.ReactElement {
  const isCompleted = task.status === "completed";
  const isPending = task.status === "pending";
  const overdue = isTaskOverdue(task, currentDate);
  const scheduledTime = formatTaskTime(task.scheduled_at, task.scheduling_mode);
  const taskWindow = getTaskWindow(task.recurrence_rule);

  // Get the missed date for overdue virtual occurrences
  const overdueDate =
    overdue && task.virtualOccurrenceDate
      ? formatOverdueDate(task.virtualOccurrenceDate, currentDate)
      : null;

  const handleCompleteClick = React.useCallback(() => {
    onComplete(task);
  }, [onComplete, task]);

  return (
    <View style={[styles.taskCard, overdue && styles.taskCardOverdue]}>
      {/* Main card content - pressable for navigation */}
      <Pressable
        style={styles.taskCardPressable}
        onPress={() => onPress(task)}
        accessibilityLabel={`Task: ${task.title}`}
        accessibilityRole="button"
      >
        <View style={styles.taskHeader}>
          <View style={styles.taskTitleContainer}>
            <Text
              style={[
                styles.taskTitle,
                isCompleted && styles.taskTitleCompleted,
              ]}
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
              { backgroundColor: getStatusColor(task.status, overdue) },
            ]}
          >
            <Text style={styles.statusText}>
              {overdue
                ? overdueDate
                  ? `Overdue (${overdueDate})`
                  : "Overdue"
                : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
            </Text>
          </View>

          {/* Spacer for action button area */}
          {(isPending || isCompleted) && <View style={styles.actionSpacer} />}
        </View>

        <View style={styles.taskMeta}>
          {scheduledTime && (
            <Text style={[styles.taskTime, overdue && styles.taskTimeOverdue]}>
              🕐 {scheduledTime}
            </Text>
          )}
          {!scheduledTime && taskWindow && (
            <Text style={[styles.taskTime, styles.taskTimeFlexible]}>
              🕐 {formatTime12h(taskWindow.start)} -{" "}
              {formatTime12h(taskWindow.end)}
            </Text>
          )}
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
              ⏱️ {formatDuration(task.duration_minutes)}
            </Text>
          )}
        </View>
      </Pressable>

      {/* Action buttons - positioned absolutely to avoid nested buttons on web */}
      {isPending &&
        (Platform.OS === "web" ? (
          // On web, use fully native HTML for reliable click handling
          <div
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              e.preventDefault();
              handleCompleteClick();
            }}
            style={{
              position: "absolute",
              right: 16,
              top: 16,
              padding: 8,
              zIndex: 100,
              cursor: "pointer",
            }}
            role="button"
            aria-label={`Complete task: ${task.title}`}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                borderWidth: 2,
                borderStyle: "solid",
                borderColor: "#374151",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "transparent",
              }}
            />
          </div>
        ) : (
          <Pressable
            style={styles.checkButtonAbsolute}
            onPress={handleCompleteClick}
            accessibilityLabel={`Complete task: ${task.title}`}
            accessibilityRole="button"
          >
            <View style={styles.checkCircle}>
              <Text style={styles.checkMark}></Text>
            </View>
          </Pressable>
        ))}

      {isCompleted && (
        <View style={[styles.checkCircleAbsolute, styles.checkCircleCompleted]}>
          <Text style={styles.checkMark}>✓</Text>
        </View>
      )}
    </View>
  );
}
