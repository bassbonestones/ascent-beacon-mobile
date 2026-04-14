import { useState, useCallback, useEffect } from "react";
import api from "../services/api";
import { showAlert } from "../utils/alert";
import type {
  Goal,
  ArchiveGoalRequest,
  GoalArchivePreviewResponse,
  CreateGoalRequest,
  UpdateGoalRequest,
  UseGoalsReturn,
} from "../types";

export interface UseGoalsOptions {
  includeCompleted?: boolean;
  parentOnly?: boolean;
  priorityId?: string;
  includePaused?: boolean;
  includeArchived?: boolean;
}

/**
 * Hook for managing goals state and operations.
 */
export function useGoals(options: UseGoalsOptions = {}): UseGoalsReturn {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchGoals = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getGoals({
        include_completed: options.includeCompleted,
        parent_only: options.parentOnly,
        priority_id: options.priorityId,
        include_paused: options.includePaused,
        include_archived: options.includeArchived,
      });
      setGoals(response.goals);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      showAlert("Error", "Failed to load goals");
    } finally {
      setLoading(false);
    }
  }, [
    options.includeCompleted,
    options.parentOnly,
    options.priorityId,
    options.includePaused,
    options.includeArchived,
  ]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const createGoal = useCallback(
    async (data: CreateGoalRequest): Promise<Goal> => {
      try {
        const goal = await api.createGoal(data);
        setGoals((prev) => [goal, ...prev]);
        return goal;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        showAlert("Error", "Failed to create goal");
        throw error;
      }
    },
    [],
  );

  const updateGoal = useCallback(
    async (id: string, data: UpdateGoalRequest): Promise<Goal> => {
      try {
        const updated = await api.updateGoal(id, data);
        setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
        return updated;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        showAlert("Error", "Failed to update goal");
        throw error;
      }
    },
    [],
  );

  const deleteGoal = useCallback(async (id: string): Promise<void> => {
    try {
      await api.deleteGoal(id);
      setGoals((prev) => prev.filter((g) => g.id !== id));
    } catch (err) {
      showAlert("Error", "Failed to delete goal");
      throw err instanceof Error ? err : new Error(String(err));
    }
  }, []);

  const previewArchive = useCallback(
    async (goalId: string): Promise<GoalArchivePreviewResponse> => {
      return await api.previewArchive(goalId);
    },
    [],
  );

  const archiveGoal = useCallback(
    async (goalId: string, request: ArchiveGoalRequest): Promise<Goal> => {
      const archived = await api.archiveGoal(goalId, request);
      await fetchGoals();
      return archived;
    },
    [fetchGoals],
  );

  const pauseGoal = useCallback(
    async (goalId: string): Promise<Goal> => {
      const updated = await api.pauseGoal(goalId);
      await fetchGoals();
      return updated;
    },
    [fetchGoals],
  );

  const unpauseGoal = useCallback(
    async (goalId: string): Promise<Goal> => {
      const updated = await api.unpauseGoal(goalId);
      await fetchGoals();
      return updated;
    },
    [fetchGoals],
  );

  return {
    goals,
    loading,
    error,
    refetch: fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    previewArchive,
    archiveGoal,
    pauseGoal,
    unpauseGoal,
  };
}

export default useGoals;
