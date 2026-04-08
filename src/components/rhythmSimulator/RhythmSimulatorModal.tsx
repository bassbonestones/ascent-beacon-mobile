import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";

import { DatePicker } from "../tasks/DatePicker";
import { OccurrenceStates } from "./rhythmSimulatorConstants";
import { HierarchyView } from "./HierarchyView";
import { SimulatorLegend } from "./SimulatorLegend";
import { StatsPreview } from "./StatsPreview";
import { useRhythmSimulator } from "./useRhythmSimulator";
import { styles } from "./rhythmSimulatorStyles";

interface RhythmSimulatorModalProps {
  visible: boolean;
  onClose: () => void;
  onDataChanged?: () => void;
}

export function RhythmSimulatorModal({
  visible,
  onClose,
  onDataChanged,
}: RhythmSimulatorModalProps): React.ReactElement {
  const sim = useRhythmSimulator(visible, onDataChanged);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) sim.resetState();
  }, [visible, sim.resetState]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
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
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Select Rhythm</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={sim.selectedTaskId}
                  onValueChange={(value: string) => {
                    sim.setSelectedTaskId(value);
                    sim.setOccurrenceStates({});
                    sim.setStartDate(null);
                  }}
                  style={styles.picker}
                >
                  <Picker.Item label="Choose a recurring task..." value="" />
                  {sim.recurringTasks.map((task) => (
                    <Picker.Item
                      key={task.id}
                      label={`${task.recurrence_behavior === "habitual" ? "🔁" : "🛡️"} ${task.title}`}
                      value={task.id}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {!!sim.selectedTaskId && sim.selectedTask && (
              <>
                <View style={styles.section}>
                  <DatePicker
                    value={sim.startDate || sim.selectedTask.scheduled_date}
                    onChange={(date) => {
                      sim.setStartDate(date);
                      if (date) {
                        sim.setOccurrenceStates((prev: OccurrenceStates) => {
                          const newState: OccurrenceStates = {};
                          Object.entries(prev).forEach(([key, state]) => {
                            const [keyDate] = key.split(":");
                            if (keyDate >= date) newState[key] = state;
                          });
                          return newState;
                        });
                      }
                    }}
                    label="Rhythm Start Date"
                    placeholder="Select start date..."
                    maxDate={sim.today}
                  />
                  <Text style={styles.hint}>
                    Set when this rhythm began (updates scheduled_date)
                  </Text>
                </View>

                <SimulatorLegend />

                {sim.occurrencesPerDay > 1 && (
                  <View style={styles.occurrenceInfo}>
                    <Text style={styles.occurrenceInfoText}>
                      📌 {sim.occurrencesPerDay} occurrences per day
                    </Text>
                  </View>
                )}

                {sim.loadingCompletions ? (
                  <View style={styles.loadingCompletions}>
                    <ActivityIndicator size="small" color="#6366f1" />
                    <Text style={styles.loadingCompletionsText}>
                      Loading existing history...
                    </Text>
                  </View>
                ) : (
                  <HierarchyView
                    months={sim.hierarchyData.months}
                    expandedMonths={sim.expandedMonths}
                    expandedWeeks={sim.expandedWeeks}
                    occurrencesPerDay={sim.occurrencesPerDay}
                    getMonthState={sim.getMonthState}
                    getWeekState={sim.getWeekState}
                    getDayState={sim.getDayState}
                    getOccState={sim.getOccState}
                    toggleMonth={sim.toggleMonth}
                    toggleWeek={sim.toggleWeek}
                    toggleDay={sim.toggleDay}
                    toggleOccurrence={sim.toggleOccurrence}
                    toggleMonthExpanded={sim.toggleMonthExpanded}
                    toggleWeekExpanded={sim.toggleWeekExpanded}
                  />
                )}

                <StatsPreview
                  completed={sim.statsPreview.completed}
                  skipped={sim.statsPreview.skipped}
                  total={sim.statsPreview.total}
                  rate={sim.statsPreview.rate}
                />

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.saveButton, sim.saving && styles.disabledButton]}
                    onPress={sim.handleSave}
                    disabled={sim.saving || sim.clearing}
                  >
                    {sim.saving ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.saveButtonText}>Save History</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.clearMockButton,
                      sim.clearing && styles.disabledButton,
                    ]}
                    onPress={sim.handleClear}
                    disabled={sim.saving || sim.clearing}
                  >
                    {sim.clearing ? (
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

            {!sim.selectedTaskId &&
              sim.recurringTasks.length === 0 &&
              !sim.loadingTasks && (
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={48} color="#ccc" />
                  <Text style={styles.emptyText}>No recurring tasks found</Text>
                  <Text style={styles.emptyHint}>
                    Create a recurring task first to use the simulator
                  </Text>
                </View>
              )}

            {sim.loadingTasks && (
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

export default RhythmSimulatorModal;
