import { useState, useCallback, useEffect, useMemo } from "react";
import api from "../services/api";
import { showAlert } from "../utils/alert";
import { toLocalDateString } from "../utils/taskSorting";
import { useTimezone } from "./useTimezone";
import type {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  UseTasksReturn,
  DependencyBlockedResponse,
  CompleteTaskOverrides,
} from "../types";
import { isSkipTaskPreviewResponse } from "../types";

export interface UseTasksOptions {
  goalId?: string;
  status?: string;
  includeCompleted?: boolean;
  daysAhead?: number; // How many days ahead to load completion data (default: 14)
  clientToday?: Date; // Override "today" for time travel support (default: new Date())
}

/**
 * Hook for managing tasks state and operations.
 */
export function useTasks(options: UseTasksOptions = {}): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { timezone: timezoneOverride } = useTimezone();

  const clientTimezone = useMemo(
    () =>
      timezoneOverride ??
      Intl.DateTimeFormat().resolvedOptions().timeZone ??
      "UTC",
    [timezoneOverride],
  );

  // Memoize clientToday string to avoid unnecessary re-fetches
  // We derive the date string immediately so it can be used as a stable dependency
  const clientTodayStr = options.clientToday
    ? toLocalDateString(options.clientToday)
    : toLocalDateString(new Date());

  const fetchTasks = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      // Pass the client's local date so the backend can correctly determine "today"
      // This fixes timezone issues where UTC "today" differs from user's local "today"
      // Also supports time travel when clientToday option is provided
      const response = await api.getTasks({
        goal_id: options.goalId,
        status: options.status,
        include_completed: options.includeCompleted,
        client_today: clientTodayStr,
        days_ahead: options.daysAhead,
        include_dependency_summary: true,
        client_timezone: clientTimezone,
      });
      setTasks(response.tasks);
      setPendingCount(response.pending_count);
      setCompletedCount(response.completed_count);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      showAlert("Error", "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [
    options.goalId,
    options.status,
    options.includeCompleted,
    options.daysAhead,
    clientTodayStr,
    clientTimezone,
  ]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = useCallback(
    async (data: CreateTaskRequest): Promise<Task> => {
      try {
        const task = await api.createTask(data);
        // Refetch to get properly sorted list from server
        // This ensures the UI shows tasks in the correct order immediately
        await fetchTasks();
        return task;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        showAlert("Error", "Failed to create task");
        throw error;
      }
    },
    [fetchTasks],
  );

  const updateTask = useCallback(
    async (id: string, data: UpdateTaskRequest): Promise<Task> => {
      try {
        const updated = await api.updateTask(id, data);
        setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
        return updated;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        showAlert("Error", "Failed to update task");
        throw error;
      }
    },
    [],
  );

  const completeTask = useCallback(
    async (
      id: string,
      scheduledFor?: string,
      localDate?: string,
      overrides?: CompleteTaskOverrides,
    ): Promise<Task> => {
      try {
        const updated = await api.completeTask(id, {
          scheduled_for: scheduledFor,
          local_date: localDate,
          override_confirm: overrides?.override_confirm,
          override_reason: overrides?.override_reason ?? undefined,
        });
        // For recurring tasks, refetch to get updated completions_today
        // This ensures virtual occurrences are regenerated with correct completion status
        if (updated.is_recurring) {
          await fetchTasks();
        } else {
          // Non-recurring: update in place
          setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
          setPendingCount((prev) => Math.max(0, prev - 1));
          setCompletedCount((prev) => prev + 1);
        }
        return updated;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        
        // Check for dependency blocked error (409 with blockers)
        const errorWithProps = err as Error & { 
          isDependencyBlocked?: boolean;
          validationData?: DependencyBlockedResponse;
        };
        
        if (errorWithProps.isDependencyBlocked && errorWithProps.validationData) {
          const blockers = errorWithProps.validationData.blockers || [];
          const blockerNames = blockers
            .map((b) => `"${b.upstream_task?.title || 'Unknown task'}"`)
            .join(", ");
          showAlert(
            "Prerequisites Not Met",
            `Complete these tasks first: ${blockerNames}`,
          );
        } else {
          showAlert("Error", error.message || "Failed to complete task");
        }
        throw error;
      }
    },
    [fetchTasks],
  );

  const skipTask = useCallback(
    async (
      id: string,
      reason?: string,
      scheduledFor?: string,
      localDate?: string,
      confirmProceed?: boolean,
    ) => {
      try {
        const updated = await api.skipTask(id, {
          reason,
          scheduled_for: scheduledFor,
          local_date: localDate,
          confirm_proceed: confirmProceed,
        });
        if (isSkipTaskPreviewResponse(updated)) {
          return updated;
        }
        // For recurring tasks, refetch to get updated completions_today
        if (updated.is_recurring) {
          await fetchTasks();
        } else {
          // Non-recurring: update in place
          setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
          setPendingCount((prev) => Math.max(0, prev - 1));
        }
        return updated;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        showAlert("Error", "Failed to skip task");
        throw error;
      }
    },
    [fetchTasks],
  );

  const reopenTask = useCallback(
    async (
      id: string,
      scheduledFor?: string,
      localDate?: string,
    ): Promise<Task> => {
      try {
        const updated = await api.reopenTask(id, {
          scheduled_for: scheduledFor,
          local_date: localDate,
        });

        // Always refetch: matches server (completions, skips, status) even when the
        // template row was not in local state (e.g. virtual occurrence + stale list).
        await fetchTasks();
        return updated;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        showAlert("Error", "Failed to reopen task");
        throw error;
      }
    },
    [fetchTasks],
  );

  const deleteTask = useCallback(
    async (id: string): Promise<void> => {
      try {
        const task = tasks.find((t) => t.id === id);
        await api.deleteTask(id);
        setTasks((prev) => prev.filter((t) => t.id !== id));
        if (task?.status === "pending") {
          setPendingCount((prev) => Math.max(0, prev - 1));
        } else if (task?.status === "completed") {
          setCompletedCount((prev) => Math.max(0, prev - 1));
        }
      } catch (err) {
        showAlert("Error", "Failed to delete task");
        throw err instanceof Error ? err : new Error(String(err));
      }
    },
    [tasks],
  );

  const reorderTask = useCallback(
    async (id: string, newPosition: number): Promise<Task> => {
      // Optimistic update: reorder locally first for instant feedback
      const taskIndex = tasks.findIndex((t) => t.id === id);
      if (taskIndex === -1) {
        throw new Error("Task not found");
      }

      const oldTasks = [...tasks];
      const task = tasks[taskIndex];
      const oldPosition = task.sort_order;

      if (oldPosition === null || oldPosition === newPosition) {
        return task; // No change needed
      }

      // Create new array with updated sort_orders
      const updatedTasks = tasks.map((t) => {
        if (t.id === id) {
          return { ...t, sort_order: newPosition };
        }
        if (t.sort_order === null) return t;

        if (newPosition < oldPosition) {
          // Moving up: shift tasks in [newPosition, oldPosition-1] down
          if (t.sort_order >= newPosition && t.sort_order < oldPosition) {
            return { ...t, sort_order: t.sort_order + 1 };
          }
        } else {
          // Moving down: shift tasks in [oldPosition+1, newPosition] up
          if (t.sort_order > oldPosition && t.sort_order <= newPosition) {
            return { ...t, sort_order: t.sort_order - 1 };
          }
        }
        return t;
      });

      // Sort by sort_order for display
      updatedTasks.sort((a, b) => {
        if (a.sort_order === null) return 1;
        if (b.sort_order === null) return -1;
        return a.sort_order - b.sort_order;
      });

      setTasks(updatedTasks);

      try {
        const response = await api.reorderTask(id, {
          new_position: newPosition,
        });
        return response.task;
      } catch (err) {
        // Revert on failure
        setTasks(oldTasks);
        const error = err instanceof Error ? err : new Error(String(err));
        showAlert("Error", "Failed to reorder task");
        throw error;
      }
    },
    [tasks],
  );

  return {
    tasks,
    loading,
    error,
    pendingCount,
    completedCount,
    refetch: fetchTasks,
    createTask,
    updateTask,
    completeTask,
    skipTask,
    reopenTask,
    deleteTask,
    reorderTask,
  };
}

export default useTasks;
