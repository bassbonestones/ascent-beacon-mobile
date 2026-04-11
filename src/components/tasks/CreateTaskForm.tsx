import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { combineTopInset } from "../../utils/combineTopInset";
import type { Goal, SchedulingMode, RecurrenceBehavior } from "../../types";
import { styles } from "../../screens/styles/tasksScreenStyles";
import { RecurrencePicker } from "./RecurrencePicker";
import { TimePicker } from "./TimePicker";
import { DatePicker } from "./DatePicker";
import { getFrequencyDescription, parseRRule } from "./rruleUtils";
import {
  PrerequisiteSelector,
  type SelectedPrerequisite,
} from "./PrerequisiteSelector";

interface CreateTaskFormProps {
  goals: Goal[];
  goalsLoading: boolean;
  selectedGoalId: string;
  onGoalSelect: (goalId: string) => void;
  title: string;
  onTitleChange: (title: string) => void;
  description: string;
  onDescriptionChange: (description: string) => void;
  isLightning: boolean;
  onLightningToggle: () => void;
  duration: string;
  onDurationChange: (duration: string) => void;
  isRecurring: boolean;
  onRecurringToggle: () => void;
  recurrenceRule: string;
  schedulingMode: SchedulingMode | null;
  recurrenceBehavior: RecurrenceBehavior | null;
  onRecurrenceChange: (
    rrule: string,
    mode: SchedulingMode,
    startDate: string | null,
    startTime: string | null,
    behavior: RecurrenceBehavior,
  ) => void;
  scheduledTime: string | null;
  onScheduledTimeChange: (time: string | null) => void;
  scheduledDate: string | null;
  onScheduledDateChange: (date: string | null) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isEditMode?: boolean;
  // Phase 4e: Anytime task support
  isAnytime?: boolean;
  onAnytimeToggle?: () => void;
  // Phase 4i: Prerequisites
  prerequisites?: SelectedPrerequisite[];
  onPrerequisitesChange?: (prerequisites: SelectedPrerequisite[]) => void;
  currentTaskId?: string;
}

const getRecurrenceDescription = (
  rrule: string,
  startDate?: string | null,
): string => {
  if (!rrule) return "Set schedule...";
  return getFrequencyDescription(parseRRule(rrule), startDate);
};

