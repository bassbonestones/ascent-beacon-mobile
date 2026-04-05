import type { Task } from "../types";

/**
 * Task category for sorting and grouping in Today view.
 */
export type TaskCategory = "overdue" | "timed" | "todo";

/**
 * Determine a task's category for Today view display.
 */
export function getTaskCategory(
  task: Task,
  now: Date = new Date(),
): TaskCategory {
  if (task.status !== "pending") {
    // Only pending tasks appear in Today view
    return "todo";
  }

  if (task.scheduled_at) {
    const scheduledDate = new Date(task.scheduled_at);
    if (scheduledDate < now) {
      return "overdue";
    }
    return "timed";
  }

  return "todo";
}

/**
 * Group tasks by category for Today view.
 */
export function groupTasksByCategory(
  tasks: Task[],
  now: Date = new Date(),
): { overdue: Task[]; timed: Task[]; todo: Task[] } {
  const result = {
    overdue: [] as Task[],
    timed: [] as Task[],
    todo: [] as Task[],
  };

  for (const task of tasks) {
    if (task.status !== "pending") continue;

    const category = getTaskCategory(task, now);
    result[category].push(task);
  }

  // Sort each category
  result.overdue.sort((a, b) => {
    // Oldest overdue first
    const aTime = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
    const bTime = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;
    return aTime - bTime;
  });

  result.timed.sort((a, b) => {
    // Earliest time first
    const aTime = a.scheduled_at
      ? new Date(a.scheduled_at).getTime()
      : Infinity;
    const bTime = b.scheduled_at
      ? new Date(b.scheduled_at).getTime()
      : Infinity;
    return aTime - bTime;
  });

  result.todo.sort((a, b) => {
    // By creation date, newest first (most recently added)
    const aTime = new Date(a.created_at).getTime();
    const bTime = new Date(b.created_at).getTime();
    return bTime - aTime;
  });

  return result;
}

/**
 * Sort tasks for Today view: overdue → timed → todo.
 */
export function sortTasksForTodayView(
  tasks: Task[],
  now: Date = new Date(),
): Task[] {
  const grouped = groupTasksByCategory(tasks, now);
  return [...grouped.overdue, ...grouped.timed, ...grouped.todo];
}

/**
 * Check if a task is scheduled for today.
 */
export function isTaskForToday(task: Task, today: Date = new Date()): boolean {
  if (!task.scheduled_at) {
    // Unscheduled tasks always appear in Today view
    return true;
  }

  const scheduledDate = new Date(task.scheduled_at);
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  // Task is for today if scheduled today OR overdue (scheduled before today)
  return scheduledDate <= todayEnd;
}

/**
 * Filter tasks to only show today's tasks.
 */
export function filterTasksForToday(
  tasks: Task[],
  today: Date = new Date(),
): Task[] {
  return tasks.filter((task) => isTaskForToday(task, today));
}

/**
 * Format time for display (e.g., "9:00 AM").
 */
export function formatTaskTime(scheduledAt: string | null): string | null {
  if (!scheduledAt) return null;

  const date = new Date(scheduledAt);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/**
 * Check if a task is overdue.
 */
export function isTaskOverdue(task: Task, now: Date = new Date()): boolean {
  if (task.status !== "pending" || !task.scheduled_at) {
    return false;
  }
  return new Date(task.scheduled_at) < now;
}

/**
 * Condense recurring tasks - show only first occurrence.
 * Returns tasks with condensed recurring tasks grouped.
 */
export function condenseRecurringTasks(tasks: Task[]): Task[] {
  // Separate recurring and non-recurring
  const nonRecurring: Task[] = [];
  const recurringByTitle: Map<string, Task[]> = new Map();

  for (const task of tasks) {
    if (task.is_recurring) {
      const key = `${task.goal_id || "no-goal"}-${task.title}`;
      if (!recurringByTitle.has(key)) {
        recurringByTitle.set(key, []);
      }
      recurringByTitle.get(key)!.push(task);
    } else {
      nonRecurring.push(task);
    }
  }

  // For recurring tasks, only keep the first (sorted by scheduled_at)
  const condensed: Task[] = [];
  for (const [, taskGroup] of recurringByTitle) {
    taskGroup.sort((a, b) => {
      const aTime = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
      const bTime = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;
      return aTime - bTime;
    });
    // Add first occurrence
    condensed.push(taskGroup[0]);
  }

  return [...nonRecurring, ...condensed];
}
