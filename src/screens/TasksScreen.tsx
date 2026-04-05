import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Task, User, RootStackParamList, SchedulingMode } from "../types";
import { useTasks } from "../hooks/useTasks";
import { useGoals } from "../hooks/useGoals";
import { styles } from "./styles/tasksScreenStyles";
import {
  TaskCard,
  TaskDetailView,
  CreateTaskForm,
  SkipReasonModal,
} from "../components/tasks";
import { showAlert, showConfirm } from "../utils/alert";

interface TasksScreenProps {
  user: User;
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

type ViewMode = "list" | "create" | "detail";
type StatusFilter = "all" | "pending" | "completed";

export default function TasksScreen({
  user,
  navigation,
}: TasksScreenProps): React.ReactElement {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [skipModalTask, setSkipModalTask] = useState<Task | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goalId, setGoalId] = useState("");
  const [duration, setDuration] = useState("30");
  const [isLightning, setIsLightning] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState("");
  const [schedulingMode, setSchedulingMode] = useState<SchedulingMode | null>(
    null,
  );
  const [scheduledTime, setScheduledTime] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState<string | null>(null);

  const {
    tasks,
    loading,
    pendingCount,
    completedCount,
    refetch,
    createTask,
    completeTask,
    skipTask,
    reopenTask,
    deleteTask,
  } = useTasks({ status: statusFilter === "all" ? undefined : statusFilter });

  const { goals, loading: goalsLoading } = useGoals({ parentOnly: true });

