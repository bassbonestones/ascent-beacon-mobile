import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  type ReactElement,
} from "react";
import {
  View,
  Text,
  FlatList,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { combineTopInset } from "../utils/combineTopInset";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type {
  Task,
  User,
  RootStackParamList,
  SchedulingMode,
  ReorderItem,
} from "../types";
import { useTasks } from "../hooks/useTasks";
import { useGoals } from "../hooks/useGoals";
import { useTaskForm } from "../hooks/useTaskForm";
import { useOccurrenceOrderRange } from "../hooks/useOccurrenceOrderRange";
import { useTime } from "../context/TimeContext";
import { styles } from "./styles/tasksScreenStyles";
import {
  TaskCard,
  TaskDetailView,
  CreateTaskForm,
  OverdueActionModal,
  DraggableTaskList,
  TaskFlowModals,
} from "../components/tasks";
import { buildOccurrenceParams } from "../hooks/taskOccurrenceParams";
import { useTaskDependencyActions } from "../hooks/useTaskDependencyActions";
import { isSkipTaskPreviewResponse, rowsForSkipCascadeModal } from "../types";
import { showAlert, showConfirm } from "../utils/alert";
import {
  filterTasksForToday,
  filterTasksForUpcoming,
  isTaskOverdue,
  condenseRecurringTasks,
  groupTasksByDate,
  formatDateHeader,
  generateRecurringOccurrences,
  withOccurrenceDependencySummary,
  parseAsUtc,
  toLocalDateString,
  getTaskScheduledDateStr,
  isTaskScheduled,
} from "../utils/taskSorting";
import api from "../services/api";

interface TasksScreenProps {
  user: User;
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

// Blur active element to avoid aria-hidden focus warning on web
const blurActiveElement = (): void => {
  if (Platform.OS === "web" && typeof document !== "undefined") {
    (document.activeElement as HTMLElement | null)?.blur?.();
  }
};

type ScreenMode = "list" | "create" | "detail" | "edit";
type ListViewMode = "today" | "upcoming" | "anytime";
type StatusFilter = "all" | "pending" | "completed" | "skipped";

// Subtitle marker for separating Scheduled vs To-Do tasks within a day
interface SubtitleMarker {
  _type: "subtitle";
  subtitle: "scheduled" | "todo";
  key: string;
}

// Union type for section items - either a Task or a SubtitleMarker
type SectionItem = Task | SubtitleMarker;

// Type guard to check if an item is a subtitle marker
const isSubtitleMarker = (item: SectionItem): item is SubtitleMarker => {
  return (item as SubtitleMarker)._type === "subtitle";
};

// Helper to check if a task is timed (has scheduled_at)
const isTimedTask = (task: Task): boolean => {
  return !!task.scheduled_at;
};

// Helper to create section data with subtitle markers
const createSectionDataWithSubtitles = (
  tasks: Task[],
  dateKey?: string,
): SectionItem[] => {
  const timedTasks = tasks.filter(isTimedTask);
  const untimedTasks = tasks.filter((t) => !isTimedTask(t));

  const items: SectionItem[] = [];
  const suffix = dateKey ? `-${dateKey}` : "";

  if (timedTasks.length > 0) {
    items.push({
      _type: "subtitle",
      subtitle: "scheduled",
      key: `subtitle-scheduled${suffix}`,
    });
    items.push(...timedTasks);
  }

  if (untimedTasks.length > 0) {
    items.push({
      _type: "subtitle",
      subtitle: "todo",
      key: `subtitle-todo${suffix}`,
    });
    items.push(...untimedTasks);
  }

  return items;
};

export default function TasksScreen({
  user,
  navigation,
}: TasksScreenProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const listTopPad = combineTopInset(insets.top);
  const { getCurrentDate } = useTime();
  const [screenMode, setScreenMode] = useState<ScreenMode>("list");
  const [listViewMode, setListViewMode] = useState<ListViewMode>("today");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [skipModalTask, setSkipModalTask] = useState<Task | null>(null);
  const [overdueModalTask, setOverdueModalTask] = useState<Task | null>(null);
  const [condenseRecurring, setCondenseRecurring] = useState(false);
  // Phase 4i: Track which tasks have prerequisites for badge display
  const [tasksWithPrerequisites, setTasksWithPrerequisites] = useState<
    Set<string>
  >(new Set());

  // Pagination state for Upcoming view
  const INITIAL_DAYS_AHEAD = 14;
  const LOAD_MORE_DAYS = 7;
  const MAX_DAYS_AHEAD = 365; // Used for completed/skipped which load all
  const [daysAhead, setDaysAhead] = useState(INITIAL_DAYS_AHEAD);
  const [loadingMore, setLoadingMore] = useState(false);
  // Track if current load is a "load more" (not initial/refresh) to avoid scroll reset
  const isLoadingMoreRef = useRef(false);

  // Reset daysAhead when view mode or filter changes
  useEffect(() => {
    setDaysAhead(INITIAL_DAYS_AHEAD);
  }, [listViewMode, statusFilter]);

  // Form state (extracted to hook)
  const taskForm = useTaskForm();

  // In Today view, fetch ALL tasks so we can generate virtual occurrences
  // and then filter by status on the frontend. This allows recurring tasks
  // with completions_today > 0 to show completed occurrences.
  // In Upcoming view, we also need to fetch all for "completed" and "skipped"
  // filters because recurring tasks have status="pending" but their occurrences
  // can be completed/skipped (stored in completions_by_date / skips_by_date).
  const apiStatusFilter =
    listViewMode === "today"
      ? undefined // Fetch all, filter on frontend
      : statusFilter === "all" ||
          statusFilter === "completed" ||
          statusFilter === "skipped"
        ? undefined // Fetch all, filter on frontend after generating virtual occurrences
        : statusFilter;

  // Include completed tasks when:
  // - Today view (to show in "Completed" filter)
  // - Upcoming view with "all", "completed", or "skipped" filter
  // NOTE: "skipped" needs this too to get skips_by_date from the API
  const apiIncludeCompleted =
    listViewMode === "today" ||
    statusFilter === "all" ||
    statusFilter === "completed" ||
    statusFilter === "skipped";

  // Calculate effective days ahead for API call:
  // - Today view: use default (doesn't affect Today filtering)
  // - Upcoming + completed/skipped: load all (365 days) since these are finite
  // - Upcoming + pending/all: use paginated daysAhead
  const effectiveDaysAhead =
    listViewMode === "today"
      ? INITIAL_DAYS_AHEAD
      : statusFilter === "completed" || statusFilter === "skipped"
        ? MAX_DAYS_AHEAD
        : daysAhead;

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
    reorderTask,
  } = useTasks({
    status: apiStatusFilter,
    includeCompleted: apiIncludeCompleted,
    daysAhead: effectiveDaysAhead,
    clientToday: getCurrentDate(), // Support time travel
  });

  const onDependencyFlowFinished = useCallback(() => {
    setSelectedTask(null);
    setScreenMode("list");
  }, []);

  const {
    requestComplete,
    processSkipAfterReason,
    hardModal,
    softModal,
    overrideModal,
    skipCascade,
    successModal,
    dismissHardModal,
    onHardCompletePrereqs,
    onHardRequestOverride,
    dismissSoftModal,
    onSoftCompleteAnyway,
    onSoftCompletePrereqs,
    dismissOverrideModal,
    onOverrideConfirm,
    setOverrideReason,
    dismissSkipCascade,
    onSkipKeepPending,
    onSkipCascadeConfirm,
    dismissSuccessModal,
  } = useTaskDependencyActions({
    tasksWithPrerequisites,
    completeTask,
    skipTask,
    fetchTasks: refetch,
    getCurrentDate,
    onFlowFinished: onDependencyFlowFinished,
  });

  const { goals, loading: goalsLoading } = useGoals({ parentOnly: true });

  // Get current date for time-aware filtering
  const currentDate = getCurrentDate();

  // Get today's date string for occurrence ordering
  const todayDateStr = toLocalDateString(currentDate);

  // Calculate start date for Today view (7 days back for overdue tasks)
  // This matches the daysBack used in generateRecurringOccurrences
  const todayStartDate = useMemo(() => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    return toLocalDateString(d);
  }, [currentDate]);

  // Calculate end date for Upcoming range (effectiveDaysAhead from today)
  const upcomingEndDate = useMemo(() => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + effectiveDaysAhead);
    return toLocalDateString(d);
  }, [currentDate, effectiveDaysAhead]);

  // Fetch occurrence order for Today view (date range: 7 days back to today)
  // This supports per-day ordering for overdue tasks
  const {
    applyOrderForDate: applyTodayOrderForDate,
    refetch: refetchTodayOrder,
  } = useOccurrenceOrderRange({
    startDate: todayStartDate,
    endDate: todayDateStr,
    enabled: listViewMode === "today",
  });

  // Fetch occurrence order for Upcoming view (date range: today to future)
  const {
    applyOrderForDate: applyUpcomingOrderForDate,
    refetch: refetchRangeOrder,
  } = useOccurrenceOrderRange({
    startDate: todayDateStr,
    endDate: upcomingEndDate,
    enabled: listViewMode === "upcoming",
  });

  // Refetch occurrence order when screen gains focus (e.g., returning from reorder screen)
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (listViewMode === "today") {
        refetchTodayOrder();
      } else if (listViewMode === "upcoming") {
        refetchRangeOrder();
      }
    });
    return unsubscribe;
  }, [navigation, listViewMode, refetchTodayOrder, refetchRangeOrder]);

  // Phase 4i: Fetch dependency rules to determine which tasks have prerequisites
  // (lock icon). Must refresh when the task list changes and when returning to this
  // screen so edits that add prerequisites are reflected (length-only deps miss that).
  const refreshTasksWithPrerequisites = useCallback(async () => {
    if (tasks.length === 0) {
      setTasksWithPrerequisites(new Set());
      return;
    }
    try {
      const response = await api.getDependencyRules({});
      const taskIdsWithPrereqs = new Set<string>(
        response.rules.map((rule) => rule.downstream_task_id),
      );
      setTasksWithPrerequisites(taskIdsWithPrereqs);
    } catch (error) {
      console.warn("Failed to fetch dependency rules:", error);
      setTasksWithPrerequisites(new Set());
    }
  }, [tasks]);

  useEffect(() => {
    void refreshTasksWithPrerequisites();
  }, [refreshTasksWithPrerequisites]);

  useEffect(() => {
    const unsub = navigation.addListener("focus", () => {
      void refreshTasksWithPrerequisites();
    });
    return unsub;
  }, [navigation, refreshTasksWithPrerequisites]);

  // Phase 4g: Auto-skip missed habitual task occurrences on mount/tasks change
  // This runs when tasks are loaded and silently skips overdue habitual occurrences
  const autoSkippedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (loading || tasks.length === 0) return;

    const todayDateStr = toLocalDateString(currentDate);

    // Find overdue habitual task occurrences that haven't been skipped yet
    const overdueHabitualOccurrences = tasks.filter((task) => {
      // Only process habitual recurring tasks
      if (!task.is_recurring || task.recurrence_behavior !== "habitual") {
        return false;
      }
      // Check if this task/occurrence has already been auto-skipped this session
      const skipKey = task.isVirtualOccurrence
        ? `${task.originalTaskId}-${task.virtualOccurrenceDate}`
        : task.id;
      if (autoSkippedRef.current.has(skipKey)) {
        return false;
      }
      // Get the scheduled date for this occurrence
      const taskDateStr =
        task.virtualOccurrenceDate || getTaskScheduledDateStr(task);
      if (!taskDateStr) return false;
      // Check if it's overdue (before today) and not already completed/skipped for that date
      if (taskDateStr >= todayDateStr) return false;
      // Check if already completed or skipped for this date
      if (task.completions_by_date?.[taskDateStr]?.length) return false;
      if (task.skips_by_date?.[taskDateStr]?.length) return false;
      return true;
    });

    // Auto-skip each overdue habitual occurrence silently
    overdueHabitualOccurrences.forEach(async (task) => {
      const taskId = task.originalTaskId || task.id;
      const taskDateStr =
        task.virtualOccurrenceDate || getTaskScheduledDateStr(task);
      if (!taskDateStr) return;
      const skipKey = task.isVirtualOccurrence
        ? `${task.originalTaskId}-${task.virtualOccurrenceDate}`
        : task.id;
      // Mark as auto-skipped to avoid duplicate processing
      autoSkippedRef.current.add(skipKey);
      try {
        // Create a datetime for the scheduled_for parameter
        const [year, month, day] = taskDateStr.split("-").map(Number);
        const scheduledFor = new Date(
          year,
          month - 1,
          day,
          0,
          0,
          0,
        ).toISOString();
        const skipRes = await skipTask(
          taskId,
          "Auto-skipped (missed)",
          scheduledFor,
          taskDateStr,
        );
        if (isSkipTaskPreviewResponse(skipRes)) {
          autoSkippedRef.current.delete(skipKey);
        }
      } catch {
        // Silently fail - don't show error to user
      }
    });
  }, [tasks, loading, currentDate, skipTask]);

  // Filter and sort tasks based on view mode
  const { sortedTasks, sections, viewPendingCount, viewCompletedCount } =
    useMemo(() => {
      if (listViewMode === "today") {
        // Today view: overdue → timed → todos
        // Get today's LOCAL date as YYYY-MM-DD string for comparison
        const todayDateStr = toLocalDateString(currentDate);
        // Generate intraday occurrences for multi-occurrence modes (X times/day, specific times, interval)
        // Use daysAhead=0 for today only, daysBack=7 for overdue detection
        const withOccurrences = generateRecurringOccurrences(
          tasks,
          currentDate,
          0, // Only today, no future days
          7, // Look back 7 days for overdue occurrences
        ).map((t) => withOccurrenceDependencySummary(t, todayDateStr));

        // Helper to check if task is "completed" for Today view purposes
        // Recurring tasks stay status="pending" but have completed_for_today=true
        // This does NOT include skipped tasks
        const isCompletedForToday = (t: Task): boolean => {
          return (
            t.status === "completed" ||
            (t.is_recurring && t.completed_for_today === true)
          );
        };

        // Helper to check if task is "skipped" for Today view purposes
        const isSkippedForToday = (t: Task): boolean => {
          return (
            t.status === "skipped" ||
            (t.is_recurring && t.skipped_for_today === true)
          );
        };

        // Calculate Today view counts
        const todayPending = filterTasksForToday(
          withOccurrences,
          currentDate,
        ).filter(
          (t) =>
            t.status === "pending" &&
            !t.completed_for_today &&
            !t.skipped_for_today,
        ).length;
        const todayCompleted = withOccurrences.filter((t) => {
          if (!isCompletedForToday(t)) return false;
          const completionTimestamp = t.completed_at || t.updated_at;
          if (completionTimestamp) {
            const completedDate = parseAsUtc(completionTimestamp);
            const completedDateStr = `${completedDate.getFullYear()}-${String(completedDate.getMonth() + 1).padStart(2, "0")}-${String(completedDate.getDate()).padStart(2, "0")}`;
            if (completedDateStr === todayDateStr) return true;
          }
          // Check if scheduled for today using helper
          const scheduledDateStr = getTaskScheduledDateStr(t);
          if (scheduledDateStr === todayDateStr) return true;
          return false;
        }).length;

        if (statusFilter === "pending") {
          let todayTasks = filterTasksForToday(withOccurrences, currentDate);
          // Only show pending virtual occurrences (exclude completed and skipped)
          todayTasks = todayTasks.filter(
            (t) =>
              t.status === "pending" &&
              !t.completed_for_today &&
              !t.skipped_for_today,
          );
          if (condenseRecurring) {
            todayTasks = condenseRecurringTasks(todayTasks);
          }

          // Group tasks by date (like Upcoming view)
          // This allows overdue tasks to be grouped by their original date
          const grouped = groupTasksByDate(todayTasks);

          // Get unscheduled tasks (no-date) - these go into today's section
          const noDateTasks = grouped.get("no-date") || [];

          // Get dated sections, sorted by date (oldest first for overdue)
          const dateKeys = Array.from(grouped.keys())
            .filter((k) => k !== "no-date")
            .sort();

          // Build sections for each date
          const sectionData = dateKeys.map((dateKey) => {
            let sectionTasks = grouped.get(dateKey) || [];

            // If this is today's section, add unscheduled tasks
            if (dateKey === todayDateStr && noDateTasks.length > 0) {
              // Unscheduled tasks go after dated tasks (they're untimed)
              sectionTasks = [...sectionTasks, ...noDateTasks];
            }

            // Extract untimed tasks for reordering
            const untimedIndices: number[] = [];
            const untimedTasks: Task[] = [];
            sectionTasks.forEach((task, idx) => {
              // Untimed = date-only scheduled OR unscheduled (no scheduled_at)
              const isUntimed =
                task.scheduling_mode !== "anytime" && !task.scheduled_at;
              if (isUntimed) {
                untimedIndices.push(idx);
                untimedTasks.push(task);
              }
            });

            if (untimedTasks.length > 0) {
              // Apply order for this specific date
              const reorderedUntimed = applyTodayOrderForDate(
                untimedTasks,
                dateKey,
              );

              // Put them back in their positions
              const finalSorted = [...sectionTasks];
              untimedIndices.forEach((originalIdx, i) => {
                finalSorted[originalIdx] = reorderedUntimed[i];
              });
              sectionTasks = finalSorted;
            }

            // Dates before today are overdue
            const isOverdue = dateKey < todayDateStr;

            return {
              title: formatDateHeader(dateKey, currentDate, isOverdue),
              dateKey,
              data: createSectionDataWithSubtitles(sectionTasks, dateKey),
            };
          });

          // If there are no dated sections but there are unscheduled tasks,
          // create a today section just for them
          if (sectionData.length === 0 && noDateTasks.length > 0) {
            // Apply ordering to unscheduled tasks
            const reorderedNoDate = applyTodayOrderForDate(
              noDateTasks,
              todayDateStr,
            );

            sectionData.push({
              title: formatDateHeader(todayDateStr, currentDate, false),
              dateKey: todayDateStr,
              data: createSectionDataWithSubtitles(
                reorderedNoDate,
                todayDateStr,
              ),
            });
          }

          // Flatten all tasks for sortedTasks (used by drag reordering)
          const allSorted = sectionData.flatMap((section) =>
            section.data.filter((item): item is Task => !("_type" in item)),
          );

          return {
            sortedTasks: allSorted,
            sections: sectionData,
            viewPendingCount: todayPending,
            viewCompletedCount: todayCompleted,
          };
        } else if (statusFilter === "completed") {
          // Show completed tasks that are relevant to today
          // Includes both status="completed" and recurring tasks with completed_for_today
          // Does NOT include skipped tasks

          const completedTasks = withOccurrences.filter((t) => {
            // Must be completed for today (NOT skipped)
            if (!isCompletedForToday(t)) return false;

            // API base recurring row when today's occurrence is done (virtual slices
            // use completed_for_today for their occurrence date — do not short-circuit)
            if (
              t.is_recurring &&
              t.completed_for_today &&
              !t.isVirtualOccurrence
            ) {
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

            // Also include if scheduled for today using helper
            const scheduledDateStr = getTaskScheduledDateStr(t);
            if (scheduledDateStr === todayDateStr) {
              return true;
            }

            // Fallback: include if no timestamps and unscheduled
            return !completionTimestamp && !isTaskScheduled(t);
          });

          // Create section for Today view with formatted header
          const todaySection = {
            title: formatDateHeader(todayDateStr, currentDate),
            dateKey: todayDateStr,
            data: createSectionDataWithSubtitles(completedTasks, todayDateStr),
          };

          return {
            sortedTasks: completedTasks,
            sections: [todaySection],
            viewPendingCount: todayPending,
            viewCompletedCount: todayCompleted,
          };
        } else if (statusFilter === "skipped") {
          // Show skipped tasks that are relevant to today
          const skippedTasks = withOccurrences.filter((t) => {
            if (!isSkippedForToday(t)) return false;

            // API base recurring row when today's occurrence is skipped (virtual slices
            // use skipped_for_today per occurrence date — do not short-circuit)
            if (
              t.is_recurring &&
              t.skipped_for_today &&
              !t.isVirtualOccurrence
            ) {
              return true;
            }

            // Single tasks: check if scheduled for today using helper
            const scheduledDateStr = getTaskScheduledDateStr(t);
            if (scheduledDateStr === todayDateStr) {
              return true;
            }

            // Include unscheduled skipped tasks
            return !isTaskScheduled(t);
          });

          // Create section for Today view with formatted header
          const todaySection = {
            title: formatDateHeader(todayDateStr, currentDate),
            dateKey: todayDateStr,
            data: createSectionDataWithSubtitles(skippedTasks, todayDateStr),
          };

          return {
            sortedTasks: skippedTasks,
            sections: [todaySection],
            viewPendingCount: todayPending,
            viewCompletedCount: todayCompleted,
          };
        }
        // For "all", show all virtual occurrences for today
        const allTodayTasks = filterTasksForToday(withOccurrences, currentDate);
        const todaySection = {
          title: formatDateHeader(todayDateStr, currentDate),
          dateKey: todayDateStr,
          data: createSectionDataWithSubtitles(allTodayTasks, todayDateStr),
        };
        return {
          sortedTasks: allTodayTasks,
          sections: [todaySection],
          viewPendingCount: todayPending,
          viewCompletedCount: todayCompleted,
        };
      } else if (listViewMode === "anytime") {
        // Anytime view: show backlog tasks with no schedule
        // Anytime tasks have scheduling_mode === "anytime"

        // Filter to anytime tasks only
        let anytimeTasks = tasks.filter((t) => t.scheduling_mode === "anytime");

        // Count pending anytime tasks
        const anytimePending = anytimeTasks.filter(
          (t) => t.status === "pending",
        ).length;
        const anytimeCompleted = anytimeTasks.filter(
          (t) => t.status === "completed",
        ).length;

        // Apply status filter
        if (statusFilter === "pending") {
          anytimeTasks = anytimeTasks.filter((t) => t.status === "pending");
        } else if (statusFilter === "completed") {
          anytimeTasks = anytimeTasks.filter((t) => t.status === "completed");
        } else if (statusFilter === "skipped") {
          anytimeTasks = anytimeTasks.filter((t) => t.status === "skipped");
        }
        // "all" shows all anytime tasks

        // Sort by sort_order for pending, by updated_at for completed/skipped
        anytimeTasks.sort((a, b) => {
          // Pending tasks with sort_order come first, sorted by sort_order
          if (a.status === "pending" && b.status === "pending") {
            const aOrder = a.sort_order ?? Infinity;
            const bOrder = b.sort_order ?? Infinity;
            return aOrder - bOrder;
          }
          // Completed/skipped tasks sorted by updated_at (most recent first)
          if (a.status !== "pending" && b.status !== "pending") {
            return (
              new Date(b.updated_at).getTime() -
              new Date(a.updated_at).getTime()
            );
          }
          // Pending before completed/skipped
          return a.status === "pending" ? -1 : 1;
        });

        return {
          sortedTasks: anytimeTasks,
          sections: null,
          viewPendingCount: anytimePending,
          viewCompletedCount: anytimeCompleted,
        };
      } else {
        // Upcoming view: group by date (includes today and future)
        let upcomingTasks: Task[] = [];

        // Calculate counts for Upcoming view (today and future dates)

        // Generate occurrences based on effectiveDaysAhead
        // For pending/all: uses paginated daysAhead (14, 21, 28, etc.)
        // For completed/skipped: uses MAX_DAYS_AHEAD to load all
        // No past occurrences (daysBack=0) - overdue tasks show in Today view only
        // Per-occurrence summaries use virtualOccurrenceDate as the map key; client
        // "today" here is only for the today-anchor fallback (time machine via currentDate).
        const clientTodayStr = toLocalDateString(currentDate);
        const allWithOccurrences = generateRecurringOccurrences(
          tasks,
          currentDate,
          effectiveDaysAhead,
          0, // No past occurrences in Upcoming view
        ).map((t) => withOccurrenceDependencySummary(t, clientTodayStr));
        const allUpcoming = filterTasksForUpcoming(
          allWithOccurrences,
          currentDate,
        );
        const upcomingPending = allUpcoming.filter(
          (t) => t.status === "pending" && !t.skipped_for_today,
        ).length;
        const upcomingCompleted = allUpcoming.filter(
          (t) => t.status === "completed",
        ).length;

        if (statusFilter === "pending") {
          // Filter to show today and future dates AND pending status (exclude skipped)
          upcomingTasks = allUpcoming.filter(
            (t) => t.status === "pending" && !t.skipped_for_today,
          );
          if (condenseRecurring) {
            // Condense mode: show only first occurrence of each recurring task
            upcomingTasks = condenseRecurringTasks(upcomingTasks);
          }
        } else if (statusFilter === "completed") {
          // Show completed tasks scheduled for today and future dates
          upcomingTasks = allUpcoming.filter((t) => t.status === "completed");
        } else if (statusFilter === "skipped") {
          // Show skipped tasks scheduled for today and future dates
          upcomingTasks = allUpcoming.filter((t) => t.status === "skipped");
        } else {
          // "all" - show all tasks today + future (pending + completed + skipped)
          upcomingTasks = allUpcoming;
        }

        const grouped = groupTasksByDate(upcomingTasks);

        // Convert to SectionList format, sorted by date
        const dateKeys = Array.from(grouped.keys())
          .filter((k) => k !== "no-date")
          .sort();

        // Get today's date string
        const todayDateStr = toLocalDateString(currentDate);

        const sectionData = dateKeys.map((dateKey) => {
          let sectionTasks = grouped.get(dateKey) || [];

          // Extract untimed tasks for reordering
          const untimedIndices: number[] = [];
          const untimedTasks: Task[] = [];
          sectionTasks.forEach((task, idx) => {
            const hasDate = !!(
              task.scheduled_date || task.virtualOccurrenceDate
            );
            const isUntimed =
              task.scheduling_mode !== "anytime" &&
              hasDate &&
              !task.scheduled_at;
            if (isUntimed) {
              untimedIndices.push(idx);
              untimedTasks.push(task);
            }
          });

          if (untimedTasks.length > 0) {
            // Apply order for this specific date
            // applyUpcomingOrderForDate handles both daily overrides and permanent preferences
            const reorderedUntimed = applyUpcomingOrderForDate(
              untimedTasks,
              dateKey,
            );

            // Put them back in their positions
            const finalSorted = [...sectionTasks];
            untimedIndices.forEach((originalIdx, i) => {
              finalSorted[originalIdx] = reorderedUntimed[i];
            });
            sectionTasks = finalSorted;
          }

          return {
            title: formatDateHeader(dateKey, currentDate),
            dateKey,
            data: createSectionDataWithSubtitles(sectionTasks, dateKey),
          };
        });

        return {
          sortedTasks: upcomingTasks,
          sections: sectionData,
          viewPendingCount: upcomingPending,
          viewCompletedCount: upcomingCompleted,
        };
      }
    }, [
      tasks,
      statusFilter,
      condenseRecurring,
      listViewMode,
      currentDate,
      effectiveDaysAhead,
      applyTodayOrderForDate,
      applyUpcomingOrderForDate,
    ]);

  // Count overdue tasks
  const overdueCount = useMemo(() => {
    return tasks.filter((t) => isTaskOverdue(t, currentDate)).length;
  }, [tasks, currentDate]);

  // Handle loading more tasks when scrolling to bottom (Upcoming view only)
  // Only applies to pending/all filters - completed/skipped load all at once
  const canLoadMore =
    listViewMode === "upcoming" &&
    (statusFilter === "pending" || statusFilter === "all") &&
    daysAhead < MAX_DAYS_AHEAD;

  const handleLoadMore = useCallback(() => {
    if (!canLoadMore || loadingMore || loading) return;

    // Mark that this is a "load more" operation (not refresh)
    isLoadingMoreRef.current = true;
    setLoadingMore(true);
    setDaysAhead((prev) => Math.min(prev + LOAD_MORE_DAYS, MAX_DAYS_AHEAD));
  }, [canLoadMore, loadingMore, loading]);

  // Reset loadingMore when loading completes
  useEffect(() => {
    if (!loading && isLoadingMoreRef.current) {
      setLoadingMore(false);
      isLoadingMoreRef.current = false;
    }
  }, [loading]);

  const handleCreate = useCallback(async () => {
    if (!taskForm.title.trim()) {
      showAlert("Error", "Please enter a task title");
      return;
    }
    try {
      // Default to today's date if no date selected (and not an anytime task)
      // This matches the UI placeholder that says "Today"
      const effectiveDate =
        taskForm.scheduledDate ||
        (taskForm.isAnytime ? null : toLocalDateString(currentDate));

      // Get scheduling fields (scheduled_date for date-only, scheduled_at for timed)
      const scheduling = taskForm.getSchedulingFields(
        effectiveDate,
        taskForm.scheduledTime,
      );

      // Determine scheduling_mode:
      // - For anytime tasks: always "anytime" (Phase 4e)
      // - For recurring tasks: use user's choice (floating/fixed)
      // - For non-recurring: date_only if has date but no time, fixed if has time
      let schedulingMode: SchedulingMode | undefined;
      if (taskForm.isAnytime) {
        // Phase 4e: Anytime task
        schedulingMode = "anytime";
      } else if (taskForm.isRecurring) {
        // For recurring tasks, use the form's scheduling mode
        schedulingMode = taskForm.schedulingMode || undefined;
      } else {
        // For non-recurring tasks:
        // - date_only if there's date but no time (includes defaulting to today)
        // - fixed if there's a time
        if (taskForm.scheduledTime) {
          schedulingMode = "fixed";
        } else {
          // effectiveDate is never null for non-anytime tasks (defaults to today)
          schedulingMode = "date_only";
        }
      }

      // For recurring tasks, ensure there's a recurrence rule
      // Default to daily if none configured
      const recurrenceRule = taskForm.isRecurring
        ? taskForm.recurrenceRule || "FREQ=DAILY"
        : undefined;

      // For anytime tasks, clear scheduling fields (Phase 4e)
      const finalScheduling = taskForm.isAnytime
        ? { scheduled_date: null, scheduled_at: null }
        : scheduling;

      const newTask = await createTask({
        goal_id: taskForm.goalId || undefined,
        title: taskForm.title.trim(),
        description: taskForm.description.trim() || undefined,
        duration_minutes: taskForm.isLightning
          ? 0
          : parseInt(taskForm.duration, 10) || 30,
        scheduled_date: finalScheduling.scheduled_date,
        scheduled_at: finalScheduling.scheduled_at,
        is_recurring: taskForm.isRecurring,
        recurrence_rule: recurrenceRule,
        scheduling_mode: schedulingMode,
        recurrence_behavior: taskForm.isRecurring
          ? taskForm.recurrenceBehavior
          : undefined,
      });

      // Phase 4i: Create dependency rules for prerequisites
      if (taskForm.prerequisites.length > 0 && newTask) {
        for (const prereq of taskForm.prerequisites) {
          try {
            await api.createDependencyRule({
              upstream_task_id: prereq.task.id,
              downstream_task_id: newTask.id,
              strength: prereq.strength,
              scope: prereq.scope,
              required_occurrence_count: prereq.requiredCount,
              validity_window_minutes:
                prereq.validityWindowMinutes ?? undefined,
            });
          } catch (error) {
            // Log but don't block - task was created successfully
            console.warn("Failed to create dependency rule:", error);
          }
        }
      }

      taskForm.resetForm();
      setScreenMode("list");
    } catch {
      // Error handled in hook
    }
  }, [taskForm, createTask, currentDate]);

  const handleEdit = useCallback(
    async (task: Task) => {
      // For virtual occurrences, we want to edit the original task
      const taskToEdit = task.originalTaskId
        ? tasks.find((t) => t.id === task.originalTaskId) || task
        : task;
      setEditingTask(taskToEdit);
      taskForm.populateForm(taskToEdit);
      setScreenMode("edit");

      // Fetch existing dependencies (prerequisites of this task)
      try {
        const response = await api.getDependencyRules({
          downstream_task_id: taskToEdit.id,
        });

        // Convert dependency rules to SelectedPrerequisite format
        const prereqs = response.rules
          .filter((rule) => rule.upstream_task) // Only include rules with task info
          .map((rule) => ({
            task: {
              // Create minimal Task-like object from DependencyTaskInfo
              id: rule.upstream_task!.id,
              title: rule.upstream_task!.title,
              is_recurring: rule.upstream_task!.is_recurring,
              recurrence_rule: rule.upstream_task!.recurrence_rule,
            } as Task,
            strength: rule.strength,
            scope: rule.scope,
            requiredCount: rule.required_occurrence_count,
            validityWindowMinutes: rule.validity_window_minutes,
          }));

        taskForm.setPrerequisites(prereqs);
      } catch (error) {
        console.warn("Failed to load existing dependencies:", error);
        // Don't block editing if dependencies fail to load
      }
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
      // Get scheduling fields (scheduled_date for date-only, scheduled_at for timed)
      const scheduling = taskForm.getSchedulingFields(
        taskForm.scheduledDate,
        taskForm.scheduledTime,
      );

      // Determine scheduling_mode
      let schedulingMode: SchedulingMode | null | undefined;
      if (taskForm.isRecurring) {
        // For recurring tasks, use the form's scheduling mode
        schedulingMode = taskForm.schedulingMode || undefined;
      } else if (taskForm.scheduledDate || taskForm.scheduledTime) {
        // For non-recurring tasks with any scheduling:
        // - date_only if there's a date but no time
        // - fixed if there's a time
        schedulingMode = taskForm.scheduledTime ? "fixed" : "date_only";
      } else {
        // Unscheduled - clear scheduling_mode
        schedulingMode = null;
      }

      // For recurring tasks, ensure there's a recurrence rule
      // Default to daily if none configured
      const recurrenceRule = taskForm.isRecurring
        ? taskForm.recurrenceRule || "FREQ=DAILY"
        : undefined;

      await updateTask(editingTask.id, {
        goal_id: taskForm.goalId || undefined,
        title: taskForm.title.trim(),
        description: taskForm.description.trim() || undefined,
        duration_minutes: taskForm.isLightning
          ? 0
          : parseInt(taskForm.duration, 10) || 30,
        scheduled_date: scheduling.scheduled_date,
        scheduled_at: scheduling.scheduled_at,
        is_recurring: taskForm.isRecurring,
        recurrence_rule: recurrenceRule,
        scheduling_mode: schedulingMode,
        recurrence_behavior: taskForm.isRecurring
          ? taskForm.recurrenceBehavior
          : undefined,
      });

      // Phase 4i: Update dependency rules (replace all approach)

      // First, delete existing dependency rules where this task is downstream
      try {
        const existingRules = await api.getDependencyRules({
          downstream_task_id: editingTask.id,
        });
        for (const rule of existingRules.rules) {
          await api.deleteDependencyRule(rule.id);
        }
      } catch (error) {
        console.warn("Failed to delete existing dependency rules:", error);
      }

      // Then create all current prerequisites
      if (taskForm.prerequisites.length > 0) {
        for (const prereq of taskForm.prerequisites) {
          try {
            await api.createDependencyRule({
              upstream_task_id: prereq.task.id,
              downstream_task_id: editingTask.id,
              strength: prereq.strength,
              scope: prereq.scope,
              required_occurrence_count: prereq.requiredCount,
              validity_window_minutes:
                prereq.validityWindowMinutes ?? undefined,
            });
          } catch (error) {
            console.warn("Failed to create dependency rule:", error);
          }
        }
      }

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
        await requestComplete(task);
      } catch {
        // Error surfaced by useTasks / API
      }
    },
    [requestComplete],
  );

  const handleSkipWithReason = useCallback(
    async (reason?: string) => {
      if (!skipModalTask) return;
      try {
        await processSkipAfterReason(skipModalTask, reason);
        setSkipModalTask(null);
      } catch {
        // Error handled in hook
      }
    },
    [skipModalTask, processSkipAfterReason],
  );

  const handleSkip = useCallback(async (task: Task) => {
    // For recurring tasks or any task, show the skip modal
    setSkipModalTask(task);
  }, []);

  // Phase 4e: Handle reordering anytime tasks
  const handleReorder = useCallback(
    async (task: Task, newPosition: number) => {
      try {
        await reorderTask(task.id, newPosition);
      } catch {
        // Error handled in hook
      }
    },
    [reorderTask],
  );

  const handleReopen = useCallback(
    async (task: Task) => {
      try {
        // Use originalTaskId for virtual occurrences
        const taskId = task.originalTaskId || task.id;

        // Same scheduled_for / local_date as complete & skip so reopen finds the row.
        // Date-only recurring uses end-of-local-day (not midnight) — see buildOccurrenceParams.
        let scheduledFor: string | undefined;
        let localDate: string | undefined;
        if (task.is_recurring) {
          const p = buildOccurrenceParams(task, getCurrentDate);
          scheduledFor = p.scheduledFor;
          localDate = p.localDate;
        }

        await reopenTask(taskId, scheduledFor, localDate);
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
      // Build confirmation message - warn about completion history for recurring tasks
      let message = `Delete "${task.title}"?`;
      if (task.is_recurring) {
        message = `Delete "${task.title}" and all its completion history?\n\nThis recurring task's entire history will be permanently removed.`;
      }

      if (await showConfirm("Delete Task", message)) {
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

  const affectedSkipCascadeRows = useMemo(
    () => rowsForSkipCascadeModal(skipCascade.preview),
    [skipCascade.preview],
  );

  const taskFlowModalsEl: ReactElement = (
    <TaskFlowModals
      skipModalTask={skipModalTask}
      skipModalTitle={skipModalTask?.title || ""}
      onSkipReasonClose={() => setSkipModalTask(null)}
      onSkipWithReason={handleSkipWithReason}
      hardModal={hardModal}
      softModal={softModal}
      overrideModal={overrideModal}
      skipCascade={skipCascade}
      successModal={successModal}
      affectedSkipRows={affectedSkipCascadeRows}
      dismissHardModal={dismissHardModal}
      onHardCompletePrereqs={onHardCompletePrereqs}
      onHardRequestOverride={onHardRequestOverride}
      dismissSoftModal={dismissSoftModal}
      onSoftCompleteAnyway={onSoftCompleteAnyway}
      onSoftCompletePrereqs={onSoftCompletePrereqs}
      dismissOverrideModal={dismissOverrideModal}
      onOverrideConfirm={onOverrideConfirm}
      setOverrideReason={setOverrideReason}
      dismissSkipCascade={dismissSkipCascade}
      onSkipKeepPending={onSkipKeepPending}
      onSkipCascadeConfirm={onSkipCascadeConfirm}
      dismissSuccessModal={dismissSuccessModal}
    />
  );

  if (screenMode === "create") {
    return (
      <>
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
        recurrenceBehavior={taskForm.recurrenceBehavior}
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
        isAnytime={taskForm.isAnytime}
        onAnytimeToggle={taskForm.toggleAnytime}
        prerequisites={taskForm.prerequisites}
        onPrerequisitesChange={taskForm.setPrerequisites}
      />
      {taskFlowModalsEl}
      </>
    );
  }

  if (screenMode === "edit") {
    return (
      <>
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
        recurrenceBehavior={taskForm.recurrenceBehavior}
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
        isAnytime={taskForm.isAnytime}
        onAnytimeToggle={taskForm.toggleAnytime}
        prerequisites={taskForm.prerequisites}
        onPrerequisitesChange={taskForm.setPrerequisites}
        currentTaskId={editingTask?.id}
      />
      {taskFlowModalsEl}
      </>
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
            blurActiveElement();
            // Extract base task ID from virtual occurrence ID (format: baseId__date__time)
            const baseTaskId = task.id.includes("__")
              ? task.id.split("__")[0]
              : task.id;
            navigation.navigate("HabitMetrics", {
              taskId: baseTaskId,
              taskTitle: task.title,
            });
          }}
        />
        {taskFlowModalsEl}
      </>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: listTopPad }]}>
      <View style={[styles.backButtonRow, { paddingTop: 10 }]}>
        <TouchableOpacity
          onPress={() => {
            blurActiveElement();
            navigation.goBack();
          }}
          accessibilityLabel="Back to Dashboard"
          accessibilityRole="button"
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.header}>
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

      {/* Summary row: counts for Today view, condense toggle for both views */}
      <View style={styles.summaryRow}>
        {listViewMode === "today" && (
          <>
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
          </>
        )}
        <TouchableOpacity
          style={[
            styles.condenseToggle,
            condenseRecurring && styles.condenseToggleActive,
          ]}
          onPress={() => setCondenseRecurring(!condenseRecurring)}
          accessibilityLabel="Condense recurring tasks"
          accessibilityRole="switch"
        >
          <Text
            style={[
              styles.condenseToggleText,
              condenseRecurring && styles.condenseToggleTextActive,
            ]}
          >
            Condense
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.viewModeRow}>
        {(["today", "upcoming", "anytime"] as ListViewMode[]).map((mode) => (
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
        {(["pending", "completed", "skipped", "all"] as StatusFilter[]).map(
          (filter) => (
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
          ),
        )}
      </View>

      {loading && !loadingMore ? (
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
              : listViewMode === "anytime"
                ? statusFilter === "pending"
                  ? "No tasks in backlog"
                  : "No anytime tasks"
                : statusFilter === "pending"
                  ? "No upcoming tasks"
                  : "No tasks scheduled"}
          </Text>
          <Text style={styles.emptyStateText}>
            {listViewMode === "today"
              ? "Create a task to get started"
              : listViewMode === "anytime"
                ? "Create tasks without a schedule for your backlog"
                : "Schedule tasks with future dates to see them here"}
          </Text>
        </View>
      ) : listViewMode === "anytime" ? (
        <DraggableTaskList
          tasks={sortedTasks}
          allTasks={tasks}
          currentDate={currentDate}
          loading={loading}
          loadingMore={loadingMore}
          onTaskPress={(t) => {
            setSelectedTask(t);
            setScreenMode("detail");
          }}
          onComplete={handleComplete}
          onReorder={handleReorder}
          onRefresh={refetch}
          tasksWithPrerequisites={tasksWithPrerequisites}
        />
      ) : (listViewMode === "today" || listViewMode === "upcoming") &&
        sections ? (
        <SectionList
          sections={sections}
          extraData={tasks}
          renderSectionHeader={({ section }) => {
            // Filter out subtitle markers and get actual tasks
            const tasksOnly = section.data.filter(
              (item: SectionItem): item is Task => !isSubtitleMarker(item),
            );
            // Get untimed tasks for reorder functionality
            // Untimed = has date but no specific time (must have scheduled_date)
            const untimedTasks = tasksOnly.filter(
              (t: Task) =>
                t.scheduling_mode !== "anytime" &&
                (t.scheduled_date || t.virtualOccurrenceDate) &&
                !t.scheduled_at,
            );
            // Show reorder button when there are at least 2 untimed tasks
            const hasUntimedTasks = untimedTasks.length > 1;

            const handleReorderSection = () => {
              const items: ReorderItem[] = untimedTasks.map((task: Task) => {
                // For recurring tasks with virtual occurrences, use the task's occurrence index
                // For non-recurring tasks, occurrence_index is always 0
                const occIndex = task.occurrenceIndex ?? 0;
                return {
                  task,
                  occurrenceIndex: occIndex,
                  occurrenceLabel: task.occurrenceLabel,
                  key: `${task.id}-${occIndex}`,
                };
              });
              blurActiveElement();
              navigation.navigate("ReorderTasks", {
                date: section.dateKey,
                dateDisplay: section.title,
                items,
              });
            };

            return (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>{section.title}</Text>
                {hasUntimedTasks && (
                  <TouchableOpacity
                    style={styles.sectionReorderButton}
                    onPress={handleReorderSection}
                  >
                    <Text style={styles.sectionReorderButtonText}>Reorder</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
          renderItem={({ item }: { item: SectionItem }) => {
            // Render subtitle marker
            if (isSubtitleMarker(item)) {
              const label =
                item.subtitle === "scheduled" ? "Scheduled" : "To-Do";
              return (
                <View style={styles.subtitleRow}>
                  <Text style={styles.subtitleBookend}>── ✦ ──</Text>
                  <Text style={styles.subtitleText}>{label}</Text>
                  <Text style={styles.subtitleBookend}>── ✦ ──</Text>
                </View>
              );
            }
            // Render task card
            return (
              <TaskCard
                task={item}
                currentDate={currentDate}
                onPress={(t) => {
                  // Show overdue modal for overdue tasks in Today view
                  if (
                    listViewMode === "today" &&
                    isTaskOverdue(t, currentDate)
                  ) {
                    setOverdueModalTask(t);
                  } else {
                    setSelectedTask(t);
                    setScreenMode("detail");
                  }
                }}
                onComplete={handleComplete}
                hasPrerequisites={tasksWithPrerequisites.has(
                  item.originalTaskId || item.id,
                )}
              />
            );
          }}
          keyExtractor={(item: SectionItem, index) =>
            isSubtitleMarker(item) ? item.key : `section-${item.id}-${index}`
          }
          contentContainerStyle={styles.listContent}
          refreshing={loading && !loadingMore}
          onRefresh={refetch}
          stickySectionHeadersEnabled={false}
          onEndReached={canLoadMore ? handleLoadMore : undefined}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            <View style={styles.listFooter}>
              {loadingMore ? (
                <ActivityIndicator size="small" color="#6200ee" />
              ) : !canLoadMore &&
                (statusFilter === "pending" || statusFilter === "all") ? (
                <Text style={styles.listFooterText}>All tasks loaded</Text>
              ) : null}
            </View>
          }
        />
      ) : (
        <FlatList
          data={sortedTasks}
          extraData={tasks}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              currentDate={currentDate}
              onPress={(t) => {
                if (isTaskOverdue(t, currentDate)) {
                  setOverdueModalTask(t);
                } else {
                  setSelectedTask(t);
                  setScreenMode("detail");
                }
              }}
              onComplete={handleComplete}
              hasPrerequisites={tasksWithPrerequisites.has(
                item.originalTaskId || item.id,
              )}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={loading && !loadingMore}
          onRefresh={refetch}
        />
      )}

      {taskFlowModalsEl}

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
