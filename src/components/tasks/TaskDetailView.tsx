import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import type { Task, TaskStatus } from "../../types";
import { styles } from "../../screens/styles/tasksScreenStyles";
import { parseAsUtc, getTimezoneAbbreviation } from "../../utils/taskSorting";
import { useTimezone } from "../../hooks/useTimezone";

interface TaskDetailViewProps {
  task: Task;
  onBack: () => void;
  onComplete: (task: Task) => void;
  onSkip: (task: Task) => void;
  onReopen: (task: Task) => void;
  onDelete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onViewTracking?: (task: Task) => void;
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
  const date = parseAsUtc(dateString);
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const day = date.getDate();
  const year = date.getFullYear();
  return `${weekday}, ${month} ${day}, ${year}`;
};

const formatDateTime = (
  dateString: string,
  overrideTimezone?: string,
): string => {
  const date = parseAsUtc(dateString);

  // Get time components in target timezone
  let hours: number,
    minutes: number,
    weekday: string,
    month: string,
    day: number;

  if (overrideTimezone) {
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: overrideTimezone,
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: false,
      });
      const parts = formatter.formatToParts(date);
      weekday = parts.find((p) => p.type === "weekday")?.value || "";
      month = parts.find((p) => p.type === "month")?.value || "";
      day = parseInt(parts.find((p) => p.type === "day")?.value || "0", 10);
      hours = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
      minutes = parseInt(
        parts.find((p) => p.type === "minute")?.value || "0",
        10,
      );
    } catch {
      // Fallback to local
      weekday = date.toLocaleDateString("en-US", { weekday: "short" });
      month = date.toLocaleDateString("en-US", { month: "short" });
      day = date.getDate();
      hours = date.getHours();
      minutes = date.getMinutes();
    }
  } else {
    weekday = date.toLocaleDateString("en-US", { weekday: "short" });
    month = date.toLocaleDateString("en-US", { month: "short" });
    day = date.getDate();
    hours = date.getHours();
    minutes = date.getMinutes();
  }

  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const displayMinute = minutes.toString().padStart(2, "0");
  const tz = getTimezoneAbbreviation(date, overrideTimezone);
  return `${weekday}, ${month} ${day} at ${displayHour}:${displayMinute} ${ampm} ${tz}`;
};

/**
 * Format datetime based on scheduling_mode.
 * If 'date_only', shows just the date without time.
 */
const formatScheduledAt = (
  dateString: string,
  schedulingMode?: string | null,
  overrideTimezone?: string,
): string => {
  const date = parseAsUtc(dateString);

  // Get time components for midnight check
  let hours: number, minutes: number, seconds: number, milliseconds: number;
  let weekday: string, month: string, day: number, year: number;

  if (overrideTimezone) {
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: overrideTimezone,
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      const parts = formatter.formatToParts(date);
      weekday = parts.find((p) => p.type === "weekday")?.value || "";
      month = parts.find((p) => p.type === "month")?.value || "";
      day = parseInt(parts.find((p) => p.type === "day")?.value || "0", 10);
      year = parseInt(parts.find((p) => p.type === "year")?.value || "0", 10);
      hours = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
      minutes = parseInt(
        parts.find((p) => p.type === "minute")?.value || "0",
        10,
      );
      seconds = parseInt(
        parts.find((p) => p.type === "second")?.value || "0",
        10,
      );
      milliseconds = date.getMilliseconds();
    } catch {
      // Fallback to local time
      weekday = date.toLocaleDateString("en-US", { weekday: "short" });
      month = date.toLocaleDateString("en-US", { month: "short" });
      day = date.getDate();
      year = date.getFullYear();
      hours = date.getHours();
      minutes = date.getMinutes();
      seconds = date.getSeconds();
      milliseconds = date.getMilliseconds();
    }
  } else {
    weekday = date.toLocaleDateString("en-US", { weekday: "short" });
    month = date.toLocaleDateString("en-US", { month: "short" });
    day = date.getDate();
    year = date.getFullYear();
    hours = date.getHours();
    minutes = date.getMinutes();
    seconds = date.getSeconds();
    milliseconds = date.getMilliseconds();
  }

  // Check if this should be shown as date-only
  const isDateOnly =
    schedulingMode === "date_only" ||
    // Heuristic: midnight with no scheduling_mode = likely date-only
    (!schedulingMode &&
      hours === 0 &&
      minutes === 0 &&
      seconds === 0 &&
      milliseconds === 0);

  if (isDateOnly) {
    return `${weekday}, ${month} ${day}, ${year}`;
  }

  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const displayMinute = minutes.toString().padStart(2, "0");
  const tz = getTimezoneAbbreviation(date, overrideTimezone);
  return `${weekday}, ${month} ${day} at ${displayHour}:${displayMinute} ${ampm} ${tz}`;
};

/**
 * Format time from HH:MM to 12-hour format.
 */
