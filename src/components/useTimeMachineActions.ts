import { useState, useCallback } from "react";
import { Platform, Alert } from "react-native";
import { DateData } from "react-native-calendars";
import { useTime } from "../context/TimeContext";
import { toLocalDateString } from "../utils/taskSorting";

interface UseTimeMachineActionsReturn {
  pendingDate: Date | null;
  pendingHour: number;
  pendingMinute: number;
  showConfirm: boolean;
  showReturnConfirm: boolean;
  hasPendingChange: boolean;
  futureCompletionsCount: number;
  loadingCount: boolean;
  isRevert: () => boolean;
  handleDayPress: (day: DateData) => void;
  handleTimeChange: (hour: number, minute: number) => void;
  handleQuickTravel: (days: number) => void;
  handleConfirmTravel: (deleteCompletions: boolean) => Promise<void>;
  handleReturnToPresent: (deleteCompletions: boolean) => Promise<void>;
  handleFullReset: (deleteCompletions: boolean) => Promise<void>;
  handleCancelPending: () => void;
  openConfirmModal: () => Promise<void>;
  openReturnConfirmModal: () => Promise<void>;
  setShowConfirm: (show: boolean) => void;
  setShowReturnConfirm: (show: boolean) => void;
}

export function useTimeMachineActions(
  onClose: () => void,
): UseTimeMachineActionsReturn {
  const {
    travelDate,
    resetToToday,
    fullReset,
    revertToDate,
    getFutureCompletionsCount,
  } = useTime();

  const [pendingDate, setPendingDate] = useState<Date | null>(null);
  const [pendingHour, setPendingHour] = useState(12);
  const [pendingMinute, setPendingMinute] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showReturnConfirm, setShowReturnConfirm] = useState(false);
  const [futureCompletionsCount, setFutureCompletionsCount] = useState(0);
  const [loadingCount, setLoadingCount] = useState(false);

  const isRevert = useCallback((): boolean => {
    if (!pendingDate || !travelDate) return false;
    return pendingDate.getTime() < travelDate.getTime();
  }, [pendingDate, travelDate]);

  const handleDayPress = useCallback(
    (day: DateData) => {
      const newDate = new Date(day.dateString + "T12:00:00");
      newDate.setHours(pendingHour, pendingMinute, 0, 0);
      setPendingDate(newDate);
    },
    [pendingHour, pendingMinute],
  );

  const handleTimeChange = useCallback(
    (hour: number, minute: number) => {
      setPendingHour(hour);
      setPendingMinute(minute);
      if (pendingDate) {
        const newDate = new Date(pendingDate);
        newDate.setHours(hour, minute, 0, 0);
        setPendingDate(newDate);
      }
    },
    [pendingDate],
  );

  const handleQuickTravel = useCallback((days: number) => {
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + days);
    newDate.setHours(12, 0, 0, 0);
    setPendingDate(newDate);
    setPendingHour(12);
    setPendingMinute(0);
  }, []);

  const showMessage = (title: string, message: string) => {
    if (Platform.OS === "web") {
      window.alert(message);
    } else {
      Alert.alert(title, message);
    }
  };

  // Open the confirm modal for travel/revert - fetches count if reverting
  const openConfirmModal = useCallback(async () => {
    if (!pendingDate) return;

    // Check if this is a revert (going to an earlier date)
    const isRevertAction =
      travelDate && pendingDate.getTime() < travelDate.getTime();

    if (isRevertAction) {
      // Fetch count of completions that would be affected
      setLoadingCount(true);
      try {
        const dateStr = toLocalDateString(pendingDate);
        const count = await getFutureCompletionsCount(dateStr);
        setFutureCompletionsCount(count);
      } catch {
        setFutureCompletionsCount(0);
      } finally {
        setLoadingCount(false);
      }
    } else {
      setFutureCompletionsCount(0);
    }

    setShowConfirm(true);
  }, [pendingDate, travelDate, getFutureCompletionsCount]);

  // Open the return to present confirm modal - fetches count
  const openReturnConfirmModal = useCallback(async () => {
    setLoadingCount(true);
    try {
      const count = await getFutureCompletionsCount();
      setFutureCompletionsCount(count);
    } catch {
      setFutureCompletionsCount(0);
    } finally {
      setLoadingCount(false);
    }
    setShowReturnConfirm(true);
  }, [getFutureCompletionsCount]);

  const handleConfirmTravel = useCallback(
    async (deleteCompletions: boolean) => {
      if (!pendingDate) return;
      try {
        const result = await revertToDate(pendingDate, deleteCompletions);
        setShowConfirm(false);
        setPendingDate(null);
        if (deleteCompletions && result.deletedCount > 0) {
          showMessage(
            "Time Travel",
            `Deleted ${result.deletedCount} completion${result.deletedCount === 1 ? "" : "s"}.`,
          );
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Failed to travel";
        showMessage("Error", msg);
      }
    },
    [pendingDate, revertToDate],
  );

  const handleReturnToPresent = useCallback(
    async (deleteCompletions: boolean) => {
      try {
        const result = await resetToToday(deleteCompletions);
        setShowReturnConfirm(false);
        setPendingDate(null);
        const message =
          deleteCompletions && result.deletedCount > 0
            ? `Deleted ${result.deletedCount} future completion${result.deletedCount === 1 ? "" : "s"}.`
            : "Returned to present.";
        showMessage("Returned to Present", message);
        onClose();
      } catch (error) {
        const msg =
          error instanceof Error
            ? error.message
            : "Failed to return to present";
        showMessage("Error", msg);
      }
    },
    [resetToToday, onClose],
  );

  const handleFullReset = useCallback(
    async (deleteCompletions: boolean) => {
      try {
        const result = await fullReset(deleteCompletions);
        setPendingDate(null);
        const message =
          deleteCompletions && result.deletedCount > 0
            ? `Full reset complete. Deleted ${result.deletedCount} future completion${result.deletedCount === 1 ? "" : "s"}.`
            : "Full reset complete. Timezone reset to device default.";
        showMessage("Full Reset", message);
        onClose();
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : "Failed to perform reset";
        showMessage("Error", msg);
      }
    },
    [fullReset, onClose],
  );

  const handleCancelPending = useCallback(() => {
    setPendingDate(null);
    setPendingHour(travelDate?.getHours() ?? 12);
    setPendingMinute(travelDate?.getMinutes() ?? 0);
  }, [travelDate]);

  return {
    pendingDate,
    pendingHour,
    pendingMinute,
    showConfirm,
    showReturnConfirm,
    hasPendingChange: pendingDate !== null,
    futureCompletionsCount,
    loadingCount,
    isRevert,
    handleDayPress,
    handleTimeChange,
    handleQuickTravel,
    handleConfirmTravel,
    handleReturnToPresent,
    handleFullReset,
    handleCancelPending,
    openConfirmModal,
    openReturnConfirmModal,
    setShowConfirm,
    setShowReturnConfirm,
  };
}
