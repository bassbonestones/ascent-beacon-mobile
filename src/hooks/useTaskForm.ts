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
  isAnytime: boolean; // Phase 4e

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
  setIsAnytime: (value: boolean) => void; // Phase 4e

  // Actions
  resetForm: () => void;
  populateForm: (task: Task) => void;
  toggleLightning: () => void;
  toggleRecurring: () => void;
  toggleAnytime: () => void; // Phase 4e
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
  getSchedulingFields: (
    date: string | null,
    time: string | null,
  ) => { scheduled_date: string | null; scheduled_at: string | null };
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
  const [isAnytime, setIsAnytime] = useState(false); // Phase 4e

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
    setIsAnytime(false); // Phase 4e
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
    setIsAnytime(task.scheduling_mode === "anytime"); // Phase 4e

    // Extract date and time from scheduled_date or scheduled_at
    // scheduled_date is for date-only tasks, scheduled_at is for timed tasks
    if (task.scheduled_date) {
      // Date-only task: use scheduled_date directly, no time
      setScheduledDate(task.scheduled_date);
      setScheduledTime(null);
    } else if (task.scheduled_at) {
      // Timed task: extract date and time from scheduled_at
      const date = parseAsUtc(task.scheduled_at);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      setScheduledDate(`${year}-${month}-${day}`);

      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      setScheduledTime(`${hours}:${minutes}`);
    } else {
      // Unscheduled task
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

  // Phase 4e: Toggle anytime task
  const toggleAnytime = useCallback(() => {
    setIsAnytime((prev) => !prev);
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

  // Convert date + time to ISO datetime (for timed tasks only)
  const dateTimeToIso = useCallback(
    (date: string | null, time: string | null): string | undefined => {
      // Only return ISO datetime when BOTH date and time are set
      // For date-only tasks, use getSchedulingFields instead
      if (!date || !time) return undefined;

      const [year, month, day] = date.split("-").map(Number);
      const [hour, minute] = time.split(":").map(Number);
      const targetDate = new Date(year, month - 1, day, hour, minute, 0, 0);
      return targetDate.toISOString();
    },
    [],
  );

  // Get both scheduled_date and scheduled_at fields for API request
  // - Date only: scheduled_date is set, scheduled_at is null
  // - Date + time: scheduled_at is set, scheduled_date is null
  // - Neither: both null (unscheduled = today in UI)
  const getSchedulingFields = useCallback(
    (
      date: string | null,
      time: string | null,
    ): { scheduled_date: string | null; scheduled_at: string | null } => {
      if (date && time) {
        // Timed task: use scheduled_at
        const [year, month, day] = date.split("-").map(Number);
        const [hour, minute] = time.split(":").map(Number);
        const targetDate = new Date(year, month - 1, day, hour, minute, 0, 0);
        return {
          scheduled_date: null,
          scheduled_at: targetDate.toISOString(),
        };
      } else if (date && !time) {
        // Date-only task: use scheduled_date
        return {
          scheduled_date: date,
          scheduled_at: null,
        };
      } else {
        // Unscheduled task
        return {
          scheduled_date: null,
          scheduled_at: null,
        };
      }
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
    isAnytime, // Phase 4e
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
    setIsAnytime, // Phase 4e
    resetForm,
    populateForm,
    toggleLightning,
    toggleRecurring,
    toggleAnytime, // Phase 4e
    handleRecurrenceChange,
    dateTimeToIso,
    getSchedulingFields,
  };
}
