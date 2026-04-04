import { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { showAlert as showCrossPlatformAlert } from "../utils/alert";

/**
 * Options for useFetchOnFocus hook.
 */
export interface UseFetchOnFocusOptions<T> {
  /** Whether to load on initial mount (default: true) */
  loadOnMount?: boolean;
  /** Whether to reload when screen regains focus (default: true) */
  reloadOnFocus?: boolean;
  /** Whether to show Alert on error (default: true) */
  showAlert?: boolean;
  /** Title for error alerts (default: "Error") */
  errorTitle?: string;
  /** Initial data value (default: null) */
  initialData?: T | null;
}

/**
 * Return type for useFetchOnFocus hook.
 */
export interface UseFetchOnFocusReturn<T> {
  /** The fetched data */
  data: T | null;
  /** Whether data is loading */
  loading: boolean;
  /** The error if fetch failed */
  error: Error | null;
  /** Reload the data */
  reload: () => Promise<T | null>;
}

/**
 * Hook that fetches data when the screen gains focus.
 * Combines initial load with focus-based refresh.
 *
 * @param fetchFn - The async function to fetch data
 * @param options - Configuration options
 * @returns Object with data, loading, error, and reload
 */
export function useFetchOnFocus<T>(
  fetchFn: () => Promise<T>,
  options: UseFetchOnFocusOptions<T> = {},
): UseFetchOnFocusReturn<T> {
  const {
    loadOnMount = true,
    reloadOnFocus = true,
    showAlert = true,
    errorTitle = "Error",
    initialData = null,
  } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(loadOnMount);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async (): Promise<T> => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
      return result;
    } catch (err) {
      const errorObj = err as Error;
      const errorMessage = errorObj.message || "Failed to load data";
      setError(errorObj);

      if (showAlert) {
        showCrossPlatformAlert(errorTitle, errorMessage);
      }

      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchFn, showAlert, errorTitle]);

  // Initial load on mount
  useEffect(() => {
    if (loadOnMount) {
      fetchData().catch(() => {
        // Error already handled in fetchData
      });
    }
  }, [loadOnMount, fetchData]);

  // Reload when screen gains focus
  useFocusEffect(
    useCallback(() => {
      if (reloadOnFocus) {
        fetchData().catch(() => {
          // Error already handled in fetchData
        });
      }
    }, [reloadOnFocus, fetchData]),
  );

  const reload = useCallback(async (): Promise<T | null> => {
    try {
      return await fetchData();
    } catch {
      // Error already handled
      return null;
    }
  }, [fetchData]);

  return { data, loading, error, reload };
}
