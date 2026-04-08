/**
 * Hook for accessing the timezone override from Time Machine.
 * Returns the effective timezone (override or undefined for device default).
 */
import { useTime } from "../context/TimeContext";

export interface UseTimezoneReturn {
  /** The overridden timezone, or undefined to use device default */
  timezone: string | undefined;
  /** Set a timezone override (pass null to reset to device default) */
  setTimezone: (timezone: string | null) => void;
  /** Whether a timezone override is active */
  hasOverride: boolean;
}

/**
 * Get the current timezone override for display purposes.
 * Returns undefined when using device default so formatTaskTime uses local time.
 */
export function useTimezone(): UseTimezoneReturn {
  const { overrideTimezone, setTimezone } = useTime();

  return {
    timezone: overrideTimezone || undefined,
    setTimezone,
    hasOverride: overrideTimezone !== null,
  };
}
