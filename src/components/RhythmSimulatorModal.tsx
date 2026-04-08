import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";

import api from "../services/api";
import type { Task, BulkCompletionEntry, TaskListResponse } from "../types";
import { showAlert, showConfirm } from "../utils/alert";
import { toLocalDateString } from "../utils/taskSorting";
import { DatePicker } from "./tasks/DatePicker";
import { parseRRule } from "./tasks/rruleUtils";

interface RhythmSimulatorModalProps {
  visible: boolean;
  onClose: () => void;
  onDataChanged?: () => void;
}

// State for each occurrence: none | completed | skipped
type OccurrenceState = "none" | "completed" | "skipped";

// Key format: "YYYY-MM-DD:occIdx" e.g. "2026-04-08:0", "2026-04-08:1"
type OccurrenceStates = Record<string, OccurrenceState>;

// Colors for states
const STATE_COLORS = {
  none: "#E5E7EB", // gray
  completed: "#22C55E", // green
  skipped: "#F97316", // orange
};

const STATE_LABELS = {
  none: "None",
  completed: "Done",
  skipped: "Skip",
};

// Cycle to next state
function cycleState(current: OccurrenceState): OccurrenceState {
  if (current === "none") return "completed";
  if (current === "completed") return "skipped";
  return "none";
}

// Get week number for a date (Monday start)
function getWeekKey(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  return toLocalDateString(d);
}

// Get week label
function getWeekLabel(weekStart: string): string {
  const d = new Date(weekStart + "T00:00:00");
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const day = d.getDate();
  return `Week of ${month} ${day}`;
}

// Get month label
function getMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  const d = new Date(parseInt(year), parseInt(month) - 1, 1);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// Day of week labels
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface StateToggleBoxProps {
  state: OccurrenceState;
  onToggle: () => void;
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  testID?: string;
}

function StateToggleBox({
  state,
  onToggle,
  size = "medium",
  disabled = false,
  testID,
}: StateToggleBoxProps): React.ReactElement {
  const sizeStyles = {
    small: { width: 20, height: 20, borderRadius: 4 },
    medium: { width: 28, height: 28, borderRadius: 6 },
    large: { width: 36, height: 36, borderRadius: 8 },
  };

  return (
    <TouchableOpacity
      onPress={onToggle}
      disabled={disabled}
      testID={testID}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: state !== "none" }}
      accessibilityLabel={`Toggle state: ${STATE_LABELS[state]}`}
      style={[
        styles.toggleBox,
        sizeStyles[size],
        { backgroundColor: STATE_COLORS[state] },
        disabled && styles.toggleBoxDisabled,
      ]}
    >
      {state === "completed" && (
        <Ionicons
          name="checkmark"
          size={size === "small" ? 12 : 18}
          color="#fff"
        />
      )}
      {state === "skipped" && (
        <Ionicons
          name="remove"
          size={size === "small" ? 12 : 18}
          color="#fff"
        />
      )}
    </TouchableOpacity>
  );
}

