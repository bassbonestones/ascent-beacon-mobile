import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
} from "react-native";

interface DatePickerProps {
  value: string | null; // "YYYY-MM-DD" format or null
  onChange: (date: string | null) => void;
  label?: string;
  minDate?: string; // Optional minimum date
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
  label = "End Date",
  minDate,
}: DatePickerProps): React.ReactElement {
  const [showPicker, setShowPicker] = useState(false);

  // Initialize with value or tomorrow's date
  const getInitialDate = (): { year: string; month: string; day: string } => {
    if (value) {
      const [y, m, d] = value.split("-");
      return { year: y, month: m, day: d };
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return {
      year: tomorrow.getFullYear().toString(),
      month: (tomorrow.getMonth() + 1).toString().padStart(2, "0"),
      day: tomorrow.getDate().toString().padStart(2, "0"),
    };
  };

  const initial = getInitialDate();
  const [yearInput, setYearInput] = useState(initial.year);
  const [monthInput, setMonthInput] = useState(initial.month);
  const [dayInput, setDayInput] = useState(initial.day);

  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split("-");
      setYearInput(y);
      setMonthInput(m);
      setDayInput(d);
    }
  }, [value]);

  const validateDate = (
    y: string,
    m: string,
    d: string,
  ): { valid: boolean; year: number; month: number; day: number } => {
    const year = parseInt(y, 10);
    const month = parseInt(m, 10);
    const day = parseInt(d, 10);

    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      return { valid: false, year: 0, month: 0, day: 0 };
    }

    if (year < 2024 || year > 2100) return { valid: false, year, month, day };
    if (month < 1 || month > 12) return { valid: false, year, month, day };

    // Days in month
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day < 1 || day > daysInMonth) return { valid: false, year, month, day };

    // Check against minDate if provided
    if (minDate) {
      const selectedDate = new Date(year, month - 1, day);
      const minDateObj = new Date(minDate);
      if (selectedDate < minDateObj) return { valid: false, year, month, day };
    }

    return { valid: true, year, month, day };
  };

  const handleSave = useCallback(() => {
    const { valid, year, month, day } = validateDate(
      yearInput,
      monthInput,
      dayInput,
    );
    if (valid) {
      const formatted = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
      onChange(formatted);
      setShowPicker(false);
    }
  }, [yearInput, monthInput, dayInput, onChange, minDate]);

  const handleClear = useCallback(() => {
    onChange(null);
    setShowPicker(false);
  }, [onChange]);

  const formatDisplayDate = (date: string | null): string => {
    if (!date) return "No date set";
    const [y, m, d] = date.split("-");
    const monthIndex = parseInt(m, 10) - 1;
    const monthName = MONTHS[monthIndex] || m;
    return `${monthName} ${parseInt(d, 10)}, ${y}`;
  };

  const getPreviewDate = (): string => {
    const { valid, year, month, day } = validateDate(
      yearInput,
      monthInput,
      dayInput,
    );
    if (!valid) return "Invalid date";
    const formatted = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    return formatDisplayDate(formatted);
  };

  const isValid = validateDate(yearInput, monthInput, dayInput).valid;

  return (
    <View>
      {label && <Text style={pickerStyles.label}>{label}</Text>}
      <TouchableOpacity
        style={pickerStyles.button}
        onPress={() => setShowPicker(true)}
        accessibilityLabel={`Select date: ${formatDisplayDate(value)}`}
        accessibilityRole="button"
      >
        <Text style={pickerStyles.buttonText}>
          {value ? formatDisplayDate(value) : "Tap to set date"}
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
              <TouchableOpacity onPress={handleSave} disabled={!isValid}>
                <Text
                  style={[
                    pickerStyles.saveText,
                    !isValid && pickerStyles.saveTextDisabled,
                  ]}
                >
                  Save
                </Text>
              </TouchableOpacity>
            </View>

            <View style={pickerStyles.inputContainer}>
              {/* Month input */}
              <View style={pickerStyles.inputColumn}>
                <Text style={pickerStyles.columnLabel}>Month (1-12)</Text>
                <TextInput
                  style={pickerStyles.dateInput}
                  value={monthInput}
                  onChangeText={setMonthInput}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="MM"
                  placeholderTextColor="#6B7280"
                  selectTextOnFocus
                  accessibilityLabel="Month input"
                />
              </View>

              <Text style={pickerStyles.separator}>/</Text>

              {/* Day input */}
              <View style={pickerStyles.inputColumn}>
                <Text style={pickerStyles.columnLabel}>Day</Text>
                <TextInput
                  style={pickerStyles.dateInput}
                  value={dayInput}
                  onChangeText={setDayInput}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="DD"
                  placeholderTextColor="#6B7280"
                  selectTextOnFocus
                  accessibilityLabel="Day input"
                />
              </View>

              <Text style={pickerStyles.separator}>/</Text>

              {/* Year input */}
              <View style={pickerStyles.inputColumn}>
                <Text style={pickerStyles.columnLabel}>Year</Text>
                <TextInput
                  style={[pickerStyles.dateInput, pickerStyles.yearInput]}
                  value={yearInput}
                  onChangeText={setYearInput}
                  keyboardType="number-pad"
                  maxLength={4}
                  placeholder="YYYY"
                  placeholderTextColor="#6B7280"
                  selectTextOnFocus
                  accessibilityLabel="Year input"
                />
              </View>
            </View>

            {/* Preview */}
            <View style={pickerStyles.preview}>
              <Text style={pickerStyles.previewLabel}>Preview:</Text>
              <Text
                style={[
                  pickerStyles.previewText,
                  !isValid && pickerStyles.previewError,
                ]}
              >
                {getPreviewDate()}
              </Text>
            </View>

            {/* Clear button */}
            <TouchableOpacity
              style={pickerStyles.clearButton}
              onPress={handleClear}
              accessibilityLabel="Clear date"
              accessibilityRole="button"
            >
              <Text style={pickerStyles.clearButtonText}>Clear Date</Text>
            </TouchableOpacity>
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
  saveText: {
    fontSize: 16,
    color: "#60A5FA",
    fontWeight: "600",
  },
  saveTextDisabled: {
    color: "#4B5563",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 8,
  },
  inputColumn: {
    alignItems: "center",
  },
  columnLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    marginBottom: 8,
  },
  dateInput: {
    backgroundColor: "#374151",
    color: "#F9FAFB",
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    width: 60,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#4B5563",
  },
  yearInput: {
    width: 80,
  },
  separator: {
    fontSize: 24,
    color: "#F9FAFB",
    fontWeight: "600",
    marginTop: 20,
  },
  preview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  previewLabel: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  previewText: {
    color: "#F9FAFB",
    fontSize: 18,
    fontWeight: "600",
  },
  previewError: {
    color: "#EF4444",
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
