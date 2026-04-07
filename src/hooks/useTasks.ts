import { useState, useCallback, useEffect } from "react";
import api from "../services/api";
import { showAlert } from "../utils/alert";
import { toLocalDateString } from "../utils/taskSorting";
import type {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  UseTasksReturn,
} from "../types";

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
    ): Promise<Task> => {
      try {
        const updated = await api.completeTask(id, {
          scheduled_for: scheduledFor,
          local_date: localDate,
        });
        // For recurring tasks, refetch to get updated completions_today
        // This ensures virtual occurrences are regenerated with correct completion status
        if (updated.is_recurring) {
          await fetchTasks();
          showAlert(
            "Completed",
            "Occurrence marked complete. Task will recur.",
          );
        } else {
          // Non-recurring: update in place
          setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
          setPendingCount((prev) => Math.max(0, prev - 1));
          setCompletedCount((prev) => prev + 1);
        }
        return updated;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        showAlert("Error", "Failed to complete task");
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
    ): Promise<Task> => {
      try {
        const updated = await api.skipTask(id, {
          reason,
          scheduled_for: scheduledFor,
          local_date: localDate,
        });
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
        const task = tasks.find((t) => t.id === id);
        const wasCompleted = task?.status === "completed";
        const isRecurring = task?.is_recurring;

        const updated = await api.reopenTask(id, {
          scheduled_for: scheduledFor,
          local_date: localDate,
        });

        // For recurring tasks, refetch to get updated completion counts
        if (isRecurring) {
          await fetchTasks();
        } else {
          setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
          setPendingCount((prev) => prev + 1);
          if (wasCompleted) {
            setCompletedCount((prev) => Math.max(0, prev - 1));
          }
        }
        return updated;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        showAlert("Error", "Failed to reopen task");
        throw error;
      }
    },
    [tasks, fetchTasks],
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
      try {
        const response = await api.reorderTask(id, {
          new_position: newPosition,
        });
        // Refetch to get properly sorted list from server
        await fetchTasks();
        return response.task;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        showAlert("Error", "Failed to reorder task");
        throw error;
      }
    },
    [fetchTasks],
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