  // No auto-selection - tasks can be unaligned (no goal)

  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setGoalId(""); // Reset to unaligned
    setDuration("30");
    setIsLightning(false);
    setIsRecurring(false);
    setRecurrenceRule("");
    setSchedulingMode(null);
    setScheduledTime(null);
    setScheduledDate(null);
  }, []);

  // Convert date + time to ISO datetime
  const dateTimeToIso = (
    date: string | null,
    time: string | null,
  ): string | undefined => {
    if (!time) return undefined;
    const [hour, minute] = time.split(":").map(Number);

    let targetDate: Date;
    if (date) {
      // Use selected date
      const [year, month, day] = date.split("-").map(Number);
      targetDate = new Date(year, month - 1, day, hour, minute, 0, 0);
    } else {
      // Default to today
      targetDate = new Date();
      targetDate.setHours(hour, minute, 0, 0);
    }

    return targetDate.toISOString();
  };

  const handleCreate = useCallback(async () => {
    if (!title.trim()) {
      showAlert("Error", "Please enter a task title");
      return;
    }
    try {
      await createTask({
        goal_id: goalId || undefined,
        title: title.trim(),
        description: description.trim() || undefined,
        duration_minutes: isLightning ? 0 : parseInt(duration, 10) || 30,
        scheduled_at: dateTimeToIso(scheduledDate, scheduledTime),
        is_recurring: isRecurring,
        recurrence_rule: isRecurring ? recurrenceRule || undefined : undefined,
        scheduling_mode:
          isRecurring && scheduledTime ? schedulingMode : undefined,
      });
      resetForm();
      setViewMode("list");
    } catch {
      // Error handled in hook
    }
  }, [
    title,
    description,
    goalId,
    duration,
    isLightning,
    isRecurring,
    recurrenceRule,
    schedulingMode,
    scheduledTime,
    scheduledDate,
    createTask,
    resetForm,
  ]);

  const handleRecurrenceChange = useCallback(
    (
      rrule: string,
      mode: SchedulingMode,
      startDate: string | null,
      startTime: string | null,
    ) => {
      setRecurrenceRule(rrule);
      setSchedulingMode(mode);
      setScheduledDate(startDate);
      setScheduledTime(startTime);
    },
    [],
  );

  const handleComplete = useCallback(
    async (task: Task) => {
      try {
        await completeTask(task.id);
      } catch {
        // Error handled in hook
      }
    },
    [completeTask],
  );

  const handleSkipWithReason = useCallback(
    async (reason?: string) => {
      if (!skipModalTask) return;
      try {
        await skipTask(skipModalTask.id, reason);
        setSkipModalTask(null);
        if (selectedTask?.id === skipModalTask.id) {
          setSelectedTask(null);
          setViewMode("list");
        }
      } catch {
        // Error handled in hook
      }
    },
    [skipModalTask, skipTask, selectedTask],
  );

  const handleSkip = useCallback(async (task: Task) => {
    // For recurring tasks or any task, show the skip modal
    setSkipModalTask(task);
  }, []);

  const handleReopen = useCallback(
    async (task: Task) => {
      try {
        setSelectedTask(await reopenTask(task.id));
      } catch {
        // Error handled in hook
      }
    },
    [reopenTask],
  );

  const handleDelete = useCallback(
    async (task: Task) => {
      if (await showConfirm("Delete Task", `Delete "${task.title}"?`)) {
        try {
          await deleteTask(task.id);
          setSelectedTask(null);
          setViewMode("list");
        } catch {
          // Error handled in hook
        }
      }
    },
    [deleteTask],
  );

  const blurActiveElement = (): void => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      (document.activeElement as HTMLElement | null)?.blur?.();
    }
  };

  if (viewMode === "create") {
    return (
      <CreateTaskForm
        goals={goals}
        goalsLoading={goalsLoading}
        selectedGoalId={goalId}
        onGoalSelect={setGoalId}
        title={title}
        onTitleChange={setTitle}
        description={description}
        onDescriptionChange={setDescription}
        isLightning={isLightning}
        onLightningToggle={() => setIsLightning(!isLightning)}
        duration={duration}
        onDurationChange={setDuration}
        isRecurring={isRecurring}
        onRecurringToggle={() => setIsRecurring(!isRecurring)}
        recurrenceRule={recurrenceRule}
        schedulingMode={schedulingMode}
        scheduledTime={scheduledTime}
        onScheduledTimeChange={setScheduledTime}
        scheduledDate={scheduledDate}
        onScheduledDateChange={setScheduledDate}
        onRecurrenceChange={handleRecurrenceChange}
        onSubmit={handleCreate}
        onCancel={() => {
          resetForm();
          setViewMode("list");
        }}
      />
    );
  }

  if (viewMode === "detail" && selectedTask) {
    return (
      <>
        <TaskDetailView
          task={selectedTask}
          onBack={() => {
            setSelectedTask(null);
            setViewMode("list");
          }}
          onComplete={handleComplete}
          onSkip={handleSkip}
          onReopen={handleReopen}
          onDelete={handleDelete}
        />
        <SkipReasonModal
          visible={skipModalTask !== null}
          taskTitle={skipModalTask?.title || ""}
          onClose={() => setSkipModalTask(null)}
          onSkip={handleSkipWithReason}
        />
      </>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            blurActiveElement();
            navigation.goBack();
          }}
          accessibilityLabel="Back to Dashboard"
          accessibilityRole="button"
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tasks</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setViewMode("create")}
          accessibilityLabel="Create new task"
          accessibilityRole="button"
        >
          <Text style={styles.addButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryCount}>{pendingCount}</Text>
          <Text style={styles.summaryLabel}>pending</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryCount}>{completedCount}</Text>
          <Text style={styles.summaryLabel}>completed</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {(["pending", "completed", "all"] as StatusFilter[]).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterToggle,
              statusFilter === filter && styles.filterToggleActive,
            ]}
            onPress={() => setStatusFilter(filter)}
            accessibilityLabel={`Show ${filter} tasks`}
          >
            <Text
              style={[
                styles.filterToggleText,
                statusFilter === filter && styles.filterToggleTextActive,
              ]}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : tasks.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>
            {statusFilter === "pending"
              ? "No pending tasks"
              : statusFilter === "completed"
                ? "No completed tasks"
                : "No tasks yet"}
          </Text>
          <Text style={styles.emptyStateText}>
            {statusFilter === "pending"
              ? "Create a task to get started"
              : "Complete some tasks to see them here"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onPress={(t) => {
                setSelectedTask(t);
                setViewMode("detail");
              }}
              onComplete={handleComplete}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={refetch}
        />
      )}

      <SkipReasonModal
        visible={skipModalTask !== null && viewMode === "list"}
        taskTitle={skipModalTask?.title || ""}
        onClose={() => setSkipModalTask(null)}
        onSkip={handleSkipWithReason}
      />
    </View>
  );
}
