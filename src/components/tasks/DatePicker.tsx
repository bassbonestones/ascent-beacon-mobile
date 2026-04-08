import React, { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import { Calendar, DateData } from "react-native-calendars";

interface DatePickerProps {
  value: string | null; // "YYYY-MM-DD" format or null
  onChange: (date: string | null) => void;
  label?: string;
  minDate?: string; // Optional minimum date "YYYY-MM-DD"
  maxDate?: string; // Optional maximum date "YYYY-MM-DD"
  placeholder?: string;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function DatePicker({
  value,
  onChange,
  label,
  minDate,
  maxDate,
  placeholder = "Tap to set date",
}: DatePickerProps): React.ReactElement {
  const [showPicker, setShowPicker] = useState(false);

  const handleDayPress = useCallback(
    (day: DateData) => {
      onChange(day.dateString);
      setShowPicker(false);
    },
    [onChange],
  );

  const handleClear = useCallback(() => {
    onChange(null);
    setShowPicker(false);
  }, [onChange]);

  const formatDisplayDate = (date: string | null): string => {
    if (!date) return placeholder;
    const [y, m, d] = date.split("-");
    const monthIndex = parseInt(m, 10) - 1;
    const monthName = MONTHS[monthIndex] || m;
    return `${monthName} ${parseInt(d, 10)}, ${y}`;
  };

  // Get today's date in LOCAL time for minDate
  // Using toISOString() would give UTC date, which after UTC midnight
  // would show tomorrow's date and disable today
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  return (
    <View>
      {label && <Text style={pickerStyles.label}>{label}</Text>}
      <TouchableOpacity
        style={pickerStyles.button}
        onPress={() => setShowPicker(true)}
        accessibilityLabel={`Select date: ${formatDisplayDate(value)}`}
        accessibilityRole="button"
      >
        <Text
          style={[pickerStyles.buttonText, !value && pickerStyles.placeholder]}
        >
          {formatDisplayDate(value)}
        </Text>
        <Text style={pickerStyles.buttonIcon}>📅</Text>
      </TouchableOpacity>

      <Modal visible={showPicker} animationType="slide" transparent>
        <View style={pickerStyles.overlay}>
          <View style={pickerStyles.container}>
            <View style={pickerStyles.header}>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={pickerStyles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={pickerStyles.title}>Select Date</Text>
              <View style={{ width: 60 }} />
            </View>

            <Calendar
              current={value || today}
              minDate={maxDate ? minDate : minDate || today}
              maxDate={maxDate}
              onDayPress={handleDayPress}
              markedDates={
                value
                  ? {
                      [value]: {
                        selected: true,
                        selectedColor: "#3B82F6",
                      },
                    }
                  : {}
              }
              renderArrow={(direction) => (
                <Text style={{ color: "#3B82F6", fontSize: 20 }}>
                  {direction === "left" ? "‹" : "›"}
                </Text>
              )}
              theme={{
                backgroundColor: "#1F2937",
                calendarBackground: "#1F2937",
                textSectionTitleColor: "#9CA3AF",
                selectedDayBackgroundColor: "#3B82F6",
                selectedDayTextColor: "#FFFFFF",
                todayTextColor: "#3B82F6",
                dayTextColor: "#F9FAFB",
                textDisabledColor: "#4B5563",
                dotColor: "#3B82F6",
                monthTextColor: "#F9FAFB",
                textMonthFontWeight: "600",
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14,
                arrowColor: "#3B82F6",
              }}
              style={pickerStyles.calendar}
            />

            {/* Clear button - only show if value exists */}
            {value && (
              <TouchableOpacity
                style={pickerStyles.clearButton}
                onPress={handleClear}
                accessibilityLabel="Clear date"
                accessibilityRole="button"
              >
                <Text style={pickerStyles.clearButtonText}>Clear Date</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const pickerStyles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9CA3AF",
    marginBottom: 8,
    marginTop: 8,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#374151",
    borderRadius: 8,
    padding: 12,
  },
  buttonText: {
    color: "#F9FAFB",
    fontSize: 14,
  },
  placeholder: {
    color: "#6B7280",
  },
  buttonIcon: {
    fontSize: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#1F2937",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#F9FAFB",
  },
  cancelText: {
    fontSize: 16,
    color: "#9CA3AF",
  },
  calendar: {
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 16,
  },
  clearButton: {
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#374151",
    alignItems: "center",
  },
  clearButtonText: {
    color: "#9CA3AF",
    fontSize: 14,
  },
});

export default DatePicker;