const formatTime12h = (time: string): string => {
  const [hour, minute] = time.split(":").map(Number);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minute.toString().padStart(2, "0")} ${ampm}`;
};

/**
 * Format YYYYMMDD date to readable format.
 */
const formatUntilDate = (untilStr: string): string => {
  const dateOnly = untilStr.replace(/T.*$/, "");
  const year = parseInt(dateOnly.slice(0, 4), 10);
  const month = parseInt(dateOnly.slice(4, 6), 10) - 1;
  const day = parseInt(dateOnly.slice(6, 8), 10);
  const date = new Date(year, month, day);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

interface RecurrenceInfo {
  frequency: string;
  days: string | null;
  intradayMode: string | null;
  intradayDetails: string | null;
  endCondition: string | null;
}

const getRecurrenceInfo = (rrule: string | null): RecurrenceInfo => {
  const defaultInfo: RecurrenceInfo = {
    frequency: "Not set",
    days: null,
    intradayMode: null,
    intradayDetails: null,
    endCondition: null,
  };

  if (!rrule) return defaultInfo;

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
  let frequency =
    interval === 1 ? `Every ${singular}` : `Every ${interval} ${plural}`;

  // Days (for weekly)
  let days: string | null = null;
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
    days = parts.BYDAY.split(",")
      .map((d) => dayMap[d] || d)
      .join(", ");
  }

  // Intraday mode
  const intradayMode = parts["X-INTRADAY"] || "single";
  let intradayModeLabel: string | null = null;
  let intradayDetails: string | null = null;

  switch (intradayMode) {
    case "single":
      // No special label needed, shown via scheduled_at
      break;
    case "anytime": {
      const dailyOcc = parseInt(parts["X-DAILYOCC"] || "1", 10);
      intradayModeLabel = `${dailyOcc}x per day`;
      intradayDetails = "Complete anytime during the day";
      break;
    }
    case "specific_times": {
      const times = parts["X-TIMES"]?.split(",") || [];
      intradayModeLabel = `${times.length} specific time${times.length > 1 ? "s" : ""}`;
      if (times.length > 0) {
        intradayDetails = times.map(formatTime12h).join(", ");
      }
      break;
    }
    case "interval": {
      const intervalMin = parseInt(parts["X-INTERVALMIN"] || "30", 10);
      const winStart = parts["X-WINSTART"] || "09:00";
      const winEnd = parts["X-WINEND"] || "21:00";
      const maxOcc = parts["X-DAILYOCC"]
        ? parseInt(parts["X-DAILYOCC"], 10)
        : null;
      intradayModeLabel = `Every ${intervalMin} min`;
      intradayDetails = `${formatTime12h(winStart)} - ${formatTime12h(winEnd)}`;
      if (maxOcc) {
        intradayDetails += ` (max ${maxOcc}x)`;
      }
      break;
    }
    case "window": {
      const winStart = parts["X-WINSTART"] || "09:00";
      const winEnd = parts["X-WINEND"] || "21:00";
      intradayModeLabel = "Flexible window";
      intradayDetails = `${formatTime12h(winStart)} - ${formatTime12h(winEnd)}`;
      break;
    }
  }

  // End condition
  let endCondition: string | null = null;
  if (parts.COUNT) {
    const count = parseInt(parts.COUNT, 10);
    endCondition = `Stops after ${count} day${count > 1 ? "s" : ""}`;
  } else if (parts.UNTIL) {
    endCondition = `Until ${formatUntilDate(parts.UNTIL)}`;
  }

  return {
    frequency,
    days,
    intradayMode: intradayModeLabel,
    intradayDetails,
    endCondition,
  };
};

export function TaskDetailView({
  task,
  onBack,
  onComplete,
  onSkip,
  onReopen,
  onDelete,
  onEdit,
  onViewTracking,
}: TaskDetailViewProps): React.ReactElement {
  const { timezone } = useTimezone();
  const isPending =
    task.status === "pending" &&
    !task.completed_for_today &&
    !task.skipped_for_today;
  const isCompleted = task.status === "completed" || task.completed_for_today;
  const isSkipped = task.status === "skipped" || task.skipped_for_today;

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

          {task.is_recurring &&
            (() => {
              const info = getRecurrenceInfo(task.recurrence_rule);
              return (
                <>
                  <View style={styles.detailMetaRow}>
                    <Text style={styles.detailMetaLabel}>Repeats</Text>
                    <Text style={styles.detailMetaValue}>{info.frequency}</Text>
                  </View>

                  {info.days && (
                    <View style={styles.detailMetaRow}>
                      <Text style={styles.detailMetaLabel}>On days</Text>
                      <Text style={styles.detailMetaValue}>{info.days}</Text>
                    </View>
                  )}

                  {info.intradayMode && (
                    <View style={styles.detailMetaRow}>
                      <Text style={styles.detailMetaLabel}>Times/day</Text>
                      <Text style={styles.detailMetaValue}>
                        {info.intradayMode}
                      </Text>
                    </View>
                  )}

                  {info.intradayDetails && (
                    <View style={styles.detailMetaRow}>
                      <Text style={styles.detailMetaLabel}>Schedule</Text>
                      <Text style={styles.detailMetaValue}>
                        {info.intradayDetails}
                      </Text>
                    </View>
                  )}

                  {info.endCondition && (
                    <View style={styles.detailMetaRow}>
                      <Text style={styles.detailMetaLabel}>Ends</Text>
                      <Text style={styles.detailMetaValue}>
                        {info.endCondition}
                      </Text>
                    </View>
                  )}
                </>
              );
            })()}

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
                {formatScheduledAt(
                  task.scheduled_at,
                  task.scheduling_mode,
                  timezone,
                )}
              </Text>
            </View>
          )}

          {task.completed_at && (
            <View style={styles.detailMetaRow}>
              <Text style={styles.detailMetaLabel}>Completed</Text>
              <Text style={styles.detailMetaValue}>
                {formatDateTime(task.completed_at, timezone)}
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
          {task.is_recurring && onViewTracking && (
            <TouchableOpacity
              style={[styles.actionButton, styles.trackingButton]}
              onPress={() => onViewTracking(task)}
              accessibilityLabel="View habit tracking"
              accessibilityRole="button"
            >
              <Text style={styles.actionButtonText}>📊 View Tracking</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => onEdit(task)}
            accessibilityLabel="Edit task"
            accessibilityRole="button"
          >
            <Text style={styles.actionButtonText}>✏️ Edit Task</Text>
          </TouchableOpacity>

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