export function CreateTaskForm({
  goals,
  goalsLoading,
  selectedGoalId,
  onGoalSelect,
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  isLightning,
  onLightningToggle,
  duration,
  onDurationChange,
  isRecurring,
  onRecurringToggle,
  recurrenceRule,
  schedulingMode,
  recurrenceBehavior,
  onRecurrenceChange,
  scheduledTime,
  onScheduledTimeChange,
  scheduledDate,
  onScheduledDateChange,
  onSubmit,
  onCancel,
  isEditMode = false,
  isAnytime = false,
  onAnytimeToggle,
  prerequisites = [],
  onPrerequisitesChange,
  currentTaskId,
}: CreateTaskFormProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const topPad = combineTopInset(insets.top);
  const [showRecurrencePicker, setShowRecurrencePicker] = useState(false);
  const canSubmit = title.trim().length > 0;

  // Track whether save was clicked (to distinguish from cancel)
  const savedRef = useRef(false);
  // Track whether this was a fresh toggle (not editing existing rule)
  const wasFreshToggleRef = useRef(false);

  // Auto-open recurrence picker when toggling recurring ON
  const handleRecurringToggle = () => {
    if (!isRecurring) {
      // Turning ON: auto-open the picker
      // Track that this is a fresh toggle (they're turning it on, not editing)
      wasFreshToggleRef.current = true;
      savedRef.current = false;
      onRecurringToggle();
      setShowRecurrencePicker(true);
    } else {
      // Turning OFF: just toggle
      onRecurringToggle();
    }
  };

  // Handle picker save: mark as saved, then call parent handler
  const handleRecurrenceSave = (
    rrule: string,
    mode: SchedulingMode,
    startDate: string | null,
    startTime: string | null,
    behavior: RecurrenceBehavior,
  ) => {
    savedRef.current = true;
    onRecurrenceChange(rrule, mode, startDate, startTime, behavior);
  };

  // Handle picker close: if cancel on fresh toggle, turn off recurring
  const handleRecurrencePickerClose = () => {
    setShowRecurrencePicker(false);
    // Turn off recurring if: cancel was clicked (not save) AND this was a fresh toggle
    if (!savedRef.current && wasFreshToggleRef.current && isRecurring) {
      onRecurringToggle();
    }
    // Reset the fresh toggle flag
    wasFreshToggleRef.current = false;
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onCancel}
          accessibilityLabel="Cancel and go back to list"
          accessibilityRole="button"
        >
          <Text style={styles.backButtonText}>← Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? "Edit Task" : "New Task"}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.formContainer}>
        <Text style={styles.label}>Goal (optional)</Text>
        {goalsLoading ? (
          <ActivityIndicator size="small" />
        ) : (
          <View style={styles.goalSelector}>
            <TouchableOpacity
              style={[
                styles.goalOption,
                !selectedGoalId && styles.goalOptionSelected,
              ]}
              onPress={() => onGoalSelect("")}
              accessibilityLabel="No goal (unaligned task)"
              accessibilityRole="radio"
            >
              <Text
                style={[
                  styles.goalOptionText,
                  !selectedGoalId && styles.goalOptionTextSelected,
                ]}
              >
                ⊘ None (unaligned)
              </Text>
            </TouchableOpacity>
            {goals.map((goal) => (
              <TouchableOpacity
                key={goal.id}
                style={[
                  styles.goalOption,
                  selectedGoalId === goal.id && styles.goalOptionSelected,
                ]}
                onPress={() => onGoalSelect(goal.id)}
                accessibilityLabel={`Select goal: ${goal.title}`}
                accessibilityRole="radio"
              >
                <Text
                  style={[
                    styles.goalOptionText,
                    selectedGoalId === goal.id && styles.goalOptionTextSelected,
                  ]}
                  numberOfLines={1}
                >
                  {goal.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={onTitleChange}
          placeholder="What needs to be done?"
          placeholderTextColor="#9CA3AF"
          accessibilityLabel="Task title"
        />

        <Text style={styles.label}>Description (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={onDescriptionChange}
          placeholder="Add more details..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          accessibilityLabel="Task description"
        />

        <TouchableOpacity
          style={styles.lightningCheckbox}
          onPress={onLightningToggle}
          accessibilityLabel={
            isLightning ? "Disable lightning task" : "Enable lightning task"
          }
          accessibilityRole="checkbox"
        >
          <View
            style={[styles.checkbox, isLightning && styles.checkboxChecked]}
          >
            {isLightning && <Text style={{ color: "#1F2937" }}>⚡</Text>}
          </View>
          <Text style={styles.lightningLabel}>Lightning Task</Text>
        </TouchableOpacity>
        <Text style={styles.lightningHelp}>
          For tasks that take less than a minute
        </Text>

        {!isLightning && (
          <>
            <Text style={styles.label}>Duration (minutes)</Text>
            <TextInput
              style={styles.input}
              value={duration}
              onChangeText={onDurationChange}
              placeholder="30"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              accessibilityLabel="Task duration in minutes"
            />
          </>
        )}

        {/* Recurring Task Toggle */}
        <TouchableOpacity
          style={styles.lightningCheckbox}
          onPress={handleRecurringToggle}
          accessibilityLabel={
            isRecurring ? "Make one-time task" : "Make recurring task"
          }
          accessibilityRole="checkbox"
        >
          <View
            style={[styles.checkbox, isRecurring && styles.checkboxChecked]}
          >
            {isRecurring && <Text style={{ color: "#1F2937" }}>🔄</Text>}
          </View>
          <Text style={styles.lightningLabel}>Recurring Task</Text>
        </TouchableOpacity>
        <Text style={styles.lightningHelp}>
          Repeats on a schedule (daily, weekly, etc.)
        </Text>

        {/* Phase 4e: Anytime Task Toggle - only show for non-recurring */}
        {!isRecurring && onAnytimeToggle && (
          <>
            <TouchableOpacity
              style={styles.lightningCheckbox}
              onPress={onAnytimeToggle}
              accessibilityLabel={
                isAnytime ? "Make scheduled task" : "Make anytime task"
              }
              accessibilityRole="checkbox"
            >
              <View
                style={[styles.checkbox, isAnytime && styles.checkboxChecked]}
              >
                {isAnytime && <Text style={{ color: "#1F2937" }}>📋</Text>}
              </View>
              <Text style={styles.lightningLabel}>Anytime Task</Text>
            </TouchableOpacity>
            <Text style={styles.lightningHelp}>
              No schedule, shows in your backlog
            </Text>
          </>
        )}

        {/* Recurrence Settings */}
        {isRecurring && (
          <TouchableOpacity
            style={styles.recurrenceButton}
            onPress={() => {
              savedRef.current = false;
              setShowRecurrencePicker(true);
            }}
            accessibilityLabel="Configure recurrence"
            accessibilityRole="button"
          >
            <Text style={styles.recurrenceButtonText}>
              {getRecurrenceDescription(recurrenceRule, scheduledDate)}
            </Text>
            <Text style={styles.recurrenceButtonIcon}>→</Text>
          </TouchableOpacity>
        )}

        {isRecurring && schedulingMode && (
          <View style={styles.schedulingModeDisplay}>
            <Text style={styles.schedulingModeText}>
              {schedulingMode === "floating"
                ? "🌍 Time-of-day"
                : "📍 Fixed time"}
            </Text>
          </View>
        )}

        {/* Date & Time - only show for non-recurring, non-anytime tasks */}
        {!isRecurring && !isAnytime && (
          <>
            <DatePicker
              value={scheduledDate}
              onChange={onScheduledDateChange}
              label="Date (optional)"
              placeholder="Today"
            />
            <TimePicker
              value={scheduledTime}
              onChange={onScheduledTimeChange}
              label="Time (optional)"
            />
          </>
        )}

        {/* Phase 4i: Prerequisites */}
        {onPrerequisitesChange && (
          <PrerequisiteSelector
            prerequisites={prerequisites}
            onPrerequisitesChange={onPrerequisitesChange}
            currentTaskId={currentTaskId}
            currentTaskIsRecurring={isRecurring}
          />
        )}

        <TouchableOpacity
          style={[
            styles.submitButton,
            !canSubmit && styles.submitButtonDisabled,
          ]}
          onPress={onSubmit}
          disabled={!canSubmit}
          accessibilityLabel={isEditMode ? "Save changes" : "Create task"}
          accessibilityRole="button"
        >
          <Text style={styles.submitButtonText}>
            {isEditMode ? "Save Changes" : "Create Task"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <RecurrencePicker
        visible={showRecurrencePicker}
        onClose={handleRecurrencePickerClose}
        onSave={handleRecurrenceSave}
        initialRRule={recurrenceRule}
        initialSchedulingMode={schedulingMode}
        initialRecurrenceBehavior={recurrenceBehavior}
        taskDurationMinutes={isLightning ? 0 : parseInt(duration, 10) || 0}
        initialStartDate={scheduledDate}
        initialStartTime={scheduledTime}
      />
    </View>
  );
}
