import React from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView } from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";

import { useTime } from "../context/TimeContext";
import { styles } from "./styles/timeMachineModalStyles";
import { TimePicker } from "./TimePicker";
import {
  TravelConfirmModal,
  ReturnConfirmModal,
} from "./TimeMachineConfirmModals";
import { TimeMachineStatus } from "./TimeMachineStatus";
import { useTimeMachineActions } from "./useTimeMachineActions";
import { toLocalDateString } from "../utils/taskSorting";

type Direction = "left" | "right";

interface TimeMachineModalProps {
  visible: boolean;
  onClose: () => void;
}

const formatDate = (date: Date | null): string => {
  const d = date || new Date();
  const dateStr = d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const h = d.getHours();
  const min = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${dateStr} at ${h12}:${min.toString().padStart(2, "0")} ${ampm}`;
};

const QUICK_TRAVEL_OPTIONS = [
  { days: 1, label: "+1 day" },
  { days: 7, label: "+1 week" },
  { days: 14, label: "+2 weeks" },
  { days: 30, label: "+1 month" },
];

export function TimeMachineModal({
  visible,
  onClose,
}: TimeMachineModalProps): React.ReactElement {
  const { travelDate, isTimeTravelActive } = useTime();
  const {
    pendingDate,
    pendingHour,
    pendingMinute,
    showConfirm,
    showReturnConfirm,
    hasPendingChange,
    isRevert,
    handleDayPress,
    handleTimeChange,
    handleQuickTravel,
    handleConfirmTravel,
    handleReturnToPresent,
    handleCancelPending,
    setShowConfirm,
    setShowReturnConfirm,
  } = useTimeMachineActions(onClose);

  const displayHour = pendingDate
    ? pendingHour
    : (travelDate?.getHours() ?? 12);
  const displayMinute = pendingDate
    ? pendingMinute
    : (travelDate?.getMinutes() ?? 0);

  const getDisplayDateString = (): string => {
    const date = pendingDate || travelDate || new Date();
    return toLocalDateString(date);
  };

  const markedDates = (() => {
    const marks: Record<string, { selected: boolean; selectedColor: string }> =
      {};
    const date = pendingDate || travelDate;
    if (date) {
      marks[toLocalDateString(date)] = {
        selected: true,
        selectedColor: pendingDate ? "#FF9800" : "#9C27B0",
      };
    }
    return marks;
  })();

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>⏰ Time Machine</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <TimeMachineStatus
              isTimeTravelActive={isTimeTravelActive}
              travelDateText={formatDate(travelDate)}
              pendingDateText={
                hasPendingChange ? formatDate(pendingDate) : null
              }
              showRevertWarning={isRevert()}
            />

            <View style={styles.quickActions}>
              <Text style={styles.sectionLabel}>Quick Travel</Text>
              <View style={styles.quickButtonsRow}>
                {QUICK_TRAVEL_OPTIONS.map(({ days, label }) => (
                  <TouchableOpacity
                    key={days}
                    style={styles.quickButton}
                    onPress={() => handleQuickTravel(days)}
                    accessibilityLabel={`Go forward ${label}`}
                  >
                    <Text style={styles.quickButtonText}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.calendarContainer}>
              <Text style={styles.sectionLabel}>Or pick a date</Text>
              <Calendar
                current={getDisplayDateString()}
                onDayPress={handleDayPress}
                markedDates={markedDates}
                minDate={toLocalDateString(new Date())}
                enableSwipeMonths
                renderArrow={(direction: Direction) => (
                  <Ionicons
                    name={
                      direction === "left" ? "chevron-back" : "chevron-forward"
                    }
                    size={20}
                    color="#9C27B0"
                  />
                )}
                theme={{
                  todayTextColor: "#4CAF50",
                  selectedDayBackgroundColor: "#9C27B0",
                  arrowColor: "#9C27B0",
                }}
              />
            </View>

            <TimePicker
              hour={displayHour}
              minute={displayMinute}
              onTimeChange={handleTimeChange}
            />

            <View style={styles.actions}>
              {hasPendingChange && (
                <>
                  <TouchableOpacity
                    style={styles.confirmTravelButton}
                    onPress={() => setShowConfirm(true)}
                    accessibilityLabel="Confirm travel"
                  >
                    <Text style={styles.confirmTravelButtonText}>
                      {isRevert()
                        ? "Revert to This Date"
                        : "Travel to This Date"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancelPending}
                    accessibilityLabel="Cancel selection"
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              )}
              {isTimeTravelActive && !hasPendingChange && (
                <TouchableOpacity
                  style={styles.returnButton}
                  onPress={() => setShowReturnConfirm(true)}
                  accessibilityLabel="Return to present"
                >
                  <Text style={styles.returnButtonText}>Return to Present</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </View>

      <TravelConfirmModal
        visible={showConfirm}
        isRevert={isRevert()}
        dateText={formatDate(pendingDate)}
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleConfirmTravel}
      />
      <ReturnConfirmModal
        visible={showReturnConfirm}
        onCancel={() => setShowReturnConfirm(false)}
        onConfirm={handleReturnToPresent}
      />
    </Modal>
  );
}
