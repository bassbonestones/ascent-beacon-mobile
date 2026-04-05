import { useState, useCallback } from "react";
import { Platform, Alert } from "react-native";
import { DateData } from "react-native-calendars";
import { useTime } from "../context/TimeContext";

interface UseTimeMachineActionsReturn {
  pendingDate: Date | null;
  pendingHour: number;
  pendingMinute: number;
  showConfirm: boolean;
  showReturnConfirm: boolean;
  hasPendingChange: boolean;
  isRevert: () => boolean;
  handleDayPress: (day: DateData) => void;
  handleTimeChange: (hour: number, minute: number) => void;
  handleQuickTravel: (days: number) => void;
  handleConfirmTravel: () => Promise<void>;
  handleReturnToPresent: () => Promise<void>;
  handleCancelPending: () => void;
  setShowConfirm: (show: boolean) => void;
  setShowReturnConfirm: (show: boolean) => void;
}

export function useTimeMachineActions(
  onClose: () => void,
): UseTimeMachineActionsReturn {
  const { travelDate, resetToToday, revertToDate } = useTime();

  const [pendingDate, setPendingDate] = useState<Date | null>(null);
  const [pendingHour, setPendingHour] = useState(12);
  const [pendingMinute, setPendingMinute] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showReturnConfirm, setShowReturnConfirm] = useState(false);

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

  const handleConfirmTravel = useCallback(async () => {
    if (!pendingDate) return;
    try {
      const result = await revertToDate(pendingDate);
      setShowConfirm(false);
      setPendingDate(null);
      if (isRevert() && result.deletedCount > 0) {
        showMessage(
          "Time Travel",
          `Deleted ${result.deletedCount} completion${result.deletedCount === 1 ? "" : "s"}.`,
        );
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to travel";
      showMessage("Error", msg);
    }
  }, [pendingDate, isRevert, revertToDate]);

  const handleReturnToPresent = useCallback(async () => {
    try {
      const result = await resetToToday();
      setShowReturnConfirm(false);
      setPendingDate(null);
      const message =
        result.deletedCount > 0
          ? `Deleted ${result.deletedCount} future completion${result.deletedCount === 1 ? "" : "s"}.`
          : "Returned to present.";
      showMessage("Returned to Present", message);
      onClose();
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Failed to return to present";
      showMessage("Error", msg);
    }
  }, [resetToToday, onClose]);

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
    isRevert,
    handleDayPress,
    handleTimeChange,
    handleQuickTravel,
    handleConfirmTravel,
    handleReturnToPresent,
    handleCancelPending,
    setShowConfirm,
    setShowReturnConfirm,
  };
}
