import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import api from "../services/api";
import { toLocalDateString } from "../utils/taskSorting";
import { getDeviceTimezone } from "../utils/timezoneData";
import {
  getStoredValue,
  setStoredValue,
  removeStoredValue,
  getDateInTimezone,
} from "./timeStorage";

const TIME_MACHINE_ENABLED_KEY = "time_machine_enabled";
const TRAVEL_DATE_KEY = "time_travel_date";
const TIMEZONE_KEY = "time_machine_timezone";

/**
 * Time context value interface.
 */
interface TimeContextValue {
  /** Whether the time machine feature is revealed/enabled */
  isTimeMachineEnabled: boolean;
  /** Whether time travel is currently active */
  isTimeTravelActive: boolean;
  /** The overridden date, or null if using real time */
  travelDate: Date | null;
  /** The overridden timezone, or null for device default */
  overrideTimezone: string | null;
  /** Enable/reveal the time machine UI (e.g., via triple-tap) */
  enableTimeMachine: () => void;
  /** Disable/hide the time machine UI */
  disableTimeMachine: () => void;
  /** Set the travel date (pass null to return to real time) */
  setTravelDate: (date: Date | null) => void;
  /** Set the timezone override (pass null to use device default) */
  setTimezone: (timezone: string | null) => void;
  /** Get the effective timezone (override or device default) */
  getTimezone: () => string;
  /** Reset to today and exit time travel. If deleteCompletions is true, deletes future completions. */
  resetToToday: (
    deleteCompletions?: boolean,
  ) => Promise<{ deletedCount: number }>;
  /** Full reset: exit time travel AND reset timezone to device default */
  fullReset: (deleteCompletions?: boolean) => Promise<{ deletedCount: number }>;
  /** Revert to a specific date, stay in time machine. If deleteCompletions is true, deletes completions after that date. */
  revertToDate: (
    date: Date,
    deleteCompletions?: boolean,
  ) => Promise<{ deletedCount: number }>;
  /** Get count of completions that would be affected by reverting to a date */
  getFutureCompletionsCount: (afterDate?: string) => Promise<number>;
  /** Get current date (travel date if active, otherwise real date) */
  getCurrentDate: () => Date;
  /** Loading state for initial hydration */
  loading: boolean;
}

interface TimeProviderProps {
  children: ReactNode;
}

const TimeContext = createContext<TimeContextValue | null>(null);

/**
 * Hook to access time context.
 */
export function useTime(): TimeContextValue {
  const context = useContext(TimeContext);
  if (!context) {
    throw new Error("useTime must be used within a TimeProvider");
  }
  return context;
}

/**
 * Provider component for time machine state.
 */
