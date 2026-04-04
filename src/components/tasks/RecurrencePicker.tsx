import React, { useState, useCallback, useEffect } from "react";
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
  type IntradayMode,
  DAYS_OF_WEEK,
  FREQUENCIES,
  parseRRule,
  buildRRule,
  getFrequencyDescription,
} from "./rruleUtils";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";

interface RecurrencePickerProps {
  visible: boolean;
  onClose: () => void;
  onSave: (rrule: string, schedulingMode: SchedulingMode) => void;
  initialRRule?: string;
  initialSchedulingMode?: SchedulingMode | null;
  taskDurationMinutes?: number;
}

export function RecurrencePicker({
  visible,
  onClose,
  onSave,
  initialRRule,
  initialSchedulingMode,
  taskDurationMinutes = 0,
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

  // Helper to compare "HH:MM" times
  const isTimeAfter = (t1: string, t2: string): boolean => {
    const [h1, m1] = t1.split(":").map(Number);
    const [h2, m2] = t2.split(":").map(Number);
    return h1 * 60 + m1 > h2 * 60 + m2;
  };

  // Calculate max possible occurrences given window, interval, and task duration
  const getMaxPossibleOccurrences = (
    windowStart: string,
    windowEnd: string,
    intervalMinutes: number,
    durationMinutes: number,
  ): number => {
    // The effective interval is the max of interval and task duration
    const effectiveInterval = Math.max(intervalMinutes, durationMinutes);
    if (effectiveInterval <= 0) return 0;
    const [h1, m1] = windowStart.split(":").map(Number);
    const [h2, m2] = windowEnd.split(":").map(Number);
    const windowMinutes = h2 * 60 + m2 - (h1 * 60 + m1);
    if (windowMinutes <= 0) return 0;
    // First occurrence at start, then add one every interval until we exceed the window
    return Math.floor(windowMinutes / effectiveInterval) + 1;
  };

  // Check if interval is valid (must be >= task duration)
  const isIntervalValid =
    state.intradayMode !== "interval" ||
    taskDurationMinutes <= 0 ||
    state.intervalMinutes >= taskDurationMinutes;

  const maxPossibleOccurrences =
    state.intradayMode === "interval" && state.intervalMinutes > 0
      ? getMaxPossibleOccurrences(
          state.windowStart,
          state.windowEnd,
          state.intervalMinutes,
          taskDurationMinutes,
        )
      : 0;

  // Auto-clamp dailyOccurrences if it exceeds the max possible when window/interval changes
  useEffect(() => {
    if (
      maxPossibleOccurrences > 0 &&
      state.dailyOccurrences > maxPossibleOccurrences
    ) {
      setState((p) => ({
        ...p,
        dailyOccurrences: maxPossibleOccurrences,
      }));
    }
  }, [maxPossibleOccurrences, state.dailyOccurrences]);

  const isValidWindow =
    state.intradayMode !== "interval" && state.intradayMode !== "window"
      ? true
      : isTimeAfter(state.windowEnd, state.windowStart);

  const canSave =
    (state.endCondition === "never" ||
      (state.endCondition === "count" && state.count > 0) ||
      (state.endCondition === "until" && state.until !== "")) &&
    // Intra-day validation
    (state.intradayMode === "single" ||
      (state.intradayMode === "window" && isValidWindow) ||
      (state.intradayMode === "anytime" && state.dailyOccurrences > 0) ||
      (state.intradayMode === "specific_times" &&
        state.specificTimes.length > 0) ||
      (state.intradayMode === "interval" &&
        state.intervalMinutes > 0 &&
        isValidWindow &&
        isIntervalValid));

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

  const formatTime12h = (time: string): string => {
    if (!time) return "";
    const [hour, minute] = time.split(":");
    const h = parseInt(hour, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayHour}:${minute} ${ampm}`;
  };

  const addSpecificTime = (time: string) => {
    if (!state.specificTimes.includes(time)) {
      const newTimes = [...state.specificTimes, time].sort();
      setState((p) => ({ ...p, specificTimes: newTimes }));
    }
  };

  const removeSpecificTime = (time: string) => {
    setState((p) => ({
      ...p,
      specificTimes: p.specificTimes.filter((t) => t !== time),
    }));
  };

  const [showAddTime, setShowAddTime] = useState(false);
  const [newTimeValue, setNewTimeValue] = useState<string | null>(null);

  const INTRADAY_MODES: { key: IntradayMode; label: string; desc: string }[] = [
    { key: "single", label: "One time", desc: "Set time in main form" },
    { key: "anytime", label: "X times/day", desc: "Mark off as you go" },
    {
      key: "specific_times",
      label: "Multiple times",
      desc: "At specific times",
    },
    { key: "interval", label: "Every X min", desc: "Within a time window" },
    { key: "window", label: "Flexible", desc: "Anytime within window" },
  ];

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

            {/* Intra-day timing */}
            <Text style={pickerStyles.sectionTitle}>Times per day</Text>
            <View style={pickerStyles.optionRow}>
              {INTRADAY_MODES.map((mode) => (
                <TouchableOpacity
                  key={mode.key}
                  style={[
                    pickerStyles.intradayOption,
                    state.intradayMode === mode.key &&
                      pickerStyles.intradayOptionActive,
                  ]}
                  onPress={() =>
                    setState((p) => ({ ...p, intradayMode: mode.key }))
                  }
                  accessibilityRole="radio"
                >
                  <Text
                    style={[
                      pickerStyles.intradayLabel,
                      state.intradayMode === mode.key &&
                        pickerStyles.intradayLabelActive,
                    ]}
                  >
                    {mode.label}
                  </Text>
                  <Text style={pickerStyles.intradayDesc}>{mode.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Anytime mode - daily occurrences */}
            {state.intradayMode === "anytime" && (
              <View style={pickerStyles.intradayConfig}>
                <Text style={pickerStyles.configLabel}>
                  How many times per day?
                </Text>
                <TextInput
                  style={pickerStyles.intradayInput}
                  value={
                    state.dailyOccurrences > 0
                      ? String(state.dailyOccurrences)
                      : ""
                  }
                  onChangeText={(v) => {
                    const num = parseInt(v, 10);
                    setState((p) => ({
                      ...p,
                      dailyOccurrences: isNaN(num) || num < 1 ? 0 : num,
                    }));
                  }}
                  placeholder="e.g. 8"
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                />
              </View>
            )}

            {/* Specific times mode */}
            {state.intradayMode === "specific_times" && (
              <View style={pickerStyles.intradayConfig}>
                <Text style={pickerStyles.configLabel}>At these times:</Text>
                <View style={pickerStyles.timesContainer}>
                  {state.specificTimes.map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={pickerStyles.timeChip}
                      onPress={() => removeSpecificTime(time)}
                    >
                      <Text style={pickerStyles.timeChipText}>
                        {formatTime12h(time)}
                      </Text>
                      <Text style={pickerStyles.timeChipRemove}>✕</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={pickerStyles.addTimeButton}
                    onPress={() => setShowAddTime(true)}
                  >
                    <Text style={pickerStyles.addTimeText}>+ Add time</Text>
                  </TouchableOpacity>
                </View>
                {showAddTime && (
                  <View style={pickerStyles.addTimeContainer}>
                    <TimePicker
                      value={newTimeValue}
                      onChange={(time) => {
                        if (time) {
                          addSpecificTime(time);
                          setNewTimeValue(null);
                        }
                        setShowAddTime(false);
                      }}
                      label=""
                    />
                  </View>
                )}
              </View>
            )}

            {/* Interval mode */}
            {state.intradayMode === "interval" && (
              <View style={pickerStyles.intradayConfig}>
                <Text style={pickerStyles.configLabel}>
                  Every how many minutes?
                  {taskDurationMinutes > 0
                    ? ` (min ${taskDurationMinutes} for ${taskDurationMinutes}min task)`
                    : ""}
                </Text>
                <TextInput
                  style={pickerStyles.intradayInput}
                  value={
                    state.intervalMinutes > 0
                      ? String(state.intervalMinutes)
                      : ""
                  }
                  onChangeText={(v) => {
                    const num = parseInt(v, 10);
                    setState((p) => ({
                      ...p,
                      intervalMinutes: isNaN(num) || num < 1 ? 0 : num,
                    }));
                  }}
                  placeholder={
                    taskDurationMinutes > 0
                      ? `min ${taskDurationMinutes}`
                      : "e.g. 45"
                  }
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                />
                {!isIntervalValid && (
                  <Text style={pickerStyles.windowError}>
                    Interval must be at least {taskDurationMinutes} minutes
                    (task duration)
                  </Text>
                )}
                <Text style={pickerStyles.configLabel}>Between:</Text>
                <View style={pickerStyles.windowRow}>
                  <View style={pickerStyles.windowInput}>
                    <Text style={pickerStyles.windowLabel}>Start</Text>
                    <TimePicker
                      value={state.windowStart}
                      onChange={(time) =>
                        setState((p) => ({
                          ...p,
                          windowStart: time || "09:00",
                        }))
                      }
                      label=""
                    />
                  </View>
                  <Text style={pickerStyles.windowSeparator}>to</Text>
                  <View style={pickerStyles.windowInput}>
                    <Text style={pickerStyles.windowLabel}>End</Text>
                    <TimePicker
                      value={state.windowEnd}
                      onChange={(time) =>
                        setState((p) => ({ ...p, windowEnd: time || "21:00" }))
                      }
                      label=""
                    />
                  </View>
                </View>
                {!isValidWindow && (
                  <Text style={pickerStyles.windowError}>
                    End time must be after start time
                  </Text>
                )}
                <Text style={pickerStyles.configLabel}>
                  Max occurrences per day
                  {maxPossibleOccurrences > 0
                    ? ` (up to ${maxPossibleOccurrences} possible):`
                    : " (optional):"}
                </Text>
                <TextInput
                  style={pickerStyles.intradayInput}
                  value={
                    state.dailyOccurrences > 0
                      ? String(state.dailyOccurrences)
                      : ""
                  }
                  onChangeText={(v) => {
                    const num = parseInt(v, 10);
                    // Clamp to max possible if set
                    const clamped =
                      maxPossibleOccurrences > 0 && num > maxPossibleOccurrences
                        ? maxPossibleOccurrences
                        : num;
                    setState((p) => ({
                      ...p,
                      dailyOccurrences:
                        isNaN(clamped) || clamped < 0 ? 0 : clamped,
                    }));
                  }}
                  placeholder={
                    maxPossibleOccurrences > 0
                      ? `Max ${maxPossibleOccurrences}`
                      : "No limit"
                  }
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                />
              </View>
            )}

            {/* Window mode */}
            {state.intradayMode === "window" && (
              <View style={pickerStyles.intradayConfig}>
                <Text style={pickerStyles.configLabel}>
                  Complete anytime between:
                </Text>
                <View style={pickerStyles.windowRow}>
                  <View style={pickerStyles.windowInput}>
                    <Text style={pickerStyles.windowLabel}>Start</Text>
                    <TimePicker
                      value={state.windowStart}
                      onChange={(time) =>
                        setState((p) => ({
                          ...p,
                          windowStart: time || "09:00",
                        }))
                      }
                      label=""
                    />
                  </View>
                  <Text style={pickerStyles.windowSeparator}>to</Text>
                  <View style={pickerStyles.windowInput}>
                    <Text style={pickerStyles.windowLabel}>End</Text>
                    <TimePicker
                      value={state.windowEnd}
                      onChange={(time) =>
                        setState((p) => ({ ...p, windowEnd: time || "21:00" }))
                      }
                      label=""
                    />
                  </View>
                </View>
                {!isValidWindow && (
                  <Text style={pickerStyles.windowError}>
                    End time must be after start time
                  </Text>
                )}
              </View>
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
