/**
 * useOccurrenceOrder - Hook for fetching and applying occurrence ordering.
 *
 * Used by TasksScreen to sort untimed tasks according to saved preferences
 * (permanent) and daily overrides (one-time).
 */
import { useState, useEffect, useCallback } from "react";
import type { Task, DayOrderResponse, DayOrderItem } from "../types";
import api from "../services/api";

export interface UseOccurrenceOrderReturn {
  /** The sorted task order for the given date */
  order: DayOrderItem[];
  /** Whether the order is currently loading */
  loading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Refetch the order */
  refetch: () => Promise<void>;
  /** Apply the order to a list of tasks (sorts them) - includes daily overrides */
  applySortOrder: (tasks: Task[]) => Task[];
  /** Apply only permanent preferences (for future dates where daily overrides don't apply) */
  applyPermanentOrder: (tasks: Task[]) => Task[];
}

export interface UseOccurrenceOrderOptions {
  date: string; // YYYY-MM-DD format
  enabled?: boolean; // Whether to fetch (default: true)
}

export function useOccurrenceOrder({
  date,
  enabled = true,
}: UseOccurrenceOrderOptions): UseOccurrenceOrderReturn {
  const [order, setOrder] = useState<DayOrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!enabled || !date) return;

    setLoading(true);
    setError(null);

    try {
      const response: DayOrderResponse = await api.getOccurrenceOrder(date);
      console.log(
        "[useOccurrenceOrder] Fetched order for",
        date,
        ":",
        response.items,
      );
      setOrder(response.items);
    } catch (err) {
      // 404 means no order saved, which is fine
      if (err instanceof Error && err.message.includes("404")) {
        setOrder([]);
      } else {
        setError(err instanceof Error ? err.message : "Failed to fetch order");
      }
    } finally {
      setLoading(false);
    }
  }, [date, enabled]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  /**
   * Apply the saved order to a list of tasks.
   * Tasks in the saved order are placed first (in order), remaining tasks after.
   */
  const applySortOrder = useCallback(
    (tasks: Task[]): Task[] => {
      if (order.length === 0) {
        // No saved order, return tasks as-is
        return tasks;
      }

      // Create a map of task_id+occurrence_index to position
      const orderMap = new Map<string, number>();
      order.forEach((item, index) => {
        const key = `${item.task_id}-${item.occurrence_index}`;
        orderMap.set(key, index);
      });
      console.log(
        "[applySortOrder] orderMap keys:",
        Array.from(orderMap.keys()),
      );

      // Separate tasks into ordered and unordered
      const orderedTasks: Task[] = [];
      const unorderedTasks: Task[] = [];

      for (const task of tasks) {
        // Use originalTaskId for virtual occurrences (recurring tasks)
        // since task.id for virtual occurrences is "uuid__date"
        const taskId = (task as any).originalTaskId || task.id;
        const occurrenceIndex = (task as any).occurrenceIndex ?? 0;
        const key = `${taskId}-${occurrenceIndex}`;
        console.log(
          "[applySortOrder] Task",
          task.title,
          "-> taskId:",
          taskId,
          "occIdx:",
          occurrenceIndex,
          "key:",
          key,
          "match:",
          orderMap.has(key),
        );

        if (orderMap.has(key)) {
          orderedTasks.push(task);
        } else {
          unorderedTasks.push(task);
        }
      }

      // Sort ordered tasks by their position in the order
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

      console.log(
        "[applySortOrder] Result order:",
        orderedTasks
          .map((t) => t.title)
          .concat(unorderedTasks.map((t) => t.title)),
      );
      // Return ordered first, then unordered
      return [...orderedTasks, ...unorderedTasks];
    },
    [order],
  );

  /**
   * Apply only permanent preferences (not daily overrides) to a list of tasks.
   * Used for future date sections where daily overrides don't apply.
   */
  const applyPermanentOrder = useCallback(
    (tasks: Task[]): Task[] => {
      // Filter to only permanent preferences (not daily overrides)
      const permanentOrder = order.filter((item) => !item.is_override);

      if (permanentOrder.length === 0) {
        return tasks;
      }

      // Create a map of task_id+occurrence_index to position
      const orderMap = new Map<string, number>();
      permanentOrder.forEach((item, index) => {
        const key = `${item.task_id}-${item.occurrence_index}`;
        orderMap.set(key, index);
      });

      // Separate tasks into ordered and unordered
      const orderedTasks: Task[] = [];
      const unorderedTasks: Task[] = [];

      for (const task of tasks) {
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
    },
    [order],
  );

  return {
    order,
    loading,
    error,
    refetch: fetchOrder,
    applySortOrder,
    applyPermanentOrder,
  };
}

export default useOccurrenceOrder;
