import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import api from "../services/api";
import { toLocalDateString } from "../utils/taskSorting";

const TIME_MACHINE_ENABLED_KEY = "time_machine_enabled";
const TRAVEL_DATE_KEY = "time_travel_date";

const isWeb = Platform.OS === "web";

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
  /** Enable/reveal the time machine UI (e.g., via triple-tap) */
  enableTimeMachine: () => void;
  /** Disable/hide the time machine UI */
  disableTimeMachine: () => void;
  /** Set the travel date (pass null to return to real time) */
  setTravelDate: (date: Date | null) => void;
  /** Reset to today: delete all future completions and exit time travel */
  resetToToday: () => Promise<{ deletedCount: number }>;
  /** Revert to a specific date: delete completions after that date, stay in time machine */
  revertToDate: (date: Date) => Promise<{ deletedCount: number }>;
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

// Storage helpers
async function getStoredValue(key: string): Promise<string | null> {
  if (isWeb) {
    return localStorage.getItem(key);
  }
  return await SecureStore.getItemAsync(key);
}

async function setStoredValue(key: string, value: string): Promise<void> {
  if (isWeb) {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function removeStoredValue(key: string): Promise<void> {
  if (isWeb) {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

/**
 * Provider component for time machine state.
 */
export function TimeProvider({
  children,
}: TimeProviderProps): React.JSX.Element {
  const [isTimeMachineEnabled, setIsTimeMachineEnabled] = useState(false);
  const [travelDate, setTravelDateState] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  // Hydrate from storage on mount
  useEffect(() => {
    const loadStoredState = async () => {
      try {
        const enabledStr = await getStoredValue(TIME_MACHINE_ENABLED_KEY);
        const dateStr = await getStoredValue(TRAVEL_DATE_KEY);

        if (enabledStr === "true") {
          setIsTimeMachineEnabled(true);
        }

        if (dateStr) {
          const parsed = new Date(dateStr);
          if (!isNaN(parsed.getTime())) {
            setTravelDateState(parsed);
          }
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

  const resetToToday = useCallback(async (): Promise<{
    deletedCount: number;
  }> => {
    // Call API to delete all future completions (after today)
    const result = await api.deleteFutureCompletions();

    // Clear the travel date (exit time machine)
    setTravelDateState(null);
    await removeStoredValue(TRAVEL_DATE_KEY);

    return { deletedCount: result.deletedCount };
  }, []);

  const revertToDate = useCallback(
    async (date: Date): Promise<{ deletedCount: number }> => {
      // Format date as YYYY-MM-DD for API (using local date, not UTC)
      const dateStr = toLocalDateString(date);

      // Call API to delete completions after the specified date
      const result = await api.deleteFutureCompletions(dateStr);

      // Set travel date to the specified date (stay in time machine)
      setTravelDateState(date);
      await setStoredValue(TRAVEL_DATE_KEY, date.toISOString());

      return { deletedCount: result.deletedCount };
    },
    [],
  );

  const getCurrentDate = useCallback((): Date => {
    if (travelDate) {
      return new Date(travelDate);
    }
    return new Date();
  }, [travelDate]);

  const isTimeTravelActive = travelDate !== null;

  const value: TimeContextValue = {
    isTimeMachineEnabled,
    isTimeTravelActive,
    travelDate,
    enableTimeMachine,
    disableTimeMachine,
    setTravelDate,
    resetToToday,
    revertToDate,
    getCurrentDate,
    loading,
  };

  return <TimeContext.Provider value={value}>{children}</TimeContext.Provider>;
}