export function RhythmSimulatorModal({
  visible,
  onClose,
  onDataChanged,
}: RhythmSimulatorModalProps): React.ReactElement {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [occurrenceStates, setOccurrenceStates] = useState<OccurrenceStates>(
    {},
  );
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());

  // Fetch tasks when modal opens
  useEffect(() => {
    if (visible && tasks.length === 0) {
      setLoadingTasks(true);
      api
        .getTasks({ include_completed: true })
        .then((response: TaskListResponse) => {
          setTasks(response.tasks);
        })
        .catch(() => {
          showAlert("Error", "Failed to load tasks");
        })
        .finally(() => {
          setLoadingTasks(false);
        });
    }
  }, [visible, tasks.length]);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setSelectedTaskId("");
      setStartDate(null);
      setOccurrenceStates({});
      setExpandedMonths(new Set());
      setExpandedWeeks(new Set());
    }
  }, [visible]);

  // Filter to recurring tasks only
  const recurringTasks = useMemo(
    () => tasks.filter((t) => t.is_recurring),
    [tasks],
  );

  const selectedTask = useMemo(
    () => recurringTasks.find((t) => t.id === selectedTaskId),
    [recurringTasks, selectedTaskId],
  );

  // Parse occurrence count from recurrence rule
  const occurrencesPerDay = useMemo(() => {
    if (!selectedTask?.recurrence_rule) return 1;
    const parsed = parseRRule(selectedTask.recurrence_rule);
    return parsed.dailyOccurrences || 1;
  }, [selectedTask]);

  // Calculate date range
  const today = toLocalDateString(new Date());
  const effectiveStartDate = startDate || selectedTask?.scheduled_date || today;

  // Build hierarchical data structure
  const hierarchyData = useMemo(() => {
    if (!selectedTask || !effectiveStartDate) return { months: [] };

    const startD = new Date(effectiveStartDate + "T00:00:00");
    const todayD = new Date(today + "T00:00:00");

    // Group by month, then week, then day
    const monthsMap = new Map<
      string,
      {
        yearMonth: string;
        weeks: Map<
          string,
          {
            weekStart: string;
            days: { date: string; dayOfWeek: number }[];
          }
        >;
      }
    >();

    const current = new Date(startD);
    while (current <= todayD) {
      const dateStr = toLocalDateString(current);
      const yearMonth = dateStr.substring(0, 7); // YYYY-MM
      const weekStart = getWeekKey(current);

      if (!monthsMap.has(yearMonth)) {
        monthsMap.set(yearMonth, { yearMonth, weeks: new Map() });
      }

      const monthData = monthsMap.get(yearMonth)!;
      if (!monthData.weeks.has(weekStart)) {
        monthData.weeks.set(weekStart, { weekStart, days: [] });
      }

      monthData.weeks.get(weekStart)!.days.push({
        date: dateStr,
        dayOfWeek: current.getDay(),
      });

      current.setDate(current.getDate() + 1);
    }

    // Convert to array
    const months = Array.from(monthsMap.values()).map((m) => ({
      yearMonth: m.yearMonth,
      weeks: Array.from(m.weeks.values()),
    }));

    return { months };
  }, [selectedTask, effectiveStartDate, today]);

  // Get state for an occurrence
  const getOccState = useCallback(
    (date: string, occIdx: number): OccurrenceState => {
      return occurrenceStates[`${date}:${occIdx}`] || "none";
    },
    [occurrenceStates],
  );

  // Set state for an occurrence
  const setOccState = useCallback(
    (date: string, occIdx: number, state: OccurrenceState) => {
      const key = `${date}:${occIdx}`;
      setOccurrenceStates((prev) => {
        if (state === "none") {
          const newState = { ...prev };
          delete newState[key];
          return newState;
        }
        return { ...prev, [key]: state };
      });
    },
    [],
  );

  // Toggle single occurrence
  const toggleOccurrence = useCallback(
    (date: string, occIdx: number) => {
      const current = getOccState(date, occIdx);
      setOccState(date, occIdx, cycleState(current));
    },
    [getOccState, setOccState],
  );

  // Get aggregated state for a day (all occurrences)
  const getDayState = useCallback(
    (date: string): OccurrenceState => {
      const states = [];
      for (let i = 0; i < occurrencesPerDay; i++) {
        states.push(getOccState(date, i));
      }
      // All same = that state, mixed = none
      const allCompleted = states.every((s) => s === "completed");
      const allSkipped = states.every((s) => s === "skipped");
      if (allCompleted) return "completed";
      if (allSkipped) return "skipped";
      return "none";
    },
    [getOccState, occurrencesPerDay],
  );

  // Toggle all occurrences in a day
  const toggleDay = useCallback(
    (date: string) => {
      const current = getDayState(date);
      const next = cycleState(current);
      for (let i = 0; i < occurrencesPerDay; i++) {
        setOccState(date, i, next);
      }
    },
    [getDayState, occurrencesPerDay, setOccState],
  );

  // Get aggregated state for a week
  const getWeekState = useCallback(
    (days: { date: string }[]): OccurrenceState => {
      const dayStates = days.map((d) => getDayState(d.date));
      const allCompleted = dayStates.every((s) => s === "completed");
      const allSkipped = dayStates.every((s) => s === "skipped");
      if (allCompleted) return "completed";
      if (allSkipped) return "skipped";
      return "none";
    },
    [getDayState],
  );

  // Toggle all days in a week
  const toggleWeek = useCallback(
    (days: { date: string }[]) => {
      const current = getWeekState(days);
      const next = cycleState(current);
      for (const day of days) {
        for (let i = 0; i < occurrencesPerDay; i++) {
          setOccState(day.date, i, next);
        }
      }
    },
    [getWeekState, occurrencesPerDay, setOccState],
  );

  // Get aggregated state for a month
  const getMonthState = useCallback(
    (weeks: { days: { date: string }[] }[]): OccurrenceState => {
      const allDays = weeks.flatMap((w) => w.days);
      const dayStates = allDays.map((d) => getDayState(d.date));
      const allCompleted = dayStates.every((s) => s === "completed");
      const allSkipped = dayStates.every((s) => s === "skipped");
      if (allCompleted) return "completed";
      if (allSkipped) return "skipped";
      return "none";
    },
    [getDayState],
  );

  // Toggle all days in a month
  const toggleMonth = useCallback(
    (weeks: { days: { date: string }[] }[]) => {
      const current = getMonthState(weeks);
      const next = cycleState(current);
      for (const week of weeks) {
        for (const day of week.days) {
          for (let i = 0; i < occurrencesPerDay; i++) {
            setOccState(day.date, i, next);
          }
        }
      }
    },
    [getMonthState, occurrencesPerDay, setOccState],
  );

  // Toggle expand/collapse
  const toggleMonthExpanded = useCallback((yearMonth: string) => {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(yearMonth)) {
        next.delete(yearMonth);
      } else {
        next.add(yearMonth);
      }
      return next;
    });
  }, []);

  const toggleWeekExpanded = useCallback((weekStart: string) => {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekStart)) {
        next.delete(weekStart);
      } else {
        next.add(weekStart);
      }
      return next;
    });
  }, []);

  // Stats preview
  const statsPreview = useMemo(() => {
    let completed = 0;
    let skipped = 0;
    Object.values(occurrenceStates).forEach((state) => {
      if (state === "completed") completed++;
      else if (state === "skipped") skipped++;
    });
    const total = completed + skipped;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, skipped, total, rate };
  }, [occurrenceStates]);

  // Save completions
  const handleSave = useCallback(async () => {
    if (!selectedTaskId) {
      showAlert("Error", "Please select a task first");
      return;
    }

    // Group occurrences by date
    const dateMap = new Map<string, { completed: number; skipped: number }>();
    Object.entries(occurrenceStates).forEach(([key, state]) => {
      const [date] = key.split(":");
      if (!dateMap.has(date)) {
        dateMap.set(date, { completed: 0, skipped: 0 });
      }
      const data = dateMap.get(date)!;
      if (state === "completed") data.completed++;
      else if (state === "skipped") data.skipped++;
    });

    const entries: BulkCompletionEntry[] = [];
    dateMap.forEach((counts, date) => {
      if (counts.completed > 0) {
        entries.push({
          date,
          status: "completed",
          occurrences: counts.completed,
        });
      }
      if (counts.skipped > 0) {
        entries.push({
          date,
          status: "skipped",
          occurrences: counts.skipped,
        });
      }
    });

    if (entries.length === 0) {
      showAlert("Error", "No dates selected. Toggle states to mark them.");
      return;
    }

    setSaving(true);
    try {
      const result = await api.createBulkCompletions(selectedTaskId, {
        entries,
        update_start_date: startDate || undefined,
      });

      showAlert(
        "Success",
        `Created ${result.created_count} completion records.${
          result.start_date_updated ? " Start date updated." : ""
        }`,
      );

      setOccurrenceStates({});
      onDataChanged?.();
    } catch (err) {
      showAlert(
        "Error",
        `Failed to save: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setSaving(false);
    }
  }, [selectedTaskId, occurrenceStates, startDate, onDataChanged]);

  // Clear mock data
  const handleClear = useCallback(async () => {
    if (!selectedTaskId) {
      showAlert("Error", "Please select a task first");
      return;
    }

    const confirmed = await showConfirm(
      "Clear Mock Data",
      "This will delete all simulated completions for this task. Real completions will be preserved.",
    );

    if (!confirmed) return;

    setClearing(true);
    try {
      const result = await api.deleteMockCompletions(selectedTaskId);
      showAlert("Success", `Deleted ${result.deleted_count} mock completions.`);
      setOccurrenceStates({});
      onDataChanged?.();
    } catch (err) {
      showAlert(
        "Error",
        `Failed to clear: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setClearing(false);
    }
  }, [selectedTaskId, onDataChanged]);

  // Auto-expand current month
  useEffect(() => {
    if (hierarchyData.months.length > 0) {
      const currentMonth = today.substring(0, 7);
      setExpandedMonths(new Set([currentMonth]));

      // Also expand current week
      const todayD = new Date(today + "T00:00:00");
      const currentWeek = getWeekKey(todayD);
      setExpandedWeeks(new Set([currentWeek]));
    }
  }, [hierarchyData.months.length, today]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>📊 Rhythm Simulator</Text>
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
            {/* Task Selector */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Select Rhythm</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedTaskId}
                  onValueChange={(value: string) => {
                    setSelectedTaskId(value);
                    setOccurrenceStates({});
                    setStartDate(null);
                  }}
                  style={styles.picker}
                >
                  <Picker.Item label="Choose a recurring task..." value="" />
                  {recurringTasks.map((task) => (
                    <Picker.Item
                      key={task.id}
                      label={`${task.recurrence_behavior === "habitual" ? "🔁" : "🛡️"} ${task.title}`}
                      value={task.id}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {!!selectedTaskId && selectedTask && (
              <>
                {/* Start Date Picker */}
                <View style={styles.section}>
                  <DatePicker
                    value={startDate || selectedTask.scheduled_date}
                    onChange={(date) => {
                      setStartDate(date);
                      // Clear states before new start date
                      if (date) {
                        setOccurrenceStates((prev) => {
                          const newState: OccurrenceStates = {};
                          Object.entries(prev).forEach(([key, state]) => {
                            const [keyDate] = key.split(":");
                            if (keyDate >= date) {
                              newState[key] = state;
                            }
                          });
                          return newState;
                        });
                      }
                    }}
                    label="Rhythm Start Date"
                    placeholder="Select start date..."
                    maxDate={today}
                  />
                  <Text style={styles.hint}>
                    Set when this rhythm began (updates scheduled_date)
                  </Text>
                </View>

                {/* Legend */}
                <View style={styles.legend}>
                  <Text style={styles.legendTitle}>
                    State Legend (tap to cycle):
                  </Text>
                  <View style={styles.legendRow}>
                    <View style={styles.legendItem}>
                      <View
                        style={[
                          styles.legendBox,
                          { backgroundColor: STATE_COLORS.none },
                        ]}
                      />
                      <Text style={styles.legendText}>None</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View
                        style={[
                          styles.legendBox,
                          { backgroundColor: STATE_COLORS.completed },
                        ]}
                      >
                        <Ionicons name="checkmark" size={12} color="#fff" />
                      </View>
                      <Text style={styles.legendText}>Completed</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View
                        style={[
                          styles.legendBox,
                          { backgroundColor: STATE_COLORS.skipped },
                        ]}
                      >
                        <Ionicons name="remove" size={12} color="#fff" />
                      </View>
                      <Text style={styles.legendText}>Skipped</Text>
                    </View>
                  </View>
                </View>

                {/* Info about occurrences */}
                {occurrencesPerDay > 1 && (
                  <View style={styles.occurrenceInfo}>
                    <Text style={styles.occurrenceInfoText}>
                      📌 {occurrencesPerDay} occurrences per day
                    </Text>
                  </View>
                )}

                {/* Hierarchical View */}
                <View style={styles.hierarchySection}>
                  {hierarchyData.months.map((month) => (
                    <View key={month.yearMonth} style={styles.monthBlock}>
                      {/* Month Header */}
                      <TouchableOpacity
                        style={styles.monthHeader}
                        onPress={() => toggleMonthExpanded(month.yearMonth)}
                      >
                        <StateToggleBox
                          state={getMonthState(month.weeks)}
                          onToggle={() => toggleMonth(month.weeks)}
                          size="large"
                        />
                        <Ionicons
                          name={
                            expandedMonths.has(month.yearMonth)
                              ? "chevron-down"
                              : "chevron-forward"
                          }
                          size={20}
                          color="#6366f1"
                          style={styles.expandIcon}
                        />
                        <Text style={styles.monthLabel}>
                          {getMonthLabel(month.yearMonth)}
                        </Text>
                      </TouchableOpacity>

                      {expandedMonths.has(month.yearMonth) && (
                        <View style={styles.weeksContainer}>
                          {month.weeks.map((week) => (
                            <View key={week.weekStart} style={styles.weekBlock}>
                              {/* Week Header */}
                              <TouchableOpacity
                                style={styles.weekHeader}
                                onPress={() =>
                                  toggleWeekExpanded(week.weekStart)
                                }
                              >
                                <StateToggleBox
                                  state={getWeekState(week.days)}
                                  onToggle={() => toggleWeek(week.days)}
                                  size="medium"
                                />
                                <Ionicons
                                  name={
                                    expandedWeeks.has(week.weekStart)
                                      ? "chevron-down"
                                      : "chevron-forward"
                                  }
                                  size={16}
                                  color="#9CA3AF"
                                  style={styles.expandIcon}
                                />
                                <Text style={styles.weekLabel}>
                                  {getWeekLabel(week.weekStart)}
                                </Text>
                              </TouchableOpacity>

                              {expandedWeeks.has(week.weekStart) && (
                                <View style={styles.daysContainer}>
                                  {week.days.map((day) => (
                                    <View key={day.date} style={styles.dayRow}>
                                      {/* Day toggle */}
                                      <StateToggleBox
                                        state={getDayState(day.date)}
                                        onToggle={() => toggleDay(day.date)}
                                        size="medium"
                                      />
                                      <Text style={styles.dayLabel}>
                                        {DAY_LABELS[day.dayOfWeek]}{" "}
                                        {day.date.split("-")[2]}
                                      </Text>
                                      {/* Individual occurrence checkboxes */}
                                      <View style={styles.occurrencesRow}>
                                        {Array.from(
                                          { length: occurrencesPerDay },
                                          (_, i) => (
                                            <StateToggleBox
                                              key={i}
                                              state={getOccState(day.date, i)}
                                              onToggle={() =>
                                                toggleOccurrence(day.date, i)
                                              }
                                              size="small"
                                              testID={`occ-${day.date}-${i}`}
                                            />
                                          ),
                                        )}
                                      </View>
                                    </View>
                                  ))}
                                </View>
                              )}
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
                </View>

                {/* Stats Preview */}
                <View style={styles.statsSection}>
                  <Text style={styles.sectionLabel}>Preview</Text>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Text
                        style={[
                          styles.statValue,
                          { color: STATE_COLORS.completed },
                        ]}
                      >
                        {statsPreview.completed}
                      </Text>
                      <Text style={styles.statLabel}>Completed</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text
                        style={[
                          styles.statValue,
                          { color: STATE_COLORS.skipped },
                        ]}
                      >
                        {statsPreview.skipped}
                      </Text>
                      <Text style={styles.statLabel}>Skipped</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{statsPreview.rate}%</Text>
                      <Text style={styles.statLabel}>Rate</Text>
                    </View>
                  </View>
                  <Text style={styles.alignmentNote}>
                    💡 Alignment interpretation coming in Phase 5
                  </Text>
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.saveButton, saving && styles.disabledButton]}
                    onPress={handleSave}
                    disabled={saving || clearing}
                  >
                    {saving ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.saveButtonText}>Save History</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.clearMockButton,
                      clearing && styles.disabledButton,
                    ]}
                    onPress={handleClear}
                    disabled={saving || clearing}
                  >
                    {clearing ? (
                      <ActivityIndicator color="#ef4444" size="small" />
                    ) : (
                      <Text style={styles.clearMockButtonText}>
                        Clear Mock Data
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}

            {!selectedTaskId &&
              recurringTasks.length === 0 &&
              !loadingTasks && (
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={48} color="#ccc" />
                  <Text style={styles.emptyText}>No recurring tasks found</Text>
                  <Text style={styles.emptyHint}>
                    Create a recurring task first to use the simulator
                  </Text>
                </View>
              )}

            {loadingTasks && (
              <View style={styles.emptyState}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={styles.emptyText}>Loading tasks...</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 20,
    color: "#6B7280",
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  hint: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
  legend: {
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  legendText: {
    fontSize: 12,
    color: "#4B5563",
  },
  occurrenceInfo: {
    padding: 12,
    backgroundColor: "#EEF2FF",
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  occurrenceInfoText: {
    fontSize: 13,
    color: "#4F46E5",
    fontWeight: "500",
  },
  hierarchySection: {
    padding: 16,
  },
  monthBlock: {
    marginBottom: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    overflow: "hidden",
  },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#E5E7EB",
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
  },
  expandIcon: {
    marginHorizontal: 8,
  },
  weeksContainer: {
    padding: 8,
  },
  weekBlock: {
    marginBottom: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
  },
  weekHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#F3F4F6",
  },
  weekLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    flex: 1,
  },
  daysContainer: {
    padding: 8,
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dayLabel: {
    fontSize: 13,
    color: "#4B5563",
    width: 60,
    marginLeft: 8,
  },
  occurrencesRow: {
    flexDirection: "row",
    gap: 6,
    marginLeft: "auto",
  },
  toggleBox: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  toggleBoxDisabled: {
    opacity: 0.5,
  },
  statsSection: {
    padding: 16,
    backgroundColor: "#F9FAFB",
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 8,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  alignmentNote: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 12,
  },
  actions: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#22C55E",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  clearMockButton: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  clearMockButtonText: {
    color: "#ef4444",
    fontWeight: "600",
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 12,
  },
  emptyHint: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 4,
    textAlign: "center",
  },
});

export default RhythmSimulatorModal;
