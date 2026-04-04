import { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Alert } from "react-native";

/**
 * Hook that fetches data when the screen gains focus.
 * Combines initial load with focus-based refresh.
 *
 * @param {Function} fetchFn - The async function to fetch data
 * @param {Object} options - Configuration options
 * @param {boolean} options.loadOnMount - Whether to load on initial mount (default: true)
 * @param {boolean} options.reloadOnFocus - Whether to reload when screen regains focus (default: true)
 * @param {boolean} options.showAlert - Whether to show Alert on error (default: true)
 * @param {string} options.errorTitle - Title for error alerts (default: "Error")
 * @param {*} options.initialData - Initial data value (default: null)
 * @returns {Object} { data, loading, error, reload }
 */
export function useFetchOnFocus(fetchFn, options = {}) {
  const {
    loadOnMount = true,
    reloadOnFocus = true,
    showAlert = true,
    errorTitle = "Error",
    initialData = null,
  } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(loadOnMount);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err.message || "Failed to load data";
      setError(err);

      if (showAlert) {
        Alert.alert(errorTitle, errorMessage);
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

  const reload = useCallback(async () => {
    try {
      return await fetchData();
    } catch {
      // Error already handled
      return null;
    }
  }, [fetchData]);

  return { data, loading, error, reload };
}

export default useFetchOnFocus;
