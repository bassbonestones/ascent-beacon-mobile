import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Task, User, RootStackParamList, SchedulingMode } from "../types";
import { useTasks } from "../hooks/useTasks";
import { useGoals } from "../hooks/useGoals";
import { useTaskForm } from "../hooks/useTaskForm";
import { useTime } from "../context/TimeContext";
import { styles } from "./styles/tasksScreenStyles";
import {
  TaskCard,
  TaskDetailView,
  CreateTaskForm,
  SkipReasonModal,
  OverdueActionModal,
} from "../components/tasks";
import { showAlert, showConfirm } from "../utils/alert";
import {
  sortTasksForTodayView,
  filterTasksForToday,
  filterTasksForUpcoming,
  isTaskOverdue,
  condenseRecurringTasks,
  groupTasksByDate,
  formatDateHeader,
  generateRecurringOccurrences,
  parseAsUtc,
} from "../utils/taskSorting";

interface TasksScreenProps {
  user: User;
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

type ScreenMode = "list" | "create" | "detail" | "edit";
type ListViewMode = "today" | "upcoming";
type StatusFilter = "all" | "pending" | "completed";

export default function TasksScreen({
  user,
  navigation,
}: TasksScreenProps): React.ReactElement {
  const { getCurrentDate } = useTime();
  const [screenMode, setScreenMode] = useState<ScreenMode>("list");
  const [listViewMode, setListViewMode] = useState<ListViewMode>("today");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [skipModalTask, setSkipModalTask] = useState<Task | null>(null);
  const [overdueModalTask, setOverdueModalTask] = useState<Task | null>(null);
  const [condenseRecurring, setCondenseRecurring] = useState(false);

  // Form state (extracted to hook)
  const taskForm = useTaskForm();

  // In Today view, fetch ALL tasks so we can generate virtual occurrences
  // and then filter by status on the frontend. This allows recurring tasks
  // with completions_today > 0 to show completed occurrences.
  // In Upcoming view, use the status filter as before.
  const apiStatusFilter =
    listViewMode === "today"
      ? undefined // Fetch all, filter on frontend
      : statusFilter === "all"
        ? undefined
        : statusFilter;

  // Include completed tasks when:
  // - Today view (to show in "Completed" filter)
  // - Upcoming view with "all" or "completed" filter
  const apiIncludeCompleted =
    listViewMode === "today" ||
    statusFilter === "all" ||
    statusFilter === "completed";

  const {
    tasks,
    loading,
    pendingCount,
    completedCount,
    refetch,
    createTask,
    updateTask,
    completeTask,
    skipTask,
    reopenTask,
    deleteTask,
  } = useTasks({
    status: apiStatusFilter,
    includeCompleted: apiIncludeCompleted,
  });

  const { goals, loading: goalsLoading } = useGoals({ parentOnly: true });

  // Get current date for time-aware filtering
  const currentDate = getCurrentDate();

  // Filter and sort tasks based on view mode
  const { sortedTasks, sections, viewPendingCount, viewCompletedCount } =
    useMemo(() => {
      if (listViewMode === "today") {
        // Today view: overdue → timed → todos
        // Generate intraday occurrences for multi-occurrence modes (X times/day, specific times, interval)
        // Use daysAhead=0 to only generate for today
        const withOccurrences = generateRecurringOccurrences(
          tasks,
          currentDate,
          0, // Only today, no future days
        );

        // Get today's LOCAL date as YYYY-MM-DD string for comparison
        const todayDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;

        // Helper to check if task is "done" for Today view purposes
        // Recurring tasks stay status="pending" but have completed_for_today=true
        const isDoneForToday = (t: Task): boolean => {
          return (
            t.status === "completed" ||
            (t.is_recurring && t.completed_for_today === true)
          );
        };

        // Calculate Today view counts
        const todayPending = filterTasksForToday(
          withOccurrences,
          currentDate,
        ).filter(
          (t) => t.status === "pending" && !t.completed_for_today,
        ).length;
        const todayCompleted = withOccurrences.filter((t) => {
          if (!isDoneForToday(t)) return false;
          const completionTimestamp = t.completed_at || t.updated_at;
          if (completionTimestamp) {
            const completedDate = parseAsUtc(completionTimestamp);
            const completedDateStr = `${completedDate.getFullYear()}-${String(completedDate.getMonth() + 1).padStart(2, "0")}-${String(completedDate.getDate()).padStart(2, "0")}`;
            if (completedDateStr === todayDateStr) return true;
          }
          if (t.scheduled_at) {
            const scheduledDate = parseAsUtc(t.scheduled_at);
            const scheduledDateStr = `${scheduledDate.getFullYear()}-${String(scheduledDate.getMonth() + 1).padStart(2, "0")}-${String(scheduledDate.getDate()).padStart(2, "0")}`;
            if (scheduledDateStr === todayDateStr) return true;
          }
          return false;
        }).length;

        if (statusFilter === "pending") {
          let todayTasks = filterTasksForToday(withOccurrences, currentDate);
          // Only show pending virtual occurrences
          todayTasks = todayTasks.filter((t) => t.status === "pending");
          if (condenseRecurring) {
            todayTasks = condenseRecurringTasks(todayTasks);
          }
          return {
            sortedTasks: sortTasksForTodayView(todayTasks, currentDate),
            sections: null,
            viewPendingCount: todayPending,
            viewCompletedCount: todayCompleted,
          };
        } else if (statusFilter === "completed") {
          // Show completed tasks that are relevant to today
          // Includes both status="completed" and recurring tasks with completed_for_today

          const completedTasks = withOccurrences.filter((t) => {
            // Must be done for today (either completed status or recurring with completed_for_today)
            if (!isDoneForToday(t)) return false;

            // Recurring tasks with completed_for_today: always show in Today completed
            if (t.is_recurring && t.completed_for_today) {
              return true;
            }

            // Check if completed today (use completed_at or fall back to updated_at)
            // Compare LOCAL dates (not UTC) since user cares about their local day
            const completionTimestamp = t.completed_at || t.updated_at;
            if (completionTimestamp) {
              const completedDate = parseAsUtc(completionTimestamp);
              // Get LOCAL date string from the completion timestamp
              const completedDateStr = `${completedDate.getFullYear()}-${String(completedDate.getMonth() + 1).padStart(2, "0")}-${String(completedDate.getDate()).padStart(2, "0")}`;
              if (completedDateStr === todayDateStr) {
                return true;
              }
            }

            // Also include if scheduled for today (LOCAL date)
            if (t.scheduled_at) {
              const scheduledDate = parseAsUtc(t.scheduled_at);
              const scheduledDateStr = `${scheduledDate.getFullYear()}-${String(scheduledDate.getMonth() + 1).padStart(2, "0")}-${String(scheduledDate.getDate()).padStart(2, "0")}`;
              if (scheduledDateStr === todayDateStr) {
                return true;
              }
            }

            // Fallback: include if no timestamps but is completed
            return !completionTimestamp && !t.scheduled_at;
          });

          return {
            sortedTasks: completedTasks,
            sections: null,
            viewPendingCount: todayPending,
            viewCompletedCount: todayCompleted,
          };
        }
        // For "all", show all virtual occurrences for today
        return {
          sortedTasks: filterTasksForToday(withOccurrences, currentDate),
          sections: null,
          viewPendingCount: todayPending,
          viewCompletedCount: todayCompleted,
        };
      } else {
        // Upcoming view: group by date
        let upcomingTasks: Task[] = [];

        // Calculate counts for Upcoming view (future dates only)

        // Generate occurrences for counting (always need this for accurate counts)
        const allWithOccurrences = generateRecurringOccurrences(
          tasks,
          currentDate,
          14,
        );
        const allUpcoming = filterTasksForUpcoming(
          allWithOccurrences,
          currentDate,
        );
        const upcomingPending = allUpcoming.filter(
          (t) => t.status === "pending",
        ).length;
        const upcomingCompleted = allUpcoming.filter(
          (t) => t.status === "completed",
        ).length;

        if (statusFilter === "pending") {
          // For recurring tasks, we need to generate future occurrences FIRST,
          // then filter for upcoming. Otherwise today's recurring tasks get filtered out
          // before we can generate their future occurrences.
          if (!condenseRecurring) {
            // Now filter to only show future dates (not today) AND pending status
            upcomingTasks = allUpcoming.filter((t) => t.status === "pending");
          } else {
            // Condense mode: filter first, then condense
            upcomingTasks = filterTasksForUpcoming(tasks, currentDate).filter(
              (t) => t.status === "pending",
            );
            upcomingTasks = condenseRecurringTasks(upcomingTasks);
          }
        } else {
          // For completed/all status in Upcoming view:
          // Use allUpcoming which includes virtual recurring occurrences
          if (statusFilter === "completed") {
            // Show completed tasks scheduled for future dates
            upcomingTasks = allUpcoming.filter((t) => t.status === "completed");
          } else {
            // "all" - show all future tasks (pending + completed)
            upcomingTasks = allUpcoming;
          }
        }

        const grouped = groupTasksByDate(upcomingTasks);

        // Convert to SectionList format, sorted by date
        const dateKeys = Array.from(grouped.keys())
          .filter((k) => k !== "no-date")
          .sort();

        const sectionData = dateKeys.map((dateKey) => ({
          title: formatDateHeader(dateKey, currentDate),
          dateKey,
          data: grouped.get(dateKey) || [],
        }));

        return {
          sortedTasks: upcomingTasks,
          sections: sectionData,
          viewPendingCount: upcomingPending,
          viewCompletedCount: upcomingCompleted,
        };
      }
    }, [tasks, statusFilter, condenseRecurring, listViewMode, currentDate]);

  // Count overdue tasks
  const overdueCount = useMemo(() => {
    return tasks.filter((t) => isTaskOverdue(t, currentDate)).length;
  }, [tasks, currentDate]);

  const handleCreate = useCallback(async () => {
    if (!taskForm.title.trim()) {
      showAlert("Error", "Please enter a task title");
      return;
    }
    try {
      // Determine scheduling_mode:
      // - 'date_only': date is set but no specific time
      // - For recurring with time: use user's choice (floating/fixed)
      // - Otherwise: undefined
      let schedulingMode: SchedulingMode | undefined;
      if (taskForm.scheduledDate && !taskForm.scheduledTime) {
        schedulingMode = "date_only";
      } else if (taskForm.isRecurring && taskForm.scheduledTime) {
        schedulingMode = taskForm.schedulingMode || undefined;
      }

      await createTask({
        goal_id: taskForm.goalId || undefined,
        title: taskForm.title.trim(),
        description: taskForm.description.trim() || undefined,
        duration_minutes: taskForm.isLightning
          ? 0
          : parseInt(taskForm.duration, 10) || 30,
        scheduled_at: taskForm.dateTimeToIso(
          taskForm.scheduledDate,
          taskForm.scheduledTime,
        ),
        is_recurring: taskForm.isRecurring,
        recurrence_rule: taskForm.isRecurring
          ? taskForm.recurrenceRule || undefined
          : undefined,
        scheduling_mode: schedulingMode,
      });
      taskForm.resetForm();
      setScreenMode("list");
    } catch {
      // Error handled in hook
    }
  }, [taskForm, createTask]);

  const handleEdit = useCallback(
    (task: Task) => {
      // For virtual occurrences, we want to edit the original task
      const taskToEdit = task.originalTaskId
        ? tasks.find((t) => t.id === task.originalTaskId) || task
        : task;
      setEditingTask(taskToEdit);
      taskForm.populateForm(taskToEdit);
      setScreenMode("edit");
    },
    [tasks, taskForm],
  );

  const handleSaveEdit = useCallback(async () => {
    if (!editingTask) return;
    if (!taskForm.title.trim()) {
      showAlert("Error", "Please enter a task title");
      return;
    }
    try {
      // Determine scheduling_mode (same logic as create)
      let schedulingMode: SchedulingMode | undefined;
      if (taskForm.scheduledDate && !taskForm.scheduledTime) {
        schedulingMode = "date_only";
      } else if (taskForm.isRecurring && taskForm.scheduledTime) {
        schedulingMode = taskForm.schedulingMode || undefined;
      }

      await updateTask(editingTask.id, {
        goal_id: taskForm.goalId || undefined,
        title: taskForm.title.trim(),
        description: taskForm.description.trim() || undefined,
        duration_minutes: taskForm.isLightning
          ? 0
          : parseInt(taskForm.duration, 10) || 30,
        scheduled_at: taskForm.dateTimeToIso(
          taskForm.scheduledDate,
          taskForm.scheduledTime,
        ),
        is_recurring: taskForm.isRecurring,
        recurrence_rule: taskForm.isRecurring
          ? taskForm.recurrenceRule || undefined
          : undefined,
        scheduling_mode: schedulingMode,
      });
      taskForm.resetForm();
      setEditingTask(null);
      setSelectedTask(null);
      setScreenMode("list");
    } catch {
      // Error handled in hook
    }
  }, [editingTask, taskForm, updateTask]);

  const handleComplete = useCallback(
    async (task: Task) => {
      try {
        // Get the actual task ID (use originalTaskId for virtual occurrences)
        const taskId = task.originalTaskId || task.id;

        // For recurring tasks, pass the current occurrence date (or travel date)
        let scheduledFor: string | undefined;
        if (task.is_recurring) {
          // For virtual occurrences, use the virtual occurrence date
          if (task.isVirtualOccurrence && task.virtualOccurrenceDate) {
            // Parse the date string as LOCAL date (not UTC)
            // new Date("2026-04-05") creates UTC midnight which can be wrong day in local TZ
            const [year, month, day] = task.virtualOccurrenceDate
              .split("-")
              .map(Number);
            const occDate = new Date(year, month - 1, day);
            if (task.scheduled_at) {
              const time = parseAsUtc(task.scheduled_at);
              occDate.setHours(
                time.getHours(),
                time.getMinutes(),
                time.getSeconds(),
                0,
              );
            }
            scheduledFor = occDate.toISOString();
          } else if (task.scheduled_at) {
            // Use current date (real or travel) with the task's scheduled time
            const originalTime = parseAsUtc(task.scheduled_at);
            const today = getCurrentDate();
            today.setHours(
              originalTime.getHours(),
              originalTime.getMinutes(),
              originalTime.getSeconds(),
              0,
            );
            scheduledFor = today.toISOString();
          } else {
            // No scheduled time, use current date
            scheduledFor = getCurrentDate().toISOString();
          }
        }
        await completeTask(taskId, scheduledFor);
        // Close detail view after completing
        setSelectedTask(null);
        setScreenMode("list");
      } catch {
        // Error handled in hook
      }
    },
    [completeTask, getCurrentDate],
  );

  const handleSkipWithReason = useCallback(
    async (reason?: string) => {
      if (!skipModalTask) return;
      try {
        // Get the actual task ID (use originalTaskId for virtual occurrences)
        const taskId = skipModalTask.originalTaskId || skipModalTask.id;

        // For recurring tasks, pass the current occurrence date (or travel date)
        let scheduledFor: string | undefined;
        if (skipModalTask.is_recurring) {
          // For virtual occurrences, use the virtual occurrence date
          if (
            skipModalTask.isVirtualOccurrence &&
            skipModalTask.virtualOccurrenceDate
          ) {
            // Parse the date string as LOCAL date (not UTC)
            const [year, month, day] = skipModalTask.virtualOccurrenceDate
              .split("-")
              .map(Number);
            const occDate = new Date(year, month - 1, day);
            if (skipModalTask.scheduled_at) {
              const time = parseAsUtc(skipModalTask.scheduled_at);
              occDate.setHours(
                time.getHours(),
                time.getMinutes(),
                time.getSeconds(),
                0,
              );
            }
            scheduledFor = occDate.toISOString();
          } else if (skipModalTask.scheduled_at) {
            const originalTime = parseAsUtc(skipModalTask.scheduled_at);
            const today = getCurrentDate();
            today.setHours(
              originalTime.getHours(),
              originalTime.getMinutes(),
              originalTime.getSeconds(),
              0,
            );
            scheduledFor = today.toISOString();
          } else {
            scheduledFor = getCurrentDate().toISOString();
          }
        }
        await skipTask(taskId, reason, scheduledFor);
        setSkipModalTask(null);
        // Close detail view after skipping (check both real and virtual IDs)
        if (
          selectedTask?.id === skipModalTask.id ||
          selectedTask?.originalTaskId === skipModalTask.originalTaskId
        ) {
          setSelectedTask(null);
          setScreenMode("list");
        }
      } catch {
        // Error handled in hook
      }
    },
    [skipModalTask, skipTask, selectedTask, getCurrentDate],
  );

  const handleSkip = useCallback(async (task: Task) => {
    // For recurring tasks or any task, show the skip modal
    setSkipModalTask(task);
  }, []);

  const handleReopen = useCallback(
    async (task: Task) => {
      try {
        // Use originalTaskId for virtual occurrences
        const taskId = task.originalTaskId || task.id;

        // For recurring tasks, pass the scheduled_for to identify which completion to undo
        let scheduledFor: string | undefined;
        if (task.is_recurring) {
          // For virtual occurrences, use the virtual occurrence date + scheduled time
          if (task.isVirtualOccurrence && task.virtualOccurrenceDate) {
            const [year, month, day] = task.virtualOccurrenceDate
              .split("-")
              .map(Number);
            const occDate = new Date(year, month - 1, day);
            if (task.scheduled_at) {
              const time = parseAsUtc(task.scheduled_at);
              occDate.setHours(
                time.getHours(),
                time.getMinutes(),
                time.getSeconds(),
                0,
              );
            }
            scheduledFor = occDate.toISOString();
          } else if (task.scheduled_at) {
            // Use current date with the task's scheduled time
            const originalTime = parseAsUtc(task.scheduled_at);
            const today = getCurrentDate();
            today.setHours(
              originalTime.getHours(),
              originalTime.getMinutes(),
              originalTime.getSeconds(),
              0,
            );
            scheduledFor = today.toISOString();
          } else {
            scheduledFor = getCurrentDate().toISOString();
          }
        }

        await reopenTask(taskId, scheduledFor);
        // Close detail view after reopening
        setSelectedTask(null);
        setScreenMode("list");
      } catch {
        // Error handled in hook
      }
    },
    [reopenTask, getCurrentDate],
  );

  const handleDelete = useCallback(
    async (task: Task) => {
      if (await showConfirm("Delete Task", `Delete "${task.title}"?`)) {
        try {
          // Use originalTaskId for virtual occurrences, otherwise use task.id
          const taskId = task.originalTaskId || task.id;
          await deleteTask(taskId);
          setSelectedTask(null);
          setScreenMode("list");
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

  if (screenMode === "create") {
    return (
      <CreateTaskForm
        goals={goals}
        goalsLoading={goalsLoading}
        selectedGoalId={taskForm.goalId}
        onGoalSelect={taskForm.setGoalId}
        title={taskForm.title}
        onTitleChange={taskForm.setTitle}
        description={taskForm.description}
        onDescriptionChange={taskForm.setDescription}
        isLightning={taskForm.isLightning}
        onLightningToggle={taskForm.toggleLightning}
        duration={taskForm.duration}
        onDurationChange={taskForm.setDuration}
        isRecurring={taskForm.isRecurring}
        onRecurringToggle={taskForm.toggleRecurring}
        recurrenceRule={taskForm.recurrenceRule}
        schedulingMode={taskForm.schedulingMode}
        scheduledTime={taskForm.scheduledTime}
        onScheduledTimeChange={taskForm.setScheduledTime}
        scheduledDate={taskForm.scheduledDate}
        onScheduledDateChange={taskForm.setScheduledDate}
        onRecurrenceChange={taskForm.handleRecurrenceChange}
        onSubmit={handleCreate}
        onCancel={() => {
          taskForm.resetForm();
          setScreenMode("list");
        }}
      />
    );
  }

  if (screenMode === "edit") {
    return (
      <CreateTaskForm
        goals={goals}
        goalsLoading={goalsLoading}
        selectedGoalId={taskForm.goalId}
        onGoalSelect={taskForm.setGoalId}
        title={taskForm.title}
        onTitleChange={taskForm.setTitle}
        description={taskForm.description}
        onDescriptionChange={taskForm.setDescription}
        isLightning={taskForm.isLightning}
        onLightningToggle={taskForm.toggleLightning}
        duration={taskForm.duration}
        onDurationChange={taskForm.setDuration}
        isRecurring={taskForm.isRecurring}
        onRecurringToggle={taskForm.toggleRecurring}
        recurrenceRule={taskForm.recurrenceRule}
        schedulingMode={taskForm.schedulingMode}
        scheduledTime={taskForm.scheduledTime}
        onScheduledTimeChange={taskForm.setScheduledTime}
        scheduledDate={taskForm.scheduledDate}
        onScheduledDateChange={taskForm.setScheduledDate}
        onRecurrenceChange={taskForm.handleRecurrenceChange}
        onSubmit={handleSaveEdit}
        onCancel={() => {
          taskForm.resetForm();
          setEditingTask(null);
          setScreenMode("list");
        }}
        isEditMode={true}
      />
    );
  }

  if (screenMode === "detail" && selectedTask) {
    return (
      <>
        <TaskDetailView
          task={selectedTask}
          onBack={() => {
            setSelectedTask(null);
            setScreenMode("list");
          }}
          onComplete={handleComplete}
          onSkip={handleSkip}
          onReopen={handleReopen}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onViewTracking={(task) => {
            navigation.navigate("HabitMetrics", {
              taskId: task.id,
              taskTitle: task.title,
            });
          }}
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
          onPress={() => setScreenMode("create")}
          accessibilityLabel="Create new task"
          accessibilityRole="button"
        >
          <Text style={styles.addButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryCount}>{viewPendingCount}</Text>
          <Text style={styles.summaryLabel}>pending</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryCount}>{viewCompletedCount}</Text>
          <Text style={styles.summaryLabel}>completed</Text>
        </View>
        {overdueCount > 0 && (
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryCount, styles.overdueCount]}>
              {overdueCount}
            </Text>
            <Text style={styles.summaryLabel}>overdue</Text>
          </View>
        )}
      </View>

      <View style={styles.viewModeRow}>
        {(["today", "upcoming"] as ListViewMode[]).map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[
              styles.viewModeToggle,
              listViewMode === mode && styles.viewModeToggleActive,
            ]}
            onPress={() => setListViewMode(mode)}
            accessibilityLabel={`Show ${mode} tasks`}
          >
            <Text
              style={[
                styles.viewModeToggleText,
                listViewMode === mode && styles.viewModeToggleTextActive,
              ]}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
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

      {statusFilter === "pending" && listViewMode === "today" && (
        <TouchableOpacity
          style={styles.condenseToggle}
          onPress={() => setCondenseRecurring(!condenseRecurring)}
          accessibilityLabel="Condense recurring tasks"
          accessibilityRole="switch"
        >
          <Text style={styles.condenseToggleText}>
            {condenseRecurring ? "☑" : "☐"} Condense recurring
          </Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : sortedTasks.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>
            {listViewMode === "today"
              ? statusFilter === "pending"
                ? "No tasks for today"
                : statusFilter === "completed"
                  ? "No completed tasks today"
                  : "No tasks today"
              : statusFilter === "pending"
                ? "No upcoming tasks"
                : "No tasks scheduled"}
          </Text>
          <Text style={styles.emptyStateText}>
            {listViewMode === "today"
              ? "Create a task to get started"
              : "Schedule tasks with future dates to see them here"}
          </Text>
        </View>
      ) : listViewMode === "upcoming" && sections ? (
        <SectionList
          sections={sections}
          extraData={tasks}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{section.title}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onPress={(t) => {
                setSelectedTask(t);
                setScreenMode("detail");
              }}
              onComplete={handleComplete}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={refetch}
          stickySectionHeadersEnabled={false}
        />
      ) : (
        <FlatList
          data={sortedTasks}
          extraData={tasks}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onPress={(t) => {
                if (isTaskOverdue(t, currentDate)) {
                  setOverdueModalTask(t);
                } else {
                  setSelectedTask(t);
                  setScreenMode("detail");
                }
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
        visible={skipModalTask !== null && screenMode === "list"}
        taskTitle={skipModalTask?.title || ""}
        onClose={() => setSkipModalTask(null)}
        onSkip={handleSkipWithReason}
      />

      <OverdueActionModal
        visible={overdueModalTask !== null}
        task={overdueModalTask}
        onClose={() => setOverdueModalTask(null)}
        onSkip={(t) => {
          setOverdueModalTask(null);
          setSkipModalTask(t);
        }}
        onReschedule={(t) => {
          setOverdueModalTask(null);
          setSelectedTask(t);
          setScreenMode("detail");
        }}
      />
    </View>
  );
}
