/**
 * useOccurrenceOrderRange - Hook for fetching occurrence ordering for a date range.
 *
 * Used by TasksScreen Upcoming view to sort untimed tasks across multiple dates.
 * Fetches both permanent preferences and daily overrides in a single API call.
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import type {
  Task,
  DateRangeOrderResponse,
  PermanentOrderItem,
  DateOverrideItem,
} from "../types";
import api from "../services/api";

export interface UseOccurrenceOrderRangeReturn {
  /** The raw response data */
  data: DateRangeOrderResponse | null;
  /** Whether the order is currently loading */
  loading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Refetch the order */
  refetch: () => Promise<void>;
  /** Apply order to tasks for a specific date */
  applyOrderForDate: (tasks: Task[], date: string) => Task[];
  /** Check if a date has daily overrides */
  hasOverridesForDate: (date: string) => boolean;
}

export interface UseOccurrenceOrderRangeOptions {
  startDate: string; // YYYY-MM-DD format
  endDate: string; // YYYY-MM-DD format
  enabled?: boolean; // Whether to fetch (default: true)
}

/**
 * Helper to apply ordering to a list of tasks given an order map.
 */
function applyOrderToTasks(
  tasks: Task[],
  orderMap: Map<string, number>,
): Task[] {
  if (orderMap.size === 0) {
    return tasks;
  }

  const orderedTasks: Task[] = [];
  const unorderedTasks: Task[] = [];

  for (const task of tasks) {
    // Use originalTaskId for virtual occurrences (recurring tasks)
    const taskId = (task as any).originalTaskId || task.id;
    const occurrenceIndex = (task as any).occurrenceIndex ?? 0;
    const key = `${taskId}-${occurrenceIndex}`;

    if (orderMap.has(key)) {
      orderedTasks.push(task);
    } else {
      unorderedTasks.push(task);
    }
  }

  // Sort ordered tasks by their position
  orderedTasks.sort((a, b) => {
    const aTaskId = (a as any).originalTaskId || a.id;
    const bTaskId = (b as any).originalTaskId || b.id;
    const aIndex = (a as any).occurrenceIndex ?? 0;
    const bIndex = (b as any).occurrenceIndex ?? 0;
    const aKey = `${aTaskId}-${aIndex}`;
    const bKey = `${bTaskId}-${bIndex}`;
    const aPos = orderMap.get(aKey) ?? Infinity;
    const bPos = orderMap.get(bKey) ?? Infinity;
    return aPos - bPos;
  });

  return [...orderedTasks, ...unorderedTasks];
}

export function useOccurrenceOrderRange({
  startDate,
  endDate,
  enabled = true,
}: UseOccurrenceOrderRangeOptions): UseOccurrenceOrderRangeReturn {
  const [data, setData] = useState<DateRangeOrderResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!enabled || !startDate || !endDate) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.getOccurrenceOrderRange(startDate, endDate);
      setData(response);
    } catch (err) {
      // 404 or empty response is fine
      if (err instanceof Error && err.message.includes("404")) {
        setData({
          start_date: startDate,
          end_date: endDate,
          permanent_order: [],
          daily_overrides: {},
        });
      } else {
        setError(err instanceof Error ? err.message : "Failed to fetch order");
      }
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, enabled]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Memoize the permanent order map
  const permanentOrderMap = useMemo(() => {
    const map = new Map<string, number>();
    if (data?.permanent_order) {
      data.permanent_order.forEach(
        (item: PermanentOrderItem, index: number) => {
          const key = `${item.task_id}-${item.occurrence_index}`;
          // Use sequence_number as the sort value, but index as fallback for ordering
          map.set(key, item.sequence_number);
        },
      );
    }
    return map;
  }, [data]);

  // Memoize daily override maps by date
  const dailyOverrideMaps = useMemo(() => {
    const maps = new Map<string, Map<string, number>>();
    if (data?.daily_overrides) {
      for (const [date, overrides] of Object.entries(data.daily_overrides)) {
        const dateMap = new Map<string, number>();
        overrides.forEach((item: DateOverrideItem) => {
          const key = `${item.task_id}-${item.occurrence_index}`;
          dateMap.set(key, item.sort_position);
        });
        maps.set(date, dateMap);
      }
    }
    return maps;
  }, [data]);

  /**
   * Check if a specific date has daily overrides.
   */
  const hasOverridesForDate = useCallback(
    (date: string): boolean => {
      return dailyOverrideMaps.has(date);
    },
    [dailyOverrideMaps],
  );

  /**
   * Apply the correct order to tasks for a specific date.
   * If the date has daily overrides, use those; otherwise use permanent order.
   */
  const applyOrderForDate = useCallback(
    (tasks: Task[], date: string): Task[] => {
      // Check for daily overrides first
      const dateOverrideMap = dailyOverrideMaps.get(date);
      if (dateOverrideMap && dateOverrideMap.size > 0) {
        return applyOrderToTasks(tasks, dateOverrideMap);
      }

      // Fall back to permanent order
      return applyOrderToTasks(tasks, permanentOrderMap);
    },
    [dailyOverrideMaps, permanentOrderMap],
  );

  return {
    data,
    loading,
    error,
    refetch: fetchOrder,
    applyOrderForDate,
    hasOverridesForDate,
  };
}

export default useOccurrenceOrderRange;
