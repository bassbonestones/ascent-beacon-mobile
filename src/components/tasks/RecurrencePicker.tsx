import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import type { SchedulingMode } from "../../types";
import { recurrencePickerStyles as pickerStyles } from "./recurrencePickerStyles";
import {
  type DayOfWeek,
  type RecurrenceState,
  DAYS_OF_WEEK,
  FREQUENCIES,
  parseRRule,
  buildRRule,
  getFrequencyDescription,
} from "./rruleUtils";
import { DatePicker } from "./DatePicker";

interface RecurrencePickerProps {
  visible: boolean;
  onClose: () => void;
  onSave: (rrule: string, schedulingMode: SchedulingMode) => void;
  initialRRule?: string;
  initialSchedulingMode?: SchedulingMode | null;
}

export function RecurrencePicker({
  visible,
  onClose,
  onSave,
  initialRRule,
  initialSchedulingMode,
}: RecurrencePickerProps): React.ReactElement {
  const [state, setState] = useState<RecurrenceState>(() =>
    parseRRule(initialRRule),
  );
  const [schedulingMode, setSchedulingMode] = useState<SchedulingMode>(
    initialSchedulingMode || "floating",
  );

  const handleSave = useCallback(() => {
    // Validate: if count is selected, must have a valid count
    if (state.endCondition === "count" && state.count < 1) {
      return; // Don't save with invalid count
    }
    // Validate: if until is selected, must have a valid date
    if (state.endCondition === "until" && !state.until) {
      return; // Don't save without a date
    }
    onSave(buildRRule(state), schedulingMode);
    onClose();
  }, [state, schedulingMode, onSave, onClose]);

  const canSave =
    state.endCondition === "never" ||
    (state.endCondition === "count" && state.count > 0) ||
    (state.endCondition === "until" && state.until !== "");

  const toggleDay = useCallback((day: DayOfWeek) => {
    setState((prev) => ({
      ...prev,
      byDay: prev.byDay.includes(day)
        ? prev.byDay.filter((d) => d !== day)
        : [...prev.byDay, day],
    }));
  }, []);

  const formatUntilDate = (dateStr: string): string => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const monthIndex = parseInt(m, 10) - 1;
    return `${months[monthIndex]} ${parseInt(d, 10)}, ${y}`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={pickerStyles.overlay}>
        <View style={pickerStyles.container}>
          <View style={pickerStyles.header}>
            <TouchableOpacity onPress={onClose} accessibilityRole="button">
              <Text style={pickerStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={pickerStyles.title}>Recurrence</Text>
            <TouchableOpacity
              onPress={handleSave}
              disabled={!canSave}
              accessibilityRole="button"
            >
              <Text
                style={[
                  pickerStyles.saveText,
                  !canSave && pickerStyles.saveTextDisabled,
                ]}
              >
                Save
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={pickerStyles.content}>
            {/* Frequency */}
            <Text style={pickerStyles.sectionTitle}>Repeat</Text>
            <View style={pickerStyles.optionRow}>
              {FREQUENCIES.map((freq) => (
                <TouchableOpacity
                  key={freq.key}
                  style={[
                    pickerStyles.optionButton,
                    state.frequency === freq.key &&
                      pickerStyles.optionButtonActive,
                  ]}
                  onPress={() =>
                    setState((p) => ({ ...p, frequency: freq.key }))
                  }
                  accessibilityRole="radio"
                  accessibilityLabel={freq.label}
                >
                  <Text
                    style={[
                      pickerStyles.optionText,
                      state.frequency === freq.key &&
                        pickerStyles.optionTextActive,
                    ]}
                  >
                    {freq.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Interval */}
            <Text style={pickerStyles.sectionTitle}>Every</Text>
            <View style={pickerStyles.intervalRow}>
              <TextInput
                style={pickerStyles.intervalInput}
                value={String(state.interval)}
                onChangeText={(v) =>
                  setState((p) => ({ ...p, interval: parseInt(v, 10) || 1 }))
                }
                keyboardType="numeric"
                accessibilityLabel="Interval number"
              />
              <Text style={pickerStyles.intervalLabel}>
                {state.interval === 1
                  ? FREQUENCIES.find(
                      (f) => f.key === state.frequency,
                    )?.label.toLowerCase()
                  : FREQUENCIES.find((f) => f.key === state.frequency)?.plural}
              </Text>
            </View>

            {/* Days of week (for weekly) */}
            {state.frequency === "WEEKLY" && (
              <>
                <Text style={pickerStyles.sectionTitle}>On days</Text>
                <View style={pickerStyles.daysRow}>
                  {DAYS_OF_WEEK.map((day) => (
                    <TouchableOpacity
                      key={day.key}
                      style={[
                        pickerStyles.dayButton,
                        state.byDay.includes(day.key) &&
                          pickerStyles.dayButtonActive,
                      ]}
                      onPress={() => toggleDay(day.key)}
                      accessibilityRole="checkbox"
                      accessibilityLabel={day.label}
                    >
                      <Text
                        style={[
                          pickerStyles.dayText,
                          state.byDay.includes(day.key) &&
                            pickerStyles.dayTextActive,
                        ]}
                      >
                        {day.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Scheduling Mode */}
            <Text style={pickerStyles.sectionTitle}>Time handling</Text>
            <TouchableOpacity
              style={[
                pickerStyles.modeOption,
                schedulingMode === "floating" && pickerStyles.modeOptionActive,
              ]}
              onPress={() => setSchedulingMode("floating")}
              accessibilityRole="radio"
            >
              <Text style={pickerStyles.modeTitle}>🌍 Time-of-day</Text>
              <Text style={pickerStyles.modeDesc}>
                Adjusts to timezone (e.g. 7am where you are that day)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                pickerStyles.modeOption,
                schedulingMode === "fixed" && pickerStyles.modeOptionActive,
              ]}
              onPress={() => setSchedulingMode("fixed")}
              accessibilityRole="radio"
            >
              <Text style={pickerStyles.modeTitle}>📍 Fixed time</Text>
              <Text style={pickerStyles.modeDesc}>
                Always at the exact time (e.g. 7am EST)
              </Text>
            </TouchableOpacity>

            {/* End condition */}
            <Text style={pickerStyles.sectionTitle}>Ends</Text>
            <TouchableOpacity
              style={[
                pickerStyles.endOption,
                state.endCondition === "never" && pickerStyles.endOptionActive,
              ]}
              onPress={() => setState((p) => ({ ...p, endCondition: "never" }))}
              accessibilityRole="radio"
            >
              <Text style={pickerStyles.endOptionText}>Never</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                pickerStyles.endOption,
                state.endCondition === "count" && pickerStyles.endOptionActive,
              ]}
              onPress={() => setState((p) => ({ ...p, endCondition: "count" }))}
              accessibilityRole="radio"
            >
              <Text style={pickerStyles.endOptionText}>
                After {state.count > 0 ? state.count : "X"} times
              </Text>
            </TouchableOpacity>
            {state.endCondition === "count" && (
              <TextInput
                style={pickerStyles.endInput}
                value={state.count > 0 ? String(state.count) : ""}
                onChangeText={(v) => {
                  const num = parseInt(v, 10);
                  setState((p) => ({
                    ...p,
                    count: isNaN(num) || num < 1 ? 0 : num,
                  }));
                }}
                placeholder="Enter number"
                placeholderTextColor="#6B7280"
                keyboardType="numeric"
                accessibilityLabel="Number of occurrences"
              />
            )}
            <TouchableOpacity
              style={[
                pickerStyles.endOption,
                state.endCondition === "until" && pickerStyles.endOptionActive,
              ]}
              onPress={() => setState((p) => ({ ...p, endCondition: "until" }))}
              accessibilityRole="radio"
            >
              <Text style={pickerStyles.endOptionText}>
                On date {state.until ? `(${formatUntilDate(state.until)})` : ""}
              </Text>
            </TouchableOpacity>
            {state.endCondition === "until" && (
              <DatePicker
                value={state.until || null}
                onChange={(date) =>
                  setState((p) => ({ ...p, until: date || "" }))
                }
                label=""
              />
            )}

            {/* Preview */}
            <View style={pickerStyles.preview}>
              <Text style={pickerStyles.previewLabel}>Summary:</Text>
              <Text style={pickerStyles.previewText}>
                {getFrequencyDescription(state)}
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default RecurrencePicker;
