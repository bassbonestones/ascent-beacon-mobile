import { useState, useCallback } from "react";
import { Alert } from "react-native";

/**
 * Options for useAsync hook.
 */
export interface UseAsyncOptions<T> {
  /** Whether to show an Alert on error (default: true) */
  showAlert?: boolean;
  /** Title for the error alert (default: "Error") */
  errorTitle?: string;
  /** Callback when operation succeeds */
  onSuccess?: (result: T) => void;
  /** Callback when operation fails */
  onError?: (error: Error) => void;
}

/**
 * Return type for useAsync hook.
 */
export interface UseAsyncReturn<T, Args extends unknown[]> {
  /** Execute the async function */
  execute: (...args: Args) => Promise<T>;
  /** Whether the operation is in progress */
  loading: boolean;
  /** The error if operation failed */
  error: Error | null;
  /** The result data if operation succeeded */
  data: T | null;
  /** Reset state to initial values */
  reset: () => void;
}

/**
 * Hook for handling async operations with loading and error states.
 *
 * @param asyncFn - The async function to execute
 * @param options - Configuration options
 * @returns Object with execute, loading, error, data, and reset
 */
export function useAsync<T, Args extends unknown[]>(
  asyncFn: (...args: Args) => Promise<T>,
  options: UseAsyncOptions<T> = {},
): UseAsyncReturn<T, Args> {
  const {
    showAlert = true,
    errorTitle = "Error",
    onSuccess,
    onError,
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(
    async (...args: Args): Promise<T> => {
      try {
        setLoading(true);
        setError(null);
        const result = await asyncFn(...args);
        setData(result);
        onSuccess?.(result);
        return result;
      } catch (err) {
        const errorObj = err as Error;
        const errorMessage = errorObj.message || "An error occurred";
        setError(errorObj);

        if (showAlert) {
          Alert.alert(errorTitle, errorMessage);
        }

        onError?.(errorObj);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [asyncFn, showAlert, errorTitle, onSuccess, onError],
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return { execute, loading, error, data, reset };
}

/**
 * Options for useLoadData hook.
 */
export interface UseLoadDataOptions<T> extends UseAsyncOptions<T> {
  /** Error title override (default: "Load Error") */
  errorTitle?: string;
}

/**
 * Return type for useLoadData hook.
 */
export interface UseLoadDataReturn<T> {
  /** Whether data is loading */
  loading: boolean;
  /** The error if load failed */
  error: Error | null;
  /** The loaded data */
  data: T | null;
  /** Reload the data */
  reload: () => Promise<void>;
}

/**
 * Simplified hook for loading data on component mount.
 *
 * @param loadFn - The async function to load data
 * @param options - Same options as useAsync
 * @returns Object with loading, error, data, and reload
 */
export function useLoadData<T>(
  loadFn: () => Promise<T>,
  options: UseLoadDataOptions<T> = {},
): UseLoadDataReturn<T> {
  const { execute, loading, error, data } = useAsync<T, []>(loadFn, {
    showAlert: true,
    errorTitle: "Load Error",
    ...options,
  });

  const reload = useCallback(async (): Promise<void> => {
    try {
      await execute();
    } catch {
      // Error already handled by useAsync
    }
  }, [execute]);

  return { loading, error, data, reload };
}
