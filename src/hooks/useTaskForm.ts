import { useState, useCallback } from "react";
import type { SchedulingMode } from "../types";

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
      if (!time) return undefined;
      const [hour, minute] = time.split(":").map(Number);

      let targetDate: Date;
      if (date) {
        const [year, month, day] = date.split("-").map(Number);
        targetDate = new Date(year, month - 1, day, hour, minute, 0, 0);
      } else {
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
    toggleLightning,
    toggleRecurring,
    handleRecurrenceChange,
    dateTimeToIso,
  };
}
