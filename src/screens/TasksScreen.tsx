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
import type { Task, User, RootStackParamList } from "../types";
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

type ScreenMode = "list" | "create" | "detail";
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
  } = useTasks({ status: apiStatusFilter });

  const { goals, loading: goalsLoading } = useGoals({ parentOnly: true });

  // Get current date for time-aware filtering
  const currentDate = getCurrentDate();

  // Filter and sort tasks based on view mode
  const { sortedTasks, sections } = useMemo(() => {
    console.log(
      "[DEBUG] statusFilter:",
      statusFilter,
      "listViewMode:",
      listViewMode,
    );
    console.log(
      "[DEBUG] tasks from API:",
      tasks.length,
      tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        completions_today: t.completions_today,
        recurrence_rule: t.recurrence_rule,
      })),
    );

    if (listViewMode === "today") {
      // Today view: overdue → timed → todos
      // Generate intraday occurrences for multi-occurrence modes (X times/day, specific times, interval)
      // Use daysAhead=0 to only generate for today
      const withOccurrences = generateRecurringOccurrences(
        tasks,
        currentDate,
        0, // Only today, no future days
      );

      console.log(
        "[DEBUG] withOccurrences:",
        withOccurrences.length,
        withOccurrences.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
        })),
      );

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
        };
      } else if (statusFilter === "completed") {
        // Show only completed virtual occurrences for today
        let completedTasks = filterTasksForToday(withOccurrences, currentDate);
        console.log(
          "[DEBUG] after filterTasksForToday:",
          completedTasks.length,
          completedTasks.map((t) => ({ id: t.id, status: t.status })),
        );
        completedTasks = completedTasks.filter((t) => t.status === "completed");
        console.log("[DEBUG] after status filter:", completedTasks.length);
        return {
          sortedTasks: completedTasks,
          sections: null,
        };
      }
      // For "all", show all virtual occurrences for today
      return {
        sortedTasks: filterTasksForToday(withOccurrences, currentDate),
        sections: null,
      };
    } else {
      // Upcoming view: group by date
      let upcomingTasks: Task[] = [];

      if (statusFilter === "pending") {
        // For recurring tasks, we need to generate future occurrences FIRST,
        // then filter for upcoming. Otherwise today's recurring tasks get filtered out
        // before we can generate their future occurrences.
        if (!condenseRecurring) {
          // Generate future occurrences for recurring tasks (includes originals)
          const withOccurrences = generateRecurringOccurrences(
            tasks,
            currentDate,
            14, // Show 14 days ahead
          );
          // Now filter to only show future dates (not today)
          upcomingTasks = filterTasksForUpcoming(withOccurrences, currentDate);
        } else {
          // Condense mode: filter first, then condense
          upcomingTasks = filterTasksForUpcoming(tasks, currentDate);
          upcomingTasks = condenseRecurringTasks(upcomingTasks);
        }
      } else {
        // For completed/all, still only show future tasks
        upcomingTasks = tasks.filter((t) => {
          if (!t.scheduled_at) return false;
          const todayEnd = new Date(currentDate);
          todayEnd.setHours(23, 59, 59, 999);
          return parseAsUtc(t.scheduled_at) > todayEnd;
        });
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
        scheduling_mode:
          taskForm.isRecurring && taskForm.scheduledTime
            ? taskForm.schedulingMode
            : undefined,
      });
      taskForm.resetForm();
      setScreenMode("list");
    } catch {
      // Error handled in hook
    }
  }, [taskForm, createTask]);

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
            // Parse the date and add the time from scheduled_at
            const occDate = new Date(task.virtualOccurrenceDate);
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
            const occDate = new Date(skipModalTask.virtualOccurrenceDate);
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
        if (selectedTask?.id === skipModalTask.id) {
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
          <Text style={styles.summaryCount}>{pendingCount}</Text>
          <Text style={styles.summaryLabel}>pending</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryCount}>{completedCount}</Text>
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
