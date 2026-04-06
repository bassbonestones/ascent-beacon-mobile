import { useState, useCallback } from "react";
import { Alert } from "react-native";

/**
 * Hook for handling async operations with loading and error states.
 *
 * @param {Function} asyncFn - The async function to execute
 * @param {Object} options - Configuration options
 * @param {boolean} options.showAlert - Whether to show an Alert on error (default: true)
 * @param {string} options.errorTitle - Title for the error alert (default: "Error")
 * @param {Function} options.onSuccess - Callback when operation succeeds
 * @param {Function} options.onError - Callback when operation fails
 * @returns {Object} { execute, loading, error, data, reset }
 */
export function useAsync(asyncFn, options = {}) {
  const {
    showAlert = true,
    errorTitle = "Error",
    onSuccess,
    onError,
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const execute = useCallback(
    async (...args) => {
      try {
        setLoading(true);
        setError(null);
        const result = await asyncFn(...args);
        setData(result);
        onSuccess?.(result);
        return result;
      } catch (err) {
        const errorMessage = err.message || "An error occurred";
        setError(err);

        if (showAlert) {
          Alert.alert(errorTitle, errorMessage);
        }

        onError?.(err);
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
 * Simplified hook for loading data on component mount.
 *
 * @param {Function} loadFn - The async function to load data
 * @param {Object} options - Same options as useAsync
 * @returns {Object} { loading, error, data, reload }
 */
export function useLoadData(loadFn, options = {}) {
  const { execute, loading, error, data } = useAsync(loadFn, {
    showAlert: true,
    errorTitle: "Load Error",
    ...options,
  });

  const reload = useCallback(async () => {
    try {
      await execute();
    } catch {
      // Error already handled by useAsync
    }
  }, [execute]);

  return { loading, error, data, reload };
}

export default useAsync;