export function TimeProvider({
  children,
}: TimeProviderProps): React.JSX.Element {
  const [isTimeMachineEnabled, setIsTimeMachineEnabled] = useState(false);
  const [travelDate, setTravelDateState] = useState<Date | null>(null);
  const [overrideTimezone, setOverrideTimezoneState] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  // Hydrate from storage on mount
  useEffect(() => {
    const loadStoredState = async () => {
      try {
        const enabledStr = await getStoredValue(TIME_MACHINE_ENABLED_KEY);
        const dateStr = await getStoredValue(TRAVEL_DATE_KEY);
        const tzStr = await getStoredValue(TIMEZONE_KEY);

        if (enabledStr === "true") {
          setIsTimeMachineEnabled(true);
        }

        if (dateStr) {
          const parsed = new Date(dateStr);
          if (!isNaN(parsed.getTime())) {
            setTravelDateState(parsed);
          }
        }

        if (tzStr) {
          setOverrideTimezoneState(tzStr);
        }
      } catch {
        // Ignore storage errors on load
      } finally {
        setLoading(false);
      }
    };

    loadStoredState();
  }, []);

  const enableTimeMachine = useCallback(async () => {
    setIsTimeMachineEnabled(true);
    await setStoredValue(TIME_MACHINE_ENABLED_KEY, "true");
  }, []);

  const disableTimeMachine = useCallback(async () => {
    setIsTimeMachineEnabled(false);
    setTravelDateState(null);
    await removeStoredValue(TIME_MACHINE_ENABLED_KEY);
    await removeStoredValue(TRAVEL_DATE_KEY);
  }, []);

  const setTravelDate = useCallback(async (date: Date | null) => {
    setTravelDateState(date);
    if (date) {
      await setStoredValue(TRAVEL_DATE_KEY, date.toISOString());
    } else {
      await removeStoredValue(TRAVEL_DATE_KEY);
    }
  }, []);

  const setTimezone = useCallback(async (timezone: string | null) => {
    setOverrideTimezoneState(timezone);
    if (timezone) {
      await setStoredValue(TIMEZONE_KEY, timezone);
    } else {
      await removeStoredValue(TIMEZONE_KEY);
    }
  }, []);

  const getTimezone = useCallback((): string => {
    return overrideTimezone || getDeviceTimezone();
  }, [overrideTimezone]);

  const resetToToday = useCallback(
    async (
      deleteCompletions: boolean = false,
    ): Promise<{
      deletedCount: number;
    }> => {
      let deletedCount = 0;

      // Only call API to delete if requested
      if (deleteCompletions) {
        const result = await api.deleteFutureCompletions();
        deletedCount = result.deletedCount;
      }

      // Clear the travel date (exit time machine), but keep timezone
      setTravelDateState(null);
      await removeStoredValue(TRAVEL_DATE_KEY);

      return { deletedCount };
    },
    [],
  );

  const fullReset = useCallback(
    async (
      deleteCompletions: boolean = false,
    ): Promise<{
      deletedCount: number;
    }> => {
      let deletedCount = 0;

      // Only call API to delete if requested
      if (deleteCompletions) {
        const result = await api.deleteFutureCompletions();
        deletedCount = result.deletedCount;
      }

      // Clear both travel date AND timezone override
      setTravelDateState(null);
      setOverrideTimezoneState(null);
      await removeStoredValue(TRAVEL_DATE_KEY);
      await removeStoredValue(TIMEZONE_KEY);

      return { deletedCount };
    },
    [],
  );

  const revertToDate = useCallback(
    async (
      date: Date,
      deleteCompletions: boolean = false,
    ): Promise<{ deletedCount: number }> => {
      // Format date as YYYY-MM-DD for API (using local date, not UTC)
      const dateStr = toLocalDateString(date);

      let deletedCount = 0;

      // Only call API to delete if requested
      if (deleteCompletions) {
        const result = await api.deleteFutureCompletions(dateStr);
        deletedCount = result.deletedCount;
      }

      // Set travel date to the specified date (stay in time machine)
      setTravelDateState(date);
      await setStoredValue(TRAVEL_DATE_KEY, date.toISOString());

      return { deletedCount };
    },
    [],
  );

  const getFutureCompletionsCount = useCallback(
    async (afterDate?: string): Promise<number> => {
      const result = await api.getFutureCompletionsCount(afterDate);
      return result.count;
    },
    [],
  );

  /**
   * Get the current date/time, adjusted for timezone override.
   * If timezone is overridden, returns a Date representing "now" in that timezone.
   * For example: 8:26 PM CDT on April 7 → 1:26 AM UTC on April 8
   */
  const getCurrentDate = useCallback((): Date => {
    const baseDate = travelDate ? new Date(travelDate) : new Date();
    if (!overrideTimezone) {
      return baseDate;
    }
    return getDateInTimezone(baseDate, overrideTimezone);
  }, [travelDate, overrideTimezone]);

  const isTimeTravelActive = travelDate !== null;

  const value: TimeContextValue = {
    isTimeMachineEnabled,
    isTimeTravelActive,
    travelDate,
    overrideTimezone,
    enableTimeMachine,
    disableTimeMachine,
    setTravelDate,
    setTimezone,
    getTimezone,
    resetToToday,
    fullReset,
    revertToDate,
    getFutureCompletionsCount,
    getCurrentDate,
    loading,
  };

  return <TimeContext.Provider value={value}>{children}</TimeContext.Provider>;
}
