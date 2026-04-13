import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import type { Task, DependencyStrength, DependencyScope } from "../../types";
import { TaskSearchModal } from "./TaskSearchModal";
import { prerequisiteSelectorStyles as styles } from "./prerequisiteSelectorStyles";
import {
  parseWindowPartText,
  partsToInputStrings,
  partsToTotalMinutes,
  totalMinutesToParts,
} from "./validityWindowParts";
import {
  implicitRequiredCountAllOccurrencesRecurring,
  maxRequiredCompletionsForNextOccurrence,
  maxRequiredCompletionsForWithinWindow,
} from "./prerequisiteDependencyLimits";

// User-facing labels
const STRENGTH_LABELS: Record<DependencyStrength, string> = {
  hard: "Required",
  soft: "Recommended",
};

const SCOPE_LABELS: Record<DependencyScope, string> = {
  all_occurrences: "Always required first",
  next_occurrence: "One-for-one",
  within_window: "Within time window",
};

/** One-line hint: which completions count (not the numeric threshold). */
const SCOPE_HELP_SELECTED: Record<DependencyScope, string> = {
  all_occurrences:
    "Every prerequisite occurrence in this period must finish before any dependent occurrence in the same period.",
  next_occurrence:
    "Each dependent occurrence looks at prerequisite completions tied to this occurrence (including order vs its scheduled time).",
  within_window:
    "Counts prerequisite completions in a rolling clock window ending at this occurrence’s scheduled time.",
};

/** Which scopes are meaningful for this upstream/downstream recurrence pair. */
export function getAllowedScopes(
  upstreamIsRecurring: boolean,
  downstreamIsRecurring: boolean,
): DependencyScope[] {
  if (!upstreamIsRecurring && !downstreamIsRecurring) {
    return ["all_occurrences"];
  }
  if (upstreamIsRecurring && downstreamIsRecurring) {
    return ["all_occurrences", "next_occurrence", "within_window"];
  }
  return ["next_occurrence", "within_window"];
}

/** Multiple completions only apply when the prerequisite task can occur more than once. */
export function showRequiredCompletionCountEditor(upstreamIsRecurring: boolean): boolean {
  return upstreamIsRecurring;
}

// A prerequisite that's been added (not yet saved to server)
export interface SelectedPrerequisite {
  task: Task;
  strength: DependencyStrength;
  scope: DependencyScope;
  requiredCount: number;
  validityWindowMinutes: number | null;
}

interface PrerequisiteSelectorProps {
  prerequisites: SelectedPrerequisite[];
  onPrerequisitesChange: (prerequisites: SelectedPrerequisite[]) => void;
  currentTaskId?: string;
  currentTaskIsRecurring?: boolean;
}

function clampRequiredCountForPrerequisite(p: SelectedPrerequisite): number {
  if (!p.task.is_recurring) {
    return 1;
  }
  if (p.scope === "all_occurrences") {
    return implicitRequiredCountAllOccurrencesRecurring(p.task);
  }
  if (p.scope === "within_window") {
    const cap = maxRequiredCompletionsForWithinWindow(
      p.task,
      p.validityWindowMinutes,
    );
    return Math.max(1, Math.min(p.requiredCount, cap));
  }
  const cap = maxRequiredCompletionsForNextOccurrence(p.task);
  return Math.max(1, Math.min(p.requiredCount, cap));
}

// Infer default scope based on task recurrence
function inferScope(
  upstreamTask: Task,
  downstreamIsRecurring: boolean,
): DependencyScope {
  if (!upstreamTask.is_recurring && !downstreamIsRecurring) {
    // Both one-time
    return "all_occurrences";
  }
  if (upstreamTask.is_recurring && downstreamIsRecurring) {
    // Both recurring - default to one-for-one
    return "next_occurrence";
  }
  // Mixed - default to within window
  return "within_window";
}

