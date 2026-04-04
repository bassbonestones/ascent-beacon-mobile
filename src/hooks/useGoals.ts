import { useState, useCallback, useEffect } from "react";
import { Alert } from "react-native";
import api from "../services/api";
import type {
  Goal,
  CreateGoalRequest,
  UpdateGoalRequest,
  GoalStatus,
  UseGoalsReturn,
} from "../types";

export interface UseGoalsOptions {
  includeCompleted?: boolean;
  parentOnly?: boolean;
  priorityId?: string;
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
      });
      setGoals(response.goals);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      Alert.alert("Error", "Failed to load goals");
    } finally {
      setLoading(false);
    }
  }, [options.includeCompleted, options.parentOnly, options.priorityId]);

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
        Alert.alert("Error", "Failed to create goal");
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
        Alert.alert("Error", "Failed to update goal");
        throw error;
      }
    },
    [],
  );

  const updateGoalStatus = useCallback(
    async (id: string, status: GoalStatus): Promise<Goal> => {
      try {
        const updated = await api.updateGoalStatus(id, status);
        setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
        return updated;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        Alert.alert("Error", "Failed to update goal status");
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
      Alert.alert("Error", "Failed to delete goal");
      throw err instanceof Error ? err : new Error(String(err));
    }
  }, []);

  return {
    goals,
    loading,
    error,
    refetch: fetchGoals,
    createGoal,
    updateGoal,
    updateGoalStatus,
    deleteGoal,
  };
}

export default useGoals;
