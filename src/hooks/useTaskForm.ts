import { useState, useCallback } from "react";
import type { SchedulingMode, Task } from "../types";
import { parseAsUtc } from "../utils/taskSorting";

export interface UseTaskFormReturn {
  // Form values
  title: string;
  description: string;
  goalId: string;
  duration: string;
  isLightning: boolean;
  isRecurring: boolean;
  recurrenceRule: string;
  schedulingMode: SchedulingMode | null;
  scheduledTime: string | null;
  scheduledDate: string | null;

  // Setters
  setTitle: (value: string) => void;
  setDescription: (value: string) => void;
  setGoalId: (value: string) => void;
  setDuration: (value: string) => void;
  setIsLightning: (value: boolean) => void;
  setIsRecurring: (value: boolean) => void;
  setRecurrenceRule: (value: string) => void;
  setSchedulingMode: (value: SchedulingMode | null) => void;
  setScheduledTime: (value: string | null) => void;
  setScheduledDate: (value: string | null) => void;

  // Actions
  resetForm: () => void;
  populateForm: (task: Task) => void;
  toggleLightning: () => void;
  toggleRecurring: () => void;
  handleRecurrenceChange: (
    rrule: string,
    mode: SchedulingMode,
    startDate: string | null,
    startTime: string | null,
  ) => void;
  dateTimeToIso: (
    date: string | null,
    time: string | null,
  ) => string | undefined;
}

/**
 * Hook for managing task creation form state.
 */
export function useTaskForm(): UseTaskFormReturn {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goalId, setGoalId] = useState("");
  const [duration, setDuration] = useState("30");
  const [isLightning, setIsLightning] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState("");
  const [schedulingMode, setSchedulingMode] = useState<SchedulingMode | null>(
    null,
  );
  const [scheduledTime, setScheduledTime] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setGoalId("");
    setDuration("30");
    setIsLightning(false);
    setIsRecurring(false);
    setRecurrenceRule("");
    setSchedulingMode(null);
    setScheduledTime(null);
    setScheduledDate(null);
  }, []);

  /**
   * Populate form with values from an existing task for editing.
   */
  const populateForm = useCallback((task: Task) => {
    setTitle(task.title);
    setDescription(task.description || "");
    setGoalId(task.goal_id || "");
    // Use nullish coalescing to preserve 0 for lightning tasks
    setDuration(String(task.duration_minutes ?? 30));
    setIsLightning(task.duration_minutes === 0);
    setIsRecurring(task.is_recurring || false);
    setRecurrenceRule(task.recurrence_rule || "");
    setSchedulingMode(task.scheduling_mode || null);

    // Extract date and time from scheduled_at
    // Use parseAsUtc to properly handle UTC timestamps from the backend
    // and convert to local time for display
    if (task.scheduled_at) {
      const date = parseAsUtc(task.scheduled_at);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      setScheduledDate(`${year}-${month}-${day}`);

      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      setScheduledTime(`${hours}:${minutes}`);
    } else {
      setScheduledDate(null);
      setScheduledTime(null);
    }
  }, []);

  const toggleLightning = useCallback(() => {
    setIsLightning((prev) => !prev);
  }, []);

  const toggleRecurring = useCallback(() => {
    setIsRecurring((prev) => !prev);
  }, []);

  const handleRecurrenceChange = useCallback(
    (
      rrule: string,
      mode: SchedulingMode,
      startDate: string | null,
      startTime: string | null,
    ) => {
      setRecurrenceRule(rrule);
      setSchedulingMode(mode);
      setScheduledDate(startDate);
      setScheduledTime(startTime);
    },
    [],
  );

  // Convert date + time to ISO datetime
  const dateTimeToIso = useCallback(
    (date: string | null, time: string | null): string | undefined => {
      // If no date and no time, no scheduled_at
      if (!date && !time) return undefined;

      let targetDate: Date;
      if (date) {
        const [year, month, day] = date.split("-").map(Number);
        if (time) {
          // Date + time: schedule at that specific datetime
          const [hour, minute] = time.split(":").map(Number);
          targetDate = new Date(year, month - 1, day, hour, minute, 0, 0);
        } else {
          // Date only: schedule at start of day (midnight local time)
          // This ensures the task shows up in that day's view
          targetDate = new Date(year, month - 1, day, 0, 0, 0, 0);
        }
      } else {
        // Time only (no date): use today's date
        const [hour, minute] = time!.split(":").map(Number);
        targetDate = new Date();
        targetDate.setHours(hour, minute, 0, 0);
      }

      return targetDate.toISOString();
    },
    [],
  );

  return {
    title,
    description,
    goalId,
    duration,
    isLightning,
    isRecurring,
    recurrenceRule,
    schedulingMode,
    scheduledTime,
    scheduledDate,
    setTitle,
    setDescription,
    setGoalId,
    setDuration,
    setIsLightning,
    setIsRecurring,
    setRecurrenceRule,
    setSchedulingMode,
    setScheduledTime,
    setScheduledDate,
    resetForm,
    populateForm,
    toggleLightning,
    toggleRecurring,
    handleRecurrenceChange,
    dateTimeToIso,
  };
}