export function PrerequisiteSelector({
  prerequisites,
  onPrerequisitesChange,
  currentTaskId,
  currentTaskIsRecurring = false,
}: PrerequisiteSelectorProps): React.ReactElement {
  const [showSearch, setShowSearch] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  /** Avoid repeat onPrerequisitesChange when parent is uncontrolled (e.g. tests) and props stay invalid. */
  const normalizeDepsSentFor = useRef<string | null>(null);

  useEffect(() => {
    const snapshot =
      prerequisites
        .map(
          (p) =>
            `${p.task.id}:${p.scope}:${p.validityWindowMinutes ?? ""}:${p.requiredCount}`,
        )
        .join("|") + `|d=${currentTaskIsRecurring}`;

    const needsScopeFix = prerequisites.some((p) => {
      const allowed = getAllowedScopes(
        !!p.task.is_recurring,
        currentTaskIsRecurring,
      );
      return !allowed.includes(p.scope);
    });
    const needsCountFix = prerequisites.some(
      (p) => !p.task.is_recurring && p.requiredCount !== 1,
    );
    const needsRecurringCountClamp = prerequisites.some(
      (p) =>
        p.task.is_recurring &&
        clampRequiredCountForPrerequisite(p) !== p.requiredCount,
    );

    if (!needsScopeFix && !needsCountFix && !needsRecurringCountClamp) {
      normalizeDepsSentFor.current = null;
      return;
    }
    if (normalizeDepsSentFor.current === snapshot) {
      return;
    }

    let updated = prerequisites.map((p) => {
      const allowed = getAllowedScopes(
        !!p.task.is_recurring,
        currentTaskIsRecurring,
      );
      if (allowed.includes(p.scope)) {
        return p;
      }
      const ns = inferScope(p.task, currentTaskIsRecurring);
      return {
        ...p,
        scope: ns,
        validityWindowMinutes:
          ns === "within_window" ? p.validityWindowMinutes : null,
      };
    });
    updated = updated.map((p) => {
      if (!p.task.is_recurring && p.requiredCount !== 1) {
        return { ...p, requiredCount: 1 };
      }
      return p;
    });
    updated = updated.map((p) => {
      if (!p.task.is_recurring) {
        return p;
      }
      const nextCount = clampRequiredCountForPrerequisite(p);
      if (nextCount !== p.requiredCount) {
        return { ...p, requiredCount: nextCount };
      }
      return p;
    });
    const changed = updated.some(
      (p, i) =>
        p.scope !== prerequisites[i].scope ||
        p.validityWindowMinutes !== prerequisites[i].validityWindowMinutes ||
        p.requiredCount !== prerequisites[i].requiredCount,
    );
    if (changed) {
      normalizeDepsSentFor.current = snapshot;
      onPrerequisitesChange(updated);
    }
  }, [currentTaskIsRecurring, prerequisites, onPrerequisitesChange]);

  const handleAddTask = (task: Task) => {
    const newPrereq: SelectedPrerequisite = {
      task,
      strength: "hard", // Default to "Required"
      scope: inferScope(task, currentTaskIsRecurring),
      requiredCount: 1,
      validityWindowMinutes: null,
    };
    const updated = [...prerequisites, newPrereq];
    onPrerequisitesChange(updated);
  };

  const handleRemove = (index: number) => {
    const updated = [...prerequisites];
    updated.splice(index, 1);
    onPrerequisitesChange(updated);
    if (expandedIndex === index) {
      setExpandedIndex(null);
    }
  };

  const handleStrengthToggle = (index: number) => {
    const updated = [...prerequisites];
    updated[index] = {
      ...updated[index],
      strength: updated[index].strength === "hard" ? "soft" : "hard",
    };
    onPrerequisitesChange(updated);
  };

  const handleScopeChange = (index: number, scope: DependencyScope) => {
    const updated = [...prerequisites];
    const prev = updated[index];
    const nextRow: SelectedPrerequisite = {
      ...prev,
      scope,
      validityWindowMinutes:
        scope === "within_window" ? prev.validityWindowMinutes : null,
    };
    nextRow.requiredCount = clampRequiredCountForPrerequisite(nextRow);
    updated[index] = nextRow;
    onPrerequisitesChange(updated);
  };

  const handleCountChange = (index: number, count: string) => {
    const updated = [...prerequisites];
    const parsed = parseInt(count, 10);
    const raw = isNaN(parsed) || parsed < 1 ? 1 : parsed;
    const row = { ...updated[index], requiredCount: raw };
    updated[index] = {
      ...row,
      requiredCount: clampRequiredCountForPrerequisite(row),
    };
    onPrerequisitesChange(updated);
  };

  const handleWindowPartChange = (
    index: number,
    field: "days" | "hours" | "minutes",
    text: string,
  ) => {
    const updated = [...prerequisites];
    const prereq = updated[index];
    const p = totalMinutesToParts(prereq.validityWindowMinutes);
    const parsed = parseWindowPartText(text);
    const next = {
      days: field === "days" ? parsed : p.days,
      hours: field === "hours" ? parsed : p.hours,
      minutes: field === "minutes" ? parsed : p.minutes,
    };
    const nextPrereq: SelectedPrerequisite = {
      ...prereq,
      validityWindowMinutes: partsToTotalMinutes(next),
    };
    nextPrereq.requiredCount = clampRequiredCountForPrerequisite(nextPrereq);
    updated[index] = nextPrereq;
    onPrerequisitesChange(updated);
  };

  const toggleExpanded = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const excludeTaskIds = prerequisites.map((p) => p.task.id);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Prerequisites</Text>
      <Text style={styles.helpText}>
        Tasks that must be completed before this one
      </Text>

      {prerequisites.map((prereq, index) => {
        const windowInputs = partsToInputStrings(prereq.validityWindowMinutes);
        return (
        <View key={prereq.task.id} style={styles.prereqItem}>
          {/* Main row */}
          <View style={styles.prereqMain}>
            <View style={styles.prereqInfo}>
              <Text style={styles.prereqTitle} numberOfLines={1}>
                {prereq.task.title}
              </Text>
              {prereq.task.is_recurring && (
                <Text style={styles.prereqRecurring}>🔄</Text>
              )}
            </View>

            {/* Strength toggle */}
            <TouchableOpacity
              style={[
                styles.strengthToggle,
                prereq.strength === "hard"
                  ? styles.strengthHard
                  : styles.strengthSoft,
              ]}
              onPress={() => handleStrengthToggle(index)}
              accessibilityRole="button"
              accessibilityLabel={`Toggle strength, currently ${STRENGTH_LABELS[prereq.strength]}. Tap to switch.`}
            >
              <Text style={styles.strengthText}>
                {STRENGTH_LABELS[prereq.strength]}
              </Text>
              <Text style={styles.strengthToggleIcon}>⇄</Text>
            </TouchableOpacity>

            {/* Remove button */}
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemove(index)}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${prereq.task.title}`}
            >
              <Text style={styles.removeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* More options toggle */}
          <TouchableOpacity
            style={styles.moreOptionsToggle}
            onPress={() => toggleExpanded(index)}
            accessibilityRole="button"
            accessibilityLabel={
              expandedIndex === index ? "Hide options" : "Show more options"
            }
          >
            <Text style={styles.moreOptionsText}>
              {expandedIndex === index ? "▲ Less options" : "▼ More options"}
            </Text>
          </TouchableOpacity>

          {/* Expanded options */}
          {expandedIndex === index && (
            <View style={styles.advancedOptions}>
              {(() => {
                const allowedScopes = getAllowedScopes(
                  !!prereq.task.is_recurring,
                  currentTaskIsRecurring,
                );
                const isSingleInstancePair =
                  allowedScopes.length === 1 &&
                  allowedScopes[0] === "all_occurrences";

                if (isSingleInstancePair) {
                  return (
                    <>
                      <Text style={styles.optionLabel}>Order</Text>
                      <Text
                        testID="single-instance-scope-help"
                        style={styles.helpText}
                      >
                        Both this task and the prerequisite run once. Complete
                        the prerequisite before this task. Occurrence timing
                        options apply when both tasks repeat.
                      </Text>
                    </>
                  );
                }

                return (
                  <>
                    <Text style={styles.optionLabel}>
                      How occurrences relate
                    </Text>
                    <View style={styles.scopeOptions}>
                      {allowedScopes.map((scope) => (
                        <TouchableOpacity
                          key={scope}
                          style={[
                            styles.scopeOption,
                            prereq.scope === scope &&
                              styles.scopeOptionSelected,
                          ]}
                          onPress={() => handleScopeChange(index, scope)}
                          accessibilityRole="radio"
                          accessibilityLabel={SCOPE_LABELS[scope]}
                        >
                          <Text
                            style={[
                              styles.scopeOptionText,
                              prereq.scope === scope &&
                                styles.scopeOptionTextSelected,
                            ]}
                          >
                            {SCOPE_LABELS[scope]}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <Text style={styles.helpText}>
                      {SCOPE_HELP_SELECTED[prereq.scope]}
                    </Text>
                  </>
                );
              })()}

              {/* Count: recurring upstream, except all_occurrences (implicit full period) */}
              {showRequiredCompletionCountEditor(!!prereq.task.is_recurring) &&
              prereq.scope !== "all_occurrences" ? (
                <>
                  <Text style={styles.optionLabel}>Required completions</Text>
                  <Text style={styles.helpText}>
                    {prereq.scope === "within_window"
                      ? `How many prerequisite completions in the time window count toward this rule (e.g. glasses of water). Maximum for this window and schedule: ${maxRequiredCompletionsForWithinWindow(prereq.task, prereq.validityWindowMinutes)}.`
                      : `How many prerequisite completions count toward this dependent occurrence. Maximum for this prerequisite’s schedule: ${maxRequiredCompletionsForNextOccurrence(prereq.task)}.`}
                  </Text>
                  <TextInput
                    style={styles.countInput}
                    value={String(prereq.requiredCount)}
                    onChangeText={(text) => handleCountChange(index, text)}
                    keyboardType="numeric"
                    accessibilityLabel="Required completion count"
                  />
                </>
              ) : prereq.task.is_recurring && prereq.scope === "all_occurrences" ? (
                <>
                  <Text style={styles.optionLabel}>Requirement</Text>
                  <Text style={styles.helpText}>
                    All scheduled prerequisite occurrences in the same period must
                    be completed before any dependent occurrence in that period.
                    The number of prerequisite completions (
                    {implicitRequiredCountAllOccurrencesRecurring(prereq.task)}) is
                    set automatically from this task’s repeat pattern.
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.optionLabel}>Required completions</Text>
                  <Text
                    testID="upstream-one-time-count-help"
                    style={styles.helpText}
                  >
                    This prerequisite runs once—it has a single completion, so
                    the count is always 1.
                  </Text>
                </>
              )}

              {/* Window (only for within_window scope) */}
              {prereq.scope === "within_window" && (
                <>
                  <Text style={styles.optionLabel}>Time window</Text>
                  <Text style={styles.helpText}>
                    Leave all fields empty to use auto (based on upstream
                    recurrence). Otherwise enter days, hours, and/or minutes.
                  </Text>
                  <View style={styles.windowRow}>
                    <View style={styles.windowField}>
                      <Text style={styles.windowFieldLabel}>Days</Text>
                      <TextInput
                        style={styles.countInput}
                        value={windowInputs.days}
                        onChangeText={(text) =>
                          handleWindowPartChange(index, "days", text)
                        }
                        placeholder="—"
                        placeholderTextColor="#6B7280"
                        keyboardType="numeric"
                        accessibilityLabel="Validity window days"
                      />
                    </View>
                    <View style={styles.windowField}>
                      <Text style={styles.windowFieldLabel}>Hours</Text>
                      <TextInput
                        style={styles.countInput}
                        value={windowInputs.hours}
                        onChangeText={(text) =>
                          handleWindowPartChange(index, "hours", text)
                        }
                        placeholder="—"
                        placeholderTextColor="#6B7280"
                        keyboardType="numeric"
                        accessibilityLabel="Validity window hours"
                      />
                    </View>
                    <View style={styles.windowField}>
                      <Text style={styles.windowFieldLabel}>Minutes</Text>
                      <TextInput
                        style={styles.countInput}
                        value={windowInputs.minutes}
                        onChangeText={(text) =>
                          handleWindowPartChange(index, "minutes", text)
                        }
                        placeholder="—"
                        placeholderTextColor="#6B7280"
                        keyboardType="numeric"
                        accessibilityLabel="Validity window minutes"
                      />
                    </View>
                  </View>
                </>
              )}
            </View>
          )}
        </View>
        );
      })}

      {/* Add button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowSearch(true)}
        accessibilityRole="button"
        accessibilityLabel="Add prerequisite"
      >
        <Text style={styles.addButtonText}>+ Add Prerequisite</Text>
      </TouchableOpacity>

      <TaskSearchModal
        visible={showSearch}
        onClose={() => setShowSearch(false)}
        onSelect={handleAddTask}
        excludeTaskIds={excludeTaskIds}
        currentTaskId={currentTaskId}
      />
    </View>
  );
}
