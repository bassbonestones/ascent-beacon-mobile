import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
} from "react-native";

interface TimePickerProps {
  value: string | null; // "HH:MM" format or null
  onChange: (time: string | null) => void;
  label?: string;
}

export function TimePicker({
  value,
  onChange,
  label = "Scheduled Time",
}: TimePickerProps): React.ReactElement {
  const [showPicker, setShowPicker] = useState(false);
  const [hourInput, setHourInput] = useState(
    value ? value.split(":")[0] : "09",
  );
  const [minuteInput, setMinuteInput] = useState(
    value ? value.split(":")[1] : "00",
  );

  // Sync inputs when value prop changes
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(":");
      setHourInput(h);
      setMinuteInput(m);
    }
  }, [value]);

  const validateAndFormatHour = (input: string): string => {
    const num = parseInt(input, 10);
    if (isNaN(num) || num < 0) return "00";
    if (num > 23) return "23";
    return num.toString().padStart(2, "0");
  };

  const validateAndFormatMinute = (input: string): string => {
    const num = parseInt(input, 10);
    if (isNaN(num) || num < 0) return "00";
    if (num > 59) return "59";
    return num.toString().padStart(2, "0");
  };

  const handleHourChange = (text: string): void => {
    // Only allow digits
    const digitsOnly = text.replace(/[^0-9]/g, "");
    if (digitsOnly === "") {
      setHourInput("");
      return;
    }
    const num = parseInt(digitsOnly, 10);
    // Clamp to 0-23
    if (num > 23) {
      setHourInput("23");
    } else {
      setHourInput(digitsOnly);
    }
  };

  const handleMinuteChange = (text: string): void => {
    // Only allow digits
    const digitsOnly = text.replace(/[^0-9]/g, "");
    if (digitsOnly === "") {
      setMinuteInput("");
      return;
    }
    const num = parseInt(digitsOnly, 10);
    // Clamp to 0-59
    if (num > 59) {
      setMinuteInput("59");
    } else {
      setMinuteInput(digitsOnly);
    }
  };

  const isValidInput = (): boolean => {
    const hour = parseInt(hourInput, 10);
    const minute = parseInt(minuteInput, 10);
    return (
      !isNaN(hour) &&
      !isNaN(minute) &&
      hour >= 0 &&
      hour <= 23 &&
      minute >= 0 &&
      minute <= 59
    );
  };

  const handleSave = useCallback(() => {
    const hour = validateAndFormatHour(hourInput);
    const minute = validateAndFormatMinute(minuteInput);
    setHourInput(hour);
    setMinuteInput(minute);
    onChange(`${hour}:${minute}`);
    setShowPicker(false);
  }, [hourInput, minuteInput, onChange]);

  const handleClear = useCallback(() => {
    onChange(null);
    setShowPicker(false);
  }, [onChange]);

  const formatDisplayTime = (time: string | null): string => {
    if (!time) return "No time set";
    const [hour, minute] = time.split(":");
    const h = parseInt(hour, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayHour}:${minute} ${ampm}`;
  };

  const getPreviewTime = (): string => {
    const hour = validateAndFormatHour(hourInput);
    const minute = validateAndFormatMinute(minuteInput);
    return formatDisplayTime(`${hour}:${minute}`);
  };

  return (
    <View>
      <Text style={pickerStyles.label}>{label}</Text>
      <TouchableOpacity
        style={pickerStyles.button}
        onPress={() => setShowPicker(true)}
        accessibilityLabel={`Select time: ${formatDisplayTime(value)}`}
        accessibilityRole="button"
      >
        <Text style={pickerStyles.buttonText}>
          {value ? formatDisplayTime(value) : "Tap to set time"}
        </Text>
        <Text style={pickerStyles.buttonIcon}>🕐</Text>
      </TouchableOpacity>

      <Modal visible={showPicker} animationType="slide" transparent>
        <View style={pickerStyles.overlay}>
          <View style={pickerStyles.container}>
            <View style={pickerStyles.header}>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={pickerStyles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={pickerStyles.title}>Select Time</Text>
              <TouchableOpacity onPress={handleSave} disabled={!isValidInput()}>
                <Text
                  style={[
                    pickerStyles.saveText,
                    !isValidInput() && pickerStyles.saveTextDisabled,
                  ]}
                >
                  Save
                </Text>
              </TouchableOpacity>
            </View>

            <View style={pickerStyles.inputContainer}>
              {/* Hour input */}
              <View style={pickerStyles.inputColumn}>
                <Text style={pickerStyles.columnLabel}>Hour (0-23)</Text>
                <TextInput
                  style={pickerStyles.timeInput}
                  value={hourInput}
                  onChangeText={handleHourChange}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="09"
                  placeholderTextColor="#6B7280"
                  selectTextOnFocus
                  accessibilityLabel="Hour input"
                />
              </View>

              <Text style={pickerStyles.separator}>:</Text>

              {/* Minute input */}
              <View style={pickerStyles.inputColumn}>
                <Text style={pickerStyles.columnLabel}>Minute (0-59)</Text>
                <TextInput
                  style={pickerStyles.timeInput}
                  value={minuteInput}
                  onChangeText={handleMinuteChange}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="00"
                  placeholderTextColor="#6B7280"
                  selectTextOnFocus
                  accessibilityLabel="Minute input"
                />
              </View>
            </View>

            {/* Preview */}
            <View style={pickerStyles.preview}>
              <Text style={pickerStyles.previewLabel}>Preview:</Text>
              <Text style={pickerStyles.previewText}>{getPreviewTime()}</Text>
            </View>

            {/* Clear button */}
            <TouchableOpacity
              style={pickerStyles.clearButton}
              onPress={handleClear}
              accessibilityLabel="Clear time"
              accessibilityRole="button"
            >
              <Text style={pickerStyles.clearButtonText}>Clear Time</Text>
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
    marginTop: 16,
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
    gap: 12,
  },
  inputColumn: {
    alignItems: "center",
  },
  columnLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    marginBottom: 8,
  },
  timeInput: {
    backgroundColor: "#374151",
    color: "#F9FAFB",
    fontSize: 32,
    fontWeight: "600",
    textAlign: "center",
    width: 80,
    height: 64,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#4B5563",
  },
  separator: {
    fontSize: 32,
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

export default TimePicker;
